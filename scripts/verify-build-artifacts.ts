#!/usr/bin/env tsx

import * as fs from 'fs'
import * as path from 'path'

/**
 * 构建产物验证脚本 / Build Artifacts Verification Script
 *
 * 该脚本用于验证构建产物是否按照预期的命名格式生成
 * This script verifies that build artifacts are generated with the expected naming format
 */

interface ExpectedArtifact {
  pattern: RegExp
  description: string
  platform: string
  arch: string
  required: boolean
}

// 获取当前版本号 / Get current version
function getVersion(): string {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  return packageJson.version
}

// 获取构建产物目录 / Get build artifacts directory
function getDistDir(): string {
  return path.join(process.cwd(), 'dist')
}

// 定义期望的构建产物 / Define expected artifacts
function getExpectedArtifacts(version: string): ExpectedArtifact[] {
  return [
    // Windows artifacts
    {
      pattern: new RegExp(
        `^echolab-${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-x64-setup\\.exe$`
      ),
      description: 'Windows x64 installer',
      platform: 'windows',
      arch: 'x64',
      required: true
    },
    {
      pattern: new RegExp(
        `^echolab-${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-arm64-setup\\.exe$`
      ),
      description: 'Windows ARM64 installer',
      platform: 'windows',
      arch: 'arm64',
      required: true
    },
    // macOS artifacts
    {
      pattern: new RegExp(
        `^echolab-${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-intel\\.dmg$`
      ),
      description: 'macOS Intel DMG',
      platform: 'macos',
      arch: 'x64',
      required: true
    },
    {
      pattern: new RegExp(
        `^echolab-${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-arm64\\.dmg$`
      ),
      description: 'macOS Apple Silicon DMG',
      platform: 'macos',
      arch: 'arm64',
      required: true
    },
    // Linux artifacts
    {
      pattern: new RegExp(
        `^echolab-${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-amd64\\.deb$`
      ),
      description: 'Linux AMD64 DEB package',
      platform: 'linux',
      arch: 'x64',
      required: true
    },
    {
      pattern: new RegExp(
        `^echolab-${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-amd64\\.appimage$`
      ),
      description: 'Linux AMD64 AppImage',
      platform: 'linux',
      arch: 'x64',
      required: true
    }
  ]
}

// 验证文件大小 / Verify file size
function verifyFileSize(filePath: string): {
  size: number
  sizeFormatted: string
  isValid: boolean
} {
  const stats = fs.statSync(filePath)
  const size = stats.size
  const sizeFormatted = formatFileSize(size)

  // 最小文件大小检查（构建产物应该至少有几MB）/ Minimum file size check
  const minSize = 10 * 1024 * 1024 // 10MB
  const isValid = size >= minSize

  return { size, sizeFormatted, isValid }
}

// 格式化文件大小 / Format file size
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

// 验证构建产物 / Verify build artifacts
function verifyArtifacts(): void {
  console.log('🔍 Starting build artifacts verification...')
  console.log('开始验证构建产物...\n')

  const version = getVersion()
  const distDir = getDistDir()

  console.log(`📦 Version: ${version}`)
  console.log(`📁 Distribution directory: ${distDir}\n`)

  if (!fs.existsSync(distDir)) {
    console.error(`❌ Distribution directory not found: ${distDir}`)
    console.error(`❌ 构建产物目录不存在: ${distDir}`)
    process.exit(1)
  }

  // 获取所有文件 / Get all files
  const files = fs
    .readdirSync(distDir)
    .filter((file) => fs.statSync(path.join(distDir, file)).isFile())

  console.log('📋 Found files in dist directory:')
  console.log('在构建目录中找到的文件:')
  files.forEach((file) => {
    const filePath = path.join(distDir, file)
    const { sizeFormatted } = verifyFileSize(filePath)
    console.log(`   - ${file} (${sizeFormatted})`)
  })
  console.log()

  const expectedArtifacts = getExpectedArtifacts(version)
  const results: Array<{
    artifact: ExpectedArtifact
    found: boolean
    fileName?: string
    size?: string
    sizeValid?: boolean
  }> = []

  // 检查每个期望的构建产物 / Check each expected artifact
  for (const artifact of expectedArtifacts) {
    const matchingFile = files.find((file) => artifact.pattern.test(file))

    if (matchingFile) {
      const filePath = path.join(distDir, matchingFile)
      const { sizeFormatted, isValid } = verifyFileSize(filePath)

      results.push({
        artifact,
        found: true,
        fileName: matchingFile,
        size: sizeFormatted,
        sizeValid: isValid
      })
    } else {
      results.push({
        artifact,
        found: false
      })
    }
  }

  // 显示验证结果 / Show verification results
  console.log('📊 VERIFICATION RESULTS / 验证结果')
  console.log('='.repeat(80))

  const foundArtifacts = results.filter((r) => r.found)
  const missingArtifacts = results.filter((r) => !r.found)
  const invalidSizeArtifacts = results.filter((r) => r.found && !r.sizeValid)

  console.log(`✅ Found artifacts: ${foundArtifacts.length}/${expectedArtifacts.length}`)
  foundArtifacts.forEach((result) => {
    const sizeIcon = result.sizeValid ? '✅' : '⚠️'
    console.log(`   ${sizeIcon} ${result.artifact.description}`)
    console.log(`      File: ${result.fileName}`)
    console.log(`      Size: ${result.size}`)
    console.log(`      Platform: ${result.artifact.platform}-${result.artifact.arch}`)
  })

  if (missingArtifacts.length > 0) {
    console.log(`\n❌ Missing artifacts: ${missingArtifacts.length}`)
    missingArtifacts.forEach((result) => {
      console.log(
        `   - ${result.artifact.description} (${result.artifact.platform}-${result.artifact.arch})`
      )
    })
  }

  if (invalidSizeArtifacts.length > 0) {
    console.log(`\n⚠️  Artifacts with suspicious size: ${invalidSizeArtifacts.length}`)
    invalidSizeArtifacts.forEach((result) => {
      console.log(`   - ${result.fileName}: ${result.size} (may be too small)`)
    })
  }

  // 检查未识别的文件 / Check unrecognized files
  const recognizedFiles = foundArtifacts.map((r) => r.fileName!)
  const unrecognizedFiles = files.filter((file) => !recognizedFiles.includes(file))

  if (unrecognizedFiles.length > 0) {
    console.log(`\n🤔 Unrecognized files: ${unrecognizedFiles.length}`)
    unrecognizedFiles.forEach((file) => {
      const filePath = path.join(distDir, file)
      const { sizeFormatted } = verifyFileSize(filePath)
      console.log(`   - ${file} (${sizeFormatted})`)
    })
  }

  // 总结 / Summary
  console.log('\n' + '='.repeat(80))
  const successRate = (foundArtifacts.length / expectedArtifacts.length) * 100
  console.log(
    `📈 Success rate: ${foundArtifacts.length}/${expectedArtifacts.length} (${successRate.toFixed(1)}%)`
  )

  if (missingArtifacts.length === 0 && invalidSizeArtifacts.length === 0) {
    console.log('🎉 All expected artifacts found and verified!')
    console.log('🎉 所有期望的构建产物都已找到并验证！')
  } else {
    console.log('❌ Verification failed. Please check the build process.')
    console.log('❌ 验证失败。请检查构建过程。')
    process.exit(1)
  }
}

// 主函数 / Main function
function main(): void {
  verifyArtifacts()
}

// 运行脚本 / Run script
if (require.main === module) {
  main()
}

export { verifyArtifacts }
