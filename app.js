if (!window.gameInitialized) {
    window.gameInitialized = true;

    const START_DATE = new Date('2024-01-01T00:00:00');
    let weekNumber = 1;

    let targetWord = "";
    let currentRow = 0;
    let currentTile = 0;
    let gameOver = false;
    let boardState = Array(6).fill().map(() => Array(5).fill(''));

    let sudokuSolution = [];
    let sudokuPuzzle = [];
    let currentSudokuState = [];
    let sudokuSelectedCell = null;
    let sudokuGameOver = false;

    function setupTabs() {
        const buttons = document.querySelectorAll('.tab-button');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                
                const tabId = e.target.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
                e.target.classList.add('active');
            });
        });
    }

    async function init() {
        setupTabs();

        const now = new Date();
        const diffTime = now - START_DATE;
        weekNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1;

        document.getElementById('week-display').innerText = weekNumber;
        document.getElementById('sudoku-week-display').innerText = weekNumber;

        createWordleBoard();
        
        try {
            const response = await fetch('words.json');
            const data = await response.json();
            const allWords = [...data.custom, ...data.standard];
            targetWord = allWords[(weekNumber - 1) % allWords.length].toUpperCase();
        } catch (error) {
            showMessage("Error loading words.json. Make sure the file is uploaded to GitHub.");
        }

        generateSudokuBoard(weekNumber);
        createSudokuBoard();

        document.addEventListener('keydown', handleKeyPress);
    }

    function createWordleBoard() {
        const board = document.getElementById('board');
        board.innerHTML = ''; 
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

    function handleWordleKeyPress(e) {
        if (gameOver) return;
        if (e.key === 'Enter') submitGuess();
        else if (e.key === 'Backspace') deleteLetter();
        else if (/^[a-zA-Z]$/.test(e.key)) addLetter(e.key.toUpperCase());
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
        const msgDiv = document.getElementById('message');
        msgDiv.innerText = msg;
        setTimeout(() => { 
            if (!gameOver) msgDiv.innerText = ''; 
        }, 2000);
    }

    function mulberry32(a) {
        return function() {
          var t = a += 0x6D2B79F5;
          t = Math.imul(t ^ t >>> 15, t | 1);
          t ^= t + Math.imul(t ^ t >>> 7, t | 61);
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }

    function generateSudokuBoard(seed) {
        const rng = mulberry32(seed);
        
        let board = [
            [1,2,3,4,5,6,7,8,9],
            [4,5,6,7,8,9,1,2,3],
            [7,8,9,1,2,3,4,5,6],
            [2,3,1,5,6,4,8,9,7],
            [5,6,4,8,9,7,2,3,1],
            [8,9,7,2,3,1,5,6,4],
            [3,1,2,6,4,5,9,7,8],
            [6,4,5,9,7,8,3,1,2],
            [9,7,8,3,1,2,6,4,5]
        ];

        let nums = [1,2,3,4,5,6,7,8,9];
        for (let i = nums.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [nums[i], nums[j]] = [nums[j], nums[i]];
        }
        for(let r = 0; r < 9; r++) {
            for(let c = 0; c < 9; c++) {
                board[r][c] = nums[board[r][c]-1];
            }
        }

        for(let band = 0; band < 3; band++) {
            for(let i = 0; i < 3; i++) {
                let j = Math.floor(rng() * 3);
                let temp = board[band*3 + i];
                board[band*3 + i] = board[band*3 + j];
                board[band*3 + j] = temp;
            }
        }

        for(let band = 0; band < 3; band++) {
            for(let i = 0; i < 3; i++) {
                let j = Math.floor(rng() * 3);
                for(let r = 0; r < 9; r++) {
                    let temp = board[r][band*3 + i];
                    board[r][band*3 + i] = board[r][band*3 + j];
                    board[r][band*3 + j] = temp;
                }
            }
        }

        sudokuSolution = JSON.parse(JSON.stringify(board));
        sudokuPuzzle = JSON.parse(JSON.stringify(board));

        let positions = Array.from({length: 81}, (_, i) => i);
        for(let i = positions.length - 1; i > 0; i--) {
            let j = Math.floor(rng() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }
        
        for(let i = 0; i < 45; i++) {
            let r = Math.floor(positions[i]/9);
            let c = positions[i]%9;
            sudokuPuzzle[r][c] = 0;
        }

        currentSudokuState = JSON.parse(JSON.stringify(sudokuPuzzle));
    }

    function createSudokuBoard() {
        const board = document.getElementById('sudoku-board');
        board.innerHTML = ''; 
        for(let r = 0; r < 9; r++) {
            for(let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.classList.add('sudoku-cell');
                cell.setAttribute('id', `sudoku-${r}-${c}`);
                
                if (sudokuPuzzle[r][c] !== 0) {
                    cell.innerText = sudokuPuzzle[r][c];
                    cell.classList.add('fixed');
                } else {
                    cell.onclick = () => selectSudokuCell(r, c);
                }
                board.appendChild(cell);
            }
        }
    }

    function selectSudokuCell(r, c) {
        if (sudokuGameOver || sudokuPuzzle[r][c] !== 0) return;
        
        document.querySelectorAll('.sudoku-cell').forEach(el => el.classList.remove('selected'));
        sudokuSelectedCell = {r, c};
        document.getElementById(`sudoku-${r}-${c}`).classList.add('selected');
    }

    function handleSudokuKeyPress(e) {
        if (sudokuGameOver || !sudokuSelectedCell) return;
        const {r, c} = sudokuSelectedCell;

        if (e.key === 'Backspace' || e.key === 'Delete') {
            updateSudokuCell(r, c, 0);
        } else if (/^[1-9]$/.test(e.key)) {
            updateSudokuCell(r, c, parseInt(e.key));
        }
    }

    function updateSudokuCell(r, c, val) {
        currentSudokuState[r][c] = val;
        const cell = document.getElementById(`sudoku-${r}-${c}`);
        cell.innerText = val === 0 ? '' : val;
        cell.classList.remove('error'); 
        
        checkSudokuWin();
    }

    function checkSudokuWin() {
        let isFull = true;
        let isCorrect = true;
        
        document.querySelectorAll('.sudoku-cell').forEach(el => el.classList.remove('error'));

        for(let r = 0; r < 9; r++) {
            for(let c = 0; c < 9; c++) {
                if (currentSudokuState[r][c] === 0) {
                    isFull = false;
                } else if (currentSudokuState[r][c] !== sudokuSolution[r][c]) {
                    isCorrect = false;
                }
            }
        }

        if (isFull) {
            if (isCorrect) {
                showSudokuMessage("Congratulations! You solved it!");
                sudokuGameOver = true;
                document.querySelectorAll('.sudoku-cell').forEach(el => el.classList.remove('selected'));
            } else {
                showSudokuMessage("Board is full, but there are errors.");
                for(let r = 0; r < 9; r++) {
                    for(let c = 0; c < 9; c++) {
                        if (currentSudokuState[r][c] !== 0 && currentSudokuState[r][c] !== sudokuSolution[r][c]) {
                            document.getElementById(`sudoku-${r}-${c}`).classList.add('error');
                        }
                    }
                }
            }
        }
    }

    function showSudokuMessage(msg) {
        const msgDiv = document.getElementById('sudoku-message');
        msgDiv.innerText = msg;
        setTimeout(() => { 
            if (!sudokuGameOver) msgDiv.innerText = ''; 
        }, 3000);
    }

    function handleKeyPress(e) {
        if (document.getElementById('wordle').classList.contains('active')) {
            handleWordleKeyPress(e);
        } else if (document.getElementById('sudoku').classList.contains('active')) {
            handleSudokuKeyPress(e);
        }
    }

    init();
}
