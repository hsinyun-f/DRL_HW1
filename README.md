# DRL HW1: Grid World & Policy Algorithms

## 🚀 [**Live Demo: Click Here to Launch**](https://hsinyun-f.github.io/DRL_HW1/)

## 🎬 Video Demo
![Project Demo](https://youtu.be/4HcU6nkHwCc)

---

## 1. Project Overview
This project is an interactive **Grid World** simulation developed for Deep Reinforcement Learning Homework 1. It allows users to design a grid environment and visualize fundamental RL algorithms: **Policy Evaluation** and **Value Iteration**.

### HW1-1: Grid Map Development
- **Dynamic Grid**: Generate $n \times n$ grids (sizes 5-9).
- **Interactive Setup**: 
    - Click to set the **Start (S)** (Green cell).
    - Click to set the **End (E)** (Red cell).
    - Set up to $n-2$ **Obstacles** (Gray cells).
- **Cell Identity**: Every cell is clearly numbered (1 to $n^2$) for easy reference.

### HW1-2: Policy & Value Algorithms
- **Random Policy Generation**: Assign random actions (↑, ↓, ←, →) to all navigable cells.
- **Policy Evaluation**: Compute the state-value function $V(s)$ for the current random policy using the iterative method.
- **Value Iteration (Algorithm 2)**: 
    - Computes the **Optimal Value Function** and the **Optimal Policy** simultaneously.
    - **Best Path Visualization**: Automatically highlights the shortest and most valuable path from Start to End using the optimal policy derived from Value Iteration.

## 2. Environment Parameters
- **Discount Factor ($\gamma$)**: 0.9
- **Goal Reward**: +10.0
- **Boundary/Obstacle Penalty**: -1.0
- **Step Penalty**: -0.1
- **Convergence Threshold ($\theta$)**: 1e-4

## 3. Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, and JavaScript (ES6+).
- **Computation**: High-performance client-side computation using TypedArrays in JavaScript.
- **Hosting**: GitHub Pages (Static Site).

## 4. How to Use
1. Enter the grid size and click **Generate Square**.
2. Click cells to place the **Start**, **End**, and **Obstacles**.
3. Choose an algorithm:
    - Click **Generate Random Policy** followed by **Evaluate Policy** to see how a random agent performs.
    - Click **Value Iteration** to find the optimal solution and visualize the best path.
