const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// Create the paddle
const paddleWidth = 10, paddleHeight = 100;
const leftPaddle = { x: 0, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, color: "#FFFFFF", dy: 10 };
const rightPaddle = { x: canvas.width - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, color: "#FFFFFF", dy: 10 };

// Create the ball
const ballRadius = 10;
const ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 5, dy: 5, radius: ballRadius, color: "#FFFFFF" };

// Draw the paddles and ball
function draw() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw paddles
    ctx.fillStyle = leftPaddle.color;
    ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);

    ctx.fillStyle = rightPaddle.color;
    ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

    // Draw the ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
}

// Move the paddles
function movePaddles() {
    if (leftPaddle.up && leftPaddle.y > 0) leftPaddle.y -= leftPaddle.dy;
    if (leftPaddle.down && leftPaddle.y + leftPaddle.height < canvas.height) leftPaddle.y += leftPaddle.dy;
    if (rightPaddle.up && rightPaddle.y > 0) rightPaddle.y -= rightPaddle.dy;
    if (rightPaddle.down && rightPaddle.y + rightPaddle.height < canvas.height) rightPaddle.y += rightPaddle.dy;
}

// Move the ball
function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Bounce off the top and bottom
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) ball.dy = -ball.dy;

    // Bounce off the paddles
    if (ball.x - ball.radius < leftPaddle.x + leftPaddle.width && ball.y > leftPaddle.y && ball.y < leftPaddle.y + leftPaddle.height) {
        ball.dx = -ball.dx;
    }

    if (ball.x + ball.radius > rightPaddle.x && ball.y > rightPaddle.y && ball.y < rightPaddle.y + rightPaddle.height) {
        ball.dx = -ball.dx;
    }

    // Reset ball if it goes off screen
    if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
    }
}

// Update the game
function update() {
    movePaddles();
    moveBall();
    draw();
    requestAnimationFrame(update);
}

// Handle keyboard input
document.addEventListener('keydown', function (event) {
    if (event.key === 'w') leftPaddle.up = true;
    if (event.key === 's') leftPaddle.down = true;
    if (event.key === 'ArrowUp') rightPaddle.up = true;
    if (event.key === 'ArrowDown') rightPaddle.down = true;
});

document.addEventListener('keyup', function (event) {
    if (event.key === 'w') leftPaddle.up = false;
    if (event.key === 's') leftPaddle.down = false;
    if (event.key === 'ArrowUp') rightPaddle.up = false;
    if (event.key === 'ArrowDown') rightPaddle.down = false;
});

// Start the game
update();
