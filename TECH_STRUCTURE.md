# Smart Repair Frontend 技术结构（当前实现）

本文档描述 `smart-repair-frontend` 当前实现下的技术结构、页面分层、鉴权与数据流设计，用于协作开发和功能扩展。

## 1. 技术栈总览

- **框架**: Next.js 16（App Router）
- **UI**: React 19 + TypeScript
- **样式系统**: Tailwind CSS v4
- **组件体系**: shadcn/ui + 自定义业务组件
- **图表**: Recharts
- **状态模式**: Hooks + 领域服务层（`lib/services`）

## 2. 依赖与脚本

`package.json` 核心脚本：

- `npm run dev`: 本地开发
- `npm run build`: 生产构建（含 TypeScript 检查）
- `npm run start`: 生产模式启动
- `npm run lint`: ESLint 检查

核心依赖：

- `next`、`react`、`react-dom`
- `tailwindcss`、`tw-animate-css`
- `shadcn`、`class-variance-authority`、`radix-ui`
- `recharts`

## 3. 目录结构与职责

- `app/`
  - App Router 页面与布局
  - 主要页面：`/`、`/login`、`/dashboard`、`/users`、`/settings`、`/audit`、`/worker`
- `components/`
  - `ui/`: shadcn 基础组件
  - `home/`: 看板页面组件
  - `dashboard/`: 数据大盘组件
  - `worker/`: 维修工作台组件
  - `Navigation.tsx`、`RoleGuard.tsx`、`AdminGuard.tsx`
- `app/hooks/`
  - 复杂页面状态编排（如 `useSmartRepairBoard`）
- `lib/`
  - `api.ts`: fetch 基础封装
  - `auth.ts`: 鉴权快照（含组织归属）与跳转控制
  - `services/`: 业务 API 封装（tickets/users/audit/settings）

## 4. 路由与信息架构

- `app/page.tsx`: 工单看板主界面
- `app/login/page.tsx`: 登录入口
- `app/dashboard/page.tsx`: 统计大盘
- `app/users/page.tsx`: 用户管理（组织树 + 表格）
- `app/settings/page.tsx`: 系统设置
- `app/audit/page.tsx`: 审计查询
- `app/worker/page.tsx`: 维修工作台

## 5. UI 体系与设计结构

- 基础组件：`components/ui/*`
- 看板组件：`TicketActionPanel`、`TicketBoardColumns`、`TicketDetailModal`
- 权限组件：`RoleGuard`、`AdminGuard`
- 图标：`components/icons.tsx`（内联 SVG，不依赖第三方图标运行时）

## 6. 数据访问层结构

### 6.1 基础请求层（`lib/api.ts`）

- `API_BASE_URL`：来自 `NEXT_PUBLIC_API_BASE_URL`，默认 `http://localhost:8080`
- `apiFetch`：统一 `credentials: include`
- `apiJson<T>`：统一错误处理并抛出 `ApiError`

### 6.2 业务服务层（`lib/services/*`）

- `tickets`: 工单 CRUD、状态更新、清空完成
- `users`: 用户列表、创建、编辑、删除、重置密码、CSV 导入、组织树
- `audit`: 审计日志查询
- `settings`: 优先级模式读取与更新

## 7. 鉴权与权限模型

### 7.1 前端鉴权快照

`lib/auth.ts` 持久化并广播：

- `sr_role`
- `sr_name`
- `sr_college_id`
- `sr_department_id`

通过 `AUTH_EVENT` 通知 UI 更新。

### 7.2 服务端回源校正

- `refreshAuthFromServer` 调用 `/api/me`
- 用于修正本地角色与组织归属快照

### 7.3 页面守卫

- `RoleGuard`：角色集合守卫
- `AdminGuard`：用户管理页面守卫（`super-admin` / `college-admin` / `department-admin`）

## 8. 用户管理页（`/users`）结构

用户管理采用“组织树 + 数据表”双视图：

- 组织树（院部 > 系部）
  - 关键字筛选（调用 `GET /api/org/tree?q=`）
  - 展开/收起状态本地持久化
  - 节点点击联动右侧表格筛选（院/系/角色）
  - 按权限新增院部/系部（调用 `POST /api/org/colleges`、`POST /api/org/departments`）
- 用户表格
  - 分页、搜索、角色筛选
  - 新增/编辑时支持 `collegeId`、`departmentId`
  - 批量改角色、批量删除
- CSV 导入
  - 支持 `collegeCode` / `departmentCode`
  - 预检（dry-run）+ 正式导入（commit）

## 9. 看板页（`/`）状态编排

看板采用“主 Hook + 组件拆分”模式：

- `useSmartRepairBoard`
- `TicketActionPanel`
- `TicketBoardColumns`
- `TicketDetailModal`

并支持拖拽状态流转、多选批量操作、自动刷新、错误重试。

## 10. 样式与主题

- 全局样式：`app/globals.css`
- 主题变量：`@theme inline` + CSS 变量
- 页面风格：深色极简（`zinc` 色阶）
- 路由过渡：`app/template.tsx` + `page-transition`

## 11. 前后端联调约束

- 前端端口：`3000`
- 后端端口：`8080`
- 请求基址：`NEXT_PUBLIC_API_BASE_URL`
- 认证：Cookie Session（必须 `credentials: include`）

## 12. 当前特征与后续建议

当前特征：

- 页面与业务组件分层明确
- 用户管理已支持校园层级组织视图
- 服务层复用较好，权限控制路径清晰

建议演进：

1. 用户管理页拆分成更细粒度组件（组织树/表格/工具栏）
2. 增加组织树虚拟滚动（大规模院系/学生）
3. 为关键页面补充组件级测试
4. 为服务层补充更细错误码映射

## 13. 快速启动

```bash
npm install
npm run dev
```

如需指定后端地址：

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```
