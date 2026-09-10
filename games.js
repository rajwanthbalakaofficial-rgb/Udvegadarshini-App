/* ==========================================================================
   Udvegadarshini - 5 Stress Relief Mini-Games Engine
   ========================================================================== */

class StressReliefGames {
    constructor() {
        this.currentGame = 'bubble';

        // 1. Bubble Popper state
        this.bubblePoppedCount = 0;

        // 2. Arrow Logic Flow Puzzle state
        this.arrowGrid = [
            [0, 90, 180, 270],
            [90, 180, 270, 0],
            [180, 270, 0, 90],
            [270, 0, 90, 180]
        ];
        this.arrowLevel = 1;
        this.arrowMoves = 0;

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
        this.initArrowPuzzle();
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
       2. GAME 2: ARROW LOGIC FLOW PUZZLE (NEW ADDICTIVE PUZZLE)
       ---------------------------------------------------------------------- */
    initArrowPuzzle() {
        const container = document.getElementById('arrowGrid');
        if (!container) return;

        const angles = [0, 90, 180, 270];
        this.arrowMoves = 0;
        this.updateArrowStats();

        // Create 4x4 randomized arrow angles
        this.arrowGrid = [];
        for (let r = 0; r < 4; r++) {
            const row = [];
            for (let c = 0; c < 4; c++) {
                row.push(angles[Math.floor(Math.random() * angles.length)]);
            }
            this.arrowGrid.push(row);
        }

        this.renderArrowGrid();
        this.checkArrowConnections();

        const btnNew = document.getElementById('btnNewArrow');
        if (btnNew) {
            btnNew.onclick = () => this.initArrowPuzzle();
        }
    }

    renderArrowGrid() {
        const container = document.getElementById('arrowGrid');
        if (!container) return;

        container.innerHTML = '';
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const cell = document.createElement('div');
                cell.className = `arrow-cell ${r === 0 && c === 0 ? 'start-cell' : ''} ${r === 3 && c === 3 ? 'target-cell' : ''}`;
                cell.id = `arrow-${r}-${c}`;

                const angle = this.arrowGrid[r][c];

                // Arrow icon
                let badge = '';
                if (r === 0 && c === 0) badge = '<span class="badge-node">🟢</span>';
                if (r === 3 && c === 3) badge = '<span class="badge-node">🎯</span>';

                cell.innerHTML = `<i class="fa-solid fa-arrow-up" style="transform: rotate(${angle}deg); transition: transform 0.25s ease;"></i> ${badge}`;

                cell.addEventListener('click', () => {
                    this.rotateArrowTile(r, c);
                });

                container.appendChild(cell);
            }
        }
    }

    rotateArrowTile(r, c) {
        this.arrowGrid[r][c] = (this.arrowGrid[r][c] + 90) % 360;
        this.arrowMoves++;
        this.updateArrowStats();
        this.playTileClickSound();

        this.renderArrowGrid();
        this.checkArrowConnections();
    }

    checkArrowConnections() {
        // Trace energy flow starting at (0,0)
        const visited = new Set();
        let r = 0, c = 0;
        let path = [];

        while (r >= 0 && r < 4 && c >= 0 && c < 4) {
            const key = `${r}-${c}`;
            if (visited.has(key)) break; // loop detected
            visited.add(key);
            path.push({ r, c });

            const angle = this.arrowGrid[r][c];
            if (angle === 0) r--;        // Up
            else if (angle === 90) c++;  // Right
            else if (angle === 180) r++; // Down
            else if (angle === 270) c--; // Left
        }

        // Highlight connected path
        path.forEach(p => {
            const el = document.getElementById(`arrow-${p.r}-${p.c}`);
            if (el) el.classList.add('connected');
        });

        // Check if path reaches target (3,3)
        const reachedTarget = path.some(p => p.r === 3 && p.c === 3);
        if (reachedTarget) {
            this.playVictorySound();
            setTimeout(() => {
                alert(`🎉 Fantastic! Level ${this.arrowLevel} Connected in ${this.arrowMoves} Moves!`);
                this.arrowLevel++;
                this.initArrowPuzzle();
            }, 300);
        }
    }

    updateArrowStats() {
        const lvl = document.getElementById('arrowLevel');
        const mvs = document.getElementById('arrowMoves');
        if (lvl) lvl.textContent = this.arrowLevel;
        if (mvs) mvs.textContent = this.arrowMoves;
    }

    playTileClickSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } catch(e){}
    }

    playVictorySound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
        } catch(e){}
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
