// --------------------------------
// Marketris - The clone game in JavaScript made by @marcomd
// --------------------------------

const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');

const blocksize = 30; // Size of each block in pixels
const startingBoardTop = blocksize;
canvas.width = blocksize * 10;
canvas.height = (blocksize * 20) + startingBoardTop;
const debug = false;
let gameover = true;
let startgame = true;

// Set the font for the HUD
ctx.font = '20px "Press Start 2P"';

ctx.fillStyle = 'white';
ctx.fillText('.', blocksize, canvas.height);

// Starting difficulty level (0 = easy, 1 = normal, etc.)
let currentDifficulty = 0;

const requiredCompletedRowsToNextLevel = 2; // Number of completed rows to reach the next level
let completedRowsToNextLevel = 0; // Number of completed rows to reach the next level

if (debug)
  console.log('Loading...')

// Tetrominoes
const tetrominoes = [
  // 0. I-Shape
  [
    // Vertical I-Tetromino
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0]
    ],
    // Horizontal I-Tetromino
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]
  ],
  // 1. J-Shape
  [
    // Top J-Tetromino
    [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0]
    ],
    // Right J-Tetromino
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    // Bottom J-Tetromino
    [
      [0, 1, 1],
      [0, 1, 0],
      [0, 1, 0]
    ],
    // Left J-Tetromino
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1]
    ]
  ],
  // 2. L-Shape
  [
    // Top L-Tetromino
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1]
    ],
    // Right L-Tetromino
    [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0]
    ],
    // Bottom L-Tetromino
    [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0]
    ],
    // Left L-Tetromino
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ]
  ],
  // 3. O-Shape
  [
    // O-Tetromino
    [
      [1, 1],
      [1, 1]
    ],
  ],
  // 4. S-Shape
  [
    // Vertical S-Tetromino
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    // Horizontal S-Tetromino
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1]
    ]
  ],
  // 5. T-Shape
  [
    // Top T-Tetromino
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    // Right T-Tetromino
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0]
    ],
    // Bottom T-Tetromino
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0]
    ],
    // Left T-Tetromino
    [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0]
    ]
  ],
  // 6. Z-Shape
  [
    // Vertical Z-Tetromino
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    // Horizontal Z-Tetromino
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0]
    ]
  ],
  // 7. Nightmare big L shape
  [
    // Top L-Tetromino
    [
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 1]
    ],
    // Right L-Tetromino
    [
      [1, 1, 1],
      [1, 0, 0],
      [1, 0, 0]
    ],
    // Bottom L-Tetromino
    [
      [1, 1, 1],
      [0, 0, 1],
      [0, 0, 1]
    ],
    // Left L-Tetromino
    [
      [0, 0, 1],
      [0, 0, 1],
      [1, 1, 1]
    ]
  ],
  // 8. Hell tetromino cross shape
  [
    // Hell tetromino
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0]
    ],
  ]
];

// Each tetromino has an own color
const tetrominoColors = [
  'red',
  'gold',
  'orange',
  'yellow',
  'green',
  'cyan',
  'pink',
  'brown',
  'purple'
];

const difficultyLevels = {
  0: { speed: 600, maxTetrominoes: 6, name: 'easy' },
  1: { speed: 450, maxTetrominoes: 6, name: 'normal' },
  2: { speed: 250, maxTetrominoes: 6, name: 'hard' },
  3: { speed: 200, maxTetrominoes: tetrominoes.length - 1, name: 'nightmare' },
  4: { speed: 150, maxTetrominoes: tetrominoes.length, name: 'hell' },
}

// Difficulty set the number of tetrominoes, hard level will have all tetrominoes
let maxTetrominoes = difficultyLevels[currentDifficulty].maxTetrominoes;

// Game board
const board = [];
let score = 0;

const boardColumns = 10;
const startingBoardRow = 1;
const boardRows = 20 + startingBoardRow;
// const endingBoardRow = boardRows + startingBoardRow;

// Initialize the board (20 rows x 10 columns)
// 0 = empty cell, 1 = filled cell
for (let i = 0; i < boardRows; i++) {
  board[i] = new Array(boardColumns).fill(0);
}

// Current tetromino
let currentShapeIndex = null;
let currentTetromino = null;

// Current position of the tetromino
// 0 = vertical, 1 = horizontal
let currentRotation = 0;

