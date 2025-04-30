const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');
let gameMode = ''; // 'single' or 'multi'
let isMuted = false;
let highContrast = false;
let difficulty = 'medium'; // 'easy', 'medium', 'hard'

// Game constants
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_RADIUS = 8;
const PADDLE_SPEED = 8;
const BASE_BALL_SPEED = 7;
const MAX_SCORE = 5;
const PARTICLE_COUNT = 10;

// Difficulty settings
const DIFFICULTY_SETTINGS = {
    easy: { aiSpeed: 0.05, aiAccuracy: 0.6, ballSpeed: BASE_BALL_SPEED * 0.8 },
    medium: { aiSpeed: 0.1, aiAccuracy: 0.8, ballSpeed: BASE_BALL_SPEED },
    hard: { aiSpeed: 0.15, aiAccuracy: 0.95, ballSpeed: BASE_BALL_SPEED * 1.2 }
};

// Game state
const gameState = {
    leftScore: 0,
    rightScore: 0,
    isPaused: false,
    gameOver: false,
    lastScored: null
};

// Game objects
const leftPaddle = {
    x: 20,
    y: 0,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
    color: '#00ff88'
};

const rightPaddle = {
    x: 0,
    y: 0,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
    color: '#00ff88'
};

const ball = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    radius: BALL_RADIUS,
    color: '#00ff88',
    trail: [],
    speed: DIFFICULTY_SETTINGS[difficulty].ballSpeed
};

const particles = [];

// Sound effects with error handling
const sounds = {
    paddleHit: new Audio('https://cdn.pixabay.com/audio/2023/08/29/10-40-24-141_200x200.mp3'),
    score: new Audio('https://cdn.pixabay.com/audio/2023/09/01/14-42-21-391_200x200.mp3'),
    wallHit: new Audio('https://cdn.pixabay.com/audio/2023/09/01/14-41-49-468_200x200.mp3')
};

Object.values(sounds).forEach(sound => {
    sound.onerror = () => console.warn('Failed to load audio:', sound.src);
});

// Hide canvas and show loading
canvas.style.display = 'none';
const loadingDiv = document.getElementById('loading');

// Responsive canvas
function resizeCanvas() {
    const maxWidth = Math.min(window.innerWidth * 0.9, 800);
    const maxHeight = Math.min(window.innerHeight * 0.8, 400);
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    leftPaddle.x = 20;
    rightPaddle.x = canvas.width - PADDLE_WIDTH - 20;
    leftPaddle.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
    rightPaddle.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
}

// Draw functions
function drawPaddle(paddle) {
    ctx.fillStyle = highContrast ? '#fff' : paddle.color;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    // Draw trail
    ball.trail.forEach((pos, index) => {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, ball.radius * (1 - index / 3), 0, Math.PI * 2);
        ctx.fillStyle = highContrast ? `rgba(255, 255, 255, ${0.3 * (1 - index / 3)})` : `rgba(0, 255, 136, ${0.3 * (1 - index / 3)})`;
        ctx.fill();
        ctx.closePath();
    });

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = highContrast ? '#fff' : ball.color;
    ctx.fill();
    ctx.closePath();

    // Update trail
    ball.trail.unshift({ x: ball.x, y: ball.y });
    if (ball.trail.length > 3) ball.trail.pop();
}

function drawParticles() {
    particles.forEach((particle, index) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = highContrast ? `rgba(255, 255, 255, ${particle.alpha})` : `rgba(0, 255, 136, ${particle.alpha})`;
        ctx.fill();
        ctx.closePath();

        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.alpha -= 0.02;
        particle.radius -= 0.1;

        if (particle.alpha <= 0 || particle.radius <= 0) {
            particles.splice(index, 1);
        }
    });
}

