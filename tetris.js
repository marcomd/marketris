// --------------------------------
// Marketris - The clone game in JavaScript made by @marcomd
// --------------------------------

import { tetrominoes } from './lib/tetrominoes.js';
import { tetrominoColors } from './lib/tetromino_colors.js';
import { difficultyLevels } from './lib/difficulty_levels.js';
import { loadConfig, getConfig } from './config.js';
import { printDebug } from './lib/utility.js';


const tetrisCanvas = document.getElementById('tetris');
const tetrisCtx = tetrisCanvas.getContext('2d');
const nextCanvas = document.getElementById('next-tetromino');
const nextCtx = nextCanvas.getContext('2d');
// Font used for the HUD is "Press Start 2P" loaded from Google Fonts by the CSS file

// Global variables
let gameover = true;
let startgame = true;
let blocksize;
let startingBoardTop;
let debug;
let currentDifficulty = 0;
let requiredCompletedRowsToNextLevel;
let completedRowsToNextLevel = 0; // Number of completed rows to reach the next level
let maxTetrominoes;
let score = 0;
let boardColumns;
let startingBoardRow;
let boardRows;
let speed;
let timerId;
const board = [];

// ---- Current tetromino info ----
let nextShapeIndex; // Index of the next tetromino to show preview on the HUD
let currentShapeIndex;
let currentTetromino;
// Current position of the tetromino
// 0 = vertical, 1 = horizontal
let currentRotation = 0;
// Current position X of the tetromino
let currentX;
// Current position Y of the tetromino
let currentY;
// --------------------------------


// Global variables initialization, game setup and start
loadConfig().then(_ => {
  const config = getConfig();

  printDebug('Setting config...');
  // Assign values of configuration variables
  blocksize = config.blocksize; // Size of each block in pixels
  startingBoardTop = blocksize;
  tetrisCanvas.width = blocksize * 10;
  tetrisCanvas.height = (blocksize * 20) + startingBoardTop;
  debug = config.debug;
  // Starting difficulty level (0 = easy, 1 = normal, etc.)
  currentDifficulty = config.currentDifficulty;
  requiredCompletedRowsToNextLevel = config.requiredCompletedRowsToNextLevel; // Number of completed rows to reach the next level
  // Difficulty set the number of tetrominoes, hard level will have all tetrominoes
  maxTetrominoes = difficultyLevels[currentDifficulty].maxTetrominoes;

  // Game board
  boardRows = config.boardRows;
  startingBoardRow = config.startingBoardRow;
  boardColumns = config.boardColumns;
  initializeBoard(board, boardRows, boardColumns);

  // Speed settings
  speed = difficultyLevels[currentDifficulty].speed;
});

function initializeBoard(board, boardRows, boardColumns) {
  // Initialize the board (n rows x n columns)
  // 0 = empty cell, 1 = filled cell
  for (let i = 0; i < boardRows; i++) {
    board[i] = new Array(boardColumns).fill(0);
  }

  return board;
}

// Setup initial variables and start the game
function startGame() {
  printDebug('Starting game...');

  gameover = false;
  startgame = false;
  score = 0;
  completedRowsToNextLevel = 0;
  currentDifficulty = 0;
  setDifficulty(currentDifficulty);
  createTetromino();
  draw();
}

// Set the current level of the game
function setDifficulty(level) {
  currentDifficulty = level;

  printDebug('Setting difficulty level to ' + difficultyLevels[currentDifficulty].name);

  maxTetrominoes = difficultyLevels[currentDifficulty].maxTetrominoes;
  speed = difficultyLevels[currentDifficulty].speed;
  clearInterval(timerId);
  // Timer for falling tetrominoes
  timerId = setInterval(moveTetrominoDown, speed);
}

// Update the score on the HUD
function updateScore(value) {
  score += value;

  tetrisCtx.clearRect(0, 0, tetrisCanvas.width, blocksize);
  tetrisCtx.font = '16px "Press Start 2P"';
  tetrisCtx.fillStyle = 'white';
  tetrisCtx.fillText('SCORE: ' + score, 10, 20);
}

