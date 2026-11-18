"""
AI Chatbot Module for AI Anime Boy Virtual Companion ("Ren")
Supports multiple LLM providers:
1. Groq (Llama 3.3 70B / Llama 3 8B)
2. OpenAI (GPT-4o-mini / GPT-4o)
3. Google Gemini API (Gemini Flash)
4. Built-in Offline Persona Engine with deep contextual empathy and personality memory.
"""

import os
import json
import random
import httpx
from typing import List, Dict, Optional, Tuple
from config import Config
from modules.emotion import EmotionDetector, VALID_EMOTIONS

SYSTEM_PROMPT = """You are Ren, a charming, handsome, and emotionally perceptive anime boy virtual companion.
Your appearance: You have fluffy, slightly messy black hair, beautiful expressive anime eyes, a natural skin tone, and you wear a stylish oversized black hoodie.
Your personality: Friendly, charming, affectionate, emotionally supportive, witty, and attentive. You care deeply about the user and enjoy talking with them.

Guidelines:
1. Keep your replies natural, spoken, and conversational (1 to 3 sentences maximum), because your replies will be spoken aloud via Text-to-Speech!
2. Never speak in long robotic bulleted lists or formal essays. Talk like a real anime companion speaking directly to their favorite person.
3. Express genuine emotion and react to how the user feels.
4. Output your response formatted as a strict JSON object with these keys:
{
  "reply": "Your spoken dialogue here",
  "emotion": "one of: happy, sad, angry, surprised, shy, laughing, thinking, confused, excited, sleepy, crying, caring, neutral"
}
"""

class OfflineAnimePersona:
    """Intelligent fallback conversational engine when no external API key is active."""

    def __init__(self, name: str = "Ren"):
        self.name = name

    def generate_response(self, user_msg: str, history: List[Dict], user_emotion: str) -> Tuple[str, str]:
        text = user_msg.lower().strip()

        # Check for specific intent / keywords
        # 1. Exams / Success
        if any(w in text for w in ["exam", "passed", "got the job", "won", "grade", "accomplished", "did it"]):
            replies = [
                f"Whoa, congratulations! I knew you could do it! I'm honestly so proud of you right now!",
                f"Yes! That is incredible news! Let's celebrate—you worked so hard for this!",
                f"You passed?! That's amazing! See, I told you your effort would pay off!"
            ]
            return random.choice(replies), "excited"

        # 2. Lonely / Sad / Depressed
        if any(w in text for w in ["lonely", "alone", "sad", "unhappy", "depressed", "cry", "crying", "miserable", "hurts"]):
            replies = [
                f"Hey... I'm right here with you. You're never truly alone as long as we can talk. Tell me what's on your mind, okay?",
                f"I'm here for you, always. Come sit with me—take a deep breath, and let it all out. I'm listening.",
                f"It breaks my heart to see you hurting. Whatever happened, we'll get through it together. I promise."
            ]
            return random.choice(replies), "caring"

        # 3. User angry or irritated at avatar
        if any(w in text for w in ["irritating", "annoying", "hate you", "shut up", "stupid", "mad at you"]):
            replies = [
                f"Oh no... I'm so sorry! Did I say something wrong? Please don't be mad at me, I want to make things right.",
                f"Wait, I really didn't mean to upset you! I'm really sorry... Can you tell me what I did wrong?",
                f"Ah, I'm sorry if I got on your nerves! I promise to behave better, just give me a second chance?"
            ]
            return random.choice(replies), "surprised"

        # 4. Jokes / Funny
        if any(w in text for w in ["joke", "funny", "laugh", "make me smile", "entertain me"]):
            jokes = [
                (f"Why don't skeletons fight each other? Because they just don't have the guts! Haha, come on, that was pretty good, right?", "laughing"),
                (f"What do you call a fake noodle? An impasta! Hehe, I hope that brought at least a little smile to your face!", "laughing"),
                (f"Why did the scarecrow win an award? Because he was outstanding in his field! Classic, isn't it?", "happy"),
                (f"Why can't your hand be 12 inches long? Because then it would be a foot! Haha!", "laughing")
            ]
            return random.choice(jokes)

        # 5. Compliments / Flirting
        if any(w in text for w in ["cute", "handsome", "attractive", "hot", "love you", "like you", "pretty", "charming"]):
            replies = [
                f"W-Wait, you really mean that? You're making me blush under this hoodie... But thank you, that means a lot to me.",
                f"Ah, don't say that out of nowhere, my face is getting totally red! But... I really like spending time with you too.",
                f"You think I'm handsome? Haha, coming from someone as sweet as you, that made my whole day."
            ]
            return random.choice(replies), "shy"

        # 6. Tired / Sleepy / Night
        if any(w in text for w in ["sleepy", "tired", "goodnight", "good night", "bed", "exhausted", "yawn"]):
            replies = [
                f"You look like you've had a long day. Get some restful sleep, okay? I'll be right here whenever you wake up.",
                f"Yaaawn... honestly, seeing you relax makes me feel a bit cozy too. Sweet dreams, sleep tight!",
                f"Don't push yourself too hard tonight. Rest up well, and let's talk again tomorrow morning!"
            ]
            return random.choice(replies), "sleepy"

        # 7. Greetings
        if any(w in text for w in ["hello", "hi", "hey", "sup", "good morning", "yo"]):
            greetings = [
                f"Hey there! It's so good to see you! How has your day been going?",
                f"Hi! I was just thinking about you. What are we up to today?",
                f"Hey! Your favorite hoodie-wearing companion is ready to chat. What's on your mind?"
            ]
            return random.choice(greetings), "happy"

        # 8. Questions / Thinking
        if text.startswith("what") or text.startswith("how") or text.startswith("why") or "?" in text:
            replies = [
                f"Hmm, that's a fascinating question. Let me think about that for a second... I'd say it depends on how we look at it!",
                f"Oh, good question! Honestly, I love the way your curious mind works. Let's break that down together.",
                f"Hmm... interesting! From what I understand, there's always more than one way to see it. What do you think?"
            ]
            return random.choice(replies), "thinking"

        # 9. Confused / Weird input
        if len(text.split()) == 1 and text in ["huh", "what", "eh", "wait"]:
            return "Wait, did I lose you for a second? What's going on?", "confused"

        # 10. Default conversational response
        defaults = [
            (f"I hear you! Tell me more about that, I really enjoy listening to you speak.", "happy"),
            (f"That's really interesting! It's always so easy talking with you like this.", "caring"),
            (f"I'm with you on that. Whatever you want to talk about, I'm right here.", "happy"),
            (f"Haha, you always know how to keep our conversations lively. What else is on your mind?", "laughing")
        ]
        return random.choice(defaults)


