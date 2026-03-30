"""Runtime configuration helpers."""

from dataclasses import dataclass
from os import getenv
from pathlib import Path


@dataclass(frozen=True, slots=True)
class Settings:
    """Application settings shared across the backend."""

    app_name: str
    environment: str
    data_dir: Path


def load_settings() -> Settings:
    """Load settings from the environment with sensible local defaults."""
    root_dir = Path(__file__).resolve().parent.parent
    default_data_dir = root_dir / "data"

    return Settings(
        app_name=getenv("WORKFLOWS_APP_NAME", "workflows-backend"),
        environment=getenv("WORKFLOWS_ENV", "development"),
        data_dir=Path(getenv("WORKFLOWS_DATA_DIR", str(default_data_dir))),
    )

