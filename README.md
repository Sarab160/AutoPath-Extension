# AutoPath 🔄

AutoPath is a VS Code extension that **automatically updates file paths in your code** whenever you **rename, move, or cut/paste files and folders inside VS Code Explorer or Windows Explorer**.  

No more broken imports or missing data file errors — AutoPath keeps your code in sync instantly and shows **informative popups** of changes.

---

## ✨ Features
- **Automatic path updates** when you rename, move, or cut/paste files and folders in **VS Code Explorer**.
- Detects **file moves in Windows Explorer**, including subfolders, and updates all references.
- Preserves your original path style (`r""`, `\\`, `/`) automatically.
- **Popup notifications** show old → new paths after updates.
- **Broken path auto-fix**: automatically finds missing paths and replaces them.
- Works with Python, Jupyter Notebooks, JavaScript/TypeScript, Java, C/C++, R, and other referenced files like CSV, JSON, etc.

---

## ⚡ How It Works
1. AutoPath listens to **file rename events** inside VS Code Explorer.
2. Monitors your project folder using `chokidar` to detect **file moves from Windows Explorer**.
3. When a file path changes, AutoPath automatically scans your workspace for references and updates them.
4. After updates, a **popup notification** shows which paths were changed.
5. Optional: Fix broken paths manually via the Command Palette with `AutoPath: Fix Broken Paths`.

---

## 📦 How to Use
1. Install the extension from the **VS Code Marketplace**.
2. Rename, move, or cut/paste files inside **VS Code Explorer** or **Windows Explorer**.
3. AutoPath automatically updates all references in your workspace.
4. Check the **popup notification** for the old and new paths.
5. Optional: Run `AutoPath: Fix Broken Paths` from the Command Palette to repair any missing paths.

---
---

## 🖥️ Supported Languages
- Python (.py)  
- Jupyter Notebooks (.ipynb)  
- JavaScript / TypeScript (.js, .ts)  
- Java (.java)  
- C / C++ (.c, .cpp)  
- R (.r)  
- Other file types like `.csv`, `.json`, or any referenced files in your code

---

## ⚠️ Limitations
- Works best when files are inside a VS Code workspace folder.
- AutoPath cannot track moves outside of the workspace root that are not re-added to the workspace.
- For very large projects, only the first 50 path changes appear in a popup for clarity.
- Some complex string constructions or dynamically generated paths may not be detected automatically.

---

## 🎯 Summary
AutoPath keeps your file references in sync automatically, prevents broken imports, missing CSVs, or renamed scripts.  
No manual updates, no errors — just smooth, worry-free coding.

## 📌 Examples

**Example 1: Move a CSV file**

```python
# Before
df = pd.read_csv("data/train.csv")

# File moved to dataset/
# After AutoPath
df = pd.read_csv("dataset/train.csv")

Example 2: Rename a file

# Before
df = pd.read_csv("dataset/train.csv")

# File renamed to housing.csv
# After AutoPath
df = pd.read_csv("dataset/housing.csv")

Example 3: Broken path auto-fix

# Before
df = pd.read_csv("data/old_file.csv")  # file deleted or missing

# After running AutoPath fix
df = pd.read_csv("dataset/new_file.csv")  # path automatically fixed

