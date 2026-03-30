"""Settings filesystem adapters."""

from pathlib import Path


class SettingsFileStorage:
    """Local file storage for settings-related exports or backups."""

    def __init__(self, base_dir: Path) -> None:
        self.base_dir = base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def build_export_path(self, name: str) -> Path:
        """Return the future export file path for a settings snapshot."""
        return self.base_dir / f"{name}.json"

