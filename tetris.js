// --------------------------------
// Marketris - The clone game in JavaScript made by @marcomd
// --------------------------------

import { tetrominoes } from './lib/tetrominoes.js';
import { tetrominoColors } from './lib/tetromino_colors.js';
import { difficultyLevels } from './lib/difficulty_levels.js';
import { loadConfig, getConfig } from './config.js';
import { printDebug, addLogMessage } from './lib/utility.js';


const tetrisCanvas = document.getElementById('tetris');
const tetrisCtx = tetrisCanvas.getContext('2d');
const nextCanvas = document.getElementById('next-tetromino');
const nextCtx = nextCanvas.getContext('2d');
// Font used for the HUD is "Press Start 2P" loaded from Google Fonts by the CSS file

// Global variables
let gameover = true;
let gameStarted = false;
let blocksize;
let startingBoardTop;
let debug;
let startingDifficulty;
let currentDifficulty;
let completedRowsToNextLevel = 0; // Number of completed rows to reach the next level
let fromTetromino;
let toTetromino;
let score = 0;
let boardColumns;
let startingBoardRow;
let boardRows;
let speed;
let timerId;
let music = new Audio(`assets/music/level_0.mp3`);
let soundEffectLevel;
let gameoverSfx = new Audio('assets/sfx/gameover.mp3');
const board = [];

// ---- Current tetromino info ----
let nextShapeIndex; // Index of the next tetromino to show preview on the HUD
let currentShapeIndex;
let currentTetromino;
let currentRotation = 0;
let currentX; // Current position X of the tetromino
let currentY; // Current position Y of the tetromino
// --------------------------------

// ---- Controls ----
let touchStartX = 0;
let touchStartY = 0;

// Global variables initialization, game setup and start
loadConfig().then(_ => {
  const config = getConfig();

  printDebug('Setting config...');

  // Game board
  boardRows = config.boardRows;
  startingBoardRow = config.startingBoardRow;
  boardColumns = config.boardColumns;
  // Assign values of configuration variables
  blocksize = config.blocksize; // Size of each block in pixels
  startingBoardTop = blocksize;
  tetrisCanvas.width = blocksize * boardColumns;
  tetrisCanvas.height = (blocksize * boardRows);
  nextCanvas.width = blocksize * 5;
  nextCanvas.height = blocksize * 6;

  debug = config.debug;
  // Starting difficulty level (0 = easy, 1 = normal, etc.)
  startingDifficulty = config.startingDifficulty;

  if (difficultyLevels[startingDifficulty].sfx) {
    soundEffectLevel = new Audio(`assets/sfx/level_${startingDifficulty}.mp3`);
  }

  initializeBoard(board, boardRows, boardColumns);
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
  gameStarted = true;
  score = 0;
  completedRowsToNextLevel = 0;
  currentDifficulty = startingDifficulty;
  setDifficulty(currentDifficulty);
  createTetromino();
  draw();
}

// Set the current level of the game
function setDifficulty(level) {
  currentDifficulty = level;

  printDebug(`Setting difficulty level to ${difficultyLevels[currentDifficulty].name} (bonus x${currentDifficulty + 1})`);
  addLogMessage(`Level ${difficultyLevels[currentDifficulty].name}!`);

  fromTetromino = difficultyLevels[currentDifficulty].fromTetromino;
  toTetromino = difficultyLevels[currentDifficulty].toTetromino;
  speed = difficultyLevels[currentDifficulty].speed;

  if (difficultyLevels[currentDifficulty].music) {
    music && music.pause(); // Stop the current music if it is playing
    music = new Audio(`assets/music/level_${currentDifficulty}.mp3`);
    music.loop = true;
    music.play();
  }

  if (difficultyLevels[currentDifficulty].sfx) {
    soundEffectLevel = new Audio(`assets/sfx/level_${currentDifficulty}.mp3`);
    soundEffectLevel.play();
  }

  // Preload the next level music&sfx if expected
  if (difficultyLevels[currentDifficulty + 1]?.music) {
    new Audio(`assets/music/level_${currentDifficulty + 1}.mp3`);
  }

  if (difficultyLevels[currentDifficulty + 1]?.sfx) {
    new Audio(`assets/sfx/level_${currentDifficulty + 1}.mp3`);
  }


  clearInterval(timerId);
  // Timer for falling tetrominoes
  timerId = setInterval(moveTetrominoDown, speed);
}

// Update the score on the HUD
function updateScore(value, bonusMultiplier = 1) {
  score += value;

  tetrisCtx.clearRect(0, 0, tetrisCanvas.width, blocksize);
  tetrisCtx.font = '16px "Press Start 2P"';
  tetrisCtx.fillStyle = 'white';
  tetrisCtx.fillText(`SCORE: ${score}${bonusMultiplier > 1 ? ` x${bonusMultiplier}` : ''}`, 10, 20);
}

// Create a new tetromino
function createTetromino() {
  if (gameover) {
    return;
  }

  currentRotation = 0;

  currentShapeIndex = nextShapeIndex !== undefined ? nextShapeIndex : generateTetrominoIndex();
  // Calculate the index randomly but from a range of tetrominoes
  nextShapeIndex = generateTetrominoIndex();

  //printDebug(`Creating new tetromino ${currentShapeIndex} (next will be ${nextShapeIndex})`);

  currentTetromino = generateTetromino(currentShapeIndex);
  currentX = 4; // Centered horizontally
  currentY = startingBoardRow; // Top of the board

  updateNextTetrominoDisplay()
}

// Generate a random tetromino index from a range
function generateTetrominoIndex() {
  return Math.floor(Math.random() * (toTetromino - fromTetromino + 1)) + fromTetromino
}

// Return the tetromino shape based on the index and rotation
function generateTetromino(index, rotation = 0) {
  return tetrominoes[index][rotation];
}

// Update the next tetromino display on the HUD
function updateNextTetrominoDisplay() {
  // Clear the next tetromino canvas
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);

  drawTetromino({ shapeIndex: nextShapeIndex, x: 1, y: 1, ctx: nextCtx, rotation: 0 });
}

