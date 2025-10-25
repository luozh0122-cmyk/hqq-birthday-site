@echo off
:: =========================
:: 智能一键部署 Vite React 项目到 GitHub Pages
:: =========================

:: 1️⃣ 自动获取当前目录
set "PROJECT_DIR=%cd%"

:: 2️⃣ 检查 package.json 是否存在
if not exist "%PROJECT_DIR%\package.json" (
    echo 错误：找不到 package.json，请确认当前目录是项目根目录
    pause
    exit /b
)

:: 3️⃣ 安装依赖
echo 正在安装依赖...
npm install
if %errorlevel% neq 0 (
    echo npm install 出错
    pause
    exit /b
)

:: 4️⃣ 构建项目
echo 正在构建项目...
npm run build
if %errorlevel% neq 0 (
    echo 构建失败
    pause
    exit /b
)

:: 5️⃣ 安装 gh-pages（如果未安装过）
npm list gh-pages >nul 2>&1
if %errorlevel% neq 0 (
    echo 正在安装 gh-pages...
    npm install --save-dev gh-pages
)

:: 6️⃣ 部署到 gh-pages
echo 正在部署到 GitHub Pages...
npm run deploy
if %errorlevel% neq 0 (
    echo 部署失败
    pause
    exit /b
)

:: 7️⃣ 打开网页
echo 部署完成，正在打开网页...
start https://luozh0122-cmyk.github.io/hqq-birthday-site/

pause
