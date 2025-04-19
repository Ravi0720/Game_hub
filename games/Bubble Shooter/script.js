const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const shooter = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    radius: 15
};

let currentBubble = createBubble(shooter.x, shooter.y);
const bubbles = [];
const colors = ["red", "green", "blue", "yellow", "purple"];

function createBubble(x, y) {
    const angle = 0;
    return {
        x,
        y,
        radius: 15,
        dx: 0,
        dy: -6,
        color: colors[Math.floor(Math.random() * colors.length)],
        moving: false
    };
}

function drawShooter() {
    ctx.beginPath();
    ctx.arc(shooter.x, shooter.y, shooter.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.moveTo(shooter.x, shooter.y - 25);
    ctx.lineTo(shooter.x - 10, shooter.y - 5);
    ctx.lineTo(shooter.x + 10, shooter.y - 5);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.closePath();
}

function drawBubble(bubble) {
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    ctx.fillStyle = bubble.color;
    ctx.fill();
    ctx.closePath();
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

        // Bounce from wall
        if (currentBubble.x <= currentBubble.radius || currentBubble.x >= canvas.width - currentBubble.radius) {
            currentBubble.dx = -currentBubble.dx;
        }

        // Collision detection with stacked bubbles
        for (let i = 0; i < bubbles.length; i++) {
            const b = bubbles[i];
            const dx = currentBubble.x - b.x;
            const dy = currentBubble.y - b.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < currentBubble.radius * 2) {
                if (currentBubble.color === b.color) {
                    bubbles.splice(i, 1);
                }
                bubbles.push(currentBubble);
                currentBubble = createBubble(shooter.x, shooter.y);
                break;
            }
        }

        if (currentBubble.y < currentBubble.radius) {
            bubbles.push(currentBubble);
            currentBubble = createBubble(shooter.x, shooter.y);
        }
    }

    drawBubble(currentBubble);
    requestAnimationFrame(update);
}

canvas.addEventListener("click", (e) => {
    if (!currentBubble.moving) {
        const angle = Math.atan2(
            e.clientY - canvas.getBoundingClientRect().top - shooter.y,
            e.clientX - canvas.getBoundingClientRect().left - shooter.x
        );
        currentBubble.dx = 6 * Math.cos(angle);
        currentBubble.dy = 6 * Math.sin(angle);
        currentBubble.moving = true;
    }
});

update();