// linear circles

const TOTAL = 16;
let count = 5;

const container = document.getElementById('circles');
for (let i = 0; i < TOTAL; i++) {
    container.appendChild(document.createElement('div')).className = 'circle';
}

function update() {
    container.querySelectorAll('.circle').forEach((c, i) => {
        c.classList.toggle('filled', i < count);
    });
}

update();

document.getElementById('down').addEventListener('click', () => { count = Math.max(0, count - 1); update(); });
document.getElementById('up').addEventListener('click', () => { count = Math.min(TOTAL, count + 1); update(); });


// grid of circles

const grid = document.getElementById('grid');
for (let i = 0; i < 88; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.addEventListener('click', () => cell.classList.toggle('on'));
    grid.appendChild(cell);
}


// random cirles

const DOT_SIZE = 36;

function overlaps(x, y, placed) {
    return placed.some(p => Math.hypot(p.x - x, p.y - y) < DOT_SIZE + 4);
}

function spawn() {
    const box = document.getElementById('box');
    box.querySelectorAll('.dot').forEach(el => el.remove());
    const w = box.clientWidth;
    const h = box.clientHeight;
    const placed = [{ x: 0, y: h - DOT_SIZE }];

    for (let i = 1; i <= 10; i++) {
        let x, y, attempts = 0;
        do {
            x = Math.random() * (w - DOT_SIZE);
            y = Math.random() * (h - DOT_SIZE);
            attempts++;
        } while (overlaps(x, y, placed) && attempts < 200);

        placed.push({ x, y });
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.textContent = i;
        dot.style.left = x + 'px';
        dot.style.top = y + 'px';
        dot.addEventListener('click', () => dot.remove());
        box.appendChild(dot);
    }
}

document.getElementById('refresh').addEventListener('click', spawn);
spawn();


// scroll picker

const PICKER_TOTAL = 11;
const PICKER_CENTER = 140; 
let pickerIndex = 0; 

const pickerList = document.getElementById('picker-list');
const pickerThumb = document.getElementById('picker-thumb');
const pickerItems = [];

for (let i = 0; i < PICKER_TOTAL; i++) {
    const item = document.createElement('div');
    item.className = 'picker-item';
    item.textContent = i;
    pickerList.appendChild(item);
    pickerItems.push(item);
}

function updatePicker() {
    pickerItems.forEach((item, i) => {
        const dist = i - pickerIndex;

        item.classList.toggle('hidden', Math.abs(dist) > 1);
        item.classList.toggle('current', dist === 0);

        if (Math.abs(dist) > 1) return;

        const ITEM_GAP = 70;
        item.style.top = (PICKER_CENTER + dist * ITEM_GAP) + 'px';
        item.style.left = (dist === 0 ? 60 : 16) + 'px';
    });

  
    const trackH = pickerThumb.parentElement.offsetHeight;
    const thumbH = 40;
    const travel = trackH - thumbH;
    pickerThumb.style.top = Math.round((pickerIndex / (PICKER_TOTAL - 1)) * travel) + 'px';
}

let wheelAccum = 0;
const WHEEL_THRESHOLD = 50;

pickerList.addEventListener('wheel', (e) => {
    e.preventDefault();
    wheelAccum += e.deltaY;
    if (wheelAccum > WHEEL_THRESHOLD) {
        pickerIndex = Math.min(PICKER_TOTAL - 1, pickerIndex + 1);
        wheelAccum = 0;
        updatePicker();
    } else if (wheelAccum < -WHEEL_THRESHOLD) {
        pickerIndex = Math.max(0, pickerIndex - 1);
        wheelAccum = 0;
        updatePicker();
    }
}, { passive: false });

updatePicker();

// snake game

const ROWS = 17;
const COLS = 17;

let snakeRow = 5, snakeCol = 5;
let speedRow = 0, speedCol = 0;
let snakeBody = [];
let foodRow, foodCol;
let snakeOver = false;

const boardEl = document.getElementById('board');
const snakeCells = [];
for (let i = 0; i < ROWS * COLS; i++) {
    const cell = document.createElement('div');
    cell.className = 'snake-cell';
    boardEl.appendChild(cell);
    snakeCells.push(cell);
}

