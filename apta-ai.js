/* ==========================================================================
   Udvegadarshini - Āpta AI (आप्त AI) Multi-Language Empathetic Chatbot Engine
   Supports: English, Teluglish (Tanglish), Telugu (తెలుగు), Hindi (हिन्दी)
   ========================================================================== */

class AptaAIChatbot {
    constructor() {
        this.messagesBox = null;
        this.syncedStressVal = 0;
        this.lastTriggeredTime = 0;
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
            teluglish: `Namaskaram raa mama! 🙏 Naan Āpta AI (आप्त AI). Unna raa, neeku eppudaina stress anipinchina, badha anipinchina leda urike matladalani unna, ikkada cheppu.<br><br>Mana ESP32 device nundi real-time EEG data ni nenu monitor chesthunna. Stress level ekkuvaithe direct ga nene neetho matladatha! Cheppu raa, eeroju mood ela undhi?`,
            en: `Hello my friend! 🙏 I am Āpta AI (आप्त AI). Whenever you feel stressed, anxious, or just want someone to talk to, I am right here for you.<br><br>I am monitoring your real-time EEG data from the ESP32 device. If your stress level rises, I will immediately check in on you. Tell me, how are you feeling today?`,
            telugu: `నమస్కారం మై ఫ్రెండ్! 🙏 నేను ఆప్త AI (Āpta AI). మీకు ఎప్పుడైనా మానసిక ఒత్తిడి అనిపించినా, బాధగా ఉన్నా లేదా మాట్లాడాలనిపించినా ఇక్కడ చెప్పండి.<br><br>మీ ESP32 పరికరం నుండి వస్తున్న లైవ్ EEG సమాచారాన్ని నేను గమనిస్తున్నాను. ఒత్తిడి పెరిగితే వెంటనే నేను మిమ్మల్ని పరామర్శిస్తాను. ఈ రోజు మీ మూడ్ ఎలా ఉందో చెప్పండి?`,
            hindi: `नमस्ते दोस्त! 🙏 मैं आप्त AI हूँ। जब भी आप तनाव या उदासी महसूस करें, या बस बात करना चाहें, मैं आपके साथ हूँ।<br><br>मैं आपके ESP32 डिवाइस से रियल-टाइम EEG डेटा की निगरानी कर रहा हूँ। तनाव का स्तर बढ़ते ही मैं आपकी मदद करूँगा। बताइए, आज आपका मूड कैसा है?`
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
            teluglish: "Macha, edhavadhu cheppali anipisthe ikkada type cheyyi raa...",
            en: "Type your thoughts or ask Āpta AI anything...",
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
        // Show global top banner
        const alertBanner = document.getElementById('highStressAlert');
        if (alertBanner) alertBanner.style.display = 'flex';

        // Unread badge on nav
        const unreadBadge = document.getElementById('aptaUnread');
        if (unreadBadge) unreadBadge.style.display = 'inline-block';

        const lang = this.getLang();
        const score = Math.round(stressVal);

        const alertMsgs = {
            teluglish: `<strong>Arrey mama! Alert raa! 🚨</strong><br>Nenu Āpta AI (आप्त AI) monitor chesthunna, mana ESP32 EEG reading lo stress score <strong>${score}%</strong> (High Stress) reach aindi raa!<br><br>Badha padaku mama, nenu unnanu ga! 🌿 Immediately 432Hz Sound Therapy ON chesi, 4-7-8 Breathing Guide start cheyyi. Emaina mental pressure undhi ante nakku cheppu, matladatha!`,
            en: `<strong>Alert! High Stress Detected! 🚨</strong><br>I am Āpta AI monitoring your ESP32 EEG reading. Your stress score reached <strong>${score}%</strong> (High Stress)!<br><br>Don't worry, I am here with you! 🌿 Please turn on 432Hz Sound Therapy and start the 4-7-8 Breathing Guide. If you feel any pressure, talk to me!`,
            telugu: `<strong>హెచ్చరిక! అధిక ఒత్తిడి గుర్తింపు! 🚨</strong><br>నేను ఆప్త AI ని. మీ ESP32 EEG రీడింగ్ లో ఒత్తిడి స్కోరు <strong>${score}%</strong> కి చేరింది!<br><br>బాధపడకండి, నేను ఉన్నాను! 🌿 వెంటనే 432Hz సౌండ్ థెరపీ ఆన్ చేసి, ప్రాణాయామ శ్వాస తీసుకోండి. ఏమైనా ఉంటే నాతో మాట్లాడండి!`,
            hindi: `<strong>चेतावनी! उच्च तनाव की पहचान! 🚨</strong><br>मैं आप्त AI हूँ। आपकी ESP32 EEG रीडिंग में तनाव स्कोर <strong>${score}%</strong> तक पहुँच गया है!<br><br>चिंता न करें, मैं आपके साथ हूँ! 🌿 तुरंत 432Hz ध्वनि चिकित्सा शुरू करें और 4-7-8 प्राणायाम करें। मुझसे बात करें!`
        };

        this.appendMessage('apta', alertMsgs[lang] || alertMsgs['teluglish']);
    }

