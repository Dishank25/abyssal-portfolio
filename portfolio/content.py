import json
from functools import lru_cache
from pathlib import Path


@lru_cache(maxsize=1)
def get_portfolio():
    """Load the public, editorial content shared by web views and the export."""
    directory = Path(__file__).parent
    site = json.loads((directory / "content.json").read_text(encoding="utf-8"))
    education = directory / "static" / "portfolio" / "education.json"
    site["education"] = json.loads(education.read_text(encoding="utf-8"))
    return site
