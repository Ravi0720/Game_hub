const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const box = 20;
const rows = canvas.height / box;
const cols = canvas.width / box;

let snake = [{ x: 9 * box, y: 10 * box }];
let direction = null;
let score = 0;

let food = {
    x: Math.floor(Math.random() * cols) * box,
    y: Math.floor(Math.random() * rows) * box,
};

document.addEventListener("keydown", changeDirection);

function changeDirection(e) {
    const key = e.key;

    if (key === "ArrowUp" && direction !== "DOWN") direction = "UP";
    else if (key === "ArrowDown" && direction !== "UP") direction = "DOWN";
    else if (key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
    else if (key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    snake.forEach((segment, i) => {
        ctx.fillStyle = i === 0 ? "lime" : "green";
        ctx.fillRect(segment.x, segment.y, box, box);
    });

    // Draw food
    ctx.fillStyle = "red";
    ctx.fillRect(food.x, food.y, box, box);

    // Move snake
    let head = { ...snake[0] };
    if (direction === "LEFT") head.x -= box;
    else if (direction === "RIGHT") head.x += box;
    else if (direction === "UP") head.y -= box;
    else if (direction === "DOWN") head.y += box;

    // Game over checks
    if (
        head.x < 0 || head.x >= canvas.width ||
        head.y < 0 || head.y >= canvas.height ||
        snake.some((seg, i) => i !== 0 && seg.x === head.x && seg.y === head.y)
    ) {
        alert("Game Over! Your score: " + score);
        snake = [{ x: 9 * box, y: 10 * box }];
        direction = null;
        score = 0;
        document.getElementById("score").innerText = score;
        return;
    }

    snake.unshift(head);

    // Eat food
    if (head.x === food.x && head.y === food.y) {
        score++;
        document.getElementById("score").innerText = score;
        food = {
            x: Math.floor(Math.random() * cols) * box,
            y: Math.floor(Math.random() * rows) * box,
        };
    } else {
        snake.pop();
    }
}

setInterval(draw, 120);
