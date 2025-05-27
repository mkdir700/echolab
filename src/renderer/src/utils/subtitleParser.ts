// SubtitleItem 已移动到 src/types/shared.ts 中统一定义
import type { SubtitleItem } from '@types_/shared'

// 将时间字符串转换为秒数
function parseTimeToSeconds(timeStr: string): number {
  const match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/)
  if (!match) return 0

  const hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const seconds = parseInt(match[3], 10)
  const milliseconds = parseInt(match[4], 10)

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000
}

// 解析 SRT 格式字幕
function parseSRT(content: string): SubtitleItem[] {
  const subtitles: SubtitleItem[] = []
  const blocks = content.trim().split(/\n\s*\n/)

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 3) continue

    const timeMatch = lines[1].match(
      /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/
    )
    if (!timeMatch) continue

    const startTime = parseTimeToSeconds(timeMatch[1])
    const endTime = parseTimeToSeconds(timeMatch[2])
    const rawText = lines
      .slice(2)
      .join('\n')
      .replace(/<[^>]*>/g, '') // 移除 HTML 标签

    const processedText = processBilingualText(rawText)
    subtitles.push({
      startTime,
      endTime,
      text: processedText.text,
      englishText: processedText.englishText,
      chineseText: processedText.chineseText
    })
  }

  return subtitles
}

// 解析 VTT 格式字幕
function parseVTT(content: string): SubtitleItem[] {
  const subtitles: SubtitleItem[] = []
  const lines = content.split('\n')
  let i = 0

  // 跳过 WEBVTT 头部
  while (i < lines.length && !lines[i].includes('-->')) {
    i++
  }

  while (i < lines.length) {
    const line = lines[i].trim()

    if (line.includes('-->')) {
      const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/)
      if (timeMatch) {
        const startTime = parseTimeToSeconds(timeMatch[1].replace('.', ','))
        const endTime = parseTimeToSeconds(timeMatch[2].replace('.', ','))

        i++
        const textLines: string[] = []

        // 收集字幕文本
        while (i < lines.length && lines[i].trim() !== '') {
          textLines.push(lines[i].trim())
          i++
        }

        if (textLines.length > 0) {
          const rawText = textLines.join('\n').replace(/<[^>]*>/g, '')
          const processedText = processBilingualText(rawText)
          subtitles.push({
            startTime,
            endTime,
            text: processedText.text,
            englishText: processedText.englishText,
            chineseText: processedText.chineseText
          })
        }
      }
    }
    i++
  }

  return subtitles
}

// 解析 JSON 格式字幕
function parseJSON(content: string): SubtitleItem[] {
  try {
    const data = JSON.parse(content)
    if (Array.isArray(data)) {
      return data
        .filter(
          (item) =>
            typeof item.startTime === 'number' &&
            typeof item.endTime === 'number' &&
            typeof item.text === 'string'
        )
        .map((item) => {
          const processedText = processBilingualText(item.text)
          return {
            startTime: item.startTime,
            endTime: item.endTime,
            text: processedText.text,
            englishText: processedText.englishText,
            chineseText: processedText.chineseText
          }
        })
    }
  } catch (error) {
    console.error('JSON 解析错误:', error)
  }
  return []
}

// 提取英文字幕的函数
function extractEnglishText(text: string): string {
  // 英文字幕通常在前面，或者用换行符分隔
  const lines = text.split(/\n+/)

  // 查找包含英文字符的行
  for (const line of lines) {
    if (/[a-zA-Z]/.test(line) && line.trim().length > 0) {
      return line.trim()
    }
  }

  // 如果没找到明显的英文，返回第一行
  return lines[0]?.trim() || text
}

// 提取中文字幕的函数
function extractChineseText(text: string): string {
  // 中文字幕通常在后面，或者包含中文字符
  const lines = text.split(/\n+/)

  // 查找包含中文字符的行
  for (const line of lines) {
    if (/[\u4e00-\u9fff]/.test(line) && line.trim().length > 0) {
      return line.trim()
    }
  }

  // 如果没找到中文，返回最后一行
  return lines[lines.length - 1]?.trim() || text
}

// 处理双语字幕文本
function processBilingualText(text: string): {
  text: string
  englishText?: string
  chineseText?: string
} {
  const originalText = text.trim()

  // 检查是否包含双语内容（既有英文又有中文）
  const hasEnglish = /[a-zA-Z]/.test(originalText)
  const hasChinese = /[\u4e00-\u9fff]/.test(originalText)

  if (hasEnglish && hasChinese) {
    // 双语字幕
    const englishText = extractEnglishText(originalText)
    const chineseText = extractChineseText(originalText)

    return {
      text: englishText, // 优先显示英文
      englishText,
      chineseText
    }
  } else if (hasEnglish) {
    // 纯英文字幕
    return {
      text: originalText,
      englishText: originalText
    }
  } else if (hasChinese) {
    // 纯中文字幕
    return {
      text: originalText,
      chineseText: originalText
    }
  } else {
    // 其他语言或符号
    return {
      text: originalText
    }
  }
}

// 主要的字幕解析函数
export function parseSubtitles(content: string, filename: string): SubtitleItem[] {
  const ext = filename.toLowerCase().split('.').pop()

  switch (ext) {
    case 'srt':
      return parseSRT(content)
    case 'vtt':
      return parseVTT(content)
    case 'json':
      return parseJSON(content)
    default:
      // 尝试自动检测格式
      if (content.includes('WEBVTT')) {
        return parseVTT(content)
      } else if (content.includes('-->') && /\d{2}:\d{2}:\d{2}/.test(content)) {
        return parseSRT(content)
      } else {
        try {
          return parseJSON(content)
        } catch {
          throw new Error(`不支持的字幕格式: ${ext}`)
        }
      }
  }
}
