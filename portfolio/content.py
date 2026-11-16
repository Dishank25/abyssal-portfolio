import json
from functools import lru_cache
from pathlib import Path


@lru_cache(maxsize=1)
def get_portfolio():
    """Load the public, editorial content shared by web views and the export."""
    return json.loads(Path(__file__).with_name("content.json").read_text(encoding="utf-8"))
