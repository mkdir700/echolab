# 构建指南 / Build Guide

本文档详细说明了 EchoLab 的多架构跨平台构建和发布流程。

This document provides detailed instructions for EchoLab's multi-architecture cross-platform build and release process.

## 支持的平台和架构 / Supported Platforms and Architectures

### Windows

- **x64**: Intel/AMD 64位处理器 / Intel/AMD 64-bit processors
- **ARM64**: ARM64 处理器（如 Surface Pro X）/ ARM64 processors (e.g., Surface Pro X)

### macOS

- **x64 (Intel)**: Intel 处理器的 Mac / Intel-based Macs
- **ARM64 (Apple Silicon)**: M1/M2/M3 等 Apple Silicon 处理器 / M1/M2/M3 Apple Silicon processors

### Linux

- **x64 (AMD64)**: Intel/AMD 64位处理器 / Intel/AMD 64-bit processors

## 构建产物命名格式 / Build Artifact Naming Format

构建完成后，产物将按照以下格式命名：

After building, artifacts will be named according to the following format:

### Windows

- `echolab-{version}-x64-setup.exe` - Windows x64 安装程序
- `echolab-{version}-arm64-setup.exe` - Windows ARM64 安装程序

### macOS

- `echolab-{version}-intel.dmg` - macOS Intel DMG 文件
- `echolab-{version}-arm64.dmg` - macOS Apple Silicon DMG 文件

### Linux

- `echolab-{version}-amd64.deb` - Linux DEB 包
- `echolab-{version}-amd64.appimage` - Linux AppImage 文件

## 本地构建 / Local Building

### 前置要求 / Prerequisites

1. **Node.js** 18+
2. **pnpm** 8+
3. **平台特定要求 / Platform-specific requirements**:
   - **Windows**: Windows 10+ 或 Windows Server 2016+
   - **macOS**: macOS 10.15+ (仅能在 macOS 上构建 macOS 应用)
   - **Linux**: Ubuntu 18.04+ 或其他现代 Linux 发行版

### 安装依赖 / Install Dependencies

```bash
pnpm install
```

### 单平台构建 / Single Platform Build

```bash
# Windows 构建
pnpm build:win:x64      # Windows x64
pnpm build:win:arm64    # Windows ARM64

# macOS 构建 (仅在 macOS 上可用)
pnpm build:mac:x64      # macOS Intel
pnpm build:mac:arm64    # macOS Apple Silicon

# Linux 构建
pnpm build:linux:x64    # Linux x64
```

### 多平台构建 / Multi-Platform Build

```bash
# 构建当前平台支持的所有架构
pnpm build:all

# 清理并构建所有架构
pnpm build:all:clean

# 构建特定平台
pnpm exec tsx scripts/build-all-platforms.ts --target=windows
pnpm exec tsx scripts/build-all-platforms.ts --target=macos
pnpm exec tsx scripts/build-all-platforms.ts --target=linux
```

### 验证构建产物 / Verify Build Artifacts

```bash
# 验证构建产物是否正确生成
pnpm build:verify
```

### 重命名构建产物 / Rename Build Artifacts

```bash
# 手动重命名构建产物（通常自动执行）
pnpm release:rename
```

## GitHub Actions 自动构建 / GitHub Actions Automated Build

### 触发条件 / Trigger Conditions

1. **标签推送 / Tag Push**: 推送以 `v` 开头的标签时自动触发
2. **手动触发 / Manual Trigger**: 在 GitHub Actions 页面手动触发

### 构建矩阵 / Build Matrix

GitHub Actions 使用矩阵策略同时构建多个平台和架构：

```yaml
strategy:
  fail-fast: false
  matrix:
    include:
      # Windows builds
      - os: windows-latest
        platform: win
        arch: x64
        target: --win --x64
      - os: windows-latest
        platform: win
        arch: arm64
        target: --win --arm64
      # macOS builds
      - os: macos-latest
        platform: mac
        arch: x64
        target: --mac --x64
      - os: macos-latest
        platform: mac
        arch: arm64
        target: --mac --arm64
      # Linux builds
      - os: ubuntu-latest
        platform: linux
        arch: x64
        target: --linux --x64
```

### 构建流程 / Build Process

1. **环境准备 / Environment Setup**: 安装 Node.js、pnpm 和依赖
2. **代码构建 / Code Build**: 编译 TypeScript 和打包资源
3. **应用打包 / App Packaging**: 使用 Electron Builder 打包应用
4. **产物重命名 / Artifact Renaming**: 按照规范重命名构建产物
5. **产物验证 / Artifact Verification**: 验证构建产物的完整性
6. **产物上传 / Artifact Upload**: 上传到 GitHub Artifacts 和 Release

## 配置文件说明 / Configuration Files

### electron-builder.yml

主要的 Electron Builder 配置文件，定义了：

- 支持的平台和架构
- 构建产物命名规则
- 应用元数据和图标
- 发布配置

### scripts/rename-artifacts.ts

构建产物重命名脚本，负责：

- 将默认的构建产物名称转换为项目规范格式
- 处理不同平台的命名差异
- 提供详细的重命名日志

### scripts/build-all-platforms.ts

多平台构建脚本，提供：

- 一键构建所有支持的平台和架构
- 平台兼容性检查
- 构建进度和结果报告

### scripts/verify-build-artifacts.ts

构建产物验证脚本，用于：

- 检查期望的构建产物是否存在
- 验证文件大小和完整性
- 生成详细的验证报告

## 故障排除 / Troubleshooting

### 常见问题 / Common Issues

1. **构建失败 / Build Failure**

   - 检查 Node.js 和 pnpm 版本
   - 清理 node_modules 并重新安装依赖
   - 检查平台特定的构建要求

2. **文件命名错误 / Incorrect File Naming**

   - 运行 `pnpm release:rename` 手动重命名
   - 检查 version 字段是否正确

3. **跨平台构建问题 / Cross-Platform Build Issues**
   - macOS 应用只能在 macOS 上构建
   - Windows ARM64 构建需要特定的工具链
   - Linux 构建可能需要额外的系统依赖

### 调试命令 / Debug Commands

```bash
# 查看构建产物
ls -la dist/

# 检查 Electron Builder 配置
pnpm exec electron-builder --help

# 查看详细构建日志
DEBUG=electron-builder pnpm build:win:x64
```

## 发布流程 / Release Process

1. **版本更新**: 使用 `pnpm version:*` 命令更新版本号
2. **标签推送**: 推送版本标签触发自动构建
3. **构建验证**: 检查 GitHub Actions 构建状态
4. **发布确认**: 在 GitHub Releases 中发布正式版本

更多详细信息请参考 [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md)。
