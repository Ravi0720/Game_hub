const circle = document.getElementById("circle");
const game = document.getElementById("game");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const startBtn = document.getElementById("start");

let score = 0;
let timeLeft = 30;
let gameInterval;
let timerInterval;

function randomPosition() {
    const maxX = game.clientWidth - circle.clientWidth;
    const maxY = game.clientHeight - circle.clientHeight;

    const randomX = Math.floor(Math.random() * maxX);
    const randomY = Math.floor(Math.random() * maxY);

    circle.style.left = randomX + "px";
    circle.style.top = randomY + "px";
}

circle.addEventListener("click", () => {
    score++;
    scoreEl.textContent = score;
    randomPosition();
});

startBtn.addEventListener("click", startGame);

function startGame() {
    score = 0;
    timeLeft = 30;
    scoreEl.textContent = score;
    timeEl.textContent = timeLeft;
    circle.style.display = "block";
    randomPosition();

    clearInterval(gameInterval);
    clearInterval(timerInterval);

    gameInterval = setInterval(randomPosition, 800);
    timerInterval = setInterval(() => {
        timeLeft--;
        timeEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            clearInterval(gameInterval);
            circle.style.display = "none";
            alert("Time's up! Your score: " + score);
        }
    }, 1000);
}
