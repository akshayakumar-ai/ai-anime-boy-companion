"""
Text-to-Speech (TTS) Module for AI Anime Boy Virtual Companion
Uses Microsoft Edge Neural TTS (edge-tts) for studio-grade human-like voices with zero API key requirement.
"""

import os
import hashlib
import asyncio
import edge_tts
from pathlib import Path
from typing import Optional, Dict
from config import Config, AUDIO_DIR

class TTSManager:
    """Manages Edge-TTS voice generation and caching."""

    AVAILABLE_VOICES = {
        "en-US-ChristopherNeural": {"name": "Christopher (Warm Anime Boy)", "gender": "Male", "lang": "en-US"},
        "en-US-GuyNeural": {"name": "Guy (Casual & Expressive)", "gender": "Male", "lang": "en-US"},
        "en-US-BrianNeural": {"name": "Brian (Youthful & Energetic)", "gender": "Male", "lang": "en-US"},
        "en-US-EricNeural": {"name": "Eric (Gentle & Calm)", "gender": "Male", "lang": "en-US"},
        "en-GB-RyanNeural": {"name": "Ryan (British Charismatic)", "gender": "Male", "lang": "en-GB"},
        "ja-JP-KeitaNeural": {"name": "Keita (Japanese Anime Male)", "gender": "Male", "lang": "ja-JP"},
    }

    @classmethod
    def get_cache_key(cls, text: str, voice: str, rate: str, pitch: str) -> str:
        """Generate unique hash for audio file caching."""
        raw = f"{voice}_{rate}_{pitch}_{text.strip()}"
        return hashlib.md5(raw.encode("utf-8")).hexdigest()

    @classmethod
    async def _synthesize_async(cls, text: str, output_path: Path, voice: str, rate: str, pitch: str):
        """Asynchronously call edge-tts to produce MP3 audio."""
        communicate = edge_tts.Communicate(
            text=text,
            voice=voice,
            rate=rate,
            pitch=pitch
        )
        await communicate.save(str(output_path))

    @classmethod
    def synthesize_speech(cls, text: str, voice: Optional[str] = None) -> Dict:
        """
        Synthesize text into speech audio file.
        Returns dict with audio_url, filename, duration_estimate, and status.
        """
        if not text or not text.strip():
            return {"success": False, "error": "Empty text"}

        clean_text = text.strip()
        selected_voice = voice or Config.TTS_VOICE
        if selected_voice not in cls.AVAILABLE_VOICES:
            selected_voice = "en-US-ChristopherNeural"

        rate = Config.TTS_RATE
        pitch = Config.TTS_PITCH

        cache_id = cls.get_cache_key(clean_text, selected_voice, rate, pitch)
        filename = f"tts_{cache_id}.mp3"
        filepath = AUDIO_DIR / filename

        try:
            # Check if cached
            if not filepath.exists() or filepath.stat().st_size == 0:
                # Run async generation
                try:
                    loop = asyncio.get_event_loop()
                except RuntimeError:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)

                if loop.is_running():
                    # In a running event loop (e.g. within an async framework)
                    import concurrent.futures
                    with concurrent.futures.ThreadPoolExecutor() as pool:
                        pool.submit(asyncio.run, cls._synthesize_async(clean_text, filepath, selected_voice, rate, pitch)).result()
                else:
                    loop.run_until_complete(cls._synthesize_async(clean_text, filepath, selected_voice, rate, pitch))

            # Approximate speaking duration: ~150 words per minute -> 2.5 words per second
            word_count = len(clean_text.split())
            estimated_duration = max(1.2, word_count / 2.6)

            return {
                "success": True,
                "audio_url": f"/api/audio/{filename}",
                "filename": filename,
                "duration": round(estimated_duration, 2),
                "voice": selected_voice,
                "provider": "edge-tts"
            }

        except Exception as e:
            print(f"Edge-TTS synthesis error: {e}")
            return {
                "success": False,
                "error": str(e),
                "fallback_to_browser": True
            }
