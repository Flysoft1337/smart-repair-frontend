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
  - `ui/`: shadcn 风格基础组件
  - `home/`: 看板页面领域组件
  - `dashboard/`: 数据大盘组件
  - `worker/`: 维修工作台组件
  - `Navigation.tsx`、`RoleGuard.tsx`、`AdminGuard.tsx`
- `app/hooks/`
  - 复杂页面状态编排（如 `useSmartRepairBoard`）
- `lib/`
  - `api.ts`: fetch 基础封装
  - `auth.ts`: 鉴权快照与登录跳转控制
  - `services/`: 面向业务域的 API 调用层（tickets/users/audit/settings）

## 4. 路由与信息架构（App Router）

### 4.1 全局布局

- `app/layout.tsx`
  - 注入全局字体、全局样式
  - 注入导航 `Navigation`
  - 负责页面主内容区域布局（侧边栏 + 主内容）

### 4.2 功能页面

- `app/page.tsx`: 工单看板主界面
- `app/login/page.tsx`: 登录入口
- `app/dashboard/page.tsx`: 统计大盘
- `app/users/page.tsx`: 用户管理
- `app/settings/page.tsx`: 系统设置
- `app/audit/page.tsx`: 审计查询
- `app/worker/page.tsx`: 维修工作台

## 5. UI 体系与设计结构

### 5.1 基础组件层

- `components/ui/*`
  - `Button`、`Card`、`Badge`、`Input`、`Textarea`
  - 采用 `class-variance-authority` 管理变体

### 5.2 业务组件层

- 看板：`TicketActionPanel`、`TicketBoardColumns`、`TicketDetailModal`
- 导航：`Navigation`
- 权限：`RoleGuard`、`AdminGuard`
- 图表：`StatusDistributionChart`、`KpiCards` 等

### 5.3 图标层

- `components/icons.tsx`
  - 使用内联 SVG 图标
  - 不依赖外部图标运行时

## 6. 数据访问层结构

### 6.1 基础请求层（`lib/api.ts`）

- `API_BASE_URL`
  - 来自 `NEXT_PUBLIC_API_BASE_URL`
  - 默认回退 `http://localhost:8080`
- `apiFetch`
  - 统一设置 `credentials: include`
  - 统一默认 `Content-Type: application/json`
- `apiJson<T>`
  - 统一响应状态检查
  - 非 2xx 抛出 `ApiError`

### 6.2 业务服务层（`lib/services/*`）

按业务域拆分：

- `tickets`: 工单 CRUD、状态更新、清空完成
- `users`: 用户列表、创建、编辑、删除、重置密码、CSV 导入
- `audit`: 审计日志查询
- `settings`: 优先级模式读取与更新

这层将页面逻辑与 HTTP 细节解耦。

## 7. 鉴权与权限模型

### 7.1 前端鉴权快照

`lib/auth.ts` 通过本地存储维护基础信息：

- `sr_role`
- `sr_name`

并通过 `AUTH_EVENT` 广播状态变化。

### 7.2 服务端校验回源

- `refreshAuthFromServer` 调用 `/api/me`
- 用于纠正本地快照，避免“仅靠本地缓存”带来的权限漂移

### 7.3 跳转控制

- `redirectToLogin(force?)`
  - 避免重复跳转
  - 可强制跳转

### 7.4 页面守卫

- `RoleGuard` 根据目标角色集合控制页面可见性
- `AdminGuard` 是 `RoleGuard` 的超管特化封装

## 8. 看板页（`/`）状态编排结构

看板采用“主 Hook + 组件拆分”模式：

- `useSmartRepairBoard`
  - 管理请求、筛选、排序、拖拽、批量操作、自动刷新、错误态
- `TicketActionPanel`
  - 提交工单与批量动作
- `TicketBoardColumns`
  - 三列看板渲染、滚动分页、拖拽落位
- `TicketDetailModal`
  - 工单详情与备注

该结构降低了 `app/page.tsx` 复杂度，便于后续扩展。

## 9. 状态与交互模式

### 9.1 请求状态

- `isLoading`、`isSubmitting`
- 错误提示支持重试

### 9.2 列表交互

- 搜索/筛选/排序
- 拖拽状态流转
- 多选批量状态更新 + 撤销
- 自动刷新开关

### 9.3 权限交互

- 无权限操作时显示轻量提示
- 未登录触发登录页跳转

## 10. 样式与主题结构

- 全局样式：`app/globals.css`
- 主题变量：通过 `@theme inline` 与 CSS 变量管理
- 页面主风格：深色极简看板（`zinc` 色阶）

## 11. 前后端联调约束

- 前端默认端口：`3000`
- 后端默认端口：`8080`
- 请求基地址：`NEXT_PUBLIC_API_BASE_URL`
- 认证方式：Cookie Session（前端必须 `credentials: include`）

## 12. 当前架构特征与演进建议

当前特征：

- 页面与业务组件已分层
- 服务层已抽象，复用度较高
- 权限控制路径清晰

建议演进方向：

1. 继续细分 `app/hooks/board` 子模块（请求逻辑 vs 交互逻辑）
2. 为服务层补充更严格的响应类型定义
3. 对高复杂页面补充组件级测试（优先看板、用户管理）
4. 增加 API 错误码映射，统一用户提示文案

## 13. 快速启动命令

```bash
npm install
npm run dev
```

如需指定后端地址，请配置 `.env.local`：

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

