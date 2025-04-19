const testText = document.getElementById('test-text').textContent;
const userInput = document.getElementById('user-input');
const timeDisplay = document.getElementById('time');
const wpmDisplay = document.getElementById('wpm');

let startTime;
let typingTimer;
let timeElapsed = 0;
let wordsTyped = 0;

userInput.addEventListener('input', () => {
  if (!startTime) {
    startTime = new Date();
    typingTimer = setInterval(updateTime, 1000);
  }

  const userText = userInput.value;

  if (userText === testText) {
    clearInterval(typingTimer);
    wordsTyped = userText.split(' ').length;
    const totalTime = (new Date() - startTime) / 1000; // in seconds
    const wpm = Math.round((wordsTyped / totalTime) * 60);
    wpmDisplay.textContent = wpm;
  }
});

function updateTime() {
  timeElapsed = Math.round((new Date() - startTime) / 1000);
  timeDisplay.textContent = timeElapsed;
}
