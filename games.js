/* ==========================================================================
   Udvegadarshini - 5 Stress Relief Mini-Games Engine
   ========================================================================== */

class StressReliefGames {
    constructor() {
        this.currentGame = 'bubble';

        // 1. Bubble Popper state
        this.bubblePoppedCount = 0;

        // 2. Zen Ripple Pond state
        this.zenCanvas = null;
        this.zenCtx = null;
        this.ripples = [];
        this.petals = [];
        this.mousePos = { x: 0, y: 0, active: false };
        this.zenAnim = null;

        // 3. Sudoku state
        this.sudokuBoard = [
            [5,3,0,0,7,0,0,0,0],
            [6,0,0,1,9,5,0,0,0],
            [0,9,8,0,0,0,0,6,0],
            [8,0,0,0,6,0,0,0,3],
            [4,0,0,8,0,3,0,0,1],
            [7,0,0,0,2,0,0,0,6],
            [0,6,0,0,0,0,2,8,0],
            [0,0,0,4,1,9,0,0,5],
            [0,0,0,0,8,0,0,7,9]
        ];

        // 4. Memory Match state
        this.memoryCards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;

        // 5. 2048 Mind Merge state
        this.grid2048 = [
            [0,0,0,0],
            [0,0,0,0],
            [0,0,0,0],
            [0,0,0,0]
        ];
        this.score2048 = 0;
        this.best2048 = 0;
        this.touchStart2048 = { x: 0, y: 0 };
    }

    init() {
        this.initBubblePopper();
        this.initZenSandbox();
        this.initSudoku();
        this.initMemoryMatch();
        this.init2048();

        this.bindGameSelectors();
    }

