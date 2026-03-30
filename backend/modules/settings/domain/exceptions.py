"""Settings domain exceptions."""


class SettingsDomainError(Exception):
    """Base exception for settings domain failures."""


class SettingNotFoundError(SettingsDomainError):
    """Raised when a requested setting does not exist."""

