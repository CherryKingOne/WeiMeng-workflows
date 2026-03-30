"""Workflow engine filesystem adapters."""

from pathlib import Path


class WorkflowFileStorage:
    """Local file storage used by the workflow engine bounded context."""

    def __init__(self, base_dir: Path) -> None:
        self.base_dir = base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def build_snapshot_path(self, workflow_id: str) -> Path:
        """Return the future JSON snapshot path for a workflow."""
        return self.base_dir / f"{workflow_id}.json"

