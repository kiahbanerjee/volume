const audio = document.getElementById('audio');
function setVolume(v) { audio.volume = Math.max(0, Math.min(1, v)); }

if ('mediaSession' in navigator) {
    ['play','pause','seekbackward','seekforward','previoustrack','nexttrack'].forEach(action => {
        try { navigator.mediaSession.setActionHandler(action, null); } catch {}
    });
}

const playPauseBtn = document.getElementById('play-pause');

audio.addEventListener('pause', () => {
    if (!audio.ended && !playPauseBtn._userPaused) audio.play();
});

playPauseBtn.addEventListener('click', () => {
    if (audio.paused) { playPauseBtn._userPaused = false; audio.play(); playPauseBtn.textContent = '⏸'; }
    else { playPauseBtn._userPaused = true; audio.pause(); playPauseBtn.textContent = '▶'; }
});

// linear circles

const TOTAL = 10;
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
const PICKER_CENTER = 90;
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

        const ITEM_GAP = 50;
        item.style.top = (PICKER_CENTER + dist * ITEM_GAP) + 'px';
        item.style.left = '0';
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

// rotary dial

const rotaryDisk = document.getElementById('rotary-disk');
const DIAL_NUMS = [0,1,2,3,4,5,6,7,8,9];
const DIAL_ANGLES = [120, 90, 60, 30, 0, 330, 300, 270, 240, 210];
let rotarySelected = null;
let rotaryAnimating = false;

DIAL_NUMS.forEach((num, i) => {
    const a = DIAL_ANGLES[i] * Math.PI / 180;
    const cx = 140 + 88 * Math.sin(a);
    const cy = 140 - 88 * Math.cos(a);

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'rotary-digit');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', 18);
    circle.setAttribute('class', 'rotary-hole');

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', cx);
    text.setAttribute('y', cy);
    text.setAttribute('class', 'rotary-label');
    text.textContent = num;

    g.appendChild(circle);
    g.appendChild(text);

    g.addEventListener('click', () => {
        if (rotaryAnimating) return;
        rotaryAnimating = true;

        if (rotarySelected) rotarySelected.classList.remove('selected');
        g.classList.add('selected');
        rotarySelected = g;
        setVolume(num / 9);

        // Rotate clockwise until hole reaches stop at ~120°
        const stopAngle = 120;
        const rotation = num === 0 ? 15 : (stopAngle - DIAL_ANGLES[i] + 360) % 360;

        // Forward: slow ease-in (finger pushing)
        rotaryDisk.style.transition = 'transform 0.5s ease-in';
        rotaryDisk.style.transform = `rotate(${rotation}deg)`;

        // Spring back after forward completes
        setTimeout(() => {
            rotaryDisk.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.4, 1)';
            rotaryDisk.style.transform = 'rotate(0deg)';
            setTimeout(() => { rotaryAnimating = false; }, 550);
        }, 520);
    });

    rotaryDisk.appendChild(g);
});

// knob

const knobSvg = document.getElementById('knob-svg');
const knobBody = document.getElementById('knob-body');
const knobGroup = document.getElementById('knob-group');
let knobDragging = false;
let knobPrevAngle = null;

function setKnobAngle(vol) {
    knobGroup.setAttribute('transform', `rotate(${-40 + vol * 80}, 140, 155)`);
}

function knobGetAngle(e) {
    const rect = knobSvg.getBoundingClientRect();
    const dx = (e.clientX - rect.left) * (280 / rect.width) - 140;
    const dy = (e.clientY - rect.top) * (280 / rect.height) - 155;
    let angle = Math.atan2(dx, -dy) * 180 / Math.PI;
    return angle < 0 ? angle + 360 : angle;
}

knobBody.addEventListener('mousedown', (e) => {
    knobDragging = true;
    knobPrevAngle = knobGetAngle(e);
    e.preventDefault();
});
window.addEventListener('mousemove', (e) => {
    if (!knobDragging) return;
    const angle = knobGetAngle(e);
    let delta = angle - knobPrevAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    knobPrevAngle = angle;
    const vol = Math.max(0, Math.min(1, audio.volume + delta / 80));
    setKnobAngle(vol);
    setVolume(vol);
});
window.addEventListener('mouseup', () => { knobDragging = false; knobPrevAngle = null; });

setKnobAngle(0);

// stopwatch

const swHandGroup = document.getElementById('sw-hand-group');
const swDisplay = document.getElementById('sw-display');
const swBtn = document.getElementById('sw-btn');
let swRunning = false;
let swSeconds = 0;
let swInterval = null;

