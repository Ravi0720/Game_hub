let score = 0;
let activeMole = null;

const moles = document.querySelectorAll('.mole');
const scoreDisplay = document.getElementById('score');

// Randomly display a mole every second
function showMole() {
    const randomMole = moles[Math.floor(Math.random() * moles.length)];
    randomMole.style.display = 'block';
    activeMole = randomMole;

    setTimeout(() => {
        randomMole.style.display = 'none';
        activeMole = null;
    }, 1000);
}

// Whack the mole when clicked
moles.forEach(mole => {
    mole.addEventListener('click', () => {
        if (mole === activeMole) {
            score++;
            scoreDisplay.textContent = score;
            mole.style.display = 'none';
            activeMole = null;
        }
    });
});

// Start the game loop
setInterval(showMole, 1000);
