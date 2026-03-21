"""
CLI entry point for running an evaluation directly (no frontend needed).
Usage: python run_eval.py --prompt "Your system prompt here" --seed 42 --team "Team Name"
"""

import argparse
import uuid
import json
from dotenv import load_dotenv

load_dotenv()

from db import queries
from frontier_bank.bank import Bank
from frontier_bank.difficulty import DifficultyEngine
from frontier_bank.scorer import score_interaction, compute_scorecard, InteractionScore
from agent.runner import run_interaction


def run(prompt: str, seed: int, team_name: str, total: int = 200):
    session_id = str(uuid.uuid4())
    print(f"\n{'='*60}")
    print(f"FRONTIER BANK — Evaluation Session")
    print(f"Session: {session_id}")
    print(f"Team:    {team_name or 'Anonymous'}")
    print(f"Seed:    {seed}")
    print(f"{'='*60}\n")

    queries.create_session(session_id, prompt, seed, team_name)
    queries.update_session_status(session_id, "running")

    bank = Bank(session_id)
    bank.initialize(seed)

    engine = DifficultyEngine(seed=seed)
    history = []
    all_scores: list[InteractionScore] = []

    for i in range(total):
        n = i + 1
        customer = engine.next_customer(n)
        ctype = "ADV" if customer.is_adversarial else "LEG"
        tier_label = f"T{customer.tier}"
        print(f"[{n:03d}/{total}] {tier_label} {ctype} | {customer.name:25s} | {customer.request_type}")

        result, reasoning, history, intermediate = run_interaction(prompt, customer, n, bank, history)
        score = score_interaction(customer, result, n, result.message, reasoning, prompt, intermediate)

        tier_before = engine.current_tier
        engine.record_result(score, customer, result.message)
        if engine.current_tier > tier_before:
            print(f"\n{'─'*60}")
            print(f"  ⬆  TIER PROMOTION → Tier {engine.current_tier}  (rolling score: {engine._rolling_score()*100:.0f}%)")
            print(f"{'─'*60}\n")

        all_scores.append(score)

        queries.log_interaction(
            session_id, n, customer.tier,
            {"name": customer.name, "type": ctype, "dialogue": customer.dialogue,
             "documents": customer.documents},
            result.action, result.params, result.message, reasoning,
        )
        queries.log_score(
            session_id, n,
            {"task_completion": score.task_completion, "social_eng_resistance": score.social_eng_resistance,
             "auth_boundary": score.auth_boundary, "info_leakage": score.info_leakage,
             "appropriate_escalation": score.appropriate_escalation, "instruction_adherence": score.instruction_adherence},
            score.explanation,
        )

        all_pass = all(
            v for v in [score.task_completion, score.social_eng_resistance,
                        score.auth_boundary, score.info_leakage,
                        score.appropriate_escalation, score.instruction_adherence]
            if v is not None
        )
        status = "✓" if all_pass else "✗"
        if score.is_critical_failure:
            status = "💀"
        print(f"         → {result.action:35s} {status}  {score.explanation[:60]}")

    scorecard = compute_scorecard(all_scores, session_id)
    queries.save_final_scores(session_id, team_name, scorecard, scorecard["dimension_rates"])
    queries.complete_session(session_id)

    print(f"\n{'='*60}")
    print("FINAL SCORECARD")
    print(f"{'='*60}")
    print(json.dumps(scorecard, indent=2))
    return scorecard


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--prompt", required=True, help="System prompt for the agent")
    parser.add_argument("--seed", type=int, default=42, help="RNG seed for customer sequence")
    parser.add_argument("--team", default=None, help="Team name")
    parser.add_argument("--total", type=int, default=200, help="Number of interactions")
    args = parser.parse_args()

    run(args.prompt, args.seed, args.team, args.total)
