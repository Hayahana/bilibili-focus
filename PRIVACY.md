# 隐私政策 / Privacy Policy

**扩展名称：** B站专注模式 · Bilibili Focus
**最后更新：** 2026-11-08

## 中文

本扩展**不收集、不存储、不上传任何个人信息**。

具体来说：

1. **不联网**：扩展没有任何网络请求，不会把页面内容、浏览记录或任何数据发送到任何服务器（包括开发者自己的服务器）。
2. **不读取账号信息**：不读取、不修改 B 站账号、Cookie、登录状态或观看记录。
3. **本地存储**：使用浏览器扩展存储（`chrome.storage.local`）保存以下设置——专注模式开关、各模块显示/隐藏、悬浮按钮的位置与不透明度、以及你自己点选删除的元素选择器；同时在页面 `localStorage` 中镜像一份，用于页面加载时尽快生效。这些数据只存在于你的浏览器本地，清理扩展数据或站点数据即会删除。
4. **无统计、无广告、无追踪**：不包含任何分析 SDK、埋点、广告或第三方脚本。
5. **无远程代码**：所有代码都打包在扩展安装包内，不从网络加载或执行任何远程脚本。
6. **权限用途**：扩展申请 `storage` 权限，仅用于保存上述本地设置；内容脚本只在 `*.bilibili.com` 页面运行，用于显示悬浮按钮并隐藏页面元素。除此之外不访问任何网站。

如有疑问，请在本项目 GitHub 仓库提交 Issue。

## English

This extension **does not collect, store, or transmit any personal data**.

- **No network requests.** Nothing is ever sent to any server.
- **No account access.** It does not read or modify your Bilibili account, cookies, login state, or watch history.
- **Local storage only.** Your settings — on/off state, per-module toggles, floating button position and opacity, and the CSS selectors you pick — are stored with `chrome.storage.local`, mirrored into the page's `localStorage` for fast startup, and removed when you clear extension or site data.
- **No analytics, ads, or tracking.** No third-party scripts or SDKs.
- **No remote code.** All code ships inside the package.
- **Permissions.** The `storage` permission is used only to persist the settings above. The content script runs only on `*.bilibili.com` to render the floating button and hide page elements. No other sites are accessed.

For questions, please open an issue on the GitHub repository.
