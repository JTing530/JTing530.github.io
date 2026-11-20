const START_DATE = new Date('2024-01-01T00:00:00');
let targetWord = "";
let currentRow = 0;
let currentTile = 0;
let gameOver = false;
let boardState = Array(6).fill().map(() => Array(5).fill(''));

function openTab(evt, tabName) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active");
    }

    const tabButtons = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove("active");
    }

    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

async function init() {
    try {
        const response = await fetch('words.json');
        const data = await response.json();
        const allWords = [...data.custom, ...data.standard];

        const now = new Date();
        const diffTime = now - START_DATE;
        
        // Calculates total continuous weeks since START_DATE (does not reset yearly)
        const weekNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1;

        document.getElementById('week-display').innerText = weekNumber;
        document.getElementById('sudoku-week-display').innerText = weekNumber;

        // (weekNumber - 1) ensures Week 1 uses index 0, Week 2 uses index 1, etc.
        // It iterates sequentially, guaranteeing no repeats until every word is used once.
        targetWord = allWords[(weekNumber - 1) % allWords.length].toUpperCase();

        createBoard();
        drawPlaceholderBoards();
        document.addEventListener('keydown', handleKeyPress);
    } catch (error) {
        showMessage("Error loading words.json. Are you running this on a server/GitHub Pages?");
    }
}

function createBoard() {
    const board = document.getElementById('board');
    for (let r = 0; r < 6; r++) {
        const row = document.createElement('div');
        row.classList.add('row');
        row.setAttribute('id', `row-${r}`);
        for (let c = 0; c < 5; c++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.setAttribute('id', `tile-${r}-${c}`);
            row.appendChild(tile);
        }
        board.appendChild(row);
    }
}

function drawPlaceholderBoards() {
    const sudokuBoard = document.getElementById('sudoku-board');
    for(let i = 0; i < 81; i++) {
        const cell = document.createElement('div');
        cell.classList.add('sudoku-cell');
        sudokuBoard.appendChild(cell);
    }
}

function handleKeyPress(e) {
    if (gameOver || !document.getElementById('wordle').classList.contains('active')) return;

    if (e.key === 'Enter') {
        submitGuess();
    } else if (e.key === 'Backspace') {
        deleteLetter();
    } else if (/^[a-zA-Z]$/.test(e.key)) {
        addLetter(e.key.toUpperCase());
    }
}

function addLetter(letter) {
    if (currentTile < 5) {
        const tile = document.getElementById(`tile-${currentRow}-${currentTile}`);
        tile.innerText = letter;
        tile.classList.add('active');
        boardState[currentRow][currentTile] = letter;
        currentTile++;
    }
}

function deleteLetter() {
    if (currentTile > 0) {
        currentTile--;
        const tile = document.getElementById(`tile-${currentRow}-${currentTile}`);
        tile.innerText = '';
        tile.classList.remove('active');
        boardState[currentRow][currentTile] = '';
    }
}

function submitGuess() {
    if (currentTile !== 5) {
        showMessage("Not enough letters");
        return;
    }

    const guess = boardState[currentRow].join('');
    checkGuess(guess);
}

function checkGuess(guess) {
    let targetLetters = targetWord.split('');
    let guessLetters = guess.split('');
    let tileColors = Array(5).fill('absent');

    for (let i = 0; i < 5; i++) {
        if (guessLetters[i] === targetLetters[i]) {
            tileColors[i] = 'correct';
            targetLetters[i] = null;
        }
    }

    for (let i = 0; i < 5; i++) {
        if (tileColors[i] === 'correct') continue;
        
        let index = targetLetters.indexOf(guessLetters[i]);
        if (index !== -1) {
            tileColors[i] = 'present';
            targetLetters[index] = null;
        }
    }

    for (let i = 0; i < 5; i++) {
        const tile = document.getElementById(`tile-${currentRow}-${i}`);
        tile.classList.add(tileColors[i]);
        tile.classList.remove('active');
    }

    if (guess === targetWord) {
        showMessage("You got it!");
        gameOver = true;
    } else if (currentRow === 5) {
        showMessage(`Game Over. The word was ${targetWord}`);
        gameOver = true;
    } else {
        currentRow++;
        currentTile = 0;
    }
}

function showMessage(msg) {
    document.getElementById('message').innerText = msg;
    setTimeout(() => {
        if (!gameOver) document.getElementById('message').innerText = '';
    }, 2000);
}

init();