function rotateTetromino() {
  if (gameover) {
    return;
  }

  // Calculate the new rotation for the current shape
  const newRotation = (currentRotation + 1) % tetrominoes[currentShapeIndex].length;
  // Get the new tetromino (each shape has rotations and each rotation is a new tetromino)
  const newTetromino = generateTetromino(currentShapeIndex, newRotation);

  // Check if the tetromino can rotate
  if (!isValidMove(currentX, currentY, newTetromino)) {
    return;
  }

  // Rotate the tetromino
  currentRotation = newRotation;
  currentTetromino = newTetromino;
}

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
  let bonusMultiplier = 0;

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

      bonusMultiplier++;
      const rowScore = 10 * bonusMultiplier * (currentDifficulty + 1);
      // Increment the score based on the current difficulty level
      updateScore(rowScore, bonusMultiplier);

      // If the bonus multiplier is greater than 1, print the score with the multiplier popping up from the completed rows
      if (bonusMultiplier > 1) {
        setTimeout(() => {
          updateScore(0);
        }, 1000);
      }

      printDebug(`Completed row! Added ${rowScore} (${bonusMultiplier}x multiple row) (${currentDifficulty + 1}x difficulty) to score, now is ${score}`);
      if (bonusMultiplier > 1) {
        addLogMessage(`Bonus ${bonusMultiplier}x`);
      }

      // Increment the number of completed rows
      completedRowsToNextLevel++;

      if (completedRowsToNextLevel >= difficultyLevels[currentDifficulty].linesToNextLevel) {
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
        drawTile(x, y, ['#00f', '#00a'], tetrisCtx);
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

function drawTile(x, y, colors, ctx) {
  // Create a linear gradient
  const xPos = x * blocksize;
  const yPos = y * blocksize;
  let gradient = tetrisCtx.createLinearGradient(xPos, yPos, xPos + 10, yPos + 10);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]); // Adjust this color for the desired effect
  // Draw the block with the gradient
  ctx.fillStyle = gradient;
  ctx.fillRect(xPos, yPos, blocksize, blocksize);
  // Draw grid lines
  ctx.strokeStyle = 'black';
  ctx.strokeRect(xPos, yPos, blocksize, blocksize);
}

function clearGameCanvas() {
  tetrisCtx.clearRect(0, startingBoardTop, tetrisCanvas.width, tetrisCanvas.height + startingBoardTop);
}

function drawTetromino({ shapeIndex, x, y, rotation, ctx }) {
  if (gameStarted && gameover) {
    return;
  }

  const tetromino = generateTetromino(shapeIndex, rotation);

  for (let i = 0; i < tetromino.length; i++) {
    for (let j = 0; j < tetromino[i].length; j++) {
      if (tetromino[i][j] === 1) {
        drawTile(x + j, y + i, tetrominoColors[shapeIndex], ctx)
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

  music.pause();
  gameoverSfx.play();

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
      if (!gameStarted || gameover) {
        startGame();
      }
    }
  });

  printDebug('Ready player one!')
}, 1000);

// addLogMessage(`Bonus 13452x`);

tetrisCanvas.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;

  if (!gameStarted || gameover) {
    startGame();
  }
});

tetrisCanvas.addEventListener('touchmove', (e) => {
  e.preventDefault(); // Prevent scrolling
});

tetrisCanvas.addEventListener('touchend', (e) => {
  const touch = e.changedTouches[0];
  const touchEndX = touch.clientX;
  const touchEndY = touch.clientY;

  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;

  if (Math.abs(diffX) > Math.abs(diffY)) {
    if (diffX > 0) {
      moveTetrominoRight();
    } else {
      moveTetrominoLeft();
    }
  } else {
    if (diffY > 0) {
      moveTetrominoDown();
    } else {
      rotateTetromino();
    }
  }
});