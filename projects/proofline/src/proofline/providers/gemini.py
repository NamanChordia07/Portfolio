"""Gemini via the official ``google-genai`` SDK."""

from __future__ import annotations

import os
import time
from typing import Any

from .base import Completion, Message, ProviderError

DEFAULT_MODEL = "gemini-2.5-flash"


class GeminiProvider:
    name = "gemini"

    def __init__(self, model: str = DEFAULT_MODEL, api_key: str | None = None, client: Any | None = None) -> None:
        if client is None:
            try:
                from google import genai
            except ImportError as e:  # pragma: no cover - exercised only without the extra
                raise ProviderError("install the Gemini extra: pip install 'proofline[gemini]'") from e
            key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
            if not key:
                raise ProviderError("set GEMINI_API_KEY (create one at https://aistudio.google.com/apikey)")
            client = genai.Client(api_key=key)
        self.client = client
        self.model = model

    def complete(self, system: str, messages: list[Message], *, max_tokens: int = 4000) -> Completion:
        started = time.perf_counter()
        contents = [{"role": "model" if m.role == "assistant" else "user", "parts": [{"text": m.content}]} for m in messages]
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=contents,
                config={"system_instruction": system, "max_output_tokens": max_tokens, "temperature": 0.3},
            )
        except Exception as e:
            raise ProviderError(f"Gemini request failed: {e}") from e
        text = response.text or ""
        if not text:
            raise ProviderError("Gemini returned an empty response (blocked or truncated)")
        usage = getattr(response, "usage_metadata", None)
        return Completion(
            text=text,
            model=self.model,
            input_tokens=getattr(usage, "prompt_token_count", 0) or 0,
            output_tokens=getattr(usage, "candidates_token_count", 0) or 0,
            latency_ms=(time.perf_counter() - started) * 1000,
        )
