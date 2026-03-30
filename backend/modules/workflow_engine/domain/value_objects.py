"""Workflow engine value objects."""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class NodeCoordinates:
    """Immutable coordinates for rendering a node on the canvas."""

    x: float
    y: float