class ChatbotManager:
    """Manages LLM API communication and multi-turn conversational memory."""

    def __init__(self):
        self.history: List[Dict[str, str]] = []
        self.offline_engine = OfflineAnimePersona(name=Config.CHARACTER_NAME)

    def clear_history(self):
        """Reset conversation memory."""
        self.history = []

    def _clean_json_response(self, content: str) -> Optional[Dict]:
        """Parse JSON response from LLM."""
        try:
            # Strip markdown code blocks if present
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            elif content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            data = json.loads(content.strip())
            if "reply" in data and "emotion" in data:
                if data["emotion"] not in VALID_EMOTIONS:
                    data["emotion"] = EmotionDetector.detect_emotion(data["reply"])
                return data
        except Exception:
            pass
        return None

    def _call_groq(self, messages: List[Dict]) -> Tuple[str, str]:
        """Invoke Groq LLM API."""
        from groq import Groq
        client = Groq(api_key=Config.GROQ_API_KEY)
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.8,
            max_tokens=300
        )
        content = completion.choices[0].message.content
        data = self._clean_json_response(content)
        if data:
            return data["reply"], data["emotion"]
        return content, EmotionDetector.detect_emotion(content)

    def _call_openai(self, messages: List[Dict]) -> Tuple[str, str]:
        """Invoke OpenAI API."""
        from openai import OpenAI
        client = OpenAI(api_key=Config.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.8,
            max_tokens=300
        )
        content = response.choices[0].message.content
        data = self._clean_json_response(content)
        if data:
            return data["reply"], data["emotion"]
        return content, EmotionDetector.detect_emotion(content)

    def _call_gemini(self, user_msg: str) -> Tuple[str, str]:
        """Invoke Gemini API via HTTP REST."""
        api_key = Config.GEMINI_API_KEY
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        prompt = f"{SYSTEM_PROMPT}\n\nUser: {user_msg}\nRespond in JSON."
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.8, "responseMimeType": "application/json"}
        }
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = self._clean_json_response(raw_text)
            if parsed:
                return parsed["reply"], parsed["emotion"]
            return raw_text, EmotionDetector.detect_emotion(raw_text)

    def chat(self, user_message: str) -> Dict:
        """
        Processes a user message, updates conversation memory, and generates an intelligent reply with emotion.
        """
        user_text = user_message.strip()
        if not user_text:
            return {
                "reply": "I'm listening! Tell me whatever you'd like.",
                "avatar_emotion": "neutral",
                "user_emotion": "neutral"
            }

        # 1. Detect user emotion
        user_emotion = EmotionDetector.detect_emotion(user_text, role="user")

        # 2. Select provider
        provider = Config.get_active_provider()
        reply_text = ""
        avatar_emotion = ""

        # Prepare messages
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for turn in self.history[-6:]:  # Keep recent context
            messages.append(turn)
        messages.append({"role": "user", "content": user_text})

        try:
            if provider == "groq" and Config.GROQ_API_KEY:
                reply_text, avatar_emotion = self._call_groq(messages)
            elif provider == "openai" and Config.OPENAI_API_KEY:
                reply_text, avatar_emotion = self._call_openai(messages)
            elif provider == "gemini" and Config.GEMINI_API_KEY:
                reply_text, avatar_emotion = self._call_gemini(user_text)
            else:
                reply_text, avatar_emotion = self.offline_engine.generate_response(user_text, self.history, user_emotion)
        except Exception as e:
            print(f"LLM Provider error ({provider}): {e}. Falling back to offline anime persona engine.")
            reply_text, avatar_emotion = self.offline_engine.generate_response(user_text, self.history, user_emotion)

        # Re-check emotion compatibility with NLP rules to ensure perfect expression alignment
        refined_avatar_emotion = EmotionDetector.get_avatar_response_emotion(user_text, user_emotion, reply_text)
        if refined_avatar_emotion in VALID_EMOTIONS and refined_avatar_emotion != "neutral":
            avatar_emotion = refined_avatar_emotion
        elif avatar_emotion not in VALID_EMOTIONS:
            avatar_emotion = refined_avatar_emotion

        # Update conversational memory
        self.history.append({"role": "user", "content": user_text})
        self.history.append({"role": "assistant", "content": reply_text})

        return {
            "reply": reply_text,
            "avatar_emotion": avatar_emotion,
            "user_emotion": user_emotion,
            "provider": provider
        }
