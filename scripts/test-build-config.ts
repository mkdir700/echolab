#!/usr/bin/env tsx

import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'

/**
 * 构建配置测试脚本 / Build Configuration Test Script
 *
 * 该脚本用于验证构建配置的正确性
 * This script verifies the correctness of build configurations
 */

interface TestResult {
  name: string
  passed: boolean
  message: string
}

// 测试 Electron Builder 配置 / Test Electron Builder configuration
function testElectronBuilderConfig(): TestResult[] {
  const results: TestResult[] = []

  try {
    const configPath = path.join(process.cwd(), 'electron-builder.yml')
    if (!fs.existsSync(configPath)) {
      return [
        {
          name: 'Electron Builder Config File',
          passed: false,
          message: 'electron-builder.yml not found'
        }
      ]
    }

    const configContent = fs.readFileSync(configPath, 'utf8')
    const config = yaml.parse(configContent)

    // 测试 Windows 配置
    results.push({
      name: 'Windows x64 Support',
      passed: config.win?.target?.[0]?.arch?.includes('x64') || false,
      message: config.win?.target?.[0]?.arch?.includes('x64')
        ? 'Windows x64 architecture supported'
        : 'Windows x64 architecture not configured'
    })

    results.push({
      name: 'Windows ARM64 Support',
      passed: config.win?.target?.[0]?.arch?.includes('arm64') || false,
      message: config.win?.target?.[0]?.arch?.includes('arm64')
        ? 'Windows ARM64 architecture supported'
        : 'Windows ARM64 architecture not configured'
    })

    // 测试 macOS 配置
    const macTargets = config.mac?.target || []
    const dmgTarget = macTargets.find(
      (t: { target: string; arch?: string[] }) => t.target === 'dmg'
    )

    results.push({
      name: 'macOS x64 Support',
      passed: dmgTarget?.arch?.includes('x64') || false,
      message: dmgTarget?.arch?.includes('x64')
        ? 'macOS x64 architecture supported'
        : 'macOS x64 architecture not configured'
    })

    results.push({
      name: 'macOS ARM64 Support',
      passed: dmgTarget?.arch?.includes('arm64') || false,
      message: dmgTarget?.arch?.includes('arm64')
        ? 'macOS ARM64 architecture supported'
        : 'macOS ARM64 architecture not configured'
    })

    // 测试 Linux 配置
    const linuxTargets = config.linux?.target || []
    const debTarget = linuxTargets.find(
      (t: { target: string; arch?: string[] }) => t.target === 'deb'
    )
    const appImageTarget = linuxTargets.find(
      (t: { target: string; arch?: string[] }) => t.target === 'AppImage'
    )

    results.push({
      name: 'Linux DEB Support',
      passed: debTarget?.arch?.includes('x64') || false,
      message: debTarget?.arch?.includes('x64')
        ? 'Linux DEB x64 architecture supported'
        : 'Linux DEB x64 architecture not configured'
    })

    results.push({
      name: 'Linux AppImage Support',
      passed: appImageTarget?.arch?.includes('x64') || false,
      message: appImageTarget?.arch?.includes('x64')
        ? 'Linux AppImage x64 architecture supported'
        : 'Linux AppImage x64 architecture not configured'
    })

    // 测试命名配置
    results.push({
      name: 'Windows NSIS Naming',
      passed: config.nsis?.artifactName?.includes('${arch}') || false,
      message: config.nsis?.artifactName?.includes('${arch}')
        ? 'Windows NSIS naming includes architecture'
        : 'Windows NSIS naming missing architecture'
    })

    results.push({
      name: 'macOS DMG Naming',
      passed: config.dmg?.artifactName?.includes('${arch}') || false,
      message: config.dmg?.artifactName?.includes('${arch}')
        ? 'macOS DMG naming includes architecture'
        : 'macOS DMG naming missing architecture'
    })

    results.push({
      name: 'Linux DEB Naming',
      passed: config.deb?.artifactName?.includes('amd64') || false,
      message: config.deb?.artifactName?.includes('amd64')
        ? 'Linux DEB naming uses amd64'
        : 'Linux DEB naming missing amd64'
    })

    results.push({
      name: 'Linux AppImage Naming',
      passed: config.appImage?.artifactName?.includes('amd64') || false,
      message: config.appImage?.artifactName?.includes('amd64')
        ? 'Linux AppImage naming uses amd64'
        : 'Linux AppImage naming missing amd64'
    })
  } catch (error) {
    results.push({
      name: 'Electron Builder Config Parse',
      passed: false,
      message: `Failed to parse electron-builder.yml: ${error}`
    })
  }

  return results
}

