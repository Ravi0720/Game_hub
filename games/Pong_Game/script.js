const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// Constants
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_RADIUS = 10;
const PADDLE_SPEED = 8;
const BALL_SPEED = 7;
const MAX_BALL_SPEED = 12;
const MAX_SCORE = 5;

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

// Drawing functions
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

    if (gameState.lastScored === 'left') {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width / 2, 50);
    } else if (gameState.lastScored === 'right') {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, 50);
    }
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
            `${gameState.leftScore >= MAX_SCORE ? 'Left' : 'Right'} Player Wins!`,
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

// Movement and collisions
function movePaddles() {
    leftPaddle.y = Math.max(0, Math.min(canvas.height - leftPaddle.height, leftPaddle.y + leftPaddle.dy));
    moveRightPaddleAI();
    rightPaddle.y = Math.max(0, Math.min(canvas.height - rightPaddle.height, rightPaddle.y + rightPaddle.dy));
}

function moveRightPaddleAI() {
    const paddleCenter = rightPaddle.y + rightPaddle.height / 2;
    if (ball.dx > 0) {
        if (ball.y < paddleCenter - 10) {
            rightPaddle.dy = -PADDLE_SPEED;
        } else if (ball.y > paddleCenter + 10) {
            rightPaddle.dy = PADDLE_SPEED;
        } else {
            rightPaddle.dy = 0;
        }
    } else {
        rightPaddle.dy = 0;
    }
}

function moveBall() {
    if (gameState.isPaused || gameState.gameOver) return;

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
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
        ball.dy = 2 * BALL_SPEED * (hitPos - 0.5);
        ball.dx = -ball.dx * 1.1;

        // Cap speed
        ball.dx = Math.sign(ball.dx) * Math.min(Math.abs(ball.dx), MAX_BALL_SPEED);
        ball.dy = Math.sign(ball.dy) * Math.min(Math.abs(ball.dy), MAX_BALL_SPEED);
    }

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

// Game loop
function update() {
    if (!gameState.gameOver) {
        movePaddles();
        moveBall();
    }
    draw();
    requestAnimationFrame(update);
}

// Input
const keys = {
    w: { down: false, action: () => leftPaddle.dy = -PADDLE_SPEED },
    s: { down: false, action: () => leftPaddle.dy = PADDLE_SPEED },
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
    }
});

// Resize support
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    leftPaddle.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
    rightPaddle.x = canvas.width - PADDLE_WIDTH;
    rightPaddle.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
    resetBall(1);
}

window.addEventListener('resize', resizeCanvas);

// Initialize and start
resizeCanvas();
update();
