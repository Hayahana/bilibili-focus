# 发布指南：GitHub + Microsoft Edge 加载项

两条路互不冲突，建议**先 GitHub、再上架**：仓库能当隐私政策、问题反馈和源码公示的落地页，审核时也更好过。

---

## 一、传到 GitHub

### 0. 前置

- 注册 GitHub 账号（免费）
- 本机已装 Git（`git --version` 能输出版本即可）

### 1. 先在网页上建一个空仓库

打开 <https://github.com/new>：

- Repository name：`bilibili-focus`
- 可见性：**Public**（上架商店时审核员可能要看源码，公开更省事）
- **不要**勾选 "Add a README file"（本地已经有文件了）
- Create repository

### 2. 本地提交并推送

在 `bilibili-focus` 文件夹里打开 PowerShell：

```powershell
# 只需第一次设置，把邮箱和名字换成你自己的
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"

cd D:\Documents\deepseek-harness\default-workspace\bilibili-focus

git init -b main
git add .
git commit -m "feat: B站专注模式 1.0.0"
git remote add origin https://github.com/<你的用户名>/bilibili-focus.git
git push -u origin main
```

> `<你的用户名>` 要替换，尖括号也去掉。
>
> 第一次 `push` 会弹出登录窗口。推荐装 [Git Credential Manager](https://github.com/git-ecosystem/git-credential-manager)（Git for Windows 自带），浏览器点一下授权即可；或者在 GitHub → Settings → Developer settings → Personal access tokens 生成一个 classic token，密码栏粘贴 token。

### 3. 不用命令行的替代方案

GitHub 仓库页面 → **Add file → Upload files** → 把 `manifest.json`、`src`、`icons`、`README.md`、`LICENSE`、`PRIVACY.md` 拖进去 → Commit。缺点是以后改代码还得再拖一次，长期用还是 Git 方便。

### 4. 打一个 Release（给别人下载）

1. 仓库右侧 **Releases → Create a new release**
2. Tag：`v1.0.0`，Target：`main`
3. 标题：`B站专注模式 1.0.0`
4. 把 `dist/bilibili-focus-1.0.0-edge.zip` 拖到附件区
5. Publish release

> `dist/` 已在 `.gitignore` 里，安装包不进 Git 历史，放 Release 附件最合适。

### 5. 顺手把隐私政策变成可访问的 URL

上架时要填 Privacy policy URL，两种都行：

- `https://github.com/<用户名>/bilibili-focus/blob/main/PRIVACY.md`
- 更正式一点：仓库 Settings → Pages → Source 选 `main` / `/ (root)`，然后用 `https://<用户名>.github.io/bilibili-focus/PRIVACY.md`

---

## 二、上架 Microsoft Edge 加载项

官方文档：<https://learn.microsoft.com/microsoft-edge/extensions/publish/publish-extension>
注册开发者：<https://learn.microsoft.com/microsoft-edge/extensions/publish/create-dev-account>

### 关键事实

- **免费**：Edge 开发者账号不收费（Chrome 应用商店要一次性 $5）
- 用**微软账号**登录 Partner Center 即可，不需要公司主体
- 审核一般 **1–7 个工作日**，多数 1–3 天
- 必须 **Manifest V3**（本项目已是）
- 安装包 **zip 内必须直接是 `manifest.json`**，不能多套一层文件夹

### 1. 注册开发者账号

1. 打开 <https://partner.microsoft.com/dashboard>
2. 用微软账号登录 → 找到 **Microsoft Edge 程序** → 注册
3. 填国家/地区、开发者名称（会显示在商店里）

### 2. 准备材料

| 材料 | 要求 | 本项目 |
| --- | --- | --- |
| 扩展包 | zip，`manifest.json` 在根目录 | `dist/bilibili-focus-1.0.0-edge.zip` ✅ |
| 商店 Logo | 300×300 PNG | `dist/store-logo-300.png` ✅ |
| 截图 | 1280×800 或 640×480，至少 1 张，最多 10 张 | 需要你自己截，见下 ⬜ |
| 名称 | ≤ 45 字符 | `B站专注模式（非官方）` |
| 短描述 | ≤ 132 字符 | 见 `store/listing.md` |
| 详细描述 | ≤ 10,000 字符 | 见 `store/listing.md` |
| 隐私政策 URL | 收集数据时必填；不收集也建议填 | GitHub 上的 `PRIVACY.md` |
| 分类 | 生产力 / 工具 | Productivity |
| 搜索词 | 最多 7 个 | 见 `store/listing.md` |

### 3. 截图怎么截（正好 1280×800）

1. 在 Edge 打开任意 B 站视频页，点开专注模式
2. 按 `F12` 打开开发者工具，再按 `Ctrl + Shift + M` 切到设备模拟
3. 顶部把分辨率设为 **1280 × 800**（Responsive 模式手动输入）
4. 按 `Ctrl + Shift + P`，输入 `Capture screenshot` 回车
5. 图片会自动下载，尺寸就是 1280×800

建议截 3 张：① 开启后的干净页面 ② 齿轮设置面板 ③ 点选删除时的高亮框。截图里别出现你的头像、昵称、历史记录。

### 4. 提交

Partner Center → **Microsoft Edge** → **New submission**：

1. **Packages**：上传 `dist/bilibili-focus-1.0.0-edge.zip`，等待自动解析（会读出名称/版本/权限）
2. **Store listing**：按 `store/listing.md` 粘贴名称、短描述、详细描述、上传 Logo 和截图
3. **Availability**：选所有市场（或只选中国）
4. **Properties**：分类 Productivity、隐私政策 URL、是否包含广告（否）、是否收集数据（否）
5. **Review & publish**：在 "Notes for certification" 里粘贴 `store/listing.md` 里的测试说明
6. 点 **Publish**，等邮件

### 5. 后续更新

改完代码 → 把 `manifest.json` 的 `version` 从 `1.0.0` 改成 `1.0.1` → 重新打包 → 在同一个 submission 里上传新包 → 再审核。**版本号不递增会被直接拒收。**

---

## 三、常见拒审原因（避开这些）

1. **包结构不对**：zip 里是 `bilibili-focus/manifest.json` 而不是 `manifest.json` —— 用 `dist/` 里那个扁平包。
2. **权限说不清**：在权限说明里写清楚"只在 bilibili.com 注入一个按钮，用于隐藏页面元素"。
3. **描述里出现"官方""破解""去广告"**：容易被判误导或违规。本项目只是隐藏已渲染元素，不拦截广告请求，描述里要如实写。
4. **截图与真实界面不符**：别 P 图，别用别的产品的截图。
5. **缺少隐私政策**：即使不收集数据，也把 GitHub 上的链接填上。
6. **商标**：名称里用了 B 站/哔哩哔哩，要在描述里明确"非官方，与哔哩哔哩无关联"，且不要使用官方 Logo 作为扩展图标。

---

## 四、检查清单

- [ ] GitHub 仓库已推送，README 能正常显示
- [ ] Release 里附了 zip
- [ ] `manifest.json` 的 `version` 与商店里填的一致
- [ ] `dist/bilibili-focus-1.0.0-edge.zip` 解压后第一层就是 `manifest.json`
- [ ] 300×300 Logo 已上传
- [ ] 至少 1 张 1280×800 截图
- [ ] 隐私政策 URL 可访问
- [ ] Notes for certification 写清测试步骤
