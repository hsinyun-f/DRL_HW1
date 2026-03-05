let n = 5;
let currentN = 5; // The actual size of the grid currently on screen
let startCell = null;
let endCell = null;
let obstacles = [];
let policy = [];
let selectionState = 'start'; // 'start', 'end', 'obstacle', 'done'

const gridContainer = document.getElementById('grid-container');
const valueGrid = document.getElementById('value-grid');
const generateBtn = document.getElementById('generate-grid');
const randomPolicyBtn = document.getElementById('random-policy-btn');
const evaluateBtn = document.getElementById('evaluate-btn');
const resetBtn = document.getElementById('reset-btn');
const instruction = document.getElementById('instruction');
const resultsSection = document.getElementById('results');

const ARROWS = ['↑', '↓', '←', '→'];

function init() {
    generateBtn.addEventListener('click', () => {
        const val = parseInt(document.getElementById('grid-size').value);
        if (val >= 5 && val <= 10) {
            n = val;
            currentN = val; // Store the size of the grid we are about to create
            resetGrid();
        } else {
            alert('Please enter a number between 5 and 9.');
        }
    });

    randomPolicyBtn.addEventListener('click', generateRandomPolicy);
    evaluateBtn.addEventListener('click', evaluatePolicy);
    resetBtn.addEventListener('click', resetGrid);
}

function resetGrid() {
    startCell = null;
    endCell = null;
    obstacles = [];
    policy = [];
    selectionState = 'start';
    resultsSection.style.display = 'none';
    randomPolicyBtn.disabled = true;
    evaluateBtn.disabled = true;

    updateInstruction();
    renderGrid();
}

function updateInstruction() {
    const maxObs = n - 2;
    switch (selectionState) {
        case 'start': instruction.textContent = 'Click to set the START cell (Green)'; break;
        case 'end': instruction.textContent = 'Click to set the END cell (Red)'; break;
        case 'obstacle': instruction.textContent = `Set up to ${maxObs} obstacles (Gray). Remaining: ${maxObs - obstacles.length}`; break;
        case 'done': instruction.textContent = 'Ready! Generate random policy or evaluate.'; break;
    }
}

function renderGrid() {
    gridContainer.innerHTML = '';
    gridContainer.style.gridTemplateColumns = `repeat(${n}, 60px)`;

    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.r = r;
            cell.dataset.c = c;

            cell.addEventListener('click', () => handleCellClick(r, c));

            gridContainer.appendChild(cell);
        }
    }
}

function handleCellClick(r, c) {
    if (selectionState === 'done') return;

    const cellIdx = r * n + c;
    const cellElement = gridContainer.children[cellIdx];

    // Prevent double assignment
    if (cellElement.classList.contains('start') || cellElement.classList.contains('end') || cellElement.classList.contains('obstacle')) {
        return;
    }

    if (selectionState === 'start') {
        startCell = [r, c];
        cellElement.classList.add('start');
        cellElement.textContent = 'S';
        selectionState = 'end';
    }
    else if (selectionState === 'end') {
        endCell = [r, c];
        cellElement.classList.add('end');
        cellElement.textContent = 'E';
        selectionState = 'obstacle';
    }
    else if (selectionState === 'obstacle') {
        obstacles.push([r, c]);
        cellElement.classList.add('obstacle');

        if (obstacles.length >= n - 2) {
            selectionState = 'done';
            randomPolicyBtn.disabled = false;
        }
    }

    updateInstruction();
}

function generateRandomPolicy() {
    policy = [];
    const cells = gridContainer.querySelectorAll('.cell');

    cells.forEach((cell, idx) => {
        const r = Math.floor(idx / n);
        const c = idx % n;

        // Remove old arrows
        const oldArrow = cell.querySelector('.arrow');
        if (oldArrow) oldArrow.remove();

        // Check if terminal or obstacle
        // Start cell (S) SHOULD have a policy action
        if ((r === endCell[0] && c === endCell[1]) ||
            obstacles.some(obs => obs[0] === r && obs[1] === c)) {
            policy.push(-1); // No action for terminal/obstacle
            return;
        }

        const action = Math.floor(Math.random() * 4);
        policy.push(action);

        const arrowSpan = document.createElement('span');
        arrowSpan.className = 'arrow';
        arrowSpan.textContent = ARROWS[action];
        cell.appendChild(arrowSpan);
    });

    evaluateBtn.disabled = false;
    instruction.textContent = 'Random policy generated. Click Evaluate to calculate V(s).';
}

// Ported Policy Evaluation logic from Python to JavaScript
function runPolicyEvaluation(gridSize, start, end, obstacles, policy, gamma = 0.9, theta = 0.001) {
    let V = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
    const actions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Up, Down, Left, Right

    let iterations = 0;
    while (iterations < 1000) { // Safety limit
        let delta = 0;
        let newV = V.map(row => [...row]);

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                // Skip Goal
                if (r === end[0] && c === end[1]) continue;

                // Skip Obstacles
                if (obstacles.some(obs => obs[0] === r && obs[1] === c)) continue;

                let v = V[r][c];
                let actionIdx = policy[r * gridSize + c];

                // Robust check for invalid action index
                if (actionIdx === undefined || actionIdx === null || actionIdx === -1) {
                    // This happens for goal or obstacles (which are already skipped above), 
                    // or if there's a policy data mismatch.
                    newV[r][c] = V[r][c];
                    continue;
                }

                let action = actions[actionIdx];
                if (!action) continue; // Safety
                let [dr, dc] = action;

                let nextR = r + dr;
                let nextC = c + dc;
                let reward = -0.1; // Default step penalty

                // Boundary check
                if (nextR < 0 || nextR >= gridSize || nextC < 0 || nextC >= gridSize) {
                    nextR = r;
                    nextC = c;
                    reward = -1.0;
                } else {
                    // Obstacle check
                    if (obstacles.some(obs => obs[0] === nextR && obs[1] === nextC)) {
                        nextR = r;
                        nextC = c;
                        reward = -1.0;
                    } else if (nextR === end[0] && nextC === end[1]) {
                        reward = 10.0;
                    }
                }

                newV[r][c] = reward + gamma * V[nextR][nextC];
                delta = Math.max(delta, Math.abs(v - newV[r][c]));
            }
        }

        V = newV;
        if (delta < theta) break;
        iterations++;
    }
    return V;
}

async function evaluatePolicy() {
    instruction.textContent = 'Evaluating (Client-side)...';

    // Simulate slight delay for effect
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        const vMatrix = runPolicyEvaluation(currentN, startCell, endCell, obstacles, policy);
        renderValueMatrix(vMatrix);
        instruction.textContent = 'Evaluation complete (computed locally)!';
    } catch (error) {
        console.error('Error:', error);
        instruction.textContent = 'Error during evaluation.';
    }
}

function renderValueMatrix(vMatrix) {
    resultsSection.style.display = 'block';
    valueGrid.innerHTML = '';
    valueGrid.style.gridTemplateColumns = `repeat(${n}, 60px)`;

    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const cell = document.createElement('div');
            cell.className = 'value-cell';

            const isObstacle = obstacles.some(obs => obs[0] === r && obs[1] === c);
            if (isObstacle) {
                cell.classList.add('gray');
                cell.textContent = 'Obs';
            } else {
                cell.textContent = vMatrix[r][c].toFixed(2);
                if (vMatrix[r][c] > 0) cell.style.color = 'var(--start)';
                if (vMatrix[r][c] < 0) cell.style.color = 'var(--end)';
            }

            valueGrid.appendChild(cell);
        }
    }

    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

init();
renderGrid();
updateInstruction();
