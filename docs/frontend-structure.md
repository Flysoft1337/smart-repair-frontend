# Frontend 目录整理约定（Phase 1）

本文件用于约束 `smart-repair-frontend` 的目录使用方式，降低后续功能迭代时的目录混乱。

## 目标

- 页面只做组装，不承载复杂业务状态逻辑
- 可复用业务逻辑沉淀在 `app/hooks` 与 `lib/services`
- 组件导入优先走目录 `index.ts`（barrel）

## 当前目录分工

- `app/`: 路由页面与页面级 hooks
- `components/ui/`: 原子 UI 组件（shadcn 风格）
- `components/home|dashboard|worker|tickets/`: 领域组件
- `components/guards/`: 页面权限守卫导出入口
- `lib/api.ts`: 基础请求封装
- `lib/services/`: 按业务域组织 API 调用

## 导入约定

- UI 组件优先从 `@/components/ui` 导入
- Dashboard 组件优先从 `@/components/dashboard` 导入
- 页面 hooks 优先从 `@/app/hooks` 导入

## Phase 1 已完成

- 新增 `components/ui/index.ts`
- 新增 `components/dashboard/index.ts`
- 新增 `components/tickets/index.ts`
- 新增 `components/guards/index.ts`
- 新增 `app/hooks/index.ts`
- 新增 `app/hooks/board/index.ts`

## 下一步建议（Phase 2）

1. 将 `lib/services/*.ts` 迁移为 `lib/services/<domain>/index.ts`
2. 为每个路由增加 `types.ts`，避免类型散落
3. 增加 `docs/import-rules.md` 并在 CI 中加入简单 lint 约束

