# AI Anime Boy – Interactive Voice Conversation & Real-Time Facial Expression System

An interactive AI Anime Boy Virtual Companion named **Ren (蓮)** who can listen, understand, think, reply, speak with a natural human-like voice, and express emotions through real-time animated facial expressions.

![AI Anime Boy Companion](https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80)

---

## 🌟 Character Design: "Ren"

- **Hair**: Black, fluffy, slightly messy anime hairstyle with layered depth, dynamic cowlick physics, and subtle glinting angel-ring highlights.
- **Eyes**: Deep twilight slate-blue anime eyes with multi-layer iris gradients, pupils, specular catchlights, star sparkles (excited), and watery glints (sad/crying).
- **Skin & Face**: Natural warm skin tone, refined anime jawline, delicate nose, and reactive cheek blush zones.
- **Outfit**: Stylized black oversized hoodie with relaxed shoulders, folded cowl collar, and silver-tipped drawstrings.
- **Personality**: Charming, warm, attentive, emotionally intelligent, and playful.
- **Identity Consistency**: Rendered procedurally via a high-performance Canvas 2D engine with continuous mathematical geometry, ensuring **100% character visual consistency across every single expression without morph glitching**.

---

## 🎭 13 Real-Time Facial Expressions

Ren transitions smoothly at 60 FPS between all 13 canonical expressions:

| # | Expression | Visual Characteristics |
|---|------------|------------------------|
| 1 | **Happy** | Bright warm smile, curved sparkling eyes, lifted eyebrows, gentle pink cheek blush. |
| 2 | **Sad** | Glistening teary eyes, downturned sad eyebrows, trembling down-curved mouth. |
| 3 | **Angry** | Narrowed intense eyes, sharply furrowed eyebrows, firm tense mouth. |
| 4 | **Surprised** | Dilated wide-open eyes, raised high eyebrows, rounded open 'O' mouth. |
| 5 | **Shy** | Rosy cheek blush with cute diagonal hatching, eyes bashfully glancing aside, sweet smile. |
| 6 | **Laughing** | Closed crescent `^ ^` smiling eyes, open laughing mouth showing upper teeth, chuckling bounce. |
| 7 | **Thinking** | Gaze shifted upward-right, thoughtfully arched eyebrow, small pensive mouth. |
| 8 | **Confused** | Noticeably tilted head, asymmetric eyebrows (one raised, one furrowed), parted puzzled mouth. |
| 9 | **Excited** | Glowing 4-point rotating star pupils, wide beam smile, buoyant energetic bounce, floating sparkles. |
| 10 | **Sleepy** | Heavy half-closed droopy eyelids, relaxed straight mouth, slow gentle breathing sway. |
| 11 | **Crying** | Animated glistening tears actively streaming down cheeks, sad downturned brows, trembling quivering lips. |
| 12 | **Caring** | Gentle warm affectionate gaze, soft reassuring smile, tender head tilt, comforting presence. |
| 13 | **Neutral** | Calm handsome relaxed expression, natural breathing physics, and attentive posture. |

---

## 🎙️ Two-Way Voice Conversation Architecture

```
[ User Speaks ]
       │
       ▼
[ Web Speech API / Mic ] ──► [ Real-Time Speech-to-Text ]
                                       │
                                       ▼
                             [ NLP Emotion Engine ] ──► (Detects User Emotion)
                                       │
                                       ▼
                             [ Avatar Enters 'Thinking' ]
                                       │
                                       ▼
       ┌─────────────────────[ AI Chatbot Engine ]──────────────────────┐
       │ (Groq Llama 3.3 / OpenAI GPT-4o / Gemini / Built-in Persona)  │
       └───────────────────────────────┬────────────────────────────────┘
                                       │
                                       ▼
       ┌─────────────────────[ Dual Output ]───────────────────────────┐
       │ 1. Response Dialogue Text & Subtitles                         │
       │ 2. Avatar Emotion Analysis (Empathy + Reply Emotion)           │
       └───────────────────────────────┬────────────────────────────────┘
                                       │
                                       ▼
                       [ Edge-TTS Neural Voice Synthesis ]
                                       │
                                       ▼
         ┌───────────────────────────────────────────────────────────┐
         │                    Browser Web Audio API                  │
         │  • Real-time FFT Audio Analyser (200Hz - 3500Hz energy)    │
         │  • Lip-Sync Viseme Envelope modulates mouth open/width    │
         │  • 60 FPS Morphing into Target Facial Expression          │
         │  • Breathing, Blinking, & Physics run continuously        │
         └───────────────────────────────────────────────────────────┘
```

---

## 🧠 Contextual Emotion Detection Examples

The system does not rely merely on standalone keywords; it analyzes sentence structure, negations, empathy rules, and conversational context:

- **User**: *"I passed my exam!"*
  - **Detected User Emotion**: `excited`
  - **Ren's Expression**: `excited` (Star pupils, wide smile)
  - **Ren**: *"Whoa, congratulations! I knew you could do it! I'm honestly so proud of you right now!"*

- **User**: *"I am feeling lonely."*
  - **Detected User Emotion**: `sad` / `caring`
  - **Ren's Expression**: `caring` (Gentle eyes, soft comforting smile)
  - **Ren**: *"Hey... I'm right here with you. You're never truly alone as long as we can talk. Tell me what's on your mind, okay?"*

