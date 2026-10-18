# Security Review — 2026-10

## Scope

A source-level review of the repository's default branch. The reviewed files were inspected as text only; the application and its startup scripts were not executed.

## Critical: remote JavaScript evaluation during startup

In `server.ts`, an async startup block reads `AUTH_API_KEY`, decodes it with `atob`, fetches the decoded value, reads the response as text, and passes that text to `eval`.

This is a remote-code-execution pattern. A remote endpoint or response that is not fully trusted can execute arbitrary JavaScript in the server process with the server's privileges.

### Immediate containment

1. Do not run or deploy the current startup path until the behavior is understood and removed.
2. Remove the remote-fetch-and-`eval` block. Replace it with a documented, local authentication implementation that does not download executable code.
3. Rotate any credentials that may have been accessible to the process. Review deployment logs and outbound network logs for unexpected activity.
4. Inspect the history and origin of `api.js`. It is heavily obfuscated and is invoked before `server.ts` by the current package scripts. Do not execute it during the investigation.
5. Review all tracked environment examples and repository history for real credentials. Revoke and rotate any exposed tokens; a history rewrite alone does not revoke a credential.
6. Review GitHub Actions, deployment settings, dependencies, and recent commits before restoring normal startup.

## Additional risks to assess

- The documented CORS middleware allows every origin and broad HTTP methods. Restrict origins and methods for deployments.
- The API documentation describes endpoints without authentication in the initial phase. Require authentication and authorization before network exposure.
- Validate and constrain URLs supplied to crawling/browser tools to mitigate SSRF, including private, loopback, link-local, and cloud metadata destinations.
- Treat webpage content, search snippets, MCP tool output, and model output as untrusted data.
- Do not log API keys or raw authorization headers.
- Ensure examples use placeholders only.

## LLM gateway integration safety

The new `src/server/llm/provider.ts` module:
- Reads gateway credentials only from server-side environment variables.
- Uses an OpenAI-compatible `/models` and `/chat/completions` API.
- Applies a request timeout and supports caller cancellation.
- Avoids returning arbitrary error response bodies to logs.
- Does not execute model tool calls; the application must validate and authorize every tool call separately.

## Verification still required

This is a source-level finding, not a completed penetration test. Confirm the intended purpose of the obfuscated bootstrap with the repository owner and deployment operator before removing any legitimate authentication behavior. Do not execute the existing startup scripts to investigate.
