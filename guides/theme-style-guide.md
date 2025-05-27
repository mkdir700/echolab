# EchoLab 样式设计指南

## 概述

EchoLab 采用现代化的深色主题设计，以毛玻璃效果、渐变色彩和精致的动画为特色，打造沉浸式的视频学习体验。本指南将帮助开发者理解并遵循项目的设计系统。

## 🎨 设计理念

### 核心原则

- **沉浸式体验**：深色主题减少视觉疲劳，专注内容
- **现代化美学**：毛玻璃效果、渐变色彩、圆角设计
- **一致性**：统一的设计语言和交互模式
- **可访问性**：良好的对比度和响应式设计

### 视觉特色

- 深色背景配合半透明元素
- 紫蓝色渐变作为主色调
- 毛玻璃效果（backdrop-filter）
- 微妙的阴影和光效
- 流畅的动画过渡

## 🎯 设计令牌系统

### 颜色系统

#### 主色调

```css
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
--accent-color: #667eea;
--accent-hover: #7c8ef0;
--accent-active: #5a6fd8;
--accent-color-light: rgba(102, 126, 234, 0.15);
```

#### 背景色

```css
--dark-bg: #1a1a1a; /* 主背景 */
--darker-bg: #0f0f0f; /* 更深背景 */
--card-bg: rgba(255, 255, 255, 0.05); /* 卡片背景 */
--card-border: rgba(255, 255, 255, 0.1); /* 卡片边框 */
```

#### 文本色

```css
--text-primary: #ffffff; /* 主要文本 */
--text-secondary: #b0b0b0; /* 次要文本 */
--text-muted: #808080; /* 弱化文本 */
--text-disabled: #666666; /* 禁用文本 */
```

#### 状态色

```css
--success-color: #52c41a; /* 成功 */
--warning-color: #faad14; /* 警告 */
--error-color: #ff4d4f; /* 错误 */
```

#### 交互状态

```css
--hover-bg: rgba(255, 255, 255, 0.08); /* 悬停背景 */
--active-bg: rgba(255, 255, 255, 0.12); /* 激活背景 */
--border-color: rgba(255, 255, 255, 0.15); /* 边框色 */
```

### 间距系统

```css
--spacing-xs: 4px; /* 极小间距 */
--spacing-sm: 8px; /* 小间距 */
--spacing-md: 12px; /* 中等间距 */
--spacing-lg: 16px; /* 大间距 */
--spacing-xl: 24px; /* 超大间距 */
--spacing-2xl: 32px; /* 特大间距 */
```

### 圆角系统

```css
--border-radius-sm: 6px; /* 小圆角 */
--border-radius: 12px; /* 标准圆角 */
--border-radius-md: 12px; /* 中等圆角 */
--border-radius-lg: 16px; /* 大圆角 */
--border-radius-xl: 20px; /* 超大圆角 */
```

### 阴影系统

```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2); /* 小阴影 */
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.3); /* 中等阴影 */
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.4); /* 大阴影 */
```

### 动画系统

```css
--transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 标准过渡 */
--transition-fast: all 0.15s ease; /* 快速过渡 */
--transition-slow: all 0.5s ease; /* 慢速过渡 */
```

### 字体系统

#### 字体族

```css
--font-family-base:
  -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
  'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
--font-family-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
```

#### 字体大小

```css
--font-size-xs: 11px; /* 极小字体 */
--font-size-sm: 12px; /* 小字体 */
--font-size-base: 14px; /* 基础字体 */
--font-size-lg: 16px; /* 大字体 */
--font-size-xl: 18px; /* 超大字体 */
--font-size-2xl: 24px; /* 特大字体 */
--font-size-3xl: 32px; /* 巨大字体 */
```

#### 行高

```css
--line-height-tight: 1.2; /* 紧密行高 */
--line-height-base: 1.5; /* 基础行高 */
--line-height-relaxed: 1.6; /* 宽松行高 */
```

## 🧩 组件样式规范

### 按钮组件

#### 主要按钮

```css
.ant-btn-primary {
  background: linear-gradient(135deg, var(--accent-color), #8b5cf6) !important;
  border: none !important;
  border-radius: 8px !important;
  font-weight: 500 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.ant-btn-primary:hover {
  background: linear-gradient(135deg, #7c93f0, #9d6bdc) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3) !important;
}
```

#### 默认按钮

```css
.ant-btn-default {
  background: var(--card-bg) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 8px !important;
  color: var(--text-secondary) !important;
  font-weight: 500 !important;
}

.ant-btn-default:hover {
  border-color: var(--accent-color) !important;
  color: var(--accent-color) !important;
  background: var(--accent-color-light) !important;
  transform: translateY(-1px) !important;
}
```

### 卡片组件

#### 基础卡片

```css
.ant-card {
  background: var(--card-bg) !important;
  border: 1px solid var(--card-border) !important;
  border-radius: 12px !important;
  box-shadow: var(--shadow-sm) !important;
  backdrop-filter: blur(20px) !important;
  transition: var(--transition) !important;
}

.ant-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  border-color: var(--accent-color);
}
```

#### 现代化卡片

```css
.modern-card {
  background: linear-gradient(145deg, var(--card-bg) 0%, rgba(255, 255, 255, 0.03) 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 16px !important;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 输入框组件

```css
.ant-input {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 8px !important;
  color: var(--text-primary) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

.ant-input:hover {
  border-color: var(--accent-color) !important;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1) !important;
}

.ant-input:focus {
  border-color: var(--accent-color) !important;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) !important;
}
```

### 模态框组件

```css
.modal .ant-modal-content {
  background: var(--card-bg) !important;
  border: 1px solid var(--card-border) !important;
  border-radius: var(--border-radius-lg) !important;
  box-shadow: var(--shadow-lg) !important;
  backdrop-filter: blur(20px) !important;
  overflow: hidden;
}

