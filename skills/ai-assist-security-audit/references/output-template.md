# Output Template

> Part of [ai-assist-security-audit](../SKILL.md) — loaded during Step 3.

## Finding Format

Each finding follows this format:

```
**[Severity] [Title]** — file:line (Conf: H/M) [CWE-###]
[Attack vector description: how this could be exploited, by whom, with what impact]
**Fix:** [Specific remediation — exact code change, library upgrade, or config setting]
```

Example:
```
**[Critical] SQL Injection in User Search** — src/api/users.ts:42 (Conf: H) [CWE-89]
User input from query parameter `q` is concatenated directly into SQL string. An unauthenticated attacker can extract the entire users table via `' UNION SELECT * FROM users--`.
**Fix:** Replace string concatenation with parameterized query: `db.query('SELECT * FROM users WHERE name = $1', [q])`
```

## Summary Table

Present all findings in a summary table after the detailed findings:

```
| # | Severity | Dim | Location | Issue | CWE | Fix |
|---|----------|-----|----------|-------|-----|-----|
| 1 | Critical | 1-AppSec | src/api/users.ts:42 | SQL injection in search | CWE-89 | Parameterized query |
| 2 | Warning | 7-Auth | src/auth/session.ts:15 | Session timeout too long (24h) | CWE-613 | Reduce to 4h idle |
| 3 | Suggestion | 3-Network | nginx.conf:8 | Missing HSTS header | CWE-319 | Add Strict-Transport-Security |
```

## Positive Observations

Include 3-5 things the project does well. This provides balanced assessment and acknowledges good security practices:

```
**What's done well:**
- Secrets managed via environment variables — no hardcoded credentials found
- Parameterized queries used consistently in 95% of database calls
- HTTPS enforced on all endpoints with TLS 1.3
- Dependencies up to date — no known CVEs in direct dependencies
- Structured logging with PII redaction middleware
```

## Improvement Plan

Organize findings into priority tiers:

```
**Improvement Plan:**

**P1 — Critical (fix now):** These are exploitable.
- #1: SQL injection in user search
- #4: Hardcoded API key in config

**P2 — Warnings (next sprint):** Conditional exploitability.
- #2: Session timeout too long
- #5: Missing rate limiting on login

**P3 — Suggestions (backlog):** Defense-in-depth.
- #3: Missing HSTS header
- #6: CSP could be stricter
```

## Fix Options

After presenting findings, offer the user choices for remediation:

```
How would you like to proceed?
C — Critical findings only
W — Critical + warnings
A — All findings
S — Select specific (e.g., "S 1,3,5" to fix findings #1, #3, #5)
```

After selection: apply fixes one at a time, track progress with `**Patch Progress: X/Y**`, present each change for approval before moving to the next.

## Session End Format

```
🔐 [Security Audit Complete]

**Score:** [XX]/100. [X] critical, [Y] warnings, [Z] suggestions across [N] dimensions.

**Next steps (ask user — do not auto-execute):**
- Save report to `specs/audit-reports/security-<date>.md`?
- Fix findings? (use fix options above)
- Related: `/ai-assist-observability-audit`, `/ai-assist-tech-debt`, `/ai-assist-test-audit`
```

## Self-Verification Checklist

Before presenting the final report, verify:
- [ ] All activated dimensions audited; N/A dimensions documented with rationale
- [ ] Audit tools run (or documented why not available)
- [ ] Every finding has file:line reference + CWE
- [ ] Severity reflects real-world exploitability, not theoretical worst case
- [ ] Remediation verified against current framework/library documentation
- [ ] No false positives from aspirational standards — only flag actual risks
- [ ] Positive observations included for balanced assessment
- [ ] Health score calculated correctly with N/A redistribution
