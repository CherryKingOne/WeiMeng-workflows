"""Nodes market value objects."""

from enum import StrEnum


class NodeCategory(StrEnum):
    """Available groups for node definitions."""

    INPUT = "input"
    TRANSFORM = "transform"
    OUTPUT = "output"