function drawScores() {
    ctx.font = '32px "Courier New"';
    ctx.fillStyle = highContrast ? '#fff' : '#00ff88';
    ctx.textAlign = 'center';
    ctx.fillText(gameState.leftScore, canvas.width / 4, 40);
    ctx.fillText(gameState.rightScore, 3 * canvas.width / 4, 40);

    if (gameState.lastScored === 'left') {
        ctx.fillStyle = highContrast ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 255, 136, 0.3)';
        ctx.fillRect(0, 0, canvas.width / 2, 40);
    } else if (gameState.lastScored === 'right') {
        ctx.fillStyle = highContrast ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 255, 136, 0.3)';
        ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, 40);
    }
}

function drawNet() {
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = highContrast ? '#fff' : '#00ff88';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawNet();
    drawPaddle(leftPaddle);
    drawPaddle(rightPaddle);
    drawBall();
    drawParticles();
    drawScores();
}

// Movement and collision
function movePaddles() {
    leftPaddle.y = Math.max(0, Math.min(canvas.height - leftPaddle.height, leftPaddle.y + leftPaddle.dy));
    rightPaddle.y = Math.max(0, Math.min(canvas.height - rightPaddle.height, rightPaddle.y + rightPaddle.dy));

    // AI for single-player
    if (gameMode === 'single' && ball.dx > 0) {
        const targetY = ball.y - rightPaddle.height / 2 + (Math.random() - 0.5) * (1 - DIFFICULTY_SETTINGS[difficulty].aiAccuracy) * 100;
        const deltaY = targetY - rightPaddle.y;
        rightPaddle.dy = deltaY * DIFFICULTY_SETTINGS[difficulty].aiSpeed;
    }
}

function createParticles(x, y) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x,
            y,
            radius: Math.random() * 3 + 1,
            dx: (Math.random() - 0.5) * 4,
            dy: (Math.random() - 0.5) * 4,
            alpha: 1
        });
    }
}

function moveBall() {
    if (gameState.isPaused || gameState.gameOver) return;

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
        createParticles(ball.x, ball.y);
        if (!isMuted) sounds.wallHit.play();
    }

    if (
        (ball.x - ball.radius < leftPaddle.x + leftPaddle.width &&
         ball.y > leftPaddle.y &&
         ball.y < leftPaddle.y + leftPaddle.height) ||
        (ball.x + ball.radius > rightPaddle.x &&
         ball.y > rightPaddle.y &&
         ball.y < rightPaddle.y + rightPaddle.height)
    ) {
        const paddle = ball.x < canvas.width / 2 ? leftPaddle : rightPaddle;
        const hitPos = (ball.y - paddle.y) / paddle.height;
        ball.dy = 2 * ball.speed * (hitPos - 0.5);
        ball.dx = -ball.dx * 1.05;
        createParticles(ball.x, ball.y);
        if (!isMuted) sounds.paddleHit.play();
    }

    if (ball.x < 0) {
        gameState.rightScore++;
        gameState.lastScored = 'right';
        if (!isMuted) sounds.score.play();
        resetBall(-1);
    } else if (ball.x > canvas.width) {
        gameState.leftScore++;
        gameState.lastScored = 'left';
        if (!isMuted) sounds.score.play();
        resetBall(1);
    }

    if (gameState.leftScore >= MAX_SCORE || gameState.rightScore >= MAX_SCORE) {
        gameState.gameOver = true;
        document.getElementById('game-over').style.display = 'block';
        document.getElementById('winner-text').textContent = 
            `${gameState.leftScore >= MAX_SCORE ? 'Left' : 'Right'} Player Wins!`;
    }
}

function resetBall(direction) {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = DIFFICULTY_SETTINGS[difficulty].ballSpeed;
    ball.dx = direction * ball.speed;
    ball.dy = ball.speed * (Math.random() * 2 - 1);
    ball.trail = [];
    gameState.isPaused = true;
    setTimeout(() => {
        gameState.isPaused = false;
        gameState.lastScored = null;
    }, 1000);
}