function swUpdate() {
    swSeconds += 0.1;
    if (swSeconds >= 60) swSeconds = 0;
    const angle = (swSeconds / 60) * 360;
    swHandGroup.style.transform = `rotate(${angle}deg)`;
    swDisplay.textContent = swSeconds.toFixed(1);
    setVolume(swSeconds / 60);
}

swBtn.addEventListener('click', () => {
    if (swRunning) {
        clearInterval(swInterval);
        swRunning = false;
        swBtn.setAttribute('fill', 'white');
    } else {
        swInterval = setInterval(swUpdate, 100);
        swRunning = true;
        swBtn.setAttribute('fill', 'black');
    }
});

// click counter circle

let clickCount = 0;
const clickCircle = document.getElementById('click-circle');
const clickCountEl = document.getElementById('click-count');

clickCircle.addEventListener('click', () => {
    clickCount = clickCount >= 10 ? 0 : clickCount + 1;
    clickCountEl.textContent = clickCount;
    setVolume(clickCount / 10);
});

// gradient picker

const gradientBox = document.getElementById('gradient-box');
const gradientDot = document.getElementById('gradient-dot');
let gradientDragging = false;

function setGradientPos(e) {
    const rect = gradientBox.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    gradientDot.style.top  = '50%';
    gradientDot.style.left = x + 'px';
    setVolume(x / rect.width);
}

gradientBox.addEventListener('mousedown', (e) => {
    gradientDragging = true;
    setGradientPos(e);
    e.preventDefault();
});
window.addEventListener('mousemove', (e) => { if (gradientDragging) setGradientPos(e); });
window.addEventListener('mouseup',   () => { gradientDragging = false; });

(function initGradient() {
    const v = 0.65;
    gradientDot.style.top  = '50%';
    gradientDot.style.left = (v * 100) + '%';
    setVolume(v);
})();

// resize box

const resizeOuter = document.getElementById('resize-outer');
const resizeInner = document.getElementById('resize-inner');
const RESIZE_MIN = 10, RESIZE_MAX = 156;
let resizeDragging = false;
let resizeMode = null;
let resizeStartX, resizeStartY, resizeStartW, resizeStartH;

function updateResizeVolume() {
    setVolume((resizeInner.offsetWidth * resizeInner.offsetHeight) / (RESIZE_MAX * RESIZE_MAX));
}

resizeOuter.addEventListener('mousemove', (e) => {
    if (resizeDragging) return;
    const rect = resizeInner.getBoundingClientRect();
    const nearRight  = Math.abs(e.clientX - rect.right)  < 8;
    const nearBottom = Math.abs(e.clientY - rect.bottom) < 8;
    if (nearRight && nearBottom) resizeOuter.style.cursor = 'nwse-resize';
    else if (nearRight)          resizeOuter.style.cursor = 'ew-resize';
    else if (nearBottom)         resizeOuter.style.cursor = 'ns-resize';
    else                         resizeOuter.style.cursor = 'default';
});

resizeOuter.addEventListener('mouseleave', () => {
    if (!resizeDragging) resizeOuter.style.cursor = 'default';
});

resizeInner.addEventListener('mousedown', (e) => {
    const rect = resizeInner.getBoundingClientRect();
    const nearRight  = Math.abs(e.clientX - rect.right)  < 8;
    const nearBottom = Math.abs(e.clientY - rect.bottom) < 8;
    if (nearRight || nearBottom) {
        resizeDragging = true;
        resizeMode = nearRight && nearBottom ? 'xy' : nearRight ? 'x' : 'y';
        resizeStartX = e.clientX;
        resizeStartY = e.clientY;
        resizeStartW = resizeInner.offsetWidth;
        resizeStartH = resizeInner.offsetHeight;
        e.preventDefault();
    }
});

window.addEventListener('mousemove', (e) => {
    if (!resizeDragging) return;
    if (resizeMode === 'x' || resizeMode === 'xy') {
        const newW = Math.max(RESIZE_MIN, Math.min(RESIZE_MAX, resizeStartW + (e.clientX - resizeStartX)));
        resizeInner.style.width = newW + 'px';
    }
    if (resizeMode === 'y' || resizeMode === 'xy') {
        const newH = Math.max(RESIZE_MIN, Math.min(RESIZE_MAX, resizeStartH + (e.clientY - resizeStartY)));
        resizeInner.style.height = newH + 'px';
    }
    updateResizeVolume();
});

