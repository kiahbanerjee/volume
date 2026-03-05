// ---- 1. LINEAR CIRCLES ----

const TOTAL = 16;
let count = 5;

function render() {
    const container = document.getElementById('circles');
    container.innerHTML = '';
    for (let i = TOTAL; i >= 1; i--) {
        const circle = document.createElement('div');
        circle.className = 'circle' + (i <= count ? ' filled' : '');
        container.appendChild(circle);
    }
}

render();

document.getElementById('down').addEventListener('click', () => {
    count = Math.max(0, count - 1);
    render();
});

document.getElementById('up').addEventListener('click', () => {
    count = Math.min(TOTAL, count + 1);
    render();
});


// ---- 2. GRID OF CIRCLES ----

const grid = document.getElementById('grid');
for (let i = 0; i < 88; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.addEventListener('click', () => cell.classList.toggle('on'));
    grid.appendChild(cell);
}


// ---- 3. RANDOM CIRCLES ----

const DOT_SIZE = 36;

function overlaps(x, y, placed) {
    return placed.some(p => Math.hypot(p.x - x, p.y - y) < DOT_SIZE + 4);
}

function spawn() {
    const box = document.getElementById('box');
    box.querySelectorAll('.dot').forEach(el => el.remove());
    const w = box.clientWidth;
    const h = box.clientHeight;
    const placed = [];

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


// ---- 4. SCROLL PICKER ----

const PICKER_TOTAL = 10;
const PICKER_CENTER = 140; // vertical center of the 280px container
let pickerIndex = 0; // 0-based, current selected

const pickerList = document.getElementById('picker-list');
const pickerThumb = document.getElementById('picker-thumb');
const pickerItems = [];

for (let i = 0; i < PICKER_TOTAL; i++) {
    const item = document.createElement('div');
    item.className = 'picker-item';
    item.textContent = i + 1;
    pickerList.appendChild(item);
    pickerItems.push(item);
}

function updatePicker() {
    pickerItems.forEach((item, i) => {
        const dist = i - pickerIndex;

        // only show prev, current, next
        if (Math.abs(dist) > 1) {
            item.style.opacity = 0;
            return;
        }

        const angle = dist * 0.9;
        const scale = Math.cos(angle);

        // y: arc — center at middle, prev curves up-left, next curves down-left
        const y = PICKER_CENTER + Math.sin(angle) * 160 - 10;
        // x: sweeps left as items move away
        const x = 16 + 80 * scale;

        const size = Math.max(14, Math.round(80 * scale));
        const grey = dist === 0 ? 0 : 160;
        const color = `rgb(${grey},${grey},${grey})`;

        item.style.top = y + 'px';
        item.style.left = x + 'px';
        item.style.fontSize = size + 'px';
        item.style.color = color;
        item.style.opacity = 1;
    });

    // scrollbar thumb
    const trackH = pickerThumb.parentElement.offsetHeight;
    const thumbH = 40;
    const travel = trackH - thumbH;
    pickerThumb.style.top = Math.round((pickerIndex / (PICKER_TOTAL - 1)) * travel) + 'px';
}

pickerList.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY > 0) pickerIndex = Math.min(PICKER_TOTAL - 1, pickerIndex + 1);
    else pickerIndex = Math.max(0, pickerIndex - 1);
    updatePicker();
}, { passive: false });

updatePicker();
