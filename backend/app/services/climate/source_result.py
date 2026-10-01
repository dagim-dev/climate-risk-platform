from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, Literal, Optional, TypeVar

T = TypeVar("T")

SourceStatusLiteral = Literal["ok", "stale", "unavailable"]


@dataclass(frozen=True)
class SourceResult(Generic[T]):
    status: SourceStatusLiteral
    data: Optional[T]
    as_of: Optional[str]
    error: Optional[str] = None
