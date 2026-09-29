"""The minimal interface a text generator must implement.

Providers are thin adapters over each vendor's official SDK. The SDKs are optional
dependencies (``pip install proofline[gemini]`` / ``proofline[claude]``); the verifier
itself never needs a model.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Protocol


@dataclass(frozen=True)
class Message:
    role: Literal["user", "assistant"]
    content: str


@dataclass(frozen=True)
class Completion:
    text: str
    model: str
    input_tokens: int = 0
    output_tokens: int = 0
    latency_ms: float = 0.0


class ProviderError(RuntimeError):
    """A provider call failed in a way the caller should surface (auth, quota, refusal)."""


class Provider(Protocol):
    name: str
    model: str

    def complete(self, system: str, messages: list[Message], *, max_tokens: int = 4000) -> Completion: ...
