const quotes = [
  "The quick brown fox jumps over the lazy dog.",
  "Typing is a fundamental skill for everyone.",
  "Practice makes perfect, especially in typing.",
  "Speed and accuracy go hand in hand.",
  "Focus on precision over speed at first.",
  "Learning to type faster can save you a lot of time in the long run.",
  "Errors in typing can lead to confusion, so it's important to be accurate.",
  "A good keyboard and posture help with typing speed and comfort.",
  "Consistency is the key to improving typing performance day by day.",
  "Keep your eyes on the screen and not on the keyboard.",
  "Even the fastest typists started with slow speeds and made mistakes.",
  "Developing muscle memory will make your typing almost automatic.",
  "Set small goals like 5 more words per minute and celebrate progress.",
  "Typing games can make practice fun and help you learn faster.",
  "Take breaks during long typing sessions to avoid strain."
];


let currentQuote = '';
let timer = 0;
let timerInterval;
let isTyping = false;
let mistakes = 0;

const quoteEl = document.getElementById('quote');
const inputEl = document.getElementById('input');
const timerEl = document.getElementById('timer');
const wpmEl = document.getElementById('wpm');
const accuracyEl = document.getElementById('accuracy');

function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

function renderQuote(quote) {
  quoteEl.innerHTML = '';
  quote.split('').forEach(char => {
    const span = document.createElement('span');
    span.innerText = char;
    quoteEl.appendChild(span);
  });
}

function startTimer() {
  timer = 0;
  timerInterval = setInterval(() => {
    timer++;
    timerEl.innerText = timer;
  }, 1000);
}

function calculateWPM() {
  const wordsTyped = inputEl.value.trim().split(' ').length;
  const minutes = timer / 60;
  return Math.round(wordsTyped / minutes || 0);
}

function calculateAccuracy() {
  const typedChars = inputEl.value.length;
  const correctChars = typedChars - mistakes;
  return Math.max(Math.round((correctChars / typedChars) * 100), 0);
}

inputEl.addEventListener('input', () => {
  if (!isTyping) {
    isTyping = true;
    startTimer();
  }

  const arrayQuote = quoteEl.querySelectorAll('span');
  const arrayValue = inputEl.value.split('');
  mistakes = 0;

  arrayQuote.forEach((charSpan, index) => {
    const char = arrayValue[index];
    if (char == null) {
      charSpan.classList.remove('correct', 'incorrect');
    } else if (char === charSpan.innerText) {
      charSpan.classList.add('correct');
      charSpan.classList.remove('incorrect');
    } else {
      charSpan.classList.add('incorrect');
      charSpan.classList.remove('correct');
      mistakes++;
    }
  });

  wpmEl.innerText = calculateWPM();
  accuracyEl.innerText = calculateAccuracy();

  if (arrayValue.length === currentQuote.length) {
    clearInterval(timerInterval);
    inputEl.disabled = true;
  }
});

function startTest() {
  inputEl.disabled = false;
  inputEl.value = '';
  inputEl.focus();
  clearInterval(timerInterval);
  isTyping = false;
  timer = 0;
  mistakes = 0;
  timerEl.innerText = '0';
  wpmEl.innerText = '0';
  accuracyEl.innerText = '100';

  currentQuote = getRandomQuote();
  renderQuote(currentQuote);
}

// Init
startTest();