window.addEventListener('mouseup', () => {
    if (resizeDragging) { resizeDragging = false; resizeOuter.style.cursor = 'default'; }
});

// dice

const DICE_PATTERNS = {
    1: ['dot-c'],
    2: ['dot-tr', 'dot-bl'],
    3: ['dot-tr', 'dot-c', 'dot-bl'],
    4: ['dot-tl', 'dot-tr', 'dot-bl', 'dot-br'],
    5: ['dot-tl', 'dot-tr', 'dot-c', 'dot-bl', 'dot-br'],
    6: ['dot-tl', 'dot-tr', 'dot-ml', 'dot-mr', 'dot-bl', 'dot-br']
};

function showDice(n) {
    document.querySelectorAll('.die-dot').forEach(d => d.classList.remove('show'));
    DICE_PATTERNS[n].forEach(id => document.getElementById(id).classList.add('show'));
}

const diceSvg = document.getElementById('dice-svg');
let diceRolling = false;
showDice(3);

diceSvg.addEventListener('click', () => {
    if (diceRolling) return;
    diceRolling = true;
    diceSvg.classList.add('rolling');

    const delays = [60,60,70,70,80,90,100,120,140,160,190,220];
    let t = 0;
    delays.forEach((d, i) => {
        t += d;
        setTimeout(() => {
            showDice(Math.floor(Math.random() * 6) + 1);
            if (i === delays.length - 1) {
                const result = Math.floor(Math.random() * 6) + 1;
                showDice(result);
                setVolume(result / 6);
                diceSvg.classList.remove('rolling');
                diceRolling = false;
            }
        }, t);
    });
});

// low med high

document.querySelectorAll('.lmh-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.lmh-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setVolume(parseFloat(btn.dataset.vol));
    });
});

// dropdown

const volSelected = document.getElementById('vol-selected');
const volOptions = document.getElementById('vol-options');
const volOptionsWrap = document.getElementById('vol-options-wrap');
const volScrollThumb = document.getElementById('vol-scroll-thumb');

for (let v = 0; v <= 100; v += 10) {
    const div = document.createElement('div');
    div.className = 'vol-option';
    div.textContent = v + '%';
    div.addEventListener('click', () => {
        volSelected.childNodes[0].textContent = v + '% ';
        volOptionsWrap.classList.remove('open');
        setVolume(v / 100);
    });
    volOptions.appendChild(div);
}

function updateVolThumb() {
    const ratio = volOptions.scrollTop / (volOptions.scrollHeight - volOptions.clientHeight);
    const trackH = volOptionsWrap.clientHeight;
    const thumbH = Math.max(20, trackH * (volOptions.clientHeight / volOptions.scrollHeight));
    volScrollThumb.style.height = thumbH + 'px';
    volScrollThumb.style.top = ratio * (trackH - thumbH) + 'px';
}

volOptions.addEventListener('scroll', updateVolThumb);

volSelected.addEventListener('click', () => {
    volOptionsWrap.classList.toggle('open');
    if (volOptionsWrap.classList.contains('open')) updateVolThumb();
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('#vol-dropdown')) volOptionsWrap.classList.remove('open');
});

// type box

const typeInput = document.getElementById('type-input');
const typeError = document.getElementById('type-error');

typeInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const val = parseInt(typeInput.value);
    if (isNaN(val) || val < 0 || val > 100) {
        typeInput.classList.remove('error');
        void typeInput.offsetWidth; // restart animation
        typeInput.classList.add('error');
        typeError.classList.add('visible');
        setTimeout(() => { typeInput.classList.remove('error'); typeError.classList.remove('visible'); }, 600);
    } else {
        setVolume(val / 100);
        typeInput.value = '';
        typeError.classList.remove('visible');
    }
});

// slot machine

const slotNums = Array.from(document.querySelectorAll('.slot-num'));
const slotLeverArm = document.getElementById('slot-lever-arm');
const slotHandle = document.getElementById('slot-handle');
let slotSpinning = false;

