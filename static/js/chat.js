/**
 * Chat & Dialogue Controller
 * Manages conversation state, API communication, subtitle typewriter, and message history
 */

class ChatController {
    constructor(characterRenderer, audioManager) {
        this.renderer = characterRenderer;
        this.audio = audioManager;

        this.history = [];
        this.isProcessing = false;
        this.ttsEnabled = true;
        this.selectedVoice = 'en-US-ChristopherNeural';

        // UI Element cache
        this.subtitlesEl = document.getElementById('subtitles');
        this.subtitleTextEl = document.getElementById('subtitleText');
        this.subtitleSpeakerEl = document.getElementById('subtitleSpeaker');
        this.historyContainerEl = document.getElementById('historyContainer');
        this.statusBadgeEl = document.getElementById('statusBadge');
        this.emotionBadgeEl = document.getElementById('emotionBadge');
        this.userEmotionBadgeEl = document.getElementById('userEmotionBadge');
    }

    setStatus(statusText, type = 'idle') {
        if (!this.statusBadgeEl) return;
        this.statusBadgeEl.textContent = statusText;
        this.statusBadgeEl.className = `status-pill status-${type}`;
    }

    setEmotionBadge(emotionName, icon = '😊') {
        if (!this.emotionBadgeEl) return;
        this.emotionBadgeEl.innerHTML = `<span class="emo-icon">${icon}</span> <span class="emo-name">${emotionName.toUpperCase()}</span>`;
    }

    setUserEmotionBadge(emotionName) {
        if (!this.userEmotionBadgeEl) return;
        const icons = {
            happy: '😊', sad: '🥺', angry: '😠', surprised: '😲', shy: '😳',
            laughing: '😄', thinking: '🤔', confused: '🤨', excited: '🤩',
            sleepy: '🥱', crying: '😭', caring: '🥰', neutral: '😐'
        };
        const icon = icons[emotionName] || '💬';
        this.userEmotionBadgeEl.innerHTML = `<span class="emo-icon">${icon}</span> You: ${emotionName}`;
    }

    showSubtitle(speaker, text, isTypewriter = true) {
        if (!this.subtitlesEl || !this.subtitleTextEl) return;
        this.subtitleSpeakerEl.textContent = speaker;
        this.subtitlesEl.classList.remove('hidden');

        if (!isTypewriter) {
            this.subtitleTextEl.textContent = text;
            return;
        }

        // Typewriter animation
        this.subtitleTextEl.textContent = '';
        let index = 0;
        const speed = Math.max(12, Math.min(30, 2500 / text.length));

        if (this.typewriterInterval) clearInterval(this.typewriterInterval);

        this.typewriterInterval = setInterval(() => {
            if (index < text.length) {
                this.subtitleTextEl.textContent += text.charAt(index);
                index++;
            } else {
                clearInterval(this.typewriterInterval);
            }
        }, speed);
    }

    addMessageToHistory(role, text, emotion = 'neutral') {
        const msg = {
            id: Date.now(),
            role,
            text,
            emotion,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        this.history.push(msg);

        if (this.historyContainerEl) {
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble chat-bubble-${role}`;

            const emoTag = emotion ? `<span class="bubble-emotion-tag">${emotion}</span>` : '';
            bubble.innerHTML = `
                <div class="bubble-header">
                    <span class="bubble-sender">${role === 'user' ? 'You' : 'Ren'}</span>
                    ${emoTag}
                    <span class="bubble-time">${msg.time}</span>
                </div>
                <div class="bubble-content">${this.escapeHtml(text)}</div>
            `;
            this.historyContainerEl.appendChild(bubble);
            this.historyContainerEl.scrollTop = this.historyContainerEl.scrollHeight;
        }
    }

    escapeHtml(str) {
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag));
    }

    async sendMessage(userText) {
        const text = userText.trim();
        if (!text || this.isProcessing) return;

        this.isProcessing = true;

        // 1. Show user message
        this.addMessageToHistory('user', text);
        this.showSubtitle('You', text, false);

        // 2. Set Avatar to Thinking state
        this.renderer.setState('thinking');
        this.setStatus('Thinking...', 'thinking');

        try {
            const resp = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    tts_enabled: this.ttsEnabled,
                    voice: this.selectedVoice
                })
            });

            const data = await resp.json();

            if (!data.success) {
                throw new Error(data.error || 'Server error');
            }

            // 3. Update detected emotions
            this.setUserEmotionBadge(data.user_emotion);
            const avatarEmo = data.avatar_emotion || 'happy';
            this.renderer.setEmotion(avatarEmo);
            this.setEmotionBadge(avatarEmo);

            // 4. Show Avatar Reply
            this.addMessageToHistory('assistant', data.reply, avatarEmo);
            this.showSubtitle(data.character_name || 'Ren', data.reply, true);

            // 5. Play Voice with Lip-Sync
            if (this.ttsEnabled && data.audio && data.audio.success && data.audio.audio_url) {
                this.setStatus('Speaking...', 'speaking');
                this.audio.playAudio(data.audio.audio_url, () => {
                    this.setStatus('Idle', 'idle');
                });
            } else if (this.ttsEnabled) {
                // Browser TTS fallback
                this.setStatus('Speaking...', 'speaking');
                this.audio.speakBrowserFallback(data.reply, () => {
                    this.setStatus('Idle', 'idle');
                });
            } else {
                this.setStatus('Idle', 'idle');
                this.renderer.setState('idle');
            }

        } catch (err) {
            console.error("Chat error:", err);
            this.setStatus('Error', 'error');
            this.renderer.setEmotion('confused');
            this.showSubtitle('Ren', "Ah, sorry, I had a little trouble hearing you properly. Could you say that again?", true);
        } finally {
            this.isProcessing = false;
        }
    }

    async clearConversation() {
        try {
            await fetch('/api/clear', { method: 'POST' });
            this.history = [];
            if (this.historyContainerEl) {
                this.historyContainerEl.innerHTML = '';
            }
            if (this.subtitlesEl) {
                this.subtitlesEl.classList.add('hidden');
            }
            this.renderer.setEmotion('neutral');
            this.setEmotionBadge('neutral');
            this.setUserEmotionBadge('neutral');
            this.setStatus('Idle', 'idle');
        } catch (e) {
            console.error("Failed to clear chat:", e);
        }
    }
}

window.ChatController = ChatController;
