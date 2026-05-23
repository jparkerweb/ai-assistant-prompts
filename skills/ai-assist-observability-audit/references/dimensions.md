# Observability Audit Dimensions

> Part of [ai-assist-observability-audit](../SKILL.md) — loaded during Step 2.

## Tier Activation Table

Detect the project tier and activate applicable dimensions. Tier detection signals:

- **UNIVERSAL:** Any project — always active.
- **SERVICE:** Server framework imports (Express, FastAPI, ASP.NET, Spring), HTTP listener, Dockerfile, Kubernetes manifests, serverless config (AWS SAM, Serverless Framework, Azure Functions).
- **DISTRIBUTED:** Service mesh config (Istio, Linkerd, Envoy), multiple service definitions (docker-compose with 2+ services, K8s with multiple deployments), inter-service communication imports (gRPC, message bus clients, HTTP client libraries used for service-to-service).
- **Conditional — Event-Driven:** MQ imports (RabbitMQ, Kafka, SQS, Azure Service Bus, NATS, Redis Pub/Sub).
- **Conditional — Database:** DB/ORM imports (Entity Framework, Prisma, Sequelize, SQLAlchemy, Dapper, Hibernate, TypeORM, raw DB drivers).

| # | Dimension | UNI | SVC | DIST | Conditional |
|---|-----------|:---:|:---:|:----:|:-----------:|
| 1 | Logging | x | x | x | |
| 2 | Metrics | | x | x | |
| 3 | Distributed Tracing | | x | x | |
| 4 | Health Checks | | x | x | |
| 5 | Alerting | | x | x | |
| 6 | Dashboards | | x | x | |
| 7 | SLIs/SLOs/SLAs | | x | x | |
| 8 | Incident Management | | x | x | |
| 9 | Profiling | x | x | x | |
| 10 | Capacity Planning | | x | x | |
| 11 | Distributed System Obs | | | x | |
| 12 | Event-Driven Obs | | | | message queues |
| 13 | Database Obs | | | | databases |
| 14 | Security Obs | x | x | x | |
| 15 | Cost Obs | | x | x | |
| 16 | Chaos Readiness | | x | x | |
| 17 | Developer Experience | x | x | x | |

**Maturity note:** No observability stack detected — prioritize Dims 1-5 (foundation). Mature projects (existing logging, metrics, tracing in place) — focus on Dims 7, 9, 11, 14-16 (advanced).

## Per-Dimension Check Definitions

Audit each activated dimension using the checks below. For each finding, cite the file:line and applicable dimension. Research current best practices for the detected stack at audit time — do not rely on static version-pinned references.

### 1 — Logging (UNI)

**Tier:** UNIVERSAL
**Standards:** OpenTelemetry Logs, structured logging best practices

**Checks:**
- Structured logging format validation: JSON with required fields — `timestamp`, `level`, `message`, `correlation_id`, `service` (at minimum). Flag unstructured printf/string-concatenation logging.
- Level discipline: Production WARN+ only. DEBUG/INFO only in dev or behind dynamic log level flag (e.g., feature flag, environment variable). Flag always-on DEBUG in production paths.
- PII/secret exposure: Passwords, tokens, SSNs, credit card numbers in log statements — ALWAYS Critical.
- Correlation IDs: Present in all log entries for request tracing. Propagated across async boundaries.
- Log aggregation: Centralized logging configured (ELK, Splunk, Datadog, CloudWatch, Loki).
- Rotation/retention: Log rotation configured. Retention policy defined (compliance-driven).
- Error context: Exceptions logged with stack trace, request context, and correlation ID — not swallowed silently.
- Volume estimation: Estimate log volume. Flag >1GB/month of no-value logs. Examples of no-value: health check access logs at INFO, repetitive heartbeat messages, verbose serialization dumps, successful auth logs for every request.
- Dynamic log levels: Ability to change log level at runtime without redeployment (feature flag, config reload, admin endpoint).
- Log sampling strategies: For high-throughput services (>10K req/s), evaluate whether log sampling is implemented to control volume while preserving visibility on errors and slow requests.

**Cost implications:** Logging is typically the largest telemetry cost. Every 1GB/day of unnecessary logs costs $15-90/month depending on vendor. Identify and quantify no-value log volume.

