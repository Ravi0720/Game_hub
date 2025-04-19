const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const shooter = { x: canvas.width / 2, y: canvas.height - 30, radius: 10 };
let currentBubble = createBubble(shooter.x, shooter.y);

const bubbles = [];
const colors = ["red", "green", "blue", "yellow", "purple"];

function createBubble(x, y) {
    return {
        x,
        y,
        radius: 10,
        dx: 0,
        dy: -5,
        color: colors[Math.floor(Math.random() * colors.length)],
        moving: false
    };
}

function drawShooter() {
    ctx.beginPath();
    ctx.arc(shooter.x, shooter.y, shooter.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
}

function drawBubble(bubble) {
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    ctx.fillStyle = bubble.color;
    ctx.fill();
}

function drawAllBubbles() {
    bubbles.forEach(drawBubble);
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawShooter();
    drawAllBubbles();

    if (currentBubble.moving) {
        currentBubble.x += currentBubble.dx;
        currentBubble.y += currentBubble.dy;

        if (currentBubble.y < 0) {
            bubbles.push(currentBubble);
            currentBubble = createBubble(shooter.x, shooter.y);
        }
    }

    drawBubble(currentBubble);
    requestAnimationFrame(update);
}

canvas.addEventListener("click", () => {
    if (!currentBubble.moving) {
        currentBubble.moving = true;
    }
});

update();