    bindGameSelectors() {
        const btns = document.querySelectorAll('.btn-game-select');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const gameKey = btn.dataset.game;
                this.switchGame(gameKey);
            });
        });
    }

    switchGame(gameKey) {
        this.currentGame = gameKey;
        const panels = document.querySelectorAll('.game-panel');
        panels.forEach(p => p.classList.remove('active'));

        const targetPanel = document.getElementById(`game-${gameKey}`);
        if (targetPanel) targetPanel.classList.add('active');

        if (gameKey === 'zen') {
            this.startZenAnimation();
        } else {
            this.stopZenAnimation();
        }
    }

    /* ----------------------------------------------------------------------
       1. GAME 1: BUBBLE WRAP POPPER
       ---------------------------------------------------------------------- */
    initBubblePopper() {
        const grid = document.getElementById('bubbleGrid');
        if (!grid) return;

        grid.innerHTML = '';
        this.bubblePoppedCount = 0;
        this.updateBubbleScore();

        for (let i = 0; i < 60; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'bubble-cell';
            bubble.addEventListener('click', () => {
                if (!bubble.classList.contains('popped')) {
                    bubble.classList.add('popped');
                    this.bubblePoppedCount++;
                    this.updateBubbleScore();
                    this.playPopSound();
                }
            });
            grid.appendChild(bubble);
        }

        const resetBtn = document.getElementById('btnResetBubble');
        if (resetBtn) {
            resetBtn.onclick = () => this.initBubblePopper();
        }
    }

    updateBubbleScore() {
        const scoreEl = document.getElementById('bubbleScore');
        if (scoreEl) scoreEl.textContent = this.bubblePoppedCount;
    }

    playPopSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400 + Math.random() * 200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } catch(e){}
    }

    /* ----------------------------------------------------------------------
       2. GAME 2: ZEN RIPPLE POND & LOTUS FLOW (NEW INTERACTIVE WATER)
       ---------------------------------------------------------------------- */
    initZenSandbox() {
        this.zenCanvas = document.getElementById('zenCanvas');
        if (!this.zenCanvas) return;

        this.zenCtx = this.zenCanvas.getContext('2d');
        this.resizeZenCanvas();
        window.addEventListener('resize', () => this.resizeZenCanvas());

        this.ripples = [];
        this.petals = [];

        // Spawn 14 floating lotus petals
        for (let i = 0; i < 14; i++) {
            this.petals.push({
                x: Math.random() * (this.zenCanvas.width || 300),
                y: Math.random() * (this.zenCanvas.height || 300),
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 8 + 12,
                color: i % 2 === 0 ? '#06b6d4' : '#a855f7',
                angle: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.02
            });
        }

        const handleTouch = (e) => {
            const rect = this.zenCanvas.getBoundingClientRect();
            const touches = e.touches || [e];
            for (let i = 0; i < touches.length; i++) {
                const x = touches[i].clientX - rect.left;
                const y = touches[i].clientY - rect.top;
                this.addZenRipple(x, y);
            }
        };

        this.zenCanvas.onpointerdown = (e) => handleTouch(e);
        this.zenCanvas.onpointermove = (e) => {
            if (e.buttons > 0) handleTouch(e);
        };

        const clearBtn = document.getElementById('btnClearZen');
        if (clearBtn) {
            clearBtn.onclick = () => this.initZenSandbox();
        }
    }

    addZenRipple(x, y) {
        this.ripples.push({
            x: x,
            y: y,
            radius: 2,
            maxRadius: 80 + Math.random() * 40,
            alpha: 1.0,
            color: `hsl(${180 + Math.random() * 60}, 90%, 60%)`
        });
        if (this.ripples.length > 25) this.ripples.shift();

        // Push nearby petals
        this.petals.forEach(p => {
            const dx = p.x - x;
            const dy = p.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100 && dist > 1) {
                p.vx += (dx / dist) * 1.5;
                p.vy += (dy / dist) * 1.5;
            }
        });

        this.playWaterDropSound();
    }

    playWaterDropSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600 + Math.random() * 300, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.12);

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.12);
        } catch(e){}
    }

    resizeZenCanvas() {
        if (this.zenCanvas && this.zenCanvas.parentElement) {
            this.zenCanvas.width = this.zenCanvas.parentElement.clientWidth;
            this.zenCanvas.height = this.zenCanvas.parentElement.clientHeight;
        }
    }

    startZenAnimation() {
        this.stopZenAnimation();
        const loop = () => {
            if (!this.zenCtx || !this.zenCanvas) return;
            this.zenAnim = requestAnimationFrame(loop);

            const w = this.zenCanvas.width;
            const h = this.zenCanvas.height;

            // Deep fluid dark background
            this.zenCtx.fillStyle = 'rgba(8, 11, 20, 0.25)';
            this.zenCtx.fillRect(0, 0, w, h);

            // Draw & update concentric ripples
            for (let i = this.ripples.length - 1; i >= 0; i--) {
                const r = this.ripples[i];
                r.radius += 2.2;
                r.alpha -= 0.02;

                if (r.alpha <= 0 || r.radius >= r.maxRadius) {
                    this.ripples.splice(i, 1);
                    continue;
                }

                this.zenCtx.beginPath();
                this.zenCtx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
                this.zenCtx.strokeStyle = r.color;
                this.zenCtx.globalAlpha = r.alpha;
                this.zenCtx.lineWidth = 2.5;
                this.zenCtx.shadowBlur = 12;
                this.zenCtx.shadowColor = r.color;
                this.zenCtx.stroke();
                this.zenCtx.globalAlpha = 1.0;
                this.zenCtx.shadowBlur = 0;
            }

            // Draw & update floating lotus petals
            this.petals.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.angle += p.spin;

                p.vx *= 0.96;
                p.vy *= 0.96;

                if (p.x < 10) p.x = w - 10;
                if (p.x > w - 10) p.x = 10;
                if (p.y < 10) p.y = h - 10;
                if (p.y > h - 10) p.y = 10;

                this.zenCtx.save();
                this.zenCtx.translate(p.x, p.y);
                this.zenCtx.rotate(p.angle);
                this.zenCtx.fillStyle = p.color;
                this.zenCtx.shadowBlur = 10;
                this.zenCtx.shadowColor = p.color;

                // Draw lotus petal shape
                this.zenCtx.beginPath();
                this.zenCtx.ellipse(0, 0, p.radius, p.radius * 0.5, 0, 0, Math.PI * 2);
                this.zenCtx.fill();
                this.zenCtx.restore();
            });
        };
        loop();
    }

    stopZenAnimation() {
        if (this.zenAnim) cancelAnimationFrame(this.zenAnim);
    }

    /* ----------------------------------------------------------------------
       3. GAME 3: SUDOKU FOCUS PUZZLE
       ---------------------------------------------------------------------- */
    initSudoku() {
        const container = document.getElementById('sudokuContainer');
        if (!container) return;

        container.innerHTML = '';
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const val = this.sudokuBoard[r][c];
                const input = document.createElement('input');
                input.className = 'sudoku-cell';
                input.type = 'text';
                input.maxLength = 1;

                if (val !== 0) {
                    input.value = val;
                    input.readOnly = true;
                    input.style.color = '#06b6d4';
                }

                container.appendChild(input);
            }
        }

        const newBtn = document.getElementById('btnNewSudoku');
        if (newBtn) {
            newBtn.onclick = () => this.initSudoku();
        }
    }

    /* ----------------------------------------------------------------------
       4. GAME 4: MEMORY PATTERN HARMONIZER
       ---------------------------------------------------------------------- */
    initMemoryMatch() {
        const grid = document.getElementById('memoryGrid');
        if (!grid) return;

        grid.innerHTML = '';
        this.flippedCards = [];
        this.matchedPairs = 0;
        document.getElementById('memoryMatches').textContent = `0 / 6`;

        const emojis = ['🧠', '🌿', '🧘', '🌊', '☯️', '☀️'];
        const deck = [...emojis, ...emojis].sort(() => Math.random() - 0.5);

        deck.forEach((emoji, idx) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.emoji = emoji;
            card.dataset.id = idx;
            card.textContent = '❓';

            card.addEventListener('click', () => this.handleMemoryClick(card));
            grid.appendChild(card);
        });

        const resetBtn = document.getElementById('btnResetMemory');
        if (resetBtn) {
            resetBtn.onclick = () => this.initMemoryMatch();
        }
    }

    handleMemoryClick(card) {
        if (this.flippedCards.length >= 2 || card.classList.contains('flipped') || card.classList.contains('matched')) return;

        card.classList.add('flipped');
        card.textContent = card.dataset.emoji;
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            const [c1, c2] = this.flippedCards;
            if (c1.dataset.emoji === c2.dataset.emoji) {
                c1.classList.add('matched');
                c2.classList.add('matched');
                this.matchedPairs++;
                document.getElementById('memoryMatches').textContent = `${this.matchedPairs} / 6`;
                this.flippedCards = [];
            } else {
                setTimeout(() => {
                    c1.classList.remove('flipped');
                    c2.classList.remove('flipped');
                    c1.textContent = '❓';
                    c2.textContent = '❓';
                    this.flippedCards = [];
                }, 800);
            }
        }
    }

    /* ----------------------------------------------------------------------
       5. GAME 5: 2048 MIND FOCUS MERGE (NEW ENGAGING GAME)
       ---------------------------------------------------------------------- */
    init2048() {
        const container = document.getElementById('grid2048');
        if (!container) return;

        this.grid2048 = [
            [0,0,0,0],
            [0,0,0,0],
            [0,0,0,0],
            [0,0,0,0]
        ];
        this.score2048 = 0;
        this.update2048Score();

        this.addRandom2048Tile();
        this.addRandom2048Tile();
        this.render2048();

        // Keyboard Controls
        window.addEventListener('keydown', (e) => {
            if (this.currentGame !== 'merge') return;
            if (e.key === 'ArrowUp') { e.preventDefault(); this.move2048('up'); }
            if (e.key === 'ArrowDown') { e.preventDefault(); this.move2048('down'); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); this.move2048('left'); }
            if (e.key === 'ArrowRight') { e.preventDefault(); this.move2048('right'); }
        });

        // D-Pad Controls
        const bUp = document.getElementById('btn2048Up');
        const bDown = document.getElementById('btn2048Down');
        const bLeft = document.getElementById('btn2048Left');
        const bRight = document.getElementById('btn2048Right');

        if (bUp) bUp.onclick = () => this.move2048('up');
        if (bDown) bDown.onclick = () => this.move2048('down');
        if (bLeft) bLeft.onclick = () => this.move2048('left');
        if (bRight) bRight.onclick = () => this.move2048('right');

        // Touch Swiping on Grid
        container.ontouchstart = (e) => {
            this.touchStart2048.x = e.touches[0].clientX;
            this.touchStart2048.y = e.touches[0].clientY;
        };

        container.ontouchend = (e) => {
            if (this.currentGame !== 'merge') return;
            const dx = e.changedTouches[0].clientX - this.touchStart2048.x;
            const dy = e.changedTouches[0].clientY - this.touchStart2048.y;

            if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.move2048(dx > 0 ? 'right' : 'left');
                } else {
                    this.move2048(dy > 0 ? 'down' : 'up');
                }
            }
        };

        const resetBtn = document.getElementById('btnReset2048');
        if (resetBtn) resetBtn.onclick = () => this.init2048();
    }

    addRandom2048Tile() {
        const emptyCells = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.grid2048[r][c] === 0) emptyCells.push({ r, c });
            }
        }
        if (emptyCells.length > 0) {
            const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid2048[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    render2048() {
        const container = document.getElementById('grid2048');
        if (!container) return;

        container.innerHTML = '';
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const val = this.grid2048[r][c];
                const tile = document.createElement('div');
                tile.className = `tile-2048 ${val > 0 ? 'tile-' + val : ''}`;
                tile.textContent = val > 0 ? val : '';
                container.appendChild(tile);
            }
        }
    }

    move2048(dir) {
        let moved = false;
        let scoreGained = 0;

        const slideRow = (row) => {
            let arr = row.filter(val => val !== 0);
            for (let i = 0; i < arr.length - 1; i++) {
                if (arr[i] === arr[i + 1]) {
                    arr[i] *= 2;
                    scoreGained += arr[i];
                    arr[i + 1] = 0;
                }
            }
            arr = arr.filter(val => val !== 0);
            while (arr.length < 4) arr.push(0);
            return arr;
        };

        if (dir === 'left') {
            for (let r = 0; r < 4; r++) {
                const orig = [...this.grid2048[r]];
                this.grid2048[r] = slideRow(this.grid2048[r]);
                if (orig.join() !== this.grid2048[r].join()) moved = true;
            }
        } else if (dir === 'right') {
            for (let r = 0; r < 4; r++) {
                const orig = [...this.grid2048[r]];
                const reversed = [...this.grid2048[r]].reverse();
                this.grid2048[r] = slideRow(reversed).reverse();
                if (orig.join() !== this.grid2048[r].join()) moved = true;
            }
        } else if (dir === 'up') {
            for (let c = 0; c < 4; c++) {
                const orig = [this.grid2048[0][c], this.grid2048[1][c], this.grid2048[2][c], this.grid2048[3][c]];
                const res = slideRow(orig);
                for (let r = 0; r < 4; r++) this.grid2048[r][c] = res[r];
                if (orig.join() !== res.join()) moved = true;
            }
        } else if (dir === 'down') {
            for (let c = 0; c < 4; c++) {
                const orig = [this.grid2048[0][c], this.grid2048[1][c], this.grid2048[2][c], this.grid2048[3][c]];
                const res = slideRow([...orig].reverse()).reverse();
                for (let r = 0; r < 4; r++) this.grid2048[r][c] = res[r];
                if (orig.join() !== res.join()) moved = true;
            }
        }

        if (moved) {
            this.score2048 += scoreGained;
            if (this.score2048 > this.best2048) this.best2048 = this.score2048;
            this.update2048Score();
            this.addRandom2048Tile();
            this.render2048();
        }
    }

    update2048Score() {
        const sEl = document.getElementById('score2048');
        const bEl = document.getElementById('best2048');
        if (sEl) sEl.textContent = this.score2048;
        if (bEl) bEl.textContent = this.best2048;
    }
}

// Global Games instance
const stressGames = new StressReliefGames();