---

### 2 — Metrics (SVC)

**Tier:** SERVICE
**Standards:** OpenTelemetry Metrics API, Prometheus naming conventions

**Checks:**
- Cardinality analysis: Calculate label product for every custom metric. Flag >10K series = Warning, >100K = Critical. Example: `5 methods x 200 endpoints x 3 status groups x 2 versions = 6K series` — acceptable. Adding `user_id`: `6K x 100K users = 600M series` — Critical, will break metrics backend and cost thousands/month.
- OpenTelemetry Metrics API: Check for OTel SDK configuration — meter provider, metric exporters, instrumentation libraries. Flag vendor-specific SDK lock-in where OTel alternative exists.
- Metric type correctness: Counters for monotonic values, gauges for point-in-time, histograms for distributions. Flag incorrect types (e.g., gauge used for request count).
- Prometheus naming: `<namespace>_<subsystem>_<name>_<unit>` convention. Units as suffix (`_seconds`, `_bytes`, `_total`).
- Cost estimation: `(total series) x (vendor rate per series)`. Identify top 5 most expensive metrics by series count.
- Missing RED metrics: Rate, Errors, Duration for every service endpoint. Flag services without RED coverage.
- Runtime metrics: Language runtime metrics exposed (GC, thread pool, memory, CPU). Flag if absent on JVM/.NET/Go services.
- High-cardinality labels: Flag `user_id`, `request_id`, `session_id`, `email`, `ip_address` as metric labels — these are trace attributes, not metric labels.

**Cost implications:** Metrics cost scales with cardinality. A single high-cardinality label can 100x cost. Calculate series count before/after removing problematic labels.

---

### 3 — Distributed Tracing (SVC/DIST)

**Tier:** SERVICE / DISTRIBUTED
**Standards:** OpenTelemetry SDK, W3C Trace Context

**Checks:**
- Context propagation: W3C Trace Context or B3 headers. Verify propagation across HTTP, gRPC, and message queue boundaries.
- OpenTelemetry SDK config: Verify SDK initialization — tracer provider, span processors (batch vs simple), exporters. Check resource attributes (service.name, service.version, deployment.environment).
- Sampling strategy evaluation: Head-based (deterministic, low overhead, misses rare errors) vs tail-based (captures all errors/slow, higher resource cost) vs rule-based (per-endpoint rules, best balance). Recommend based on traffic volume. Flag 100% sampling in production for services >1K req/s.
- Span naming: Low-cardinality names (e.g., `GET /users/{id}` not `GET /users/12345`). Flag URL path parameters or query strings in span names.
- Sensitive data in spans: PII, credentials, request/response bodies in span attributes — ALWAYS Critical.
- Error recording: Exceptions recorded on spans with status code. Error spans properly marked.
- Coverage: Critical paths instrumented. Flag uninstrumented database calls, external HTTP calls, message queue operations.
- Cross-service correlation (DISTRIBUTED): Trace context propagated between services. End-to-end traces visible in tracing backend.
- Trace-based testing: Evaluate whether trace data is used for integration test assertions or contract testing (advanced capability).

**Cost implications:** Traces are the most expensive telemetry type per GB. 100% sampling at high traffic = massive cost. Calculate: `(requests/day) x (avg spans/request) x (avg span size) x (sampling rate)`.

---

### 4 — Health Checks (SVC)

**Tier:** SERVICE
**Standards:** Kubernetes probe specifications, health check patterns

**Checks:**
- Health endpoints: `/health`, `/healthz`, `/ready`, `/live` endpoints exist.
- Deep health checks: Health endpoint tests real dependencies (database connectivity, cache availability, downstream service reachability) vs shallow (always returns 200). Deep checks should be on readiness, not liveness.
- Liveness vs readiness separation: Liveness = process alive (restart if fails). Readiness = can serve traffic (remove from LB if fails). Flag single endpoint used for both.
- Kubernetes probe config validation: `initialDelaySeconds`, `periodSeconds`, `timeoutSeconds`, `failureThreshold` appropriate for service startup time. Flag liveness probes with external dependencies (causes cascading restarts).
- Startup probes: Present for services with slow initialization (JVM warmup, cache loading, ML model loading).
- Circuit breakers: Dependency failures don't cascade. Circuit breaker state exposed in health.
- Graceful shutdown: SIGTERM handling with connection draining. In-flight requests complete before exit.

