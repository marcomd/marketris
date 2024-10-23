import { tetrominoes } from './tetrominoes.js';

export const difficultyLevels = {
  0: { speed: 600, linesToNextLevel: 4, fromTetromino: 0, toTetromino: 6, name: 'Easy', music: true, sfx: false },
  1: { speed: 450, linesToNextLevel: 4, fromTetromino: 0, toTetromino: 6, name: 'Normal', music: true, sfx: false },
  2: { speed: 300, linesToNextLevel: 4, fromTetromino: 0, toTetromino: 6, name: 'Hard', music: true, sfx: false },
  3: { speed: 250, linesToNextLevel: 4, fromTetromino: 0, toTetromino: 8, name: 'Nightmare', music: true, sfx: false },
  4: { speed: 200, linesToNextLevel: 8, fromTetromino: 0, toTetromino: 8, name: 'Hell', music: false, sfx: true },
  5: { speed: 150, linesToNextLevel: 0, fromTetromino: 0, toTetromino: 9, name: 'Apocalypse', music: true, sfx: false },
}