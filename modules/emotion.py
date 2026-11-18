"""
Emotion Detection Module for AI Anime Boy Virtual Companion ("Ren")
Supports 13 distinct facial expressions with deep NLP & contextual sentiment analysis:
happy, sad, angry, surprised, shy, laughing, thinking, confused, excited, sleepy, crying, caring, neutral.
"""

import re
from typing import Dict, Tuple, Optional

# Valid canonical emotions
VALID_EMOTIONS = [
    "happy", "sad", "angry", "surprised", "shy", "laughing",
    "thinking", "confused", "excited", "sleepy", "crying", "caring", "neutral"
]

# Emotion metadata for UI icons and descriptions
EMOTION_META = {
    "happy": {"label": "Happy", "icon": "😊", "desc": "Bright smile with curved radiant eyes"},
    "sad": {"label": "Sad", "icon": "🥺", "desc": "Teary eyes and downcast eyebrows"},
    "angry": {"label": "Angry", "icon": "😠", "desc": "Narrowed eyes and furrowed eyebrows"},
    "surprised": {"label": "Surprised", "icon": "😲", "desc": "Wide eyes and rounded open mouth"},
    "shy": {"label": "Shy", "icon": "😳", "desc": "Blushing cheeks and gentle bashful gaze"},
    "laughing": {"label": "Laughing", "icon": "😄", "desc": "Closed smiling eyes and joyful open mouth"},
    "thinking": {"label": "Thinking", "icon": "🤔", "desc": "Gazing upward thoughtfully"},
    "confused": {"label": "Confused", "icon": "🤨", "desc": "Tilted head with asymmetric puzzled brows"},
    "excited": {"label": "Excited", "icon": "🤩", "desc": "Sparkling star eyes and wide cheerful beam"},
    "sleepy": {"label": "Sleepy", "icon": "🥱", "desc": "Heavy half-closed droopy eyelids"},
    "crying": {"label": "Crying", "icon": "😭", "desc": "Visible streaming tears down both cheeks"},
    "caring": {"label": "Caring", "icon": "🥰", "desc": "Gentle loving eyes and warm reassuring smile"},
    "neutral": {"label": "Neutral", "icon": "😐", "desc": "Calm, relaxed handsome expression"}
}

# Advanced contextual semantic patterns (compiled regex)
PATTERNS = {
    "crying": [
        r"\b(crying|sobbing|bawling|tears|weeping|in tears|heartbroken|devastated)\b",
        r"\b(i am crying|can't stop crying|burst into tears|shedding tears)\b",
        r"(T_T|;_;|Q_Q|😭|💧)",
    ],
    "excited": [
        r"\b(i passed|we won|passed my exam|got the job|promoted|congratulations|hurray|hooray|yay|amazing news|omg|cannot wait|can't wait|so hyped|unbelievable)\b",
        r"\b(thrilled|ecstatic|stoked|super excited|pumped up|overjoyed|fantastic|proud of you|knew you could do it|you did it)\b",
        r"(!{2,}|\bwow\b|\byay\b|\bawesome\b|\byesss+\b)",
    ],
    "laughing": [
        r"\b(tell me (a )?(joke|something funny)|that'?s hilarious|lmao|rofl|hahaha+|hehehe+|kidding|cracking up|dying of laughter)\b",
        r"\b(funny joke|puns?|comedian|hilarious)\b",
        r"(XD|😂|🤣)",
    ],
    "shy": [
        r"\b(you('re| are| look) (so )?(cute|handsome|attractive|pretty|sweet|charming|hot))\b",
        r"\b(handsome|so cute|looking good|attractive|gorgeous)\b",
        r"\b(i love you|do you like me|blush(ing)?|flustered|shy|embarrassed|crush on you)\b",
        r"\b(kiss me|hug me|holding hands|date me|be my boyfriend)\b",
        r"(⁄ ⁄•⁄ω⁄•⁄ ⁄|⁄(⁄>⁄-⁄<⁄)⁄|😳|⁄(⁄•⁄-⁄•⁄)⁄)",
    ],
    "caring": [
        r"\b(i('m| am) (feeling )?(lonely|depressed|lost|worthless|hopeless|hurting|down|broken))\b",
        r"\b(no one cares|nobody loves me|need a hug|hard day|rough day|comfort me|bad day)\b",
        r"\b(here for you|take care|i care about you|stay safe|don't give up|rest well|warm hug)\b",
    ],
    "confused": [
        r"\b(confused|puzzled|perplexed|baffled|bewildered|lost me|makes no sense|don'?t understand)\b",
        r"\b(wait what|what do you mean|huh\??|wait huh|what\?|how so\?|meaning\?)\b",
        r"\?{2,}",
    ],
    "thinking": [
        r"\b(let me think|hmm+|wondering|pondering|calculating|solve this|explain how|what is the reason|how does|what if)\b",
        r"\b(in theory|hypothetically|analyze|consider this|brainstorm|ponder)\b",
    ],
    "sleepy": [
        r"\b(sleepy|exhausted|tired|fatigued|drowsy|yawning|going to bed|good night|goodnight|need to sleep|staying up late)\b",
        r"\b(half asleep|worn out|knackered|drained)\b",
        r"(zzz|🥱|😴)",
    ],
    "angry": [
        r"\b(irritating me|annoying me|piss(ed|ing) off|shut up|hate you|stupid|idiot|mad at you|furious|angry|rage)\b",
        r"\b(infuriating|stop it|back off|leave me alone|damn it|curses|how dare you)\b",
        r"(>_<|ˋ_ˊ|😡|🤬|👿)",
    ],
    "surprised": [
        r"\b(what\?!|really\?!|seriously\?!|no way|for real|whoa|gasp|shocked|stunned|astounded|unbelievable)\b",
        r"\b(did you really|is that true|mind blown|jaw dropped)\b",
        r"(O_O|o_O|0_0|😲|😱)",
    ],
    "sad": [
        r"\b(sad|unhappy|disappointed|upset|miserable|gloom|grief|sorrow|failure|i failed|bad news)\b",
        r"\b(feeling blue|miss them|lost someone|hurts|painful|ache|mourning)\b",
        r"(:-\(|:\(|;\(|\bbummed\b)",
    ],
    "happy": [
        r"\b(happy|glad|good to see you|smile|wonderful|great|lovely|pleased|cheer|delight|grateful|blessed)\b",
        r"\b(nice day|having fun|peaceful|enjoying|love this|warm feeling|sunshine)\b",
        r"(:-\)|:\)|;\)|😊|✨)",
    ]
}