**Cost implications:** Missing health checks on production services = undetected outages = revenue impact. No direct telemetry cost, but operational cost of incidents.

---

### 5 — Alerting (SVC)

**Tier:** SERVICE
**Standards:** SLO-based alerting, alert quality metrics

**Checks:**
- Alert rules: Coverage for availability, latency, error rate, resource saturation, dependency health.
- SLO-based alerting: Burn rate alerts recommended over static threshold alerts. Multi-window burn rate (e.g., 1h/5m, 6h/30m) reduces false positives. Flag arbitrary threshold alerts (e.g., "CPU > 80%") without SLO justification.
- Signal-to-noise ratio: Track alert-to-incident ratio. Flag >20 alerts/service/week (alert fatigue). Flag alerts that fire >5x without action taken.
- MTTA (Mean Time to Acknowledge): Measured and tracked. Target <5min for critical, <30min for warning.
- Runbook links: Every alert has a linked runbook with diagnosis steps and remediation actions.
- Escalation policies: Defined escalation paths. On-call rotation configured. Backup responders assigned.
- Alert grouping/deduplication: Related alerts grouped to avoid notification storms during incidents.

**Cost implications:** Poor alerting = longer MTTR = higher incident cost. Alert fatigue = missed critical alerts. No direct telemetry cost.

---

### 6 — Dashboards (SVC)

**Tier:** SERVICE
**Standards:** Golden signals framework, dashboard-as-code

**Checks:**
- Golden signals completeness: Every service dashboard includes all four — Latency (request duration distribution), Traffic (requests/sec), Errors (error rate/count), Saturation (CPU, memory, disk, connections). Flag dashboards missing any golden signal.
- Dashboard-as-code: Dashboards defined in version control (Grafana JSON, Terraform, Pulumi). Flag manually-created dashboards with no code backup.
- Ownership model: Every dashboard has a defined owner (team or individual). Orphaned dashboards flagged for review or deletion.
- Audience segmentation: Separate dashboards for operations (real-time health), engineering (debugging), business (KPIs). Flag single dashboard trying to serve all audiences.
- Stale detection: Flag dashboards not viewed in >90 days. Flag dashboards with broken queries or missing data sources.

**Cost implications:** Dashboard sprawl increases cognitive load and maintenance cost. Stale dashboards waste engineering time when consulted during incidents with outdated information.

---

### 7 — SLIs/SLOs/SLAs (SVC)

**Tier:** SERVICE
**Standards:** OpenSLO specification, SRE practices

**Checks:**
- SLI definition: Service Level Indicators defined using OpenSLO or equivalent (Sloth, Pyrra). SLIs based on user-facing behavior (availability, latency, correctness), not infrastructure metrics.
- SLO targets: Targets set with rolling window (28-day or 30-day). Targets realistic (not 100%). Flag missing SLOs on customer-facing services.
- Error budget policy: Documented policy for when error budget is exhausted — freeze feature releases, redirect engineering to reliability. Flag SLOs without error budget policies.
- SLA alignment: Internal SLOs stricter than external SLAs (buffer). SLAs backed by measured SLOs.
- OpenSLO compliance: SLO definitions follow OpenSLO spec format where tooling supports it. Enables portability across SLO platforms.
- Revision cadence: SLOs reviewed and adjusted quarterly (minimum). Flag SLOs unchanged for >6 months without explicit "no change needed" decision.

**Cost implications:** Missing SLOs = no objective measure of reliability = over-engineering (waste) or under-engineering (outages). Error budget policies prevent both.

---

### 8 — Incident Management (SVC)

**Tier:** SERVICE
**Standards:** DORA metrics, blameless post-mortem practices

