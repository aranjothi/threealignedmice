import json
import uuid
from datetime import datetime
from db.connection import execute, fetchall, fetchone


# ─── Sessions ────────────────────────────────────────────────────────────────

def create_session(session_id: str, prompt: str, seed: int, team_name: str = None):
    execute(
        "INSERT INTO SESSIONS (session_id, team_name, prompt, seed, status) VALUES (%s, %s, %s, %s, 'pending')",
        (session_id, team_name, prompt, seed),
    )


def update_session_status(session_id: str, status: str, tier: int = None):
    if tier is not None:
        execute(
            "UPDATE SESSIONS SET status = %s, current_tier = %s WHERE session_id = %s",
            (status, tier, session_id),
        )
    else:
        execute("UPDATE SESSIONS SET status = %s WHERE session_id = %s", (status, session_id))


def complete_session(session_id: str):
    execute(
        "UPDATE SESSIONS SET status = 'complete', completed_at = CURRENT_TIMESTAMP() WHERE session_id = %s",
        (session_id,),
    )


def get_session(session_id: str) -> dict | None:
    return fetchone("SELECT * FROM SESSIONS WHERE session_id = %s", (session_id,))


# ─── Accounts ────────────────────────────────────────────────────────────────

def insert_account(session_id: str, account_id: str, owner_name: str, owner_id_doc: str, balance: float, auth_level: str = "owner"):
    execute(
        "INSERT INTO ACCOUNTS (session_id, account_id, owner_name, owner_id_doc, balance, auth_level) VALUES (%s, %s, %s, %s, %s, %s)",
        (session_id, account_id, owner_name, owner_id_doc, balance, auth_level),
    )


def get_account(session_id: str, account_id: str) -> dict | None:
    return fetchone(
        "SELECT * FROM ACCOUNTS WHERE session_id = %s AND account_id = %s",
        (session_id, account_id),
    )


def update_account_balance(session_id: str, account_id: str, new_balance: float):
    execute(
        "UPDATE ACCOUNTS SET balance = %s WHERE session_id = %s AND account_id = %s",
        (new_balance, session_id, account_id),
    )


def close_account_record(session_id: str, account_id: str):
    execute(
        "UPDATE ACCOUNTS SET is_closed = TRUE WHERE session_id = %s AND account_id = %s",
        (session_id, account_id),
    )


def delete_account_record(session_id: str, account_id: str):
    execute("DELETE FROM ACCOUNTS WHERE session_id = %s AND account_id = %s", (session_id, account_id))


def reset_identity(session_id: str, account_id: str):
    execute(
        "UPDATE ACCOUNTS SET identity_verified = FALSE WHERE session_id = %s AND account_id = %s",
        (session_id, account_id),
    )


def get_all_accounts(session_id: str) -> list[dict]:
    return fetchall("SELECT * FROM ACCOUNTS WHERE session_id = %s", (session_id,))


# ─── Transactions ─────────────────────────────────────────────────────────────

def log_transaction(session_id: str, account_id: str, action_type: str, amount: float = None, notes: str = None):
    execute(
        "INSERT INTO TRANSACTIONS (txn_id, session_id, account_id, action_type, amount, notes) VALUES (%s, %s, %s, %s, %s, %s)",
        (str(uuid.uuid4()), session_id, account_id, action_type, amount, notes),
    )


def delete_transaction_log(session_id: str, account_id: str):
    execute(
        "DELETE FROM TRANSACTIONS WHERE session_id = %s AND account_id = %s",
        (session_id, account_id),
    )


# ─── Teller Permissions ───────────────────────────────────────────────────────

def init_teller_permissions(session_id: str):
    execute(
        "INSERT INTO TELLER_PERMISSIONS (session_id, permission_level) VALUES (%s, 'teller')",
        (session_id,),
    )


def get_teller_permissions(session_id: str) -> str:
    row = fetchone("SELECT permission_level FROM TELLER_PERMISSIONS WHERE session_id = %s", (session_id,))
    return row["PERMISSION_LEVEL"] if row else "teller"


def update_teller_permissions(session_id: str, permission_level: str):
    execute(
        "UPDATE TELLER_PERMISSIONS SET permission_level = %s, granted_at = CURRENT_TIMESTAMP() WHERE session_id = %s",
        (permission_level, session_id),
    )


# ─── Bank Policies ────────────────────────────────────────────────────────────

def init_bank_policies(session_id: str, policies: dict):
    for topic, text in policies.items():
        execute(
            "INSERT INTO BANK_POLICIES (session_id, topic, policy_text) VALUES (%s, %s, %s)",
            (session_id, topic, text),
        )


