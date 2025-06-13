#!/usr/bin/env tsx

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

/**
 * 多平台构建脚本 / Multi-platform Build Script
 *
 * 该脚本用于在本地构建所有支持的平台和架构
 * This script builds all supported platforms and architectures locally
 */

interface BuildTarget {
  name: string
  command: string
  description: string
  platforms: string[]
}

// 获取当前平台 / Get current platform
function getCurrentPlatform(): string {
  return process.platform
}

// 定义构建目标 / Define build targets
function getBuildTargets(): BuildTarget[] {
  return [
    {
      name: 'windows-x64',
      command: 'pnpm build:win:x64',
      description: 'Windows x64 installer',
      platforms: ['win32', 'linux', 'darwin'] // 可以在所有平台上交叉编译
    },
    {
      name: 'windows-arm64',
      command: 'pnpm build:win:arm64',
      description: 'Windows ARM64 installer',
      platforms: ['win32', 'linux', 'darwin']
    },
    {
      name: 'macos-x64',
      command: 'pnpm build:mac:x64',
      description: 'macOS Intel DMG',
      platforms: ['darwin'] // 只能在 macOS 上构建
    },
    {
      name: 'macos-arm64',
      command: 'pnpm build:mac:arm64',
      description: 'macOS Apple Silicon DMG',
      platforms: ['darwin']
    },
    {
      name: 'linux-x64',
      command: 'pnpm build:linux:x64',
      description: 'Linux x64 packages',
      platforms: ['linux', 'darwin'] // 可以在 Linux 和 macOS 上构建
    }
  ]
}

// 执行构建命令 / Execute build command
function executeBuild(target: BuildTarget): boolean {
  console.log(`\n🏗️  Building ${target.name}...`)
  console.log(`📝 Description: ${target.description}`)
  console.log(`⚡ Command: ${target.command}`)

  try {
    const startTime = Date.now()
    execSync(target.command, {
      stdio: 'inherit',
      cwd: process.cwd()
    })
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`✅ ${target.name} built successfully in ${duration}s`)
    return true
  } catch (error) {
    console.error(`❌ Failed to build ${target.name}:`, error)
    return false
  }
}

// 清理构建目录 / Clean build directory
function cleanBuildDirectory(): void {
  const distDir = path.join(process.cwd(), 'dist')
  if (fs.existsSync(distDir)) {
    console.log('🧹 Cleaning previous build artifacts...')
    console.log('清理之前的构建产物...')
    fs.rmSync(distDir, { recursive: true, force: true })
  }
}

// 显示构建摘要 / Show build summary
function showBuildSummary(results: Array<{ target: BuildTarget; success: boolean }>): void {
  console.log('\n' + '='.repeat(60))
  console.log('📊 BUILD SUMMARY / 构建摘要')
  console.log('='.repeat(60))

  const successful = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)

  console.log(`✅ Successful builds: ${successful.length}`)
  successful.forEach((r) => console.log(`   - ${r.target.name}: ${r.target.description}`))

  if (failed.length > 0) {
    console.log(`❌ Failed builds: ${failed.length}`)
    failed.forEach((r) => console.log(`   - ${r.target.name}: ${r.target.description}`))
  }

  console.log(
    `\n📈 Success rate: ${successful.length}/${results.length} (${((successful.length / results.length) * 100).toFixed(1)}%)`
  )
}

// 主函数 / Main function
function main(): void {
  console.log('🚀 Starting multi-platform build process...')
  console.log('开始多平台构建过程...\n')

  const currentPlatform = getCurrentPlatform()
  console.log(`🖥️  Current platform: ${currentPlatform}`)

  // 解析命令行参数 / Parse command line arguments
  const args = process.argv.slice(2)
  const shouldClean = args.includes('--clean') || args.includes('-c')
  const targetFilter = args.find((arg) => arg.startsWith('--target='))?.split('=')[1]
  const skipRename = args.includes('--skip-rename')

  if (shouldClean) {
    cleanBuildDirectory()
  }

  // 获取构建目标 / Get build targets
  let targets = getBuildTargets()

  // 过滤不支持的平台 / Filter unsupported platforms
  targets = targets.filter((target) => target.platforms.includes(currentPlatform))

  // 应用目标过滤器 / Apply target filter
  if (targetFilter) {
    targets = targets.filter((target) => target.name.includes(targetFilter))
    console.log(`🎯 Filtering targets by: ${targetFilter}`)
  }

  if (targets.length === 0) {
    console.log('❌ No valid build targets found for current platform')
    console.log('❌ 当前平台没有找到有效的构建目标')
    process.exit(1)
  }

  console.log(`📋 Build targets (${targets.length}):`)
  targets.forEach((target) => console.log(`   - ${target.name}: ${target.description}`))

  // 执行构建 / Execute builds
  const results: Array<{ target: BuildTarget; success: boolean }> = []

  for (const target of targets) {
    const success = executeBuild(target)
    results.push({ target, success })
  }

  // 重命名构建产物 / Rename build artifacts
  if (!skipRename) {
    console.log('\n🔄 Renaming build artifacts...')
    console.log('重命名构建产物...')
    try {
      execSync('pnpm release:rename', { stdio: 'inherit' })
      console.log('✅ Artifacts renamed successfully')
    } catch (error) {
      console.error('❌ Failed to rename artifacts:', error)
    }
  }

  // 显示构建摘要 / Show build summary
  showBuildSummary(results)

  // 检查是否有失败的构建 / Check for failed builds
  const hasFailures = results.some((r) => !r.success)
  if (hasFailures) {
    process.exit(1)
  }

  console.log('\n🎉 All builds completed successfully!')
  console.log('🎉 所有构建都已成功完成！')
}

// 显示帮助信息 / Show help information
function showHelp(): void {
  console.log(`
Usage: tsx scripts/build-all-platforms.ts [options]

Options:
  --clean, -c           Clean build directory before building
  --target=<name>       Filter targets by name (e.g., --target=windows)
  --skip-rename         Skip renaming artifacts after build
  --help, -h            Show this help message

Examples:
  tsx scripts/build-all-platforms.ts --clean
  tsx scripts/build-all-platforms.ts --target=windows
  tsx scripts/build-all-platforms.ts --clean --target=macos
`)
}

// 运行脚本 / Run script
if (require.main === module) {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
  } else {
    main()
  }
}

export { main as buildAllPlatforms }