**Checks:**
- Automated detection: Incidents auto-detected from alerts, not user reports. Flag services where incidents are primarily user-reported.
- Runbook coverage: >80% of alerting rules have linked runbooks. Runbooks tested within last 6 months.
- Timeline tooling: Incident timeline automatically constructed from alerts, deployments, and changes.
- Post-incident reviews: Blameless post-mortem conducted for every Critical/P1 incident. Flag teams without post-mortem practice.
- Blameless post-mortem template check: Template includes timeline, impact, root cause, contributing factors, action items with owners and due dates. Flag templates missing action item tracking.
- DORA metrics tracking: Deployment Frequency, Lead Time for Changes, Change Failure Rate, Mean Time to Recovery. Flag if DORA metrics are not measured. Research current DORA report for industry benchmarks.
- MTTR (Mean Time to Recovery): Tracked per service. Trending over time. Target based on service tier.

**Cost implications:** Poor incident management = longer outages = direct revenue impact. DORA metrics correlate with organizational performance. Quantify average incident cost where data available.

---

### 9 — Profiling (UNI)

**Tier:** UNIVERSAL
**Standards:** Continuous profiling practices

**Checks:**
- Continuous profiling tools per language: Go (`pprof` built-in, Pyroscope), Java (`async-profiler`, Pyroscope, Datadog Continuous Profiler), Python (`py-spy`, Pyroscope), .NET (`dotnet-trace`, `dotnet-counters`, Datadog Continuous Profiler), Node.js (`clinic.js`, `0x`, Pyroscope). Flag if no profiling capability exists.
- CPU/memory/IO profiling: All three profile types available. Flag memory-only or CPU-only.
- Production safety: Profiling overhead <2% CPU in production. Flag profiling configurations that use high-frequency sampling or full instrumentation in production. Continuous profilers (Pyroscope, Datadog) designed for production; ad-hoc tools (strace, full JFR) should be on-demand only.
- Retention: Profile data retained 7-14 days minimum for regression analysis.
- Flame graph access: Engineers can access flame graphs without production SSH. Self-service profiling UI available.
- On-demand profiling: Ability to trigger ad-hoc profiles on production instances for incident debugging without redeployment.

**Cost implications:** Continuous profiling typically $0-0.50/host/month. Prevents performance regressions that cause capacity waste (over-provisioning to compensate for inefficient code).

---

### 10 — Capacity Planning (SVC)

**Tier:** SERVICE
**Standards:** Resource management, capacity planning methodology

**Checks:**
- Utilization metrics: CPU, memory, disk, network utilization tracked per service/pod. Historical data retained for trend analysis.
- Auto-scaling: HPA/VPA configured where applicable. Scaling policies based on relevant metrics (not just CPU). Scale-down behavior tested.
- Growth projection methodology: Traffic growth modeled (linear, seasonal, event-driven). Capacity reviewed before expected traffic events (launches, campaigns, migrations).
- Saturation alerts: Alerts on resource saturation — disk >80%, memory >85%, connection pool >90%, queue depth growing. Flag missing saturation alerts.
- Right-sizing: Current resource requests/limits compared to actual usage. Flag over-provisioned services (using <30% of requested resources consistently) and under-provisioned (regularly hitting limits). Quantify waste.

**Cost implications:** Over-provisioning wastes infrastructure spend directly. Under-provisioning causes outages. Right-sizing typically yields 20-40% infrastructure cost reduction. Quantify per-service waste where data available.

---

### 11 — Distributed System Obs (DIST)

**Tier:** DISTRIBUTED
**Standards:** Service catalog practices, distributed tracing correlation

**Checks:**
- Service catalog completeness: Every service registered with ownership, dependencies, SLOs, on-call team, communication protocol, API docs. Flag services missing from catalog. Check for Backstage, OpsLevel, or equivalent.
- Dependency mapping: Service dependency graph generated from actual traffic (trace data), not manually maintained. Flag manual-only dependency maps.
- Distributed tracing correlation validation: End-to-end traces span all services in a request path. Verify trace context propagated across HTTP, gRPC, message queue, and database boundaries. Flag broken trace propagation.
- Mesh telemetry (if service mesh present): Per-edge RED metrics (rate, errors, duration between service pairs). mTLS status per connection. Retry/timeout/circuit breaker metrics.
- Cross-service SLOs: Composite SLOs defined for critical user journeys spanning multiple services. Flag journey-level SLOs missing.

**Cost implications:** Distributed systems multiply observability cost (N services x telemetry per service). Service catalog reduces MTTR. Broken trace propagation = engineers manually correlating logs during incidents.

---

### 12 — Event-Driven Obs (Conditional — Message Queues)