// Current position X of the tetromino
let currentX = null;

// Current position Y of the tetromino
let currentY = null;

// Speed settings
let speed = difficultyLevels[currentDifficulty].speed;
let timerId = null;

// Setup initial variables and start the game
function startGame() {
  if (debug)
    console.log('Starting game...');

  gameover = false;
  startgame = false;
  score = 0;
  completedRowsToNextLevel = 0;
  setDifficulty(currentDifficulty);
  createTetromino();
  draw();
}

// Set the current level of the game
function setDifficulty(level) {
  currentDifficulty = level;

  if (debug)
    console.log('setDifficulty > currentDifficulty', currentDifficulty);

  maxTetrominoes = difficultyLevels[currentDifficulty].maxTetrominoes;
  speed = difficultyLevels[currentDifficulty].speed;
  clearInterval(timerId);
  // Timer for falling tetrominoes
  timerId = setInterval(moveTetrominoDown, speed);
}

// Update the score on the HUD
function updateScore(value) {
  score += value;

  ctx.clearRect(0, 0, canvas.width, blocksize);
  ctx.font = '20px "Press Start 2P"';
  ctx.fillStyle = 'white';
  ctx.fillText('SCORE: ' + score, 10, 20);
}

// Create a new tetromino
function createTetromino() {
  if (gameover) {
    return;
  }

  currentRotation = 0;
  currentShapeIndex = Math.floor(Math.random() * maxTetrominoes);

  if (debug)
    console.log('createTetromino > currentShapeIndex', currentShapeIndex);

  currentTetromino = tetrominoes[currentShapeIndex][currentRotation];
  currentX = 4; // Centered horizontally
  currentY = startingBoardRow; // Top of the board
}

// Rotate the tetromino
function rotateTetromino() {
  if (gameover) {
    return;
  }

  // Calculate the new rotation for the current shape
  const newRotation = (currentRotation + 1) % tetrominoes[currentShapeIndex].length;
  // Get the new tetromino (each shape has rotations and each rotation is a new tetromino)
  const newTetromino = tetrominoes[currentShapeIndex][newRotation];

  // Check if the tetromino can rotate
  if (!isValidMove(currentX, currentY, newTetromino)) {
    return;
  }

  // Rotate the tetromino
  currentRotation = newRotation;
  currentTetromino = newTetromino;
}

// Move the tetromino down
function moveTetrominoDown() {
  if (gameover) {
    return;
  }

  // Check if the tetromino can move down
  if (!isValidMove(currentX, currentY + 1, currentTetromino)) {
    // Freeze the tetromino if it can't move down
    freezeTetromino();
    return;
  }

  // Move the tetromino down
  currentY++;
}

function moveTetrominoLeft() {
  if (gameover) {
    return;
  }

  // Check if the tetromino can move left
  if (isValidMove(currentX - 1, currentY, currentTetromino)) {
    // Move the tetromino left
    currentX--;
  }
}

function moveTetrominoRight() {
  if (gameover) {
    return;
  }

  // Check if the tetromino can move right
  if (isValidMove(currentX + 1, currentY, currentTetromino)) {
    // Move the tetromino right
    currentX++;
  }
}

function isValidMove(x, y, tetromino) {
  // Check if the tetromino is inside the board and not colliding with other tetrominoes
  for (let i = 0; i < tetromino.length; i++) {
    for (let j = 0; j < tetromino[i].length; j++) {
      if (tetromino[i][j] === 1) {
        const newY = y + i;
        const newX = x + j;
        if (newX < 0 || newX >= boardColumns || newY >= boardRows || board[newY][newX] === 1) {
          return false;
        }
      }
    }
  }

  return true;
}

function freezeTetromino() {
  // Check if the game is over
  if (currentY === startingBoardRow) {
    gameOver();
    return;
  }

  // Freeze the tetromino on the board
  for (let i = 0; i < currentTetromino.length; i++) {
    for (let j = 0; j < currentTetromino[i].length; j++) {
      if (currentTetromino[i][j] === 1) {
        board[currentY + i][currentX + j] = 1;
      }
    }
  }

  // Check for completed rows
  checkForCompletedRows();

  createTetromino();
}

