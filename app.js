/* ==========================================================================
   Udvegadarshini - Master App Logic with Splash Screen, Login & i18n
   ========================================================================== */

class UdvegadarshiniApp {
    constructor() {
        this.isConnected = false;
        this.isSimulating = false;
        this.simInterval = null;

        this.port = null;
        this.reader = null;

        // Logged In User State
        this.currentUser = {
            subjectId: 'SUBJ-3221',
            fullName: 'Santhosh / Sindhu / Bharat / Nani',
            role: 'Researcher'
        };

        // Current Metrics State
        this.currentMetrics = {
            stressScore: 0,
            state: 'waiting',
            delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0,
            betaAlphaRatio: 0, hjorthAct: 0, hjorthMob: 0, hjorthComp: 0,
            entropy: 0, katzFD: 1.0, timestamp: null
        };

        this.historyLogs = [];
        this.sessionStartTime = new Date();

        this.chart = null;
        this.chartMaxPoints = 25;

        this.isBreathing = false;
        this.breathInterval = null;
    }

    init() {
        this.initSplashScreen();
        this.bindEvents();
        this.initChart();

        // Apply saved language & profile
        this.loadSavedUserProfile();
        i18n.applyTranslations();

        soundEngine.bindCanvas('audioVisualizerCanvas');
        aptaAI.init();
        stressGames.init();

        this.bindSoundTherapyPresets();
    }

