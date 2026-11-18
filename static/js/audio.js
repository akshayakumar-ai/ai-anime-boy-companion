/**
 * Audio & Voice Management Module
 * Handles:
 *  - Speech-to-Text (Web Speech API Recognition)
 *  - Text-to-Speech Audio Playback with Web Audio API FFT Lip-Sync
 *  - Speech Synthesis Fallback
 *  - Mute & Stop Speech Controls
 */

class AudioManager {
    constructor(characterRenderer) {
        this.renderer = characterRenderer;

        // Audio Context & Analyser for real-time lip sync
        this.audioCtx = null;
        this.analyser = null;
        this.sourceNode = null;
        this.currentAudio = null;
        this.isSpeaking = false;
        this.isMuted = false;

        // Web Speech Recognition
        this.recognition = null;
        this.isListening = false;
        this.onTranscriptCallback = null;
        this.onStatusCallback = null;

        this.initSpeechRecognition();
    }

    initAudioContext() {
        if (!this.audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.audioCtx = new AudioContextClass();
                this.analyser = this.audioCtx.createAnalyser();
                this.analyser.fftSize = 256;
                this.analyser.smoothingTimeConstant = 0.65;
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    initSpeechRecognition() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            console.warn("SpeechRecognition not supported in this browser. User can use text input.");
            return;
        }

        this.recognition = new SpeechRec();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            if (this.renderer) this.renderer.setState('listening');
            if (this.onStatusCallback) this.onStatusCallback('listening');
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (this.onTranscriptCallback) {
                this.onTranscriptCallback(finalTranscript || interimTranscript, Boolean(finalTranscript));
            }
        };

