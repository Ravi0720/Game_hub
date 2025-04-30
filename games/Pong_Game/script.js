let isSinglePlayer = null; // null until player chooses
const canvas = document.getElementById('pong');
canvas.style.display = 'none';
const ctx = canvas.getContext('2d');

// === CONFIGURATION ===
canvas.width = 800;
canvas.height = 400;

const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_RADIUS = 10;
const PADDLE_SPEED = 7;
const BALL_SPEED = 6;
const MAX_SCORE = 5;

// === GAME MODE ===
let isSinglePlayer = true; // Set this to false for 2-player mode

// === GAME STATE ===
const gameState = {
    leftScore: 0,
    rightScore: 0,
    isPaused: false,
    gameOver: false,
    lastScored: null
};

// === OBJECTS ===
const leftPaddle = {
    x: 0,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
    color: '#FFFFFF'
};

const rightPaddle = {
    x: canvas.width - PADDLE_WIDTH,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
    color: '#FFFFFF'
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    dx: BALL_SPEED,
    dy: BALL_SPEED,
    radius: BALL_RADIUS,
    color: '#FFFFFF'
};

// === DRAW FUNCTIONS ===
function drawPaddle(paddle) {
    ctx.fillStyle = paddle.color;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
}

function drawScores() {
    ctx.font = '40px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(gameState.leftScore, canvas.width / 4, 50);
    ctx.fillText(gameState.rightScore, 3 * canvas.width / 4, 50);
}

function drawNet() {
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
    ctx.setLineDash([]);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState.gameOver) {
        ctx.font = '40px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(
            `${gameState.leftScore >= MAX_SCORE ? 'Left' : 'Right'} Wins!`,
            canvas.width / 2,
            canvas.height / 2
        );
        ctx.font = '20px Arial';
        ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 40);
        return;
    }

    drawNet();
    drawPaddle(leftPaddle);
    drawPaddle(rightPaddle);
    drawBall();
    drawScores();
}

// === MOVEMENT ===
function movePaddles() {
    leftPaddle.y = Math.max(0, Math.min(canvas.height - leftPaddle.height, leftPaddle.y + leftPaddle.dy));

    if (isSinglePlayer) {
        // AI movement
        const target = ball.y - rightPaddle.height / 2;
        const diff = target - rightPaddle.y;
        rightPaddle.dy = Math.sign(diff) * Math.min(PADDLE_SPEED - 2, Math.abs(diff));
    }

    rightPaddle.y = Math.max(0, Math.min(canvas.height - rightPaddle.height, rightPaddle.y + rightPaddle.dy));
}

function moveBall() {
    if (gameState.isPaused || gameState.gameOver) return;

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collision
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
    }

    // Paddle collision
    if (
        (ball.x - ball.radius < leftPaddle.x + leftPaddle.width &&
         ball.y > leftPaddle.y && ball.y < leftPaddle.y + leftPaddle.height) ||
        (ball.x + ball.radius > rightPaddle.x &&
         ball.y > rightPaddle.y && ball.y < rightPaddle.y + rightPaddle.height)
    ) {
        const paddle = ball.x < canvas.width / 2 ? leftPaddle : rightPaddle;
        const hitPos = (ball.y - paddle.y) / paddle.height;
        ball.dy = 2 * BALL_SPEED * (hitPos - 0.5);
        ball.dx = -ball.dx * 1.1;
    }

    // Score check
    if (ball.x < 0) {
        gameState.rightScore++;
        gameState.lastScored = 'right';
        resetBall(-1);
    } else if (ball.x > canvas.width) {
        gameState.leftScore++;
        gameState.lastScored = 'left';
        resetBall(1);
    }

    if (gameState.leftScore >= MAX_SCORE || gameState.rightScore >= MAX_SCORE) {
        gameState.gameOver = true;
    }
}

function resetBall(direction) {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = direction * BALL_SPEED;
    ball.dy = BALL_SPEED * (Math.random() * 2 - 1);
    gameState.isPaused = true;
    setTimeout(() => {
        gameState.isPaused = false;
        gameState.lastScored = null;
    }, 1000);
}

// === GAME LOOP ===
function update() {
    if (!gameState.gameOver) {
        movePaddles();
        moveBall();
    }
    draw();
    requestAnimationFrame(update);
}

// === INPUT: KEYBOARD ===
const keys = {
    w: { down: false, action: () => leftPaddle.dy = -PADDLE_SPEED },
    s: { down: false, action: () => leftPaddle.dy = PADDLE_SPEED },
    ArrowUp: { down: false, action: () => rightPaddle.dy = -PADDLE_SPEED },
    ArrowDown: { down: false, action: () => rightPaddle.dy = PADDLE_SPEED },
    ' ': {
        down: false,
        action: () => {
            if (gameState.gameOver) {
                gameState.leftScore = 0;
                gameState.rightScore = 0;
                gameState.gameOver = false;
                gameState.lastScored = null;
                resetBall(1);
            }
        }
    }
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
        if (!isSinglePlayer && ['ArrowUp', 'ArrowDown'].includes(e.key)) rightPaddle.dy = 0;
    }
});

// === INPUT: TOUCH ===
function setTouchControl(id, paddle, direction) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('touchstart', () => paddle.dy = direction * PADDLE_SPEED);
    btn.addEventListener('touchend', () => paddle.dy = 0);
}

// === INIT ===
setTouchControl('left-up', leftPaddle, -1);
setTouchControl('left-down', leftPaddle, 1);
if (!isSinglePlayer) {
    setTouchControl('right-up', rightPaddle, -1);
    setTouchControl('right-down', rightPaddle, 1);
}

// Start game only after selecting mode
function startGame(singlePlayerMode) {
    isSinglePlayer = singlePlayerMode;
    document.getElementById('mode-selection').style.display = 'none';
    canvas.style.display = 'block';
    update();
}