function getCell(r, c) { return snakeCells[r * COLS + c]; }

function snakePlaceFood() {
    foodRow = Math.floor(Math.random() * ROWS);
    foodCol = Math.floor(Math.random() * COLS);
}

function snakeRender() {
    snakeCells.forEach(c => c.className = 'snake-cell');
    getCell(foodRow, foodCol).classList.add('food');
    getCell(snakeRow, snakeCol).classList.add('snake');
    snakeBody.forEach(({ r, c }) => getCell(r, c).classList.add('snake'));
}

function snakeUpdate() {
    if (snakeOver) return;

    if (snakeRow === foodRow && snakeCol === foodCol) {
        snakeBody.push({ r: snakeRow, c: snakeCol });
        snakePlaceFood();
    }

    for (let i = snakeBody.length - 1; i > 0; i--) snakeBody[i] = { ...snakeBody[i - 1] };
    if (snakeBody.length) snakeBody[0] = { r: snakeRow, c: snakeCol };

    snakeRow += speedRow;
    snakeCol += speedCol;

    if (snakeRow < 0 || snakeRow >= ROWS || snakeCol < 0 || snakeCol >= COLS) {
        snakeOver = true;
        alert("Game Over");
        return;
    }

    for (const { r, c } of snakeBody) {
        if (snakeRow === r && snakeCol === c) { snakeOver = true; alert("Game Over"); return; }
    }

    snakeRender();
}

function changeDirection(e) {
    if (e.code == "ArrowUp" && speedRow != 1)    { speedCol = 0;  speedRow = -1; }
    else if (e.code == "ArrowDown" && speedRow != -1)  { speedCol = 0;  speedRow = 1;  }
    else if (e.code == "ArrowLeft" && speedCol != 1)   { speedCol = -1; speedRow = 0;  }
    else if (e.code == "ArrowRight" && speedCol != -1) { speedCol = 1;  speedRow = 0;  }
}

function snakeReset() {
    snakeRow = 5; snakeCol = 5;
    speedRow = 0; speedCol = 0;
    snakeBody = [];
    snakeOver = false;
    snakePlaceFood();
    snakeRender();
}

snakeReset();
document.addEventListener("keyup", changeDirection);
setInterval(snakeUpdate, 100);
document.getElementById('snake-refresh').addEventListener('click', snakeReset);


// ---- 6. CATAPULT ----

const catSvg = document.getElementById('catapult-svg');
const catBall = document.getElementById('cat-ball');
const catArc = document.getElementById('cat-arc');

const CAT_LINE_X1 = 70, CAT_LINE_X2 = 300, CAT_LINE_Y = 95;
let catBallX = 30, catBallY = 95;
let catAnimId = null;

catSvg.addEventListener('click', (e) => {
    const rect = catSvg.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (320 / rect.width);
    if (clickX < CAT_LINE_X1 || clickX > CAT_LINE_X2) return;
    catLaunch(catBallX, catBallY, clickX, CAT_LINE_Y);
});

function catLaunch(x0, y0, x1, y1) {
    if (catAnimId) cancelAnimationFrame(catAnimId);

    const ARC_H = 70;
    const midX = (x0 + x1) / 2;
    const ctrlY = Math.min(y0, y1) - ARC_H;
    catArc.setAttribute('d', `M ${x0},${y0} Q ${midX},${ctrlY} ${x1},${y1}`);

    const duration = 500;
    const start = performance.now();

    function step(now) {
        const t = Math.min((now - start) / duration, 1);
        const x = x0 + (x1 - x0) * t;
        const y = y0 + (y1 - y0) * t - ARC_H * Math.sin(Math.PI * t);
        catBall.setAttribute('cx', x);
        catBall.setAttribute('cy', y);
        if (t < 1) {
            catAnimId = requestAnimationFrame(step);
        } else {
            catBallX = x1; catBallY = y1;
            catAnimId = null;
        }
    }
    catAnimId = requestAnimationFrame(step);
}
