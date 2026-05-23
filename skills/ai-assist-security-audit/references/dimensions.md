# Security Audit Dimensions

> Part of [ai-assist-security-audit](../SKILL.md) — loaded during Step 2.

## Dimension Activation Table

Detect the project type and activate applicable dimensions. ALL projects always get dimensions 1, 5, 6, 8, 15. Other dimensions activate based on project type.

| # | Dimension | ALL | W | A | M | CLI | LIB | IaC |
|---|-----------|:---:|:-:|:-:|:-:|:---:|:---:|:---:|
| 1 | App Security | x | | | | | | |
| 2 | Infrastructure | | x | x | | | | x |
| 3 | Network/Transport | | x | x | x | | | x |
| 4 | Database Security | | x | x | | | | |
| 5 | CI/CD Pipeline | x | | | | | | |
| 6 | Supply Chain | x | | | | | | |
| 7 | Auth & Authz | | x | x | x | | | |
| 8 | Cryptography | x | | | | | | |
| 9 | Data Privacy | | x | x | x | | | |
| 10 | Business Logic | | x | x | x | | | |
| 11 | API Security | | x | x | x | | x | |
| 12 | Client-Side | | x | | x | | | |
| 13 | Denial of Service | | x | x | | x | x | |
| 14 | Logging/Monitoring | | x | x | | x | | x |
| 15 | Secrets Mgmt | x | | | | | | |
| 16 | Third-Party | | x | x | x | | | x |

W=Web, A=API, M=Mobile.

## Scope Detection

Determine audit scope from user input and context:

| Scope | Trigger | Assesses |
|-------|---------|----------|
| **Focused** | Named vulnerability, endpoint, or component | Specified attack surface only |
| **Branch** | "review my PR" or diff context | Branch changes vs main |
| **Full** | "security audit" or default | Entire codebase or subsystem |

Priority order: 1) User prompt specifies scope, 2) Context implies focused, 3) Fallback = full.

## Per-Dimension Check Definitions

Audit each activated dimension using the checks below. For each finding, cite the file:line and applicable CWE. Research the current CWE database at audit time — do not rely on a static list.

### 1 — App Security (ALL)

**Checks:**
- Injection: SQL, NoSQL, OS command, SSTI, LDAP, XPath
- Server-Side Request Forgery (SSRF) — internal network access via user-controlled URLs
- Input validation: whitelist vs blacklist, type coercion, boundary values
- Output encoding: context-appropriate (HTML, JS, URL, CSS)
- Deserialization: unsafe deserialize of untrusted data
- File handling: path traversal, unrestricted upload, type validation
- Information leakage: stack traces, debug endpoints, verbose errors
- Eval/exec: dynamic code execution from user input
- Mass assignment: unprotected model binding
- XXE: XML external entity processing
- Prototype pollution (JavaScript targets): `__proto__`, `constructor.prototype` manipulation

**Key CWEs:** CWE-79 (XSS), CWE-89 (SQLi), CWE-78 (OS Command), CWE-94 (Code Injection), CWE-502 (Deserialization), CWE-434 (Unrestricted Upload), CWE-22 (Path Traversal), CWE-915 (Mass Assignment), CWE-611 (XXE), CWE-918 (SSRF), CWE-1321 (Prototype Pollution)

**Common false positives:** Parameterized queries flagged as SQLi. Sanitized output flagged as XSS. Internal-only debug endpoints behind auth.

### 2 — Infrastructure (W/A/IaC)

**Checks:**
- Containers: running as root, secrets in build args/layers, base image currency and provenance
- Supply chain attacks on container base images: verify image signatures, use pinned digests not tags
- Kubernetes: privileged pods, RBAC scope, network policies, admission controllers (OPA/Kyverno), pod security standards
- IaC: public storage buckets, open security groups, IAM wildcards, unencrypted resources
- Secrets in infrastructure code: terraform vars, Dockerfiles, compose files

**Key CWEs:** CWE-732 (Incorrect Permission), CWE-250 (Unnecessary Privileges)