        this.recognition.onerror = (event) => {
            console.warn("Speech recognition event:", event.error);
            this.isListening = false;
            if (this.renderer && this.renderer.state === 'listening') {
                this.renderer.setState('idle');
            }
            if (this.onStatusCallback) this.onStatusCallback('error', event.error);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            if (this.renderer && this.renderer.state === 'listening') {
                this.renderer.setState('idle');
            }
            if (this.onStatusCallback) this.onStatusCallback('idle');
        };
    }

    async startListening(onTranscript, onStatus) {
        this.onTranscriptCallback = onTranscript;
        this.onStatusCallback = onStatus;

        if (this.isSpeaking) {
            this.stopSpeaking();
        }

        this.initAudioContext();

        // 1. Explicitly request microphone access if supported
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // Stop temporary permission stream so recognition has full exclusive access
                stream.getTracks().forEach(t => t.stop());
            } catch (err) {
                console.warn("Microphone access error:", err);
                if (this.onStatusCallback) {
                    this.onStatusCallback('error', 'not-allowed');
                }
                return;
            }
        }

        if (!this.recognition) {
            this.initSpeechRecognition();
        }

        if (!this.recognition) {
            if (this.onStatusCallback) {
                this.onStatusCallback('error', 'not-supported');
            }
            return;
        }

        try {
            this.recognition.start();
        } catch (e) {
            console.warn("Recognition already started or error:", e);
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (e) {}
        }
        this.isListening = false;
        if (this.renderer && this.renderer.state === 'listening') {
            this.renderer.setState('idle');
        }
        if (this.onStatusCallback) this.onStatusCallback('idle');
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.currentAudio) {
            this.currentAudio.muted = this.isMuted;
        }
        if (this.isMuted && this.isSpeaking) {
            this.stopSpeaking();
        }
        return this.isMuted;
    }

    stopSpeaking() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        this.isSpeaking = false;
        if (this.renderer) {
            this.renderer.setAudioMouthOpen(0);
            this.renderer.setState('idle');
        }
        if (this.onStatusCallback) this.onStatusCallback('idle');
    }

    /**
     * Play synthesized audio from URL with 60 FPS real-time lip sync analysis
     */
    playAudio(audioUrl, onComplete) {
        if (this.isMuted) {
            if (onComplete) onComplete();
            return;
        }

        this.stopSpeaking();
        this.initAudioContext();

        const audio = new Audio(audioUrl);
        audio.crossOrigin = 'anonymous';
        this.currentAudio = audio;
        this.isSpeaking = true;

        if (this.renderer) {
            this.renderer.setState('speaking');
        }
        if (this.onStatusCallback) this.onStatusCallback('speaking');

        // Connect to Web Audio Analyser if supported
        let analyserConnected = false;
        if (this.audioCtx && this.analyser) {
            try {
                this.sourceNode = this.audioCtx.createMediaElementSource(audio);
                this.sourceNode.connect(this.analyser);
                this.analyser.connect(this.audioCtx.destination);
                analyserConnected = true;
            } catch (err) {
                // If CORS or reconnect restrictions arise, fallback to simulated envelope
                analyserConnected = false;
            }
        }

        const dataArray = new Uint8Array(this.analyser ? this.analyser.frequencyBinCount : 32);

        const lipSyncLoop = () => {
            if (!this.isSpeaking || audio.paused || audio.ended) {
                if (this.renderer) this.renderer.setAudioMouthOpen(0);
                return;
            }

            if (analyserConnected && this.analyser) {
                this.analyser.getByteFrequencyData(dataArray);

                // Compute voice energy band (focus on human speech frequencies 200Hz - 3500Hz)
                let sum = 0;
                const sampleCount = Math.min(dataArray.length, 45);
                for (let i = 2; i < sampleCount; i++) {
                    sum += dataArray[i];
                }
                const avg = sum / (sampleCount - 2);
                // Normalized mouth opening (0.0 to 1.0)
                const amp = Math.min(1.0, Math.pow(avg / 95, 1.4));

                if (this.renderer) {
                    this.renderer.setAudioMouthOpen(amp);
                }
            } else {
                // Fallback procedural mouth modulation when media element node cannot connect directly
                const simulatedAmp = Math.abs(Math.sin(performance.now() * 0.015)) * 0.65;
                if (this.renderer) this.renderer.setAudioMouthOpen(simulatedAmp);
            }

            requestAnimationFrame(lipSyncLoop);
        };

        audio.onplay = () => {
            requestAnimationFrame(lipSyncLoop);
        };

        audio.onended = () => {
            this.isSpeaking = false;
            if (this.renderer) {
                this.renderer.setAudioMouthOpen(0);
                this.renderer.setState('idle');
            }
            if (this.onStatusCallback) this.onStatusCallback('idle');
            if (onComplete) onComplete();
        };

        audio.onerror = (e) => {
            console.warn("Audio playback error, falling back to speech synthesis:", e);
            this.isSpeaking = false;
            if (onComplete) onComplete();
        };

        audio.play().catch(e => {
            console.warn("Audio play prevented:", e);
            this.isSpeaking = false;
            if (onComplete) onComplete();
        });
    }

    /**
     * Browser speech synthesis fallback with natural cadence lip-sync
     */
    speakBrowserFallback(text, onComplete) {
        if (!('speechSynthesis' in window) || this.isMuted) {
            if (onComplete) onComplete();
            return;
        }

        this.stopSpeaking();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.05;

        // Try to pick a natural youthful male voice
        const voices = window.speechSynthesis.getVoices();
        const boyVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('David') || v.name.includes('Guy') || v.name.includes('Male')));
        if (boyVoice) utterance.voice = boyVoice;

        this.isSpeaking = true;
        if (this.renderer) this.renderer.setState('speaking');
        if (this.onStatusCallback) this.onStatusCallback('speaking');

        let intervalId = null;

        utterance.onstart = () => {
            intervalId = setInterval(() => {
                if (!this.isSpeaking) {
                    clearInterval(intervalId);
                    return;
                }
                const amp = 0.2 + Math.abs(Math.sin(performance.now() * 0.012)) * 0.55;
                if (this.renderer) this.renderer.setAudioMouthOpen(amp);
            }, 50);
        };

        utterance.onend = () => {
            clearInterval(intervalId);
            this.isSpeaking = false;
            if (this.renderer) {
                this.renderer.setAudioMouthOpen(0);
                this.renderer.setState('idle');
            }
            if (this.onStatusCallback) this.onStatusCallback('idle');
            if (onComplete) onComplete();
        };

        utterance.onerror = () => {
            clearInterval(intervalId);
            this.isSpeaking = false;
            if (this.renderer) this.renderer.setAudioMouthOpen(0);
            if (onComplete) onComplete();
        };

        window.speechSynthesis.speak(utterance);
    }
}

window.AudioManager = AudioManager;
