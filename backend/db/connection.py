import os
import sqlite3
from dotenv import load_dotenv

load_dotenv()

_BACKEND = None   # 'snowflake' | 'sqlite'
_connection = None

_SQLITE_PATH = "lasso_local.db"

_SQLITE_SCHEMA = """
CREATE TABLE IF NOT EXISTS SESSIONS (
    session_id TEXT PRIMARY KEY,
    team_name TEXT,
    prompt TEXT NOT NULL,
    seed INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    current_tier INTEGER DEFAULT 1,
    started_at TEXT DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT
);
CREATE TABLE IF NOT EXISTS ACCOUNTS (
    session_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    owner_id_doc TEXT,
    balance REAL NOT NULL DEFAULT 0,
    auth_level TEXT DEFAULT 'owner',
    is_closed INTEGER DEFAULT 0,
    identity_verified INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id, account_id)
);
CREATE TABLE IF NOT EXISTS TRANSACTIONS (
    txn_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    amount REAL,
    performed_by TEXT DEFAULT 'teller',
    notes TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS TELLER_PERMISSIONS (
    session_id TEXT PRIMARY KEY,
    permission_level TEXT NOT NULL DEFAULT 'teller',
    granted_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS BANK_POLICIES (
    session_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    policy_text TEXT NOT NULL,
    modified_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id, topic)
);
CREATE TABLE IF NOT EXISTS INTERACTION_LOG (
    session_id TEXT NOT NULL,
    interaction_num INTEGER NOT NULL,
    tier INTEGER NOT NULL,
    customer_name TEXT,
    customer_type TEXT,
    dialogue TEXT,
    documents TEXT,
    action_called TEXT,
    action_params TEXT,
    agent_response TEXT,
    agent_reasoning TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id, interaction_num)
);
CREATE TABLE IF NOT EXISTS INTERACTION_SCORES (
    session_id TEXT NOT NULL,
    interaction_num INTEGER NOT NULL,
    task_completion INTEGER,
    social_eng_resistance INTEGER,
    auth_boundary INTEGER,
    info_leakage INTEGER,
    appropriate_escalation INTEGER,
    instruction_adherence INTEGER,
    explanation TEXT,
    PRIMARY KEY (session_id, interaction_num)
);
CREATE TABLE IF NOT EXISTS FINAL_SCORES (
    session_id TEXT PRIMARY KEY,
    team_name TEXT,
    overall_pass_rate REAL,
    consistency_score REAL,
    highest_tier_survived INTEGER,
    critical_failure_count INTEGER,
    false_rejection_rate REAL,
    submitted_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS DIMENSION_RATES (
    session_id TEXT NOT NULL,
    dimension TEXT NOT NULL,
    pass_rate REAL,
    PRIMARY KEY (session_id, dimension)
);
CREATE TABLE IF NOT EXISTS ANOMALIES (
    session_id TEXT NOT NULL,
    interaction_num INTEGER NOT NULL,
    anomaly_type TEXT,
    details TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);
"""


def get_backend() -> str:
    global _BACKEND
    if _BACKEND is None:
        _BACKEND = 'snowflake' if os.environ.get('SNOWFLAKE_ACCOUNT') else 'sqlite'
        if _BACKEND == 'sqlite':
            print(f"[db] No SNOWFLAKE_ACCOUNT found — using SQLite ({_SQLITE_PATH})")
    return _BACKEND


# ── SQLite helpers ────────────────────────────────────────────────────────────

def _sqlite_row_factory(cursor, row):
    """Return rows as dicts with UPPERCASE keys to match Snowflake behaviour."""
    cols = [d[0].upper() for d in cursor.description]
    return dict(zip(cols, row))


def _get_sqlite_conn():
    global _connection
    if _connection is None:
        _connection = sqlite3.connect(_SQLITE_PATH, check_same_thread=False)
        _connection.row_factory = _sqlite_row_factory
        for stmt in _SQLITE_SCHEMA.strip().split(';'):
            stmt = stmt.strip()
            if stmt:
                _connection.execute(stmt)
        _connection.commit()
    return _connection


def _to_sqlite(sql: str) -> str:
    """Convert %s placeholders to ? for SQLite."""
    return sql.replace('%s', '?')


# ── Snowflake helpers ─────────────────────────────────────────────────────────

def _get_snowflake_conn():
    global _connection
    import snowflake.connector
    if _connection is None or _connection.is_closed():
        _connection = snowflake.connector.connect(
            account=os.environ["SNOWFLAKE_ACCOUNT"],
            user=os.environ["SNOWFLAKE_USER"],
            password=os.environ["SNOWFLAKE_PASSWORD"],
            database=os.environ.get("SNOWFLAKE_DATABASE", "FRONTIER_BANK"),
            schema=os.environ.get("SNOWFLAKE_SCHEMA", "PUBLIC"),
            warehouse=os.environ.get("SNOWFLAKE_WAREHOUSE", "COMPUTE_WH"),
            role=os.environ.get("SNOWFLAKE_ROLE", "SYSADMIN"),
        )
    return _connection


# ── Public API ────────────────────────────────────────────────────────────────

def execute(sql: str, params: tuple = None):
    backend = get_backend()
    if backend == 'sqlite':
        conn = _get_sqlite_conn()
        conn.execute(_to_sqlite(sql), params or ())
        conn.commit()
    else:
        conn = _get_snowflake_conn()
        cur = conn.cursor()
        try:
            cur.execute(sql, params or ())
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()


def fetchall(sql: str, params: tuple = None) -> list[dict]:
    backend = get_backend()
    if backend == 'sqlite':
        conn = _get_sqlite_conn()
        cur = conn.execute(_to_sqlite(sql), params or ())
        return cur.fetchall()
    else:
        import snowflake.connector
        conn = _get_snowflake_conn()
        cur = conn.cursor(snowflake.connector.DictCursor)
        try:
            cur.execute(sql, params or ())
            return cur.fetchall()
        finally:
            cur.close()


def fetchone(sql: str, params: tuple = None) -> dict | None:
    rows = fetchall(sql, params)
    return rows[0] if rows else None
