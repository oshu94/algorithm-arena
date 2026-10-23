// ===== Algorithm Arena (Bubble Sort + Selection Sort + Insertion Sort) =====

// ---------- Settings ----------
const POINTS_CORRECT = 100;
const POINTS_STREAK_BONUS = 10;    // extra per streak level
const POINTS_WRONG = 25;

const DELAY_AFTER_SWAP = 750;      // ms: slide animation (450) + a short pause
const DELAY_AFTER_KEEP = 450;      // ms
const FINISH_DELAY = 700;          // ms before the finish screen appears

// ---------- Feedback lines ----------
const CORRECT_LINES = [
  "Look at you, doing computer science.",
  "Correct. Try not to let it go to your head.",
  "Right again. The array is mildly impressed.",
  "Nailed it. Somewhere, a CPU nodded.",
  "Yes. Exactly that. Shocking, I know.",
  "Correct. Your future employer just felt a tremor.",
  "Right. The algorithm is shaking.",
  "Yep. That was almost suspiciously good.",
  "Correct. Please remain humble. Or don't, honestly.",
  "Ding ding. The array is thrilled."
];

const WRONG_LINES = [
  "Bold choice. Wrong, but bold.",
  "Not quite. The array saw that and sighed.",
  "Incorrect. The algorithm has questions.",
  "Wrong. I applied the right move anyway, you're welcome.",
  "Nope. Confidence was there, though.",
  "Wrong, but in a creative way, which counts for nothing.",
  "Not quite. The algorithm will pretend it didn't see that.",
  "Oof. The numbers are whispering about you.",
  "Incorrect. A coin flip had the same odds, to be fair.",
  "Nope. Okay. Deep breath. Next one."
];

const STREAK_LINES = [            // used when the streak is 3 or more
  "Streak! The array is starting to fear you.",
  "Three in a row? Okay, show-off.",
  "You're on fire. Somebody call IT.",
  "Streak alive. Don't blink.",
  "Unstoppable. Mildly annoying, but unstoppable."
];

const BROKEN_STREAK_LINES = [     // used when a streak of 3+ just ended
  "Streak over. We had a good run, you and I.",
  "And just like that, the streak is gone. Moment of silence.",
  "Streak broken. The array exhales."
];

// ---------- Engine: shared helpers ----------
function isSorted(numbers) {
  for (let i = 0; i < numbers.length - 1; i++) {
    if (numbers[i] > numbers[i + 1]) {
      return false;
    }
  }
  return true;
}

// size different random numbers from 1-9, never already sorted
function makeRandomArray(size) {
  let numbers;

  do {
    const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    numbers = pool.slice(0, size);
  } while (isSorted(numbers));

  return numbers;
}

// ---------- Engine: Bubble Sort ----------
// Every step is one question: "swap these two neighbours?"
function buildBubbleSteps(startArray) {
  const working = [...startArray];
  const steps = [];

  for (let pass = 0; pass < working.length - 1; pass++) {
    for (let i = 0; i < working.length - 1 - pass; i++) {
      const left = working[i];
      const right = working[i + 1];
      const answer = left > right;           // true = "swap"
      const arrayBefore = [...working];

      if (answer) {
        [working[i], working[i + 1]] = [working[i + 1], working[i]];
      }

      steps.push({
        kind: "bubble",
        pass: pass + 1,
        arrayBefore: arrayBefore,
        arrayAfter: [...working],
        compared: [i, i + 1],                // tiles to highlight in blue
        minIndex: -1,                        // (Selection Sort only)
        keyIndex: -1,                        // (Insertion Sort only)
        sortedCount: 0,                      // how many tiles at the front are final
        answer: answer,
        question: "Compare " + left + " and " + right + ". Swap them or keep them?",
        explanation: answer
          ? left + " is bigger than " + right + ", so they swap. Big numbers drift right."
          : left + " is smaller than " + right + ", so they're already in order. Leave them.",
        swapPair: answer ? [i, i + 1] : null // tiles to slide after the answer
      });
    }
  }

  return { steps: steps, sortedArray: working };
}

