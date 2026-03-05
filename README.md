# DRL HW1: Grid World & Policy Evaluation

## 🌐 Demo Site
[**Click here to view the Demo**](https://hsinyun-f.github.io/DRL_HW1/)

## 1. 專案說明 (Walkthrough)
本作業開發了一個互動式的 Grid World 環境，並實作了策略評估演算法。

### HW1-1: 網格地圖開發
- 動態生成 $n \times n$ 網格 (5-9)。
- 點擊設定起點 (綠色)、終點 (紅色) 與障礙物 (灰色)。

### HW1-2: 策略評估
- 隨機生成每個格子的動作 (↑, ↓, ←, →)。
- 使用 Iterative Policy Evaluation 計算狀態價值 $V(s)$。
- 獎勵設定：終點 +10, 撞牆 -1, 移動 -0.1, $\gamma=0.9$。

## 2. 核心代碼 (app.py)

```python
def policy_evaluation(grid_size, start, end, obstacles, policy, gamma=0.9, theta=0.001):
    n = grid_size
    V = np.zeros((n, n))
    actions = [(-1, 0), (1, 0), (0, -1), (0, 1)] # Up, Down, Left, Right
    
    while True:
        delta = 0
        new_V = np.copy(V)
        for r in range(n):
            for c in range(n):
                if [r, c] == end or is_obstacle(r, c): continue
                
                action_idx = policy[r * n + c]
                dr, dc = actions[action_idx]
                next_r, next_c = clip(r + dr, c + dc) # 處理邊界
                
                reward = get_reward(next_r, next_c)
                new_V[r, c] = reward + gamma * V[next_r, next_c]
                delta = max(delta, abs(V[r, c] - new_V[r, c]))
        V = new_V
        if delta < theta: break
    return V
```

## 3. 開發總結
在本次對話中，我們從作業說明出發，完成了以下工作：
1. **環境搭建**: 建立了 Flask 專案結構。
2. **邏輯開發**: 實作了強化學習常用的策略評估算法。
3. **介面優化**: 使用 Vanila CSS 打造了具備 Modern UI 的互動式網頁。
4. **功能驗證**: 確保了用戶可以手動設定地圖並觀察價值函數的收斂。