class EmotionDetector:
    """Contextual NLP Emotion Classification Engine."""

    @classmethod
    def detect_emotion(cls, text: str, role: str = "user") -> str:
        """
        Classify text into one of 13 canonical emotions.
        Takes into account contextual semantics, negations, and exclamations.
        """
        if not text or not text.strip():
            return "neutral"

        clean = text.strip()
        lower = clean.lower()

        # Handle explicit negations (e.g. "not happy", "not sad at all")
        if re.search(r"\bnot\s+(happy|glad|excited|smiling)\b", lower):
            return "sad"
        if re.search(r"\bnot\s+(sad|angry|upset|crying)\b", lower):
            return "happy"

        # Check contextual regex patterns in priority order
        # High specificity first: crying, excited, laughing, shy, caring, confused, thinking, sleepy, angry, surprised, sad, happy
        priority_order = [
            "crying", "excited", "laughing", "shy", "caring",
            "confused", "thinking", "sleepy", "angry", "surprised", "sad", "happy"
        ]

        scores = {emo: 0 for emo in VALID_EMOTIONS}

        for emo in priority_order:
            for pattern in PATTERNS[emo]:
                matches = re.findall(pattern, lower)
                if matches:
                    scores[emo] += len(matches) * 2

        # Exclamation / Question mark nuances
        if clean.endswith("?!") or clean.endswith("!?"):
            scores["surprised"] += 2
            scores["confused"] += 1
        elif clean.endswith("???"):
            scores["confused"] += 3
        elif clean.endswith("!!!"):
            scores["excited"] += 2

        # Pondering dots "..."
        if "..." in clean or "…" in clean:
            scores["thinking"] += 1
            scores["shy"] += 1

        # Find maximum scored emotion
        best_emo = "neutral"
        max_score = 0
        for emo, score in scores.items():
            if score > max_score:
                max_score = score
                best_emo = emo

        return best_emo

    @classmethod
    def get_avatar_response_emotion(cls, user_text: str, user_emotion: str, avatar_text: str) -> str:
        """
        Determine the avatar's corresponding facial expression by combining:
        1. Empathy / Social dynamics to user's state.
        2. Semantic sentiment of the avatar's own generated reply.
        """
        # First analyze avatar's own speech
        reply_emotion = cls.detect_emotion(avatar_text, role="avatar")

        # Contextual empathy overrides:
        # 1. User is sad / crying / lonely -> Avatar should display caring or sad sympathy
        if user_emotion in ("crying", "sad"):
            if "sorry" in avatar_text.lower() or "here for you" in avatar_text.lower() or "hug" in avatar_text.lower():
                return "caring"
            return "caring" if reply_emotion in ("neutral", "happy") else reply_emotion

        # 2. User is angry at avatar ("you are irritating me") -> Avatar should be apologetic/surprised/caring, not angry!
        if user_emotion == "angry":
            if any(w in avatar_text.lower() for w in ["sorry", "apologize", "didn't mean", "forgive"]):
                return "shy"  # apologetic bashful look
            return "surprised"

        # 3. User is excited -> Avatar shares the excitement
        if user_emotion == "excited":
            return "excited"

        # 4. User complimented or teased avatar -> Avatar gets shy
        if user_emotion == "shy":
            return "shy"

        # 5. User asked for something funny or avatar is joking -> Laughing or happy
        if user_emotion == "laughing" or any(w in avatar_text.lower() for w in ["haha", "funny", "punchline", "joke"]):
            return "laughing" if reply_emotion != "neutral" else "happy"

        # 6. Avatar is explaining or thinking
        if any(w in avatar_text.lower() for w in ["let me think", "hmmm", "according to", "interesting question"]):
            return "thinking"

        # Default to detected emotion of avatar's own utterance
        return reply_emotion if reply_emotion in VALID_EMOTIONS else "neutral"

    @classmethod
    def analyze_dialogue_pair(cls, user_text: str, avatar_text: str) -> Tuple[str, str]:
        """
        Returns (user_detected_emotion, avatar_facial_expression).
        """
        user_emo = cls.detect_emotion(user_text, role="user")
        avatar_emo = cls.get_avatar_response_emotion(user_text, user_emo, avatar_text)
        return user_emo, avatar_emo
