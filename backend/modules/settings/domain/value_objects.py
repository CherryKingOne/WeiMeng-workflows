"""Settings value objects."""

from enum import StrEnum


class SettingScope(StrEnum):
    """Supported scopes for settings values."""

    SYSTEM = "system"
    USER = "user"

