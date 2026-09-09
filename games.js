/* ==========================================================================
   Udvegadarshini - 5 Stress Relief Mini-Games Engine
   ========================================================================== */

class StressReliefGames {
    constructor() {
        this.currentGame = 'bubble';

        // Bubble Popper state
        this.bubblePoppedCount = 0;

        // Zen Particle state
        this.zenCanvas = null;
        this.zenCtx = null;
        this.particles = [];
        this.mousePos = { x: 0, y: 0, active: false };
        this.zenAnim = null;

        // Sudoku state
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

        // Memory Match state
        this.memoryCards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;

        // Maze state
        this.mazeCanvas = null;
        this.mazeCtx = null;
        this.playerPos = { x: 0, y: 0 };
        this.mazeGrid = [
            [0,0,1,0,0,0,1,0,0,0],
            [1,0,1,0,1,0,1,0,1,0],
            [1,0,0,0,1,0,0,0,1,0],
            [1,1,1,0,1,1,1,0,1,0],
            [0,0,0,0,0,0,1,0,0,0],
            [0,1,1,1,1,0,1,1,1,0],
            [0,0,0,0,1,0,0,0,0,0],
            [1,1,1,0,1,1,1,1,1,0],
            [0,0,0,0,0,0,0,0,1,0],
            [0,1,1,1,1,1,1,0,0,0]
        ];
    }

    init() {
        this.initBubblePopper();
        this.initZenSandbox();
        this.initSudoku();
        this.initMemoryMatch();
        this.initCalmMaze();

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

        if (gameKey === 'maze') {
            this.drawMaze();
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
       2. GAME 2: ZEN PARTICLE FLUID SANDBOX
       ---------------------------------------------------------------------- */
    initZenSandbox() {
        this.zenCanvas = document.getElementById('zenCanvas');
        if (!this.zenCanvas) return;

        this.zenCtx = this.zenCanvas.getContext('2d');
        this.resizeZenCanvas();
        window.addEventListener('resize', () => this.resizeZenCanvas());

        // Mouse & Touch events
        const updatePos = (e) => {
            const rect = this.zenCanvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            this.mousePos.x = clientX - rect.left;
            this.mousePos.y = clientY - rect.top;
            this.mousePos.active = true;
        };

        this.zenCanvas.addEventListener('mousemove', updatePos);
        this.zenCanvas.addEventListener('touchmove', updatePos);
        this.zenCanvas.addEventListener('mouseleave', () => this.mousePos.active = false);

        // Create 80 particles
        this.particles = [];
        for (let i = 0; i < 80; i++) {
            this.particles.push({
                x: Math.random() * this.zenCanvas.width,
                y: Math.random() * this.zenCanvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 4 + 2,
                color: `hsl(${Math.random() * 60 + 170}, 80%, 65%)`
            });
        }

        const clearBtn = document.getElementById('btnClearZen');
        if (clearBtn) {
            clearBtn.onclick = () => this.initZenSandbox();
        }
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
            if (!this.zenCtx) return;
            this.zenAnim = requestAnimationFrame(loop);

            // Trailing fade effect
            this.zenCtx.fillStyle = 'rgba(9, 13, 22, 0.15)';
            this.zenCtx.fillRect(0, 0, this.zenCanvas.width, this.zenCanvas.height);

            this.particles.forEach(p => {
                // Attract to mouse if active
                if (this.mousePos.active) {
                    const dx = this.mousePos.x - p.x;
                    const dy = this.mousePos.y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 180) {
                        p.vx += (dx / dist) * 0.2;
                        p.vy += (dy / dist) * 0.2;
                    }
                }

                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.98;
                p.vy *= 0.98;

                // Bounce walls
                if (p.x < 0 || p.x > this.zenCanvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > this.zenCanvas.height) p.vy *= -1;

                this.zenCtx.beginPath();
                this.zenCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.zenCtx.fillStyle = p.color;
                this.zenCtx.fill();
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
       5. GAME 5: CALM MAZE NAVIGATOR
       ---------------------------------------------------------------------- */
    initCalmMaze() {
        this.mazeCanvas = document.getElementById('mazeCanvas');
        if (!this.mazeCanvas) return;

        this.mazeCtx = this.mazeCanvas.getContext('2d');
        this.playerPos = { x: 0, y: 0 };
        this.drawMaze();

        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (this.currentGame !== 'maze') return;
            if (e.key === 'ArrowUp') this.moveMaze(0, -1);
            if (e.key === 'ArrowDown') this.moveMaze(0, 1);
            if (e.key === 'ArrowLeft') this.moveMaze(-1, 0);
            if (e.key === 'ArrowRight') this.moveMaze(1, 0);
        });

        // D-Pad Buttons
        document.getElementById('btnMazeUp').onclick = () => this.moveMaze(0, -1);
        document.getElementById('btnMazeDown').onclick = () => this.moveMaze(0, 1);
        document.getElementById('btnMazeLeft').onclick = () => this.moveMaze(-1, 0);
        document.getElementById('btnMazeRight').onclick = () => this.moveMaze(1, 0);

        const newBtn = document.getElementById('btnNewMaze');
        if (newBtn) newBtn.onclick = () => this.initCalmMaze();
    }

    moveMaze(dx, dy) {
        const nx = this.playerPos.x + dx;
        const ny = this.playerPos.y + dy;

        if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10 && this.mazeGrid[ny][nx] === 0) {
            this.playerPos.x = nx;
            this.playerPos.y = ny;
            this.drawMaze();

            // Check Win condition (bottom-right cell 9,9)
            if (nx === 9 && ny === 9) {
                setTimeout(() => alert('🎉 Great Job! Calm Maze Cleared! Mind Reset Complete.'), 100);
            }
        }
    }

    drawMaze() {
        if (!this.mazeCtx) return;
        const cellSize = 32;

        this.mazeCtx.clearRect(0, 0, 320, 320);

        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
                if (this.mazeGrid[r][c] === 1) {
                    this.mazeCtx.fillStyle = '#1e293b';
                    this.mazeCtx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                }
            }
        }

        // Draw Goal (9,9)
        this.mazeCtx.fillStyle = '#10b981';
        this.mazeCtx.fillRect(9 * cellSize + 4, 9 * cellSize + 4, cellSize - 8, cellSize - 8);

        // Draw Player Orb
        this.mazeCtx.beginPath();
        this.mazeCtx.arc(
            this.playerPos.x * cellSize + cellSize / 2,
            this.playerPos.y * cellSize + cellSize / 2,
            10, 0, Math.PI * 2
        );
        this.mazeCtx.fillStyle = '#06b6d4';
        this.mazeCtx.shadowBlur = 10;
        this.mazeCtx.shadowColor = '#06b6d4';
        this.mazeCtx.fill();
        this.mazeCtx.shadowBlur = 0;
    }
}

// Global Games instance
const stressGames = new StressReliefGames();
