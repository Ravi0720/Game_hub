const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
let gameMode = ''; // 'single', 'multi', 'online'
let isMuted = false;
let highContrast = false;
let difficulty = 'medium'; // 'easy', 'medium', 'hard'
let resetScoresOnRestart = true;
let lastTouchTime = 0;
let moveHistory = [];
let socket = null;
let roomCode = '';
let isThinking = false;

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

// Sound effects (host these locally in games/tic-tac-toe/sounds/)
const sounds = {
    move: new Audio('sounds/move.mp3'),
    win: new Audio('sounds/win.mp3'),
    draw: new Audio('sounds/draw.mp3'),
    bgm: new Audio('sounds/bgm.mp3')
};

Object.values(sounds).forEach(sound => {
    sound.onerror = () => console.warn('Failed to load audio:', sound.src);
    sound.loop = sound === sounds.bgm;
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

    if (isThinking) {
        ctx.fillStyle = highContrast ? '#fff' : '#00ff88';
        ctx.font = '20px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('AI Thinking...', canvas.width / 2, canvas.height - 20);
    }
}

// Game logic
function makeMove(index, isOnline = false) {
    try {
        if (gameState.board[index] || gameState.gameOver || (gameMode === 'online' && !isOnline)) return;
        gameState.board[index] = gameState.currentPlayer;
        if (!isMuted && sounds.move) sounds.move.play();
        const row = Math.floor(index / GRID_SIZE) + 1;
        const col = (index % GRID_SIZE) + 1;
        moveHistory.push(`${gameState.currentPlayer} placed at (${row}, ${col})`);
        updateMoveHistory();
        animateMove(index);
        checkGameOver();
        if (!gameState.gameOver) {
            gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
            if (gameMode === 'single' && gameState.currentPlayer === 'O' && !gameState.gameOver) {
                isThinking = true;
                drawBoard();
                setTimeout(makeAIMove, 500);
            } else if (gameMode === 'online') {
                socket.emit('move', { roomCode, index });
            }
        }
        drawBoard();
        updateScoreboard();
    } catch (err) {
        console.error('Error in makeMove:', err);
    }
}

function animateMove(index) {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    const cellSize = canvas.width / GRID_SIZE;
    const x = col * cellSize + cellSize / 2;
    const y = row * cellSize + cellSize / 2;
    ctx.fillStyle = highContrast ? '#fff' : '#00ff88';
    ctx.font = `${cellSize * 0.6}px 'Courier New'`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gameState.currentPlayer, x, y);
    ctx.canvas.classList.add('move-animation');
    setTimeout(() => ctx.canvas.classList.remove('move-animation'), 300);
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
        if (move !== -1) {
            makeMove(move);
        }
        isThinking = false;
        drawBoard();
    } catch (err) {
        console.error('Error in makeAIMove:', err);
        isThinking = false;
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
                if (gameState.winner !== 'Draw') createConfetti();
            } else if (gameState.winner === 'O') {
                gameState.oWins++;
                localStorage.setItem('oWins', gameState.oWins);
                if (gameState.winner !== 'Draw') createConfetti();
            } else {
                gameState.draws++;
                localStorage.setItem('draws', gameState.draws);
            }
            if (!isMuted && sounds[gameState.winner === 'Draw' ? 'draw' : 'win']) {
                sounds[gameState.winner === 'Draw' ? 'draw' : 'win'].play();
            }
            updateScoreboard();
            if (gameMode === 'online') {
                socket.emit('gameOver', { roomCode, winner: gameState.winner });
            }
        }
        document.getElementById('undoBtn').style.display = gameMode === 'multi' && moveHistory.length > 0 ? 'block' : 'none';
    } catch (err) {
        console.error('Error in checkGameOver:', err);
    }
}

function createConfetti() {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.animationDelay = `${Math.random() * 1}s`;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 2000);
    }
}

function updateScoreboard() {
    document.getElementById('xWins').textContent = gameState.xWins;
    document.getElementById('oWins').textContent = gameState.oWins;
    document.getElementById('draws').textContent = gameState.draws;
}

function updateMoveHistory() {
    const moveList = document.getElementById('moveList');
    moveList.innerHTML = '';
    moveHistory.forEach(move => {
        const li = document.createElement('li');
        li.textContent = move;
        moveList.appendChild(li);
    });
    moveList.scrollTop = moveList.scrollHeight;
}

