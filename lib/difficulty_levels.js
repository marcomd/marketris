import { tetrominoes } from './tetrominoes.js';

export const difficultyLevels = {
  0: { speed: 600, maxTetrominoes: 6, name: 'easy' },
  1: { speed: 450, maxTetrominoes: 6, name: 'normal' },
  2: { speed: 250, maxTetrominoes: 6, name: 'hard' },
  3: { speed: 200, maxTetrominoes: tetrominoes.length - 1, name: 'nightmare' },
  4: { speed: 150, maxTetrominoes: tetrominoes.length, name: 'hell' },
}