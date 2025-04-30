const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
let gameMode = ''; // 'single' or 'multi'
let isMuted = false;
let highContrast = false;
let difficulty = 'medium'; // 'easy', 'medium', 'hard'
let resetScoresOnRestart = true; // Setting for score reset
let lastTouchTime = 0; // For touch debouncing

// Game constants
const GRID_SIZE = 3;
const CELL_SIZE = 100;
const LINE_WIDTH = 5;
const TOUCH_DEBOUNCE_MS = 200;
const LOADING_TIMEOUT_MS = 5000;

// Game state
const gameState = {
    board: Array(GRID_SIZE * GRID_SIZE).fill(null),
    currentPlayer: 'X',
    gameOver: false,
    winner: null,
    xWins: parseInt(localStorage.getItem('xWins') || '0'),
    oWins: parseInt(localStorage.getItem('oWins') || '0'),
    draws: parseInt(localStorage.getItem('draws') || '0')
};

// Difficulty settings
const DIFFICULTY_SETTINGS = {
    easy: { aiMistakeChance: 0.5 },
    medium: { aiMistakeChance: 0.2 },
    hard: { aiMistakeChance: 0 }
};

// Sound effects (commented out external URLs; host locally if needed)
/*
const sounds = {
    move: new Audio('sounds/move.mp3'), // Host locally, e.g., in games/tic-tac-toe/sounds/
    win: new Audio('sounds/win.mp3'),
    draw: new Audio('sounds/draw.mp3')
};
*/
const sounds = {}; // Fallback: no sounds until hosted locally

Object.values(sounds).forEach(sound => {
    sound.onerror = () => console.warn('Failed to load audio:', sound.src);
});

// Hide canvas and game
canvas.style.display = 'none';
document.getElementById('game').style.display = 'none';
const loadingDiv = document.getElementById('loading');

// Responsive canvas
function resizeCanvas() {
    const maxSize = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.8, 400);
    canvas.width = maxSize;
    canvas.height = maxSize;
    if (ctx) drawBoard();
}

