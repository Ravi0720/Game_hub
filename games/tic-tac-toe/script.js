const board = document.getElementById("board");
const status = document.getElementById("status");
let currentPlayer = "X";
let cells = Array(9).fill("");

function createBoard() {
    board.innerHTML = "";
    cells.forEach((_, i) => {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.index = i;
        cell.addEventListener("click", handleMove);
        board.appendChild(cell);
    });
}

function handleMove(e) {
    const index = e.target.dataset.index;

    if (cells[index] !== "" || checkWinner()) return;

    cells[index] = currentPlayer;
    e.target.textContent = currentPlayer;

    if (checkWinner()) {
        status.textContent = `🎉 Player ${currentPlayer} wins!`;
    } else if (cells.every(cell => cell !== "")) {
        status.textContent = "It's a draw!";
    } else {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        status.textContent = `Player ${currentPlayer}'s turn`;
    }
}

function checkWinner() {
    const wins = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]           // Diagonals
    ];

    return wins.some(([a, b, c]) =>
        cells[a] && cells[a] === cells[b] && cells[a] === cells[c]
    );
}

function restartGame() {
    cells = Array(9).fill("");
    currentPlayer = "X";
    status.textContent = `Player ${currentPlayer}'s turn`;
    createBoard();
}

createBoard();
