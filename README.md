# Smart Repair Frontend

校园智能报修中枢前端，基于 **Next.js(App Router) + React + Tailwind CSS + shadcn/ui**。

## 技术结构文档

建议先阅读：[`TECH_STRUCTURE.md`](./TECH_STRUCTURE.md)

目录整理约定：[`docs/frontend-structure.md`](./docs/frontend-structure.md)

## 技术栈

- Next.js 16（App Router）
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui（Button/Card/Badge/Input/Textarea 等）
- Recharts（数据可视化）

## 目录说明

- `app/`：路由页面与全局布局
- `components/`：业务组件与 UI 组件
- `lib/api.ts`：API 基础封装（含 `credentials: include`）
- `lib/auth.ts`：前端鉴权状态管理（含 `collegeId`/`departmentId` 快照）
- `lib/services/users.ts`：用户管理与组织树 API 封装

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
  - 组织树（院部 > 系部）文件夹式浏览
  - 组织树关键字筛选
  - 组织树展开状态本地持久化
  - 院/系/角色联动筛选
- 审计日志、设置、维修工作台、数据大盘

## 常见问题

- 页面 `Failed to fetch`：先确认后端是否启动、端口是否为 `8080`。
- 登录后仍未鉴权：检查浏览器是否拦截 Cookie，确认地址为 `localhost:3000 + localhost:8080`。
- 样式类名无效警告：优先使用 Tailwind 合法类或方括号写法（例如 `h-[18.75rem]`）。
