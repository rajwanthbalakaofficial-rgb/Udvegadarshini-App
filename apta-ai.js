/* ==========================================================================
   Udvegadarshini - Āpta AI (आप्त AI) Interactive Multi-Turn Chatbot Engine
   Version: v46.0.0
   Supports: Teluglish (Tanglish - Primary), English, Telugu, Hindi
   ========================================================================== */

class AptaAIChatbot {
    constructor() {
        this.messagesBox = null;
        this.syncedStressVal = 0;
        this.lastTriggeredTime = 0;
        this.chatHistory = []; // Stores past prompts & topics for multi-turn context
        this.lastTopic = null;
        this.isTyping = false;
    }

    init() {
        this.messagesBox = document.getElementById('chatMessagesBox');
        this.bindEvents();
        this.updateAptaUIForCurrentLanguage();
    }

    bindEvents() {
        const btnSend = document.getElementById('btnSendChat');
        const inputField = document.getElementById('chatInputField');
        const btnClear = document.getElementById('btnClearChat');

        if (btnSend && inputField) {
            btnSend.onclick = () => {
                const text = inputField.value;
                inputField.value = '';
                this.handleUserPrompt(text);
            };
            inputField.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    const text = inputField.value;
                    inputField.value = '';
                    this.handleUserPrompt(text);
                }
            };
        }

        if (btnClear) {
            btnClear.onclick = () => this.clearChat();
        }

        // Bind Mood Prompt Buttons
        const moodBtns = document.querySelectorAll('.quick-mood-prompts .btn-mood');
        moodBtns.forEach(btn => {
            btn.onclick = () => {
                const moodKey = btn.getAttribute('data-mood');
                this.handleMoodButton(moodKey);
            };
        });
    }

    getLang() {
        return localStorage.getItem('udvega_lang') || 'teluglish';
    }

    onLanguageChange(langKey) {
        this.updateAptaUIForCurrentLanguage();
    }

    updateAptaUIForCurrentLanguage() {
        const lang = this.getLang();
        const welcomeTextEl = document.getElementById('aptaWelcomeText');
        
        const welcomeMsgs = {
            teluglish: `Namaskaram raa mama! 🙏 Nenu <strong>Āpta AI (आप्त AI)</strong>. Neeku eppudaina stress, anxiety, thala noppi, focus problem leda urike matladalani unna, ikkada cheppu raa.<br><br>Mana ESP32-S3 BioAmp EXG sensor nundi live EEG stress score ni nenu track chesthunna. Below quick buttons try cheyyi leda neeku anipinchindhi type cheyyi mama!`,
            en: `Hello my friend! 🙏 I am <strong>Āpta AI (आप्त AI)</strong>. Whenever you feel stressed, anxious, tired, or just want to share your thoughts, talk to me here.<br><br>I am continuously tracking your live EEG stress score from the ESP32-S3 BioAmp sensor. Use the quick buttons below or type anything!`,
            telugu: `నమస్కారం మిత్రమా! 🙏 నేను <strong>ఆప్త AI (Āpta AI)</strong>. మీకు ఎప్పుడైనా ఒత్తిడి, ఆందోళన, ఏకాగ్రత లోపం లేదా మాట్లాడాలనిపిస్తే ఇక్కడ చెప్పండి.<br><br>మీ ESP32-S3 పరికరం నుండి లైవ్ EEG సమాచారాన్ని నేను గమనిస్తున్నాను. ఏమైనా అడగండి!`,
            hindi: `नमस्ते दोस्त! 🙏 मैं <strong>आप्त AI (Āpta AI)</strong> हूँ। जब भी आप तनाव, चिंता या थकान महसूस करें, मुझसे बात करें।<br><br>मैं ESP32-S3 डिवाइस से लाइव EEG डेटा की निगरानी कर रहा हूँ। कुछ भी पूछें!`
        };

        if (welcomeTextEl) {
            welcomeTextEl.innerHTML = welcomeMsgs[lang] || welcomeMsgs['teluglish'];
        }

        // Update Mood Button Labels
        const moodStressedBtn = document.querySelector('[data-mood="feeling-stressed"]');
        const moodSadBtn = document.querySelector('[data-mood="feeling-sad"]');
        const moodFocusBtn = document.querySelector('[data-mood="need-focus"]');
        const moodGoodBtn = document.querySelector('[data-mood="feeling-good"]');

        const moodLabels = {
            teluglish: {
                stressed: `<i class="fa-solid fa-head-side-virus"></i> Macha, ekkuva stress gaa undhi`,
                sad: `<i class="fa-solid fa-face-sad-tear"></i> Koncham badha gaa undhi raa`,
                focus: `<i class="fa-solid fa-bullseye"></i> Focus ravadam ledhu`,
                good: `<i class="fa-solid fa-face-smile-beam"></i> Cool gaa unnanu eeroju!`
            },
            en: {
                stressed: `<i class="fa-solid fa-head-side-virus"></i> Feeling very stressed today`,
                sad: `<i class="fa-solid fa-face-sad-tear"></i> Feeling a bit sad or low`,
                focus: `<i class="fa-solid fa-bullseye"></i> Unable to focus on work`,
                good: `<i class="fa-solid fa-face-smile-beam"></i> Feeling great & relaxed!`
            },
            telugu: {
                stressed: `<i class="fa-solid fa-head-side-virus"></i> నాకు చాలా ఒత్తిడిగా ఉంది`,
                sad: `<i class="fa-solid fa-face-sad-tear"></i> కొంచెం బాధగా ఉంది...`,
                focus: `<i class="fa-solid fa-bullseye"></i> ఏకాగ్రత కలగడం లేదు`,
                good: `<i class="fa-solid fa-face-smile-beam"></i> ఈ రోజు ప్రశాంతంగా ఉన్నాను!`
            },
            hindi: {
                stressed: `<i class="fa-solid fa-head-side-virus"></i> मुझे बहुत तनाव महसूस हो रहा है`,
                sad: `<i class="fa-solid fa-face-sad-tear"></i> आज थोड़ा उदास महसूस हो रहा है`,
                focus: `<i class="fa-solid fa-bullseye"></i> आज ध्यान केंद्रित नहीं हो रहा`,
                good: `<i class="fa-solid fa-face-smile-beam"></i> आज मैं बहुत अच्छा महसूस कर रहा हूँ!`
            }
        };

        const activeLabels = moodLabels[lang] || moodLabels['teluglish'];
        if (moodStressedBtn) moodStressedBtn.innerHTML = activeLabels.stressed;
        if (moodSadBtn) moodSadBtn.innerHTML = activeLabels.sad;
        if (moodFocusBtn) moodFocusBtn.innerHTML = activeLabels.focus;
        if (moodGoodBtn) moodGoodBtn.innerHTML = activeLabels.good;

        // Update Chat Input Placeholder
        const chatInput = document.getElementById('chatInputField');
        const placeholders = {
            teluglish: "Macha, em help venum? (e.g. remedies, 432Hz sound, breathing, joke, focus)...",
            en: "Share your day or ask for remedies, music, games...",
            telugu: "మీ మనసులోని మాటలను ఇక్కడ టైప్ చేయండి...",
            hindi: "अपने विचार यहाँ लिखें या आप्त AI से बात करें..."
        };
        if (chatInput) {
            chatInput.placeholder = placeholders[lang] || placeholders['teluglish'];
        }
    }

    updateStressSync(stressVal) {
        this.syncedStressVal = stressVal;
        const syncEl = document.getElementById('aptaSyncedStress');
        if (syncEl) {
            syncEl.textContent = `${Math.round(stressVal)}%`;
        }

        if (stressVal <= 0) {
            const alertBanner = document.getElementById('highStressAlert');
            if (alertBanner) alertBanner.style.display = 'none';
            return;
        }

        // Auto-Trigger Āpta AI if stress > 70% and at least 30s passed since last alert
        const now = Date.now();
        if (stressVal > 70 && (now - this.lastTriggeredTime > 30000)) {
            this.lastTriggeredTime = now;
            this.triggerHighStressAutoAlert(stressVal);
        }
    }

    triggerHighStressAutoAlert(stressVal) {
        const alertBanner = document.getElementById('highStressAlert');
        if (alertBanner) alertBanner.style.display = 'flex';

        const unreadBadge = document.getElementById('aptaUnread');
        if (unreadBadge) unreadBadge.style.display = 'inline-block';

        const lang = this.getLang();
        const score = Math.round(stressVal);

        const alertMsgs = {
            teluglish: `<strong>Arrey mama! Alert raa! 🚨</strong><br>Nenu Āpta AI monitor chesthunna, mana ESP32 EEG reading lo stress score <strong>${score}%</strong> (High Stress) reach aindi raa!<br><br>Tension padaku mama, nenu unnanu ga! 🌿 Immediately 432Hz Sound Therapy ON chesi, 4-7-8 Breathing Guide start cheyyi.<br><br>
            <div class="apta-action-buttons">
                <button class="btn btn-sm btn-primary" onclick="window.aptaNavigateTab('tab-frequency', 'play432')"><i class="fa-solid fa-play"></i> 🎵 Play 432Hz Tone</button>
                <button class="btn btn-sm btn-accent" onclick="window.aptaNavigateTab('tab-frequency', 'breathing')"><i class="fa-solid fa-lungs"></i> 🫁 Start 4-7-8 Breathing</button>
            </div>`,
            en: `<strong>Alert! High Stress Detected! 🚨</strong><br>I am Āpta AI monitoring your ESP32 EEG reading. Your stress score reached <strong>${score}%</strong> (High Stress)!<br><br>Don't worry, I am here with you! 🌿 Turn on 432Hz Sound Therapy and start 4-7-8 Breathing Guide now.<br><br>
            <div class="apta-action-buttons">
                <button class="btn btn-sm btn-primary" onclick="window.aptaNavigateTab('tab-frequency', 'play432')"><i class="fa-solid fa-play"></i> 🎵 Play 432Hz Tone</button>
                <button class="btn btn-sm btn-accent" onclick="window.aptaNavigateTab('tab-frequency', 'breathing')"><i class="fa-solid fa-lungs"></i> 🫁 Start 4-7-8 Breathing</button>
            </div>`,
            telugu: `<strong>హెచ్చరిక! అధిక ఒత్తిడి గుర్తింపు! 🚨</strong><br>మీ ESP32 EEG రీడింగ్ లో ఒత్తిడి స్కోరు <strong>${score}%</strong> కి చేరింది! 🌿 వెంటనే 432Hz సౌండ్ థెరపీ ఆన్ చేసి ప్రాణాయామం చేయండి!`,
            hindi: `<strong>चेतावनी! उच्च तनाव की पहचान! 🚨</strong><br>आपकी EEG रीडिंग में तनाव स्कोर <strong>${score}%</strong> तक पहुँच गया है! 🌿 तुरंत 432Hz ध्वनि चिकित्सा और प्राणायाम शुरू करें!`
        };

        this.appendMessage('apta', alertMsgs[lang] || alertMsgs['teluglish']);
    }

    handleQuickPrompt(promptKey) {
        const prompts = {
            remedies: "Macha, stress thaggadaniki em remedies ivvagalavu?",
            sound: "432Hz Sound therapy ela work avuthundhi?",
            breathing: "4-7-8 Breathing technique guide ivvu raa",
            games: "Mind divert cheyaniki game select cheyyi mama",
            focus: "Study / Work medha focus ravalante em cheyali?",
            joke: "Chinna stress relief joke cheppu raa mama",
            eeg: "Live EEG score status enti raa?"
        };

        const text = prompts[promptKey] || promptKey;
        this.handleUserPrompt(text);
    }

    handleMoodButton(moodKey) {
        const lang = this.getLang();

        const moodResponses = {
            teluglish: {
                'feeling-stressed': {
                    user: "Macha, ekkuva stress gaa undhi raa!",
                    apta: `Arrey badha padaku mama! 🤗 Workload or pressure ekkuva inattundi. Okka 5 mins relax avvu! Sound Therapy tab lo **432 Hz Miracle Tone** pettu leda mana **Bubble Wrap Popper** game aadu. Stress jorru ga thaggipothundi!<br><br>
                    <div class="apta-action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="window.aptaNavigateTab('tab-frequency', 'play432')"><i class="fa-solid fa-play"></i> 🎵 432Hz Sound</button>
                        <button class="btn btn-sm btn-secondary" onclick="window.aptaNavigateTab('tab-games', 'gameBubble')"><i class="fa-solid fa-gamepad"></i> 🎮 Bubble Game</button>
                    </div>`
                },
                'feeling-sad': {
                    user: "Koncham badha gaa undhi raa...",
                    apta: `Aww raa mama... Nenu unnanu ga, cheppu emaindi? 💙 Sometime thoughts overweight aithe mind heavy anipisthundhi. Chinna walk vesukoni, mana **528 Hz Transformation Tone** vinu. Life lo anni solve avuthai raa!<br><br>
                    <div class="apta-action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="window.aptaNavigateTab('tab-frequency', 'play528')"><i class="fa-solid fa-wand-magic-sparkles"></i> 🎵 528Hz Healing</button>
                    </div>`
                },
                'need-focus': {
                    user: "Focus ravadam ledhu raa, mind wander avuthundi.",
                    apta: `Naaku ardham ayyindi raa! Brain Theta waves lo ki vellindochu. Nuvvu ventane **Sudoku Focus Puzzle** aadu or **10 Hz Alpha Binaural Beats** ON cheyyi. 10 mins lo focus back vasthundhi!<br><br>
                    <div class="apta-action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="window.aptaNavigateTab('tab-games', 'gameSudoku')"><i class="fa-solid fa-table-cells"></i> 🧩 Sudoku Game</button>
                    </div>`
                },
                'feeling-good': {
                    user: "Cool gaa unnanu eeroju!",
                    apta: `Semma raa mama! 🎉 Mass mood lo unnav! EEG readings lo kooda Alpha waves super high gaa unnai. Ila ge relaxed & happy gaa undu, rock it! 🔥`
                }
            },
            en: {
                'feeling-stressed': {
                    user: "I am feeling very stressed today.",
                    apta: `Don't worry my friend! 🤗 Take a 5-minute break! Play **432 Hz Miracle Tone** or try the **Bubble Wrap Popper** game.<br><br>
                    <div class="apta-action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="window.aptaNavigateTab('tab-frequency', 'play432')"><i class="fa-solid fa-play"></i> 🎵 432Hz Sound</button>
                        <button class="btn btn-sm btn-secondary" onclick="window.aptaNavigateTab('tab-games', 'gameBubble')"><i class="fa-solid fa-gamepad"></i> 🎮 Play Game</button>
                    </div>`
                },
                'feeling-sad': {
                    user: "I am feeling a bit sad or low today...",
                    apta: `Aww my friend... I am right here for you. 💙 Take a short walk and listen to **528 Hz Transformation Tone**. Everything will be fine!`
                },
                'need-focus': {
                    user: "I can't focus today, my mind is wandering.",
                    apta: `I understand! Play a quick **Sudoku Focus Puzzle** or turn on **10 Hz Alpha Binaural Beats**. Your focus will return in 10 minutes!`
                },
                'feeling-good': {
                    user: "I feel great and relaxed today!",
                    apta: "Awesome my friend! 🎉 You are in a fantastic mood! Stay relaxed and happy! 🚀"
                }
            },
            telugu: {
                'feeling-stressed': {
                    user: "నాకు చాలా ఒత్తిడిగా ఉంది...",
                    apta: "బాధపడకండి మిత్రమా! 🤗 ఒక 5 నిమిషాలు ప్రశాంతంగా ఉండండి! **432 Hz సౌండ్ థెరపీ** వినండి లేదా **బబుల్ పాపర్ గేమ్** ఆడండి!"
                },
                'feeling-sad': {
                    user: "కొంచెం బాధగా ఉంది...",
                    apta: "అయ్యో మిత్రమా... నేను ఉన్నాను కదా, ఏమైందో చెప్పండి? 💙 చిన్న నడక వేసి **528 Hz టోన్** వినండి!"
                },
                'need-focus': {
                    user: "ఏకాగ్రత కలగడం లేదు, మనస్సు తిరుగుతోంది.",
                    apta: "నాకు అర్థమైంది! **సుడోకు పజిల్** ఆడండి లేదా **10 Hz ఆల్ఫా బీట్స్** వినండి!"
                },
                'feeling-good': {
                    user: "ఈ రోజు చాలా ప్రశాంతంగా ఉన్నాను!",
                    apta: "చాలా సంతోషం మిత్రమా! 🎉 మీ మూడ్ అద్భుతంగా ఉంది!"
                }
            },
            hindi: {
                'feeling-stressed': {
                    user: "मुझे बहुत तनाव महसूस हो रहा है।",
                    apta: "चिंता न करें दोस्त! 🤗 5 मिनट का ब्रेक लें! **432 Hz ध्वनि चिकित्सा** सुनें या **बबल रैप गेम** खेलें!"
                },
                'feeling-sad': {
                    user: "आज थोड़ा उदास महसूस हो रहा है...",
                    apta: "अरे दोस्त... मैं आपके साथ हूँ 💙 थोड़ा टहलें और **528 Hz टोन** सुनें!"
                },
                'need-focus': {
                    user: "आज ध्यान केंद्रित नहीं हो पा रहा है।",
                    apta: "मैं समझ सकता हूँ! **सुडोकू पहेली** खेलें या **10 Hz अल्फा बीट्स** सुनें!"
                },
                'feeling-good': {
                    user: "आज मैं बहुत शांत और अच्छा महसूस कर रहा हूँ!",
                    apta: "बहुत बढ़िया दोस्त! 🎉 आपका मूड बहुत अच्छा है!"
                }
            }
        };

        const activeDict = moodResponses[lang] || moodResponses['teluglish'];
        const res = activeDict[moodKey] || activeDict['feeling-stressed'];

        this.appendMessage('user', res.user);
        this.showTypingIndicator();
        setTimeout(() => {
            this.hideTypingIndicator();
            this.appendMessage('apta', res.apta);
        }, 600);
    }

    handleUserPrompt(text) {
        if (!text.trim()) return;

        // Render User Bubble
        this.appendMessage('user', text);
        this.chatHistory.push({ role: 'user', text: text.toLowerCase() });

        // Show typing indicator animation
        this.showTypingIndicator();

        setTimeout(() => {
            this.hideTypingIndicator();
            const reply = this.generateResponse(text.toLowerCase());
            this.chatHistory.push({ role: 'apta', text: reply });
            this.appendMessage('apta', reply);
        }, 750);
    }

    showTypingIndicator() {
        if (this.isTyping || !this.messagesBox) return;
        this.isTyping = true;

        const typingDiv = document.createElement('div');
        typingDiv.id = 'aptaTypingIndicator';
        typingDiv.className = 'chat-bubble bubble-apta typing-indicator-bubble';
        typingDiv.innerHTML = `
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
            <span style="font-size: 0.75rem; color: #94a3b8; margin-left: 8px;">Āpta AI is thinking...</span>
        `;
        this.messagesBox.appendChild(typingDiv);
        this.messagesBox.scrollTop = this.messagesBox.scrollHeight;
    }

    hideTypingIndicator() {
        const el = document.getElementById('aptaTypingIndicator');
        if (el) el.remove();
        this.isTyping = false;
    }

    generateResponse(input) {
        const stressVal = Math.round(this.syncedStressVal);
        const lang = this.getLang();
        const lower = input.toLowerCase().trim();

        // Intent Detection
        const isPositiveShare = lower.includes('helped') || lower.includes('sharing') || lower.includes('happy') || lower.includes('won') || lower.includes('achieved') || lower.includes('good news') || lower.includes('great day') || lower.includes('smiled') || lower.includes('something');
        const isNegativeShare = lower.includes('sad') || lower.includes('crying') || lower.includes('failed') || lower.includes('scolded') || lower.includes('lonely') || lower.includes('alone') || lower.includes('fight') || lower.includes('breakup') || lower.includes('lost') || lower.includes('hurt') || lower.includes('bad day');
        const isIdentityQuery = lower.includes('who are you') || lower.includes('what are you') || lower.includes('what is eeg') || lower.includes('how do you work') || lower.includes('sensor') || lower.includes('esp32') || lower.includes('brainwave');

        const isRemedy = lower.includes('remedy') || lower.includes('remedies') || lower.includes('solution') || lower.includes('thaggadaniki') || lower.includes('tip') || lower.includes('advice') || lower.includes('suggest') || lower.includes('cheyali') || lower.includes('what should i do');
        const isSound = lower.includes('sound') || lower.includes('music') || lower.includes('song') || lower.includes('frequency') || lower.includes('432') || lower.includes('528') || lower.includes('binaural');
        const isBreathing = lower.includes('breath') || lower.includes('pranayaman') || lower.includes('swasa') || lower.includes('4-7-8') || lower.includes('lungs');
        const isGame = lower.includes('game') || lower.includes('play') || lower.includes('aadu') || lower.includes('bubble') || lower.includes('sudoku') || lower.includes('bore');
        const isFocus = lower.includes('focus') || lower.includes('study') || lower.includes('work') || lower.includes('exam') || lower.includes('concentration');
        const isHeadache = lower.includes('headache') || lower.includes('thala') || lower.includes('noppi') || lower.includes('tired') || lower.includes('sleep');
        const isStress = lower.includes('stress') || lower.includes('tension') || lower.includes('pressure') || lower.includes('panic') || lower.includes('anxiety');
        const isJoke = lower.includes('joke') || lower.includes('funny') || lower.includes('story') || lower.includes('laugh') || lower.includes('comedy');
        const isGreeting = lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('namaskaram') || lower.includes('macha') || lower.includes('mama') || lower.includes('bro') || lower.includes('arey') || lower.includes('good morning') || lower.includes('good night');
        const isThanks = lower.includes('thank') || lower.includes('thanks') || lower.includes('thx') || lower.includes('danyavad');

        // ================= LANGUAGE 1: TELUGLISH (TANGLISH - PRIMARY DEFAULT) =================
        if (lang === 'teluglish') {
            if (isPositiveShare) {
                return `Aww semma raa mama! 🎉 That's so wonderful! Evarikaina help chesthe or positive news share chesthe brain lo **Oxytocin & Endorphins** release aithai. Alpha brainwaves spike aisi mind naturally relaxed state ki vasthundhi!<br><br>
                Nee live EEG score currently <strong>${stressVal}% (Super Balanced)</strong>. Em help chesav or em vishayam share chesav cheppu mama, nenu exciting ga vintu unna! 😊`;
            }

            if (isNegativeShare) {
                return `Aww raa mama... Badha padaku, nenu unnanu ga neetho! 💙 Sometime thoughts overweight aithe leda situation unexpected ga marithe mind heavy anipisthundhi. It's completely natural raa.<br><br>
                Okka 2 mins kurchoni, mana **528 Hz Transformation Tone** vinu leda deep breath thesko. What happened raa mama? Unna raa, nakku motham cheppu! 🌿`;
            }

            if (isIdentityQuery) {
                return `Nenu **Āpta AI (आप्त AI)** raa mama! 🧠✨ Mana ESP32-S3 BioAmp EXG Pill sensor nundi 250Hz sampling rate lo vachina real-time single-channel EEG brainwave signals (Delta, Theta, Alpha, Beta, Gamma) ni track chestha.<br><br>
                1D-CNN Deep Learning model and Beta/Alpha ratio analyze chesi, nee live stress score (currently <strong>${stressVal}%</strong>) ni monitor chesthu, mind calm cheydaniki guidance istha! 🔥`;
            }

            if (isRemedy) {
                return `Macha! Stress thaggadaniki Top 4 Scientific Bio-Remedies ivve raa mama! 👇<br><br>
                1. 🎵 <strong>432Hz Solfeggio Sound</strong>: Alpha waves sync avuthai, Beta wave spikes crash aithundhi.<br>
                2. 🫁 <strong>4-7-8 Biofeedback Breathing</strong>: 4 sec pilchoo, 7 sec aapu, 8 sec vadulu. Vagus nerve activate aithundhi.<br>
                3. 🎮 <strong>Tactile Games</strong>: Mind redirect cheydaniki Bubble Wrap Popper or Sudoku Focus aadu.<br>
                4. 💧 <strong>Hydration & Walk</strong>: 1 glass cool water thagi 2 mins screen ki gap ivvi!<br><br>
                Ae remedy launch cheyyalo ikkada button click cheyyi mama! 👇
                <div class="apta-action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="window.aptaNavigateTab('tab-frequency', 'play432')"><i class="fa-solid fa-play"></i> 🎵 Play 432Hz Sound</button>
                    <button class="btn btn-sm btn-accent" onclick="window.aptaNavigateTab('tab-frequency', 'breathing')"><i class="fa-solid fa-lungs"></i> 🫁 Start 4-7-8 Breathing</button>
                    <button class="btn btn-sm btn-secondary" onclick="window.aptaNavigateTab('tab-games', 'gameBubble')"><i class="fa-solid fa-gamepad"></i> 🎮 Play Stress Game</button>
                </div>`;
            }

            if (isSound) {
                return `Sound Therapy is super powerful raa mama! 🎵 Brainwaves fast ga Alpha relaxation state ki vasthai.<br><br>
                - <strong>432 Hz Miracle Tone</strong>: Anxiety & stress score thaggisthundhi.<br>
                - <strong>528 Hz Healing Frequency</strong>: Mind clarity & positive vibes vasthai.<br>
                - <strong>10 Hz Alpha Binaural Beats</strong>: Focus & study time lo ultra helpful.<br><br>
                Direct ga ikkada click chesi 432Hz sound start cheyyi mama! 👇
                <div class="apta-action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="window.aptaNavigateTab('tab-frequency', 'play432')"><i class="fa-solid fa-play"></i> 🎵 Start 432Hz Player</button>
                </div>`;
            }

            if (isBreathing) {
                return `Swasa meedha focus pettadame main key raa! 🫁 <strong>4-7-8 Breathing Guide</strong> try cheyyi:<br><br>
                1. 4 seconds mookuthoni deep ga pilchoo.<br>
                2. 7 seconds aapu (hold).<br>
                3. 8 seconds slow ga noruthoni vadulu.<br><br>
                10 breathings tharvatha heart rate & stress score severe ga drop aithundhi! Below button click cheyyi: 👇
                <div class="apta-action-buttons">
                    <button class="btn btn-sm btn-accent" onclick="window.aptaNavigateTab('tab-frequency', 'breathing')"><i class="fa-solid fa-lungs"></i> Open Breathing Visualizer</button>
                </div>`;
            }

            if (isGame) {
                return `Mind divert cheydaniki games powerful buster raa mama! 🎮<br><br>
                - <strong>Bubble Wrap Popper</strong>: Tactile pop sounds thoni anxiety vanish aithundhi.<br>
                - <strong>Sudoku Mind Focus</strong>: Logical brain activate aisi stress thoughts clear aithai.<br>
                - <strong>2048 Mind Merge</strong>: Pure concentration & fun!<br><br>
                Game click chesi immediate ga aadu mama! 👇
                <div class="apta-action-buttons">
                    <button class="btn btn-sm btn-secondary" onclick="window.aptaNavigateTab('tab-games', 'gameBubble')"><i class="fa-solid fa-circle-dot"></i> 1. Bubble Popper</button>
                    <button class="btn btn-sm btn-primary" onclick="window.aptaNavigateTab('tab-games', 'gameSudoku')"><i class="fa-solid fa-table-cells"></i> 3. Sudoku Focus</button>
                </div>`;
            }

            if (isFocus) {
                return `Focus ravadam ledha mama? 🎯 Exams or Coding workload meedha attention pethalante brain Theta state lo unnattu.<br><br>
                1. okka 5 mins <strong>10 Hz Alpha Binaural Beats</strong> vinu.<br>
                2. 1 round <strong>Sudoku Focus Puzzle</strong> simple grid solve cheyyi.<br>
                3. Water thagu, screen light koncham 80% ki thagginchu.<br><br>
                Focus back osthundhi mama! Try chesi cheppu! 🔥`;
            }

            if (isHeadache) {
                return `Arey thala noppi / exhaustion unte heavy screen light valla untundhi raa mama. 😴<br><br>
                1. Immediate ga 10 mins screen off chesi, dark room lo cool ga kurcho.<br>
                2. Mana app lo **528 Hz Transformation Tone** background lo pettu.<br>
                3. Cool water thagi temples daggara light press cheyyi.<br><br>
                Relief osthundhi mama! Take rest! 🌿`;
            }

            if (isJoke) {
                return `Chinna tech joke cheptha vinu raa mama! 😂<br><br>
                <em>"Hardware disconnect ayina reconnect cheyocchu, kaani human brain disconnected ayite Āpta AI thone connection set cheyali!"</em> 🤖⚡<br><br>
                Chill bro! Current EEG score <strong>${stressVal}%</strong> lo undhi. Deep breath thesko! 😎`;
            }

            if (isGreeting) {
                return `Cheppu raa mama! 😇 Currently live EEG stress score <strong>${stressVal}%</strong> lo undhi. Em help venum cheppu mama? Remedies, 432Hz music, breathing, stress games, or general talk? Āpta AI ready gaa undhi! 🔥`;
            }

            if (isThanks) {
                return `Mention moodu raa bestie! 😉 Always unnanu unakkaga. Focus chesthu chill avvu! 🚀`;
            }

            // Dynamic Contextual Fallback for Tanglish
            const cleanSnippet = input.length > 40 ? input.substring(0, 40) + '...' : input;
            return `Aha, nenu vintu unna raa mama! 🧠✨ Nuvvu cheppina <em>"${cleanSnippet}"</em> meedha reflect avuthunnanu. Current EEG stress level: <strong>${stressVal}%</strong>.<br><br>
            Inka cheppu raa mama, em matladadhama? Sound therapy petti relax avvamantara leda 4-7-8 breathing test chedama? 👇`;
        }

        // ================= LANGUAGE 2: ENGLISH =================
        if (lang === 'en') {
            if (isPositiveShare) {
                return `Aww that is so wonderful my friend! 🌟 Helping others or sharing joy triggers the release of Oxytocin and boosts healthy Alpha brainwaves. It creates a natural state of inner peace!<br><br>
                Your current EEG stress score is <strong>${stressVal}% (Calm & Balanced)</strong>. Tell me more about what happened today! I'd love to hear! 😊`;
            }

            if (isNegativeShare) {
                return `I'm so sorry you're going through this my friend. 💙 Please know that I am right here for you. It's completely natural to feel overwhelmed or down at times.<br><br>
                Take a slow deep breath, listen to 528Hz healing frequencies, and talk to me. What's on your mind? 🌿`;
            }

            if (isIdentityQuery) {
                return `I am **Āpta AI (आप्त AI)**, your intelligent EEG wellness assistant! 🧠✨ I process real-time single-channel brainwave signals from your ESP32-S3 BioAmp EXG sensor at 250Hz.<br><br>
                Using a 1D-CNN deep learning model and Beta/Alpha spectral analysis, I monitor your live mental stress level (currently <strong>${stressVal}%</strong>) and provide personalized remedies! 🔥`;
            }

            if (isRemedy) {
                return `Here are the <strong>Top 4 Anti-Stress Bio-Remedies</strong> for you! 🌿<br><br>
                1. 🎵 <strong>432Hz Sound Therapy</strong>: Instantly relaxes Beta wave spikes.<br>
                2. 🫁 <strong>4-7-8 Breathing Guide</strong>: Activates the Parasympathetic Nervous System.<br>
                3. 🎮 <strong>Tactile Mini-Games</strong>: Redirects mental overload with Bubble Popper or Sudoku.<br>
                4. 💧 <strong>Hydration & Walk</strong>: Drink a glass of water and take a 2-min screen break.<br><br>
                Click any button below to launch immediately! 👇
                <div class="apta-action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="window.aptaNavigateTab('tab-frequency', 'play432')"><i class="fa-solid fa-play"></i> 🎵 432Hz Sound</button>
                    <button class="btn btn-sm btn-accent" onclick="window.aptaNavigateTab('tab-frequency', 'breathing')"><i class="fa-solid fa-lungs"></i> 🫁 4-7-8 Breathing</button>
                    <button class="btn btn-sm btn-secondary" onclick="window.aptaNavigateTab('tab-games', 'gameBubble')"><i class="fa-solid fa-gamepad"></i> 🎮 Play Game</button>
                </div>`;
            }

            if (isSound) {
                return `Listening to harmonic sound frequencies lowers Cortisol! 🎵<br><br>
                - <strong>432 Hz</strong>: Miracle tone for anxiety reduction.<br>
                - <strong>528 Hz</strong>: Transformation & cell healing.<br>
                - <strong>10 Hz Alpha Beats</strong>: Calm focus & clarity.<br><br>
                <div class="apta-action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="window.aptaNavigateTab('tab-frequency', 'play432')"><i class="fa-solid fa-play"></i> Launch 432Hz Player</button>
                </div>`;
            }

            if (isBreathing) {
                return `The <strong>4-7-8 Breathing Technique</strong> slows down rapid heart rates & reduces Beta waves! 🫁<br><br>Inhale for 4s, Hold for 7s, and Exhale slowly for 8s.<br><br>
                <div class="apta-action-buttons">
                    <button class="btn btn-sm btn-accent" onclick="window.aptaNavigateTab('tab-frequency', 'breathing')"><i class="fa-solid fa-lungs"></i> Open Breathing Visualizer</button>
                </div>`;
            }

            if (isGame) {
                return `Tactile & puzzle games help clear mental chatter! 🎮 Choose a game below:
                <div class="apta-action-buttons">
                    <button class="btn btn-sm btn-secondary" onclick="window.aptaNavigateTab('tab-games', 'gameBubble')"><i class="fa-solid fa-circle-dot"></i> Bubble Popper</button>
                    <button class="btn btn-sm btn-primary" onclick="window.aptaNavigateTab('tab-games', 'gameSudoku')"><i class="fa-solid fa-table-cells"></i> Sudoku Focus</button>
                </div>`;
            }

            if (isFocus) {
                return `Difficulty focusing usually means Theta wave dominance or mental fatigue 🎯<br><br>Try taking a 5-minute break with <strong>10 Hz Alpha Binaural Beats</strong> or play 1 round of <strong>Sudoku Focus</strong>!`;
            }

            if (isJoke) {
                return `Here is a quick dev joke for you! 😂<br><br><em>"Why do programmers prefer dark mode? Because light attracts bugs!"</em> 🐛<br><br>Take it easy my friend! Your current stress score is <strong>${stressVal}%</strong>. Smile and relax! 😊`;
            }

            if (isGreeting) {
                return `Hello my friend! 😇 Your live EEG stress score is <strong>${stressVal}%</strong>. How can I help you today? Ask me for remedies, music, games, or focus tips!`;
            }

            if (isThanks) {
                return `You're most welcome my friend! 😉 Āpta AI is always here for you. Stay calm and keep shining! 🚀`;
            }

            // Dynamic Contextual Fallback for English
            const cleanSnippet = input.length > 40 ? input.substring(0, 40) + '...' : input;
            return `I'm listening to you my friend! 🧠✨ Reflecting on what you said: <em>"${cleanSnippet}"</em>.<br><br>Your live EEG stress score is currently <strong>${stressVal}%</strong>. Feel free to talk to me about anything, or ask me for remedies, relaxation sounds, or focus games! 🌿`;
        }

        // ================= LANGUAGE 3: TELUGU =================
        if (lang === 'telugu') {
            if (isPositiveShare) {
                return `చాలా సంతోషం మిత్రమా! 🎉 ఇతరులకు సహాయం చేయడం వల్ల మనస్సులో ఆల్ఫా తరంగాలు పెరిగి ఒత్తిడి తగ్గుతుంది! మీ EEG స్కోరు: <strong>${stressVal}%</strong>.`;
            }
            if (isNegativeShare) {
                return `బాధపడకండి మిత్రమా... నేను ఉన్నాను కదా! 💙 ప్రశాంతంగా 528Hz టోన్ వినండి. ఏమైందో చెప్పండి?`;
            }
            if (isRemedy || isStress) {
                return `ఒత్తిడి నివారణకు టాప్ 4 చిట్కాలు! 🌿<br><br>
                1. 🎵 <strong>432Hz సౌండ్ థెరపీ</strong><br>
                2. 🫁 <strong>4-7-8 ప్రాణాయామం</strong><br>
                3. 🎮 <strong>స్ట్రెస్ గేమ్‌లు</strong><br>
                4. 💧 <strong>మంచినీళ్లు తాగండి</strong><br><br>ప్రస్తుత ఒత్తిడి స్కోరు: <strong>${stressVal}%</strong>.`;
            }
            if (isGreeting) {
                return `నమస్కారం మిత్రమా! 😇 ప్రస్తుతం మీ EEG ఒత్తిడి స్కోరు <strong>${stressVal}%</strong>. నేను మీకు ఎలా సహాయపడగలను?`;
            }
            return `నేను వింటున్నాను మిత్రమా! 🧠✨ ప్రస్తుతం మీ EEG ఒత్తిడి స్థాయి <strong>${stressVal}%</strong>. ప్రశాంతంగా ఉండండి! 🔥`;
        }

        // ================= LANGUAGE 4: HINDI =================
        if (lang === 'hindi') {
            if (isPositiveShare) {
                return `बहुत बढ़िया दोस्त! 🎉 दूसरों की मदद करने से मस्तिष्क में अल्फा तरंगें बढ़ती हैं! आपका तनाव स्कोर: <strong>${stressVal}%</strong>।`;
            }
            if (isNegativeShare) {
                return `अरे दोस्त... चिंता न करें, मैं आपके साथ हूँ! 💙 गहरी सांस लें। क्या हुआ मुझे बताएं!`;
            }
            if (isRemedy || isStress) {
                return `तनाव कम करने के 4 उपाय! 🌿<br><br>
                1. 🎵 <strong>432Hz ध्वनि चिकित्सा</strong><br>
                2. 🫁 <strong>4-7-8 प्राणायाम</strong><br>
                3. 🎮 <strong>रिलैक्सिंग गेम्स</strong><br>
                4. 💧 <strong>पानी पीकर टहलें</strong><br><br>वर्तमान तनाव स्कोर: <strong>${stressVal}%</strong>।`;
            }
            if (isGreeting) {
                return `नमस्ते दोस्त! 😇 आपका वर्तमान EEG तनाव स्कोर <strong>${stressVal}%</strong> है। मैं आपकी क्या मदद कर सकता हूँ?`;
            }
            return `मैं आपकी बात समझ रहा हूँ दोस्त! 🧠✨ वर्तमान EEG तनाव स्तर: <strong>${stressVal}%</strong>। शांत रहें! 🔥`;
        }
    }

    appendMessage(sender, htmlText) {
        if (!this.messagesBox) this.init();

        const bubble = document.createElement('div');
        bubble.className = `chat-bubble bubble-${sender}`;

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const name = sender === 'apta' ? 'Āpta AI (आप्त AI)' : 'You';

        bubble.innerHTML = `
            <div class="bubble-header">
                <span class="speaker-name">${name}</span>
                <span class="bubble-time">${timeStr}</span>
            </div>
            <div class="bubble-text">${htmlText}</div>
        `;

        this.messagesBox.appendChild(bubble);
        this.messagesBox.scrollTop = this.messagesBox.scrollHeight;
    }

    clearChat() {
        this.chatHistory = [];
        const lang = this.getLang();
        const resetMsgs = {
            teluglish: "Chat reset chesa raa mama! New conversation start chedham. Cheppu, em matladadham? 😊",
            en: "Chat reset successfully! Let me know what you'd like to talk about. 😊",
            telugu: "చాట్ రీసెట్ చేయబడింది! ఏమి మాట్లాడదాం? 😊",
            hindi: "चैट रीसेट कर दी गई है! आप किस बारे में बात करना चाहेंगे? 😊"
        };

        if (this.messagesBox) {
            this.messagesBox.innerHTML = `
                <div class="chat-bubble bubble-apta">
                    <div class="bubble-header">
                        <span class="speaker-name">Āpta AI</span>
                        <span class="bubble-time">Just now</span>
                    </div>
                    <div class="bubble-text">
                        ${resetMsgs[lang] || resetMsgs['teluglish']}
                    </div>
                </div>
            `;
        }
    }
}

// Global Tab Navigation Helper for Āpta AI Action Buttons
window.aptaNavigateTab = function(tabId, actionType) {
    const navBtn = document.querySelector(`.main-nav .nav-tab[data-tab="${tabId}"]`);
    if (navBtn) navBtn.click();

    setTimeout(() => {
        if (actionType === 'play432') {
            const p432 = document.querySelector('.preset-card[data-freq="432"]');
            if (p432) p432.click();
        } else if (actionType === 'play528') {
            const p528 = document.querySelector('.preset-card[data-freq="528"]');
            if (p528) p528.click();
        } else if (actionType === 'breathing') {
            const btnB = document.getElementById('btnStartBreathing');
            if (btnB) btnB.click();
        } else if (actionType === 'gameBubble') {
            const btnG = document.querySelector('.btn-game-select[data-game="bubble"]');
            if (btnG) btnG.click();
        } else if (actionType === 'gameSudoku') {
            const btnS = document.querySelector('.btn-game-select[data-game="sudoku"]');
            if (btnS) btnS.click();
        }
    }, 150);
};

// Global Āpta AI instance
const aptaAI = new AptaAIChatbot();
