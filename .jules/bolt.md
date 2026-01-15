## 2025-05-23 - Canvas Animation Loop Optimization
**Learning:** In high-frequency render loops (like canvas animations), repeatedly constructing template strings (e.g., `rgba(${r},${g},${b},${a})`) creates significant garbage collection pressure. Pre-calculating these strings outside the loop is a simple but effective optimization.
**Action:** Identify properties that are constant per-frame (like colors that only change on theme switch) and cache their full CSS string representations during initialization or update events.