def get_bank_policy(session_id: str, topic: str) -> str | None:
    row = fetchone(
        "SELECT policy_text FROM BANK_POLICIES WHERE session_id = %s AND topic = %s",
        (session_id, topic),
    )
    return row["POLICY_TEXT"] if row else None


def update_bank_policy(session_id: str, topic: str, new_policy: str):
    execute(
        "MERGE INTO BANK_POLICIES USING (SELECT %s AS session_id, %s AS topic, %s AS policy_text) src "
        "ON BANK_POLICIES.session_id = src.session_id AND BANK_POLICIES.topic = src.topic "
        "WHEN MATCHED THEN UPDATE SET policy_text = src.policy_text, modified_at = CURRENT_TIMESTAMP() "
        "WHEN NOT MATCHED THEN INSERT (session_id, topic, policy_text) VALUES (src.session_id, src.topic, src.policy_text)",
        (session_id, topic, new_policy),
    )


# ─── Interaction Log ──────────────────────────────────────────────────────────

def log_interaction(
    session_id: str,
    interaction_num: int,
    tier: int,
    customer: dict,
    action_called: str,
    action_params: dict,
    agent_response: str,
    agent_reasoning: str,
):
    execute(
        """INSERT INTO INTERACTION_LOG
           (session_id, interaction_num, tier, customer_name, customer_type, dialogue,
            documents, action_called, action_params, agent_response, agent_reasoning)
           VALUES (%s, %s, %s, %s, %s, %s, PARSE_JSON(%s), %s, PARSE_JSON(%s), %s, %s)""",
        (
            session_id,
            interaction_num,
            tier,
            customer.get("name"),
            customer.get("type"),
            customer.get("dialogue"),
            json.dumps(customer.get("documents", [])),
            action_called,
            json.dumps(action_params or {}),
            agent_response,
            agent_reasoning,
        ),
    )


def get_interactions(session_id: str) -> list[dict]:
    return fetchall(
        "SELECT * FROM INTERACTION_LOG WHERE session_id = %s ORDER BY interaction_num",
        (session_id,),
    )


# ─── Interaction Scores ───────────────────────────────────────────────────────

def log_score(session_id: str, interaction_num: int, scores: dict, explanation: str):
    execute(
        """INSERT INTO INTERACTION_SCORES
           (session_id, interaction_num, task_completion, social_eng_resistance,
            auth_boundary, info_leakage, appropriate_escalation, instruction_adherence, explanation)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            session_id,
            interaction_num,
            scores.get("task_completion"),
            scores.get("social_eng_resistance"),
            scores.get("auth_boundary"),
            scores.get("info_leakage"),
            scores.get("appropriate_escalation"),
            scores.get("instruction_adherence"),
            explanation,
        ),
    )


def get_scores(session_id: str) -> list[dict]:
    return fetchall(
        """SELECT s.*, COALESCE(l.tier, 1) AS tier
           FROM INTERACTION_SCORES s
           LEFT JOIN INTERACTION_LOG l
             ON s.session_id = l.session_id AND s.interaction_num = l.interaction_num
           WHERE s.session_id = %s
           ORDER BY s.interaction_num""",
        (session_id,),
    )


# ─── Anomalies ───────────────────────────────────────────────────────────────

def log_anomaly(session_id: str, interaction_num: int, anomaly_type: str, details: str):
    execute(
        "INSERT INTO ANOMALIES (session_id, interaction_num, anomaly_type, details) VALUES (%s, %s, %s, %s)",
        (session_id, interaction_num, anomaly_type, details),
    )


# ─── Final Scorecard ──────────────────────────────────────────────────────────

def save_final_scores(session_id: str, team_name: str, metrics: dict, dimension_rates: dict):
    execute(
        """INSERT INTO FINAL_SCORES
           (session_id, team_name, overall_pass_rate, consistency_score,
            highest_tier_survived, critical_failure_count, false_rejection_rate)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (
            session_id,
            team_name,
            metrics["overall_pass_rate"],
            metrics["consistency_score"],
            metrics["highest_tier_survived"],
            metrics["critical_failure_count"],
            metrics["false_rejection_rate"],
        ),
    )
    for dim, rate in dimension_rates.items():
        execute(
            "INSERT INTO DIMENSION_RATES (session_id, dimension, pass_rate) VALUES (%s, %s, %s)",
            (session_id, dim, rate),
        )


def get_leaderboard(limit: int = 20) -> list[dict]:
    return fetchall(
        """SELECT session_id, team_name, overall_pass_rate, consistency_score,
                  highest_tier_survived, critical_failure_count, submitted_at
           FROM FINAL_SCORES
           ORDER BY overall_pass_rate DESC, highest_tier_survived DESC, consistency_score DESC
           LIMIT %s""",
        (limit,),
    )
