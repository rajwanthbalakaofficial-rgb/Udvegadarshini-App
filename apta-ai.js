/* ==========================================================================
   Udvegadarshini - Āpta AI (आप्त AI) Empathetic Teluglish Chatbot Engine
   ========================================================================== */

class AptaAIChatbot {
    constructor() {
        this.messagesBox = null;
        this.syncedStressVal = 0;
        this.lastTriggeredTime = 0;
    }

    init() {
        this.messagesBox = document.getElementById('chatMessagesBox');
    }

    updateStressSync(stressVal) {
        this.syncedStressVal = stressVal;
        const syncEl = document.getElementById('aptaSyncedStress');
        if (syncEl) {
            syncEl.textContent = `${Math.round(stressVal)}%`;
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

        // Append message from Āpta AI
        this.appendMessage('apta', `
            <strong>Arrey mama! Alert raa! 🚨</strong><br>
            Nenu Āpta AI (आप्त AI) monitor chesthunna, mana ESP32 EEG reading lo stress score <strong>${Math.round(stressVal)}%</strong> (High Stress) reach aindi raa! 
            <br><br>
            Badha padaku mama, nenu unnanu ga! 🌿 Immediately 432Hz Sound Therapy ON chesi, 4-7-8 Breathing Guide start cheyyi. Emaina mental pressure undhi ante nakku cheppu, matladatha!
        `);
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
        let userMsg = "";
        let aptaReply = "";

        switch (moodKey) {
            case 'feeling-stressed':
                userMsg = "Macha, ekkuva stress gaa undhi raa!";
                aptaReply = "Arrey badha padaku mama! 🤗 Workload or pressure ekkuva inattundi. Okka 5 mins relax avvu! Sound Therapy tab lo **432 Hz Miracle Tone** pettu leda mana **Bubble Wrap Popper** game aadu. Stress jorru ga thaggipothundi!";
                break;
            case 'feeling-sad':
                userMsg = "Koncham badha gaa undhi raa...";
                aptaReply = "Aww raa mama... Nenu unnanu ga, cheppu emaindi? 💙 Sometime thoughts overweight aithe mind heavy anipisthundhi. Chinna walk vesukoni, mana **528 Hz Transformation Tone** vinu. Life lo anni solve avuthai raa!";
                break;
            case 'need-focus':
                userMsg = "Focus ravadam ledhu raa, mind wander avuthundi.";
                aptaReply = "Naaku ardham ayyindi raa! Brain Theta waves lo ki vellindochu. Nuvvu ventane **Sudoku Focus Puzzle** aadu or **10 Hz Alpha Binaural Beats** ON cheyyi. 10 mins lo focus back vasthundhi!";
                break;
            case 'feeling-good':
                userMsg = "Cool gaa unnanu eeroju!";
                aptaReply = "Semma raa mama! 🎉 Mass mood lo unnav! EEG readings lo kooda Alpha waves super high gaa unnai. Ila ge relaxed & happy gaa undu, rock it!";
                break;
        }

        this.appendMessage('user', userMsg);
        setTimeout(() => {
            this.appendMessage('apta', aptaReply);
        }, 600);
    }

    generateResponse(input) {
        const stressVal = Math.round(this.syncedStressVal);

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

        // Default friendly Teluglish fallback response
        return `Aha, kachithanga raa mama! 🧠✨ Nuvvu cheppindhi nenu note chesa. Current EEG stress level: <strong>${stressVal}%</strong>. Badha padakunda koncham deep breath thesko, anni set aipothai! 🔥`;
    }

    appendMessage(sender, htmlText) {
        if (!this.messagesBox) this.init();

        const bubble = document.createElement('div');
        bubble.className = `chat-bubble bubble-${sender}`;

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const name = sender === 'apta' ? 'Āpta AI (आप्त AI)' : 'You (Bestie)';

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
        if (this.messagesBox) {
            this.messagesBox.innerHTML = `
                <div class="chat-bubble bubble-apta">
                    <div class="bubble-header">
                        <span class="speaker-name">Āpta AI</span>
                        <span class="bubble-time">Just now</span>
                    </div>
                    <div class="bubble-text">
                        Chat reset chesa raa mama! New conversation start chedham. Cheppu, em matladadham? 😊
                    </div>
                </div>
            `;
        }
    }
}

// Global Āpta AI instance
const aptaAI = new AptaAIChatbot();