// Game loop
let lastTime = 0;
function update(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (!gameState.gameOver && !gameState.isPaused) {
        movePaddles();
        moveBall();
    }
    draw();
    requestAnimationFrame(update);
}

// Input handling
const keys = {
    w: { down: false, action: () => leftPaddle.dy = -PADDLE_SPEED },
    s: { down: false, action: () => leftPaddle.dy = PADDLE_SPEED },
    ArrowUp: { down: false, action: () => rightPaddle.dy = -PADDLE_SPEED },
    ArrowDown: { down: false, action: () => rightPaddle.dy = PADDLE_SPEED },
    ' ': { down: false, action: () => {
        if (gameState.gameOver) {
            restartGame();
        } else if (!gameState.isPaused) {
            pauseGame();
        } else {
            resumeGame();
        }
    }}
};

document.addEventListener('keydown', (e) => {
    if (keys[e.key]) {
        keys[e.key].down = true;
        keys[e.key].action();
    }
});

document.addEventListener('keyup', (e) => {
    if (keys[e.key]) {
        keys[e.key].down = false;
        if (['w', 's'].includes(e.key)) leftPaddle.dy = 0;
        if (['ArrowUp', 'ArrowDown'].includes(e.key)) rightPaddle.dy = 0;
    }
});

// Touch controls
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchY = (touch.clientY - rect.top) * (canvas.height / rect.height);

    const clampedY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, touchY - PADDLE_HEIGHT / 2));
    if (gameMode === 'single') {
        leftPaddle.y = clampedY;
    } else {
        if (touch.clientX < rect.width / 2) {
            leftPaddle.y = clampedY;
        } else {
            rightPaddle.y = clampedY;
        }
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
});

document.getElementById('difficultyBtn').addEventListener('click', () => {
    const levels = ['easy', 'medium', 'hard'];
    const currentIndex = levels.indexOf(difficulty);
    difficulty = levels[(currentIndex + 1) % levels.length];
    document.getElementById('difficultyBtn').textContent = `Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
    ball.speed = DIFFICULTY_SETTINGS[difficulty].ballSpeed;
});

document.getElementById('restartBtn').addEventListener('click', () => {
    restartGame();
});

document.getElementById('menuBtn').addEventListener('click', () => {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-controls').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    canvas.style.display = 'none';
    gameState.gameOver = true;
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    pauseGame();
});

document.getElementById('resumeBtn').addEventListener('click', () => {
    resumeGame();
});

document.getElementById('menuFromPauseBtn').addEventListener('click', () => {
    document.getElementById('pause-screen').style.display = 'none';
    document.getElementById('game-controls').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    canvas.style.display = 'none';
    gameState.gameOver = true;
});

document.getElementById('backToMenuBtn').addEventListener('click', () => {
    document.getElementById('game-controls').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    canvas.style.display = 'none';
    gameState.gameOver = true;
});

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('game-controls').style.display = 'flex';
    canvas.style.display = 'block';
    resizeCanvas();
    resetBall(1);
    gameState.gameOver = false;
    requestAnimationFrame(update);
}

function restartGame() {
    gameState.leftScore = 0;
    gameState.rightScore = 0;
    gameState.gameOver = false;
    gameState.lastScored = null;
    document.getElementById('game-over').style.display = 'none';
    resetBall(1);
}

function pauseGame() {
    gameState.isPaused = true;
    document.getElementById('pause-screen').style.display = 'block';
}

function resumeGame() {
    gameState.isPaused = false;
    document.getElementById('pause-screen').style.display = 'none';
}

// Preload assets and initialize
Promise.all(Object.values(sounds).map(sound => new Promise(resolve => {
    sound.oncanplaythrough = resolve;
    sound.onerror = resolve; // Continue even if audio fails
}))).then(() => {
    loadingDiv.style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    resizeCanvas();
}).catch(err => {
    console.warn('Asset loading failed:', err);
    loadingDiv.style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    resizeCanvas();
});

// Event listeners for responsiveness
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
