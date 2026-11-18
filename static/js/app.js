/**
 * Application Bootstrap & UI Event Handlers
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize character rendering engine
    const renderer = new AnimeBoyRenderer('characterCanvas');

    // 2. Initialize audio & voice system
    const audio = new AudioManager(renderer);

    // 3. Initialize chat controller
    const chat = new ChatController(renderer, audio);

    // Elements
    const micBtn = document.getElementById('micBtn');
    const textInput = document.getElementById('textInput');
    const sendBtn = document.getElementById('sendBtn');
    const muteBtn = document.getElementById('muteBtn');
    const stopSpeechBtn = document.getElementById('stopSpeechBtn');
    const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const historyPanel = document.getElementById('historyPanel');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const voiceSelect = document.getElementById('voiceSelect');
    const emotionButtons = document.querySelectorAll('.emo-chip');

    // Audio status sync callback
    audio.onStatusCallback = (status, err) => {
        if (status === 'listening') {
            micBtn.classList.add('mic-active');
            chat.setStatus('Listening...', 'listening');
            chat.showSubtitle('Ren', 'Listening... speak into your microphone now!', false);
        } else if (status === 'speaking') {
            micBtn.classList.remove('mic-active');
            chat.setStatus('Speaking...', 'speaking');
        } else if (status === 'error') {
            micBtn.classList.remove('mic-active');
            micRecording = false;
            if (err === 'not-allowed' || err === 'permission-denied') {
                chat.setStatus('Mic Blocked', 'error');
                chat.showSubtitle('System', '⚠️ Microphone access was blocked. Please click the lock or camera icon in your address bar to ALLOW microphone access, then try again.', false);
                alert("Microphone permission required! Please click the icon in your address bar and allow microphone permissions for this page.");
            } else if (err === 'no-speech') {
                chat.setStatus('No Speech', 'idle');
                chat.showSubtitle('Ren', "I didn't catch that. Click the mic again and speak clearly, or type your message below!", false);
            } else if (err === 'network') {
                chat.setStatus('Network Issue', 'error');
                chat.showSubtitle('Ren', 'Speech recognition network service error. You can type directly in the box below!', false);
            } else if (err === 'not-supported') {
                chat.setStatus('Not Supported', 'error');
                chat.showSubtitle('System', 'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.', false);
            } else {
                chat.setStatus('Idle', 'idle');
                chat.showSubtitle('Ren', `Microphone event (${err}). Click the mic to try again or type a message.`, false);
            }
        } else {
            micBtn.classList.remove('mic-active');
            if (!chat.isProcessing) {
                chat.setStatus('Idle', 'idle');
            }
        }
    };

    // Microphone interaction
    let micRecording = false;

    micBtn.addEventListener('click', async () => {
        if (audio.isSpeaking) {
            audio.stopSpeaking();
        }

        if (micRecording) {
            audio.stopListening();
            micRecording = false;
            chat.setStatus('Processing...', 'idle');
        } else {
            micRecording = true;
            chat.showSubtitle('Ren', 'Requesting microphone access...', false);

            await audio.startListening(
                (transcript, isFinal) => {
                    textInput.value = transcript;
                    chat.showSubtitle('You (Speaking)', transcript, false);
                    if (isFinal && transcript.trim().length > 0) {
                        micRecording = false;
                        audio.stopListening();
                        chat.sendMessage(transcript.trim());
                        textInput.value = '';
                    }
                },
                (status, err) => {
                    if (status === 'idle') micRecording = false;
                }
            );
        }
    });

    // Send button & Enter key
    const handleSend = () => {
        const text = textInput.value.trim();
        if (text) {
            if (micRecording) {
                audio.stopListening();
                micRecording = false;
            }
            chat.sendMessage(text);
            textInput.value = '';
        }
    };

    sendBtn.addEventListener('click', handleSend);
    textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Stop speaking button
    stopSpeechBtn.addEventListener('click', () => {
        audio.stopSpeaking();
    });

    // Mute toggle
    muteBtn.addEventListener('click', () => {
        const isMuted = audio.toggleMute();
        muteBtn.innerHTML = isMuted ? '<i class="icon">🔇</i><span>Muted</span>' : '<i class="icon">🔊</i><span>Voice On</span>';
        muteBtn.classList.toggle('btn-muted', isMuted);
    });

    // History drawer toggle
    const toggleHistory = () => {
        historyPanel.classList.toggle('panel-open');
    };
    toggleHistoryBtn.addEventListener('click', toggleHistory);
    closeHistoryBtn.addEventListener('click', toggleHistory);

    // Clear history
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm("Reset conversation history?")) {
            chat.clearConversation();
        }
    });

    // Quick Expression Tester Buttons
    emotionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const emo = btn.getAttribute('data-emotion');
            if (emo) {
                renderer.setEmotion(emo);
                chat.setEmotionBadge(emo);
                // Highlight active chip
                emotionButtons.forEach(b => b.classList.remove('emo-chip-active'));
                btn.classList.add('emo-chip-active');

                // Sample phrase for testing
                const samples = {
                    happy: "It's so great being here with you!",
                    sad: "I'm feeling a little down right now...",
                    angry: "Hey! Don't push me too far, okay?",
                    surprised: "Whoa, wait! Are you serious right now?!",
                    shy: "W-Wait... you're making me blush under my hoodie...",
                    laughing: "Hahaha! Oh man, that was hilarious!",
                    thinking: "Hmm, let me consider that for a moment...",
                    confused: "Wait, what? I don't think I understand that at all.",
                    excited: "Yes!! That is absolutely incredible! Let's go!!",
                    sleepy: "Yaaawn... my eyes are getting so heavy...",
                    crying: "I can't help it... the tears won't stop...",
                    caring: "I'm right here. You'll never be alone, I promise.",
                    neutral: "I'm all ears. What's on your mind?"
                };
                chat.showSubtitle('Ren', samples[emo] || emo, true);
            }
        });
    });

    // Settings Modal
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('modal-hidden');
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('modal-hidden');
    });

    saveSettingsBtn.addEventListener('click', async () => {
        const voice = voiceSelect.value;
        const groqKey = document.getElementById('groqKeyInput').value.trim();
        const openaiKey = document.getElementById('openaiKeyInput').value.trim();
        const geminiKey = document.getElementById('geminiKeyInput').value.trim();

        chat.selectedVoice = voice;

        try {
            const resp = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    voice: voice,
                    groq_api_key: groqKey,
                    openai_api_key: openaiKey,
                    gemini_api_key: geminiKey
                })
            });
            const data = await resp.json();
            if (data.success) {
                alert(`Settings saved! Active LLM provider: ${data.active_provider}`);
                settingsModal.classList.add('modal-hidden');
            }
        } catch (e) {
            console.error("Save settings error:", e);
        }
    });

    // Global keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        // Esc to stop speaking
        if (e.key === 'Escape') {
            audio.stopSpeaking();
            if (!settingsModal.classList.contains('modal-hidden')) {
                settingsModal.classList.add('modal-hidden');
            }
        }
    });

    // Initial greeting
    setTimeout(() => {
        renderer.setEmotion('happy');
        chat.setEmotionBadge('happy');
        chat.showSubtitle('Ren', "Hey there! I'm Ren, your anime companion. Feel free to speak or type to me!", true);
    }, 600);
});