**Common false positives:** Dev-only Dockerfiles with root user. IaC modules that are overridden by environment-specific configs.

### 3 — Network/Transport (W/A/M/IaC)

**Checks:**
- TLS 1.2+ enforced with strong cipher suites (no RC4, 3DES, CBC mode preferred against)
- TLS 1.3 adoption status and recommendations
- HTTP/2 and HTTP/3 considerations (header compression attacks, connection coalescing)
- HSTS with includeSubDomains and preload
- Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- CORS: no wildcard origins in production, credential handling
- CSP: nonce or hash based, no unsafe-inline/unsafe-eval
- Cookie flags: Secure, HttpOnly, SameSite=Lax/Strict
- Certificate management: expiry monitoring, pinning risks
- Internal service communication: mTLS where applicable

**Key CWEs:** CWE-326 (Inadequate Encryption Strength), CWE-942 (Permissive CORS)

**Common false positives:** Dev server without TLS. CORS wildcard on public CDN assets.

### 4 — Database Security (W/A)

**Checks:**
- NoSQL injection (MongoDB `$where`, `$regex`), Redis command injection
- ORM-specific injection patterns: Prisma raw queries, Sequelize literal, Entity Framework `FromSqlRaw`, Dapper inline SQL
- Connection string security: credentials in connection strings, SSL/TLS for database connections
- Connection pooling: max connections, idle timeout, connection leak detection
- Access control: principle of least privilege, application-specific DB users
- Encryption at rest: transparent data encryption, column-level encryption for PII
- Query logging: ensure no PII in slow query logs
- Backup security: encryption, access controls, restoration testing
- Migration safety: irreversible migrations, data loss risks

**Key CWEs:** CWE-943 (NoSQL Injection), CWE-89 (SQL Injection), CWE-312 (Cleartext Storage)

**Common false positives:** Parameterized ORM queries. Dev connection strings in .env.example.

### 5 — CI/CD Pipeline (ALL)

**Checks:**
- Build integrity: research the current SLSA specification at audit time. Assess against the applicable level.
- GitHub Actions: `permissions` block (restrict to least privilege), `GITHUB_TOKEN` scope, third-party action pinning (SHA not tag), `pull_request_target` risks
- Pipeline permissions: who can modify workflows, approval requirements
- Fork PR secrets: secrets not exposed to fork PRs
- SBOM generation: CycloneDX or SPDX output in pipeline
- Dependency pinning: SHA pinning for actions and base images
- Branch protection: required reviews, status checks, no force push
- OIDC for deployments: short-lived credentials over long-lived secrets

**Key CWEs:** CWE-829 (Inclusion of Untrusted Functionality)

**Common false positives:** Permissive permissions in dev/test workflows only.

### 6 — Supply Chain (ALL)

**Checks:**
- Run audit tool (`npm audit`, `pip-audit`, `cargo audit`, `govulncheck`, `dotnet list package --vulnerable`)
- CVE scanning: known vulnerabilities in direct and transitive dependencies
- Lockfile integrity: lockfile exists, matches manifest, committed to repo
- Version pinning: exact versions preferred over ranges
- Post-install scripts: review for malicious behavior
- Typosquatting detection: check for commonly confused package names
- Maintainer trust: abandoned packages (no updates in 2+ years), single-maintainer risk
- License compliance: incompatible licenses (GPL in proprietary code)
- Unused dependencies: packages in manifest but not imported
- SBOM generation requirements: ensure software bill of materials is producible
- Transitive risk: critical dependencies deep in the tree

**Key CWEs:** CWE-1395 (Dependency on Vulnerable Component), CWE-829 (Untrusted Functionality)

**Common false positives:** Dev-only dependencies with CVEs that don't ship to production.

### 7 — Auth & Authz (W/A/M)