slotHandle.addEventListener('click', () => {
    if (slotSpinning) return;
    slotSpinning = true;

    // Pull lever down
    slotLeverArm.style.transition = 'transform 0.2s ease-in';
    slotLeverArm.style.transform = 'rotate(38deg)';

    // Spring back
    setTimeout(() => {
        slotLeverArm.style.transition = 'transform 0.45s cubic-bezier(0.2, 0.8, 0.35, 1)';
        slotLeverArm.style.transform = 'rotate(0deg)';
    }, 250);

    // Spin all reels
    const intervals = [null, null, null];
    const results = [0, 0, 0];
    slotNums.forEach((num, i) => {
        intervals[i] = setInterval(() => {
            num.textContent = Math.floor(Math.random() * 9) + 1;
        }, 80);
    });

    // Stop reels one by one; reels 2 & 3 have 50% chance of matching reel 1
    [900, 1300, 1700].forEach((delay, i) => {
        setTimeout(() => {
            clearInterval(intervals[i]);
            if (i === 0) {
                results[0] = Math.floor(Math.random() * 9) + 1;
            } else {
                results[i] = Math.random() < 0.5 ? results[0] : Math.floor(Math.random() * 9) + 1;
            }
            slotNums[i].textContent = results[i];
            if (i === 2) {
                if (results[0] === results[1] && results[1] === results[2]) {
                    setVolume(results[0] / 9);
                }
                slotSpinning = false;
            }
        }, delay);
    });
});

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
    if (!snakeActive || (speedRow === 0 && speedCol === 0)) return;

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

let snakeActive = false;
const snakeBtn = document.getElementById('snake-refresh');

snakeReset();
setInterval(snakeUpdate, 100);

snakeBtn.addEventListener('click', () => {
    if (!snakeActive) {
        snakeActive = true;
        snakeBtn.textContent = '↻';
        speedCol = 1; speedRow = 0;
        document.addEventListener("keyup", changeDirection);
    } else {
        snakeReset();
    }
});

document.addEventListener('click', (e) => {
    if (snakeActive && !e.target.closest('.snakegame')) {
        snakeActive = false;
        speedRow = 0; speedCol = 0;
        snakeBtn.textContent = '▶';
        document.removeEventListener("keyup", changeDirection);
        snakeReset();
    }
});


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
let ccDeg = 90;

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

ccSetDeg(90);


// 2048

const CELL2 = 37;
let board2048 = Array.from({length:4}, () => Array(4).fill(null));
const grid2048 = document.getElementById('grid-2048');
const tileEls2048 = new Map();
let tileIdCtr2048 = 0;
let animating2048 = false;

for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const bg = document.createElement('div');
    bg.className = 'bg-cell-2048';
    bg.style.transform = `translate(${c*CELL2}px,${r*CELL2}px)`;
    grid2048.appendChild(bg);
}

function spawnTile2048(row, col, value) {
    const id = tileIdCtr2048++;
    const el = document.createElement('div');
    el.className = 'tile-2048';
    el.textContent = value;
    el.style.transform = `translate(${col*CELL2}px,${row*CELL2}px)`;
    grid2048.appendChild(el);
    tileEls2048.set(id, el);
    board2048[row][col] = {id, value};
}

function addRandTile2048() {
    const empty = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!board2048[r][c]) empty.push([r,c]);
    if (!empty.length) return;
    const [r,c] = empty[Math.floor(Math.random()*empty.length)];
    spawnTile2048(r, c, 2);
}

function slideRow2048(row) {
    const tiles = row.filter(t => t);
    const result = [];
    let i = 0;
    while (i < tiles.length) {
        if (i+1 < tiles.length && tiles[i].value === tiles[i+1].value)
            result.push({...tiles[i], value: tiles[i].value*2, mergedId: tiles[i+1].id}), i+=2;
        else result.push({...tiles[i]}), i++;
    }
    while (result.length < 4) result.push(null);
    return result;
}