// ---------- Engine: Selection Sort ----------
// Every step is one question: "is this number smaller than the smallest so far?"
// At the end of each pass, the smallest number is swapped to the front.
function buildSelectionSteps(startArray) {
  const working = [...startArray];
  const steps = [];

  for (let i = 0; i < working.length - 1; i++) {
    let minIndex = i;                        // smallest found so far in this pass

    for (let j = i + 1; j < working.length; j++) {
      const minValue = working[minIndex];
      const checkValue = working[j];
      const answer = checkValue < minValue;  // true = "new smallest"
      const arrayBefore = [...working];
      const isLastInPass = (j === working.length - 1);
      const newMinIndex = answer ? j : minIndex;

      let swapPair = null;
      let passNote = "";

      if (isLastInPass) {
        const finalMinValue = working[newMinIndex];
        if (newMinIndex !== i) {
          swapPair = [i, newMinIndex];
          passNote = " Pass over: " + finalMinValue + " is the smallest, so it moves to the front.";
        } else {
          passNote = " Pass over: " + finalMinValue + " is already at the front.";
        }
      }

      const arrayAfter = [...working];
      if (swapPair) {
        [arrayAfter[swapPair[0]], arrayAfter[swapPair[1]]] = [arrayAfter[swapPair[1]], arrayAfter[swapPair[0]]];
      }

      steps.push({
        kind: "selection",
        pass: i + 1,
        arrayBefore: arrayBefore,
        arrayAfter: arrayAfter,
        compared: [j],
        minIndex: minIndex,
        keyIndex: -1,
        sortedCount: i,                      // the first i tiles are already final
        answer: answer,
        question: "Smallest so far is " + minValue + ". Is " + checkValue + " even smaller?",
        explanation: (answer
          ? checkValue + " is smaller than " + minValue + ", so it's the new smallest."
          : checkValue + " is not smaller than " + minValue + ", so " + minValue + " stays the smallest.")
          + passNote,
        swapPair: swapPair
      });

      minIndex = newMinIndex;

      if (swapPair) {                        // keep our working copy in sync
        [working[swapPair[0]], working[swapPair[1]]] = [working[swapPair[1]], working[swapPair[0]]];
      }
    }
  }

  return { steps: steps, sortedArray: working };
}

// ---------- Engine: Insertion Sort ----------
// For each "key" tile: keep sliding it left while its left neighbour is bigger.
// Every step is one question: "is the left neighbour bigger? move the key left?"
function buildInsertionSteps(startArray) {
  const working = [...startArray];
  const steps = [];

  for (let i = 1; i < working.length; i++) {
    let j = i;                               // where the key tile is right now

    while (j > 0) {
      const keyValue = working[j];
      const leftValue = working[j - 1];
      const answer = leftValue > keyValue;   // true = "move the key left"
      const arrayBefore = [...working];

      if (answer) {
        [working[j - 1], working[j]] = [working[j], working[j - 1]];
      }

      // The pass ends if the key stops, or if it just reached the very front
      const passEnds = !answer || (j - 1 === 0);
      const passNote = passEnds
        ? " Key placed. The first " + (i + 1) + " numbers are now sorted."
        : "";

      steps.push({
        kind: "insertion",
        pass: i,
        arrayBefore: arrayBefore,
        arrayAfter: [...working],
        compared: [j - 1, j],
        minIndex: -1,
        keyIndex: j,                         // the tile that is being placed
        sortedCount: i + 1,                  // the first i+1 tiles form the sorted part
        answer: answer,
        question: "Key is " + keyValue + ". Is " + leftValue + ", on its left, bigger? Slide the key left?",
        explanation: (answer
          ? leftValue + " is bigger than " + keyValue + ", so the key hops left past it."
          : leftValue + " is not bigger than " + keyValue + ", so the key stays right here.")
          + passNote,
        swapPair: answer ? [j - 1, j] : null
      });

      if (answer) {
        j--;                                 // the key moved one place left
      } else {
        break;                               // the key found its spot
      }
    }
  }

  return { steps: steps, sortedArray: working };
}

// ---------- The modes (what the menu can start) ----------
const MODES = {
  bubble: {
    name: "Bubble Sort",
    yesLabel: "Swap",
    noLabel: "Keep",
    build: buildBubbleSteps
  },
  selection: {
    name: "Selection Sort",
    yesLabel: "New smallest",
    noLabel: "Not smaller",
    build: buildSelectionSteps
  },
  insertion: {
    name: "Insertion Sort",
    yesLabel: "Move left",
    noLabel: "Stay put",
    build: buildInsertionSteps
  }
};

