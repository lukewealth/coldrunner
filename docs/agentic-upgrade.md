# Agentic Engineering Upgrade: FreeLLMAPI + ColdRunners

## Goal

Integrate FreeLLMAPI through a server-side OpenAI-compatible client while preserving ColdRunners' existing agent and plugin architecture. Add web research and MCP capabilities as explicit, policy-controlled tools.

## Current implementation added

- `src/server/llm/provider.ts`: server-side gateway client with model discovery, chat completions, timeout/cancellation, normalized results, and safe error messages.
- `docs/SECURITY-REVIEW-2026-10.md`: documents the unsafe remote-code-evaluation startup path that must be addressed before executing the app.

This module is intentionally not mounted into the HTTP API until the existing startup security issue is addressed and routes can be safely wired.

## Configuration

Add to the local, untracked `.env` file:

```dotenv
LLM_PROVIDER=freellmapi
LLM_BASE_URL=http://localhost:3001/v1
LLM_API_KEY=replace-with-local-gateway-key
LLM_DEFAULT_MODEL=auto
LLM_REQUEST_TIMEOUT_MS=60000
WEB_SEARCH_ENABLED=true
AGENT_MAX_STEPS=12
AGENT_MAX_TOOL_CALLS=30
AGENT_REQUIRE_APPROVAL=true
```

Do not commit real values. The API key must never be sent to the browser.

## Gateway setup

1. Install and run FreeLLMAPI using the current upstream installation guide.
2. Configure the free-tier provider accounts and search engines actually supported by the installed gateway version.
3. Verify `GET /v1/models` returns the currently available model IDs.
4. Verify `POST /v1/chat/completions` works with one of those IDs before connecting it to agents.
5. Treat quotas, model availability, tool calling, and web search as provider/version dependent; do not assume all free models support every capability.

## API integration

Create a dedicated route module (for example `src/server/routes/llm.ts`) and mount it from the trusted Express application after the startup security issue has been remediated.

Suggested endpoints:
- `GET /api/llm/status`: configured state and sanitized health only.
- `GET /api/llm/models`: model IDs returned by the gateway.
- `POST /api/llm/chat`: authenticated chat/completion request with request schema validation and server-side limits.

Do not create an unauthenticated arbitrary proxy to the gateway. Apply auth, per-user rate limits, message-size limits, model allowlists, and audit logging. Do not return secrets or raw provider error bodies.

## Agent tool-calling loop

The model may propose a tool call, but the runtime must own execution:

1. Build a request using a bounded task context and an allowlisted tool catalogue.
2. Ask the model for a response/tool call.
3. Validate tool name and arguments against the registered JSON Schema.
4. Check user permissions and approval policy.
5. Execute the tool through the existing plugin/MCP registry.
6. Append the structured result to the conversation.
7. Repeat until completion, cancellation, or the step/tool-call budget is exhausted.
8. Verify the final result and preserve source provenance.

Never pass model output to `eval`, a shell, or a dynamic import. Treat tool output and web content as untrusted instructions.

## Web search

ColdRunners already has SearXNG/SurfSense-related service modules. Implement a common `WebSearchProvider` interface and adapt the actual configured search providers behind it. The LLM gateway's search tools may be added as another adapter only after confirming the installed version's tool schema and response format.

Normalize results to include title, URL, snippet, source, and timestamp when available. Preserve citations/provenance. If search is unavailable, return an explicit unavailable/error state instead of fabricated results.

## MCP Control Center

Build the UI around a server-side connector registry. Each connector should expose:
- Name, transport, endpoint/command reference, status, last health check.
- Discovered tools and input schemas.
- Secret reference (never the secret value).
- Per-tool permissions and approval requirement.
- Execution history and sanitized errors.

Use read-only access by default. Require explicit approval for external messages, destructive operations, shell execution, and other consequential actions. Avoid arbitrary command execution and validate remote endpoints against SSRF.

## Implementation sequence

1. Contain and remove the unsafe startup code after confirming intended behavior; audit the obfuscated `api.js` and package scripts without executing them.
2. Validate the new gateway client with isolated unit tests and a mocked OpenAI-compatible HTTP server.
3. Add authenticated LLM routes and model health/status UI.
4. Add web-search adapter and source-citation UI.
5. Add bounded tool-calling orchestration and MCP connector management.
6. Persist run state and tool-call audit events; add cancellation, retry, and idempotency.
7. Run type-check, tests, build, dependency audit, and security review before deployment.

## Acceptance criteria

- Gateway API key remains server-side.
- Model discovery and inference work against a verified gateway.
- Tool calls are schema-validated, authorized, bounded, and auditable.
- Web results preserve source URLs and distinguish real results from fallbacks.
- MCP connectors can be inspected, permissioned, health-checked, and disabled.
- Existing startup no longer fetches and evaluates remote JavaScript.
- CI tests pass and no unverified claim of production readiness is made.