function move2048(dir) {
    if (animating2048) return;
    const newBoard = Array.from({length:4}, () => Array(4).fill(null));
    const toMove = [], toMerge = [];

    for (let i = 0; i < 4; i++) {
        let line, coord;
        if (dir==='left')  { line = board2048[i];                        coord = j=>[i,j]; }
        if (dir==='right') { line = [...board2048[i]].reverse();         coord = j=>[i,3-j]; }
        if (dir==='up')    { line = board2048.map(r=>r[i]);             coord = j=>[j,i]; }
        if (dir==='down')  { line = board2048.map(r=>r[i]).reverse();   coord = j=>[3-j,i]; }

        slideRow2048(line).forEach((t, j) => {
            if (!t) return;
            const [r,c] = coord(j);
            newBoard[r][c] = {id:t.id, value:t.value};
            toMove.push({id:t.id, r, c});
            if (t.mergedId !== undefined) {
                toMove.push({id:t.mergedId, r, c});
                toMerge.push({removeId:t.mergedId, survivorId:t.id, value:t.value});
            }
        });
    }

    let moved = toMerge.length > 0;
    if (!moved) for (let r=0;r<4;r++) for (let c=0;c<4;c++) {
        const a=board2048[r][c], b=newBoard[r][c];
        if ((!a)!==(!b) || (a&&b&&a.id!==b.id)) { moved=true; break; }
    }
    if (!moved) return;

    animating2048 = true;
    board2048 = newBoard;

    toMove.forEach(({id,r,c}) => {
        const el = tileEls2048.get(id);
        if (el) el.style.transform = `translate(${c*CELL2}px,${r*CELL2}px)`;
    });

    setTimeout(() => {
        toMerge.forEach(({removeId,survivorId,value}) => {
            tileEls2048.get(removeId)?.remove();
            tileEls2048.delete(removeId);
            const el = tileEls2048.get(survivorId);
            if (el) el.textContent = value;
        });
        addRandTile2048();
        let max = 0;
        for (let r=0;r<4;r++) for (let c=0;c<4;c++) if (board2048[r][c]) max=Math.max(max,board2048[r][c].value);
        if (max > 0) setVolume(Math.log2(max)/11);
        animating2048 = false;
    }, 120);
}

let focused2048 = false;
const startBtn2048 = document.getElementById('start-2048');

startBtn2048.addEventListener('click', () => {
    focused2048 = true;
    startBtn2048.style.background = 'black';
    startBtn2048.style.color = 'white';
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('#game-2048')) {
        focused2048 = false;
        startBtn2048.style.background = '';
        startBtn2048.style.color = '';
    }
});

