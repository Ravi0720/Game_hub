const words = ["developer", "javascript", "function", "variable", "object", "array", "react", "python"];
let currentWord = "";
let timer;
let timeLeft = 30;

function scramble(word) {
    return word.split('').sort(() => Math.random() - 0.5).join('');
}

function initGame() {
    clearInterval(timer);
    document.getElementById("result").innerText = "";
    const randomIndex = Math.floor(Math.random() * words.length);
    currentWord = words[randomIndex];
    document.getElementById("scrambled-word").innerText = scramble(currentWord);
    document.getElementById("user-input").value = "";
    timeLeft = 30;
    document.getElementById("timer").innerText = timeLeft;

    timer = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").innerText = timeLeft;
        if (timeLeft === 0) {
            clearInterval(timer);
            document.getElementById("result").innerText = `⏰ Time's up! The word was: ${currentWord}`;
        }
    }, 1000);
}

function checkWord() {
    const userGuess = document.getElementById("user-input").value.trim().toLowerCase();
    if (userGuess === currentWord) {
        clearInterval(timer);
        document.getElementById("result").innerText = "✅ Correct!";
    } else {
        document.getElementById("result").innerText = "❌ Try again!";
    }
}

window.onload = initGame;
