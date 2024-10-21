import { tetrominoes } from './tetrominoes.js';

export const difficultyLevels = {
  0: { speed: 600, maxTetrominoes: 6, name: 'easy' },
  1: { speed: 450, maxTetrominoes: 6, name: 'normal' },
  2: { speed: 300, maxTetrominoes: 6, name: 'hard' },
  3: { speed: 250, maxTetrominoes: tetrominoes.length, name: 'nightmare' },
  4: { speed: 200, maxTetrominoes: tetrominoes.length, name: 'hell' },
}