# 對話紀錄：深度強化學習 (DRL) HW1 開發過程

**開發目標**：完成 Grid World (網格世界) 環境開發，並實作 Policy Evaluation (策略評估) 與 Value Iteration (價值迭代) 演算法。

---

### 第一階段：專案初始化與功能開發

**USER**: 可以依照這個作業的說明 完成這個作業並解釋嗎？（附上 HW1-1 與 HW1-2 說明圖）

**AI (Antigravity)**: 幫您建立基於 Python (Flask) 加上前端介面的完整網頁應用程式：
1. **HW1-1 地圖實作**：動態生成 5~9 大小的互動網格，使用者可以點擊設定「起點 (S)」、「終點 (E)」和「障礙物」。
2. **HW1-2 策略評估**：設定隨機動作 (上、下、左、右)，並實作 Iterative Policy Evaluation 演算法（給定 $\gamma=0.9$、終點獎勵 +10、撞牆 -1、移動 -0.1）。
3. 程式碼採用 Flask 提供 API 用來在後端計算數學矩陣，然後回傳至前端顯示。

---

### 第二階段：靜態網頁移植與 Bug 修復

**USER**: 為甚麼 GitHub Pages 上的 demo 連結會無法顯示計算結果？

**AI**: 因為 GitHub Pages 只支援「靜態網站 (HTML/CSS/JS)」，無法運行 Python Flask 後端。為了讓您的 Demo 能順利運作，我會將原本位於 `app.py` 內的數學計算邏輯 (Policy Evaluation) 完全移植到 JavaScript (`main.js`) 內，改由瀏覽器端直接計算。

**USER**: 點擊 Evaluate Policy 時出現「Error during evaluation.」的錯誤。

**AI**: 找到了兩個潛在的 Bug，並已修復：
1. **格子狀態問題**：當您在輸入框修改網格數字，但尚未點擊 Generate 時，後端與前端格子數量不匹配，導致越界存取 `undefined`。
2. **起點處理問題**：起點 (S) 之前在生成隨機策略時被忽略了。價值計算在遇到起點時找不到對應動作而報錯。
**修復方式**：我完全重寫了前端 JavaScript，使用了雙倍緩衝 (Dual Buffer) 和 `Float64Array` 讓演算法結構更穩定。

---

### 第三階段：演算法擴充：Value Iteration

**USER**: 現在還要用 Value Iteration 繪製最佳路徑。（附上 Value Iteration 演算法圖片）

**AI**: 沒問題！我已在介面上加入了 **Value Iteration** 的功能：
1. 實作 Value Iteration (Algorithm 2) 直接計算出每個狀態的最大價值 $V^*(s)$ 與最佳策略 $\pi^*(s)$。
2. 計算完成後，將最佳策略以箭頭符號覆蓋到網格上。
3. 自動從起點尋找最佳方向，並將「最佳路徑」以黃色高亮顯示。

---

### 第四階段：UI 優化與雙核心架構

**USER**: 可以在原本的網格上標數字嗎？

**AI**: 已經將 1 到 $n \times n$ 的數字標記在每個格子的左上角，同時「起點 S」與「終點 E」標籤也與數字共存，不會被覆蓋，讓畫面更貼近作業需求中的示意圖。

**USER**: 好像還是要用 flask 的網頁應用程式。

**AI**: 了解。我已經把原本的 Flask 專案架構重新加回去，並設計了「雙核心 (Hybrid) 運算模式」：
1. **首選後端 (Python)**：現在介面在計算時會優先送 Request 給 `app.py` 的 `/evaluate` 和 `/iterate` 路由，使用 Python 執行矩陣運算。
2. **本地備援 (JS Fallback)**：如果您將專案發布在無法執行 Python 的 GitHub Pages，程式在呼叫 API 失敗時，會自動切換為前端 JS 運算模式。
這個架構讓您不僅能在 Demo 網站流暢展示，也能滿足繳交標準 Python 專案的需求作業！

---
*(註：本紀錄已過濾掉部署與介面調整等無關作業技術討論的其他對話細節。)*