    /* ----------------------------------------------------------------------
       1. Splash Screen & Login Lifecycle
       ---------------------------------------------------------------------- */
    initSplashScreen() {
        const progressBar = document.getElementById('splashProgress');
        const statusText = document.getElementById('splashStatusText');
        const splashScreen = document.getElementById('splashScreen');

        const steps = [
            { pct: 20, text: "Initialising ESP32 Neural System..." },
            { pct: 55, text: "Loading 1D-CNN Quantized Weights (INT8)..." },
            { pct: 85, text: "Calibrating BioAmp EXG Pill Biopotential Filters..." },
            { pct: 100, text: "Ready!" }
        ];

        let idx = 0;
        const interval = setInterval(() => {
            if (idx < steps.length) {
                progressBar.style.width = `${steps[idx].pct}%`;
                statusText.textContent = steps[idx].text;
                idx++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    splashScreen.style.opacity = '0';
                    splashScreen.style.visibility = 'hidden';

                    // Show login modal if no saved session found
                    const savedUser = localStorage.getItem('udvega_user');
                    if (!savedUser) {
                        document.getElementById('loginModal').style.display = 'flex';
                    }
                }, 500);
            }
        }, 500);
    }

    loadSavedUserProfile() {
        const saved = localStorage.getItem('udvega_user');
        if (saved) {
            this.currentUser = JSON.parse(saved);
            this.updateUserProfileUI();
        }
    }

    updateUserProfileUI() {
        document.getElementById('userNameText').textContent = this.currentUser.fullName || 'Guest User';
        document.getElementById('userRoleText').textContent = `${this.currentUser.role} (${this.currentUser.subjectId})`;
        document.getElementById('userAvatar').textContent = (this.currentUser.fullName || 'G').charAt(0).toUpperCase();

        // PDF Sync
        document.getElementById('pdfSubjectId').textContent = this.currentUser.subjectId || 'SUBJ-GUEST';
        document.getElementById('pdfSubjectName').textContent = this.currentUser.fullName || 'Guest User';
    }

    saveUserProfile(subjectId, fullName, role, lang) {
        this.currentUser = { subjectId, fullName, role };
        localStorage.setItem('udvega_user', JSON.stringify(this.currentUser));
        this.updateUserProfileUI();

        if (lang) i18n.setLanguage(lang);
        document.getElementById('loginModal').style.display = 'none';
    }

    /* ----------------------------------------------------------------------
       2. Navigation Tabs & UI Event Bindings
       ---------------------------------------------------------------------- */
    bindEvents() {
        // Language Selectors
        const headerLang = document.getElementById('languageSelect');
        const modalLang = document.getElementById('selectModalLanguage');

        if (headerLang) {
            headerLang.value = i18n.currentLang;
            headerLang.onchange = (e) => i18n.setLanguage(e.target.value);
        }
        if (modalLang) {
            modalLang.value = i18n.currentLang;
            modalLang.onchange = (e) => i18n.setLanguage(e.target.value);
        }

        // Login Form Submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.onsubmit = (e) => {
                e.preventDefault();
                const subjId = document.getElementById('inputSubjectId').value;
                const name = document.getElementById('inputFullName').value;
                const role = document.getElementById('selectRole').value;
                const lang = document.getElementById('selectModalLanguage').value;
                this.saveUserProfile(subjId, name, role, lang);
            };
        }

        document.getElementById('btnGuestLogin').onclick = () => {
            this.saveUserProfile('SUBJ-GUEST', 'Guest User', 'Subject', i18n.currentLang);
        };

        document.getElementById('btnLogout').onclick = () => {
            document.getElementById('loginModal').style.display = 'flex';
        };

        // Tab Switching
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const targetId = tab.dataset.tab;
                document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
                const page = document.getElementById(targetId);
                if (page) page.classList.add('active');

                if (targetId === 'tab-apta') {
                    const badge = document.getElementById('aptaUnread');
                    if (badge) badge.style.display = 'none';
                }
            });
        });

        // Connection Buttons
        document.getElementById('btnConnectSerial').onclick = () => this.connectWebSerial();
        document.getElementById('btnConnectBLE').onclick = () => this.connectWebBLE();
        document.getElementById('btnToggleSim').onclick = () => this.toggleSimulator();

        // Global Alert Banner Buttons
        document.getElementById('btnAlertOpenApta').onclick = () => {
            document.querySelector('[data-tab="tab-apta"]').click();
        };
        document.getElementById('btnAlertPlayMusic').onclick = () => {
            document.querySelector('[data-tab="tab-frequency"]').click();
            soundEngine.playSolfeggio(432);
        };
        document.getElementById('btnCloseAlert').onclick = () => {
            document.getElementById('highStressAlert').style.display = 'none';
        };

        // Āpta AI Buttons
        document.getElementById('btnSendChat').onclick = () => {
            const input = document.getElementById('chatInputField');
            aptaAI.handleUserPrompt(input.value);
            input.value = '';
        };
        document.getElementById('chatInputField').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('btnSendChat').click();
            }
        });

        document.querySelectorAll('.btn-mood').forEach(btn => {
            btn.onclick = () => aptaAI.handleMoodButton(btn.dataset.mood);
        });
        document.getElementById('btnClearChat').onclick = () => aptaAI.clearChat();

        // 4-7-8 Breathing Guide Button
        document.getElementById('btnStartBreathing').onclick = () => this.toggle478Breathing();

        // History & PDF Exporter Buttons
        document.getElementById('btnClearHistory').onclick = () => this.clearHistory();
        document.getElementById('btnExportPDF').onclick = () => this.exportPDFReport();
    }

    bindSoundTherapyPresets() {
        const presets = document.querySelectorAll('.preset-card');
        const playBtn = document.getElementById('btnPlaySound');
        const playIcon = document.getElementById('playIcon');
        const volSlider = document.getElementById('volumeControl');

        presets.forEach(preset => {
            preset.addEventListener('click', () => {
                presets.forEach(p => p.classList.remove('active'));
                preset.classList.add('active');

                const type = preset.dataset.type;
                const freq = preset.dataset.freq;
                const title = preset.dataset.title;
                const desc = preset.dataset.desc;

                document.getElementById('nowPlayingTitle').textContent = title;
                document.getElementById('nowPlayingDesc').textContent = desc;

                if (type === 'solfeggio') {
                    soundEngine.playSolfeggio(freq);
                } else if (type === 'binaural') {
                    soundEngine.playBinauralBeats(freq);
                } else if (type === 'noise') {
                    soundEngine.playRainSound();
                }

                playIcon.className = 'fa-solid fa-pause';
            });
        });

        playBtn.onclick = () => {
            if (soundEngine.isPlaying) {
                soundEngine.stopCurrentSound();
                playIcon.className = 'fa-solid fa-play';
            } else {
                const activePreset = document.querySelector('.preset-card.active');
                if (activePreset) activePreset.click();
            }
        };

        volSlider.oninput = (e) => {
            soundEngine.setVolume(e.target.value);
        };
    }

    initChart() {
        const ctx = document.getElementById('liveEEGChart').getContext('2d');

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Stress Score (%)',
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true,
                        data: []
                    },
                    {
                        label: 'Beta/Alpha Ratio (x100)',
                        borderColor: '#6366f1',
                        borderWidth: 2,
                        borderDash: [4, 4],
                        tension: 0.3,
                        fill: false,
                        data: []
                    },
                    {
                        label: 'Alpha Wave Power (x1000)',
                        borderColor: '#10b981',
                        borderWidth: 1.5,
                        tension: 0.3,
                        fill: false,
                        data: []
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b' } },
                    y: { min: 0, max: 100, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b' } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    async connectWebSerial() {
        if (!('serial' in navigator)) {
            alert('Web Serial API is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
            return;
        }

        try {
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 115200 });

            this.isConnected = true;
            this.updateConnectionBadge(true, 'ESP32 Serial Connected');

            if (this.isSimulating) this.toggleSimulator();

            const decoder = new TextDecoderStream();
            const inputDone = this.port.readable.pipeTo(decoder.writable);
            const inputStream = decoder.readable;

            this.reader = inputStream.getReader();
            this.readSerialStream();

        } catch (err) {
            console.error('Serial connection error:', err);
            this.updateConnectionBadge(false, 'Serial Failed');
        }
    }

    async readSerialStream() {
        let buffer = '';
        while (true) {
            const { value, done } = await this.reader.read();
            if (done) {
                this.reader.releaseLock();
                break;
            }
            buffer += value;
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                this.parseESP32SerialLine(line.trim());
            }
        }
    }

    async connectWebBLE() {
        if (!('bluetooth' in navigator)) {
            alert('Web Bluetooth API is not supported in this browser.');
            return;
        }

        try {
            const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
            this.updateConnectionBadge(true, `BLE Connected: ${device.name || 'ESP32-EEG'}`);
        } catch (err) {
            console.error('BLE connection error:', err);
        }
    }

    toggleSimulator() {
        const btnText = document.getElementById('simBtnText');

        if (this.isSimulating) {
            clearInterval(this.simInterval);
            this.isSimulating = false;
            btnText.textContent = i18n.t('startSim');
            this.updateConnectionBadge(false, 'Device Disconnected');
        } else {
            this.isSimulating = true;
            btnText.textContent = i18n.t('stopSim');
            this.updateConnectionBadge(true, 'Hardware Simulator Running');

            let simStep = 0;
            this.simInterval = setInterval(() => {
                simStep++;
                const baseVal = 30 + Math.sin(simStep * 0.15) * 20 + (Math.random() * 10 - 5);
                const stressVal = Math.min(95, Math.max(8, baseVal));

                const delta = 0.015 + Math.random() * 0.005;
                const theta = 0.010 + Math.random() * 0.004;
                const alpha = (100 - stressVal) * 0.0001 + 0.001;
                const beta = stressVal * 0.00008 + 0.0002;
                const gamma = 0.0001 + Math.random() * 0.0001;

                const ratio = beta / (alpha || 0.0001);

                this.processMetricsUpdate({
                    stressScore: stressVal,
                    delta: delta, theta: theta, alpha: alpha, beta: beta, gamma: gamma,
                    betaAlphaRatio: ratio,
                    hjorthAct: 0.06 + Math.random() * 0.01,
                    hjorthMob: 0.09 + Math.random() * 0.01,
                    hjorthComp: 2.9 + Math.random() * 0.1,
                    entropy: -6.5 + Math.random() * 0.2,
                    katzFD: 1.0
                });
            }, 1000);
        }
    }

    parseESP32SerialLine(line) {
        if (!line) return;

        const deltaMatch = line.match(/Δ:\s*([\d.]+)/);
        const thetaMatch = line.match(/Θ:\s*([\d.]+)/);
        const alphaMatch = line.match(/α:\s*([\d.]+)/);
        const betaMatch = line.match(/β:\s*([\d.]+)/);
        const gammaMatch = line.match(/γ:\s*([\d.]+)/);
        const ratioMatch = line.match(/ratio:\s*([\d.]+)/);
        const stressMatch = line.match(/(\d+\.\d+)\s*%/);

        const delta = deltaMatch ? parseFloat(deltaMatch[1]) : 0.018;
        const theta = thetaMatch ? parseFloat(thetaMatch[1]) : 0.012;
        const alpha = alphaMatch ? parseFloat(alphaMatch[1]) : 0.0016;
        const beta = betaMatch ? parseFloat(betaMatch[1]) : 0.0005;
        const gamma = gammaMatch ? parseFloat(gammaMatch[1]) : 0.0;
        const ratio = ratioMatch ? parseFloat(ratioMatch[1]) : (beta / (alpha || 0.001));

        const stressScore = stressMatch ? parseFloat(stressMatch[1]) : Math.min(90, Math.max(10, ratio * 100));

        this.processMetricsUpdate({
            stressScore: stressScore,
            delta: delta, theta: theta, alpha: alpha, beta: beta, gamma: gamma,
            betaAlphaRatio: ratio,
            hjorthAct: 0.0604, hjorthMob: 0.0990, hjorthComp: 2.9688,
            entropy: -6.665, katzFD: 1.000
        });
    }

    processMetricsUpdate(data) {
        const score = Math.round(data.stressScore);
        let stateKey = 'normal';
        let stateTitle = i18n.t('stateNormal');
        let stateDesc = 'Balanced Alpha & Beta waves';

        if (score >= 5 && score < 25) {
            stateKey = 'relax';
            stateTitle = i18n.t('stateRelax');
            stateDesc = 'Alpha wave dominant, calm mind';
        } else if (score >= 25 && score < 40) {
            stateKey = 'normal';
            stateTitle = i18n.t('stateNormal');
            stateDesc = 'Balanced wakefulness & resilience';
        } else if (score >= 40 && score < 55) {
            stateKey = 'focus';
            stateTitle = i18n.t('stateFocus');
            stateDesc = 'Beta rising, active problem solving';
        } else if (score >= 55 && score < 70) {
            stateKey = 'active';
            stateTitle = i18n.t('stateActive');
            stateDesc = 'High Beta, time pressure / gaming';
        } else if (score >= 70) {
            stateKey = 'stressed';
            stateTitle = i18n.t('stateStressed');
            stateDesc = 'Fight-or-flight mode detected';
        }

        this.currentMetrics = { ...data, state: stateTitle, timestamp: new Date() };

        document.getElementById('stressScoreVal').innerHTML = `${score}<span>%</span>`;
        document.getElementById('stressStateTitle').textContent = stateTitle;
        document.getElementById('stressStateDesc').textContent = stateDesc;

        const gaugeFill = document.getElementById('gaugeFill');
        const offset = 534 - (score / 100) * 534;
        gaugeFill.style.strokeDashoffset = offset;

        const stateColors = { relax: '#10b981', normal: '#06b6d4', focus: '#3b82f6', active: '#f59e0b', stressed: '#ef4444' };
        gaugeFill.style.stroke = stateColors[stateKey];
        document.getElementById('stressStateTitle').style.color = stateColors[stateKey];

        document.querySelectorAll('.scale-item').forEach(item => item.classList.remove('active'));
        const activeScale = document.querySelector(`.scale-item.scale-${stateKey}`);
        if (activeScale) activeScale.classList.add('active');

        document.getElementById('valDelta').textContent = data.delta.toFixed(4);
        document.getElementById('valTheta').textContent = data.theta.toFixed(4);
        document.getElementById('valAlpha').textContent = data.alpha.toFixed(4);
        document.getElementById('valBeta').textContent = data.beta.toFixed(4);
        document.getElementById('valGamma').textContent = data.gamma.toFixed(4);

        document.getElementById('barDelta').style.width = `${Math.min(100, data.delta * 2000)}%`;
        document.getElementById('barTheta').style.width = `${Math.min(100, data.theta * 3000)}%`;
        document.getElementById('barAlpha').style.width = `${Math.min(100, data.alpha * 15000)}%`;
        document.getElementById('barBeta').style.width = `${Math.min(100, data.beta * 20000)}%`;
        document.getElementById('barGamma').style.width = `${Math.min(100, data.gamma * 30000)}%`;

        document.getElementById('valBetaAlphaRatio').textContent = data.betaAlphaRatio.toFixed(3);
        document.getElementById('valHjorthAct').textContent = data.hjorthAct.toFixed(4);
        document.getElementById('valHjorthMob').textContent = data.hjorthMob.toFixed(4);
        document.getElementById('valHjorthComp').textContent = data.hjorthComp.toFixed(4);
        document.getElementById('valEntropy').textContent = data.entropy.toFixed(3);
        document.getElementById('valKatzFD').textContent = data.katzFD.toFixed(3);

        const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.chart.data.labels.push(timeLabel);
        this.chart.data.datasets[0].data.push(score);
        this.chart.data.datasets[1].data.push(data.betaAlphaRatio * 100);
        this.chart.data.datasets[2].data.push(data.alpha * 10000);

        if (this.chart.data.labels.length > this.chartMaxPoints) {
            this.chart.data.labels.shift();
            this.chart.data.datasets[0].data.shift();
            this.chart.data.datasets[1].data.shift();
            this.chart.data.datasets[2].data.shift();
        }
        this.chart.update('none');

        aptaAI.updateStressSync(score);
        this.addHistoryRecord({ ...this.currentMetrics, score });
    }

    updateConnectionBadge(connected, text) {
        const badge = document.getElementById('connectionBadge');
        const textEl = document.getElementById('connectionText');

        if (connected) {
            badge.className = 'connection-status-badge connected';
        } else {
            badge.className = 'connection-status-badge';
        }
        textEl.textContent = text;
    }

    toggle478Breathing() {
        const circle = document.getElementById('breathingCircle');
        const text = document.getElementById('breathStateText');
        const timerNum = document.getElementById('breathTimerNum');
        const btn = document.getElementById('btnStartBreathing');

        if (this.isBreathing) {
            clearInterval(this.breathInterval);
            this.isBreathing = false;
            circle.className = 'breathing-circle';
            text.textContent = 'Press Start';
            timerNum.textContent = '--';
            btn.innerHTML = '<i class="fa-solid fa-circle-play"></i> Start 4-7-8 Breathing Cycle';
        } else {
            this.isBreathing = true;
            btn.innerHTML = '<i class="fa-solid fa-circle-pause"></i> Stop Breathing Cycle';

            let phase = 'inhale';
            let seconds = 4;

            const runCycle = () => {
                timerNum.textContent = seconds;
                if (phase === 'inhale') {
                    circle.className = 'breathing-circle expand';
                    text.textContent = 'Inhale (4s)';
                } else if (phase === 'hold') {
                    circle.className = 'breathing-circle hold';
                    text.textContent = 'Hold (7s)';
                } else if (phase === 'exhale') {
                    circle.className = 'breathing-circle contract';
                    text.textContent = 'Exhale (8s)';
                }

                seconds--;
                if (seconds < 0) {
                    if (phase === 'inhale') { phase = 'hold'; seconds = 7; }
                    else if (phase === 'hold') { phase = 'exhale'; seconds = 8; }
                    else if (phase === 'exhale') { phase = 'inhale'; seconds = 4; }
                }
            };

            runCycle();
            this.breathInterval = setInterval(runCycle, 1000);
        }
    }

    addHistoryRecord(record) {
        this.historyLogs.push(record);
        if (this.historyLogs.length > 50) this.historyLogs.shift();

        const tbody = document.getElementById('historyTableBody');
        const emptyMsg = tbody.querySelector('.empty-table-msg');
        if (emptyMsg) tbody.innerHTML = '';

        const tr = document.createElement('tr');
        const timeStr = record.timestamp.toLocaleTimeString();

        tr.innerHTML = `
            <td>${timeStr}</td>
            <td><strong>${record.score}%</strong></td>
            <td>${record.state}</td>
            <td>${record.betaAlphaRatio.toFixed(3)}</td>
            <td>${record.alpha.toFixed(4)}</td>
            <td>${record.beta.toFixed(4)}</td>
            <td><span class="badge-tag">${this.currentUser.subjectId}</span></td>
        `;

        tbody.insertBefore(tr, tbody.firstChild);

        document.getElementById('logCountVal').textContent = this.historyLogs.length;

        const avg = Math.round(this.historyLogs.reduce((a,b) => a + b.score, 0) / this.historyLogs.length);
        const peak = Math.max(...this.historyLogs.map(l => l.score));

        document.getElementById('avgStressVal').textContent = `${avg}%`;
        document.getElementById('peakStressVal').textContent = `${peak}%`;
        document.getElementById('dominantStateVal').textContent = record.state;
    }

    clearHistory() {
        this.historyLogs = [];
        document.getElementById('historyTableBody').innerHTML = `
            <tr><td colspan="7" class="empty-table-msg">No stress records logged yet. Connect device or start simulator.</td></tr>
        `;
        document.getElementById('logCountVal').textContent = '0';
        document.getElementById('avgStressVal').textContent = '--%';
        document.getElementById('peakStressVal').textContent = '--%';
        document.getElementById('dominantStateVal').textContent = '--';
    }

    exportPDFReport() {
        const now = new Date();
        document.getElementById('pdfDate').textContent = now.toLocaleString();
        document.getElementById('pdfSubjectId').textContent = this.currentUser.subjectId;
        document.getElementById('pdfSubjectName').textContent = this.currentUser.fullName;

        const avg = this.historyLogs.length ? Math.round(this.historyLogs.reduce((a,b) => a + b.score, 0) / this.historyLogs.length) : '--';
        const peak = this.historyLogs.length ? Math.max(...this.historyLogs.map(l => l.score)) : '--';

        document.getElementById('pdfAvgStress').textContent = `${avg}%`;
        document.getElementById('pdfPeakStress').textContent = `${peak}%`;
        document.getElementById('pdfDominantState').textContent = this.currentMetrics.state || 'Balanced Baseline';
        document.getElementById('pdfDuration').textContent = `${Math.round((now - this.sessionStartTime) / 60000)} minutes`;

        window.print();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new UdvegadarshiniApp();
    window.app.init();
});
