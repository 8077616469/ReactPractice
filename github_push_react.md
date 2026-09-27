# 將 React 專案推送到 GitHub 並部署到 GitHub Pages

這份文件說明兩件事：
1. 把程式碼推送（push）到 GitHub 倉庫（純版本控制，不一定要能被瀏覽）
2. 把專案部署（deploy）成 GitHub Pages 網站，讓別人能透過網址瀏覽

如果你只是想「備份程式碼到 GitHub」，只需要第一部分。如果你想要一個像
`https://<你的帳號>.github.io/<專案名稱>/` 這樣的公開網址，需要兩部分都做。

---

## 第一部分：把程式碼推送到 GitHub

### 前置需求
- 已安裝 [Git](https://git-scm.com/)
- 已有 GitHub 帳號，並在 GitHub 網站上建立一個空的倉庫（repository）

### 步驟

在專案根目錄（`package.json` 所在的資料夾）打開終端機：

```bash
# 1. 初始化 git（如果專案還沒有 .git 資料夾）
git init

# 2. 把所有檔案加入追蹤
git add .

# 3. 建立第一次提交
git commit -m "初始版本"

# 4. 設定分支名稱為 main（GitHub 現在預設用 main）
git branch -M main

# 5. 連結到你在 GitHub 上建立的遠端倉庫
git remote add origin https://github.com/<你的帳號>/<倉庫名稱>.git

# 6. 推送上去
git push -u origin main
```

之後每次修改完程式碼，只需要：

```bash
git add .
git commit -m "說明這次改了什麼"
git push
```

> `.gitignore` 檔案（Create React App 專案通常已內建）會自動排除 `node_modules`、`build` 這類不需要上傳的資料夾，不用擔心把整個 `node_modules` 傳上去。

---

## 第二部分：部署成 GitHub Pages 網站

這一步會用 `gh-pages` 這個套件，把 `npm run build` 打包出來的靜態檔案，推到倉庫裡一個叫 `gh-pages` 的分支，GitHub 會自動用這個分支當作網站內容。

### 步驟 1：安裝 gh-pages 套件

```bash
npm install gh-pages --save-dev
```

### 步驟 2：設定 `package.json`

打開 `package.json`，需要加兩個地方：

**(1) 加入 `homepage` 欄位**（放在最外層，跟 `"name"`、`"version"` 同一層）：

```json
{
  "name": "hello-world",
  "version": "0.1.0",
  "homepage": "https://<你的帳號>.github.io/<倉庫名稱>",
  ...
}
```

例如你的倉庫叫 `ReactPractice`，帳號是 `8077616469`，就填：

```json
"homepage": "https://8077616469.github.io/ReactPractice"
```

**(2) 在 `scripts` 裡加入 `predeploy` 與 `deploy`**：

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

> `predeploy` 會在 `deploy` 執行前自動先跑一次 `npm run build`，所以你不需要手動先打包。

完整範例大致長這樣（依你原本的 `package.json` 內容為準，只是多這兩個欄位）：

```json
{
  "name": "hello-world",
  "version": "0.1.0",
  "private": true,
  "homepage": "https://8077616469.github.io/ReactPractice",
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

### 步驟 3：執行部署指令

```bash
npm run deploy
```

執行後會看到類似訊息：

```
> predeploy
> npm run build

Creating an optimized production build...
Compiled successfully.

> deploy
> gh-pages -d build

Published
```

看到 `Published` 就代表成功了。

#### 如果跳出終端機要求輸入帳號密碼

沒有設定 Git Credential Manager，或設定後仍跳出下面這種終端機文字提示：

```
Username for 'https://github.com':
Password for 'https://<帳號>@github.com':
```

填法如下：

- **Username for**：填你的 **GitHub 帳號名稱**，不是信箱。判斷方式很簡單——你的個人頁面網址 `https://github.com/<帳號名稱>` 裡，`github.com/` 後面那一串就是你的帳號名稱。例如網址是 `https://github.com/8077616469`，這裡就填 `8077616469`。
- **Password for**：**不能填 GitHub 登入密碼**（GitHub 已不接受密碼做 git 驗證）。要填在 [https://github.com/settings/tokens](https://github.com/settings/tokens) 這個頁面產生的 **Personal Access Token**（一長串英數字），把它當成密碼貼上去即可。

> Token 只會在產生當下顯示一次，記得先複製存起來，關掉頁面後就看不到了。如果之後 Token 過期或遺失，回到同一個頁面重新產生一組新的即可。

### 步驟 4：到 GitHub 上確認 Pages 設定

第一次部署完，通常需要到 GitHub 網站確認一次：

1. 進入你的倉庫 → **Settings** → **Pages**
2. **Source** 選擇 `Deploy from a branch`
3. **Branch** 選擇 `gh-pages` / `root`
4. 存檔後，稍等 1～2 分鐘，就能透過 `homepage` 設定的網址看到網站

---

## 之後更新網站的完整流程

每次改完程式碼，想要「同時更新 GitHub 上的原始碼」和「更新公開網站畫面」，順序建議是：

```bash
# 1. 先把原始碼推上去（版本控制用）
git add .
git commit -m "說明這次改了什麼"
git push

# 2. 再重新部署網站（畫面用）
npm run deploy
```

這兩件事是分開的：`git push` 只更新原始碼倉庫（別人看程式碼用的），`npm run deploy` 才會真正更新網站畫面。忘記跑 `npm run deploy` 的話，就算原始碼推上去了，網站畫面也不會變。

---

## 常見問題排解

- **`npm run deploy` 出現 `gh-pages: command not found`**：代表步驟 1 的 `npm install gh-pages --save-dev` 沒裝成功，重新執行一次。
- **網站打開是空白頁，Console 出現 404**：通常是 `package.json` 的 `homepage` 網址打錯，或跟實際倉庫名稱不一致，仔細核對後重新 `npm run deploy`。
- **推送 `git push` 或 `npm run deploy` 時要求輸入帳號密碼，但輸入密碼失敗**：GitHub 目前不接受帳號密碼登入，帳號填 GitHub 帳號名稱、密碼改填 Personal Access Token，詳細填法見上方「如果跳出終端機要求輸入帳號密碼」小節。
- **改了程式碼、也 `npm run deploy` 了，但網站畫面沒變**：先確認終端機有顯示 `Published` 沒有報錯；也可能是瀏覽器快取，試著強制重新整理（`Ctrl + Shift + R`）。