    handleUserPrompt(text) {
        if (!text.trim()) return;

        // Render User Bubble
        this.appendMessage('user', text);

        // Process Response
        setTimeout(() => {
            const reply = this.generateResponse(text.toLowerCase());
            this.appendMessage('apta', reply);
        }, 800);
    }

    handleMoodButton(moodKey) {
        const lang = this.getLang();

        const moodResponses = {
            teluglish: {
                'feeling-stressed': {
                    user: "Macha, ekkuva stress gaa undhi raa!",
                    apta: "Arrey badha padaku mama! 🤗 Workload or pressure ekkuva inattundi. Okka 5 mins relax avvu! Sound Therapy tab lo **432 Hz Miracle Tone** pettu leda mana **Bubble Wrap Popper** game aadu. Stress jorru ga thaggipothundi!"
                },
                'feeling-sad': {
                    user: "Koncham badha gaa undhi raa...",
                    apta: "Aww raa mama... Nenu unnanu ga, cheppu emaindi? 💙 Sometime thoughts overweight aithe mind heavy anipisthundhi. Chinna walk vesukoni, mana **528 Hz Transformation Tone** vinu. Life lo anni solve avuthai raa!"
                },
                'need-focus': {
                    user: "Focus ravadam ledhu raa, mind wander avuthundi.",
                    apta: "Naaku ardham ayyindi raa! Brain Theta waves lo ki vellindochu. Nuvvu ventane **Sudoku Focus Puzzle** aadu or **10 Hz Alpha Binaural Beats** ON cheyyi. 10 mins lo focus back vasthundhi!"
                },
                'feeling-good': {
                    user: "Cool gaa unnanu eeroju!",
                    apta: "Semma raa mama! 🎉 Mass mood lo unnav! EEG readings lo kooda Alpha waves super high gaa unnai. Ila ge relaxed & happy gaa undu, rock it!"
                }
            },
            en: {
                'feeling-stressed': {
                    user: "I am feeling very stressed today.",
                    apta: "Don't worry my friend! 🤗 Looks like workload or mental pressure is high. Take a 5-minute break! Play **432 Hz Miracle Tone** in Sound Therapy or try the **Bubble Wrap Popper** game. Your stress will drop quickly!"
                },
                'feeling-sad': {
                    user: "I am feeling a bit sad or low today...",
                    apta: "Aww my friend... I am right here for you, tell me what happened? 💙 Sometimes heavy thoughts make the mind feel heavy. Take a short walk and listen to **528 Hz Transformation Tone**. Everything will be fine!"
                },
                'need-focus': {
                    user: "I can't focus today, my mind is wandering.",
                    apta: "I understand! Your brain might be in Theta wave state. Play a quick **Sudoku Focus Puzzle** or turn on **10 Hz Alpha Binaural Beats** in Sound Therapy. Your focus will return in 10 minutes!"
                },
                'feeling-good': {
                    user: "I feel great and relaxed today!",
                    apta: "Awesome my friend! 🎉 You are in a fantastic mood! Your EEG readings also show strong Alpha waves. Stay relaxed, happy, and keep rocking!"
                }
            },
            telugu: {
                'feeling-stressed': {
                    user: "నాకు చాలా ఒత్తిడిగా ఉంది...",
                    apta: "బాధపడకండి మిత్రమా! 🤗 ఒత్తిడి ఎక్కువగా ఉన్నట్లుంది. ఒక 5 నిమిషాలు ప్రశాంతంగా ఉండండి! **432 Hz సౌండ్ థెరపీ** వినండి లేదా **బబుల్ పాపర్ గేమ్** ఆడండి. ఒత్తిడి త్వరగా తగ్గుతుంది!"
                },
                'feeling-sad': {
                    user: "కొంచెం బాధగా ఉంది...",
                    apta: "అయ్యో మిత్రమా... నేను ఉన్నాను కదా, ఏమైందో చెప్పండి? 💙 కొన్నిసార్లు ఆలోచనలు ఎక్కువైతే మనస్సు బరువుగా అనిపిస్తుంది. చిన్న నడక వేసి, **528 Hz టోన్** వినండి. అంతా మంచి జరుగుతుంది!"
                },
                'need-focus': {
                    user: "ఏకాగ్రత కలగడం లేదు, మనస్సు తిరుగుతోంది.",
                    apta: "నాకు అర్థమైంది! మీ మెదడు తీటా తరంగాలలో ఉండి ఉండవచ్చు. వెంటనే **సుడోకు పజిల్** ఆడండి లేదా **10 Hz ఆల్ఫా బీట్స్** వినండి. 10 నిమిషాల్లో ఏకాగ్రత పెరుగుతుంది!"
                },
                'feeling-good': {
                    user: "ఈ రోజు చాలా ప్రశాంతంగా ఉన్నాను!",
                    apta: "చాలా సంతోషం మిత్రమా! 🎉 మీ మూడ్ అద్భుతంగా ఉంది! మీ EEG రీడింగ్స్ లో కూడా ఆల్ఫా తరంగాలు ఎక్కువగా ఉన్నాయి. ఇలాగే ప్రశాంతంగా ఉండండి!"
                }
            },
            hindi: {
                'feeling-stressed': {
                    user: "मुझे बहुत तनाव महसूस हो रहा है।",
                    apta: "चिंता न करें दोस्त! 🤗 लगता है काम का दबाव ज्यादा है। 5 मिनट का ब्रेक लें! **432 Hz ध्वनि चिकित्सा** सुनें या **बबल रैप गेम** खेलें। तनाव तुरंत कम होगा!"
                },
                'feeling-sad': {
                    user: "आज थोड़ा उदास महसूस हो रहा है...",
                    apta: "अरे दोस्त... मैं आपके साथ हूँ, बताइए क्या हुआ? 💙 कभी-कभी ज्यादा सोचने से मन भारी हो जाता है। थोड़ा टहलें और **528 Hz टोन** सुनें। सब ठीक हो जाएगा!"
                },
                'need-focus': {
                    user: "आज ध्यान केंद्रित नहीं हो पा रहा है।",
                    apta: "मैं समझ सकता हूँ! आपका दिमाग थीटा तरंगों में हो सकता है। **सुडोकू पहेली** खेलें या **10 Hz अल्फा बीट्स** सुनें। 10 मिनट में फोकस वापस आ जाएगा!"
                },
                'feeling-good': {
                    user: "आज मैं बहुत शांत और अच्छा महसूस कर रहा हूँ!",
                    apta: "बहुत बढ़िया दोस्त! 🎉 आपका मूड बहुत अच्छा है! आपकी EEG रीडिंग भी मजबूत अल्फा तरंगें दिखा रही हैं। ऐसे ही खुश और शांत रहें!"
                }
            }
        };

        const activeDict = moodResponses[lang] || moodResponses['teluglish'];
        const res = activeDict[moodKey] || activeDict['feeling-stressed'];

        this.appendMessage('user', res.user);
        setTimeout(() => {
            this.appendMessage('apta', res.apta);
        }, 600);
    }

