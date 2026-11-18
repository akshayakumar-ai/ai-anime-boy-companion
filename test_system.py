"""
Comprehensive Verification and Test Suite for AI Anime Boy Companion ("Ren")
Tests:
  1. Emotion Classification & Contextual Empathy
  2. Chatbot Dialogue & Conversation Memory
  3. Edge-TTS Audio Generation
  4. Flask REST API Endpoints
"""

import sys
import unittest
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from modules.emotion import EmotionDetector, VALID_EMOTIONS
from modules.chatbot import ChatbotManager
from modules.tts import TTSManager
from app import app


class TestAnimeBoySystem(unittest.TestCase):

    def setUp(self):
        self.app_client = app.test_client()
        self.chatbot = ChatbotManager()

    def test_01_all_13_emotions_valid(self):
        """Ensure all 13 required emotions are supported."""
        self.assertEqual(len(VALID_EMOTIONS), 13)
        expected = [
            "happy", "sad", "angry", "surprised", "shy", "laughing",
            "thinking", "confused", "excited", "sleepy", "crying", "caring", "neutral"
        ]
        for emo in expected:
            self.assertIn(emo, VALID_EMOTIONS)

    def test_02_emotion_detection_examples(self):
        """Test specific required conversational examples."""
        # 1. "I passed my exam!" -> excited
        user_emo = EmotionDetector.detect_emotion("I passed my exam!")
        self.assertEqual(user_emo, "excited")

        # 2. "I am feeling lonely." -> user is sad/lonely, avatar reaction should be caring
        user_emo = EmotionDetector.detect_emotion("I am feeling lonely.")
        self.assertIn(user_emo, ["sad", "caring"])
        avatar_emo = EmotionDetector.get_avatar_response_emotion(
            "I am feeling lonely.", user_emo, "I am here for you. You are never alone."
        )
        self.assertEqual(avatar_emo, "caring")

        # 3. "You are irritating me!" -> angry user, avatar should react with surprised/apologetic
        user_emo = EmotionDetector.detect_emotion("You are irritating me!")
        self.assertEqual(user_emo, "angry")
        avatar_emo = EmotionDetector.get_avatar_response_emotion(
            "You are irritating me!", user_emo, "Oh no, I'm so sorry! What did I do wrong?"
        )
        self.assertIn(avatar_emo, ["surprised", "shy"])

        # 4. "Tell me something funny." -> laughing/happy
        user_emo = EmotionDetector.detect_emotion("Tell me something funny.")
        self.assertEqual(user_emo, "laughing")
        avatar_emo = EmotionDetector.get_avatar_response_emotion(
            "Tell me something funny.", user_emo, "Why don't skeletons fight? No guts! Haha!"
        )
        self.assertIn(avatar_emo, ["laughing", "happy"])

    def test_03_emotion_coverage(self):
        """Test various emotional triggers."""
        triggers = {
            "crying": "I cannot stop crying right now T_T",
            "shy": "You look so handsome today, Ren!",
            "confused": "Wait, what do you mean by that???",
            "sleepy": "I'm so exhausted, going to bed now... goodnight",
            "thinking": "Let me think about how to solve this math problem",
            "angry": "I am so mad at you! Shut up!"
        }
        for expected_emo, phrase in triggers.items():
            detected = EmotionDetector.detect_emotion(phrase)
            self.assertEqual(detected, expected_emo, f"Failed for phrase: '{phrase}', expected {expected_emo}, got {detected}")

    def test_04_chatbot_dialogue(self):
        """Test chatbot response generation and memory."""
        res = self.chatbot.chat("Hello Ren! Nice to meet you!")
        self.assertIn("reply", res)
        self.assertTrue(len(res["reply"]) > 0)
        self.assertIn(res["avatar_emotion"], VALID_EMOTIONS)
        self.assertIn(res["user_emotion"], VALID_EMOTIONS)

        # Multi-turn memory check
        self.assertEqual(len(self.chatbot.history), 2)
        res2 = self.chatbot.chat("I passed my exam today!")
        self.assertEqual(res2["avatar_emotion"], "excited")
        self.assertEqual(len(self.chatbot.history), 4)

    def test_05_tts_synthesis(self):
        """Test Edge-TTS audio generation."""
        tts_result = TTSManager.synthesize_speech("Hello! I am happy to meet you!")
        self.assertTrue(tts_result.get("success"), f"TTS failed: {tts_result.get('error')}")
        self.assertIn("audio_url", tts_result)
        self.assertTrue(tts_result["audio_url"].startswith("/api/audio/"))

    def test_06_flask_status_endpoint(self):
        """Test Flask /api/status endpoint."""
        resp = self.app_client.get("/api/status")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["emotions_supported"], 13)

    def test_07_flask_chat_endpoint(self):
        """Test Flask /api/chat endpoint."""
        resp = self.app_client.post("/api/chat", json={
            "message": "I passed my exam!",
            "tts_enabled": True
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data["success"])
        self.assertIn("reply", data)
        self.assertEqual(data["avatar_emotion"], "excited")
        self.assertIsNotNone(data.get("audio"))
        self.assertTrue(data["audio"].get("success"))


if __name__ == "__main__":
    unittest.main()
