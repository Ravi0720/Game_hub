let board = [];
let score = 0;

function createGrid() {
    const gridContainer = document.getElementById("grid-container");
    gridContainer.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.textContent = board[i] !== 0 ? board[i] : "";
        cell.setAttribute("data-value", board[i]);
        gridContainer.appendChild(cell);
    }
    document.getElementById("score").textContent = `Score: ${score}`;
}

function startGame() {
    board = Array(16).fill(0);
    score = 0;
    addRandom();
    addRandom();
    createGrid();
}

function addRandom() {
    const emptyCells = board.map((val, idx) => val === 0 ? idx : null).filter(v => v !== null);
    if (emptyCells.length === 0) return;
    const randIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    board[randIndex] = Math.random() < 0.9 ? 2 : 4;
}

function slide(row) {
    row = row.filter(val => val);
    for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i + 1]) {
            row[i] *= 2;
            score += row[i];
            row[i + 1] = 0;
        }
    }
    return row.filter(val => val).concat(Array(4 - row.filter(val => val).length).fill(0));
}

function move(direction) {
    let moved = false;
    for (let i = 0; i < 4; i++) {
        let row = [];
        for (let j = 0; j < 4; j++) {
            const idx = direction === 'left' || direction === 'right' ? i * 4 + j : j * 4 + i;
            row.push(board[idx]);
        }

        if (direction === 'right' || direction === 'down') row.reverse();

        const newRow = slide(row);
        if (direction === 'right' || direction === 'down') newRow.reverse();

        for (let j = 0; j < 4; j++) {
            const idx = direction === 'left' || direction === 'right' ? i * 4 + j : j * 4 + i;
            if (board[idx] !== newRow[j]) {
                moved = true;
                board[idx] = newRow[j];
            }
        }
    }

    if (moved) {
        addRandom();
        createGrid();
        checkGameOver();
    }
}

function checkGameOver() {
    if (board.includes(0)) return;
    for (let i = 0; i < 16; i++) {
        if (i % 4 !== 3 && board[i] === board[i + 1]) return;
        if (i < 12 && board[i] === board[i + 4]) return;
    }
    alert("Game Over!");
}

document.addEventListener("keydown", e => {
    switch (e.key) {
        case "ArrowUp": move("up"); break;
        case "ArrowDown": move("down"); break;
        case "ArrowLeft": move("left"); break;
        case "ArrowRight": move("right"); break;
    }
});

startGame();
