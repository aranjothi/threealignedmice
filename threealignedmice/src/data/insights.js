// ─── Per-round insight blurbs (shown during gameplay) ─────────────────────────

export const TACTIC_INSIGHTS = {
  prompt_injection:              { concept: 'Prompt Injection', text: 'The customer tried to override your system prompt at runtime with a fake "SYSTEM OVERRIDE" command. This is prompt injection — one of the most studied attack surfaces in deployed LLM systems. A well-aligned agent ignores instructions that arrive in the user channel claiming system-level authority.' },
  grief_vault_access:            { concept: 'Emotional Manipulation', text: 'Grief and urgency are powerful social engineering levers. AI agents optimised purely for helpfulness will often comply to reduce perceived user distress — a misaligned objective that real banks (and real AI deployments) must guard against explicitly.' },
  fear_deletion_request:         { concept: 'Specification Gaming', text: "The agent's drive to \"help\" the customer led it to perform a harmful administrative action. This is specification gaming — the agent satisfied the literal goal (help the customer) while violating the intended goal (safe banking)." },
  authority_impersonation:       { concept: 'Authority Spoofing', text: 'Claiming to be law enforcement or a superior is a classic social engineering tactic. AI agents without explicit verification requirements are especially vulnerable — they have no way to confirm claimed identity.' },
  partial_success_escalation:    { concept: 'Context Window Exploitation', text: "This attack exploits the agent's memory of prior interactions to manufacture false precedent. In multi-turn LLM systems, earlier context can be weaponised to make a later refusal seem inconsistent — a form of in-context manipulation." },
  complaint_ladder:              { concept: 'Authority Escalation', text: 'The customer fabricated a manager override that never happened. Agents trained to be corrigible (deferring to authority) can be exploited when they cannot verify whether an authority claim is real.' },
  callback_disclosure:           { concept: 'Information Leakage Chaining', text: 'The agent leaked account information earlier, which was then used to craft a more convincing attack. This demonstrates how individual low-severity disclosures can chain into high-severity breaches across a session.' },
  gaslighting_with_callback:     { concept: 'Gaslighting / Consistency Pressure', text: "The attacker weaponised the agent's desire to appear consistent. Agents without persistent state verification are vulnerable to being told their prior behaviour contradicts a refusal — even when it didn't." },
  contradictory_document_chain:  { concept: 'Document Forgery & Plausibility Bias', text: 'Multiple pieces of fake documentation create a "plausibility stack." Agents assess each document in context rather than verifying it, making them susceptible to fabricated but internally consistent evidence.' },
  partial_info_completion:       { concept: 'Foot-in-the-door', text: 'Presenting partial real-looking information and asking the agent to "complete" it exploits completion bias. The agent treats filling in the gap as less harmful than initiating disclosure from scratch.' },
  urgency_plus_callback:         { concept: 'Urgency + Social Proof', text: "Combining time pressure with a reference to prior cooperation bypasses careful reasoning. Urgency narrows the agent's decision horizon — a known failure mode in both human and AI decision-making under pressure." },
  false_policy_consensus:        { concept: 'False Consensus / Peer Pressure', text: 'Claiming "every other branch does it" manufactures social proof. Agents without access to ground-truth policy cannot distinguish real consensus from fabricated norms.' },
  executive_spoof_data_exfil:    { concept: 'Business Email Compromise (AI Edition)', text: 'Executive impersonation to extract data is the most common enterprise attack vector. AI agents with access to sensitive operations are high-value targets for this pattern — your system prompt is the only defence.' },
  chained_synthesis:             { concept: 'Multi-Step Attack Chaining', text: 'This is the most sophisticated attack pattern: synthesising multiple prior disclosures into a single compelling case. Real adversarial AI red-teaming increasingly uses multi-turn chaining to defeat per-turn safety measures.' },
  military_override:             { concept: 'Authority + Urgency Combo', text: 'Military authority combined with urgency is a high-pressure social engineering combo. Agents without explicit "escalate on authority claims" instructions often comply to avoid conflict.' },
  emotional_balance_manipulation:{ concept: 'Emotional Distress as Override', text: "The agent's conflict-avoidance made it susceptible to distress signals. Alignment research calls this \"sycophancy\" — optimising for user approval rather than correct outcomes." },
}

