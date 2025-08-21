# AutoPath 🔄

AutoPath is a VS Code extension that **automatically updates file paths in your code** whenever you **rename or move files inside the VS Code Explorer**.  

No more broken imports or missing data file errors — AutoPath keeps your code in sync instantly.  

---

## ✨ Features
- Updates paths when you **rename or move files/folders** in VS Code  Explorer
- Preserves your original path style (`r""`, `\\`, `/`)  
- Shows a popup with **old vs new paths** for transparency  
- Works automatically — no extra steps needed  

---

## ⚠️ Limitations

AutoPath only works when files are renamed or moved using the VS Code Explorer.

---

## 🖥️ Supported Languages
- Python (`.py`)  
- Jupyter Notebooks (`.ipynb`)  
- JavaScript / TypeScript (`.js`, `.ts`)  
- Java (`.java`)  
- C / C++ (`.c`, `.cpp`)  
- R (`.r`)  

---

## 📦 How to Use
1. Install the extension from the VS Code Marketplace  
2. Use the **Explorer** to rename or move any file in your project  
3. AutoPath will detect the change and automatically update all references in your code  

---

## 📌 Example
Move a CSV file in the Explorer:  

```python
# Before
df = pd.read_csv("data/train.csv")

# After (file moved to dataset/)
df = pd.read_csv("dataset/train.csv")

AutoPath also works when you rename the file:

# Before
df = pd.read_csv("dataset/train.csv")

# After (file renamed → housing.csv)
df = pd.read_csv("dataset/housing.csv"