# AI 网页简历平台

一个基于 `Next.js 16 + Supabase` 的网页简历产品，支持：

- 邮箱 + 密码注册 / 登录
- 管理基本信息、项目作品、实习经历、技能、获奖
- 公开主页展示：左侧简历，右侧作品集
- 多种主题切换
- 导出 PDF
- 基于关键词的岗位推荐

首页视觉和展示节奏借鉴了 `upcv.tech` 的优点，但页面结构更偏向“简历 + 作品集一体化主页”。

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 复制环境变量

```bash
cp .env.example .env.local
```

3. 在 `.env.local` 中填写：

```env
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Supabase anon key
NEXT_PUBLIC_OH_MY_CV_INTERNAL_ROUTE=
```

`NEXT_PUBLIC_OH_MY_CV_INTERNAL_ROUTE` 可选：

- 如果你把 `oh-my-cv` 通过同域路由集成到了主项目里，可以填类似 `/markdown-editor`
- 如果不填，主项目里的“打开 Markdown 编辑器”按钮会默认跳到 `http://localhost:5173/?source=ai-product`

4. 打开 Supabase SQL Editor，执行 [supabase/schema.sql](./supabase/schema.sql)

5. 启动项目

```bash
npm run dev
```

默认打开：

- 首页：`/`
- 登录页：`/auth`
- 工作台：`/dashboard`
- 示例公开页：`/p/demo-resume`

## 说明

- 如果没有配置 Supabase，项目仍然可以以演示模式运行：
  - 登录页会提示你先配置环境变量
  - 工作台会把内容暂存在浏览器 `localStorage`
  - 示例公开页仍然可访问
- 一旦接入 Supabase：
  - Auth 使用邮箱密码登录
  - 简历内容保存到 `public.resume_profiles`
  - 结构化简历数据与 Markdown 同步保存到 `public.resumes`
  - 公开主页通过 `slug` 访问

## 与 oh-my-cv 集成

主项目现在已经支持把结构化简历转换成 Markdown，并在以下时机同步：

- 点击工作台里的“保存”
- 点击“打开 Markdown 编辑器”

同步内容会：

- 写入浏览器 `localStorage` 的 `latest_resume_markdown`
- 在 Supabase 已连接时，同时写入 `resumes.data` 和 `resumes.markdown`

### 启动主项目

```bash
cd "/Users/shiziming/Downloads/实习相关材料/ai产品"
npm install
npm run dev
```

### 启动 oh-my-cv

我已经检查过 `oh-my-cv/package.json`，它声明的 `packageManager` 是 `pnpm@9.4.0`。如果你本机没有 `pnpm`，先安装：

```bash
npm install -g pnpm
```

然后启动：

```bash
cd "/Users/shiziming/Downloads/实习相关材料/ai产品/oh-my-cv"
pnpm install
pnpm dev
```

如果你不想全局装 `pnpm`，当前仓库里已经有本地依赖时，也可以尝试：

```bash
cd "/Users/shiziming/Downloads/实习相关材料/ai产品/oh-my-cv"
./node_modules/.bin/pnpm dev
```

### 测试同步流程

1. 启动主项目工作台
2. 修改个人信息 / 实习经历 / 项目经历
3. 点击“保存”
4. 点击“打开 Markdown 编辑器”
5. 在 `oh-my-cv` 中确认已载入最新 Markdown
6. 在 `oh-my-cv` 中点击导出 PDF，导出前会再次读取 `latest_resume_markdown`

### 重要说明

- 如果主项目和 `oh-my-cv` 分别运行在 `localhost:3000/3001` 与 `localhost:5173`，它们属于不同 origin，浏览器 `localStorage` 不能直接跨端口共享
- 因此本项目同时实现了 `content` URL 参数注入，作为跨端口场景下的同步兜底
- 如果你后续把 `oh-my-cv` 以内嵌路由方式部署到同一域名下，`localStorage` 和 `storage` 监听会工作得更完整

## 数据结构

当前为了快速落地 MVP，简历主体使用单表 + JSONB 存储：

- `basics`
- `experiences`
- `projects`
- `skills`
- `awards`

这种结构适合产品早期快速迭代；后续如果你要做更复杂的排序、筛选、协作编辑，再拆成多表会更稳。

## 后续可继续增强

- 接入真正的大模型推荐岗位 / 润色简历
- 增加模板市场和主题管理后台
- 支持多份简历版本
- 支持上传封面图、头像和项目截图
- 增加 analytics，统计主页访问和链接点击

## License Risk

`oh-my-cv` 是 GPL-3.0 项目。当前仓库保留了它的 `LICENSE` 和原始项目目录；如果你后续要做闭源商业化、SaaS 分发或深度代码合并，请先让律师或合规同学确认 GPL-3.0 的传染性风险。