// ---------- Page elements (found once, by their ids) ----------
const scoreEl = document.getElementById("score");
const streakEl = document.getElementById("streak");
const menuScreen = document.getElementById("menu-screen");
const gameScreen = document.getElementById("game-screen");
const btnStart = document.getElementById("btn-start");
const algoCards = document.querySelectorAll(".algo-card");
const sizeButtons = document.querySelectorAll(".size-btn");
const progressLabel = document.getElementById("progress-label");
const progressFill = document.getElementById("progress-fill");
const questionEl = document.getElementById("question");
const tileRow = document.getElementById("tile-row");
const spotlight = document.getElementById("spotlight");
const pointer = document.getElementById("pointer");
const btnSwap = document.getElementById("btn-swap");
const btnKeep = document.getElementById("btn-keep");
const feedback = document.getElementById("feedback");
const finishScreen = document.getElementById("finish-screen");
const finishMessage = document.getElementById("finish-message");
const btnReplay = document.getElementById("btn-replay");
const btnMenu = document.getElementById("btn-menu");

// ---------- State ----------
let selectedAlgo = "bubble";      // chosen on the menu
let selectedSize = 6;             // chosen on the menu

let steps = [];
let stepIndex = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let correctCount = 0;
let isLocked = false;             // true while a step is animating
let pendingTimer = null;          // the waiting setTimeout, so we can cancel it

let lastGameFinished = false;     // true after a game ends normally (menu keeps the score)

// Best scores, saved in the browser. Key looks like "bubble-6".
let bestScores = {};
try {
  bestScores = JSON.parse(localStorage.getItem("arenaBest") || "{}");
} catch (e) {
  bestScores = {};
}

function saveBest() {
  try {
    localStorage.setItem("arenaBest", JSON.stringify(bestScores));
  } catch (e) {
    // storage not available: the best scores just won't survive a refresh
  }
}

// Show "Best: 1200" on each algorithm card for the currently selected size
function refreshBestLabels() {
  algoCards.forEach((card) => {
    const label = card.querySelector(".algo-best");
    const best = bestScores[card.dataset.algo + "-" + selectedSize];
    label.textContent = best ? "Best: " + best : "No score yet";
  });
}

// ---------- Small helpers ----------
function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function verdict(correct, total, algoName) {
  const ratio = correct / total;
  if (ratio === 1) return "Flawless. Suspiciously flawless.";
  if (ratio >= 0.8) return "Solid. " + algoName + " would be proud.";
  if (ratio >= 0.5) return "Respectable. The array is sorted, your pride is mostly intact.";
  return "The array got sorted anyway, no thanks to you.";
}

function updateStats() {
  scoreEl.textContent = score;
  streakEl.textContent = streak;
}

// ---------- Drawing ----------
// view = { compared: [indexes], minIndex: number, keyIndex: number, sortedCount: number }
function renderTiles(numbers, view) {
  tileRow.innerHTML = "";

  numbers.forEach((value, i) => {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.textContent = value;

    const isCompared = view.compared.includes(i);

    if (isCompared) tile.classList.add("is-compared");
    if (i === view.minIndex) tile.classList.add("is-min");
    if (i === view.keyIndex) tile.classList.add("is-key");
    if (i < view.sortedCount && !isCompared && i !== view.keyIndex) {
      tile.classList.add("is-sorted");
    }

    tileRow.appendChild(tile);
  });
}

function showStep() {
  const step = steps[stepIndex];

  renderTiles(step.arrayBefore, step);

  // The spotlight and pointer work for neighbour pairs (Bubble and Insertion)
  const isPair = (step.kind !== "selection");
  spotlight.hidden = !isPair;
  pointer.hidden = !isPair;
  if (isPair) {
    document.documentElement.style.setProperty("--pair-index", step.compared[0]);
  }

  questionEl.textContent = step.question;
  progressLabel.textContent = "Pass " + step.pass + " · Step " + (stepIndex + 1) + " of " + steps.length;
  progressFill.style.width = (stepIndex / steps.length) * 100 + "%";
}

// Slide two tiles past each other (CSS adds the bounce). They can be far apart.
function animateSwap(indexA, indexB) {
  const tileA = tileRow.children[indexA];
  const tileB = tileRow.children[indexB];
  const distance = tileB.offsetLeft - tileA.offsetLeft;

  tileA.style.transform = "translateX(" + distance + "px)";
  tileB.style.transform = "translateX(" + (-distance) + "px)";
}

// Selection Sort: when the answer is "new smallest", move the MIN tag right away
function markNewMin(step) {
  const oldMinTile = tileRow.children[step.minIndex];
  const newMinTile = tileRow.children[step.compared[0]];

  oldMinTile.classList.remove("is-min");
  newMinTile.classList.remove("is-compared");
  newMinTile.classList.add("is-min");
}