function undoMove() {
    if (gameMode !== 'multi' || moveHistory.length === 0 || gameState.gameOver) return;
    const lastMove = moveHistory.pop();
    const index = parseInt(lastMove.match(/\((\d), (\d)\)/)[1]) * GRID_SIZE + parseInt(lastMove.match(/\((\d), (\d)\)/)[2]) - GRID_SIZE - 1;
    gameState.board[index] = null;
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    updateMoveHistory();
    drawBoard();
}

// Input handling
canvas.addEventListener('click', (e) => {
    if (gameState.gameOver || isThinking) return;
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
    if (gameState.gameOver || isThinking) return;
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
    if (gameState.gameOver && e.key === ' ') {
        restartGame();
    } else if (!gameState.gameOver && !isThinking && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        makeMove(index);
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

document.getElementById('onlinePlayerBtn').addEventListener('click', () => {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('online').style.display = 'block';
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

document.getElementById('backOnlineBtn').addEventListener('click', () => {
    document.getElementById('online').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
});

document.getElementById('muteBtn').addEventListener('click', () => {
    isMuted = !isMuted;
    Object.values(sounds).forEach(sound => sound.muted = isMuted);
    if (!isMuted && sounds.bgm) sounds.bgm.play();
    else if (isMuted && sounds.bgm) sounds.bgm.pause();
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

document.getElementById('undoBtn').addEventListener('click', () => {
    undoMove();
});

document.getElementById('menuBtn').addEventListener('click', () => {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    canvas.style.display = 'none';
    gameState.gameOver = true;
    if (gameMode === 'online' && socket) {
        socket.emit('leaveRoom', { roomCode });
        socket.disconnect();
    }
});

document.getElementById('backToHubBtn').addEventListener('click', () => {
    window.location.href = 'https://timep.netlify.app/';
});

document.getElementById('joinRoomBtn').addEventListener('click', () => {
    roomCode = document.getElementById('roomCode').value.trim().toUpperCase();
    if (roomCode.length === 6) {
        joinOnlineGame();
    } else {
        alert('Please enter a valid 6-character room code.');
    }
});

document.getElementById('createRoomBtn').addEventListener('click', () => {
    roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    joinOnlineGame();
});

function startGame() {
    console.log('Starting game:', gameMode);
    moveHistory = [];
    updateMoveHistory();
    document.getElementById('menu').style.display = 'none';
    document.getElementById('online').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    canvas.style.display = 'block';
    resizeCanvas();
    resetGame();
    drawBoard();
    updateScoreboard();
    if (!isMuted && sounds.bgm) sounds.bgm.play();
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
    moveHistory = [];
    updateMoveHistory();
}

function restartGame() {
    console.log('Restarting game');
    if (gameMode === 'online' && socket) {
        socket.emit('restartGame', { roomCode });
    }
    resetGame();
    drawBoard();
}

// WebSocket setup
function joinOnlineGame() {
    socket = io('https://your-websocket-server.com'); // Replace with your WebSocket server URL
    socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        socket.emit('joinRoom', { roomCode, player: socket.id });
    });

    socket.on('roomJoined', ({ roomCode: joinedRoom, playerSymbol }) => {
        console.log('Joined room:', joinedRoom, 'as', playerSymbol);
        gameMode = 'online';
        gameState.currentPlayer = playerSymbol;
        document.getElementById('roomCode').value = joinedRoom;
        startGame();
    });

    socket.on('move', ({ index, player }) => {
        if (player !== socket.id) {
            makeMove(index, true);
        }
    });

    socket.on('gameOver', ({ winner }) => {
        gameState.winner = winner;
        gameState.gameOver = true;
        document.getElementById('game-over').style.display = 'block';
        document.getElementById('winner-text').textContent = winner === 'Draw' ? 'Draw!' : `${winner} Wins!`;
        if (!isMuted && sounds[winner === 'Draw' ? 'draw' : 'win']) {
            sounds[winner === 'Draw' ? 'draw' : 'win'].play();
        }
        if (winner !== 'Draw') createConfetti();
    });

    socket.on('restartGame', () => {
        resetGame();
        drawBoard();
    });

    socket.on('error', ({ message }) => {
        alert(message);
        document.getElementById('online').style.display = 'none';
        document.getElementById('menu').style.display = 'block';
        socket.disconnect();
    });
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
