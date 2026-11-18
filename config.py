import os
from pathlib import Path
from dotenv import load_dotenv

# Base paths
BASE_DIR = Path(__file__).resolve().parent
AUDIO_DIR = BASE_DIR / "static" / "audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# Load environment variables
load_dotenv(BASE_DIR / ".env")

class Config:
    PORT = int(os.getenv("PORT", 5000))
    HOST = os.getenv("HOST", "0.0.0.0")
    DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

    # LLM Settings
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "auto").strip().lower()

    # TTS Settings (Edge-TTS Neural Voices)
    TTS_VOICE = os.getenv("TTS_VOICE", "en-US-ChristopherNeural").strip()
    TTS_RATE = os.getenv("TTS_RATE", "+0%").strip()
    TTS_PITCH = os.getenv("TTS_PITCH", "+0Hz").strip()

    # Character Settings
    CHARACTER_NAME = os.getenv("CHARACTER_NAME", "Ren").strip()
    CHARACTER_ROLE = os.getenv("CHARACTER_ROLE", "Handsome, charming, and empathetic anime boy companion").strip()

    @classmethod
    def get_active_provider(cls):
        """Determine which provider to use based on configuration and available keys."""
        if cls.LLM_PROVIDER in ("groq", "openai", "gemini", "offline"):
            return cls.LLM_PROVIDER
        if cls.GROQ_API_KEY:
            return "groq"
        if cls.OPENAI_API_KEY:
            return "openai"
        if cls.GEMINI_API_KEY:
            return "gemini"
        return "offline"

    @classmethod
    def update_setting(cls, key, value):
        """Dynamically update in-memory setting and save to .env if applicable."""
        if hasattr(cls, key):
            setattr(cls, key, value)
            env_path = BASE_DIR / ".env"
            if env_path.exists():
                try:
                    lines = env_path.read_text(encoding="utf-8").splitlines()
                    found = False
                    new_lines = []
                    for line in lines:
                        if line.startswith(f"{key}="):
                            new_lines.append(f"{key}={value}")
                            found = True
                        else:
                            new_lines.append(line)
                    if not found:
                        new_lines.append(f"{key}={value}")
                    env_path.write_text("\n".join(new_lines), encoding="utf-8")
                except Exception as e:
                    print(f"Warning: Failed to persist setting {key} to .env: {e}")
