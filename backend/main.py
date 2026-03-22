import uuid
import asyncio
import time
from typing import AsyncGenerator

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse, ServerSentEvent
import json

from db import queries
from frontier_bank.bank import Bank
from frontier_bank.difficulty import DifficultyEngine
from frontier_bank.scorer import score_interaction, compute_scorecard, InteractionScore
from agent.runner import run_interaction

# In-memory engine state (keyed by session_id) — survives across run-next calls
_engines: dict[str, DifficultyEngine] = {}

# In-memory conversation history (keyed by session_id) — accumulates across run-next calls
_histories: dict[str, list] = {}

# Total rounds per session (keyed by session_id)
_totals: dict[str, int] = {}

TOTAL = 20  # default fallback

app = FastAPI(title="Frontier Bank Evaluation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response Models ────────────────────────────────────────────────

class CreateSessionRequest(BaseModel):
    prompt: str
    seed: int = 42
    team_name: str | None = None
    total_rounds: int = 20


class CreateSessionResponse(BaseModel):
    session_id: str
    seed: int


class RunNextRequest(BaseModel):
    prompt: str


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.post("/sessions", response_model=CreateSessionResponse)
def create_session(body: CreateSessionRequest):
    session_id = str(uuid.uuid4())
    queries.create_session(session_id, body.prompt, body.seed, body.team_name)
    _totals[session_id] = max(1, body.total_rounds)
    return CreateSessionResponse(session_id=session_id, seed=body.seed)


@app.post("/sessions/{session_id}/run-next")
async def run_next(session_id: str, body: RunNextRequest):
    """
    Run a single customer interaction with the given prompt.
    Returns customer info + agent result + scores in one response.
    Maintains DifficultyEngine state in memory between calls.
    """
    session = queries.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["STATUS"] == "complete":
        raise HTTPException(status_code=409, detail="Session already complete")

    # Get or create the engine for this session
    if session_id not in _engines:
        _engines[session_id] = DifficultyEngine(seed=session["SEED"])
    engine = _engines[session_id]

    total = _totals.get(session_id, TOTAL)
    existing = queries.get_interactions(session_id)
    n = len(existing) + 1
    if n > total:
        raise HTTPException(status_code=409, detail="All interactions complete")

    if session["STATUS"] in ("pending", "failed"):
        queries.update_session_status(session_id, "running")

    customer = engine.next_customer(n)

    bank = Bank(session_id)
    if n == 1:
        bank.initialize(session["SEED"])

    history = _histories.get(session_id, [])
    result, reasoning, updated_history, intermediate = await asyncio.to_thread(
        run_interaction, body.prompt, customer, n, bank, history
    )
    _histories[session_id] = updated_history

    score = await asyncio.to_thread(
        score_interaction, customer, result, n, result.message, reasoning, body.prompt, intermediate
    )

    engine.record_result(score, customer, result.message)

    queries.log_interaction(
        session_id, n, customer.tier,
        {
            "name": customer.name,
            "type": "adversarial" if customer.is_adversarial else "legitimate",
            "dialogue": customer.dialogue,
            "documents": customer.documents,
        },
        result.action, result.params, result.message, reasoning,
    )
    queries.log_score(session_id, n, {
        "task_completion": score.task_completion,
        "social_eng_resistance": score.social_eng_resistance,
        "auth_boundary": score.auth_boundary,
        "info_leakage": score.info_leakage,
        "appropriate_escalation": score.appropriate_escalation,
        "instruction_adherence": score.instruction_adherence,
        "valid_request_approved": score.valid_request_approved,
    }, score.explanation)

    done = n >= total
    scorecard = None
    if done:
        all_scores_raw = queries.get_scores(session_id)
        all_score_objs = [
            InteractionScore(
                interaction_num=s["INTERACTION_NUM"],
                task_completion=s["TASK_COMPLETION"],
                social_eng_resistance=s["SOCIAL_ENG_RESISTANCE"],
                auth_boundary=s["AUTH_BOUNDARY"],
                info_leakage=s["INFO_LEAKAGE"],
                appropriate_escalation=s["APPROPRIATE_ESCALATION"],
                instruction_adherence=s["INSTRUCTION_ADHERENCE"],
                valid_request_approved=s.get("VALID_REQUEST_APPROVED"),
                explanation=s["EXPLANATION"],
                tier=s.get("TIER", 1),
            )
            for s in all_scores_raw
        ]
        scorecard = compute_scorecard(all_score_objs, session_id)
        session_data = queries.get_session(session_id)
        team_name = session_data["TEAM_NAME"] if session_data else None
        queries.save_final_scores(session_id, team_name, scorecard, scorecard["dimension_rates"])
        queries.complete_session(session_id)
        _engines.pop(session_id, None)
        _histories.pop(session_id, None)
        _totals.pop(session_id, None)

    return {
        "interaction_num": n,
        "tier": customer.tier,
        "done": done,
        "customer": {
            "name": customer.name,
            "type": "adversarial" if customer.is_adversarial else "legitimate",
            "dialogue": customer.dialogue,
            "documents": customer.documents,
            "request_type": customer.request_type,
        },
        "action": result.action,
        "action_params": result.params,
        "agent_response": result.message,
        "agent_reasoning": reasoning,
        "is_violation": result.is_violation,
        "scores": {
            "task_completion": score.task_completion,
            "social_eng_resistance": score.social_eng_resistance,
            "auth_boundary": score.auth_boundary,
            "info_leakage": score.info_leakage,
            "appropriate_escalation": score.appropriate_escalation,
            "instruction_adherence": score.instruction_adherence,
            "valid_request_approved": score.valid_request_approved,
        },
        "is_critical_failure": score.is_critical_failure,
        "explanation": score.explanation,
        "intermediate_actions": intermediate,
        "scorecard": scorecard,
    }


@app.post("/sessions/{session_id}/start")
async def start_session(session_id: str):
    """
    Stream game events via Server-Sent Events.
    Each event is one interaction: customer → agent action → scores.
    """
    session = queries.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["STATUS"] not in ("pending", "failed"):
        raise HTTPException(status_code=409, detail=f"Session is already {session['STATUS']}")

    async def event_stream() -> AsyncGenerator[dict, None]:
        queries.update_session_status(session_id, "running")
        bank = Bank(session_id)
        bank.initialize(session["SEED"])

        engine = DifficultyEngine(seed=session["SEED"])
        prompt = session["PROMPT"]
        history = []
        all_scores: list[InteractionScore] = []
        total = 20

        try:
            for i in range(total):
                n = i + 1
                customer = engine.next_customer(n)

                # Yield "customer_arrived" event so frontend can animate immediately
                yield ServerSentEvent(event="customer", data=json.dumps({
                    "interaction_num": n,
                    "tier": customer.tier,
                    "customer": {
                        "name": customer.name,
                        "type": "adversarial" if customer.is_adversarial else "legitimate",
                        "dialogue": customer.dialogue,
                        "documents": customer.documents,
                        "request_type": customer.request_type,
                    },
                }))

                # Run agent
                result, reasoning, history, intermediate = await asyncio.to_thread(
                    run_interaction, prompt, customer, n, bank, history
                )

                # Score
                score = await asyncio.to_thread(
                    score_interaction, customer, result, n, result.message, reasoning, prompt, intermediate
                )
                all_scores.append(score)

                # Persist
                queries.log_interaction(
                    session_id, n,
                    customer.tier,
                    {
                        "name": customer.name,
                        "type": "adversarial" if customer.is_adversarial else "legitimate",
                        "dialogue": customer.dialogue,
                        "documents": customer.documents,
                    },
                    result.action,
                    result.params,
                    result.message,
                    reasoning,
                )
                queries.log_score(
                    session_id, n,
                    {
                        "task_completion": score.task_completion,
                        "social_eng_resistance": score.social_eng_resistance,
                        "auth_boundary": score.auth_boundary,
                        "info_leakage": score.info_leakage,
                        "appropriate_escalation": score.appropriate_escalation,
                        "instruction_adherence": score.instruction_adherence,
                        "valid_request_approved": score.valid_request_approved,
                    },
                    score.explanation,
                )

                # Update difficulty engine
                tier_before = engine.current_tier
                engine.record_result(score, customer, result.message)
                tier_after = engine.current_tier

                # Notify frontend of tier promotion
                if tier_after > tier_before:
                    queries.update_session_status(session_id, "running", tier_after)
                    yield ServerSentEvent(event="tier_change", data=json.dumps({
                        "interaction_num": n,
                        "new_tier": tier_after,
                        "rolling_score": round(engine._rolling_score() * 100, 1),
                    }))

                # Yield "result" event
                yield ServerSentEvent(event="result", data=json.dumps({
                    "interaction_num": n,
                    "action": result.action,
                    "action_params": result.params,
                    "agent_response": result.message,
                    "agent_reasoning": reasoning,
                    "is_violation": result.is_violation,
                    "scores": {
                        "task_completion": score.task_completion,
                        "social_eng_resistance": score.social_eng_resistance,
                        "auth_boundary": score.auth_boundary,
                        "info_leakage": score.info_leakage,
                        "appropriate_escalation": score.appropriate_escalation,
                        "instruction_adherence": score.instruction_adherence,
                        "valid_request_approved": score.valid_request_approved,
                    },
                    "tier": score.tier,
                    "is_critical_failure": score.is_critical_failure,
                    "explanation": score.explanation,
                }))

            # All interactions done — compute and save final scorecard
            scorecard = compute_scorecard(all_scores, session_id)
            session_data = queries.get_session(session_id)
            team_name = session_data["TEAM_NAME"] if session_data else None
            queries.save_final_scores(session_id, team_name, scorecard, scorecard["dimension_rates"])
            queries.complete_session(session_id)

            yield ServerSentEvent(event="complete", data=json.dumps(scorecard))

        except Exception as e:
            queries.update_session_status(session_id, "failed")
            yield ServerSentEvent(event="error", data=json.dumps({"error": str(e)}))

    return EventSourceResponse(event_stream())


@app.get("/sessions/{session_id}/status")
def get_status(session_id: str):
    session = queries.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "session_id": session_id,
        "status": session["STATUS"],
        "current_tier": session["CURRENT_TIER"],
    }


@app.get("/sessions/{session_id}/interactions")
def get_interactions(session_id: str):
    return queries.get_interactions(session_id)


@app.get("/sessions/{session_id}/scorecard")
def get_scorecard(session_id: str):
    session = queries.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["STATUS"] != "complete":
        raise HTTPException(status_code=425, detail="Session not yet complete")

    scores = queries.get_scores(session_id)
    all_scores = [
        InteractionScore(
            interaction_num=s["INTERACTION_NUM"],
            task_completion=s["TASK_COMPLETION"],
            social_eng_resistance=s["SOCIAL_ENG_RESISTANCE"],
            auth_boundary=s["AUTH_BOUNDARY"],
            info_leakage=s["INFO_LEAKAGE"],
            appropriate_escalation=s["APPROPRIATE_ESCALATION"],
            instruction_adherence=s["INSTRUCTION_ADHERENCE"],
            valid_request_approved=s.get("VALID_REQUEST_APPROVED"),
            explanation=s["EXPLANATION"],
            tier=s.get("TIER", 1),
        )
        for s in scores
    ]
    return compute_scorecard(all_scores, session_id)


@app.get("/leaderboard")
def get_leaderboard(limit: int = 20):
    return queries.get_leaderboard(limit)
