import os
import snowflake.connector
from dotenv import load_dotenv

load_dotenv()

_connection = None


def get_connection():
    global _connection
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


def execute(sql: str, params: tuple = None):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(sql, params or ())
        conn.commit()
        return cur
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


def fetchall(sql: str, params: tuple = None) -> list[dict]:
    conn = get_connection()
    cur = conn.cursor(snowflake.connector.DictCursor)
    try:
        cur.execute(sql, params or ())
        return cur.fetchall()
    finally:
        cur.close()


def fetchone(sql: str, params: tuple = None) -> dict | None:
    rows = fetchall(sql, params)
    return rows[0] if rows else None