// Draw functions
function drawBoard() {
    if (!ctx) {
        console.warn('Canvas context not available');
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = highContrast ? '#fff' : '#00ff88';
    ctx.lineWidth = LINE_WIDTH;

    const cellSize = canvas.width / GRID_SIZE;
    for (let i = 1; i < GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
    }

    gameState.board.forEach((cell, index) => {
        if (cell) {
            const row = Math.floor(index / GRID_SIZE);
            const col = index % GRID_SIZE;
            const x = col * cellSize + cellSize / 2;
            const y = row * cellSize + cellSize / 2;
            ctx.font = `${cellSize * 0.6}px 'Courier New'`;
            ctx.fillStyle = highContrast ? '#fff' : '#00ff88';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cell, x, y);
        }
    });

    if (gameState.winner && gameState.winner !== 'Draw') {
        const winningCombo = getWinningCombo();
        if (winningCombo) {
            ctx.strokeStyle = highContrast ? '#fff' : '#00ff88';
            ctx.lineWidth = LINE_WIDTH * 2;
            ctx.beginPath();
            const startCell = winningCombo[0];
            const endCell = winningCombo[2];
            const startX = (startCell % GRID_SIZE) * cellSize + cellSize / 2;
            const startY = Math.floor(startCell / GRID_SIZE) * cellSize + cellSize / 2;
            const endX = (endCell % GRID_SIZE) * cellSize + cellSize / 2;
            const endY = Math.floor(endCell / GRID_SIZE) * cellSize + cellSize / 2;
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }
}

// Game logic
function makeMove(index) {
    try {
        if (gameState.board[index] || gameState.gameOver) return;
        gameState.board[index] = gameState.currentPlayer;
        if (!isMuted && sounds.move) sounds.move.play();
        checkGameOver();
        if (!gameState.gameOver) {
            gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
            if (gameMode === 'single' && gameState.currentPlayer === 'O' && !gameState.gameOver) {
                setTimeout(makeAIMove, 500);
            }
        }
        drawBoard();
        updateScoreboard();
    } catch (err) {
        console.error('Error in makeMove:', err);
    }
}

function makeAIMove() {
    try {
        let move = -1;
        if (Math.random() < DIFFICULTY_SETTINGS[difficulty].aiMistakeChance) {
            const emptyCells = gameState.board.map((cell, i) => cell ? null : i).filter(i => i !== null);
            move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        } else {
            move = minimax(gameState.board, 'O').index;
        }
        if (move !== -1) makeMove(move);
    } catch (err) {
        console.error('Error in makeAIMove:', err);
    }
}

function minimax(board, player) {
    const winner = checkWinner(board);
    if (winner === 'O') return { score: 10 };
    if (winner === 'X') return { score: -10 };
    if (!board.includes(null)) return { score: 0 };

    const moves = [];
    board.forEach((cell, i) => {
        if (!cell) {
            const newBoard = [...board];
            newBoard[i] = player;
            const result = minimax(newBoard, player === 'X' ? 'O' : 'X');
            moves.push({ index: i, score: result.score });
        }
    });

    let bestMove;
    if (player === 'O') {
        let bestScore = -Infinity;
        moves.forEach(move => {
            if (move.score > bestScore) {
                bestScore = move.score;
                bestMove = move;
            }
        });
    } else {
        let bestScore = Infinity;
        moves.forEach(move => {
            if (move.score < bestScore) {
                bestScore = move.score;
                bestMove = move;
            }
        });
    }
    return bestMove || { index: -1, score: 0 };
}

function checkWinner(board) {
    const combos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (const combo of combos) {
        if (board[combo[0]] && board[combo[0]] === board[combo[1]] && board[combo[1]] === board[combo[2]]) {
            return board[combo[0]];
        }
    }
    return board.includes(null) ? null : 'Draw';
}

function getWinningCombo() {
    const combos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (const combo of combos) {
        if (gameState.board[combo[0]] && gameState.board[combo[0]] === gameState.board[combo[1]] && gameState.board[combo[1]] === gameState.board[combo[2]]) {
            return combo;
        }
    }
    return null;
}

function checkGameOver() {
    try {
        gameState.winner = checkWinner(gameState.board);
        if (gameState.winner) {
            gameState.gameOver = true;
            document.getElementById('game-over').style.display = 'block';
            document.getElementById('winner-text').textContent = gameState.winner === 'Draw' ? 'Draw!' : `${gameState.winner} Wins!`;
            if (gameState.winner === 'X') {
                gameState.xWins++;
                localStorage.setItem('xWins', gameState.xWins);
            } else if (gameState.winner === 'O') {
                gameState.oWins++;
                localStorage.setItem('oWins', gameState.oWins);
            } else {
                gameState.draws++;
                localStorage.setItem('draws', gameState.draws);
            }
            if (!isMuted && sounds[gameState.winner === 'Draw' ? 'draw' : 'win']) {
                sounds[gameState.winner === 'Draw' ? 'draw' : 'win'].play();
            }
            updateScoreboard();
        }
    } catch (err) {
        console.error('Error in checkGameOver:', err);
    }
}

function updateScoreboard() {
    document.getElementById('xWins').textContent = gameState.xWins;
    document.getElementById('oWins').textContent = gameState.oWins;
    document.getElementById('draws').textContent = gameState.draws;
}

// Input handling
canvas.addEventListener('click', (e) => {
    if (gameState.gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const col = Math.floor(x / (canvas.width / GRID_SIZE));
    const row = Math.floor(y / (canvas.height / GRID_SIZE));
    const index = row * GRID_SIZE + col;
    if (index >= 0 && index < GRID_SIZE * GRID_SIZE) {
        makeMove(index);
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastTouchTime < TOUCH_DEBOUNCE_MS) return;
    lastTouchTime = now;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
    const col = Math.floor(x / (canvas.width / GRID_SIZE));
    const row = Math.floor(y / (canvas.height / GRID_SIZE));
    const index = row * GRID_SIZE + col;
    if (index >= 0 && index < GRID_SIZE * GRID_SIZE) {
        makeMove(index);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && gameState.gameOver) {
        restartGame();
    }
});

// Button listeners
document.getElementById('singlePlayerBtn').addEventListener('click', () => {
    gameMode = 'single';
    startGame();
});

document.getElementById('multiPlayerBtn').addEventListener('click', () => {
    gameMode = 'multi';
    startGame();
});

document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('settings').style.display = 'block';
});