function showScorePop(points) {
  scoreEl.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.5)" }, { transform: "scale(1)" }],
    { duration: 380, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" }
  );

  const pop = document.createElement("span");
  pop.className = "score-pop";
  pop.textContent = "+" + points;
  scoreEl.parentElement.appendChild(pop);

  const floatUp = pop.animate(
    [
      { opacity: 1, transform: "translateY(0)" },
      { opacity: 0, transform: "translateY(-24px)" }
    ],
    { duration: 900, easing: "ease-out", fill: "forwards" }
  );
  floatUp.onfinish = () => pop.remove();
}

// ---------- Gameplay ----------
function handleAnswer(playerSaysYes) {
  if (isLocked) return;
  isLocked = true;

  const step = steps[stepIndex];
  const isCorrect = (playerSaysYes === step.answer);
  const streakBefore = streak;      // remember it, we may reset it below

  if (isCorrect) {
    const earned = POINTS_CORRECT + streak * POINTS_STREAK_BONUS;
    score += earned;
    streak++;
    correctCount++;
    if (streak > bestStreak) {
      bestStreak = streak;
    }
    showScorePop(earned);
  } else {
    score = Math.max(0, score - POINTS_WRONG);
    streak = 0;
  }
  updateStats();

  // Choose which pool of funny lines to use
  let pool;
  if (isCorrect) {
    pool = (streak >= 3) ? STREAK_LINES : CORRECT_LINES;
  } else {
    pool = (streakBefore >= 3) ? BROKEN_STREAK_LINES : WRONG_LINES;
  }

  feedback.textContent = pickRandom(pool) + " " + step.explanation;
  feedback.className = isCorrect ? "feedback is-correct" : "feedback is-wrong";

  progressFill.style.width = ((stepIndex + 1) / steps.length) * 100 + "%";

  // The CORRECT action is always applied, so the array always ends up sorted
  if (step.kind === "selection" && step.answer) {
    markNewMin(step);
  }

  if (step.swapPair) {
    animateSwap(step.swapPair[0], step.swapPair[1]);
    pendingTimer = setTimeout(advance, DELAY_AFTER_SWAP);
  } else {
    pendingTimer = setTimeout(advance, DELAY_AFTER_KEEP);
  }
}

function advance() {
  stepIndex++;

  if (stepIndex >= steps.length) {
    finishGame();
    return;
  }

  showStep();
  isLocked = false;
}

function finishGame() {
  const finalArray = steps[steps.length - 1].arrayAfter;
  const mode = MODES[selectedAlgo];

  if (!isSorted(finalArray)) {
    console.error("BUG: final array is not sorted!", finalArray);
  }

  // Remember the result so the menu can show it
  lastGameFinished = true;
  const key = selectedAlgo + "-" + selectedSize;
  const isNewBest = score > (bestScores[key] || 0);
  if (isNewBest) {
    bestScores[key] = score;
    saveBest();
  }

  renderTiles(finalArray, {
    compared: [],
    minIndex: -1,
    keyIndex: -1,
    sortedCount: (selectedAlgo === "bubble") ? 0 : finalArray.length
  });
  spotlight.hidden = true;
  pointer.hidden = true;
  progressFill.style.width = "100%";

  finishMessage.textContent =
    mode.name + " done. Final array: " + finalArray.join(" ") + ". " +
    correctCount + "/" + steps.length + " correct · Score " + score +
    " · Best streak " + bestStreak + ". " + verdict(correctCount, steps.length, mode.name) +
    (isNewBest ? " New best score!" : "");

  pendingTimer = setTimeout(() => {
    finishScreen.hidden = false;
    btnReplay.focus();
  }, FINISH_DELAY);
}

function startGame() {
  clearTimeout(pendingTimer);
  lastGameFinished = false;

  const mode = MODES[selectedAlgo];
  const built = mode.build(makeRandomArray(selectedSize));

  steps = built.steps;
  stepIndex = 0;
  score = 0;
  streak = 0;
  bestStreak = 0;
  correctCount = 0;
  isLocked = false;

  btnSwap.textContent = mode.yesLabel;
  btnKeep.textContent = mode.noLabel;

  feedback.textContent = "Pick one. No pressure. Okay, a little pressure.";
  feedback.className = "feedback";
  menuScreen.hidden = true;
  finishScreen.hidden = true;
  gameScreen.hidden = false;

  updateStats();
  showStep();
  btnSwap.focus();
}