**Checks:**
- Sessions: entropy (min 128-bit), fixation on login, absolute/idle timeouts, secure storage
- OAuth/OIDC: PKCE required for public clients, state parameter, redirect URI validation (exact match)
- Passkey/WebAuthn: if applicable, verify attestation handling, credential storage
- JWT: reject `alg:none`, verify signature with correct key, validate expiry/audience/issuer, no sensitive data in payload
- Password hashing: Argon2id (preferred), bcrypt (min cost 10), scrypt. No MD5/SHA for passwords.
- MFA: available for privileged accounts, recovery flow security
- RBAC/ABAC: authorization check on every endpoint, default-deny
- IDOR: direct object references protected by ownership checks

**Key CWEs:** CWE-384 (Session Fixation), CWE-601 (Open Redirect), CWE-327 (Broken Crypto), CWE-285 (Improper Authorization), CWE-639 (IDOR)

**Common false positives:** Internal admin tools with different auth requirements. Service-to-service auth via mTLS instead of JWT.

### 8 — Cryptography (ALL)

**Checks:**
- No MD5 or SHA1 for security purposes (acceptable for checksums/cache keys)
- Minimum key sizes: AES-128+, RSA-2048+, ECDSA P-256+. Research current NIST recommendations.
- Post-quantum readiness (informational): note if post-quantum algorithms are relevant to the project's timeline
- Key management: no hardcoded keys, rotation policy, separation of environments
- Cryptographic RNG: `crypto.randomBytes` / `secrets` module / `RandomNumberGenerator`, not `Math.random`
- Authenticated encryption: GCM mode preferred, no ECB mode
- HMAC: constant-time comparison to prevent timing attacks
- Certificate handling: proper chain validation, no disabled verification

**Key CWEs:** CWE-321 (Hard-coded Key), CWE-327 (Broken Crypto), CWE-330 (Insufficient Randomness), CWE-328 (Weak Hash)

**Common false positives:** MD5 used for non-security purposes (cache keys, ETags). Test fixtures with hardcoded keys.

### 9 — Data Privacy (W/A/M)

**Checks:**
- PII identification in data models: names, emails, SSNs, phone numbers, addresses, IP addresses
- Data minimization: collecting only what's needed, for stated purposes
- Deletion capabilities: cascade deletion across related tables, backups, caches, logs
- Consent management: opt-in/opt-out mechanisms, preference storage
- Retention policies: TTLs on data, automated cleanup
- Cross-border data transfer: data residency compliance
- Data lineage to logs: ensure PII doesn't leak into log files
- AI/ML data handling: training data privacy, embedding storage, prompt/response logging
- Data Subject Access Requests (DSAR): ability to export/delete individual user data
- Applicable regulations: GDPR, HIPAA, PCI-DSS, CCPA, SOC2

**Key CWEs:** CWE-532 (Information Exposure Through Log), CWE-359 (Privacy Violation)

**Common false positives:** Internal analytics with anonymized data. Test fixtures with fake PII.

### 10 — Business Logic (W/A/M)

**Checks:**
- Race conditions: concurrent requests to same resource, double-submit
- TOCTOU: time-of-check vs time-of-use vulnerabilities
- State manipulation: skipping workflow steps, replaying completed actions
- Parameter tampering: price, role, status, quantity modification
- IDOR: accessing resources by manipulating identifiers
- Numeric issues: negative values, integer overflow, floating-point precision in financial calculations
- Workflow integrity: replay attacks, step-skipping, forced browsing
- AI-specific logic flaws: prompt manipulation affecting business rules, LLM output used in authorization decisions

**Key CWEs:** CWE-362 (Race Condition), CWE-367 (TOCTOU), CWE-915 (Mass Assignment), CWE-639 (IDOR)

**Common false positives:** Idempotent operations that handle duplicate submissions. Read-only IDOR (public resources).

### 11 — API Security (W/A/M/LIB)

**Checks:**
- Rate limiting: per-user, per-endpoint, global. Retry-After headers.
- Schema enforcement: request validation (Joi/Zod/Pydantic/FluentValidation), response filtering
- Output filtering: no internal fields in API responses, pagination limits
- API gateway security: authentication at gateway, request transformation, logging
- GraphQL-specific: query depth limiting, complexity analysis, introspection disabled in production, field-level authorization, persisted queries
- Webhooks: signature verification, replay protection (timestamp validation)
- Error responses: no stack traces, no internal details, consistent error format
- Versioning: breaking change management, deprecation policy
- Research and apply the current OWASP API Security standard at audit time.

