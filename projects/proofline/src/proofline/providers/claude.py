"""Claude via the official ``anthropic`` SDK."""

from __future__ import annotations

import time
from typing import Any

from .base import Completion, Message, ProviderError

DEFAULT_MODEL = "claude-opus-5-5"


class ClaudeProvider:
    name = "claude"

    def __init__(self, model: str = DEFAULT_MODEL, effort: str = "medium", client: Any | None = None) -> None:
        if client is None:
            try:
                import anthropic
            except ImportError as e:  # pragma: no cover - exercised only without the extra
                raise ProviderError("install the Claude extra: pip install 'proofline[claude]'") from e
            client = anthropic.Anthropic()  # resolves ANTHROPIC_API_KEY or an `ant auth login` profile
        self.client = client
        self.model = model
        self.effort = effort

    def complete(self, system: str, messages: list[Message], *, max_tokens: int = 4000) -> Completion:
        started = time.perf_counter()
        try:
            response = self.client.beta.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": m.role, "content": m.content} for m in messages],
                output_config={"effort": self.effort},
                # On a safety-classifier decline, retry server-side on Anthropic's recommended model.
                betas=["server-side-fallback-2026-07-01"],
                fallbacks="default",
            )
        except Exception as e:  # the SDK already retried transient errors (429 / 5xx / network)
            raise ProviderError(f"Claude request failed: {e}") from e
        if response.stop_reason == "refusal":
            raise ProviderError("Claude declined the request (stop_reason=refusal)")
        text = "".join(b.text for b in response.content if b.type == "text")
        return Completion(
            text=text,
            model=response.model,
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
            latency_ms=(time.perf_counter() - started) * 1000,
        )