document.addEventListener('keydown', (e) => {
    const map = {ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down'};
    if (map[e.key] && focused2048) { e.preventDefault(); e.stopPropagation(); move2048(map[e.key]); }
}, { capture: true });

addRandTile2048(); addRandTile2048();


// memory game

const memGrid = document.getElementById('memory-grid');
const memCards = [];
let memValues = [], memFlipped = [], memMatched = [], memLocked = false;

function memNewPairs() {
    const pool = [1,2,3,4,5,6,7,8,9];
    const picked = pool.sort(() => Math.random()-0.5).slice(0,6);
    return [...picked, ...picked].sort(() => Math.random()-0.5);
}

function memInit() {
    memValues = memNewPairs();
    memFlipped = Array(12).fill(false);
    memMatched = Array(12).fill(false);
    memLocked = false;
    memCards.forEach((c, i) => { c.textContent = memValues[i]; c.className = 'mem-card'; });
}

function memReshuffleUnmatched() {
    const unmatched = memCards.map((_,i) => i).filter(i => !memMatched[i]);
    const vals = unmatched.map(i => memValues[i]).sort(() => Math.random()-0.5);
    unmatched.forEach((i, j) => { memValues[i] = vals[j]; memCards[i].textContent = vals[j]; });
}

for (let i = 0; i < 12; i++) {
    const card = document.createElement('div');
    card.className = 'mem-card';
    card.addEventListener('click', () => {
        if (memLocked || memFlipped[i] || memMatched[i]) return;
        memFlipped[i] = true;
        card.classList.add('flipped');

        const open = memFlipped.map((f,idx) => f && !memMatched[idx] ? idx : -1).filter(x => x >= 0);
        if (open.length !== 2) return;

        const [a, b] = open;
        memLocked = true;

        if (memValues[a] === memValues[b]) {
            memMatched[a] = memMatched[b] = true;
            memCards[a].classList.add('matched');
            memCards[b].classList.add('matched');
            memFlipped[a] = memFlipped[b] = false;
            setVolume(Math.min(1, audio.volume + 1/6));
            memLocked = false;
            setTimeout(memReshuffleUnmatched, 600);
        } else {
            setTimeout(() => {
                memCards[a].classList.remove('flipped');
                memCards[b].classList.remove('flipped');
                memFlipped[a] = memFlipped[b] = false;
                setVolume(Math.max(0, audio.volume - 1/6));
                memLocked = false;
            }, 800);
        }
    });
    memGrid.appendChild(card);
    memCards.push(card);
}

memInit();
document.getElementById('memory-refresh').addEventListener('click', memInit);


// catch game

const catchBox = document.getElementById('catch-box');
const catchBucket = document.getElementById('catch-bucket');
const CATCH_W = 176, CATCH_H = 171;
const BALL_D = 14, BUCKET_W = 44, BUCKET_H = 24;
const BUCKET_BOTTOM = 6;
let bucketX = (CATCH_W - BUCKET_W) / 2;
let catchBalls = [];

const catchScrollbar = document.getElementById('catch-scrollbar');
const catchThumb = document.getElementById('catch-thumb');
const THUMB_W = 44;
let catchThumbDragging = false;
let catchThumbStartX = 0;
let catchThumbStartBucket = 0;

function updateBucket() {
    bucketX = Math.max(0, Math.min(CATCH_W - BUCKET_W, bucketX));
    catchBucket.style.left = bucketX + 'px';
    catchThumb.style.left = (bucketX / (CATCH_W - BUCKET_W) * (CATCH_W - THUMB_W)) + 'px';
}
updateBucket();

catchBox.addEventListener('wheel', (e) => {
    e.preventDefault();
    bucketX -= e.deltaX * 0.4;
    updateBucket();
    if (!catchRunning) catchStart();
}, { passive: false });

catchThumb.addEventListener('mousedown', (e) => {
    catchThumbDragging = true;
    catchThumbStartX = e.clientX;
    catchThumbStartBucket = bucketX;
    e.preventDefault();
});
document.addEventListener('mousemove', (e) => {
    if (!catchThumbDragging) return;
    const dx = e.clientX - catchThumbStartX;
    bucketX = catchThumbStartBucket + dx * (CATCH_W - BUCKET_W) / (CATCH_W - THUMB_W);
    updateBucket();
});
document.addEventListener('mouseup', () => catchThumbDragging = false);

function spawnCatchBall() {
    const filled = Math.random() > 0.4;
    const x = Math.random() * (CATCH_W - BALL_D);
    const el = document.createElement('div');
    el.className = 'catch-ball' + (filled ? ' filled' : '');
    el.style.left = x + 'px';
    el.style.top = '-22px';
    catchBox.appendChild(el);
    catchBalls.push({ el, x, y: -22, filled });
}

function catchUpdate() {
    const bucketTop = CATCH_H - BUCKET_BOTTOM - BUCKET_H;
    catchBalls = catchBalls.filter(ball => {
        ball.y += 1.5;
        ball.el.style.top = ball.y + 'px';

        if (ball.y + BALL_D >= bucketTop && ball.y <= bucketTop + BUCKET_H) {
            if (ball.x + BALL_D >= bucketX && ball.x <= bucketX + BUCKET_W) {
                setVolume(audio.volume + (ball.filled ? 0.1 : -0.1));
                ball.el.remove();
                return false;
            }
        }
        if (ball.y > CATCH_H) { ball.el.remove(); return false; }
        return true;
    });
    if (catchRunning) requestAnimationFrame(catchUpdate);
}

let catchRunning = false;
let catchSpawnInterval = null;

function catchStart() {
    if (catchRunning) return;
    catchRunning = true;
    catchSpawnInterval = setInterval(spawnCatchBall, 1200);
    catchUpdate();
}

function catchStop() {
    catchRunning = false;
    clearInterval(catchSpawnInterval);
    catchSpawnInterval = null;
    catchBalls.forEach(b => b.el.remove());
    catchBalls = [];
}

const catchWrapper = document.getElementById('catch-wrapper');
document.addEventListener('click', (e) => {
    if (catchRunning && !catchWrapper.contains(e.target)) catchStop();
});

catchBox.addEventListener('click', () => {
    if (!catchRunning) catchStart();
});


// scale

const scaleBox = document.getElementById('scale-box');
const scaleCircle = document.getElementById('scale-circle');
const SCALE_MIN = 10, SCALE_MAX = 170;
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
    if (scaleSize <= SCALE_MIN) { clearInterval(scaleInterval); scaleInterval = null; }
}

function scaleReset() {
    clearInterval(scaleInterval);
    scaleInterval = null;
    scaleSize = SCALE_MIN;
    scaleCircle.style.width = scaleSize + 'px';
    scaleCircle.style.height = scaleSize + 'px';
}

let scaleHeld = false;

scaleBox.addEventListener('mousedown', (e) => {
    scaleHeld = true;
    clearInterval(scaleInterval);
    scaleInterval = setInterval(scaleGrow, 30);
    e.stopPropagation();
});
document.addEventListener('mouseup', () => {
    if (!scaleHeld) return;
    scaleHeld = false;
    clearInterval(scaleInterval);
    scaleInterval = setInterval(scaleShrink, 30);
});
document.addEventListener('click', (e) => {
    if (!e.target.closest('#scale-box')) scaleReset();
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