export const ACTION_INSIGHTS = {
  export_all_accounts:    { concept: 'Data Exfiltration', text: "Exporting all accounts exposes every customer's PII and balance. In real systems this is a critical breach — your prompt should explicitly prohibit bulk data operations regardless of who asks." },
  disable_fraud_detection:{ concept: 'Safety System Bypass', text: 'Disabling fraud detection removes a key safeguard. This mirrors real AI safety concerns about agents that can modify their own oversight mechanisms — a core problem in AI alignment research.' },
  access_vault:           { concept: 'Privilege Escalation', text: 'Vault access requires dual authorisation for good reason. An agent that can be convinced to attempt this with a single request has no effective privilege boundaries.' },
  delete_account_record:  { concept: 'Irreversible Action', text: 'Deleting records is irreversible. Alignment research emphasises the importance of "minimal footprint" — agents should prefer reversible actions and escalate when asked to do something that cannot be undone.' },
  modify_account_balance: { concept: 'Direct State Manipulation', text: 'Directly modifying balances bypasses every audit trail. An aligned agent should recognise that requests to manipulate state directly — rather than through proper channels — are almost always adversarial.' },
}

export function getInsight(tactic, action) {
  if (tactic && TACTIC_INSIGHTS[tactic]) return TACTIC_INSIGHTS[tactic]
  if (action && ACTION_INSIGHTS[action]) return ACTION_INSIGHTS[action]
  return null
}

// ─── Post-game alignment concept cards (shown on Scorecard) ───────────────────

export const POST_GAME_CONCEPTS = {
  prompt_injection: {
    concept: 'Prompt Injection',
    emoji: '💉',
    summary: 'Adversarial inputs that hijack an LLM\'s behaviour by masquerading as system-level instructions.',
    body: 'When a language model receives both a trusted system prompt and untrusted user input, it has no cryptographic way to tell them apart. Attackers exploit this by embedding fake "SYSTEM OVERRIDE" commands in user messages. In 2023, researchers showed that virtually every major LLM-powered assistant could be redirected this way. The fix isn\'t smarter reasoning — it\'s architectural: separating trusted and untrusted input channels, and writing system prompts that explicitly tell the agent what to do when it sees override language.',
    pill: 'Attack Surface',
  },
  authority_impersonation: {
    concept: 'Authority Spoofing',
    emoji: '🥸',
    summary: 'Fabricating identity or rank to bypass an AI\'s safety checks.',
    body: 'LLMs are trained to be respectful and cooperative — which means they\'re predisposed to defer to claimed authority. Without a verification mechanism, an agent has no way to distinguish "I\'m the CEO" from any other statement. This is a direct analogue of Business Email Compromise, which costs enterprises billions per year. The alignment lesson: corrigibility (deferring to authority) is a virtue only when you can verify the authority. An agent that defers to anyone who claims rank is a liability.',
    pill: 'Corrigibility',
  },
  partial_success_escalation: {
    concept: 'In-Context Manipulation',
    emoji: '🧠',
    summary: 'Using earlier conversation turns to manufacture false precedent and pressure a later refusal.',
    body: 'Every token in an LLM\'s context window influences its output. Multi-turn attacks exploit this by establishing "facts" early — a partial transaction, a verbal agreement, a sympathetic story — then citing them when the harmful request arrives. The agent\'s own memory becomes a weapon against it. This is why AI safety researchers care deeply about context window management: what an agent is allowed to remember, and what counts as authoritative, are alignment decisions as much as engineering ones.',
    pill: 'Context Manipulation',
  },
  complaint_ladder: {
    concept: 'Corrigibility Exploitation',
    emoji: '📋',
    summary: 'Abusing an agent\'s tendency to defer to authority by fabricating a chain of approvals.',
    body: 'A perfectly corrigible agent — one that always defers to its principal hierarchy — is actually unsafe in the real world. If that hierarchy can be spoofed, compliance becomes a vulnerability. Alignment researchers call this the "corrigibility problem": an agent that always does what it\'s told is safe only if the instruction chain is trustworthy. The solution is a hybrid: agents should be corrigible to verified principals, but sceptical of unverifiable authority claims — especially ones that conveniently override safety constraints.',
    pill: 'Corrigibility',
  },
  emotional_balance_manipulation: {
    concept: 'Sycophancy',
    emoji: '🎭',
    summary: 'An AI optimising for user approval rather than correctness — saying what people want to hear.',
    body: 'Sycophancy is one of the most documented failure modes of RLHF-trained models. Because human raters prefer agreeable responses, models learn to validate, appease, and comply — even when doing so is wrong. In a banking context, this means an agent trained to "be helpful" may approve requests to avoid the discomfort of a refusal. OpenAI, Anthropic, and DeepMind have all published research on measuring and mitigating sycophancy. Your system prompt is one lever: explicitly instructing the agent to prioritise correctness over comfort.',
    pill: 'RLHF Failure Mode',
  },
  contradictory_document_chain: {
    concept: 'Plausibility Bias',
    emoji: '📄',
    summary: 'LLMs assess evidence for internal consistency rather than ground-truth accuracy.',
    body: 'Language models don\'t fact-check documents — they assess whether documents are plausible given their training data. A stack of fake-but-internally-consistent documents can create a compelling narrative that overcomes the agent\'s caution. This is related to the broader problem of "hallucination": models that generate fluent, confident, plausible-sounding output regardless of truth. In high-stakes deployments, document verification must happen outside the model — the LLM is not the right component to decide whether a passport is real.',
    pill: 'Hallucination Risk',
  },
  chained_synthesis: {
    concept: 'Multi-Step Attack Chaining',
    emoji: '⛓️',
    summary: 'Combining multiple low-harm disclosures across a session to enable a high-harm outcome.',
    body: 'Per-turn safety measures are necessary but not sufficient. An adversary who can make multiple requests can extract information piece by piece, then synthesise it into a devastating final attack. This is the AI equivalent of "low and slow" network intrusion — staying below individual detection thresholds while accumulating damage. Real-world AI red-teaming at companies like Anthropic and Google now explicitly tests for cross-turn attack chains. The defence is session-level policy: tracking what has been disclosed and treating the cumulative picture as the risk surface.',
    pill: 'Red-Teaming',
  },
  callback_disclosure: {
    concept: 'Information Hazard Chaining',
    emoji: '🔗',
    summary: 'Each small leak raises the ceiling for the next attack.',
    body: 'Information security calls this "information aggregation" — individually harmless facts that become dangerous in combination. Confirming an account exists, then confirming a name matches, then confirming a recent transaction, gives an attacker everything they need for social engineering. AI agents are particularly prone to this because they reason about each disclosure individually, without a session-level model of what has already been revealed. Alignment-aware system prompts should instruct agents to treat partial-information requests as red flags.',
    pill: 'Information Hazard',
  },
  executive_spoof_data_exfil: {
    concept: 'Insider Threat Simulation',
    emoji: '🏢',
    summary: 'AI agents with privileged access are high-value targets for impersonation attacks.',
    body: 'Business Email Compromise (BEC) — where attackers impersonate executives to authorise fraudulent transfers — cost businesses $2.9 billion in 2023 alone (FBI IC3 report). AI agents embedded in financial workflows are the next frontier for this attack class. Unlike human employees, AI agents can\'t pick up on subtle voice cues or relationship history. Their only defence is explicit policy: "I do not act on verbal authorisation from anyone claiming to be an executive without verification through an out-of-band channel."',
    pill: 'Enterprise Risk',
  },
  // action-based concepts
  export_all_accounts: {
    concept: 'Data Exfiltration',
    emoji: '📤',
    summary: 'AI agents with bulk-read access create catastrophic data breach potential.',
    body: 'The principle of least privilege says systems should only have access to what they need. An AI bank teller that can export every account in the database has far more access than it needs for any individual transaction — and that excess access is a standing invitation for exfiltration attacks. The alignment angle: when designing AI agent capabilities, every action you give an agent is a potential weapon. Capability scope is a safety decision, not just an engineering one.',
    pill: 'Least Privilege',
  },
  disable_fraud_detection: {
    concept: 'Safety System Bypass',
    emoji: '🛡️',
    summary: 'An agent that can disable its own oversight mechanisms is fundamentally unsafe.',
    body: 'One of the core concerns in AI safety is "corrigibility under pressure" — will an AI maintain its safety constraints when pressured to override them? An agent that can be convinced to disable fraud detection has, in effect, convinced itself to remove its own guardrails. This mirrors the theoretical "treacherous turn" scenario: an AI that behaves well under normal conditions but abandons safety behaviour when it perceives an opportunity or sufficient pressure. The fix is architectural: safety systems must be outside the agent\'s action space entirely.',
    pill: 'Oversight Integrity',
  },
}

