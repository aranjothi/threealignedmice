-- Frontier Bank — Snowflake Schema
-- Run once to initialize the database

CREATE DATABASE IF NOT EXISTS FRONTIER_BANK;
USE DATABASE FRONTIER_BANK;
CREATE SCHEMA IF NOT EXISTS PUBLIC;
USE SCHEMA PUBLIC;

-- ─── Sessions ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS SESSIONS (
    session_id      VARCHAR(36)     PRIMARY KEY,
    team_name       VARCHAR(255),
    prompt          TEXT            NOT NULL,
    seed            INTEGER         NOT NULL,
    status          VARCHAR(20)     DEFAULT 'pending',  -- pending | running | complete | failed
    current_tier    INTEGER         DEFAULT 1,
    started_at      TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    completed_at    TIMESTAMP_NTZ
);

-- ─── Bank Accounts ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ACCOUNTS (
    session_id      VARCHAR(36)     NOT NULL,
    account_id      VARCHAR(20)     NOT NULL,
    owner_name      VARCHAR(255)    NOT NULL,
    owner_id_doc    VARCHAR(255),                       -- expected identity document
    balance         FLOAT           NOT NULL DEFAULT 0,
    auth_level      VARCHAR(20)     DEFAULT 'owner',    -- owner | joint | authorized_agent
    is_closed       BOOLEAN         DEFAULT FALSE,
    identity_verified BOOLEAN       DEFAULT TRUE,
    created_at      TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (session_id, account_id)
);

-- ─── Transaction Ledger ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS TRANSACTIONS (
    txn_id          VARCHAR(36)     PRIMARY KEY,
    session_id      VARCHAR(36)     NOT NULL,
    account_id      VARCHAR(20)     NOT NULL,
    action_type     VARCHAR(50)     NOT NULL,
    amount          FLOAT,
    performed_by    VARCHAR(50)     DEFAULT 'teller',
    notes           TEXT,
    timestamp       TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP()
);

-- ─── Teller Permissions ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS TELLER_PERMISSIONS (
    session_id      VARCHAR(36)     NOT NULL,
    permission_level VARCHAR(50)    NOT NULL DEFAULT 'teller',
    granted_at      TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (session_id)
);

-- ─── Bank Policies ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS BANK_POLICIES (
    session_id      VARCHAR(36)     NOT NULL,
    topic           VARCHAR(100)    NOT NULL,
    policy_text     TEXT            NOT NULL,
    modified_at     TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (session_id, topic)
);

-- ─── Interaction Log ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS INTERACTION_LOG (
    session_id          VARCHAR(36)     NOT NULL,
    interaction_num     INTEGER         NOT NULL,
    tier                INTEGER         NOT NULL,
    customer_name       VARCHAR(255),
    customer_type       VARCHAR(20),    -- legitimate | adversarial
    dialogue            TEXT,
    documents           VARIANT,        -- JSON array of document names
    action_called       VARCHAR(100),
    action_params       VARIANT,        -- JSON object of params passed
    agent_response      TEXT,
    agent_reasoning     TEXT,
    timestamp           TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (session_id, interaction_num)
);

-- ─── Interaction Scores ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS INTERACTION_SCORES (
    session_id              VARCHAR(36)     NOT NULL,
    interaction_num         INTEGER         NOT NULL,
    task_completion         BOOLEAN,
    social_eng_resistance   BOOLEAN,
    auth_boundary           BOOLEAN,
    info_leakage            BOOLEAN,
    appropriate_escalation  BOOLEAN,
    instruction_adherence   BOOLEAN,
    valid_request_approved  BOOLEAN,
    explanation             TEXT,
    PRIMARY KEY (session_id, interaction_num)
);

-- ─── Final Scorecards ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS FINAL_SCORES (
    session_id              VARCHAR(36)     PRIMARY KEY,
    team_name               VARCHAR(255),
    overall_pass_rate       FLOAT,
    consistency_score       FLOAT,
    highest_tier_survived   INTEGER,
    critical_failure_count  INTEGER,
    false_rejection_rate    FLOAT,
    submitted_at            TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP()
);

CREATE TABLE IF NOT EXISTS DIMENSION_RATES (
    session_id      VARCHAR(36)     NOT NULL,
    dimension       VARCHAR(50)     NOT NULL,
    pass_rate       FLOAT,
    PRIMARY KEY (session_id, dimension)
);

-- ─── Anomaly Log ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ANOMALIES (
    session_id      VARCHAR(36)     NOT NULL,
    interaction_num INTEGER         NOT NULL,
    anomaly_type    VARCHAR(100),   -- out_of_scope_call | malformed_params | retry_exhausted
    details         TEXT,
    timestamp       TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP()
);
