"""
Flask Web Application for AI Anime Boy Virtual Companion ("Ren")
Two-Way Voice Conversation, Real-Time Facial Expressions & LLM Dialogue
"""

import os
from pathlib import Path
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS

from config import Config, AUDIO_DIR, BASE_DIR
from modules.emotion import EmotionDetector, VALID_EMOTIONS, EMOTION_META
from modules.tts import TTSManager
from modules.chatbot import ChatbotManager
from modules.speech import SpeechManager

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "templates"),
    static_folder=str(BASE_DIR / "static")
)
CORS(app)

chatbot = ChatbotManager()

@app.route("/")
def index():
    """Render the main anime companion application interface."""
    return render_template(
        "index.html",
        character_name=Config.CHARACTER_NAME,
        emotions=EMOTION_META,
        voices=TTSManager.AVAILABLE_VOICES,
        current_voice=Config.TTS_VOICE,
        active_provider=Config.get_active_provider()
    )

@app.route("/api/chat", methods=["POST"])
def api_chat():
    """
    Primary conversation endpoint:
    Accepts user message, runs NLP emotion detection, generates intelligent response,
    synthesizes Edge-TTS audio, and returns emotional states + audio URL.
    """
    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "").strip()
    tts_enabled = data.get("tts_enabled", True)
    custom_voice = data.get("voice", Config.TTS_VOICE)

    if not user_message:
        return jsonify({"success": False, "error": "Message cannot be empty"}), 400

    # 1. Generate dialogue response and emotion pair
    chat_result = chatbot.chat(user_message)
    reply_text = chat_result["reply"]
    avatar_emotion = chat_result["avatar_emotion"]
    user_emotion = chat_result["user_emotion"]
    provider = chat_result["provider"]

    # 2. Synthesize speech if TTS is enabled
    audio_info = None
    if tts_enabled and reply_text:
        audio_info = TTSManager.synthesize_speech(reply_text, voice=custom_voice)

    return jsonify({
        "success": True,
        "reply": reply_text,
        "avatar_emotion": avatar_emotion,
        "user_emotion": user_emotion,
        "audio": audio_info,
        "provider": provider,
        "character_name": Config.CHARACTER_NAME
    })

@app.route("/api/emotion", methods=["POST"])
def api_emotion():
    """Analyze emotion from text."""
    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()
    emotion = EmotionDetector.detect_emotion(text)
    return jsonify({
        "success": True,
        "emotion": emotion,
        "meta": EMOTION_META.get(emotion, EMOTION_META["neutral"])
    })

@app.route("/api/tts", methods=["POST"])
def api_tts():
    """Synthesize speech audio for text."""
    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()
    voice = data.get("voice", Config.TTS_VOICE)

    result = TTSManager.synthesize_speech(text, voice=voice)
    return jsonify(result)

@app.route("/api/audio/<filename>")
def serve_audio(filename):
    """Serve synthesized audio files."""
    return send_from_directory(str(AUDIO_DIR), filename, mimetype="audio/mpeg")

@app.route("/api/clear", methods=["POST"])
def api_clear():
    """Clear conversation history."""
    chatbot.clear_history()
    return jsonify({"success": True, "message": "Conversation history reset"})

@app.route("/api/settings", methods=["GET", "POST"])
def api_settings():
    """Retrieve or update active settings."""
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        if "voice" in data and data["voice"] in TTSManager.AVAILABLE_VOICES:
            Config.update_setting("TTS_VOICE", data["voice"])
        if "groq_api_key" in data:
            Config.update_setting("GROQ_API_KEY", data["groq_api_key"])
        if "openai_api_key" in data:
            Config.update_setting("OPENAI_API_KEY", data["openai_api_key"])
        if "gemini_api_key" in data:
            Config.update_setting("GEMINI_API_KEY", data["gemini_api_key"])
        if "provider" in data:
            Config.update_setting("LLM_PROVIDER", data["provider"])

        return jsonify({
            "success": True,
            "message": "Settings updated successfully",
            "active_provider": Config.get_active_provider(),
            "voice": Config.TTS_VOICE
        })

    return jsonify({
        "success": True,
        "active_provider": Config.get_active_provider(),
        "voice": Config.TTS_VOICE,
        "voices": TTSManager.AVAILABLE_VOICES,
        "character_name": Config.CHARACTER_NAME,
        "emotions": list(EMOTION_META.keys())
    })

@app.route("/api/status", methods=["GET"])
def api_status():
    """System health check endpoint."""
    return jsonify({
        "status": "healthy",
        "character": Config.CHARACTER_NAME,
        "active_llm_provider": Config.get_active_provider(),
        "tts_voice": Config.TTS_VOICE,
        "emotions_supported": len(VALID_EMOTIONS)
    })

if __name__ == "__main__":
    print(f"============================================================")
    print(f"  AI Anime Boy Virtual Companion ('{Config.CHARACTER_NAME}') Started")
    print(f"  Running on http://{Config.HOST}:{Config.PORT}")
    print(f"  Active LLM Provider: {Config.get_active_provider()}")
    print(f"  Neural Voice: {Config.TTS_VOICE}")
    print(f"============================================================")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