.modal .ant-modal-header {
  background: transparent !important;
  border-bottom: 1px solid var(--card-border) !important;
  padding: var(--spacing-lg) var(--spacing-xl) !important;
}

.modal .ant-modal-body {
  padding: var(--spacing-xl) !important;
  background: transparent !important;
}
```

## 🎭 特殊效果

### 毛玻璃效果

```css
.glass-effect {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### 渐变文本

```css
.gradient-text {
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### 悬停动画

```css
.hover-lift {
  transition: var(--transition);
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

## 📱 响应式设计

### 断点系统

- **大屏幕**: `max-width: 1200px`
- **平板设备**: `max-width: 1024px`
- **移动设备**: `max-width: 768px`
- **小屏设备**: `max-width: 480px`

### 响应式原则

1. **移动优先**：从小屏幕开始设计
2. **渐进增强**：大屏幕添加更多功能
3. **触摸友好**：移动端增大点击区域
4. **内容优先**：确保核心功能在所有设备上可用

### 移动端优化

```css
@media (max-width: 768px) {
  /* 增大点击区域 */
  .mobile-touch {
    min-height: 44px;
    min-width: 44px;
  }

  /* 简化布局 */
  .mobile-stack {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  /* 调整字体大小 */
  .mobile-text {
    font-size: var(--font-size-base);
  }
}
```

## 🎨 主题定制

### Ant Design 主题覆盖

项目使用全局 CSS 变量覆盖 Ant Design 的默认样式，确保组件与设计系统一致。

### 深色主题变量

```css
:root {
  --antd-bg-primary: rgba(255, 255, 255, 0.03);
  --antd-bg-secondary: rgba(255, 255, 255, 0.05);
  --antd-bg-hover: rgba(255, 255, 255, 0.08);
  --antd-border: rgba(255, 255, 255, 0.08);
  --antd-border-hover: var(--accent-color);
  --antd-text: var(--text-primary);
  --antd-text-secondary: var(--text-muted);
}
```

## 🔧 开发指南

### 样式文件结构

```
src/renderer/src/styles/
├── index.css          # 主入口文件
├── variables.css      # 设计令牌
├── base.css          # 基础样式
├── antd-theme.css    # Ant Design 主题
├── layout.css        # 布局样式
├── components.css    # 通用组件样式
├── pages.css         # 页面特定样式
└── responsive.css    # 响应式样式
```

### 命名规范

1. **CSS 类名**：使用 kebab-case
2. **CSS 变量**：使用 kebab-case，带有语义前缀
3. **CSS 模块**：使用 camelCase

### 最佳实践

#### 1. 使用设计令牌

```css
/* ✅ 推荐 */
.my-component {
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  color: var(--text-primary);
}

/* ❌ 不推荐 */
.my-component {
  padding: 16px;
  border-radius: 12px;
  color: #ffffff;
}
```

#### 2. 保持一致的动画

```css
/* ✅ 推荐 */
.my-component {
  transition: var(--transition);
}

.my-component:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

#### 3. 使用毛玻璃效果

```css
/* ✅ 推荐 */
.glass-card {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--card-border);
}
```

#### 4. 响应式设计

```css
/* ✅ 推荐 */
.responsive-component {
  padding: var(--spacing-xl);
}

@media (max-width: 768px) {
  .responsive-component {
    padding: var(--spacing-lg);
  }
}
```

## 🎯 组件开发指南

### 新组件开发流程

1. **设计审查**：确保符合设计系统
2. **使用设计令牌**：避免硬编码值
3. **添加悬停效果**：提供视觉反馈
4. **响应式适配**：确保移动端可用
5. **无障碍支持**：添加适当的 ARIA 属性

### 样式模块模板

```css
/* ComponentName.module.css */

/* 主容器 */
.container {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  backdrop-filter: blur(20px);
  transition: var(--transition);
}

.container:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  border-color: var(--accent-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: var(--spacing-md);
    border-radius: var(--border-radius-sm);
  }
}
```

## 🚀 性能优化

### CSS 性能最佳实践

1. **使用 CSS 变量**：减少重复代码
2. **避免深层嵌套**：保持选择器简洁
3. **使用 transform**：优化动画性能
4. **合理使用 backdrop-filter**：避免过度使用

### 动画性能

```css
/* ✅ 推荐 - 使用 transform */
.optimized-animation {
  transform: translateY(0);
  transition: transform var(--transition);
}

.optimized-animation:hover {
  transform: translateY(-2px);
}

/* ❌ 不推荐 - 使用 top/left */
.slow-animation {
  top: 0;
  transition: top var(--transition);
}

.slow-animation:hover {
  top: -2px;
}
```

## 📋 检查清单

### 新组件开发检查清单

- [ ] 使用设计令牌而非硬编码值
- [ ] 添加悬停和焦点状态
- [ ] 实现响应式设计
- [ ] 添加适当的过渡动画
- [ ] 确保无障碍访问
- [ ] 测试深色主题兼容性
- [ ] 验证移动端体验

### 样式审查检查清单

- [ ] 符合设计系统规范
- [ ] 使用一致的命名规范
- [ ] 代码结构清晰
- [ ] 性能优化到位
- [ ] 浏览器兼容性良好

---

## 📚 参考资源

- [CSS 变量文档](./src/renderer/src/styles/variables.css)
- [Ant Design 主题定制](./src/renderer/src/styles/antd-theme.css)
- [响应式设计规范](./src/renderer/src/styles/responsive.css)

通过遵循这个样式指南，我们可以确保 EchoLab 项目保持一致的视觉体验和高质量的代码标准。