// ---------- Menu ----------
function showMenu() {
  clearTimeout(pendingTimer);     // cancel any step that was about to happen
  isLocked = true;

  if (!lastGameFinished) {        // quit mid-game: wipe the unfinished score
    score = 0;
    streak = 0;
  }
  updateStats();
  refreshBestLabels();

  gameScreen.hidden = true;
  finishScreen.hidden = true;
  menuScreen.hidden = false;

  document.querySelector(".algo-card.is-selected").focus();
}

function chooseAlgo(card) {
  selectedAlgo = card.dataset.algo;
  algoCards.forEach((c) => {
    c.classList.toggle("is-selected", c === card);
    c.setAttribute("aria-pressed", c === card);
  });
}

function chooseSize(button) {
  selectedSize = Number(button.dataset.size);
  sizeButtons.forEach((b) => {
    b.classList.toggle("is-selected", b === button);
    b.setAttribute("aria-pressed", b === button);
  });
  refreshBestLabels();            // best scores depend on the size
}

// The menu is a grid: row 0 = algorithm cards, row 1 = sizes, row 2 = Start
function menuRows() {
  return [
    Array.from(document.querySelectorAll(".algo-card:not(:disabled)")),
    Array.from(sizeButtons),
    [btnStart]
  ];
}

function moveMenuFocus(dx, dy) {
  const rows = menuRows();
  let r = rows.findIndex((row) => row.includes(document.activeElement));

  if (r === -1) {                 // nothing focused yet: start at the top
    rows[0][0].focus();
    return;
  }

  let c = rows[r].indexOf(document.activeElement);

  if (dy !== 0) {                 // moving to another row: land on its selected item
    r = Math.max(0, Math.min(rows.length - 1, r + dy));
    const selectedIndex = rows[r].findIndex((el) => el.classList.contains("is-selected"));
    c = (selectedIndex === -1) ? 0 : selectedIndex;
  } else {                        // moving sideways inside the row
    c = Math.max(0, Math.min(rows[r].length - 1, c + dx));
  }

  rows[r][c].focus();
}

// ---------- Wiring buttons to actions ----------
algoCards.forEach((card) => {
  card.addEventListener("click", () => {
    chooseAlgo(card);
    document.querySelector(".size-btn.is-selected").focus();   // flow: algorithm -> size
  });
});

sizeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    chooseSize(button);
    btnStart.focus();                                          // flow: size -> Start
  });
});

btnStart.addEventListener("click", startGame);
btnSwap.addEventListener("click", () => handleAnswer(true));
btnKeep.addEventListener("click", () => handleAnswer(false));
btnReplay.addEventListener("click", startGame);
btnMenu.addEventListener("click", showMenu);

// ---------- Keyboard / remote navigation ----------
document.addEventListener("keydown", (event) => {
  // Holding Enter or Space fires repeated clicks. Block repeats so one press = one action.
  if ((event.key === "Enter" || event.key === " ") && event.repeat) {
    event.preventDefault();
    return;
  }

  // Esc = back to the menu (from the game or the finish screen)
  if (event.key === "Escape" && menuScreen.hidden) {
    showMenu();
    return;
  }

  // On the menu: arrows move around the grid
  if (!menuScreen.hidden) {
    if (event.key === "ArrowLeft")  { moveMenuFocus(-1, 0); event.preventDefault(); }
    if (event.key === "ArrowRight") { moveMenuFocus(1, 0);  event.preventDefault(); }
    if (event.key === "ArrowUp")    { moveMenuFocus(0, -1); event.preventDefault(); }
    if (event.key === "ArrowDown")  { moveMenuFocus(0, 1);  event.preventDefault(); }
    return;
  }

  // On the finish screen: left = Play again, right = Menu
  if (!finishScreen.hidden) {
    if (event.key === "ArrowLeft")  { btnReplay.focus(); event.preventDefault(); }
    if (event.key === "ArrowRight") { btnMenu.focus();   event.preventDefault(); }
    return;
  }

  // In the game: left = first button, right = second button
  if (event.key === "ArrowLeft") {
    btnSwap.focus();
    event.preventDefault();
  } else if (event.key === "ArrowRight") {
    btnKeep.focus();
    event.preventDefault();
  }
});

// Add a "Best: ..." line to each algorithm card
algoCards.forEach((card) => {
  const best = document.createElement("span");
  best.className = "algo-best";
  card.appendChild(best);
});

showMenu();     // the game opens on the menu