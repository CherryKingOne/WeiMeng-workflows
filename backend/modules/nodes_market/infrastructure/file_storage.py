"""Nodes market filesystem adapters."""

from pathlib import Path


class NodeAssetStorage:
    """Local asset storage for node icons and metadata files."""

    def __init__(self, base_dir: Path) -> None:
        self.base_dir = base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def build_icon_path(self, node_type: str) -> Path:
        """Return the icon path for a given node type."""
        return self.base_dir / f"{node_type}.svg"

