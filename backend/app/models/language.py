"""Language models for multilingual support."""

import enum
from sqlalchemy import String, Integer, Enum
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class ScriptDirection(str, enum.Enum):
    """Text direction for languages."""

    LTR = "ltr"  # Left-to-right (English, Hindi, Swahili)
    RTL = "rtl"  # Right-to-left (Arabic, Hebrew)


class ScriptType(str, enum.Enum):
    """Writing system types."""

    LATIN = "latin"
    DEVANAGARI = "devanagari"
    ARABIC = "arabic"
    BENGALI = "bengali"
    CYRILLIC = "cyrillic"
    CJK = "cjk"
    OTHER = "other"


class Language(Base):
    """Supported language model.

    This represents languages that the platform supports for annotation.
    Each language has metadata about its writing system, direction, and
    approximate speaker population to help with pricing and recruitment.
    """

    __tablename__ = "languages"

    # ISO 639-1 code (e.g., "hi" for Hindi) or extended code for dialects
    code: Mapped[str] = mapped_column(
        String(10),
        primary_key=True,
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    native_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    script: Mapped[ScriptType] = mapped_column(
        Enum(ScriptType),
        nullable=False,
    )
    direction: Mapped[ScriptDirection] = mapped_column(
        Enum(ScriptDirection),
        default=ScriptDirection.LTR,
        nullable=False,
    )
    # Approximate number of speakers (for market sizing)
    speakers: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    # Geographic region (for recruitment targeting)
    region: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    # Whether this language is currently active for new projects
    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )
    # Tier affects pricing (1 = common, 2 = uncommon, 3 = rare)
    tier: Mapped[int] = mapped_column(
        Integer,
        default=2,
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<Language {self.code}: {self.name}>"

    @property
    def is_rtl(self) -> bool:
        """Check if this language uses right-to-left script."""
        return self.direction == ScriptDirection.RTL

    @property
    def base_rate_multiplier(self) -> float:
        """Get the pay rate multiplier based on language tier.

        Tier 1 (common): 1.0x base rate
        Tier 2 (uncommon): 1.5x base rate
        Tier 3 (rare): 2.0x base rate
        """
        return {1: 1.0, 2: 1.5, 3: 2.0}.get(self.tier, 1.5)


# Default languages for Phase 1
DEFAULT_LANGUAGES = [
    {
        "code": "hi",
        "name": "Hindi",
        "native_name": "हिन्दी",
        "script": ScriptType.DEVANAGARI,
        "direction": ScriptDirection.LTR,
        "speakers": 600_000_000,
        "region": "South Asia",
        "tier": 1,
    },
    {
        "code": "bn",
        "name": "Bengali",
        "native_name": "বাংলা",
        "script": ScriptType.BENGALI,
        "direction": ScriptDirection.LTR,
        "speakers": 230_000_000,
        "region": "South Asia",
        "tier": 2,
    },
    {
        "code": "sw",
        "name": "Swahili",
        "native_name": "Kiswahili",
        "script": ScriptType.LATIN,
        "direction": ScriptDirection.LTR,
        "speakers": 100_000_000,
        "region": "East Africa",
        "tier": 2,
    },
    {
        "code": "yo",
        "name": "Yoruba",
        "native_name": "Yorùbá",
        "script": ScriptType.LATIN,
        "direction": ScriptDirection.LTR,
        "speakers": 45_000_000,
        "region": "West Africa",
        "tier": 3,
    },
    {
        "code": "ha",
        "name": "Hausa",
        "native_name": "Hausa",
        "script": ScriptType.LATIN,
        "direction": ScriptDirection.LTR,
        "speakers": 80_000_000,
        "region": "West Africa",
        "tier": 2,
    },
    {
        "code": "ar-eg",
        "name": "Egyptian Arabic",
        "native_name": "مصري",
        "script": ScriptType.ARABIC,
        "direction": ScriptDirection.RTL,
        "speakers": 100_000_000,
        "region": "Middle East",
        "tier": 2,
    },
    {
        "code": "ar-gulf",
        "name": "Gulf Arabic",
        "native_name": "خليجي",
        "script": ScriptType.ARABIC,
        "direction": ScriptDirection.RTL,
        "speakers": 36_000_000,
        "region": "Middle East",
        "tier": 2,
    },
]