**Key CWEs:** CWE-400 (Resource Exhaustion), CWE-209 (Error Information Leak)

**Common false positives:** Internal APIs between trusted services with relaxed rate limits.

### 12 — Client-Side (W/M)

**Checks:**
- XSS: DOM-based, mutation-based, stored, reflected. Check all user input rendering paths.
- CSP: nonce or hash based, no unsafe-inline, no unsafe-eval. Report-uri configured.
- Trusted Types API: recommended for DOM XSS prevention in modern browsers
- SRI (Subresource Integrity): on all CDN-hosted scripts and stylesheets
- Supply chain attacks on CDN resources: verify integrity of externally hosted assets
- Prototype pollution: `Object.create(null)` for lookup objects, input sanitization
- DOM safety: `postMessage` origin validation, `innerHTML` avoidance
- Client-side storage: no secrets in localStorage/sessionStorage, cookie security
- CSRF: token validation, SameSite cookies, custom headers

**Key CWEs:** CWE-79 (XSS), CWE-1321 (Prototype Pollution), CWE-352 (CSRF)

**Common false positives:** Server-rendered pages with no client-side JS. Sanitized innerHTML usage.

### 13 — Denial of Service (W/A/CLI/LIB)

**Checks:**
- ReDoS: catastrophic backtracking in regex patterns
- Unbounded allocation: arrays/buffers sized by user input without limits
- Connection exhaustion: missing connection pool limits, idle timeout
- Algorithmic complexity: hash collision attacks, XML/zip bombs, billion laughs
- File upload limits: max size, max count, streaming validation
- Queue exhaustion: unbounded job queues, missing dead-letter handling
- Infinite loops: user-controlled loop bounds
- AI/LLM-specific DoS: token exhaustion (unlimited prompt length), model inference abuse (no rate limiting on LLM calls)

**Key CWEs:** CWE-400 (Resource Exhaustion), CWE-1333 (ReDoS)

**Common false positives:** Internal batch processing with intentionally large allocations. Admin-only upload endpoints with higher limits.

### 14 — Logging/Monitoring (W/A/CLI/IaC)

**Checks:**
- No sensitive data in logs: passwords, tokens, PII, credit card numbers (SOC2/HIPAA audit trail requirements)
- Log injection: newline injection, JNDI lookup injection (Log4j lessons learned — no user input in log format strings)
- Structured logging security: ensure log format strings are static, user input only in data fields
- Tamper resistance: centralized logging, append-only storage
- Security alerting: alerts on auth failures, privilege escalation, anomalous patterns
- No debug logging in production: no verbose/trace level, no request body logging
- Auth path error handling: consistent error messages (no user enumeration)
- Audit trail: sufficient detail for forensic investigation

**Key CWEs:** CWE-532 (Log Information Exposure), CWE-117 (Log Injection)

**Common false positives:** Dev/test environments with verbose logging. Sanitized log entries that look like they contain PII.

### 15 — Secrets Management (ALL)

**Checks:**
- Hardcoded secrets: API keys, passwords, tokens, connection strings in source code
- Cloud-specific patterns: AWS `AKIA*` access keys, GCP service account JSON keys, Azure tenant IDs and client secrets
- Git history: secrets committed and removed (still in history)
- Environment variables: not logged, not in Dockerfile ENV, not in client-side bundles
- `.env` files: not committed, `.gitignore` includes `.env*`
- Rotation: rotation policy exists, no indefinite tokens
- Vault/secret manager: centralized secret storage, not filesystem
- Scoping: secrets scoped to minimum required permissions
- Default credentials: unchanged default passwords in configs

**Key CWEs:** CWE-798 (Hard-coded Credentials), CWE-312 (Cleartext Storage)

