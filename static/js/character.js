/**
 * Premium 2D Anime Boy Canvas Rendering & Animation Engine
 * Character: "Ren" - Handsome Young Anime Boy Virtual Companion
 * Features:
 *  - Professional Anime Art Style with Smooth Gradients & Soft Lighting
 *  - Large, Expressive Dark Brown Eyes with Golden-Amber Highlights & Crisp Catchlights
 *  - Fluffy, Layered, Slightly Messy Black Hair with Highlights (Eyes Fully Visible)
 *  - Attractive Anime Facial Proportions, Natural Skin Shading & Soft Blush
 *  - Oversized Black Hoodie with Realistic Folds & Drawstring Cords
 *  - 13 Beautiful, Visually Distinct Facial Expressions with Smooth Morphing
 *  - Real-Time Lip Synchronization (Web Audio API Amplitude & Formants)
 *  - Procedural Blinking, Gentle Breathing Physics & Mouse Parallax Tracking
 *  - Animated Falling Tears (Crying/Sad) & Rising Sparkles (Excited)
 */

class AnimeBoyRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) throw new Error(`Canvas #${canvasId} not found`);
        this.ctx = this.canvas.getContext('2d');

        // High DPI handling
        this.dpr = window.devicePixelRatio || 1;
        this.width = 680;
        this.height = 680;
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Mouse gaze tracking (normalized -1 to +1)
        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.setupMouseTracking();

        // Animation timing
        this.time = 0;
        this.lastFrameTime = performance.now();

        // States
        this.state = 'idle'; // 'idle', 'listening', 'thinking', 'speaking'
        this.currentEmotion = 'neutral';
        this.targetEmotion = 'neutral';

        // Real-time audio mouth drive
        this.audioMouthOpen = 0;
        this.audioViseme = 'aa';

        // Procedural Blinking with smooth cubic easing
        this.blinkProgress = 0; // 0 = open, 1 = closed
        this.isBlinking = false;
        this.blinkDuration = 150; // ms
        this.blinkTimer = 0;
        this.nextBlinkInterval = 2800 + Math.random() * 3000;

        // Dynamic Interpolated Parameters (60 FPS lerp)
        this.params = {
            // Eyes
            eyeOpenL: 1.0,
            eyeOpenR: 1.0,
            eyeGazeX: 0.0,
            eyeGazeY: 0.0,
            eyeSquint: 0.0,
            starPupil: 0.0,
            wateryGlint: 0.0,

            // Brows
            browY: 0.0,        // -1 (down) to +1 (up)
            browTilt: 0.0,     // -1 (sad / \) to +1 (angry \ /)
            browAsymm: 0.0,    // confused / curious

            // Mouth
            mouthSmile: 0.2,   // -1 to +1
            mouthOpen: 0.0,    // 0 to 1
            mouthWidth: 1.0,
            mouthO: 0.0,       // 0 to 1 (rounded vowel)

            // Face / Head
            blush: 0.12,       // 0 to 1
            headTilt: 0.0,     // radians
            headX: 0.0,
            headY: 0.0,
            breathingOffset: 0.0,

            // Particles
            tearIntensity: 0.0,
            sparkleIntensity: 0.0
        };

        // All 13 Detailed Emotional Presets
        this.emotionPresets = {
            neutral: {
                eyeOpenL: 1.0, eyeOpenR: 1.0, eyeGazeX: 0.0, eyeGazeY: 0.0, eyeSquint: 0.0,
                starPupil: 0.0, wateryGlint: 0.05,
                browY: 0.0, browTilt: 0.0, browAsymm: 0.0,
                mouthSmile: 0.2, mouthOpen: 0.0, mouthWidth: 1.0, mouthO: 0.0,
                blush: 0.12, headTilt: 0.0, headY: 0.0,
                tearIntensity: 0.0, sparkleIntensity: 0.0
            },
            happy: {
                eyeOpenL: 0.95, eyeOpenR: 0.95, eyeGazeX: 0.0, eyeGazeY: -0.05, eyeSquint: 0.25,
                starPupil: 0.3, wateryGlint: 0.15,
                browY: 0.25, browTilt: 0.15, browAsymm: 0.0,
                mouthSmile: 0.85, mouthOpen: 0.2, mouthWidth: 1.15, mouthO: 0.0,
                blush: 0.45, headTilt: 0.03, headY: -3.0,
                tearIntensity: 0.0, sparkleIntensity: 0.35
            },
            sad: {
                eyeOpenL: 0.85, eyeOpenR: 0.85, eyeGazeX: 0.0, eyeGazeY: 0.18, eyeSquint: 0.1,
                starPupil: 0.0, wateryGlint: 0.75,
                browY: -0.2, browTilt: -0.7, browAsymm: 0.0,
                mouthSmile: -0.6, mouthOpen: 0.08, mouthWidth: 0.85, mouthO: 0.0,
                blush: 0.1, headTilt: -0.04, headY: 4.0,
                tearIntensity: 0.35, sparkleIntensity: 0.0
            },
            angry: {
                eyeOpenL: 0.78, eyeOpenR: 0.78, eyeGazeX: 0.0, eyeGazeY: 0.0, eyeSquint: 0.5,
                starPupil: 0.0, wateryGlint: 0.0,
                browY: -0.45, browTilt: 0.85, browAsymm: 0.0,
                mouthSmile: -0.5, mouthOpen: 0.12, mouthWidth: 0.9, mouthO: 0.0,
                blush: 0.25, headTilt: 0.0, headY: 2.0,
                tearIntensity: 0.0, sparkleIntensity: 0.0
            },
            surprised: {
                eyeOpenL: 1.3, eyeOpenR: 1.3, eyeGazeX: 0.0, eyeGazeY: -0.1, eyeSquint: -0.25,
                starPupil: 0.2, wateryGlint: 0.15,
                browY: 0.85, browTilt: 0.0, browAsymm: 0.0,
                mouthSmile: 0.05, mouthOpen: 0.7, mouthWidth: 0.8, mouthO: 0.9,
                blush: 0.2, headTilt: 0.0, headY: -6.0,
                tearIntensity: 0.0, sparkleIntensity: 0.1
            },
            shy: {
                eyeOpenL: 0.82, eyeOpenR: 0.82, eyeGazeX: -0.25, eyeGazeY: 0.25, eyeSquint: 0.2,
                starPupil: 0.15, wateryGlint: 0.35,
                browY: 0.1, browTilt: -0.3, browAsymm: 0.0,
                mouthSmile: 0.45, mouthOpen: 0.05, mouthWidth: 0.88, mouthO: 0.0,
                blush: 0.9, headTilt: -0.05, headY: 3.0,
                tearIntensity: 0.0, sparkleIntensity: 0.05
            },
            laughing: {
                eyeOpenL: 0.0, eyeOpenR: 0.0, eyeGazeX: 0.0, eyeGazeY: 0.0, eyeSquint: 0.85,
                starPupil: 0.0, wateryGlint: 0.0,
                browY: 0.4, browTilt: 0.15, browAsymm: 0.0,
                mouthSmile: 0.95, mouthOpen: 0.75, mouthWidth: 1.35, mouthO: 0.0,
                blush: 0.5, headTilt: 0.06, headY: -4.0,
                tearIntensity: 0.0, sparkleIntensity: 0.5
            },
            thinking: {
                eyeOpenL: 0.9, eyeOpenR: 0.95, eyeGazeX: 0.4, eyeGazeY: -0.38, eyeSquint: 0.15,
                starPupil: 0.0, wateryGlint: 0.05,
                browY: 0.2, browTilt: 0.25, browAsymm: 0.45,
                mouthSmile: 0.1, mouthOpen: 0.06, mouthWidth: 0.8, mouthO: 0.25,
                blush: 0.12, headTilt: 0.06, headY: -1.5,
                tearIntensity: 0.0, sparkleIntensity: 0.0
            },
            confused: {
                eyeOpenL: 1.08, eyeOpenR: 0.82, eyeGazeX: -0.12, eyeGazeY: -0.05, eyeSquint: 0.0,
                starPupil: 0.0, wateryGlint: 0.05,
                browY: 0.25, browTilt: 0.15, browAsymm: 0.9,
                mouthSmile: -0.2, mouthOpen: 0.22, mouthWidth: 0.78, mouthO: 0.45,
                blush: 0.15, headTilt: 0.13, headY: 0.0,
                tearIntensity: 0.0, sparkleIntensity: 0.0
            },
            excited: {
                eyeOpenL: 1.2, eyeOpenR: 1.2, eyeGazeX: 0.0, eyeGazeY: -0.08, eyeSquint: -0.15,
                starPupil: 1.0, wateryGlint: 0.45,
                browY: 0.55, browTilt: 0.25, browAsymm: 0.0,
                mouthSmile: 0.9, mouthOpen: 0.6, mouthWidth: 1.3, mouthO: 0.0,
                blush: 0.55, headTilt: 0.03, headY: -5.0,
                tearIntensity: 0.0, sparkleIntensity: 1.0
            },
            sleepy: {
                eyeOpenL: 0.32, eyeOpenR: 0.32, eyeGazeX: 0.0, eyeGazeY: 0.22, eyeSquint: 0.35,
                starPupil: 0.0, wateryGlint: 0.0,
                browY: -0.12, browTilt: -0.25, browAsymm: 0.0,
                mouthSmile: 0.08, mouthOpen: 0.25, mouthWidth: 0.85, mouthO: 0.6, // soft yawning
                blush: 0.2, headTilt: -0.06, headY: 6.0,
                tearIntensity: 0.0, sparkleIntensity: 0.0
            },
            crying: {
                eyeOpenL: 0.75, eyeOpenR: 0.75, eyeGazeX: 0.0, eyeGazeY: 0.12, eyeSquint: 0.35,
                starPupil: 0.0, wateryGlint: 1.0,
                browY: -0.3, browTilt: -0.85, browAsymm: 0.0,
                mouthSmile: -0.8, mouthOpen: 0.3, mouthWidth: 0.9, mouthO: 0.15,
                blush: 0.4, headTilt: -0.05, headY: 5.0,
                tearIntensity: 1.0, sparkleIntensity: 0.0
            },
            caring: {
                eyeOpenL: 0.96, eyeOpenR: 0.96, eyeGazeX: 0.0, eyeGazeY: 0.02, eyeSquint: 0.15,
                starPupil: 0.25, wateryGlint: 0.25,
                browY: 0.2, browTilt: -0.22, browAsymm: 0.0,
                mouthSmile: 0.65, mouthOpen: 0.06, mouthWidth: 1.08, mouthO: 0.0,
                blush: 0.38, headTilt: 0.05, headY: 0.0,
                tearIntensity: 0.0, sparkleIntensity: 0.2
            }
        };

        this.particles = [];
        this.initLoop();
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.width = rect.width || 680;
        this.height = rect.height || 680;
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);
    }

    setupMouseTracking() {
        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const relX = e.clientX - rect.left;
            const relY = e.clientY - rect.top;
            this.mouse.targetX = Math.max(-1, Math.min(1, ((relX / this.width) - 0.5) * 2));
            this.mouse.targetY = Math.max(-1, Math.min(1, ((relY / this.height) - 0.5) * 2));
        });
    }

    setEmotion(emotionName) {
        if (this.emotionPresets[emotionName]) {
            this.targetEmotion = emotionName;
            this.currentEmotion = emotionName;
        }
    }

    setState(newState) {
        this.state = newState;
        if (newState === 'thinking') {
            this.setEmotion('thinking');
        } else if (newState === 'listening') {
            if (this.currentEmotion === 'neutral') {
                this.setEmotion('caring');
            }
        }
    }

    setAudioMouthOpen(amplitude, viseme = 'aa') {
        this.audioMouthOpen = Math.min(1.0, Math.max(0.0, amplitude));
        this.audioViseme = viseme;
    }

    updateBlink(delta) {
        this.blinkTimer += delta;
        if (!this.isBlinking && this.blinkTimer > this.nextBlinkInterval) {
            this.isBlinking = true;
            this.blinkTimer = 0;
            this.blinkProgress = 0;
            this.nextBlinkInterval = Math.random() < 0.25 ? 300 : 2500 + Math.random() * 3200;
        }

        if (this.isBlinking) {
            this.blinkTimer += delta;
            const halfDuration = this.blinkDuration / 2;
            if (this.blinkTimer < halfDuration) {
                // Smooth closing
                const t = this.blinkTimer / halfDuration;
                this.blinkProgress = t * t * (3 - 2 * t);
            } else if (this.blinkTimer < this.blinkDuration) {
                // Smooth opening
                const t = 1 - (this.blinkTimer - halfDuration) / halfDuration;
                this.blinkProgress = t * t * (3 - 2 * t);
            } else {
                this.blinkProgress = 0;
                this.isBlinking = false;
                this.blinkTimer = 0;
            }
        }
    }

    update(delta) {
        this.time += delta * 0.001;

        // Mouse gaze smoothing
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.06;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.06;

        this.updateBlink(delta);

        // Smooth parameter interpolation
        const target = this.emotionPresets[this.targetEmotion] || this.emotionPresets.neutral;
        const lerpFactor = 0.095;

        for (const key in target) {
            this.params[key] += (target[key] - this.params[key]) * lerpFactor;
        }

        // Breathing physics (gentle shoulder and head heave)
        const breatheSpeed = this.state === 'sleepy' ? 1.0 : (this.state === 'listening' ? 2.1 : 1.5);
        this.params.breathingOffset = Math.sin(this.time * breatheSpeed) * 3.2;

        // Lip-sync / Speaking modulation
        if (this.state === 'speaking' || this.audioMouthOpen > 0.02) {
            this.params.mouthOpen += (this.audioMouthOpen - this.params.mouthOpen) * 0.38;
        } else {
            this.params.mouthOpen += (target.mouthOpen - this.params.mouthOpen) * 0.16;
        }

        // Particle updates
        this.updateParticles(delta);
    }

    updateParticles(delta) {
        // Spawn tears when crying / sad
        if (this.params.tearIntensity > 0.15 && Math.random() < 0.09 * this.params.tearIntensity) {
            const isLeft = Math.random() < 0.5;
            this.particles.push({
                type: 'tear',
                x: isLeft ? -48 + (Math.random() * 8) : 48 + (Math.random() * 8),
                y: -15,
                vy: 0.9 + Math.random() * 1.3,
                size: 2.8 + Math.random() * 2.2,
                alpha: 0.9,
                life: 1.0
            });
        }

        // Spawn golden sparkles when excited / happy
        if (this.params.sparkleIntensity > 0.15 && Math.random() < 0.14 * this.params.sparkleIntensity) {
            this.particles.push({
                type: 'sparkle',
                x: -140 + Math.random() * 280,
                y: -90 + Math.random() * 200,
                vy: -0.7 - Math.random() * 0.9,
                rotation: Math.random() * Math.PI,
                rotSpeed: (Math.random() - 0.5) * 0.09,
                size: 5 + Math.random() * 7,
                alpha: 1.0,
                life: 1.0
            });
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.y += p.vy;
            p.life -= 0.013;
            p.alpha = Math.max(0, p.life);
            if (p.type === 'sparkle') p.rotation += p.rotSpeed;
            if (p.life <= 0 || p.y > 220) {
                this.particles.splice(i, 1);
            }
        }
    }

    render() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        ctx.clearRect(0, 0, w, h);

        ctx.save();
        // Position character prominently in upper-center, displaying head, shoulders, and chest
        const centerX = w / 2;
        const centerY = h * 0.50 + this.params.breathingOffset + this.params.headY;

        ctx.translate(centerX, centerY);

        // Subtle head tilt (emotion + mouse parallax)
        const totalTilt = this.params.headTilt + (this.mouse.x * 0.025);
        ctx.rotate(totalTilt);

        // 1. Soft atmospheric halo / aura
        this.drawAura(ctx);

        // 2. Realistic Oversized Black Hoodie & Shoulders
        this.drawHoodie(ctx);

        // 3. Shaded Anime Neck & Collarbone
        this.drawNeck(ctx);

        // 4. Back Hair Volume (layered depth behind face)
        this.drawBackHair(ctx);

        // 5. Handsome Anime Jaw, Face & Ears
        this.drawFace(ctx);

        // 6. Natural Cheek & Nose Blush
        this.drawBlush(ctx);

        // 7. Expressive Dark Brown Anime Eyes (Beautiful Iris & Speculars)
        this.drawEyes(ctx);

        // 8. Tapered Eyebrows
        this.drawEyebrows(ctx);

        // 9. Delicate Anime Nose
        this.drawNose(ctx);

        // 10. Expressive Mouth (Lip-Sync Flap)
        this.drawMouth(ctx);

        // 11. Front Fluffy Bangs (Frames Face, Keeps Eyes 100% Clear!)
        this.drawFrontHair(ctx);

        // 12. Falling Tears & Floating Sparkles
        this.drawParticles(ctx);

        // 13. State Indicators
        this.drawStateIndicator(ctx);

        ctx.restore();
    }

    drawAura(ctx) {
        ctx.save();
        let auraColor = 'rgba(216, 180, 254, 0.18)'; // soft lilac
        if (this.state === 'listening') auraColor = 'rgba(125, 211, 252, 0.32)'; // cyan glow
        if (this.state === 'thinking') auraColor = 'rgba(253, 224, 71, 0.25)'; // golden idea
        if (this.currentEmotion === 'angry') auraColor = 'rgba(252, 165, 165, 0.25)'; // rosy crimson
        if (this.currentEmotion === 'shy') auraColor = 'rgba(244, 114, 182, 0.28)'; // blush pink

        const grad = ctx.createRadialGradient(0, -30, 90, 0, -30, 320);
        grad.addColorStop(0, auraColor);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, -30, 320, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawHoodie(ctx) {
        ctx.save();
        // Realistic multi-tone oversized black hoodie
        const shadowColor = '#101216';
        const baseColor = '#181b22';
        const midColor = '#232731';
        const highlightColor = '#343a49';

        // 1. Torso & dropped shoulders base
        const hoodieGrad = ctx.createLinearGradient(0, 90, 0, 280);
        hoodieGrad.addColorStop(0, baseColor);
        hoodieGrad.addColorStop(1, shadowColor);

        ctx.fillStyle = hoodieGrad;
        ctx.beginPath();
        ctx.moveTo(-185, 270);
        ctx.bezierCurveTo(-170, 140, -110, 90, -60, 88);
        ctx.lineTo(60, 88);
        ctx.bezierCurveTo(110, 90, 170, 140, 185, 270);
        ctx.lineTo(-185, 270);
        ctx.fill();

        // 2. Realistic fabric shoulder fold creases & seam lines
        ctx.strokeStyle = highlightColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        // Left dropped shoulder seam
        ctx.beginPath();
        ctx.moveTo(-150, 160);
        ctx.bezierCurveTo(-115, 170, -80, 175, -55, 172);
        ctx.stroke();

        // Right dropped shoulder seam
        ctx.beginPath();
        ctx.moveTo(150, 160);
        ctx.bezierCurveTo(115, 170, 80, 175, 55, 172);
        ctx.stroke();

        // Armpit / torso crease shadows
        ctx.strokeStyle = shadowColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-120, 210);
        ctx.quadraticCurveTo(-90, 230, -70, 260);
        ctx.moveTo(120, 210);
        ctx.quadraticCurveTo(90, 230, 70, 260);
        ctx.stroke();

        // 3. Thick Cowl Hood Collar (curving naturally around the neck)
        const cowlGrad = ctx.createLinearGradient(0, 75, 0, 150);
        cowlGrad.addColorStop(0, midColor);
        cowlGrad.addColorStop(1, baseColor);

        ctx.fillStyle = cowlGrad;
        ctx.beginPath();
        ctx.moveTo(-75, 82);
        ctx.bezierCurveTo(-60, 120, -35, 145, 0, 148);
        ctx.bezierCurveTo(35, 145, 60, 120, 75, 82);
        ctx.bezierCurveTo(55, 75, -55, 75, -75, 82);
        ctx.fill();

        // Collar inner crease shadow
        ctx.strokeStyle = shadowColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-65, 88);
        ctx.bezierCurveTo(-40, 125, 0, 136, 0, 136);
        ctx.bezierCurveTo(0, 136, 40, 125, 65, 88);
        ctx.stroke();

        // Inner t-shirt peek under hoodie neckline
        ctx.fillStyle = '#2d3340';
        ctx.beginPath();
        ctx.moveTo(-28, 92);
        ctx.quadraticCurveTo(0, 112, 28, 92);
        ctx.lineTo(24, 98);
        ctx.quadraticCurveTo(0, 118, -24, 98);
        ctx.closePath();
        ctx.fill();

        // 4. White / Silver-Grey Drawstring Cords with realistic weave & metal aglets
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3.8;
        ctx.lineCap = 'round';

        // Left cord
        ctx.beginPath();
        ctx.moveTo(-26, 132);
        ctx.bezierCurveTo(-32, 165, -22, 195, -28, 225);
        ctx.stroke();
        // Left metallic aglet with highlight
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-31, 222, 6, 12);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-30, 223, 2, 10);

        // Right cord
        ctx.beginPath();
        ctx.moveTo(26, 132);
        ctx.bezierCurveTo(32, 160, 24, 195, 27, 225);
        ctx.stroke();
        // Right metallic aglet
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(24, 222, 6, 12);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(25, 223, 2, 10);

        ctx.restore();
    }

    drawNeck(ctx) {
        ctx.save();
        // Natural porcelain anime skin with soft gradient shading
        const neckGrad = ctx.createLinearGradient(0, 45, 0, 100);
        neckGrad.addColorStop(0, '#fde8dc');
        neckGrad.addColorStop(1, '#f9d3bf');

        ctx.fillStyle = neckGrad;
        ctx.beginPath();
        ctx.moveTo(-32, 45);
        ctx.lineTo(-30, 102);
        ctx.lineTo(30, 102);
        ctx.lineTo(32, 45);
        ctx.closePath();
        ctx.fill();

        // Soft ambient occlusion shadow under chin
        ctx.fillStyle = 'rgba(210, 145, 125, 0.42)';
        ctx.beginPath();
        ctx.moveTo(-32, 45);
        ctx.bezierCurveTo(-18, 68, 18, 68, 32, 45);
        ctx.lineTo(30, 78);
        ctx.bezierCurveTo(18, 86, -18, 86, -30, 78);
        ctx.closePath();
        ctx.fill();

        // Delicate throat / sternocleidomastoid contour
        ctx.strokeStyle = 'rgba(210, 145, 125, 0.45)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-14, 82);
        ctx.lineTo(-6, 96);
        ctx.moveTo(14, 82);
        ctx.lineTo(6, 96);
        ctx.stroke();

        ctx.restore();
    }

    drawBackHair(ctx) {
        ctx.save();
        // Layered fluffy black hair behind head (tonal depth)
        const darkHair = '#111317';
        const midHair = '#191c22';

        const hairGrad = ctx.createRadialGradient(0, -40, 50, 0, -40, 160);
        hairGrad.addColorStop(0, midHair);
        hairGrad.addColorStop(1, darkHair);

        ctx.fillStyle = hairGrad;
        ctx.beginPath();
        // Left volume tufts
        ctx.moveTo(-82, -30);
        ctx.bezierCurveTo(-130, -5, -125, 55, -92, 92);
        ctx.lineTo(-68, 75);
        // Right volume tufts
        ctx.lineTo(68, 75);
        ctx.bezierCurveTo(125, 55, 130, -5, 82, -30);
        ctx.bezierCurveTo(105, -135, -105, -135, -82, -30);
        ctx.fill();

        // Detailed feathered back tuft edges
        ctx.strokeStyle = '#262b36';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-115, 20);
        ctx.quadraticCurveTo(-125, 45, -100, 70);
        ctx.moveTo(115, 20);
        ctx.quadraticCurveTo(125, 45, 100, 70);
        ctx.stroke();

        ctx.restore();
    }

    drawFace(ctx) {
        ctx.save();
        // 1. Detailed Anime Ears
        const earSkin = '#fae1d3';
        const earShadow = 'rgba(225, 155, 140, 0.48)';

        // Left Ear
        ctx.fillStyle = earSkin;
        ctx.beginPath();
        ctx.ellipse(-80, 8, 14, 22, -0.15, 0, Math.PI * 2);
        ctx.fill();
        // Left ear inner helix & antihelix
        ctx.fillStyle = earShadow;
        ctx.beginPath();
        ctx.ellipse(-79, 8, 7, 13, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(205, 135, 120, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(-79, 4, 5, 0.8 * Math.PI, 1.8 * Math.PI);
        ctx.stroke();

        // Right Ear
        ctx.fillStyle = earSkin;
        ctx.beginPath();
        ctx.ellipse(80, 8, 14, 22, 0.15, 0, Math.PI * 2);
        ctx.fill();
        // Right ear inner helix
        ctx.fillStyle = earShadow;
        ctx.beginPath();
        ctx.ellipse(79, 8, 7, 13, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(205, 135, 120, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(79, 4, 5, 1.2 * Math.PI, 0.2 * Math.PI, true);
        ctx.stroke();

        // 2. Handsome Tapered Anime Jawline & Porcelain Face Base
        const faceGrad = ctx.createLinearGradient(0, -80, 0, 75);
        faceGrad.addColorStop(0, '#fff9f5'); // radiant highlight
        faceGrad.addColorStop(0.65, '#fdebe0'); // soft peach midtone
        faceGrad.addColorStop(1, '#fad7c4'); // soft jaw contour

        ctx.fillStyle = faceGrad;
        ctx.beginPath();
        ctx.moveTo(-78, -30);
        ctx.bezierCurveTo(-80, 20, -70, 44, -36, 62);
        ctx.bezierCurveTo(-18, 71, -5, 74, 0, 75); // refined anime chin
        ctx.bezierCurveTo(5, 74, 18, 71, 36, 62);
        ctx.bezierCurveTo(70, 44, 80, 20, 78, -30);
        ctx.bezierCurveTo(72, -110, -72, -110, -78, -30);
        ctx.closePath();
        ctx.fill();

        // Delicate warm ambient jawline shadow
        ctx.strokeStyle = 'rgba(215, 145, 128, 0.4)';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        ctx.restore();
    }

    drawBlush(ctx) {
        if (this.params.blush <= 0.02) return;
        ctx.save();
        const blushAlpha = Math.min(0.92, this.params.blush);

        // Left Cheek Diffuse Blush
        const gradL = ctx.createRadialGradient(-50, 22, 3, -50, 22, 32);
        gradL.addColorStop(0, `rgba(251, 113, 133, ${blushAlpha * 0.72})`);
        gradL.addColorStop(0.7, `rgba(251, 113, 133, ${blushAlpha * 0.25})`);
        gradL.addColorStop(1, 'rgba(251, 113, 133, 0)');
        ctx.fillStyle = gradL;
        ctx.beginPath();
        ctx.ellipse(-50, 22, 32, 17, -0.1, 0, Math.PI * 2);
        ctx.fill();

        // Right Cheek Diffuse Blush
        const gradR = ctx.createRadialGradient(50, 22, 3, 50, 22, 32);
        gradR.addColorStop(0, `rgba(251, 113, 133, ${blushAlpha * 0.72})`);
        gradR.addColorStop(0.7, `rgba(251, 113, 133, ${blushAlpha * 0.25})`);
        gradR.addColorStop(1, 'rgba(251, 113, 133, 0)');
        ctx.fillStyle = gradR;
        ctx.beginPath();
        ctx.ellipse(50, 22, 32, 17, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Soft nose-bridge blush glow
        const gradNose = ctx.createRadialGradient(0, 18, 1, 0, 18, 16);
        gradNose.addColorStop(0, `rgba(251, 113, 133, ${blushAlpha * 0.45})`);
        gradNose.addColorStop(1, 'rgba(251, 113, 133, 0)');
        ctx.fillStyle = gradNose;
        ctx.beginPath();
        ctx.ellipse(0, 18, 16, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cute diagonal anime blush hatching when shy or laughing
        if (this.params.blush > 0.42) {
            ctx.strokeStyle = `rgba(244, 63, 94, ${blushAlpha * 0.85})`;
            ctx.lineWidth = 2.0;
            ctx.lineCap = 'round';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(-60 + i * 9, 17);
                ctx.lineTo(-51 + i * 9, 27);
                ctx.stroke();
            }
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(43 + i * 9, 17);
                ctx.lineTo(52 + i * 9, 27);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    drawEyes(ctx) {
        ctx.save();
        const gazeX = (this.params.eyeGazeX + this.mouse.x * 0.22) * 5.5;
        const gazeY = (this.params.eyeGazeY + this.mouse.y * 0.18) * 4.5;

        // Eye positions (centered, well-proportioned, beautiful spacing)
        const eyeLX = -42;
        const eyeRX = 42;
        const eyeY = 2;

        this.renderSingleEye(ctx, eyeLX, eyeY, this.params.eyeOpenL, gazeX, gazeY, false);
        this.renderSingleEye(ctx, eyeRX, eyeY, this.params.eyeOpenR, gazeX, gazeY, true);

        ctx.restore();
    }

    renderSingleEye(ctx, x, y, openness, gazeX, gazeY, isRight) {
        ctx.save();
        ctx.translate(x, y);

        const effectiveOpen = Math.max(0, openness * (1 - this.blinkProgress));

        // When laughing or completely closed eyes: elegant curved anime lash lines (`^ ^`)
        if (effectiveOpen < 0.16 || this.currentEmotion === 'laughing') {
            ctx.strokeStyle = '#181b22';
            ctx.lineWidth = 3.8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            const sign = isRight ? 1 : -1;
            ctx.moveTo(-21 * sign, 5);
            ctx.quadraticCurveTo(0, -10, 21 * sign, 4);
            ctx.stroke();

            // Winged outer lash flick
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(17 * sign, 2);
            ctx.lineTo(23 * sign, -2);
            ctx.stroke();

            ctx.restore();
            return;
        }

        // Eye dimensions (large, expressive anime eyes)
        const eyeW = 23;
        const eyeH = 17.5 * effectiveOpen;

        // Clip eye boundary for iris
        ctx.save();
        ctx.beginPath();
        // Upper eyelid curvature
        ctx.moveTo(-eyeW, 0);
        ctx.bezierCurveTo(-eyeW * 0.5, -eyeH * 1.65, eyeW * 0.5, -eyeH * 1.65, eyeW, 0);
        // Lower eyelid curvature
        ctx.bezierCurveTo(eyeW * 0.6, eyeH * 1.15, -eyeW * 0.6, eyeH * 1.15, -eyeW, 0);
        ctx.closePath();
        ctx.clip();

        // 1. Sclera (White of eye with gentle soft lavender ambient top shadow)
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        const scleraShadow = ctx.createLinearGradient(0, -eyeH, 0, eyeH);
        scleraShadow.addColorStop(0, 'rgba(175, 185, 205, 0.42)');
        scleraShadow.addColorStop(0.45, 'rgba(175, 185, 205, 0.05)');
        ctx.fillStyle = scleraShadow;
        ctx.fill();

        // 2. LARGE EXPRESSIVE DARK BROWN ANIME IRIS
        // Multi-layer depth: espresso top -> warm chocolate -> radiant golden-amber / hazel crescent
        const irisX = gazeX;
        const irisY = gazeY;
        const irisR = 14;

        const irisGrad = ctx.createLinearGradient(irisX, irisY - irisR, irisX, irisY + irisR);
        irisGrad.addColorStop(0, '#1c1109');    // deep espresso
        irisGrad.addColorStop(0.35, '#3b1d0c'); // rich chocolate
        irisGrad.addColorStop(0.70, '#78350f'); // warm amber-chestnut
        irisGrad.addColorStop(0.92, '#d97706'); // golden-amber ray
        irisGrad.addColorStop(1, '#fde68a');    // radiant light reflection crescent

        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.ellipse(irisX, irisY, irisR * 0.96, irisR * 1.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Radiant radial striations inside iris for crystalline depth
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.lineWidth = 1.2;
        for (let a = 0.2; a < Math.PI * 0.8; a += 0.22) {
            ctx.beginPath();
            ctx.moveTo(irisX + Math.cos(a) * 4, irisY + Math.sin(a) * 4);
            ctx.lineTo(irisX + Math.cos(a) * (irisR * 0.85), irisY + Math.sin(a) * (irisR * 0.85));
            ctx.stroke();
        }

        // Deep black pupil
        ctx.fillStyle = '#0a0604';
        ctx.beginPath();
        ctx.ellipse(irisX, irisY - 1, 5.5, 7.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lower luminous crescent ring
        ctx.strokeStyle = 'rgba(253, 230, 138, 0.75)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(irisX, irisY + 4, 7, 0.25 * Math.PI, 0.75 * Math.PI);
        ctx.stroke();

        // 3. SPECULAR HIGHLIGHTS & CATCHLIGHTS
        if (this.params.starPupil > 0.45) {
            // Star Pupil for EXCITED!
            this.drawStar(ctx, irisX, irisY - 1, 4, 8.5 * this.params.starPupil, 3.2, '#fef08a');
        } else {
            // Primary crisp glossy white catchlight (top-left)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(irisX - 4.2, irisY - 5.0, 3.6, 0, Math.PI * 2);
            ctx.fill();

            // Secondary soft glint (bottom-right)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.beginPath();
            ctx.arc(irisX + 3.8, irisY + 3.8, 2.0, 0, Math.PI * 2);
            ctx.fill();

            // Tiny micro specular dot
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(irisX - 6.0, irisY + 2.0, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Shimmering watery glint when sad or crying
        if (this.params.wateryGlint > 0.25) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.params.wateryGlint * 0.65})`;
            ctx.beginPath();
            ctx.ellipse(irisX, eyeH * 0.65, 11, 3.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore(); // remove eye clip

        // 4. Detailed Upper Eyeliner & Feathered Winged Lash
        ctx.strokeStyle = '#181b22';
        ctx.lineWidth = 4.0;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-eyeW * 1.05, 0);
        ctx.bezierCurveTo(-eyeW * 0.5, -eyeH * 1.65, eyeW * 0.5, -eyeH * 1.65, eyeW * 1.08, -1);
        ctx.stroke();

        // Winged corner flick
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        const flickX = isRight ? eyeW * 1.08 : -eyeW * 1.08;
        ctx.moveTo(flickX, -1);
        ctx.lineTo(flickX + (isRight ? 4.5 : -4.5), -4.5);
        ctx.stroke();

        // Delicate lower eyelid accent
        ctx.strokeStyle = 'rgba(40, 30, 25, 0.52)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, eyeH * 0.82, eyeW * 0.6, 0.22 * Math.PI, 0.78 * Math.PI);
        ctx.stroke();

        ctx.restore();
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
        ctx.save();
        ctx.fillStyle = color;
        let rot = Math.PI / 2 * 3 + (this.time * 2.5);
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    drawEyebrows(ctx) {
        ctx.save();
        const baseBrowY = -28 + (this.params.browY * 11);
        const tilt = this.params.browTilt;
        const asymm = this.params.browAsymm;

        ctx.strokeStyle = '#181b22';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';

        // Left Eyebrow (tapered feathered anime arch)
        ctx.save();
        ctx.translate(-42, baseBrowY - (asymm * 5));
        ctx.rotate(-tilt * 0.32 - (asymm * 0.22));
        ctx.beginPath();
        ctx.moveTo(-20, 2);
        ctx.quadraticCurveTo(0, -7, 20, 0);
        ctx.stroke();
        ctx.restore();

        // Right Eyebrow
        ctx.save();
        ctx.translate(42, baseBrowY + (asymm * 9));
        ctx.rotate(tilt * 0.32 + (asymm * 0.28));
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.quadraticCurveTo(0, -7, 20, 2);
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }

    drawNose(ctx) {
        ctx.save();
        // Delicate, natural anime nose (refined contour, not a crude stick)
        ctx.strokeStyle = 'rgba(195, 130, 110, 0.72)';
        ctx.lineWidth = 2.0;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(1.8, 23);
        ctx.lineTo(-1.8, 25);
        ctx.stroke();

        // Specular nose bridge highlight dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.arc(0.6, 20, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawMouth(ctx) {
        ctx.save();
        const mouthY = 42;
        ctx.translate(0, mouthY);

        const smile = this.params.mouthSmile;
        const open = this.params.mouthOpen;
        const width = 16 * this.params.mouthWidth;
        const oShape = this.params.mouthO;

        // Open Speaking / Laughing / Yawning Mouth
        if (open > 0.08) {
            const openH = open * 20;
            ctx.fillStyle = '#881337'; // inner mouth deep wine
            ctx.strokeStyle = '#1e1b4b';
            ctx.lineWidth = 2.6;

            ctx.beginPath();
            if (oShape > 0.45) {
                // Rounded 'O' mouth for surprised, yawning, or excited
                ctx.ellipse(0, 0, width * 0.65, openH * 0.85, 0, 0, Math.PI * 2);
            } else {
                // Natural curved open mouth
                ctx.moveTo(-width, -smile * 3.5);
                ctx.quadraticCurveTo(0, smile * 2.5, width, -smile * 3.5);
                ctx.bezierCurveTo(width * 0.85, openH, -width * 0.85, openH, -width, -smile * 3.5);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Upper teeth row
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(-width * 0.65, -smile * 3);
            ctx.quadraticCurveTo(0, 0, width * 0.65, -smile * 3);
            ctx.lineTo(width * 0.55, 4);
            ctx.lineTo(-width * 0.55, 4);
            ctx.closePath();
            ctx.fill();

            // Tongue highlight
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.arc(0, openH * 0.72, width * 0.52, 0, Math.PI);
            ctx.fill();

        } else {
            // Closed / Rest smile
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 3.0;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(-width, -smile * 3.5);
            ctx.quadraticCurveTo(0, smile * 4.5, width, -smile * 3.5);
            ctx.stroke();

            // Subtle lower lip contour shadow
            ctx.strokeStyle = 'rgba(215, 145, 125, 0.55)';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.arc(0, 7, 5, 0.22 * Math.PI, 0.78 * Math.PI);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawFrontHair(ctx) {
        ctx.save();
        // Layered fluffy messy black hair
        // Bangs frame the face gracefully and are parted so EYES ARE FULLY VISIBLE!
        const baseColor = '#14171d';
        const midColor = '#212630';
        const highlightColor = '#3a4252';

        const sway = Math.sin(this.time * 2.2) * 1.8;

        // 1. Top Fluffy Messy Crown & Silhouette Tufts
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.moveTo(-82, -50);
        ctx.bezierCurveTo(-108, -85, -70, -130, -22, -140);
        ctx.quadraticCurveTo(-10, -152 + sway, 2, -142); // signature fluffy cowlick tuft
        ctx.bezierCurveTo(50, -148, 98, -105, 90, -50);
        // Right sideburn lock (frames cheek, outside eye)
        ctx.bezierCurveTo(100, -15, 95, 25, 84, 52);
        ctx.lineTo(66, 18);
        // Left sideburn lock (frames cheek, outside eye)
        ctx.lineTo(-66, 18);
        ctx.lineTo(-84, 52);
        ctx.bezierCurveTo(-95, 25, -100, -15, -82, -50);
        ctx.fill();

        // 2. Front Bangs - Carefully styled to FRAME face and leave EYES COMPLETELY VISIBLE
        // Bangs Lock 1: Far Left curtain (stops above left eye)
        ctx.beginPath();
        ctx.moveTo(-74, -55);
        ctx.quadraticCurveTo(-58, -25, -55, 0 + sway);
        ctx.quadraticCurveTo(-50, -20, -46, -42);
        ctx.fill();

        // Bangs Lock 2: Mid-Left Tuft (between forehead center and left eye)
        ctx.beginPath();
        ctx.moveTo(-45, -52);
        ctx.quadraticCurveTo(-30, -18, -26, 6 + sway);
        ctx.quadraticCurveTo(-22, -18, -16, -45);
        ctx.fill();

        // Bangs Lock 3: Center parted cowlick (short center tuft, well above bridge of nose)
        ctx.beginPath();
        ctx.moveTo(-18, -60);
        ctx.quadraticCurveTo(0, -28, 2, 8 - sway);
        ctx.quadraticCurveTo(8, -24, 16, -48);
        ctx.fill();

        // Bangs Lock 4: Mid-Right Tuft (between forehead center and right eye)
        ctx.beginPath();
        ctx.moveTo(14, -52);
        ctx.quadraticCurveTo(28, -18, 32, 6 - sway);
        ctx.quadraticCurveTo(36, -20, 44, -45);
        ctx.fill();

        // Bangs Lock 5: Far Right curtain (outside right eye)
        ctx.beginPath();
        ctx.moveTo(42, -55);
        ctx.quadraticCurveTo(58, -25, 60, 2);
        ctx.quadraticCurveTo(66, -18, 74, -45);
        ctx.fill();

        // 3. Realistic Layered Hair Specular Ring (Tenshi no wa / Angel Ring)
        // Soft diffused sheen
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.38)';
        ctx.lineWidth = 5.0;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, -96, 62, 1.15 * Math.PI, 1.85 * Math.PI);
        ctx.stroke();

        // Crisp specular highlight notches
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, -95, 62, 1.32 * Math.PI, 1.68 * Math.PI);
        ctx.stroke();

        // Feathered individual hair strand flyaways
        ctx.strokeStyle = highlightColor;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-18, -125);
        ctx.quadraticCurveTo(-8, -145 + sway, 4, -135);
        ctx.moveTo(25, -120);
        ctx.quadraticCurveTo(45, -135 - sway, 65, -110);
        ctx.stroke();

        ctx.restore();
    }

    drawParticles(ctx) {
        ctx.save();
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;

            if (p.type === 'tear') {
                // Realistic falling glistening teardrop
                ctx.fillStyle = '#bae6fd';
                ctx.beginPath();
                ctx.moveTo(p.x, p.y - p.size);
                ctx.quadraticCurveTo(p.x - p.size, p.y, p.x, p.y + p.size);
                ctx.quadraticCurveTo(p.x + p.size, p.y, p.x, p.y - p.size);
                ctx.fill();

                // Specular reflection glint
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(p.x - 0.6, p.y - 0.6, p.size * 0.42, 0, Math.PI * 2);
                ctx.fill();

            } else if (p.type === 'sparkle') {
                // Rising 4-point golden star sparkle
                this.drawStar(ctx, p.x, p.y, 4, p.size, p.size * 0.35, '#fde047');
            }

            ctx.restore();
        }
        ctx.restore();
    }

    drawStateIndicator(ctx) {
        if (this.state === 'listening') {
            // Animated audio listening waves
            ctx.save();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
            ctx.lineWidth = 2.8;
            ctx.lineCap = 'round';
            for (let i = 1; i <= 3; i++) {
                const waveRadius = 20 + i * 10;
                const waveAlpha = Math.sin(this.time * 6 + i) * 0.5 + 0.5;
                ctx.globalAlpha = waveAlpha;
                ctx.beginPath();
                ctx.arc(82, 6, waveRadius, -0.25 * Math.PI, 0.25 * Math.PI);
                ctx.stroke();
            }
            ctx.restore();
        } else if (this.state === 'thinking') {
            // Pondering thought bubble
            ctx.save();
            const bounce = Math.sin(this.time * 4) * 4;
            ctx.font = '26px sans-serif';
            ctx.fillText('💭', 72, -95 + bounce);
            ctx.restore();
        }
    }

    initLoop() {
        const loop = (timestamp) => {
            const delta = Math.min(100, timestamp - this.lastFrameTime);
            this.lastFrameTime = timestamp;

            this.update(delta);
            this.render();

            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

window.AnimeBoyRenderer = AnimeBoyRenderer;
