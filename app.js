/* ================= CONFIG ================= */
const EMPTY = '🟩';
const CAT = '🐱';
const WALL = '🧱';
const WORDS = ['CAT', 'DOG', 'SUN', 'MOON', 'CAR', 'BUS', 'HAT', 'BOOK'];

let SIZE = 5;
let TOTAL = 25;

/* ================= STATE ================= */
let grid = [];
let catIndex = -1;
let targetWord = '';
let collected = 0;
let queue = [];
let gameMode = 'daily';
let selectedDate = null;
let currentMonth = new Date();

/* ================= DEMO ================= */
let demoGrid = [];
let demoCat = 0;
const demoSequence = ['right', 'down', 'down', 'right'];
let demoCollected = 0;
const demoWord = ['C', 'A', 'T'];

function setupDemo() {
    demoGrid = [
        CAT,
        EMPTY,
        EMPTY,
        EMPTY,
        'C',
        EMPTY,
        EMPTY,
        'A',
        'T'
    ];

    demoCat = 0;
    renderDemoGrid();
    renderDemoQueue([]);
    demoCollected = 0;
}

function renderDemoGrid() {
    const g = document.getElementById('demo-grid');
    g.style.gridTemplateColumns = 'repeat(3,64px)';
    g.className = 'grid grid-3';
    g.innerHTML = '';

    demoGrid.forEach(v => {
        const d = document.createElement('div');
        d.className = 'cell';
        const s = document.createElement('span');
        s.textContent = v;
        d.appendChild(s);
        g.appendChild(d);
    });
}

function renderDemoQueue(list) {
    const q = document.getElementById('demoQueue');
    q.innerHTML = '';

    list.forEach(c => {
        const d = document.createElement('div');
        d.textContent =
        c === 'up' ? '⬆️':
        c === 'down' ? '⬇️':
        c === 'left' ? '⬅️': '➡️';
        q.appendChild(d);
    });
}

function highlight(id) {
    const el = document.getElementById(id);
    el.classList.add('demo-active');
    setTimeout(() => el.classList.remove('demo-active'), 400);
}

function moveDemo(dir) {
    demoGrid[demoCat] = EMPTY;

    if (dir === 'right') demoCat++;
    if (dir === 'down') demoCat += 3;

    // Check letter collection
    if (demoGrid[demoCat] === demoWord[demoCollected]) {
        demoCollected++;
    }

    demoGrid[demoCat] = CAT;
    renderDemoGrid();
}

function playDemo() {
    setupDemo();

    let i = 0;
    let shownQueue = [];

    /* PHASE 1: Build sequence (tap arrows only) */
    function buildSequence() {
        if (i < demoSequence.length) {
            const dir = demoSequence[i];

            highlight(
                dir === 'left' ? 'demoLeft':
                dir === 'up' ? 'demoUp':
                dir === 'down' ? 'demoDown': 'demoRight'
            );

            shownQueue.push(dir);
            renderDemoQueue(shownQueue);

            i++;
            setTimeout(buildSequence, 700);
        } else {
            // After sequence is ready, tap Run
            setTimeout(runPhase, 600);
        }
    }

    /* PHASE 2: Tap Run */
    function runPhase() {
        highlight('demoRun');
        i = 0;
        setTimeout(animateMoves, 600);
    }

    /* PHASE 3: Animate movement */
    function animateMoves() {
        if (i < demoSequence.length) {
            moveDemo(demoSequence[i]);
            i++;
            setTimeout(animateMoves, 700);
        } else {
            // Demo finished
            if (demoCollected === demoWord.length) {
                setTimeout(() => {
                    document.querySelector('#screen-demo p')
                    .textContent = 'Word completed';
                }, 400);
            }
        }
    }

    buildSequence();
}

function replayDemo() {
    playDemo();
}

function watchDemo() {
    goTo('demo');
    setupDemo();
    playDemo();
}

/* ================= NAV ================= */
function goTo(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    document.getElementById('screen-' + id).classList.add('active');

    if (id === 'game') {
        document.body.classList.add('game-active');
    } else {
        document.body.classList.remove('game-active');
    }
}

/* ================= STORAGE ================= */
function formatDate(d) {
    return d.toISOString().split('T')[0];
}
function getPlayed() {
    return JSON.parse(localStorage.getItem('playedDates')) || [];
}
function markPlayed(k) {
    const p = getPlayed();
    if (!p.includes(k)) {
        p.push(k);
        localStorage.setItem('playedDates', JSON.stringify(p));
    }
}

/* ================= DATE HELPER ================= */
function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

/* ================= CALENDAR ================= */
function renderCalendar() {
    const cal = document.getElementById('calendar');
    cal.innerHTML = '';

    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();

    document.getElementById('monthLabel').textContent =
    currentMonth.toLocaleString('default', {
        month: 'long', year: 'numeric'
    });

    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const played = getPlayed();

    for (let i = 0; i < firstDay; i++) {
        cal.appendChild(document.createElement('div'));
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        const date = new Date(y, m, d);
        date.setHours(0, 0, 0, 0);

        const key = formatDate(date);
        cell.textContent = d;

        if (played.includes(key)) cell.classList.add('done');

        if (date <= today) {
            cell.onclick = () => {
                if (played.includes(key)) {
                    if (!confirm("You already played this day.\nReplay?")) return;
                }
                startDaily(date);
            };
        } else {
            cell.classList.add('locked');
        }

        cal.appendChild(cell);
    }
}

function prevMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar();
}
function nextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar();
}

/* ================= GAME START ================= */
function startDaily(date) {
    gameMode = 'daily';
    selectedDate = date;
    SIZE = 5;
    TOTAL = 25;
    generatePuzzle(date.getTime());
}

function startTutorial(level) {
    gameMode = 'tutorial';
    SIZE = level === 'easy' ? 3: level === 'medium' ? 4: 5;
    TOTAL = SIZE * SIZE;
    generatePuzzle(Math.random() * 100000);
}

/* ================= SMART PUZZLE ================= */
function generatePuzzle(seed) {
    grid = Array(TOTAL).fill(EMPTY);
    queue = [];
    collected = 0;

    const rand = i => {
        const x = Math.sin(seed + i) * 10000;
        return x - Math.floor(x);
    };

    targetWord = WORDS[Math.floor(rand(1) * WORDS.length)];
    document.getElementById('wordHint').textContent = `Spell: ${targetWord}`;

    // 1️⃣ Place cat
    catIndex = Math.floor(rand(2) * TOTAL);

    // 2️⃣ Build a GUARANTEED PATH
    let path = [catIndex];
    let cur = catIndex;

    for (let i = 0; i < targetWord.length; i++) {
        let options = getNeighbors(cur).filter(n => !path.includes(n));
        if (!options.length) break;
        cur = options[Math.floor(rand(i + 10) * options.length)];
        path.push(cur);
    }

    // 3️⃣ Place letters ON the path
    for (let i = 0; i < targetWord.length; i++) {
        grid[path[i + 1]] = targetWord[i];
    }

    // 4️⃣ Place walls, BUT NEVER on the path
    let wallCount = SIZE + 2;
    let tries = 0;

    while (wallCount > 0 && tries < 100) {
        let w = Math.floor(rand(50 + tries) * TOTAL);
        if (grid[w] === EMPTY && !path.includes(w)) {
            grid[w] = WALL;
            wallCount--;
        }
        tries++;
    }

    grid[catIndex] = CAT;

    const gridEl = document.getElementById('grid');
    gridEl.className = 'grid grid-' + SIZE;
    gridEl.style.gridTemplateColumns = `repeat(${SIZE}, auto)`;

    renderGrid();
    renderQueue();
    goTo('game');
}

/* ================= HELPERS ================= */
function getNeighbors(i) {
    const n = [];
    if (i - SIZE >= 0) n.push(i - SIZE);
    if (i + SIZE < TOTAL) n.push(i + SIZE);
    if (i % SIZE !== 0) n.push(i - 1);
    if (i % SIZE !== SIZE - 1) n.push(i + 1);
    return n;
}

/* ================= GRID ================= */
function renderGrid() {
    const g = document.getElementById('grid');
    g.innerHTML = '';
    grid.forEach(v => {
        const d = document.createElement('div');
        d.className = 'cell';
        const s = document.createElement('span');
        s.textContent = v;
        d.appendChild(s);
        g.appendChild(d);
    });
}

/* ================= CONTROLS ================= */
function addCommand(d) {
    queue.push(d);
    renderQueue();
}

function clearQueue() {
    queue = [];
    renderQueue();
}

function renderQueue() {
    const q = document.getElementById('commandQueue');
    q.innerHTML = '';

    const MAX = 5; // number of visible slots

    queue.forEach(c => {
        const d = document.createElement('div');
        d.textContent =
        c === 'up' ? '⬆️':
        c === 'down' ? '⬇️':
        c === 'left' ? '⬅️': '➡️';
        q.appendChild(d);
    });

    // Fill empty slots
    for (let i = queue.length; i < MAX; i++) {
        const e = document.createElement('div');
        e.className = 'empty';
        q.appendChild(e);
    }
}

function runCommands() {
    if (!queue.length) return;
    move(queue.shift());
    renderQueue();
    setTimeout(runCommands, 300);
}

function move(dir) {
    let n = catIndex;
    if (dir === 'up') n -= SIZE;
    if (dir === 'down') n += SIZE;
    if (dir === 'left' && catIndex % SIZE !== 0) n--;
    if (dir === 'right' && catIndex % SIZE !== SIZE - 1) n++;

    if (n < 0 || n >= TOTAL || grid[n] === WALL) return;

    if (grid[n] === targetWord[collected]) collected++;
    else if (/[A-Z]/.test(grid[n])) return;

    grid[catIndex] = EMPTY;
    catIndex = n;
    grid[catIndex] = CAT;
    renderGrid();

    if (collected === targetWord.length) {
        if (gameMode === 'daily') {
            markPlayed(formatDate(selectedDate));
            renderCalendar();
        }
        goTo('main');
    }
}

function backToMain() {
    queue = [];
    goTo('main');
}

/* ================= INIT ================= */
window.onload = () => {
    goTo('demo');
    setupDemo();
    playDemo();
    renderCalendar();
};

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js");
}