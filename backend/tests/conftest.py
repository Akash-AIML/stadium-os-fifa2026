import sys
from pathlib import Path
from unittest.mock import patch, MagicMock
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.crowd import crowd_engine


@pytest.fixture(autouse=True)
def reset_match_time() -> None:
    """
    Autouse fixture resetting crowd simulation clock before each test execution
    to prevent cross-test mutability leakage.
    """
    crowd_engine.match_time_minutes = 0


@pytest.fixture
def mock_gemini():
    """
    Mock fixture patching gemini_client generate_response for hermetic API simulation.
    """
    with patch("app.routes.chat.gemini_client.generate_response") as mock_gen:
        mock_gen.return_value = {
            "text": "Hello! I am a mocked AI response.",
            "timestamp": "2026-07-10T22:00:00Z",
            "is_fallback": False,
            "response_time": 10.5,
            "confidence": 0.95,
            "prompt_tokens": 42
        }
        yield mock_gen


@pytest.fixture
def mock_gemini_fallback():
    """
    Mock fixture patching gemini_client model attribute to trigger fallback path generation.
    """
    with patch("app.services.gemini.gemini_client.model", new=None):
        yield