// 测试 GitHub Actions 配置 / Test GitHub Actions configuration
function testGitHubActionsConfig(): TestResult[] {
  const results: TestResult[] = []

  try {
    const configPath = path.join(process.cwd(), '.github/workflows/build-and-release.yml')
    if (!fs.existsSync(configPath)) {
      return [
        {
          name: 'GitHub Actions Config File',
          passed: false,
          message: 'build-and-release.yml not found'
        }
      ]
    }

    const configContent = fs.readFileSync(configPath, 'utf8')
    const config = yaml.parse(configContent)

    const matrix = config.jobs?.release?.strategy?.matrix
    const includes = matrix?.include || []

    // 检查构建矩阵
    const windowsBuilds = includes.filter(
      (item: { platform: string; arch: string }) => item.platform === 'win'
    )
    const macosBuilds = includes.filter(
      (item: { platform: string; arch: string }) => item.platform === 'mac'
    )
    const linuxBuilds = includes.filter(
      (item: { platform: string; arch: string }) => item.platform === 'linux'
    )

    results.push({
      name: 'Windows Build Matrix',
      passed:
        windowsBuilds.length === 2 &&
        windowsBuilds.some((b) => b.arch === 'x64') &&
        windowsBuilds.some((b) => b.arch === 'arm64'),
      message: `Windows builds configured: ${windowsBuilds.length} (expected: 2 with x64 and arm64)`
    })

    results.push({
      name: 'macOS Build Matrix',
      passed:
        macosBuilds.length === 2 &&
        macosBuilds.some((b) => b.arch === 'x64') &&
        macosBuilds.some((b) => b.arch === 'arm64'),
      message: `macOS builds configured: ${macosBuilds.length} (expected: 2 with x64 and arm64)`
    })

    results.push({
      name: 'Linux Build Matrix',
      passed: linuxBuilds.length === 1 && linuxBuilds.some((b) => b.arch === 'x64'),
      message: `Linux builds configured: ${linuxBuilds.length} (expected: 1 with x64)`
    })

    // 检查构建步骤
    const steps = config.jobs?.release?.steps || []
    const hasRenameStep = steps.some((step: { name?: string }) =>
      step.name?.includes('Rename artifacts')
    )
    const hasVerifyStep = steps.some((step: { name?: string }) =>
      step.name?.includes('Verify build artifacts')
    )

    results.push({
      name: 'Rename Artifacts Step',
      passed: hasRenameStep,
      message: hasRenameStep ? 'Rename artifacts step found' : 'Rename artifacts step missing'
    })

    results.push({
      name: 'Verify Artifacts Step',
      passed: hasVerifyStep,
      message: hasVerifyStep ? 'Verify artifacts step found' : 'Verify artifacts step missing'
    })
  } catch (error) {
    results.push({
      name: 'GitHub Actions Config Parse',
      passed: false,
      message: `Failed to parse build-and-release.yml: ${error}`
    })
  }

  return results
}

// 测试 package.json 脚本 / Test package.json scripts
function testPackageJsonScripts(): TestResult[] {
  const results: TestResult[] = []

  try {
    const packagePath = path.join(process.cwd(), 'package.json')
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    const scripts = packageContent.scripts || {}

    const expectedScripts = [
      'build:win:x64',
      'build:win:arm64',
      'build:mac:x64',
      'build:mac:arm64',
      'build:linux:x64',
      'build:all',
      'build:all:clean',
      'build:verify',
      'release:rename'
    ]

    expectedScripts.forEach((scriptName) => {
      results.push({
        name: `Script: ${scriptName}`,
        passed: !!scripts[scriptName],
        message: scripts[scriptName] ? `Script defined: ${scripts[scriptName]}` : 'Script not found'
      })
    })
  } catch (error) {
    results.push({
      name: 'Package.json Parse',
      passed: false,
      message: `Failed to parse package.json: ${error}`
    })
  }

  return results
}

// 测试脚本文件存在性 / Test script files existence
function testScriptFiles(): TestResult[] {
  const results: TestResult[] = []

  const expectedScripts = [
    'scripts/rename-artifacts.ts',
    'scripts/build-all-platforms.ts',
    'scripts/verify-build-artifacts.ts'
  ]

  expectedScripts.forEach((scriptPath) => {
    const fullPath = path.join(process.cwd(), scriptPath)
    results.push({
      name: `Script File: ${scriptPath}`,
      passed: fs.existsSync(fullPath),
      message: fs.existsSync(fullPath) ? 'Script file exists' : 'Script file not found'
    })
  })

  return results
}

// 主函数 / Main function
function main(): void {
  console.log('🧪 Testing build configuration...')
  console.log('测试构建配置...\n')

  const allResults: TestResult[] = [
    ...testElectronBuilderConfig(),
    ...testGitHubActionsConfig(),
    ...testPackageJsonScripts(),
    ...testScriptFiles()
  ]

  // 显示结果 / Show results
  console.log('📊 TEST RESULTS / 测试结果')
  console.log('='.repeat(80))

  const passed = allResults.filter((r) => r.passed)
  const failed = allResults.filter((r) => !r.passed)

  console.log(`✅ Passed: ${passed.length}`)
  passed.forEach((result) => {
    console.log(`   ✅ ${result.name}: ${result.message}`)
  })

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`)
    failed.forEach((result) => {
      console.log(`   ❌ ${result.name}: ${result.message}`)
    })
  }

  console.log('\n' + '='.repeat(80))
  const successRate = (passed.length / allResults.length) * 100
  console.log(`📈 Success rate: ${passed.length}/${allResults.length} (${successRate.toFixed(1)}%)`)

  if (failed.length === 0) {
    console.log('🎉 All tests passed! Configuration is ready for multi-architecture builds.')
    console.log('🎉 所有测试通过！配置已准备好进行多架构构建。')
  } else {
    console.log('❌ Some tests failed. Please fix the configuration before proceeding.')
    console.log('❌ 部分测试失败。请在继续之前修复配置。')
    process.exit(1)
  }
}

// 运行脚本 / Run script
if (require.main === module) {
  main()
}

export { main as testBuildConfig }
