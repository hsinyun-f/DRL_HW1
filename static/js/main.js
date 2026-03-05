let n = 5;
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
    switch(selectionState) {
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
        if ((r === startCell[0] && c === startCell[1]) || 
            (r === endCell[0] && c === endCell[1]) || 
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

async function evaluatePolicy() {
    instruction.textContent = 'Evaluating...';
    
    try {
        const response = await fetch('/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                n: n,
                start: startCell,
                end: endCell,
                obstacles: obstacles,
                policy: policy
            })
        });
        
        const data = await response.json();
        renderValueMatrix(data.v_matrix);
        instruction.textContent = 'Evaluation complete!';
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
