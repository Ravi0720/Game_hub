const dino = document.getElementById("dino");
const obstacle = document.getElementById("obstacle");
const status = document.getElementById("status");

let isJumping = false;

document.addEventListener("keydown", function (e) {
  if (e.code === "Space" && !isJumping) {
    jump();
  }
});

function jump() {
  isJumping = true;
  dino.classList.add("jump");
  setTimeout(() => {
    dino.classList.remove("jump");
    isJumping = false;
  }, 500);
}

setInterval(() => {
  const dinoBottom = parseInt(window.getComputedStyle(dino).getPropertyValue("bottom"));
  const obstacleLeft = parseInt(window.getComputedStyle(obstacle).getPropertyValue("right"));

  const obstaclePos = 600 - obstacleLeft;

  if (obstaclePos > 50 && obstaclePos < 90 && dinoBottom < 50) {
    status.textContent = "💥 Game Over! Press Space to restart.";
    obstacle.style.animation = "none";
    obstacle.style.right = `${obstaclePos}px`;

    document.addEventListener("keydown", resetGame);
  }
}, 10);

function resetGame(e) {
  if (e.code === "Space") {
    obstacle.style.animation = "moveObstacle 2s linear infinite";
    status.textContent = "Press Space to Jump";
    document.removeEventListener("keydown", resetGame);
  }
}
