import { describe, it, expect } from 'vitest'
import * as cheerio from 'cheerio'

// 从dictionaryHandlers.ts中提取的HTML解析函数
function parseEudicHtml(
  html: string,
  word: string
): {
  word: string
  phonetic?: string
  definitions: Array<{
    partOfSpeech?: string
    meaning: string
    examples?: string[]
  }>
  examples?: string[]
  translations?: string[]
} {
  try {
    const $ = cheerio.load(html)

    // 解析音标
    let phonetic = ''
    const phoneticElement = $('.phonetic')
    if (phoneticElement.length > 0) {
      phonetic = phoneticElement.text().trim()
    }

    // 解析词性和释义
    const definitions: Array<{
      partOfSpeech?: string
      meaning: string
      examples?: string[]
    }> = []

    // 查找英汉-汉英词典部分
    $('.dict-content').each((_, element) => {
      const $element = $(element)

      // 解析基本释义
      $element.find('.explain').each((_, explainElement) => {
        const $explain = $(explainElement)
        const meaning = $explain.text().trim()
        if (meaning) {
          // 尝试提取词性
          const partOfSpeechMatch = meaning.match(/^(\w+\.)\s*(.+)/)
          if (partOfSpeechMatch) {
            definitions.push({
              partOfSpeech: partOfSpeechMatch[1],
              meaning: partOfSpeechMatch[2]
            })
          } else {
            definitions.push({
              meaning: meaning
            })
          }
        }
      })
    })

    // 如果没有找到释义，尝试其他选择器
    if (definitions.length === 0) {
      // 尝试解析列表形式的释义
      $('ol li, ul li').each((_, element) => {
        const $element = $(element)
        const meaning = $element.text().trim()
        if (meaning && meaning.length > 0) {
          definitions.push({
            meaning: meaning
          })
        }
      })
    }

    // 解析例句
    const examples: string[] = []
    $('.example, .sentence').each((_, element) => {
      const $element = $(element)
      const example = $element.text().trim()
      if (example) {
        examples.push(example)
      }
    })

    // 解析翻译结果
    const translations: string[] = []
    $('.translation').each((_, element) => {
      const $element = $(element)
      const translation = $element.text().trim()
      if (translation) {
        translations.push(translation)
      }
    })

    return {
      word,
      phonetic: phonetic || undefined,
      definitions,
      examples: examples.length > 0 ? examples : undefined,
      translations: translations.length > 0 ? translations : undefined
    }
  } catch (error) {
    console.error('HTML解析失败:', error)
    throw new Error('HTML解析失败')
  }
}

// 真实API请求函数
async function fetchEudicData(
  word: string,
  context?: string
): Promise<{
  html: string
  parsedData: {
    word: string
    phonetic?: string
    definitions: Array<{
      partOfSpeech?: string
      meaning: string
      examples?: string[]
    }>
    examples?: string[]
    translations?: string[]
  }
}> {
  const baseUrl = 'https://dict.eudic.net/dicts/MiniDictSearch2'
  const params = new URLSearchParams({
    word: word,
    context: context || word
  })
  const url = `${baseUrl}?${params.toString()}`

  console.log('正在请求欧陆词典:', url)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    return { html, parsedData: parseEudicHtml(html, word) }
  } catch (error) {
    console.error('请求失败:', error)
    throw error
  }
}