// Create a new tetromino
function createTetromino() {
  if (gameover) {
    return;
  }

  currentRotation = 0;

  currentShapeIndex = nextShapeIndex !== undefined ? nextShapeIndex : Math.floor(Math.random() * maxTetrominoes);
  nextShapeIndex = Math.floor(Math.random() * maxTetrominoes);

  printDebug(`Creating new tetromino ${currentShapeIndex} (next will be ${nextShapeIndex})`);

  currentTetromino = generateTetromino(currentShapeIndex);
  currentX = 4; // Centered horizontally
  currentY = startingBoardRow; // Top of the board

  updateNextTetrominoDisplay()
}

function generateTetromino(index, rotation = 0) {
  return tetrominoes[index][rotation];
}

function updateNextTetrominoDisplay() {
  // Clear the next tetromino canvas
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);

  drawTetromino({ shapeIndex: nextShapeIndex, x: 1, y: 1, ctx: nextCtx, rotation: 0 });
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

      printDebug('Completed row! Score: ' + score);

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
        tetrisCtx.fillStyle = 'blue';
        tetrisCtx.fillRect(x * blocksize, y * blocksize, blocksize, blocksize);
        // Draw grid lines
        tetrisCtx.strokeStyle = 'black';
        tetrisCtx.strokeRect(x * blocksize, y * blocksize, blocksize, blocksize);
      } else if (board[y][x] === 2) {
        // White color for completed rows
        tetrisCtx.fillStyle = 'white';
        tetrisCtx.fillRect(x * blocksize, y * blocksize, blocksize, blocksize);
        // Draw grid lines
        tetrisCtx.strokeStyle = 'black';
        tetrisCtx.strokeRect(x * blocksize, y * blocksize, blocksize, blocksize);
      }
    }
  }

  drawTetromino({ shapeIndex: currentShapeIndex, x: currentX, y: currentY, ctx: tetrisCtx, rotation: currentRotation });
  requestAnimationFrame(draw);
}

function clearGameCanvas() {
  tetrisCtx.clearRect(0, startingBoardTop, tetrisCanvas.width, tetrisCanvas.height + startingBoardTop);
}

function drawTetromino({ shapeIndex, x, y, rotation, ctx }) {
  if (!startgame && gameover) {
    return;
  }

  const tetromino = generateTetromino(shapeIndex, rotation);

  for (let i = 0; i < tetromino.length; i++) {
    for (let j = 0; j < tetromino[i].length; j++) {
      if (tetromino[i][j] === 1) {
        ctx.fillStyle = tetrominoColors[shapeIndex];
        ctx.fillRect((x + j) * blocksize, (y + i) * blocksize, blocksize, blocksize);
        // Draw grid lines
        ctx.strokeStyle = 'black';
        ctx.strokeRect((x + j) * blocksize, (y + i) * blocksize, blocksize, blocksize);
      }
    }
  }
}

function drawStartScreen() {
  tetrisCtx.font = '20px "Press Start 2P"';
  tetrisCtx.fillStyle = 'white';
  tetrisCtx.fillText('MARKETRIS', blocksize * 2, tetrisCanvas.height / 2 - blocksize * 2);
  tetrisCtx.fillText('Press F1', blocksize * 2, tetrisCanvas.height / 2 - blocksize);

  // Draw some static tetrominoes at default rotation
  drawTetromino({ shapeIndex: 4, x: 1, y: 1, ctx: tetrisCtx, rotation: 0 });
  drawTetromino({ shapeIndex: 6, x: 6, y: 17, ctx: tetrisCtx, rotation: 0 });
}

function gameOver() {
  gameover = true;
  clearInterval(timerId);
  // tetrisCtx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
  clearGameCanvas();
  currentTetromino = null;

  // Clear the board
  for (let i = 0; i < boardRows; i++) {
    board[i] = new Array(boardColumns).fill(0);
  }

  tetrisCtx.font = '20px "Press Start 2P"';
  tetrisCtx.fillStyle = 'white';
  tetrisCtx.fillText('GAME OVER!', blocksize * 2, tetrisCanvas.height / 2 - blocksize * 2);
  tetrisCtx.fillText('F1 to restart', blocksize, tetrisCanvas.height / 2 - blocksize);

  // Clear the next tetromino canvas
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
}

// Wait for the font to be loaded before starting the game
setTimeout(_ => {
  drawStartScreen()

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

  printDebug('Ready player one!')
}, 1000);