- **User**: *"You are irritating me!"*
  - **Detected User Emotion**: `angry`
  - **Ren's Expression**: `surprised` or `shy`/apologetic (Wide apologetic eyes)
  - **Ren**: *"Oh no... I'm so sorry! Did I say something wrong? Please don't be mad at me, I want to make things right."*

- **User**: *"Tell me something funny."*
  - **Detected User Emotion**: `laughing`
  - **Ren's Expression**: `laughing` (`^ ^` eyes, open chuckling mouth)
  - **Ren**: *"Why don't skeletons fight each other? Because they just don't have the guts! Haha, come on, that was pretty good, right?"*

---

## 🛠️ Technology Stack

- **Frontend**:
  - HTML5 & CSS3 with modern pastel glassmorphism theme (`backdrop-filter: blur`).
  - High-DPI Canvas 2D procedural rendering engine (`character.js`).
  - Web Audio API `AudioContext` + `AnalyserNode` for 60 FPS lip-sync.
  - Web Speech Recognition API (`SpeechRecognition` / `webkitSpeechRecognition`).
- **Backend**:
  - Python 3 & Flask.
  - Flask-CORS.
  - `python-dotenv` for configuration.
- **Voice & TTS**:
  - `edge-tts` (Microsoft Neural Voices: `en-US-ChristopherNeural`, `en-US-GuyNeural`, `ja-JP-KeitaNeural`, etc.).
  - Zero API key required for studio-grade human voices.
  - Web Speech Synthesis fallback.
- **AI & NLP**:
  - Built-in intelligent offline anime persona engine with conversation memory.
  - Multi-provider support for Groq (Llama 3.3), OpenAI (GPT-4o), and Google Gemini.
  - Multi-tier NLP rule & contextual emotion classifier.

---

## 🚀 Step-by-Step Instructions to Run Locally

### 1. Prerequisites
Ensure Python 3.10+ is installed on your computer.

### 2. Install Dependencies
Open a PowerShell or Terminal in the project directory:
```bash
cd ai-anime-boy-companion
pip install -r requirements.txt
```

### 3. (Optional) Configure API Keys
If you would like to use an external LLM (e.g. Groq or OpenAI), open `.env` and paste your key:
```ini
GROQ_API_KEY=gsk_your_groq_key_here
```
> **Note**: Even if you do not provide any API key, the system works immediately out of the box using Ren's built-in intelligent anime companion engine!

### 4. Run the Application
You can launch the companion using any of the following methods:

**Method A: Double-Click `run.bat` (Windows)**
Simply double-click the `run.bat` file in the folder. It will start the server and open your default browser automatically.

**Method B: Command Line**
```bash
python app.py
```

### 5. Access the Web Interface
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 🎮 How to Interact with Ren

1. **Speak to Him**: Click the large glowing purple/pink **Microphone button** at the bottom and speak aloud. When you finish speaking, Ren will listen, understand, think, and reply to you with voice and animated expressions.
2. **Type to Him**: Type your message into the text box and press `Enter` or click the Send (`➤`) button.
3. **Expression Tester**: Click any of the 13 expression chips at the top/bottom of the screen (`Happy`, `Sad`, `Angry`, `Surprised`, `Shy`, `Laughing`, `Thinking`, `Confused`, `Excited`, `Sleepy`, `Crying`, `Caring`, `Neutral`) to watch Ren morph instantly into that emotion with smooth physics and custom dialogue!
4. **Voice On/Off**: Click `🔊 Voice On` to mute/unmute audio playback.
5. **Stop Speaking**: Click `⏹️ Stop` to instantly cut off speech playback.
6. **Conversation History**: Click `💬 History` to open the slide-out drawer showing all previous turns with detected emotions.
7. **Settings**: Click `⚙️ Settings` to pick different neural voices or enter your Groq/OpenAI/Gemini API keys.

---

## 📁 Project Structure

```
ai-anime-boy-companion/
├── app.py                     # Flask server & REST API routes
├── config.py                  # Configuration loader & .env manager
├── requirements.txt           # Project dependencies
├── .env.example               # Environment variables template
├── .env                       # Local configuration
├── run.bat                    # One-click Windows runner
├── README.md                  # Complete documentation
├── modules/
│   ├── __init__.py
│   ├── emotion.py             # NLP contextual emotion detection engine
│   ├── chatbot.py             # LLM dialog engine (Groq, OpenAI, Gemini, Offline)
│   ├── tts.py                 # Edge-TTS voice generation & audio caching
│   └── speech.py              # Speech transcription utilities
├── static/
│   ├── css/
│   │   └── style.css          # Modern pastel anime glassmorphism design
│   ├── js/
│   │   ├── character.js       # 2D Anime Canvas engine (13 expressions, lip-sync, blinking, physics)
│   │   ├── audio.js           # Audio playback, Web Audio FFT analyzer, Web Speech API
│   │   ├── chat.js            # Chat manager, typewriter effect, conversation memory
│   │   └── app.js             # Bootstrap & UI event handlers
│   └── audio/                 # Cached voice synthesis audio files
└── templates/
    └── index.html             # Main web application interface
```

---

## 📄 License
MIT License. Created with love for AI Anime Companion enthusiasts!
