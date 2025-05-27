/**
 * Video compatibility detection and helper utilities
 * 视频兼容性检测和辅助工具
 */

export interface VideoCodecSupport {
  name: string
  mimeType: string
  supported: boolean
  supportLevel: 'probably' | 'maybe' | 'not-supported'
}

export interface VideoCompatibilityReport {
  userAgent: string
  platform: string
  isElectron: boolean
  basicFormats: VideoCodecSupport[]
  advancedCodecs: VideoCodecSupport[]
  recommendations: string[]
}

/**
 * Check if a specific video codec is supported
 * 检查特定视频编解码器是否支持
 */
export function checkCodecSupport(mimeType: string): VideoCodecSupport {
  const video = document.createElement('video')
  const canPlay = video.canPlayType(mimeType)

  let supported = false
  let supportLevel: 'probably' | 'maybe' | 'not-supported' = 'not-supported'

  if (canPlay === 'probably') {
    supported = true
    supportLevel = 'probably'
  } else if (canPlay === 'maybe') {
    supported = true
    supportLevel = 'maybe'
  }

  return {
    name: mimeType,
    mimeType,
    supported,
    supportLevel
  }
}

/**
 * Generate a comprehensive video compatibility report
 * 生成全面的视频兼容性报告
 */
export function generateCompatibilityReport(): VideoCompatibilityReport {
  const basicFormats = [
    'video/mp4',
    'video/mp4; codecs="avc1.42E01E"', // H.264 Baseline
    'video/mp4; codecs="avc1.4D401E"', // H.264 Main
    'video/mp4; codecs="avc1.64001E"', // H.264 High
    'video/webm',
    'video/webm; codecs="vp8"',
    'video/webm; codecs="vp9"',
    'video/ogg',
    'video/ogg; codecs="theora"'
  ].map(checkCodecSupport)

  const advancedCodecs = [
    'video/mp4; codecs="hev1.1.6.L93.B0"', // H.265/HEVC Main Profile
    'video/mp4; codecs="hvc1.1.6.L93.B0"', // H.265/HEVC Main Profile (alternative)
    'video/mp4; codecs="av01.0.05M.08"', // AV1
    'video/webm; codecs="av01.0.05M.08"', // AV1 in WebM
    'video/mp4; codecs="vp09.00.10.08"', // VP9 Profile 0
    'video/mp4; codecs="dvh1.05.06"' // Dolby Vision
  ].map(checkCodecSupport)

  const recommendations = generateRecommendations(basicFormats, advancedCodecs)

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    isElectron: typeof window.process !== 'undefined',
    basicFormats,
    advancedCodecs,
    recommendations
  }
}

/**
 * Generate recommendations based on codec support
 * 基于编解码器支持情况生成建议
 */
function generateRecommendations(
  basicFormats: VideoCodecSupport[],
  advancedCodecs: VideoCodecSupport[]
): string[] {
  const recommendations: string[] = []

  // Check H.265 support
  const h265Support = advancedCodecs.find(
    (codec) => codec.mimeType.includes('hev1') || codec.mimeType.includes('hvc1')
  )

  if (!h265Support?.supported) {
    recommendations.push(
      '当前环境不支持 H.265/HEVC 编解码器。建议将视频转换为 H.264 格式以获得最佳兼容性。'
    )
    recommendations.push(
      '推荐使用 FFmpeg 转换命令: ffmpeg -i input.mp4 -c:v libx264 -crf 23 -c:a aac output.mp4'
    )
  }

  // Check basic H.264 support
  const h264Support = basicFormats.find((codec) => codec.mimeType.includes('avc1'))

  if (!h264Support?.supported) {
    recommendations.push('当前环境对 H.264 支持有限。建议检查系统编解码器安装情况。')
  }

  // Check WebM support
  const webmSupport = basicFormats.find((codec) => codec.mimeType === 'video/webm')

  if (webmSupport?.supported) {
    recommendations.push('WebM 格式受支持，可以考虑使用 VP8/VP9 编码的 WebM 作为备选方案。')
  }

  return recommendations
}

/**
 * Print compatibility report to console
 * 将兼容性报告打印到控制台
 */
export function printCompatibilityReport(): void {
  const report = generateCompatibilityReport()

  console.log('\n=== 视频兼容性报告 ===\n')

  console.log('环境信息:')
  console.log(`- 用户代理: ${report.userAgent}`)
  console.log(`- 平台: ${report.platform}`)
  console.log(`- Electron环境: ${report.isElectron ? '是' : '否'}\n`)

  console.log('视频格式支持:')
  report.basicFormats.forEach((format) => {
    const status = format.supported ? '✓' : '✗'
    const level = format.supportLevel !== 'not-supported' ? ` (${format.supportLevel})` : ''
    console.log(`- ${format.mimeType}: ${status}${level}`)
  })

  console.log('\n视频编解码器支持:')
  report.advancedCodecs.forEach((codec) => {
    const status = codec.supported ? '✓' : '✗'
    const level = codec.supportLevel !== 'not-supported' ? ` (${codec.supportLevel})` : ''
    console.log(`- ${codec.mimeType}: ${status}${level}`)
  })

  if (report.recommendations.length > 0) {
    console.log('\n建议:')
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`)
    })
  }

  console.log('\n详细格式检测:')
  const detailedFormats = [
    'video/mp4',
    'video/mp4; codecs="avc1.42E01E"',
    'video/mp4; codecs="hev1.1.6.L93.B0"',
    'video/webm',
    'video/webm; codecs="vp8"',
    'video/webm; codecs="vp9"',
    'video/ogg',
    'video/avi',
    'video/quicktime'
  ]

  const video = document.createElement('video')
  detailedFormats.forEach((format) => {
    const support = video.canPlayType(format)
    const status = support === 'probably' ? 'probably' : support === 'maybe' ? 'maybe' : '不支持'
    console.log(`- ${format}: ${status}`)
  })
}

/**
 * Check if current environment supports H.265/HEVC
 * 检查当前环境是否支持 H.265/HEVC
 */
export function supportsH265(): boolean {
  const h265Formats = ['video/mp4; codecs="hev1.1.6.L93.B0"', 'video/mp4; codecs="hvc1.1.6.L93.B0"']

  return h265Formats.some((format) => {
    const support = checkCodecSupport(format)
    return support.supported
  })
}

/**
 * Get recommended video settings for current environment
 * 获取当前环境推荐的视频设置
 */
export function getRecommendedVideoSettings(): {
  preferredFormat: string
  fallbackFormats: string[]
  conversionCommand?: string
} {
  const h265Supported = supportsH265()

  if (h265Supported) {
    return {
      preferredFormat: 'H.265/HEVC (MP4)',
      fallbackFormats: ['H.264 (MP4)', 'VP9 (WebM)', 'VP8 (WebM)']
    }
  }

  return {
    preferredFormat: 'H.264 (MP4)',
    fallbackFormats: ['VP9 (WebM)', 'VP8 (WebM)'],
    conversionCommand: 'ffmpeg -i input.mp4 -c:v libx264 -crf 23 -c:a aac output.mp4'
  }
}