    generateResponse(input) {
        const stressVal = Math.round(this.syncedStressVal);
        const lang = this.getLang();

        if (lang === 'en') {
            if (input.includes('hi') || input.includes('hello') || input.includes('hey')) {
                return `Hello my friend! 😇 Your current EEG stress score is <strong>${stressVal}%</strong>. How can I help you today? Āpta AI is always here for you!`;
            }
            if (input.includes('stress') || input.includes('tension') || input.includes('pressure')) {
                return `When you feel stressed, 𝛽 (Beta) waves spike. Don't worry! Try our **432Hz Sound Therapy** or play **Zen Particle Sandbox** game to soothe your mind. I am always with you! 💙`;
            }
            if (input.includes('game') || input.includes('play') || input.includes('bored')) {
                return `Feeling bored? Check out the **5 Stress Relief Mini-Games** tab and play Sudoku or Bubble Popper! It's a great stress buster! 🎮`;
            }
            if (input.includes('music') || input.includes('song') || input.includes('sound')) {
                return `For deep peace, listen to **432 Hz Solfeggio Tone** or **Ambient Rain** sounds in Sound Therapy. Your brain will switch to Alpha state quickly! 🎵`;
            }
            if (input.includes('thanks') || input.includes('thank you')) {
                return `You're most welcome my bestie! 😉 I am always here to support you. Stay relaxed and take care! 🚀`;
            }
            return `I have noted your thoughts! 🧠✨ Your current EEG stress score is <strong>${stressVal}%</strong>. Take a slow deep breath, everything is going to be alright! 🔥`;
        }

        if (lang === 'telugu') {
            if (input.includes('హాయ్') || input.includes('నమస్కారం') || input.includes('hi') || input.includes('hello')) {
                return `నమస్కారం మిత్రమా! 😇 ప్రస్తుతం మీ EEG ఒత్తిడి స్కోరు <strong>${stressVal}%</strong> గా ఉంది. మీకు నేను ఎలా సహాయపడగలను? ఆప్త AI ఎల్లప్పుడూ మీతో ఉంటుంది!`;
            }
            if (input.includes('ఒత్తిడి') || input.includes('స్ట్రెస్') || input.includes('బాధ') || input.includes('stress')) {
                return `ఒత్తిడి ఉన్నప్పుడు 𝛽 (బీటా) తరంగాలు పెరుగుతాయి. బాధపడకండి! మన యాప్‌లోని **సౌండ్ థెరపీ** లేదా **జెన్ పార్టికల్ గేమ్‌** ద్వారా మనస్సును ప్రశాంతపరుచుకోండి. నేను మీతోనే ఉన్నాను! 💙`;
            }
            if (input.includes('గేమ్') || input.includes('ఆట') || input.includes('game') || input.includes('play')) {
                return `గేమ్స్ ఆడాలనుకుంటున్నారా? **5 స్ట్రెస్ రిలీఫ్ గేమ్‌లు** విభాగంలో సుడోకు లేదా బబుల్ పాపర్ ఆడండి! ఒత్తిడి త్వరగా తగ్గుతుంది! 🎮`;
            }
            if (input.includes('పాట') || input.includes('సంగీతం') || input.includes('music') || input.includes('sound')) {
                return `మనస్సు ప్రశాంతంగా ఉండటానికి **432 Hz సౌండ్ థెరపీ** వినండి. మెదడు ఆల్ఫా స్థితికి వచ్చి ఒత్తిడి వెంటనే తగ్గుతుంది! 🎵`;
            }
            if (input.includes('థాంక్స్') || input.includes('ధన్యవాదాలు') || input.includes('thanks')) {
                return `ధన్యవాదాలు మిత్రమా! 😉 మీకు సహాయం చేయడానికి నేను ఎల్లప్పుడూ సిద్ధంగా ఉంటాను. ప్రశాంతంగా ఉండండి! 🚀`;
            }
            return `మీరు చెప్పింది నేను నోట్ చేసుకున్నాను! 🧠✨ ప్రస్తుత EEG ఒత్తిడి స్థాయి: <strong>${stressVal}%</strong>. ఒకసారి సుదీర్ఘ శ్వాస తీసుకోండి, అంతా మంచి జరుగుతుంది! 🔥`;
        }

        if (lang === 'hindi') {
            if (input.includes('नमस्ते') || input.includes('हेलो') || input.includes('hi') || input.includes('hello')) {
                return `नमस्ते दोस्त! 😇 आपका वर्तमान EEG तनाव स्कोर <strong>${stressVal}%</strong> है। मैं आपकी क्या मदद कर सकता हूँ? आप्त AI हमेशा आपके साथ है!`;
            }
            if (input.includes('तनाव') || input.includes('स्ट्रेस') || input.includes('चिंता') || input.includes('stress')) {
                return `तनाव के समय 𝛽 (बीटा) तरंगें बढ़ जाती हैं। चिंता न करें! हमारी **ध्वनि चिकित्सा** या **ज़ेन पार्टिकल खेल** से अपने मन को शांत करें। मैं हमेशा आपके साथ हूँ! 💙`;
            }
            if (input.includes('खेल') || input.includes('गेम') || input.includes('game') || input.includes('play')) {
                return `क्या आप खेल खेलना चाहते हैं? **5 तनाव राहत खेल** टैब में जाकर सुडोकू या बबल रैप खेलें! यह तनाव कम करने का बेहतरीन तरीका है! 🎮`;
            }
            if (input.includes('संगीत') || input.includes('गाने') || input.includes('music') || input.includes('sound')) {
                return `गहरे सुकून के लिए **432 Hz सोल्फ़ेजियो टोन** या **बारिश की आवाज़** सुनें। आपका दिमाग जल्दी ही अल्फा अवस्था में आ जाएगा! 🎵`;
            }
            if (input.includes('धन्यवाद') || input.includes('शुक्रिया') || input.includes('thanks')) {
                return `आपका स्वागत है दोस्त! 😉 मैं हमेशा आपकी मदद के लिए यहाँ हूँ। शांत रहें और ध्यान रखें! 🚀`;
            }
            return `मैंने आपकी बात नोट कर ली है! 🧠✨ वर्तमान EEG तनाव स्तर: <strong>${stressVal}%</strong>। एक गहरी सांस लें, सब ठीक हो जाएगा! 🔥`;
        }

        // Teluglish Default Fallback
        if (input.includes('hi') || input.includes('hello') || input.includes('hey') || input.includes('macha') || input.includes('arey')) {
            return `Cheppu raa mama! 😇 Currently target stress score <strong>${stressVal}%</strong> lo undhi. Em help venum sollu, Āpta AI ready gaa undhi!`;
        }

        if (input.includes('stress') || input.includes('tension') || input.includes('pressure')) {
            return `Stress unnappudu 𝛽 (Beta) waves spike avuthai raa. Tension theskoku, mana app lo **Sound Therapy** or **Zen Particle Sandbox** game aadi mind ni distract cheyyi. Nenu neetho eppudoo untanu! 💙`;
        }

        if (input.includes('game') || input.includes('play') || input.includes('bore')) {
            return `Bore koduthunda? Nuvvu **5 Stress Relief Mini-Games** tab ki velli Sudoku or Bubble Popper aadu raa! Super fun & stress buster! 🎮`;
        }

        if (input.includes('music') || input.includes('song') || input.includes('sound')) {
            return `Mind peaceful gaa undali ante **432 Hz Solfeggio Tone** or **Ambient Rain** sounds pettu. Brainwave alpha state ki velli stress ventane thagguthundhi! 🎵`;
        }

        if (input.includes('thanks') || input.includes('thank you') || input.includes('thx')) {
            return `Mention moodu raa bestie! 😉 Always unnanu unakkaga. Focus chesthu chill avvu! 🚀`;
        }

        return `Aha, kachithanga raa mama! 🧠✨ Nuvvu cheppindhi nenu note chesa. Current EEG stress level: <strong>${stressVal}%</strong>. Badha padakunda koncham deep breath thesko, anni set aipothai! 🔥`;
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
        const lang = this.getLang();
        const resetMsgs = {
            teluglish: "Chat reset chesa raa mama! New conversation start chedham. Cheppu, em matladadham? 😊",
            en: "Chat reset successfully! Let's start a fresh conversation. What would you like to talk about? 😊",
            telugu: "చాట్ రీసెట్ చేయబడింది! కొత్త సంభాషణ ప్రారంభిద్దాం. ఏమి మాట్లాడదాం? 😊",
            hindi: "चैट रीसेट कर दी गई है! आइए एक नई बातचीत शुरू करें। आप किस बारे में बात करना चाहेंगे? 😊"
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

// Global Āpta AI instance
const aptaAI = new AptaAIChatbot();
