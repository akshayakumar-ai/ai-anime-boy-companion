"""
Speech Recognition & Audio Processing Module
Handles backend audio transcription and speech utilities.
Primary transcription is handled client-side via Web Speech API for instantaneous low-latency speech recognition,
with backend transcription endpoint support for uploaded audio blobs (Groq Whisper / OpenAI Whisper / fallback).
"""

import os
from typing import Dict, Optional
from config import Config

class SpeechManager:
    """Manages audio transcription and speech processing."""

    @classmethod
    def transcribe_audio(cls, audio_file_path: str) -> Dict:
        """
        Transcribe uploaded audio file using available Whisper APIs or fallback.
        """
        if not os.path.exists(audio_file_path):
            return {"success": False, "error": "Audio file not found"}

        # If Groq API key is present, use Groq Whisper (ultra-fast transcription)
        if Config.GROQ_API_KEY:
            try:
                from groq import Groq
                client = Groq(api_key=Config.GROQ_API_KEY)
                with open(audio_file_path, "rb") as file:
                    transcription = client.audio.transcriptions.create(
                        file=(os.path.basename(audio_file_path), file.read()),
                        model="whisper-large-v3",
                        response_format="text"
                    )
                return {
                    "success": True,
                    "text": transcription.strip(),
                    "provider": "groq-whisper"
                }
            except Exception as e:
                print(f"Groq Whisper transcription failed: {e}")

        # If OpenAI API key is present, use OpenAI Whisper
        if Config.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=Config.OPENAI_API_KEY)
                with open(audio_file_path, "rb") as file:
                    transcription = client.audio.transcriptions.create(
                        model="whisper-1",
                        file=file
                    )
                return {
                    "success": True,
                    "text": transcription.text.strip(),
                    "provider": "openai-whisper"
                }
            except Exception as e:
                print(f"OpenAI Whisper transcription failed: {e}")

        return {
            "success": False,
            "error": "Backend Whisper requires GROQ_API_KEY or OPENAI_API_KEY. Web Speech API is used directly in the browser.",
            "fallback_to_browser": True
        }
