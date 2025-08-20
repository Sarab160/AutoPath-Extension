# AutoPath 🔄

AutoPath is a VS Code extension that **automatically updates file paths in your code** when you rename or move files inside your workspace.  

No need to manually update imports or data file paths — AutoPath does it for you instantly!  

---

## ✨ Features
- Detects file renames/moves in your workspace  
- Updates paths automatically in supported languages  
- Works silently — no need to press any key  

---

## 🖥️ Supported Languages
- Python (`.py`)  
- Jupyter Notebooks (`.ipynb`)  
- JavaScript (`.js`)  
- TypeScript (`.ts`)  
- Java (`.java`)  
- C / C++ (`.c`, `.cpp`)  
- R (`.r`)  

---

## 📦 How to Use
1. Install the extension from VS Code Marketplace  
2. Rename or move any file in your project  
3. AutoPath will automatically update the corresponding paths in your code  

---

## 📌 Example
If you move `data/train.csv` → `dataset/train.csv`, AutoPath will automatically update:  

```python
# Before
df = pd.read_csv("data/train.csv")

# After
df = pd.read_csv("dataset/train.csv")
