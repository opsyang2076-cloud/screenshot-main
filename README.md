# DSH 在线翻译 · DeepSeek Hermes Translator

![Manifest V3](https://img.shields.io/badge/Manifest-V3-4d6bfe)
![Version](https://img.shields.io/badge/version-1.1.0-4d6bfe)
![Languages](https://img.shields.io/badge/languages-200-4d6bfe)
![Engines](https://img.shields.io/badge/engines-online%20%2B%20LLM-4d6bfe)
![License](https://img.shields.io/badge/license-MIT-4d6bfe)

一个极简的浏览器翻译扩展：**200 种语言**，两套翻译引擎任选 —— 免费的在线翻译，或你自己的大模型。

界面参考百度翻译的直觉——选语言、粘文字、按翻译，没有多余的东西。

> English documentation: [README_EN.md](README_EN.md)

![主界面](docs/screenshot-main.png)

---

## 两套引擎

| | 在线翻译（默认） | 本地 / 自建模型 |
| --- | --- | --- |
| 配置 | 开箱即用，不需要 API Key | 填 API Key / Base URL / 模型名 |
| 成本 | 免费，不消耗 token | 按 token 计费（或走你自己的显卡） |
| 后端 | MyMemory 公开接口 | 任意 OpenAI Chat Completions 兼容端点 |
| 质量 | 日常短句够用 | 更好，能照顾语气、术语与上下文 |
| 长度 | 自动按 460 字符分段请求 | 单次 5000 字符，一次请求 |
| 额度 | 匿名约 5000 字符/天，填邮箱约 50000/天 | 取决于你的账户 |

设置页顶部点一下即可切换，配置自动保存。

## 为什么用它

- **只做翻译** — 没有账号体系、没有广告、没有统计埋点，也没有自建的云端中转
- **不配也能用** — 默认走免费在线引擎，装完直接翻
- **想省钱就省钱，要质量要质量** — 一键在免费接口和自建模型之间切换
- **200 种语言** — 从英语、日语到宿务语、北萨米语、瓦隆语，一个下拉全都有
- **密钥只在本机** — API Key 存在浏览器 `chrome.storage.local`，只发给你配置的端点
- **无构建步骤** — 纯原生 HTML/CSS/JS，改完代码刷新即可生效

## 功能

| 能力 | 说明 |
| --- | --- |
| 双引擎 | 在线免费 / 自建模型，设置页一键切换 |
| 200 种语言 | 内置完整语言库，前 20 个常用语言置顶 |
| 语言搜索 | 支持中文名、英文名、语言码三种方式筛选 |
| 并发分段 | 在线引擎长文按 460 字符分段后 3 路并发请求，单段失败自动重试一次 |
| 自动检测 | 源语言选「自动检测」，在线引擎会回报检测到的语言 |
| 一键交换 | 源/目标语言互换，译文自动回填输入框，方便反向翻译 |
| 立即翻译 | 按钮或 `Ctrl + Enter`（macOS 为 `⌘ + Enter`） |
| 划词右键 | 网页选中文字 → 右键「用 DSH 翻译选中内容」 |
| 结果操作 | 一键复制、系统语音朗读、导出 `.txt` |
| 字符计数 | 单次上限 5000 字符，实时提示 |
| 错误提示 | 语言不支持、额度用尽、超时、网络错误分别给出中文原因 |

## 安装

### Chrome / Edge（开发者模式）

1. 下载本仓库：页面右上角 **Code → Download ZIP**，解压到任意固定目录
2. 地址栏打开 `chrome://extensions`（Edge 为 `edge://extensions`）
3. 打开右上角「开发者模式」
4. 点击「加载已解压的扩展程序」，选择**包含 `manifest.json` 的那一层目录**
5. 首次安装会自动打开设置页；也可以随时点插件面板右上角的齿轮进入

> 建议把解压后的目录固定下来，移动或删除目录会导致扩展失效。

![设置页 · 在线引擎](docs/screenshot-settings.png)

## 配置

### 在线翻译（默认，建议先用这个）

不用填任何东西。想提高每日额度可以填一个邮箱：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| 联系邮箱 | 空 | 可选。MyMemory 匿名额度约 5000 字符/天，填邮箱提升到约 50000 字符/天 |

### 本地 / 自建模型

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| API Key | 空 | 必填。DeepSeek 开放平台 <https://platform.deepseek.com> → API keys |
| Base URL | `https://api.deepseek.com` | 结尾带不带 `/v1` 都可以，插件会自动补 `/chat/completions` |
| 模型 | `deepseek-chat` | 翻译建议用指令跟随强的对话模型，推理模型明显更慢 |
| 请求超时 | 60 秒 | 5–300 秒 |

![设置页 · 模型引擎](docs/screenshot-settings-model.png)

填好后点「测试连接」，能返回一句译文就说明链路通了。

## 使用

1. 点击浏览器工具栏的蓝色图标打开面板
2. 选好源语言（默认自动检测）和目标语言
3. 输入或粘贴文字，点「立即翻译」或按 `Ctrl + Enter`
4. 译文出现在下方，状态栏会显示引擎、耗时和检测到的语言

**语言搜索**会自动聚焦搜索框，直接敲 `jap`、`日语`、`ja` 都能定位到日语；`↑ ↓` 选择，`Enter` 确认，`Esc` 关闭。

**划词翻译**：在任意网页选中文字 → 右键 → 「用 DSH 翻译选中内容」。Chrome 127+ 会直接弹出面板并自动翻译；旧版本会在工具栏图标上显示红色角标，点一下图标即可看到结果。

## 接入其他模型

模型引擎只要求端点实现 OpenAI 的 `POST /chat/completions` 协议。常见组合：

| 服务 | Base URL | 模型名 |
| --- | --- | --- |
| DeepSeek 官方 | `https://api.deepseek.com` | `deepseek-chat` |
| DeepSeek 官方（v1） | `https://api.deepseek.com/v1` | `deepseek-reasoner` |
| Nous Hermes（第三方托管） | 服务商给出的 OpenAI 兼容地址 | `nousresearch/hermes-3-llama-3.1-70b` |
| 内网 vLLM | `http://192.168.10.250:8084/v1` | 部署时指定的 `--served-model-name` |
| Ollama | `http://localhost:11434/v1` | `qwen2.5:7b` |
| One API / New API 网关 | 网关地址 + `/v1` | 网关里的模型名 |

注意事项：

- **Ollama** 默认只监听本机且校验来源，需要先设置环境变量 `OLLAMA_ORIGINS=chrome-extension://*` 再启动
- **内网地址**请在 `chrome://extensions` 里给扩展授予对应的主机权限（本扩展已声明 `http://*/*` 与 `https://*/*`）
- **不支持**只能流式返回或非标准协议的端点，本扩展使用非流式一次性返回

## 语言支持

内置 200 种语言，覆盖全球主要语种与大量地方语言。前 20 个为常用语言（简繁中文、英、日、韩、西、法、德、俄、葡、意、阿、印地、泰、越、印尼、马来、土、荷、波）。

完整清单见 [`src/languages.js`](src/languages.js)，格式为 `[语言码, 中文名, 英文名]`，按需增删即可——语言列表、搜索、设置页下拉会同步更新。

> 在线引擎的语言覆盖取决于 MyMemory 的语言对表。遇到「在线引擎不支持该语言」时，切到模型引擎即可。

## 隐私

- 不收集任何数据，不加载任何远程脚本或字体
- **在线引擎**：待翻译文本会发送到 `api.mymemory.translated.net`（第三方公共服务），不附带任何身份信息；若填写了邮箱，仅作为额度提升参数一并提交
- **模型引擎**：文本只发送到**你自己配置的 API 地址**
- API Key 保存在浏览器本地存储，仅写入发给该 API 的请求头
- 点「恢复默认」会清空本扩展的全部本地数据

## 项目结构

```
deepseek-hermes-translator/
├── manifest.json          # Manifest V3 清单
├── popup.html             # 翻译面板
├── popup.css
├── popup.js               # 面板交互：语言下拉、翻译、复制/朗读/导出
├── options.html           # 设置页（引擎切换）
├── options.css
├── options.js
├── background.js          # 右键菜单、安装引导
├── src/
│   ├── languages.js       # 200 种语言库
│   ├── online.js          # 在线引擎：长文本分段 + MyMemory 调用
│   └── translator.js      # 引擎路由 + 模型调用 + 报错映射
├── tests/
│   └── split.test.js      # 分段逻辑单元测试
├── icons/                 # 图标与生成脚本（纯标准库 Python）
└── docs/                  # 截图
```

## 开发

无需 npm、无需打包：

1. 修改代码 → 打开 `chrome://extensions` → 点击扩展卡片上的刷新按钮
2. 面板调试：在面板内右键 → 检查；设置页同理
3. 跑分段测试：`node tests/split.test.js`
4. 重新生成图标：`python icons/make_icons.py`（只依赖 Python 标准库）

## 已知限制

- 单次翻译上限 5000 字符；在线引擎按 460 字符分段、3 路并发请求，长文比串行方式快约 3 倍
- 在线引擎受 MyMemory 免费额度限制，超额需等次日或切到模型引擎
- 非流式输出，长文本要等整段返回
- 朗读使用系统 TTS 语音，冷门语种可能没有对应音色
- 未上架 Chrome 应用商店，需要以开发者模式加载

## 更新日志

### v1.1.0

- **并发分段**：在线引擎长文分段请求由串行改为 3 路并发，速度提升约 3 倍；单段失败（网络抖动、HTTP 5xx）自动重试一次，语言/额度等确定性错误不浪费重试
- **状态栏增强**：长文翻译后显示分段数量（如 `2.1s · 在线 · 6 段并发 · 英语 → 简体中文`）
- **朗读开关化**：朗读中再次点击即停止，不必等整段读完
- **复制兜底**：剪贴板 API 不可用时自动降级为隐藏文本框复制
- **兼容性加固**：`chrome.action.openPopup` 与 `storage.session` 全部特性检测 + 异常保护，低版本 Chrome 自动退回角标提醒
- 修复模型返回整句被引号包裹时的去引号逻辑（现要求引号成对，避免误删正文首尾字符）

### v1.0.0

- 首个版本：双引擎（免费在线 / 自建模型）、200 种语言、划词右键翻译、朗读与导出

## 贡献

欢迎 Issue 和 PR，尤其是新的语言条目修正、更多端点的兼容测试。

## License

[MIT](LICENSE)