function checkForCompletedRows() {
  // Check if there are completed rows in all the board
  for (let i = startingBoardRow; i < boardRows; i++) {
    // Check if the row is completed
    if (board[i].every(cell => cell === 1)) {
      // Mark the completed row with a specific value on the board so we can highlight it...
      for (let j = startingBoardRow; j < board[i].length; j++) {
        board[i][j] = 2;
      }

      // ...and then remove it with an animation
      setTimeout(() => {
        board.splice(i, 1);
        board.unshift(new Array(boardColumns).fill(0));
      }, 100);

      // Increment the score based on the current difficulty level
      updateScore(10 * (currentDifficulty + 1));

      if (debug)
        console.log('checkForCompletedRows > score', score);

      // Increment the number of completed rows
      completedRowsToNextLevel++;

      if (completedRowsToNextLevel === requiredCompletedRowsToNextLevel) {
        // Increment the difficulty level
        if (currentDifficulty < Object.keys(difficultyLevels).length - 1) {
          setDifficulty(currentDifficulty + 1);
        }
        completedRowsToNextLevel = 0;
      }
    }
  }
}

function draw() {
  if (gameover) {
    return;
  }

  if (score === 0) {
    updateScore(0); // Setup the HUD and update the text with the loaded font as soon as available
  }
  clearGameCanvas();

  for (let y = startingBoardRow; y < boardRows; y++) {
    for (let x = 0; x < boardColumns; x++) {
      if (board[y][x] === 1) {
        // Color the tetromino cells on the board
        ctx.fillStyle = 'blue';
        ctx.fillRect(x * blocksize, y * blocksize, blocksize, blocksize);
      } else if (board[y][x] === 2) {
        // White color for completed rows
        ctx.fillStyle = 'white';
        ctx.fillRect(x * blocksize, y * blocksize, blocksize, blocksize);
      }
    }
  }

  drawTetromino();
  requestAnimationFrame(draw);
}

function clearGameCanvas() {
  ctx.clearRect(0, startingBoardTop, canvas.width, canvas.height + startingBoardTop);
}

function drawTetromino() {
  if (!startgame && gameover) {
    return;
  }

  for (let i = 0; i < currentTetromino.length; i++) {
    for (let j = 0; j < currentTetromino[i].length; j++) {
      if (currentTetromino[i][j] === 1) {
        ctx.fillStyle = tetrominoColors[currentShapeIndex];
        ctx.fillRect((currentX + j) * blocksize, (currentY + i) * blocksize, blocksize, blocksize);
      }
    }
  }
}

function drawStartScreen() {
  ctx.font = '20px "Press Start 2P"';
  ctx.fillStyle = 'white';
  ctx.fillText('MARKETRIS', blocksize * 2, canvas.height / 2 - blocksize * 2);
  ctx.fillText('Press F1', blocksize * 2, canvas.height / 2 - blocksize);

  // Draw some static tetrominoes
  currentShapeIndex = 4;
  currentTetromino = tetrominoes[currentShapeIndex][0];
  currentX = 1;
  currentY = 1;
  drawTetromino();

  currentShapeIndex = 6;
  currentTetromino = tetrominoes[currentShapeIndex][0];
  currentX = 6;
  currentY = 17;
  drawTetromino();
}

function gameOver() {
  gameover = true;
  clearInterval(timerId);
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  clearGameCanvas();
  currentTetromino = null;

  // Clear the board
  for (let i = 0; i < boardRows; i++) {
    board[i] = new Array(boardColumns).fill(0);
  }
  // alert('Game Over! Your score is ' + score);

  ctx.font = '20px "Press Start 2P"';
  ctx.fillStyle = 'white';
  ctx.fillText('GAME OVER!', blocksize * 2, canvas.height / 2 - blocksize * 2);
  ctx.fillText('F1 to restart', blocksize, canvas.height / 2 - blocksize);
}

// Keyboard controls
document.addEventListener('keydown', function (e) {
  if (e.key === 'ArrowLeft') {
    moveTetrominoLeft();
  } else if (e.key === 'ArrowRight') {
    moveTetrominoRight();
  } else if (e.key === 'ArrowDown') {
    moveTetrominoDown();
  } else if (e.key === 'ArrowUp') {
    rotateTetromino();
  } else if (e.key === 'F1') {
    if (gameover) {
      startGame();
    }
  }
});

console.log('Ready player one!')

// Wait for the font to be loaded before starting the game
setTimeout(_   => { drawStartScreen() }, 1000);