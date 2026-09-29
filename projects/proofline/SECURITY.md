# Security

Please report a vulnerability privately through GitHub's "Report a vulnerability" link on
this repository rather than a public issue.

Scope notes:

- Verification (`facts`, `verify`, `repair`, `bench`, `challenge`, the MCP tools) runs
  locally and makes no network calls.
- `generate` and `eval-llm` send the fact brief and the task to the model provider you
  choose. Do not use them with data you are not allowed to send to that provider.
- Keys are read from `GEMINI_API_KEY` / `GOOGLE_API_KEY` and `ANTHROPIC_API_KEY`; they are
  never logged or written to traces.
