"""A deterministic stand-in for an LLM, for tests and offline demos.

It replays a fixed list of responses in order. It is *not* a model and nothing measured
with it says anything about real LLM behaviour; it exists so the guarded-generation loop,
the CLI and the MCP server can be tested without network access or API keys.
"""

from __future__ import annotations

from .base import Completion, Message, ProviderError


class ScriptedProvider:
    name = "scripted"

    def __init__(self, responses: list[str], model: str = "scripted") -> None:
        self.responses = list(responses)
        self.model = model
        self.calls: list[tuple[str, list[Message]]] = []

    def complete(self, system: str, messages: list[Message], *, max_tokens: int = 4000) -> Completion:
        self.calls.append((system, list(messages)))
        if not self.responses:
            raise ProviderError("scripted provider ran out of responses")
        return Completion(text=self.responses.pop(0), model=self.model)
