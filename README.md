# B站专注模式 · Bilibili Focus

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-00aeec)](manifest.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Edge 扩展](https://img.shields.io/badge/Edge-可加载-0078D7)](#安装)
[![Chrome 扩展](https://img.shields.io/badge/Chrome-可加载-yellow)](#安装)

> 看网课的时候，推荐、广告、评论、导航栏总在抢注意力。
> 这个扩展在 B 站视频页右下角放一个按钮，**点一下，页面只剩标题、播放器和视频选集**。

- 🎯 **一键专注**：点按钮或按 `Alt + Z`，隐藏推荐、广告、评论、顶部导航
- 🖱️ **点哪删哪**：进入点选模式，鼠标指到哪高亮哪，单击即隐藏
- ⚙️ **按需定制**：10 类模块逐项开关，支持「宽屏播放器」
- 💾 **记得住**：设置保存在本地，刷新、切分 P 都不会“复活”
- 🔒 **纯本地**：不联网、不收集数据、不读取账号

<p align="center">
  <img src="icons/icon512.png" width="96" alt="icon">
</p>

---

## 目录

- [安装](#安装)
- [使用](#使用)
- [默认隐藏 / 保留](#默认隐藏--保留)
- [自定义隐藏规则](#自定义隐藏规则)
- [工作原理](#工作原理)
- [文件结构](#文件结构)
- [发布与上架](#发布与上架)
- [隐私](#隐私)
- [边界与说明](#边界与说明)
- [License](#license)

---

## 安装

### 方式一：下载安装包（推荐）

1. 打开仓库右侧 **Releases**，下载最新版 `bilibili-focus-x.y.z-edge.zip`
2. 解压到**固定目录**，例如 `D:\Extensions\bilibili-focus`（不要放临时目录，扩展运行时会一直读这个文件夹）
3. 打开 `edge://extensions/` → 打开左下角 **开发人员模式** → 点 **加载解压缩的扩展**
4. 选择解压出来的文件夹，**里面能直接看到 `manifest.json` 的那一层**
5. 打开任意 B 站视频页，右下角出现「专注模式」按钮即安装成功

### 方式二：从源码安装

```bash
git clone https://github.com/Hayahana/bilibili-focus.git
```

然后按上面第 3–4 步，加载克隆下来的 `bilibili-focus` 文件夹。

Chrome 完全一样：`chrome://extensions/` → 开发者模式 → 加载已解压的扩展程序。

---

## 使用

| 操作 | 效果 |
| --- | --- |
| 点右下角「专注模式」按钮 | 一键开关，开启后按钮变蓝显示「专注中」 |
| 按 `Alt + Z` | 不用找按钮，随时开关 |
| 点扩展工具栏图标 | 同样可以开关当前标签页 |
| 点齿轮 ⚙ | 打开设置，逐项选择要隐藏的模块 |
| 点「点选删除页面元素」 | 进入点选模式，`Esc` 退出 |

### 点选删除的操作流程

1. 点「点选删除页面元素」，面板会自动收起
2. 鼠标移到想去掉的地方，会出现蓝色高亮框和选择器提示
3. 单击一下，元素立刻消失，并记入设置面板的列表
4. 想恢复某一项：齿轮面板列表里点 `×`
5. 按 `Esc` 退出点选模式

---

## 默认隐藏 / 保留

| 默认隐藏 | 默认保留 |
| --- | --- |
| 顶部导航、搜索栏 | 视频标题、UP 主名 |
| 右侧 UP 主卡片、相关推荐、推荐流 | **视频选集（分 P 列表）** |
| 所有广告位（左侧横幅、右下角、贴片） | 播放器、进度条、清晰度 |
| 评论区 | 视频简介（常有课件 / 资料链接） |
| 视频标签、右侧悬浮按钮 | 弹幕开关、倍速 |

> **为什么默认保留「视频选集」**：课程视频的分 P 列表也在右侧栏里，整块收掉就没法接着看下一讲了。「宽屏播放器」是**可选**开关，勾上才让右栏让位，播放器按 16:9 铺满窗口。

---

## 自定义隐藏规则

所有隐藏规则在 [`src/focus.css`](src/focus.css)，约定是「总开关 + 分项」：

```css
/* html.bfm-on 总开关，bfm-h-xxx 分项开关 */
html.bfm-on.bfm-h-pod .video-pod { display: none !important; }
```

- `bfm-h-header` 顶部导航 · `bfm-h-right` 右侧推荐 · `bfm-h-ads` 广告
- `bfm-h-comments` 评论 · `bfm-h-tags` 标签 · `bfm-h-desc` 简介
- `bfm-h-danmaku` 弹幕框 · `bfm-h-pod` 选集 · `bfm-h-toolbar` 点赞栏 · `bfm-h-sidenav` 悬浮按钮

照抄一行加进对应分项即可。改完在 `edge://extensions/` 点扩展卡片上的「重新加载」，再刷新页面生效。

如果 B 站改版导致某个选择器失效，**不用改代码**——直接用「点选删除」点掉它，规则只存在你自己的浏览器里。

---

## 工作原理

1. **注入 class，而不是删 DOM**
   [`content.js`](src/content.js) 给 `<html>` 加上 `bfm-on` 和 `bfm-h-*`，[`focus.css`](src/focus.css) 用 `display: none !important` 批量隐藏。B 站是 Vue 单页应用，切分 P、加载评论都会重新挂载节点，直接 `remove()` 的元素会“长回来”，而 CSS 隐藏稳定且可逆。

2. **首屏前生效，不闪烁**
   [`early.js`](src/early.js) 在 `document_start` 同步读取 `localStorage` 并打 class，页面还没画出来就已经是专注状态。

3. **宽屏布局覆盖**
   B 站用 `<style id="setSizeStyle">` 写死播放器宽高，扩展用 `!important` 覆盖，并在切换后补发 `resize` 让播放器重新计算尺寸。

4. **点选模式生成稳定选择器**
   优先使用唯一 `id`，其次 `tag + 稳定 class`，过滤 `data-v-*` 构建哈希，并校验唯一性后才应用，避免误伤整站。

---

## 文件结构

```
bilibili-focus/
├─ manifest.json        # MV3 清单
├─ icons/               # 16 / 48 / 128 / 512 图标
├─ src/
│  ├─ early.js          # document_start：首屏前打 class，避免闪烁
│  ├─ content.js        # 悬浮按钮、设置面板、点选删除
│  ├─ focus.css         # 全部隐藏规则
│  └─ background.js     # 点工具栏图标 → 通知当前页切换
├─ dist/                # 打包产物（上架用 zip、商店 Logo）
├─ store/listing.md     # Edge 商店表单文案
├─ tools/make_icons.py  # 图标生成脚本
├─ PUBLISH.md           # 发布 / 上架指南
├─ PRIVACY.md           # 隐私政策
└─ README.md
```

---

## 发布与上架

- **GitHub**：仓库即发布页，打 Release 时附上 `dist/bilibili-focus-1.0.0-edge.zip`
- **Microsoft Edge 加载项**：步骤见 [PUBLISH.md](PUBLISH.md)，表单文案见 [store/listing.md](store/listing.md)
- 上架用包要求 `manifest.json` 在压缩包**根目录**，`dist/bilibili-focus-1.0.0-edge.zip` 已符合
- 更新时记得把 `manifest.json` 的 `version` 递增，否则会被商店拒收

---

## 隐私

- **不联网**：没有任何网络请求，数据不出本机
- **不读账号**：不读取、不修改 B 站账号、Cookie、登录状态、观看记录
- **本地存储**：仅用 `localStorage` 保存开关状态和自定义选择器，清理站点数据即删除
- **无统计、无广告、无远程代码**
- **权限最小化**：manifest 中没有声明任何 `chrome.*` 权限，只有一个限定 `*.bilibili.com` 的内容脚本

完整说明见 [PRIVACY.md](PRIVACY.md)。

---

## 边界与说明

- **播放器内部选不到**：B 站播放器是独立组件（Shadow DOM），点选模式只能选到播放器外壳；播放器内部的结束页推荐由它自己控制。
- **不绕过任何限制**：不下载视频、不解锁清晰度、不拦截广告请求，只是把已渲染的区块隐藏。
- **状态存在 `localStorage`**：清理浏览器站点数据会重置为默认（关闭）。
- **站点改版**：可能导致个别选择器失效，届时用「点选删除」补一刀即可，也欢迎提 Issue。
- **非官方项目**：与哔哩哔哩无任何关联，名称中的「B站」仅为描述性使用。

---

## License

[MIT](LICENSE) © 2026 Hayahana

本项目在 [DeepSeek Harness](https://github.com/deepseek-ai) 的辅助下开发完成。