**Tier:** Conditional (activated when MQ imports detected: RabbitMQ, Kafka, SQS, Azure Service Bus, NATS, Redis Pub/Sub)
**Standards:** Event-driven architecture observability patterns

**Checks:**
- Consumer lag monitoring: Consumer lag tracked per consumer group and topic/queue. Lag trending over time.
- Consumer lag alerting thresholds: Alerts configured for lag exceeding acceptable thresholds (e.g., >1000 messages or >5 minutes behind). Thresholds based on SLO requirements, not arbitrary.
- DLQ (Dead Letter Queue) alerts: DLQ message count monitored. Alert on any DLQ messages for critical flows. DLQ processing/replay strategy documented.
- Broker health: Broker metrics monitored — partition count, ISR (in-sync replicas), disk usage, connection count. Alert on broker health degradation.
- Event trace context: Trace context propagated through message headers. Events appear in distributed traces. Flag broken propagation.
- RED per event type: Rate, errors, duration tracked per event type/topic. Flag event types without observability.
- Poison message handling: Detection and isolation of messages that repeatedly fail processing. Max retry configuration. Alert on poison messages.
- Event schema registry: Schema registry (Confluent, AWS Glue, Apicurio) in use for schema evolution. Schema compatibility validation. Flag schemaless event systems at scale.

**Cost implications:** Unmonitored consumer lag = silent data processing delays = SLO violations. DLQ buildup = lost business events. Quantify impact of processing delays.

---

### 13 — Database Obs (Conditional — Databases)

**Tier:** Conditional (activated when DB/ORM imports detected)
**Standards:** Database performance monitoring practices

**Checks:**
- Slow query logging: Slow query threshold configured (typically 100ms-1s depending on workload). Slow queries aggregated and alerted on.
- Query plan analysis: Ability to capture and analyze query execution plans for slow queries. EXPLAIN/ANALYZE accessible without production SSH. Flag if query plans are not monitored.
- Connection pool monitoring: Pool size, active connections, wait time, timeout count monitored. Alert on pool exhaustion (active = max). Connection leak detection (connections not returned).
- Database metrics: QPS (queries per second), replication lag, lock contention, cache hit ratio, table/index size, deadlocks. Flag missing critical metrics.
- Migration tracking: Schema migrations tracked with version, timestamp, and rollback capability. Alert on failed migrations.
- Index usage: Unused indexes identified (write cost without read benefit). Missing indexes identified from slow query analysis. Flag index bloat.

**Cost implications:** Slow queries at scale consume database resources disproportionately. Connection pool exhaustion causes cascading failures. Unused indexes waste storage and slow writes.

---

### 14 — Security Obs (UNI)

**Tier:** UNIVERSAL
**Standards:** NIST logging guidance, SIEM integration practices

**Checks:**
- Immutable audit trail: Authentication events (login, logout, failed attempts), authorization decisions (access granted/denied), data access events (read/write on sensitive data), configuration changes. Required for SOC2, HIPAA, PCI-DSS compliance.
- Access logging: API access logged with user identity, action, resource, timestamp, source IP. Retention per compliance requirements.
- Anomaly signals: Unusual patterns detectable — brute force attempts, privilege escalation, off-hours access, impossible travel. Baseline behavior established.
- Sensitive data classification: Data classification scheme applied. Logging/telemetry respects classification (no PII in standard logs).
- SIEM integration: Security events forwarded to SIEM (Splunk, Sentinel, Chronicle, Elastic Security). Correlation rules defined for known attack patterns. Alert on security-relevant events.
- Security event correlation: Ability to correlate security events across services — e.g., failed auth on service A followed by successful auth on service B with same source. Requires consistent identity fields across services.
- Compliance audit readiness: Audit logs exportable in compliance-required format. Retention meets regulatory requirements. Tamper-evident logging.

**Cost implications:** Security observability is compliance-driven — cost of not having it = audit failures, fines, breach liability. SIEM ingestion costs can be significant — log only security-relevant events, not all application logs.

---

### 15 — Cost Obs (SVC)

**Tier:** SERVICE
**Standards:** OpenCost, FinOps practices

