from flask import Flask, render_template, request, jsonify
import random
import numpy as np

app = Flask(__name__)

def policy_evaluation(grid_size, start, end, obstacles, policy, gamma=0.9, theta=0.001):
    """
    Standard Policy Evaluation algorithm.
    policy: list of actions for each cell index. 
    actions: 0: Up, 1: Down, 2: Left, 3: Right
    """
    n = grid_size
    V = np.zeros((n, n))
    
    # Action mapping: (dr, dc)
    # Up: (-1, 0), Down: (1, 0), Left: (0, -1), Right: (0, 1)
    actions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    
    # Terminal states: end cell and obstacles
    # Actually, obstacles might not be terminal, just blocked. 
    # But hitting them might incur penalty.
    # In common grid worlds, hitting an obstacle keeps you in the same cell.
    
    while True:
        delta = 0
        new_V = np.copy(V)
        for r in range(n):
            for c in range(n):
                # Skip terminal state (Goal/End) - usually V(goal) = 0 or we handle reward 
                if [r, c] == end:
                    continue
                
                # Check if current cell is an obstacle
                is_obstacle = False
                for obs in obstacles:
                    if [r, c] == obs:
                        is_obstacle = True
                        break
                if is_obstacle:
                    continue

                v = V[r, c]
                action_idx = policy[r * n + c]
                dr, dc = actions[action_idx]
                
                next_r, next_c = r + dr, c + dc
                
                # Boundary check
                if next_r < 0 or next_r >= n or next_c < 0 or next_c >= n:
                    next_r, next_c = r, c
                    reward = -1.0 # Hit boundary penalty
                else:
                    # Obstacle check
                    hit_obs = False
                    for obs in obstacles:
                        if [next_r, next_c] == obs:
                            hit_obs = True
                            break
                    if hit_obs:
                        next_r, next_c = r, c
                        reward = -1.0 # Hit obstacle penalty
                    elif [next_r, next_c] == end:
                        reward = 10.0 # Goal reward
                    else:
                        reward = -0.1 # Step penalty
                
                new_V[r, c] = reward + gamma * V[next_r, next_c]
                delta = max(delta, abs(v - new_V[r, c]))
        
        V = new_V
        if delta < theta:
            break
            
    return V.tolist()

def value_iteration(grid_size, goal, obstacles, gamma=0.9, theta=0.0001):
    n = grid_size
    V = np.zeros((n, n))
    actions = [(-1, 0), (1, 0), (0, -1), (0, 1)] # Up, Down, Left, Right
    
    # Value Iteration Loop
    while True:
        delta = 0
        new_V = np.copy(V)
        for r in range(n):
            for c in range(n):
                if [r, c] == goal or [r, c] in obstacles:
                    continue
                
                v = V[r, c]
                q_values = []
                for dr, dc in actions:
                    nr, nc = r + dr, c + dc
                    if nr < 0 or nr >= n or nc < 0 or nc >= n or [nr, nc] in obstacles:
                        nr, nc = r, c
                        reward = -1.0
                    elif [nr, nc] == goal:
                        reward = 10.0
                    else:
                        reward = -0.1
                    q_values.append(reward + gamma * V[nr, nc])
                
                new_V[r, c] = max(q_values)
                delta = max(delta, abs(v - new_V[r, c]))
        V = new_V
        if delta < theta:
            break
            
    # Extract Optimal Policy
    best_policy = [-1] * (n * n)
    for r in range(n):
        for c in range(n):
            if [r, c] == goal or [r, c] in obstacles:
                continue
            
            q_values = []
            for a_idx, (dr, dc) in enumerate(actions):
                nr, nc = r + dr, c + dc
                if nr < 0 or nr >= n or nc < 0 or nc >= n or [nr, nc] in obstacles:
                    nr, nc = r, c
                    reward = -1.0
                elif [nr, nc] == goal:
                    reward = 10.0
                else:
                    reward = -0.1
                q_values.append(reward + gamma * V[nr, nc])
            
            best_policy[r * n + c] = int(np.argmax(q_values))
            
    return V.tolist(), best_policy

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/evaluate', methods=['POST'])
def evaluate():
    data = request.json
    n = data['n']
    start = data['start']
    end = data['end']
    obstacles = data['obstacles']
    policy = data['policy'] # Flat list of action indices
    
    v_matrix = policy_evaluation(n, start, end, obstacles, policy)
    return jsonify({'v_matrix': v_matrix})

@app.route('/iterate', methods=['POST'])
def iterate():
    data = request.json
    n = data['n']
    goal = data['end']
    obstacles = data['obstacles']
    
    v_matrix, best_policy = value_iteration(n, goal, obstacles)
    return jsonify({
        'v_matrix': v_matrix,
        'best_policy': best_policy
    })

if __name__ == '__main__':
    app.run(debug=True)
