const audio = document.getElementById('audio');
function setVolume(v) { audio.volume = Math.max(0, Math.min(1, v)); }

const playPauseBtn = document.getElementById('play-pause');
playPauseBtn.addEventListener('click', () => {
    if (audio.paused) { audio.play(); playPauseBtn.textContent = '⏸'; }
    else { audio.pause(); playPauseBtn.textContent = '▶'; }
});

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
    setVolume(count / TOTAL);
}

update();

document.getElementById('down').addEventListener('click', () => { count = Math.max(0, count - 1); update(); });
document.getElementById('up').addEventListener('click', () => { count = Math.min(TOTAL, count + 1); update(); });


// grid of circles

const grid = document.getElementById('grid');
for (let i = 0; i < 88; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.addEventListener('click', () => {
        cell.classList.toggle('on');
        setVolume(grid.querySelectorAll('.cell.on').length / 88);
    });
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
        dot.addEventListener('click', () => {
            dot.remove();
            setVolume(document.getElementById('box').querySelectorAll('.dot').length / 10);
        });
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
    setVolume(pickerIndex / (PICKER_TOTAL - 1));
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
    if (speedRow === 0 && speedCol === 0) return;

    const newRow = snakeRow + speedRow;
    const newCol = snakeCol + speedCol;

    if (newRow < 0 || newRow >= ROWS || newCol < 0 || newCol >= COLS) {
        speedRow = 0;
        speedCol = 0;
        if (snakeBody.length > 0) snakeBody.pop();
        setVolume(snakeBody.length / 20);
        snakeRender();
        return;
    }

    if (newRow === foodRow && newCol === foodCol) {
        snakeBody.push({ r: snakeRow, c: snakeCol });
        snakePlaceFood();
        setVolume(snakeBody.length / 20);
    }

    for (let i = snakeBody.length - 1; i > 0; i--) snakeBody[i] = { ...snakeBody[i - 1] };
    if (snakeBody.length) snakeBody[0] = { r: snakeRow, c: snakeCol };

    snakeRow = newRow;
    snakeCol = newCol;

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
    snakePlaceFood();
    snakeRender();
}

snakeReset();
document.addEventListener("keyup", changeDirection);
setInterval(snakeUpdate, 100);
document.getElementById('snake-refresh').addEventListener('click', snakeReset);


// calculator

const calcDisplay = document.getElementById('calc-display');
let calcExpr = '';

document.getElementById('calc-buttons').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || !btn.dataset.val && !btn.dataset.action) return;

    if (btn.dataset.val === '+/-') {
        calcExpr = calcExpr.startsWith('-') ? calcExpr.slice(1) : '-' + calcExpr;
        calcDisplay.textContent = calcExpr || '0';
    } else if (btn.dataset.val !== undefined) {
        calcExpr += btn.dataset.val;
        calcDisplay.textContent = calcExpr;
    } else if (btn.dataset.action === 'clear') {
        calcExpr = '';
        calcDisplay.textContent = '0';
    } else if (btn.dataset.action === 'back') {
        calcExpr = calcExpr.slice(0, -1);
        calcDisplay.textContent = calcExpr || '0';
    } else if (btn.dataset.action === 'equals') {
        try {
            const result = eval(calcExpr.replace('÷', '/').replace('×', '*'));
            setVolume(result);
            calcDisplay.textContent = result.toFixed(2);
            calcExpr = String(result);
        } catch {
            calcDisplay.textContent = 'Err';
            calcExpr = '';
        }
    }
});


// tube

const tube = document.getElementById('tube');
const tubeFill = document.getElementById('tube-fill');
let tubeDragging = false;

function tubeSet(e) {
    const rect = tube.getBoundingClientRect();
    const v = 1 - (e.clientY - rect.top) / rect.height;
    tubeFill.style.height = (Math.max(0, Math.min(1, v)) * 100) + '%';
    setVolume(v);
}

tube.addEventListener('mousedown', (e) => { tubeDragging = true; tubeSet(e); });
document.addEventListener('mousemove', (e) => { if (tubeDragging) tubeSet(e); });
document.addEventListener('mouseup', () => tubeDragging = false);


// circle control

const ccSvg = document.getElementById('circle-svg');
const ccFillRing = document.getElementById('cc-fill-ring');
const ccHandle = document.getElementById('cc-handle');

