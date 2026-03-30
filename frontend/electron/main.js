/**
 * ============================================================
 * Electron 主进程入口
 *
 * 【功能说明】
 * - 管理应用窗口生命周期
 * - 加载 Python 后端进程
 * - 处理 IPC 通信（前端 <-> Python）
 *
 * 【IPC 通信流程】
 * 1. 前端 (Renderer) 调用 window.workflowsDesktop.invoke()
 * 2. preload 脚本接收请求
 * 3. 本文件处理 IPC 消息，转发给 Python 子进程
 * 4. Python 处理完成后返回结果
 * 5. 结果返回给前端
 *
 * 【窗口管理】
 * - 创建 BrowserWindow
 * - 处理窗口关闭/最小化/最大化
 * - 开发环境加载 localhost:3000，生产环境加载打包后的页面
 *
 * ============================================================
 */

const { app, BrowserWindow, ipcMain, Menu, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

// 开发环境标志
const isDev = !app.isPackaged;

// 全局窗口引用
let mainWindow = null;

// Python 后端进程
let pythonProcess = null;
let pythonStdoutBuffer = "";

/**
 * ============================================================
 * 启动 Python IPC 服务器
 * ============================================================
 * 启动 Python 进程运行 backend/ipc_server.py
 * 通过 stdin/stdout 进行 JSON-RPC 通信
 */
function startPythonBackend() {
  // __dirname 是 frontend/electron，所以需要两级返回到项目根目录
  const projectRoot = path.join(__dirname, "..", "..");
  const backendPath = path.join(projectRoot, "backend");

  console.log("[Electron] 项目根目录:", projectRoot);
  console.log("[Electron] 后端目录:", backendPath);
  console.log("[Electron] 启动 Python IPC 服务器...");

  // 使用 uv 虚拟环境中的 Python
  const pythonPath = path.join(backendPath, ".venv", "bin", "python");
  console.log("[Electron] Python 路径:", pythonPath);
  
  pythonProcess = spawn(pythonPath, ["ipc_server.py"], {
    cwd: backendPath,
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });

  // 输出 Python 后台日志
  pythonStdoutBuffer = "";
  pythonProcess.stdout.on("data", (data) => {
    pythonStdoutBuffer += data.toString();
    const lines = pythonStdoutBuffer.split("\n");
    pythonStdoutBuffer = lines.pop() || "";

    lines
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        try {
          const parsed = JSON.parse(line);
          if (parsed.id !== undefined) {
            handlePythonResponse(parsed);
          } else {
            console.log(`[Python] ${line}`);
          }
        } catch {
          console.log(`[Python] ${line}`);
        }
      });
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`[Python Error] ${data}`);
  });

  pythonProcess.on("close", (code) => {
    console.log(`[Electron] Python 进程退出，code: ${code}`);
    pythonStdoutBuffer = "";

    for (const [id, pending] of pendingRequests.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error(`Python 进程已退出，未完成请求: ${id}`));
      pendingRequests.delete(id);
    }
  });

  pythonProcess.on("error", (err) => {
    console.error(`[Electron] Python 进程启动失败: ${err}`);
  });

  return pythonProcess;
}

/**
 * ============================================================
 * 待处理的请求队列
 * ============================================================
 */
const pendingRequests = new Map();
let requestIdCounter = 1;

/**
 * 发送请求到 Python 并等待响应
 */
function sendToPython(channel, payload) {
  return new Promise((resolve, reject) => {
    const id = requestIdCounter++;
    const request = {
      id,
      method: channel,
      params: payload || {},
    };

    // 设置超时
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error(`IPC 请求超时: ${channel}`));
    }, 30000);

    // 保存 Promise 解析函数
    pendingRequests.set(id, { resolve, reject, timeout });

    // 发送请求到 Python
    const requestStr = JSON.stringify(request) + "\n";
    pythonProcess.stdin.write(requestStr);
  });
}

function summarizeForLog(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return value.length > 200 ? `${value.slice(0, 200)}... [${value.length} chars]` : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => summarizeForLog(item));
  }

  if (typeof value === "object") {
    const summary = {};
    for (const [key, item] of Object.entries(value)) {
      if (key === "base64" && typeof item === "string") {
        summary[key] = `[base64 omitted, ${item.length} chars]`;
        continue;
      }
      summary[key] = summarizeForLog(item);
    }
    return summary;
  }

  return value;
}