document.getElementById('instructionsBtn').addEventListener('click', () => {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('instructions').style.display = 'block';
});

document.getElementById('backBtn').addEventListener('click', () => {
    document.getElementById('settings').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
});

document.getElementById('backInstructionsBtn').addEventListener('click', () => {
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
});

document.getElementById('muteBtn').addEventListener('click', () => {
    isMuted = !isMuted;
    Object.values(sounds).forEach(sound => sound.muted = isMuted);
    document.getElementById('muteBtn').textContent = isMuted ? 'Unmute' : 'Mute';
});

document.getElementById('highContrastBtn').addEventListener('click', () => {
    highContrast = !highContrast;
    document.body.classList.toggle('high-contrast');
    document.getElementById('highContrastBtn').textContent = `High Contrast: ${highContrast ? 'On' : 'Off'}`;
    drawBoard();
});

document.getElementById('difficultyBtn').addEventListener('click', () => {
    const levels = ['easy', 'medium', 'hard'];
    const currentIndex = levels.indexOf(difficulty);
    difficulty = levels[(currentIndex + 1) % levels.length];
    document.getElementById('difficultyBtn').textContent = `Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
});

document.getElementById('resetScoresBtn').addEventListener('click', () => {
    resetScoresOnRestart = !resetScoresOnRestart;
    document.getElementById('resetScoresBtn').textContent = `Reset Scores on Restart: ${resetScoresOnRestart ? 'On' : 'Off'}`;
});

document.getElementById('clearScoresBtn').addEventListener('click', () => {
    gameState.xWins = 0;
    gameState.oWins = 0;
    gameState.draws = 0;
    localStorage.setItem('xWins', '0');
    localStorage.setItem('oWins', '0');
    localStorage.setItem('draws', '0');
    updateScoreboard();
    document.getElementById('scoreboard').classList.add('reset');
    setTimeout(() => document.getElementById('scoreboard').classList.remove('reset'), 500);
});

document.getElementById('restartBtn').addEventListener('click', () => {
    restartGame();
});

document.getElementById('menuBtn').addEventListener('click', () => {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    canvas.style.display = 'none';
    gameState.gameOver = true;
});

function startGame() {
    console.log('Starting game:', gameMode);
    document.getElementById('menu').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    canvas.style.display = 'block';
    resizeCanvas();
    resetGame();
    drawBoard();
    updateScoreboard();
}

function resetGame() {
    gameState.board = Array(GRID_SIZE * GRID_SIZE).fill(null);
    gameState.currentPlayer = 'X';
    gameState.gameOver = false;
    gameState.winner = null;
    document.getElementById('game-over').style.display = 'none';
    if (resetScoresOnRestart) {
        gameState.xWins = 0;
        gameState.oWins = 0;
        gameState.draws = 0;
        localStorage.setItem('xWins', '0');
        localStorage.setItem('oWins', '0');
        localStorage.setItem('draws', '0');
        document.getElementById('scoreboard').classList.add('reset');
        setTimeout(() => document.getElementById('scoreboard').classList.remove('reset'), 500);
    }
    updateScoreboard();
}

function restartGame() {
    console.log('Restarting game');
    resetGame();
    drawBoard();
}

// Preload assets and initialize
console.log('Initializing game');
Promise.all(Object.values(sounds).map(sound => new Promise(resolve => {
    sound.oncanplaythrough = resolve;
    sound.onerror = resolve;
}))).then(() => {
    console.log('Assets loaded');
    loadingDiv.style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    resizeCanvas();
}).catch(err => {
    console.warn('Asset loading failed:', err);
    loadingDiv.style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    resizeCanvas();
});

// Fallback timeout for loading screen
setTimeout(() => {
    if (loadingDiv.style.display !== 'none') {
        console.warn('Loading timeout triggered');
        loadingDiv.style.display = 'none';
        document.getElementById('menu').style.display = 'block';
        resizeCanvas();
    }
}, LOADING_TIMEOUT_MS);

// Event listeners for responsiveness
window.addEventListener('resize', () => {
    resizeCanvas();
});
window.addEventListener('orientationchange', () => {
    resizeCanvas();
});