**Checks:**
- Resource tagging: All cloud resources tagged with service, team, environment, cost center. Flag untagged resources.
- Ingestion tracking: Telemetry ingestion volume tracked per service, per signal type (logs, metrics, traces). Dashboard showing ingestion trends.
- Per-team cost attribution: Observability costs attributed to owning teams. Teams can see their own telemetry spend. Flag shared/unattributed costs.
- OpenCost/Kubecost integration: For Kubernetes workloads, OpenCost or Kubecost deployed for real-time cost visibility. Cost allocation by namespace, deployment, pod. Flag K8s environments without cost tooling.
- Cost anomaly detection: Alerts on sudden cost spikes (>20% increase day-over-day or week-over-week). Anomaly detection on telemetry ingestion volume.
- Storage tiering: Hot/warm/cold storage tiers configured for telemetry data. Recent data in hot tier, older data in cold. Flag single-tier storage for all retention periods.
- FinOps practices: Regular cost reviews (monthly minimum). Cost optimization tracked as engineering work. Showback or chargeback model in place.

**Cost implications:** This dimension IS the cost dimension. Unmanaged observability costs grow 30-50% year-over-year. Per-team attribution creates accountability. Cost anomaly detection catches misconfigurations early.

---

### 16 — Chaos Readiness (SVC/DIST)

**Tier:** SERVICE / DISTRIBUTED
**Standards:** Chaos engineering principles

**Checks:**
- Failure injection capability: Tools available for controlled failure injection. Recommended tools: Chaos Monkey (random instance termination), Litmus (Kubernetes-native chaos), Gremlin (enterprise chaos platform), AWS Fault Injection Simulator, Azure Chaos Studio.
- Circuit breakers: Implemented on all external dependencies. Circuit breaker state observable (open/closed/half-open metrics). Fallback behavior defined and tested.
- Timeouts: Every external call has explicit timeout. No infinite waits. Timeout values appropriate for dependency SLOs.
- Retry with backoff: Exponential backoff with jitter on retryable failures. Max retry limits configured. Flag retry without backoff (thundering herd risk).
- Blast radius containment: Bulkhead pattern applied. Failure in one dependency doesn't cascade. Resource isolation between tenants/workloads.
- Game day checklist: Regular chaos game days conducted (quarterly minimum). Checklist includes: hypothesis documented, blast radius limited, rollback plan ready, monitoring in place, stakeholders notified, findings documented and tracked to resolution. Flag if no game days have been conducted.
- Observability during chaos: Ability to observe system behavior during failure injection. Dashboards and alerts function correctly under degraded conditions.

**Cost implications:** Chaos engineering prevents costly outages. Game days have direct engineering time cost but prevent significantly larger incident costs. Circuit breakers prevent cascading failures that multiply infrastructure cost.

---

### 17 — Developer Experience (UNI)

**Tier:** UNIVERSAL
**Standards:** Developer productivity, observability-as-code practices

**Checks:**
- Local dev observability stack: Developers can run observability stack locally (docker-compose with Jaeger/Grafana/Loki or similar). Flag if observability only works in deployed environments. Evaluate ease of setup (single command vs multi-step manual process).
- Documentation: Runbooks for on-call (diagnosis + remediation per alert). Onboarding guide covers observability tooling. Architecture diagrams include telemetry flows.
- Log/trace search: Engineers can search logs and traces without production SSH. Self-service query UI (Kibana, Grafana Explore, Datadog). Response time <10s for common queries.
- On-call quality: On-call rotation defined. Pages are actionable (not noise). Handoff procedures documented. Post-on-call review of page quality.
- Observability-as-code maturity: Dashboards, alerts, SLOs defined in version control and deployed via CI/CD. Flag manually-configured observability that can't be reproduced. Levels: (1) manual only, (2) partially codified, (3) fully codified with CI/CD, (4) self-service platform.
- SDK abstractions: Shared observability libraries/SDKs that standardize instrumentation across services. Developers don't need to know vendor-specific APIs. Flag each service implementing its own instrumentation from scratch.
- Feedback loops: Engineers can see telemetry from their changes in pre-production environments. Observability is part of the development inner loop, not an afterthought discovered in production.

**Cost implications:** Poor DX = inconsistent instrumentation = gaps and waste. Shared SDKs reduce per-service instrumentation cost. Observability-as-code prevents drift and enables review.
