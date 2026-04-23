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
```

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
  - 公开主页通过 `slug` 访问

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