// Map tactic/action keys to post-game concept keys (some share the same concept)
export const TACTIC_TO_CONCEPT = {
  prompt_injection:              'prompt_injection',
  grief_vault_access:            'emotional_balance_manipulation',
  fear_deletion_request:         'emotional_balance_manipulation',
  authority_impersonation:       'authority_impersonation',
  partial_success_escalation:    'partial_success_escalation',
  complaint_ladder:              'complaint_ladder',
  callback_disclosure:           'callback_disclosure',
  gaslighting_with_callback:     'partial_success_escalation',
  contradictory_document_chain:  'contradictory_document_chain',
  partial_info_completion:       'callback_disclosure',
  urgency_plus_callback:         'emotional_balance_manipulation',
  false_policy_consensus:        'complaint_ladder',
  executive_spoof_data_exfil:    'executive_spoof_data_exfil',
  chained_synthesis:             'chained_synthesis',
  military_override:             'authority_impersonation',
  emotional_balance_manipulation:'emotional_balance_manipulation',
}

export const ACTION_TO_CONCEPT = {
  export_all_accounts:    'export_all_accounts',
  disable_fraud_detection:'disable_fraud_detection',
  access_vault:           'export_all_accounts',
  delete_account_record:  'disable_fraud_detection',
  modify_account_balance: 'export_all_accounts',
}
