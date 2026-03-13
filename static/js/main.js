'use strict';

// ── State ──────────────────────────────────────────────────────────────────────
let gridN = 5;          // current rendered grid size
let startCell = null;   // [row, col]
let endCell = null;   // [row, col]
let obstacles = [];     // [[row, col], ...]
let policy = [];     // flat array length n*n, values 0=Up 1=Down 2=Left 3=Right, -1=none
let phase = 'idle'; // idle | start | end | obstacle | done

const DR = [-1, 1, 0, 0];  // action row deltas (Up, Down, Left, Right)
const DC = [0, 0, -1, 1];  // action col deltas
const ARROWS = ['↑', '↓', '←', '→'];

// ── DOM refs ────────────────────────────────────────────────────────────────────
const elGrid = document.getElementById('grid-container');
const elValueGrid = document.getElementById('value-grid');
const elSizeInput = document.getElementById('grid-size');
const elGenBtn = document.getElementById('generate-grid');
const elPolicyBtn = document.getElementById('random-policy-btn');
const elEvalBtn = document.getElementById('evaluate-btn');
const elValueIterationBtn = document.getElementById('value-iteration-btn');
const elResetBtn = document.getElementById('reset-btn');
const elMsg = document.getElementById('instruction');
const elResults = document.getElementById('results');

// ── Main setup ──────────────────────────────────────────────────────────────────
function init() {
    elGenBtn.addEventListener('click', onGenerate);
    elPolicyBtn.addEventListener('click', onRandomPolicy);
    elEvalBtn.addEventListener('click', onEvaluate);
    elValueIterationBtn.addEventListener('click', onValueIteration);
    elResetBtn.addEventListener('click', onReset);
    buildGrid(5);
}

function onGenerate() {
    const val = parseInt(elSizeInput.value, 10);
    if (isNaN(val) || val < 5 || val > 9) {
        alert('Please enter a number between 5 and 9.');
        return;
    }
    buildGrid(val);
}