describe('欧陆词典真实API测试', () => {
  describe('HTML解析功能测试', () => {
    it('应该能够解析模拟的HTML响应', () => {
      // 模拟欧陆词典返回的HTML结构
      const mockHtml = `
        <html>
          <body>
            <div class="dict-content">
              <div class="phonetic">[həˈloʊ]</div>
              <div class="explain">int. 你好；喂</div>
              <div class="explain">n. 表示问候的话</div>
              <div class="explain">vi. 喊叫</div>
            </div>
            <div class="example">Hello, how are you?</div>
            <div class="translation">你好，你好吗？</div>
          </body>
        </html>
      `

      const result = parseEudicHtml(mockHtml, 'hello')

      expect(result.word).toBe('hello')
      expect(result.phonetic).toBe('[həˈloʊ]')
      expect(result.definitions).toHaveLength(3)
      expect(result.definitions[0].partOfSpeech).toBe('int.')
      expect(result.definitions[0].meaning).toBe('你好；喂')
      expect(result.definitions[1].partOfSpeech).toBe('n.')
      expect(result.definitions[1].meaning).toBe('表示问候的话')
      expect(result.definitions[2].partOfSpeech).toBe('vi.')
      expect(result.definitions[2].meaning).toBe('喊叫')
      expect(result.examples).toEqual(['Hello, how are you?'])
      expect(result.translations).toEqual(['你好，你好吗？'])
    })

    it('应该能够处理没有音标的情况', () => {
      const mockHtml = `
        <html>
          <body>
            <div class="dict-content">
              <div class="explain">n. 计算机</div>
            </div>
          </body>
        </html>
      `

      const result = parseEudicHtml(mockHtml, 'computer')

      expect(result.word).toBe('computer')
      expect(result.phonetic).toBeUndefined()
      expect(result.definitions).toHaveLength(1)
      expect(result.definitions[0].meaning).toBe('计算机')
    })

    it('应该能够处理列表形式的释义', () => {
      const mockHtml = `
        <html>
          <body>
            <ol>
              <li>跑步</li>
              <li>运行</li>
              <li>经营</li>
            </ol>
          </body>
        </html>
      `

      const result = parseEudicHtml(mockHtml, 'run')

      expect(result.word).toBe('run')
      expect(result.definitions).toHaveLength(3)
      expect(result.definitions[0].meaning).toBe('跑步')
      expect(result.definitions[1].meaning).toBe('运行')
      expect(result.definitions[2].meaning).toBe('经营')
    })

    it('应该能够处理空HTML', () => {
      const mockHtml = '<html><body></body></html>'

      const result = parseEudicHtml(mockHtml, 'empty')

      expect(result.word).toBe('empty')
      expect(result.phonetic).toBeUndefined()
      expect(result.definitions).toHaveLength(0)
      expect(result.examples).toBeUndefined()
      expect(result.translations).toBeUndefined()
    })
  })

  describe('URL构建测试', () => {
    it('应该正确构建查询URL', () => {
      const baseUrl = 'https://dict.eudic.net/dicts/MiniDictSearch2'
      const word = 'hello'
      const params = new URLSearchParams({
        word: word,
        context: word
      })
      const expectedUrl = `${baseUrl}?${params.toString()}`

      expect(expectedUrl).toBe(
        'https://dict.eudic.net/dicts/MiniDictSearch2?word=hello&context=hello'
      )
    })

    it('应该正确处理特殊字符', () => {
      const baseUrl = 'https://dict.eudic.net/dicts/MiniDictSearch2'
      const word = "can't"
      const params = new URLSearchParams({
        word: word,
        context: word
      })
      const expectedUrl = `${baseUrl}?${params.toString()}`

      expect(expectedUrl).toContain('can%27t')
    })
  })

  // 注释掉真实网络请求测试，避免在CI环境中失败
  describe.skip('真实网络请求测试 (手动运行)', () => {
    it('应该能够查询简单英文单词 "hello"', async () => {
      const word = 'hello'
      const result = await fetchEudicData(word)

      console.log('查询结果:', JSON.stringify(result.parsedData, null, 2))

      // 验证基本结构
      expect(result.parsedData.word).toBe(word)
      expect(result.parsedData.definitions).toBeDefined()
      expect(Array.isArray(result.parsedData.definitions)).toBe(true)

      // 验证至少有一个释义
      expect(result.parsedData.definitions.length).toBeGreaterThan(0)

      // 验证释义结构
      result.parsedData.definitions.forEach((def) => {
        expect(def.meaning).toBeDefined()
        expect(typeof def.meaning).toBe('string')
        expect(def.meaning.length).toBeGreaterThan(0)
      })
    }, 30000)

    it('应该分析返回的HTML结构以改进解析器', async () => {
      const word = 'example'
      const result = await fetchEudicData(word)

      console.log('HTML长度:', result.html.length)
      console.log('HTML前500字符:', result.html.substring(0, 500))

      // 使用cheerio分析HTML结构
      const $ = cheerio.load(result.html)

      // 分析可能的选择器
      const selectors = [
        '.phonetic',
        '.dict-content',
        '.explain',
        '.example',
        '.sentence',
        '.translation',
        'ol li',
        'ul li',
        '.word-info',
        '.definition',
        '.meaning',
        '.pronunciation'
      ]

      console.log('HTML结构分析:')
      selectors.forEach((selector) => {
        const elements = $(selector)
        if (elements.length > 0) {
          console.log(`${selector}: 找到 ${elements.length} 个元素`)
          elements.each((i, el) => {
            if (i < 3) {
              // 只显示前3个元素的内容
              console.log(`  ${i + 1}: ${$(el).text().trim().substring(0, 100)}`)
            }
          })
        }
      })

      // 验证解析结果
      expect(result.parsedData.word).toBe(word)
      expect(Array.isArray(result.parsedData.definitions)).toBe(true)
    }, 30000)
  })
})

// 导出函数以供其他测试使用
export { parseEudicHtml, fetchEudicData }