/**
 * 处理 Python 返回的响应
 */
function handlePythonResponse(response) {
  const id = response.id;
  const pending = pendingRequests.get(id);

  if (pending) {
    clearTimeout(pending.timeout);
    pendingRequests.delete(id);

    if (response.error) {
      pending.reject(new Error(response.error.message));
    } else {
      pending.resolve(response.result);
    }
  }
}

/**
 * ============================================================
 * 创建主窗口
 * ============================================================
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 15, y: 15 },
  });

  // 创建应用菜单
  const menuTemplate = [
    {
      label: "文件",
      submenu: [
        { label: "新建项目", accelerator: "CmdOrCtrl+N", click: () => mainWindow.webContents.send("menu:new-project") },
        { type: "separator" },
        { label: "退出", accelerator: "CmdOrCtrl+Q", role: "quit" },
      ],
    },
    {
      label: "编辑",
      submenu: [
        { label: "撤销", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "重做", accelerator: "CmdOrCtrl+Shift+Z", role: "redo" },
        { type: "separator" },
        { label: "剪切", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "复制", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "粘贴", accelerator: "CmdOrCtrl+V", role: "paste" },
      ],
    },
    {
      label: "视图",
      submenu: [
        { label: "重新加载", accelerator: "CmdOrCtrl+R", role: "reload" },
        { label: "开发者工具", accelerator: "F12", role: "toggleDevTools" },
        { type: "separator" },
        { label: "全屏", accelerator: "CmdOrCtrl+Shift+F", role: "togglefullscreen" },
      ],
    },
    {
      label: "窗口",
      submenu: [
        { label: "最小化", accelerator: "CmdOrCtrl+M", role: "minimize" },
        { label: "关闭", accelerator: "CmdOrCtrl+W", role: "close" },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // 加载应用页面
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", ".next", "index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    console.log("[Electron] 主窗口已显示");
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/**
 * ============================================================
 * IPC 消息处理
 * ============================================================
 */
function setupIPC() {
  // 处理前端调用
  ipcMain.handle("invoke", async (event, channel, payload) => {
    console.log(`[IPC] 收到请求: ${channel}`, summarizeForLog(payload));

    // 如果 Python 进程未启动，启动它
    if (!pythonProcess || pythonProcess.exitCode !== null) {
      startPythonBackend();
      // 等待 Python 启动
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    try {
      const result = await sendToPython(channel, payload);
      console.log(`[IPC] ${channel} 返回:`, summarizeForLog(result));
      return result;
    } catch (error) {
      console.error(`[IPC] ${channel} 错误:`, error.message);
      return { status: "error", message: error.message };
    }
  });

  // 窗口控制
  ipcMain.on("window:minimize", () => {
    mainWindow?.minimize();
  });

  ipcMain.on("window:maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on("window:close", () => {
    mainWindow?.close();
  });

  // 获取窗口状态
  ipcMain.handle("window:isMaximized", () => {
    return mainWindow?.isMaximized() || false;
  });

  // 获取应用版本
  ipcMain.handle("app:version", () => {
    return app.getVersion();
  });

  // 选择文件夹目录
  ipcMain.handle("dialog:selectDirectory", async (event, title) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: title || "选择目录",
      properties: ["openDirectory", "createDirectory"],
    });
    return result;
  });

  // 选择文件
  ipcMain.handle("dialog:selectFile", async (event, title, filters) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: title || "选择文件",
      properties: ["openFile"],
      filters: filters || [
        { name: "Images", extensions: ["jpg", "jpeg", "png", "gif", "webp", "bmp"] },
        { name: "Videos", extensions: ["mp4", "webm", "mov", "avi", "mkv"] },
        { name: "Audio", extensions: ["mp3", "wav", "ogg", "flac", "aac"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });
    return result;
  });

  console.log("[Electron] IPC 处理器已注册");
}

// ============================================================
// 应用生命周期
// ============================================================

app.whenReady().then(() => {
  console.log("[Electron] 应用启动");

  // 启动 Python 后端
  startPythonBackend();

  // 设置 IPC 处理
  setupIPC();

  // 创建窗口
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (pythonProcess) {
      pythonProcess.kill();
    }
    app.quit();
  }
});

app.on("before-quit", () => {
  console.log("[Electron] 应用退出，清理资源...");
  if (pythonProcess) {
    pythonProcess.kill();
  }
});
