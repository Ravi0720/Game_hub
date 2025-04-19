const gameBoard = document.getElementById('game-board');
const emojis = ['🍕', '🐶', '🚀', '🎮', '🏀', '🎧', '🎲', '🧠'];
let cards = [...emojis, ...emojis]; // duplicate for pairs
let flippedCards = [];
let lockBoard = false;

shuffle(cards);
createBoard();

function shuffle(array) {
  array.sort(() => 0.5 - Math.random());
}

function createBoard() {
  cards.forEach((emoji, index) => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.emoji = emoji;
    card.dataset.index = index;
    card.innerText = '';
    card.addEventListener('click', flipCard);
    gameBoard.appendChild(card);
  });
}

function flipCard() {
  if (lockBoard) return;
  if (this.classList.contains('flipped')) return;

  this.classList.add('flipped');
  this.innerText = this.dataset.emoji;
  flippedCards.push(this);

  if (flippedCards.length === 2) {
    lockBoard = true;
    setTimeout(checkMatch, 800);
  }
}

function checkMatch() {
  const [card1, card2] = flippedCards;

  if (card1.dataset.emoji === card2.dataset.emoji) {
    card1.removeEventListener('click', flipCard);
    card2.removeEventListener('click', flipCard);
  } else {
    card1.classList.remove('flipped');
    card2.classList.remove('flipped');
    card1.innerText = '';
    card2.innerText = '';
  }

  flippedCards = [];
  lockBoard = false;
}
