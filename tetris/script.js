const scoreField = document.getElementById('score');
const cnv = document.getElementById('game');
const ctx = cnv.getContext('2d');

const grid = 32;
let tetrominoSequence = [];

let playfield = [];

for (let row = -2; row < 20; row++) {
  playfield[row] = [];

  for (col of Array(10).keys()) {
    playfield[row][col] = 0;
  }
}

// Формы фигур
const tetrominos = {
  'I': [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  'J': [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  'L': [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  'O': [
    [1, 1],
    [1, 1],
  ],
  'S': [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  'Z': [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  'T': [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ]
};

// цвет каждой фигуры
const colors = {
  'I': 'cyan',
  'J': 'blue',
  'L': 'orange',
  'O': 'yellow',
  'S': 'green',
  'Z': 'red',
  'T': 'purple',
};

const highScoreScope = 'highscore', highLinesScope='highlines';
let count = 0;
let tetromino = getNextTetromino();
let anim = null;
let gameOver = false;
let score = 0;
let lines = 0;
let highScore = localStorage.getItem(highScoreScope) ?? 0;
let highLines = localStorage.getItem(highLinesScope) ?? 0;

const confirmReset = () => {
  const resp = confirm('Вы уверены?');
  if (resp) {
    highLines = 0;
    highScore = 0;
    localStorage.setItem(highLinesScope, 0);
    localStorage.setItem(highScoreScope, 0);
    this.location.reload();
  }
}

const updateScore = () => scoreField.innerHTML = `Лучший результат: ${highScore}<br>Лучшее кол-во линий: ${highLines}
  <br>Ваш счет: ${score}<br>Линии: ${lines}`;
updateScore();

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSequence() {
  const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

  while (sequence.length) {
    const rand = getRandomInt(0, sequence.length - 1);
    const name = sequence.splice(rand, 1)[0];
    tetrominoSequence.push(name);
  }
}

function getNextTetromino() {
    if (tetrominoSequence.length === 0) generateSequence();
    const name = tetrominoSequence.pop();
    const matrix = tetrominos[name];

    const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
     
    // I самая длинная
    const row = name === 'I' ? -1 : -2;

    return {
        name: name,
        matrix: matrix,
        row: row,
        col: col
    };
}

function rotate(matrix) {
  const N = matrix.length - 1;
  const ret = matrix.map((row, i) => 
    row.map((_, j) => matrix[N - j][i])
  );
  
  return ret;
}

function validateMove(matrix, cellRow, cellCol) {
  for (row of Array(matrix.length).keys()) {
    for (col of Array(matrix[row].length).keys()) {
      if (matrix[row][col] && (
          // Выходит ли за границы поля
          cellCol + col < 0
          || cellCol + col >= playfield[0].length
          || cellRow + row >= playfield.length
          // Залезает ли на другие фигуры
          || playfield[cellRow + row][cellCol + col])
       ) return false;
    }
  }

  return true;
}

function placeTetromino() {
  for (row of Array(tetromino.matrix.length).keys()) {
    for (col of Array(tetromino.matrix[row].length).keys()) {
      if (tetromino.matrix[row][col]) {
        if (tetromino.row + row < 0) return showGameOver()
        playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
      }
    } 
  }

  for (let row = playfield.length - 1; row >= 0; ) {
    if (playfield[row].every(cell => !!cell)) {
      for (let r = row; r >= 0; r--) {
        for (let c = 0; c < playfield[r].length; c++) {
          playfield[r][c] = playfield[r-1][c];
          score++;
        }
      }
      lines++;
      highLines = Math.max(highLines, lines);

      if (score > highScore) {
        scoreField.innerHTML = "Новый рекорд!";
        highScore = score;
        setTimeout(_ => updateScore(), 2000);
      } else updateScore();

      localStorage.setItem(highScoreScope, highScore);
      localStorage.setItem(highLinesScope, highLines);
    } else row--;
  }

  tetromino = getNextTetromino();
}

const showGameOver = () => {
  cancelAnimationFrame(anim);
  gameOver = true;
  ctx.fillStyle = 'black';
  ctx.globalAlpha = 1.5;
  ctx.fillRect(0, cnv.height / 2 - 30, cnv.width, 60);
  ctx.globalAlpha = 1.5;
  ctx.fillStyle = 'white';
  ctx.font = '30px Segoe UI';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Вы проиграли!', cnv.width / 2, cnv.height / 2);
  setTimeout(_ => this.location.reload(), 4000);
}

function main() {
  anim = requestAnimationFrame(main);
  ctx.clearRect(0, 0, cnv.width, cnv.height);

  for (row of Array(20).keys()) {
    for (col of Array(10).keys()) {
      if (playfield[row][col]) {
        const name = playfield[row][col];
        ctx.fillStyle = colors[name];

        ctx.fillRect(col * grid, row * grid, grid-1, grid-1);
      }
    }
  }

  if (!tetromino) return

  if (++count > 35) {
    tetromino.row++;
    count = 0;

    if (!validateMove(tetromino.matrix, tetromino.row, tetromino.col)) {
      tetromino.row--;
      placeTetromino();
    }
  }

  ctx.fillStyle = colors[tetromino.name];

  for (row of Array(tetromino.matrix.length).keys()) {
    for (col of Array(tetromino.matrix[row].length).keys()) {
      if (tetromino.matrix[row][col]) {
        ctx.fillRect((tetromino.col + col) * grid,
          (tetromino.row + row) * grid,
            grid-1, grid-1);
      }
    }
  }
}

document.addEventListener('keydown', ev => {
  if (gameOver) return;

  switch(ev.keyCode) {
    // Стрелка влево - смещение фигуры
    case 37: {
      const col = tetromino.col - 1; 
      if (validateMove(tetromino.matrix, tetromino.row, col)) tetromino.col = col;
      break;
    }

    // Стрелка вверх - поворот фигуры
    case 38: {
      const matrix = rotate(tetromino.matrix);
      if (validateMove(matrix, tetromino.row, tetromino.col)) tetromino.matrix = matrix;
      break;
    }

    // Стрелка вправо - смещение фигуры
    case 39: {
      const col = tetromino.col + 1; 
      if (validateMove(tetromino.matrix, tetromino.row, col)) tetromino.col = col;
      break;
    }

    // Стрелка вниз - ускорение падения фигуры
    case 40: {
      const row = tetromino.row + 1;
      if(!validateMove(tetromino.matrix, row, tetromino.col)) {
        placeTetromino();
        return;
      }
      tetromino.row = row;
      break;
    }
  }
});

anim = requestAnimationFrame(main);