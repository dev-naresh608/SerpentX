addEventListener("DOMContentLoaded", () => {
  const highScore = getHighScore();
  document.getElementById("highScore").innerText = highScore;

  function getHighScore() {
    return JSON.parse(localStorage.getItem("highScore")) || 0;
  }

  // ! todo Game Sounds:

  const sounds = {
    toggle: new Audio("./sounds/start-pause.wav"),
    move: new Audio("./sounds/move.wav"),
    eat: new Audio("./sounds/eat-small-food.wav"),
    bigEat: new Audio("./sounds/winning-an-extra-bonus.wav"),
    gameOver: new Audio("./sounds/game-over.wav"),
  };

  const volumes = {
    toggle: 0.3,
    move: 0.15,
    eat: 0.35,
    bigEat: 0.45,
    gameOver: 0.5,
  };

  Object.entries(sounds).forEach(([name, audio]) => {
    audio.preload = "auto";
    audio.volume = volumes[name];
  });

  function playSound(name) {
    const audio = sounds[name];
    if (!audio) return;

    // Restart short effects if triggered again.
    audio.pause();
    audio.currentTime = 0;

    audio.play().catch((error) => {
      console.warn(`Could not play ${name} sound:`, error);
    });
  }

  const modal = document.querySelector(".modal");

  const board = document.querySelector(".board");
  const scoreElement = document.getElementById("score");
  const timer = document.getElementById("time");
  let minutes = 0;
  let seconds = 0;
  let score = 0;
  let intervalId = null;
  let timeInterVal = null;

  let isBigFood = false;
  let foodEatCount = 0;
  let foodCoords = {};

  // let headCoords = {};
  let head = null;

  let blocks = [];
  let row = 0;
  let col = 0;
  let isGameRunning = false;
  // ! Default snake position & direction.
  let direction = "right";
  let snake = [
    {
      x: 1,
      y: 3,
    },
  ];

  // todo run-pause game when space bar hit.
  spaceBar = addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      modal.style.display = "none";
      isGameRunning = isGameRunning ? false : true;
      playSound("toggle");
      if (isGameRunning) {
        console.log("Game Started");
        timeInterVal = setInterval(gamePlayTime, 1000);
        intervalId = setInterval(() => {
          runSnake(direction);
          renderSnake();
        }, 100);
      } else {
        modal.style.display = "flex";
        console.log("Game Stoped");

        clearInterval(intervalId);
        clearInterval(timeInterVal);
      }
    }
  });

  // todo: Generate Blocks as per screen.
  generateBlocks();
  function generateBlocks() {
    const blockHeight = 20;
    const blockWidth = 20;

    const rows = Math.floor(board.clientHeight / blockHeight);
    const cols = Math.floor(board.clientWidth / blockWidth);

    for (row = 0; row < rows; row++) {
      for (col = 0; col < cols; col++) {
        const block = document.createElement("div");
        block.classList.add("block");
        // block.innerText = `${row}-${col}`;
        board.appendChild(block);
        blocks[`${row}-${col}`] = block;
      }
    }
    row -= 1;
    col -= 1;
  }

  // todo change direction of snake as per hit keys.
  dir = addEventListener("keydown", (e) => {
    // if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
    //   direction = "down";
    // } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
    //   direction = "up";
    // } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
    //   direction = "left";
    // } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
    //   direction = "right";
    // }

    addEventListener("keydown", (e) => {
      const directions = {
        ArrowDown: "down",
        s: "down",
        S: "down",
        ArrowUp: "up",
        w: "up",
        W: "up",
        ArrowLeft: "left",
        a: "left",
        A: "left",
        ArrowRight: "right",
        d: "right",
        D: "right",
      };

      const nextDirection = directions[e.key];

      if (!nextDirection || nextDirection === direction) return;

      direction = nextDirection;
      playSound("move");
    });
  });

  // todo Render Snack.
  renderSnake();
  function renderSnake() {
    try {
      snake.forEach((sagment) => {
        if ((foodEatCount - 1) % 6 == 0 && foodEatCount !== 1) {
          blocks[`${sagment.x}-${sagment.y}`].classList.add("happy-snake");
        } else {
          blocks[`${sagment.x}-${sagment.y}`].classList.add("snake");
        }
      });

      if (direction === "left") {
        blocks[`${snake[0].x}-${snake[0].y}`].classList.add("left-head");
      } else if (direction === "right") {
        blocks[`${snake[0].x}-${snake[0].y}`].classList.add("right-head");
      } else if (direction === "down") {
        blocks[`${snake[0].x}-${snake[0].y}`].classList.add("down-head");
      } else if (direction === "up") {
        blocks[`${snake[0].x}-${snake[0].y}`].classList.add("up-head");
      }

      if (snake.length > 1) {
        blocks[
          `${snake[snake.length - 1].x}-${snake[snake.length - 1].y}`
        ].classList.add("tail");
      }
    } catch (err) {
      console.log("E in rendor snake: ", err);
    }
  }

  // todo Run Snack with its prev direction.
  function runSnake(direction) {
    try {
      if (direction === "left") {
        head = { x: snake[0].x, y: snake[0].y - 1 };
      } else if (direction === "right") {
        head = { x: snake[0].x, y: snake[0].y + 1 };
      } else if (direction === "down") {
        head = { x: snake[0].x + 1, y: snake[0].y };
      } else if (direction === "up") {
        head = { x: snake[0].x - 1, y: snake[0].y };
      }

      // ! SNAKE BITE ITSELT:
      headCoords = { x: head.x, y: head.y };
      isSnakeBiteItself();
      function isSnakeBiteItself() {
        if (snake.length > 4) {
          for (let i = 1; i < snake.length; i++) {
            if (snake[i].x == headCoords.x && snake[i].y == headCoords.y) {
              looseGame();
            }
          }
        }
      }

      // ! Show Snake Running
      snake.forEach((sagment) => {
        if ((foodEatCount - 1) % 6 == 0 && foodEatCount !== 1) {
          blocks[`${sagment.x}-${sagment.y}`].classList.remove("happy-snake");
        }
        blocks[`${sagment.x}-${sagment.y}`].classList.remove("snake");
      });
      blocks[`${snake[0].x}-${snake[0].y}`].className = "block";
      if (snake.length > 1) {
        blocks[
          `${snake[snake.length - 1].x}-${snake[snake.length - 1].y}`
        ].classList.remove("tail");
      }
      snake.unshift(head);
      snake.pop();

      // ! Check is snake Consume Food or What !!
      // if (head.x === foodCoords.x && head.y === foodCoords.y) {
      //   score++;
      //   changeScore();
      //   snake.push(foodCoords);
      //   foodEatCount++;
      //   removePrevFood();
      //   generateFood();
      // }

      if (head.x === foodCoords.x && head.y === foodCoords.y) {
        const ateBigFood = isBigFood;

        playSound(ateBigFood ? "bigEat" : "eat");

        score++;
        changeScore();
        snake.push({ ...foodCoords });
        foodEatCount++;

        removePrevFood();
        generateFood();
      }

      // ! Check if snack touch boundary.
      if (head.x < 0 || head.x >= row + 1 || head.y < 0 || head.y >= col + 1) {
        looseGame();
      }
    } catch (error) {
      console.log("E: ", error);
    }
  }

  // todo generate food small/big both
  generateFood();
  function generateFood() {
    let rowNum = Math.floor(Math.random() * row);
    let colNum = Math.floor(Math.random() * col);
    foodCoords = { x: rowNum, y: colNum };

    if (foodEatCount % 6 === 0 && foodEatCount !== 0) {
      isBigFood = true;
      blocks[`${foodCoords.x}-${foodCoords.y}`].classList.add("big-food");
      blocks[`${foodCoords.x}-${foodCoords.y}`].classList.remove("food");
    } else {
      isBigFood = false;
      blocks[`${foodCoords.x}-${foodCoords.y}`].classList.add("food");
      blocks[`${foodCoords.x}-${foodCoords.y}`].classList.remove("big-food");
    }
  }

  // todo remove prev food.
  function removePrevFood() {
    blocks[`${foodCoords.x}-${foodCoords.y}`].classList.remove("food");
    blocks[`${foodCoords.x}-${foodCoords.y}`].classList.remove("big-food");
  }

  // todo change score.
  function changeScore() {
    if (isBigFood) {
      score += 4;
      scoreElement.innerText = score;
    } else {
      scoreElement.innerText = score;
    }
  }

  // todo on game loose.
  // function looseGame() {
  //   if (score > highScore) {
  //     localStorage.setItem("highScore", JSON.stringify(score));
  //   }
  //   clearInterval(intervalId);
  //   alert("GAME OVER");
  //   setTimeout(() => {
  //     location.reload();
  //   }, 0);
  // }

  
let isGameOver = false;

function looseGame() {
  if (isGameOver) return;

  isGameOver = true;
  isGameRunning = false;

  clearInterval(intervalId);
  clearInterval(timeInterVal);

  if (score > highScore) {
    localStorage.setItem("highScore", JSON.stringify(score));
  }

  playSound("gameOver");

  setTimeout(() => {
    alert("GAME OVER");
    location.reload();
  }, 800);
}


  // todo display time:
  function gamePlayTime() {
    if (seconds === 60) {
      seconds = 0;
      if (minutes === 60) {
        minutes = 0;
      }
      minutes++;
    }
    seconds++;
    timer.innerText = `${minutes < 10 ? "0" + minutes : minutes}-${seconds < 10 ? "0" + seconds : seconds}`;
  }
});