const CC_CX = 100, CC_CY = 100, CC_R = 80;
const CC_CIRC = 2 * Math.PI * CC_R;
ccFillRing.setAttribute('stroke-dasharray', CC_CIRC);

function ccPoint(deg) {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: CC_CX + CC_R * Math.cos(rad), y: CC_CY + CC_R * Math.sin(rad) };
}

let ccDragging = false;
let ccDeg = 0;

function ccSetDeg(deg) {
    ccDeg = Math.max(0, Math.min(359.9, deg));
    const v = ccDeg / 360;
    ccFillRing.setAttribute('stroke-dashoffset', CC_CIRC * (1 - v));
    const p = ccPoint(ccDeg);
    ccHandle.setAttribute('cx', p.x.toFixed(2));
    ccHandle.setAttribute('cy', p.y.toFixed(2));
    setVolume(v);
}

function ccRawAngle(e) {
    const rect = ccSvg.getBoundingClientRect();
    const scale = 200 / rect.width;
    const x = (e.clientX - rect.left) * scale - CC_CX;
    const y = (e.clientY - rect.top) * scale - CC_CY;
    let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    return angle;
}

ccHandle.addEventListener('mousedown', (e) => { ccDragging = true; e.preventDefault(); });
document.addEventListener('mousemove', (e) => {
    if (!ccDragging) return;
    const raw = ccRawAngle(e);
    let delta = raw - ccDeg;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    ccSetDeg(ccDeg + delta);
});
document.addEventListener('mouseup', () => ccDragging = false);

ccSetDeg(0);


// scale

const scaleBox = document.getElementById('scale-box');
const scaleCircle = document.getElementById('scale-circle');
const SCALE_MIN = 20, SCALE_MAX = 260;
let scaleSize = SCALE_MIN;
let scaleInterval = null;

function scaleGrow() {
    scaleSize = Math.min(SCALE_MAX, scaleSize + 4);
    scaleCircle.style.width = scaleSize + 'px';
    scaleCircle.style.height = scaleSize + 'px';
    setVolume((scaleSize - SCALE_MIN) / (SCALE_MAX - SCALE_MIN));
}

function scaleShrink() {
    scaleSize = Math.max(SCALE_MIN, scaleSize - 4);
    scaleCircle.style.width = scaleSize + 'px';
    scaleCircle.style.height = scaleSize + 'px';
    setVolume((scaleSize - SCALE_MIN) / (SCALE_MAX - SCALE_MIN));
}

let scaleHeld = false;

scaleBox.addEventListener('mousedown', () => {
    scaleHeld = true;
    clearInterval(scaleInterval);
    scaleInterval = setInterval(scaleGrow, 30);
});
document.addEventListener('mouseup', () => {
    if (!scaleHeld) return;
    scaleHeld = false;
    clearInterval(scaleInterval);
    scaleInterval = setInterval(scaleShrink, 30);
});


// button control

document.getElementById('btn-plus').addEventListener('click', () => setVolume(audio.volume + 0.1));
document.getElementById('btn-minus').addEventListener('click', () => setVolume(audio.volume - 0.1));


// spin wheel

const spinWheel = document.getElementById('spin-wheel');
const spinCenter = document.getElementById('spin-center');

const SPIN_SEGMENTS = ['+1', '-2', '-1', '+1', '-2', 'x0', '-1', 'x3'];
let spinDeg = 0;
let spinBusy = false;

function applySpinEffect(seg) {
    let v = audio.volume;
    if (seg === '+1') v += 0.2;
    else if (seg === '-1') v -= 0.2;
    else if (seg === '-2') v -= 0.4;
    else if (seg === 'x3') v = Math.min(1, v * 3);
    else if (seg === 'x0') v = 0;
    setVolume(v);
}

spinCenter.addEventListener('click', () => {
    if (spinBusy) return;
    spinBusy = true;
    const randomSeg = Math.floor(Math.random() * 8);
    const segCenter = randomSeg * 45 + 22.5;
    const extraSpins = (5 + Math.floor(Math.random() * 5)) * 360;
    const adjustment = ((360 - segCenter) - (spinDeg % 360) + 360) % 360;
    spinDeg = spinDeg + extraSpins + adjustment;
    spinWheel.style.transform = `rotate(${spinDeg}deg)`;
    setTimeout(() => {
        applySpinEffect(SPIN_SEGMENTS[randomSeg]);
        spinBusy = false;
    }, 3000);
});