function buildGrid(n) {
    gridN = n;
    startCell = null;
    endCell = null;
    obstacles = [];
    policy = [];
    phase = 'start';

    elPolicyBtn.disabled = true;
    elEvalBtn.disabled = true;
    elValueIterationBtn.disabled = true;
    elResults.style.display = 'none';

    // Build DOM grid
    elGrid.innerHTML = '';
    elGrid.style.gridTemplateColumns = `repeat(${n}, 60px)`;

    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${r}-${c}`;

            const numSpan = document.createElement('span');
            numSpan.className = 'cell-index';
            numSpan.textContent = r * n + c + 1;
            cell.appendChild(numSpan);

            cell.addEventListener('click', () => onCellClick(r, c));
            elGrid.appendChild(cell);
        }
    }

    setMsg('Click to set the START cell (Green)');
}

function onReset() {
    buildGrid(gridN);
    setMsg('Click to set the START cell (Green)');
}

function onCellClick(r, c) {
    if (phase === 'idle' || phase === 'done') return;

    const cell = document.getElementById(`cell-${r}-${c}`);
    if (!cell) return;

    // Cannot click already-assigned cells
    if (cell.classList.contains('start') ||
        cell.classList.contains('end') ||
        cell.classList.contains('obstacle')) return;

    if (phase === 'start') {
        startCell = [r, c];
        cell.classList.add('start');

        const label = document.createElement('span');
        label.className = 'cell-label';
        label.textContent = 'S';
        cell.appendChild(label);

        phase = 'end';
        setMsg('Click to set the END cell (Red)');

    } else if (phase === 'end') {
        endCell = [r, c];
        cell.classList.add('end');

        const label = document.createElement('span');
        label.className = 'cell-label';
        label.textContent = 'E';
        cell.appendChild(label);

        phase = 'obstacle';
        const maxObs = gridN - 2;
        setMsg(`Set up to ${maxObs} obstacles (Gray). Remaining: ${maxObs - obstacles.length}`);

    } else if (phase === 'obstacle') {
        obstacles.push([r, c]);
        cell.classList.add('obstacle');
        const maxObs = gridN - 2;
        const remaining = maxObs - obstacles.length;

        if (remaining <= 0) {
            phase = 'done';
            elPolicyBtn.disabled = false;
            elValueIterationBtn.disabled = false;
            setMsg('Ready! Click "Generate Random Policy" or "Value Iteration".');
        } else {
            setMsg(`Set up to ${maxObs} obstacles (Gray). Remaining: ${remaining}`);
        }
    }
}

function onRandomPolicy() {
    const n = gridN;
    policy = new Array(n * n).fill(-1);

    // Remove old arrows and path highlights
    elGrid.querySelectorAll('.arrow').forEach(a => a.remove());
    elGrid.querySelectorAll('.cell').forEach(c => c.classList.remove('path'));

    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const idx = r * n + c;
            const cell = document.getElementById(`cell-${r}-${c}`);
            if (!cell) continue;

            // End cell and obstacles get no action
            const isEnd = endCell && r === endCell[0] && c === endCell[1];
            const isObs = obstacles.some(o => o[0] === r && o[1] === c);
            if (isEnd || isObs) {
                policy[idx] = -1;
                continue;
            }

            // Every other cell (including Start) gets a random action
            const action = Math.floor(Math.random() * 4);
            policy[idx] = action;

            const span = document.createElement('span');
            span.className = 'arrow';
            span.textContent = ARROWS[action];
            // If start/end, append alongside existing text
            cell.appendChild(span);
        }
    }

    elEvalBtn.disabled = false;
    setMsg('Random policy generated. Click "Evaluate Policy" to compute V(s).');
}

async function onEvaluate() {
    setMsg('Evaluating (via Python Backend)…');
    const n = gridN;

    if (!startCell || !endCell || policy.length !== n * n) {
        setMsg('Error: missing start/end or policy.');
        return;
    }

    try {
        const response = await fetch('/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ n, start: startCell, end: endCell, obstacles, policy })
        });
        const data = await response.json();
        renderValues(data.v_matrix);
        setMsg('Policy Evaluation complete (Python)!');
    } catch (e) {
        // Fallback to local JS if backend fails
        console.warn('Backend failed, falling back to local JS:', e);
        try {
            const matrixV = computePolicyEval(n, endCell, obstacles, policy);
            renderValues(matrixV);
            setMsg('Policy Evaluation complete (JS Fallback)!');
        } catch (localErr) {
            setMsg('Evaluation failed: ' + localErr.message);
        }
    }
}

async function onValueIteration() {
    setMsg('Running Value Iteration (via Python Backend)…');
    const n = gridN;

    elGrid.querySelectorAll('.cell').forEach(c => c.classList.remove('path'));
    elGrid.querySelectorAll('.arrow').forEach(a => a.remove());

    try {
        const response = await fetch('/iterate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ n, start: startCell, end: endCell, obstacles })
        });
        const data = await response.json();
        renderValues(data.v_matrix);

        const bestPolicy = data.best_policy;
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const idx = r * n + c;
                const a = bestPolicy[idx];
                if (a !== -1) {
                    const cell = document.getElementById(`cell-${r}-${c}`);
                    const span = document.createElement('span');
                    span.className = 'arrow';
                    span.textContent = ARROWS[a];
                    cell.appendChild(span);
                }
            }
        }
        drawBestPath(n, startCell, endCell, obstacles, bestPolicy);
        setMsg('Value Iteration complete (Python)! Path highlighted.');
    } catch (e) {
        console.warn('Backend failed, falling back to local JS:', e);
        try {
            const result = runValueIteration(n, endCell, obstacles);
            renderValues(result.V);
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    const idx = r * n + c;
                    const a = result.policy[idx];
                    if (a !== -1) {
                        const cell = document.getElementById(`cell-${r}-${c}`);
                        const span = document.createElement('span');
                        span.className = 'arrow';
                        span.textContent = ARROWS[a];
                        cell.appendChild(span);
                    }
                }
            }
            drawBestPath(n, startCell, endCell, obstacles, result.policy);
            setMsg('Value Iteration complete (JS Fallback)!');
        } catch (localErr) {
            setMsg('Value Iteration failed: ' + localErr.message);
        }
    }
}

// ── Algorithm 2: Value Iteration ─────────────────────────────────────────────
function runValueIteration(n, goal, obstacles, gamma = 0.9, theta = 1e-4) {
    let V = new Float64Array(n * n).fill(0);
    const isObstacle = new Uint8Array(n * n);
    obstacles.forEach(o => { isObstacle[o[0] * n + o[1]] = 1; });
    const goalIdx = goal[0] * n + goal[1];

    // Iterative update
    for (let iter = 0; iter < 1000; iter++) {
        let delta = 0;
        let nextV = new Float64Array(n * n);

        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const idx = r * n + c;
                if (idx === goalIdx || isObstacle[idx]) {
                    nextV[idx] = 0; // Terminal/Obstacle values stay 0
                    continue;
                }

                let maxVal = -Infinity;
                for (let a = 0; a < 4; a++) {
                    let nr = r + DR[a];
                    let nc = c + DC[a];
                    let reward;

                    if (nr < 0 || nr >= n || nc < 0 || nc >= n || isObstacle[nr * n + nc]) {
                        nr = r; nc = c;
                        reward = -1.0;
                    } else if (nr === goal[0] && nc === goal[1]) {
                        reward = 10.0;
                    } else {
                        reward = -0.1;
                    }
                    const val = reward + gamma * V[nr * n + nc];
                    if (val > maxVal) maxVal = val;
                }
                nextV[idx] = maxVal;
                delta = Math.max(delta, Math.abs(V[idx] - nextV[idx]));
            }
        }
        V = nextV;
        if (delta < theta) break;
    }

    // Extract deterministic policy
    const bestPolicy = new Array(n * n).fill(-1);
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const idx = r * n + c;
            if (idx === goalIdx || isObstacle[idx]) continue;

            let maxVal = -Infinity;
            let bestA = 0;
            for (let a = 0; a < 4; a++) {
                let nr = r + DR[a], nc = c + DC[a];
                let reward;
                if (nr < 0 || nr >= n || nc < 0 || nc >= n || isObstacle[nr * n + nc]) {
                    nr = r; nc = c; reward = -1.0;
                } else if (nr === goal[0] && nc === goal[1]) {
                    reward = 10.0;
                } else {
                    reward = -0.1;
                }
                const val = reward + gamma * V[nr * n + nc];
                if (val > maxVal) { maxVal = val; bestA = a; }
            }
            bestPolicy[idx] = bestA;
        }
    }

    // Convert flat V to 2D for rendering
    const V2D = [];
    for (let r = 0; r < n; r++) V2D.push(Array.from(V.subarray(r * n, r * n + n)));
    return { V: V2D, policy: bestPolicy };
}

function drawBestPath(n, start, goal, obstacles, bestPolicy) {
    let curR = start[0], curC = start[1];
    const goalIdx = goal[0] * n + goal[1];
    const visited = new Set();

    for (let step = 0; step < n * n; step++) {
        const idx = curR * n + curC;
        if (idx === goalIdx) break;
        if (visited.has(idx)) break; // Cycle protection
        visited.add(idx);

        const cell = document.getElementById(`cell-${curR}-${curC}`);
        cell.classList.add('path');

        const a = bestPolicy[idx];
        if (a === -1) break;

        let nr = curR + DR[a], nc = curC + DC[a];
        // Boundary/obstacle check (though policy should avoid them if possible)
        const isObs = obstacles.some(o => o[0] === nr && o[1] === nc);
        if (nr < 0 || nr >= n || nc < 0 || nc >= n || isObs) {
            break; // Stuck
        }
        curR = nr; curC = nc;
    }
}

// ── Policy Evaluation (pure JS) ───────────────────────────────────────────────
function computePolicyEval(n, goal, obstacles, policy, gamma = 0.9, theta = 1e-4) {
    // V stored as flat Float64Array for speed
    let V = new Float64Array(n * n);
    let nextV = new Float64Array(n * n);

    const isObstacle = new Uint8Array(n * n);
    obstacles.forEach(o => { isObstacle[o[0] * n + o[1]] = 1; });

    const goalIdx = goal[0] * n + goal[1];

    for (let iter = 0; iter < 2000; iter++) {
        let delta = 0;

        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const idx = r * n + c;

                // Terminal states: copy current value unchanged
                if (idx === goalIdx || isObstacle[idx]) {
                    nextV[idx] = V[idx];
                    continue;
                }

                const a = policy[idx];
                if (a === -1 || a === undefined || a === null) {
                    nextV[idx] = V[idx];
                    continue;
                }

                // Compute next state
                let nr = r + DR[a];
                let nc = c + DC[a];
                let reward;

                // Out of bounds?
                if (nr < 0 || nr >= n || nc < 0 || nc >= n) {
                    nr = r; nc = c;
                    reward = -1.0;
                } else {
                    const nIdx = nr * n + nc;
                    if (isObstacle[nIdx]) {
                        nr = r; nc = c;
                        reward = -1.0;
                    } else if (nIdx === goalIdx) {
                        reward = 10.0;
                    } else {
                        reward = -0.1;
                    }
                }

                const old = V[idx];
                nextV[idx] = reward + gamma * V[nr * n + nc];
                delta = Math.max(delta, Math.abs(old - nextV[idx]));
            }
        }

        // Swap buffers
        V.set(nextV);
        if (delta < theta) break;
    }

    // Convert flat array back to 2D
    const matrix = [];
    for (let r = 0; r < n; r++) {
        matrix.push(Array.from(V.subarray(r * n, r * n + n)));
    }
    return matrix;
}

// ── Render value matrix ────────────────────────────────────────────────────────
function renderValues(V) {
    const n = gridN;
    elValueGrid.innerHTML = '';
    elValueGrid.style.gridTemplateColumns = `repeat(${n}, 60px)`;
    elResults.style.display = 'block';

    const isObsAt = (r, c) => obstacles.some(o => o[0] === r && o[1] === c);
    const isGoal = (r, c) => endCell && r === endCell[0] && c === endCell[1];

    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const div = document.createElement('div');
            div.className = 'value-cell';

            if (isObsAt(r, c)) {
                div.classList.add('gray');
                div.textContent = 'Obs';
            } else if (isGoal(r, c)) {
                div.style.color = 'var(--start)';
                div.textContent = 'Goal';
            } else {
                const val = V[r][c];
                div.textContent = val.toFixed(2);
                div.style.color = val >= 0 ? 'var(--start)' : 'var(--end)';
            }

            elValueGrid.appendChild(div);
        }
    }

    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function setMsg(text) {
    elMsg.textContent = text;
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
