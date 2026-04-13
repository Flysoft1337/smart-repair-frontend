# Smart Repair Frontend

校园智能报修中枢前端，基于 **Next.js(App Router) + React + Tailwind CSS + shadcn/ui**。

## 技术栈

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui（Button/Card/Badge/Input/Textarea 等）
- Recharts（数据可视化）

## 目录说明

- `app/`: 路由页面与全局布局
- `components/`: 业务组件与 UI 组件
- `lib/api.ts`: API 基础封装（含 `credentials: include`）
- `lib/auth.ts`: 前端鉴权状态管理

## 安装依赖

```bash
npm install
```

## 环境变量

在项目根目录创建 `.env.local`：

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

未配置时默认也会请求 `http://localhost:8080`（见 `lib/api.ts`）。

## 开发运行

```bash
npm run dev
```

默认地址：`http://localhost:3000`

## 构建与生产启动

```bash
npm run build
npm run start
```

## 与后端联调要求

- 后端服务需先启动在 `http://localhost:8080`
- 后端需开启 CORS 且允许 `http://localhost:3000`
- 前端请求已默认带 Cookie：`credentials: include`

## 页面能力（当前）

- 登录/退出与基于角色的访问控制
- 工单看板（查询、创建、状态流转、删除、批量处理）
- 用户管理（新增、编辑、删除、导入）
- 审计日志、设置、维修工作台、数据大盘

## 常见问题

- 页面 `Failed to fetch`：先确认后端是否启动、端口是否为 `8080`。
- 登录后仍未鉴权：检查浏览器是否拦截 Cookie，确认前后端地址为本地同源组合（`localhost:3000` + `localhost:8080`）。
- 样式类名无效警告：优先使用 Tailwind 合法类或方括号写法（例如 `h-[18.75rem]`）。
