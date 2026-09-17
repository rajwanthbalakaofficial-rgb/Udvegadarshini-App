/* ==========================================================================
   Udvegadarshini - Audio Frequency & Sound Therapy Engine (Web Audio API)
   ========================================================================== */

class SoundTherapyEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.analyser = null;
        this.currentSource = null;
        this.currentSecondarySource = null;
        this.isPlaying = false;
        this.volume = 0.7;

        this.canvas = null;
        this.canvasCtx = null;
        this.animFrame = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = 64;

            this.masterGain.connect(this.analyser);
            this.analyser.connect(this.ctx.destination);
        }

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setVolume(val) {
        this.volume = parseFloat(val);
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
    }

    stopCurrentSound() {
        if (this.currentSource) {
            try { this.currentSource.stop(); } catch(e){}
            this.currentSource.disconnect();
            this.currentSource = null;
        }
        if (this.currentSecondarySource) {
            try { this.currentSecondarySource.stop(); } catch(e){}
            this.currentSecondarySource.disconnect();
            this.currentSecondarySource = null;
        }
        this.isPlaying = false;
        this.updateOverlay();
    }

    updateOverlay() {
        const overlay = document.getElementById('visualizerIdleOverlay');
        if (overlay) {
            if (this.isPlaying) {
                overlay.classList.add('hidden');
            } else {
                overlay.classList.remove('hidden');
            }
        }
    }

    playSolfeggio(freq) {
        this.init();
        this.stopCurrentSound();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(parseFloat(freq), this.ctx.currentTime);

        // Soft fade in
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 1.5);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        this.currentSource = osc;
        this.isPlaying = true;
        this.startVisualizer();
    }

    playBinauralBeats(beatFreq) {
        this.init();
        this.stopCurrentSound();

        const baseFreq = 200; // Carrier frequency
        const diff = parseFloat(beatFreq);

        const leftOsc = this.ctx.createOscillator();
        const rightOsc = this.ctx.createOscillator();

        const merger = this.ctx.createChannelMerger(2);

        leftOsc.type = 'sine';
        leftOsc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

        rightOsc.type = 'sine';
        rightOsc.frequency.setValueAtTime(baseFreq + diff, this.ctx.currentTime);

        leftOsc.connect(merger, 0, 0);
        rightOsc.connect(merger, 0, 1);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 1.5);

        merger.connect(gain);
        gain.connect(this.masterGain);

        leftOsc.start();
        rightOsc.start();

        this.currentSource = leftOsc;
        this.currentSecondarySource = rightOsc;
        this.isPlaying = true;
        this.startVisualizer();
    }

    playRainSound() {
        this.init();
        this.stopCurrentSound();

        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02; // Pink/Brown noise filter
            lastOut = output[i];
            output[i] *= 3.5;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 1.5);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        whiteNoise.start();
        this.currentSource = whiteNoise;
        this.isPlaying = true;
        this.startVisualizer();
    }

    bindCanvas(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (this.canvas && this.canvas.parentElement) {
            this.canvasCtx = this.canvas.getContext('2d');
            this.resizeCanvas();
        }
    }

    resizeCanvas() {
        if (!this.canvas || !this.canvas.parentElement) return;
        const parent = this.canvas.parentElement;
        const width = parent.clientWidth || parent.offsetWidth || 600;
        const height = parent.clientHeight || parent.offsetHeight || 140;
        if (width > 0 && height > 0) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
    }

    startVisualizer() {
        this.updateOverlay();
        if (!this.canvas) {
            this.bindCanvas('audioVisualizerCanvas');
        } else {
            this.resizeCanvas();
        }

        if (!this.canvasCtx || !this.analyser) return;
        if (this.animFrame) cancelAnimationFrame(this.animFrame);

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!this.isPlaying) {
                this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.updateOverlay();
                return;
            }

            this.animFrame = requestAnimationFrame(draw);
            this.analyser.getByteFrequencyData(dataArray);

            if (this.canvas.width === 0 || this.canvas.height === 0) {
                this.resizeCanvas();
            }

            const w = this.canvas.width || 600;
            const h = this.canvas.height || 140;

            this.canvasCtx.fillStyle = 'rgba(9, 13, 22, 0.35)';
            this.canvasCtx.fillRect(0, 0, w, h);

            const barWidth = (w / bufferLength) * 2.2;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * (h - 15);
                if (barHeight < 6) barHeight = 6; // Minimum height for smooth constant visual response

                const gradient = this.canvasCtx.createLinearGradient(0, h, 0, 0);
                gradient.addColorStop(0, '#06b6d4');
                gradient.addColorStop(0.5, '#3b82f6');
                gradient.addColorStop(1, '#a855f7');

                this.canvasCtx.fillStyle = gradient;
                this.canvasCtx.fillRect(x, h - barHeight, Math.max(barWidth - 3, 3), barHeight);

                // Top glowing pill indicator
                this.canvasCtx.fillStyle = '#38bdf8';
                this.canvasCtx.fillRect(x, h - barHeight - 2, Math.max(barWidth - 3, 3), 2);

                x += barWidth;
            }
        };

        draw();
    }
}

// Global Sound Engine Instance
const soundEngine = new SoundTherapyEngine();