**Common false positives:** Example/placeholder values in `.env.example`. Test fixtures with fake credentials.

### 16 — Third-Party Integrations (W/A/M/IaC)

**Checks:**
- OAuth callbacks: redirect URI validation (exact match, no open redirects), state parameter, PKCE
- Webhook signatures: HMAC verification, timestamp validation for replay protection
- API key scoping: minimum required permissions, key rotation
- SDK versions: current, no known vulnerabilities
- SSO/SAML: assertion validation, signature verification, replay protection
- Payments: PCI DSS compliance (SAQ level), no card data in logs
- Email: SPF, DKIM, DMARC configuration
- AI/LLM provider security: API key scoping, data retention policies, prompt/response logging controls

**Key CWEs:** CWE-601 (Open Redirect), CWE-287 (Improper Authentication)

**Common false positives:** Test webhook endpoints without signature verification. Dev-only OAuth with relaxed redirect URIs.

## STRIDE Threat Model

Use STRIDE during attack surface mapping (Step 1) to ensure comprehensive coverage:

| Threat | Focus | Key Questions |
|--------|-------|---------------|
| **Spoofing** | Identity claims, auth mechanisms | Can an attacker impersonate a user or service? Are tokens validated? Is the identity source trustworthy? |
| **Tampering** | Data integrity, input validation | Can data be modified in transit or at rest? Are inputs validated? Are checksums/signatures verified? |
| **Repudiation** | Audit logging, non-repudiation | Can actions be traced to actors? Are logs tamper-resistant? Is there sufficient audit detail? |
| **Information Disclosure** | Data exposure, error messages | What data is visible to unauthorized parties? Do errors leak internals? Is data encrypted appropriately? |
| **Denial of Service** | Resource exhaustion, rate limiting | Can an attacker exhaust resources? Are there rate limits? Are queues bounded? |
| **Elevation of Privilege** | Authorization, role boundaries | Can a user gain higher privileges? Are roles enforced server-side? Is default-deny in place? |

## AI/LLM Security Checks

**Applies when:** AI or LLM components detected (imports of `openai`, `anthropic`, `langchain`, `llama-index`, `transformers`, LLM API calls, embedding generation, RAG pipelines).

Research the latest OWASP Top 10 for LLM Applications at https://genai.owasp.org at audit time. Apply the **full current standard**, not just the top 10 summary. Do not hardcode a specific version — the standard evolves frequently.

**Minimum baseline checks** (persist across standard versions):

### Prompt Injection
- **Direct:** User input concatenated into system prompts without sanitization
- **Indirect:** External data (web pages, documents, database content) incorporated into prompts
- **Where to look:** Prompt construction functions, template strings, RAG retrieval pipelines
- **CWE mapping:** Research current CWE catalog for injection-related entries

### Sensitive Data Exposure
- **Prompts:** PII, credentials, or proprietary data sent to LLM APIs
- **Logs:** Prompt/response pairs logged without redaction
- **Training data:** Sensitive data in fine-tuning datasets
- **Where to look:** API call wrappers, logging middleware, training data pipelines

### Output Handling
- **Sanitization:** LLM output rendered in UI without escaping (XSS via LLM)
- **Validation:** LLM output used in code execution, database queries, or system commands
- **Where to look:** Response rendering, tool/function call execution, code generation pipelines

### Excessive Agency
- **Tool permissions:** LLM agents with write access to production systems
- **Scope limitations:** Missing guardrails on what actions the LLM can take
- **Where to look:** Tool definitions, function calling configs, agent loop implementations

### Supply Chain
- **Model provenance:** Source and integrity of model files
- **Plugin/tool security:** Third-party plugins with excessive permissions
- **Where to look:** Model download scripts, plugin registries, MCP server configurations

### Resource Exhaustion
- **Token limits:** No maximum on prompt length or response generation
- **Rate limiting:** No per-user limits on LLM API calls
- **Cost controls:** No spending caps or alerting on API usage
- **Where to look:** API gateway config, token counting middleware, billing dashboards
