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

describe('欧陆词典HTML解析器', () => {
  describe('完整HTML解析', () => {
    it('应该解析包含所有元素的完整HTML', () => {
      const html = `
        <html>
          <body>
            <div class="phonetic">/həˈloʊ/</div>
            <div class="dict-content">
              <div class="explain">n. 问候，招呼</div>
              <div class="explain">int. 你好！喂！</div>
            </div>
            <div class="example">Hello, how are you?</div>
            <div class="example">你好，你好吗？</div>
            <div class="translation">你好</div>
            <div class="translation">问候</div>
          </body>
        </html>
      `

      const result = parseEudicHtml(html, 'hello')

      expect(result).toEqual({
        word: 'hello',
        phonetic: '/həˈloʊ/',
        definitions: [
          { partOfSpeech: 'n.', meaning: '问候，招呼' },
          { partOfSpeech: 'int.', meaning: '你好！喂！' }
        ],
        examples: ['Hello, how are you?', '你好，你好吗？'],
        translations: ['你好', '问候']
      })
    })

    it('应该正确解析带词性的释义', () => {
      const html = `
        <html>
          <body>
            <div class="dict-content">
              <div class="explain">v. 运行，跑步</div>
              <div class="explain">n. 跑步，运行</div>
              <div class="explain">adj. 流动的</div>
            </div>
          </body>
        </html>
      `

      const result = parseEudicHtml(html, 'run')

      expect(result.definitions).toEqual([
        { partOfSpeech: 'v.', meaning: '运行，跑步' },
        { partOfSpeech: 'n.', meaning: '跑步，运行' },
        { partOfSpeech: 'adj.', meaning: '流动的' }
      ])
    })

    it('应该处理复杂词性格式', () => {
      const html = `
        <html>
          <body>
            <div class="dict-content">
              <div class="explain">vt. 及物动词释义</div>
              <div class="explain">vi. 不及物动词释义</div>
              <div class="explain">prep. 介词释义</div>
              <div class="explain">conj. 连词释义</div>
            </div>
          </body>
        </html>
      `

      const result = parseEudicHtml(html, 'complex')

      expect(result.definitions).toEqual([
        { partOfSpeech: 'vt.', meaning: '及物动词释义' },
        { partOfSpeech: 'vi.', meaning: '不及物动词释义' },
        { partOfSpeech: 'prep.', meaning: '介词释义' },
        { partOfSpeech: 'conj.', meaning: '连词释义' }
      ])
    })
  })

  describe('备用解析策略', () => {
    it('应该使用列表选择器作为备用解析方案', () => {
      const html = `
        <html>
          <body>
            <ol>
              <li>第一个释义</li>
              <li>第二个释义</li>
            </ol>
            <ul>
              <li>第三个释义</li>
              <li>第四个释义</li>
            </ul>
          </body>
        </html>
      `

      const result = parseEudicHtml(html, 'test')

      expect(result.definitions).toEqual([
        { meaning: '第一个释义' },
        { meaning: '第二个释义' },
        { meaning: '第三个释义' },
        { meaning: '第四个释义' }
      ])
    })

    it('应该优先使用dict-content，备用列表选择器', () => {
      const html = `
        <html>
          <body>
            <div class="dict-content">
              <div class="explain">主要释义</div>
            </div>
            <ol>
              <li>备用释义1</li>
              <li>备用释义2</li>
            </ol>
          </body>
        </html>
      `

      const result = parseEudicHtml(html, 'test')

      expect(result.definitions).toEqual([{ meaning: '主要释义' }])
    })
  })

  describe('音标解析', () => {
    it('应该正确解析音标', () => {
      const html = `
        <html>
          <body>
            <div class="phonetic">/ˈwɜːrd/</div>
          </body>
        </html>
      `

      const result = parseEudicHtml(html, 'word')

      expect(result.phonetic).toBe('/ˈwɜːrd/')
    })

    it('应该处理没有音标的情况', () => {
      const html = `
        <html>
          <body>
            <div class="dict-content">
              <div class="explain">测试释义</div>
            </div>
          </body>
        </html>
      `

      const result = parseEudicHtml(html, 'test')

      expect(result.phonetic).toBeUndefined()
    })

    it('应该处理空音标', () => {
      const html = `
        <html>
          <body>
            <div class="phonetic">   </div>
          </body>
        </html>
      `

      const result = parseEudicHtml(html, 'test')

      expect(result.phonetic).toBeUndefined()
    })
  })

  describe('例句解析', () => {
    it('应该解析多个例句', () => {
      const html = `
        <html>
          <body>
            <div class="example">This is an example.</div>
            <div class="sentence">This is a sentence.</div>
            <div class="example">Another example here.</div>
          </body>
        </html>
      `

      const result = parseEudicHtml(html, 'test')

      expect(result.examples).toEqual([
        'This is an example.',
        'This is a sentence.',
        'Another example here.'
      ])
    })

    it('应该处理没有例句的情况', () => {
      const html = `
        <html>
          <body>
            <div class="dict-content">
              <div class="explain">测试释义</div>
            </div>
          </body>
        </html>
      `

      const result = parseEudicHtml(html, 'test')

      expect(result.examples).toBeUndefined()
    })
  })

  describe('翻译解析', () => {
    it('应该解析多个翻译', () => {
      const html = `
        <html>
          <body>
            <div class="translation">翻译1</div>
            <div class="translation">翻译2</div>
            <div class="translation">翻译3</div>
          </body>
        </html>
      `

      const result = parseEudicHtml(html, 'test')

      expect(result.translations).toEqual(['翻译1', '翻译2', '翻译3'])
    })

    it('应该处理没有翻译的情况', () => {
      const html = `
        <html>
          <body>
            <div class="dict-content">
              <div class="explain">测试释义</div>
            </div>
          </body>
        </html>
      `

      const result = parseEudicHtml(html, 'test')

      expect(result.translations).toBeUndefined()
    })
  })

  describe('边界情况和错误处理', () => {
    it('应该过滤空的释义', () => {
      const html = `
        <html>
          <body>
            <div class="dict-content">
              <div class="explain"></div>
              <div class="explain">   </div>
              <div class="explain">有效释义</div>
              <div class="explain"></div>
            </div>
          </body>
        </html>
      `

      const result = parseEudicHtml(html, 'test')

      expect(result.definitions).toEqual([{ meaning: '有效释义' }])
    })

    it('应该过滤空的例句和翻译', () => {
      const html = `
        <html>
          <body>
            <div class="example"></div>
            <div class="example">有效例句</div>
            <div class="example">   </div>
            <div class="translation"></div>
            <div class="translation">有效翻译</div>
            <div class="translation">   </div>
          </body>
        </html>
      `

      const result = parseEudicHtml(html, 'test')

      expect(result.examples).toEqual(['有效例句'])
      expect(result.translations).toEqual(['有效翻译'])
    })

    it('应该处理完全空的HTML', () => {
      const html = '<html><body></body></html>'

      const result = parseEudicHtml(html, 'test')

      expect(result).toEqual({
        word: 'test',
        phonetic: undefined,
        definitions: [],
        examples: undefined,
        translations: undefined
      })
    })

    it('应该处理无效HTML', () => {
      const html = '<invalid-html>'

      // cheerio 能够处理无效HTML，所以不会抛出错误
      const result = parseEudicHtml(html, 'test')

      expect(result.word).toBe('test')
      expect(result.definitions).toEqual([])
    })

    it('应该处理特殊字符', () => {
      const html = `
        <html>
          <body>
            <div class="phonetic">/kæˈfeɪ/</div>
            <div class="dict-content">
              <div class="explain">n. 咖啡馆</div>
            </div>
            <div class="example">I love café au lait.</div>
          </body>
        </html>
      `

      const result = parseEudicHtml(html, 'café')

      expect(result.word).toBe('café')
      expect(result.phonetic).toBe('/kæˈfeɪ/')
      expect(result.definitions).toEqual([{ partOfSpeech: 'n.', meaning: '咖啡馆' }])
      expect(result.examples).toEqual(['I love café au lait.'])
    })

    it('应该处理嵌套HTML结构', () => {
      const html = `
        <html>
          <body>
            <div class="dict-content">
              <div class="section">
                <div class="explain">n. 嵌套释义</div>
                <div class="sub-section">
                  <div class="explain">adj. 另一个释义</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `

      const result = parseEudicHtml(html, 'nested')

      expect(result.definitions).toEqual([
        { partOfSpeech: 'n.', meaning: '嵌套释义' },
        { partOfSpeech: 'adj.', meaning: '另一个释义' }
      ])
    })
  })

  describe('词性解析准确性', () => {
    it('应该正确识别各种词性缩写', () => {
      const testCases = [
        { input: 'n. 名词', expected: { partOfSpeech: 'n.', meaning: '名词' } },
        { input: 'v. 动词', expected: { partOfSpeech: 'v.', meaning: '动词' } },
        { input: 'adj. 形容词', expected: { partOfSpeech: 'adj.', meaning: '形容词' } },
        { input: 'adv. 副词', expected: { partOfSpeech: 'adv.', meaning: '副词' } },
        { input: 'prep. 介词', expected: { partOfSpeech: 'prep.', meaning: '介词' } },
        { input: 'conj. 连词', expected: { partOfSpeech: 'conj.', meaning: '连词' } },
        { input: 'int. 感叹词', expected: { partOfSpeech: 'int.', meaning: '感叹词' } },
        { input: 'pron. 代词', expected: { partOfSpeech: 'pron.', meaning: '代词' } }
      ]

      testCases.forEach(({ input, expected }) => {
        const html = `
          <html>
            <body>
              <div class="dict-content">
                <div class="explain">${input}</div>
              </div>
            </body>
          </html>
        `

        const result = parseEudicHtml(html, 'test')
        expect(result.definitions[0]).toEqual(expected)
      })
    })

    it('应该处理没有词性的释义', () => {
      const html = `
        <html>
          <body>
            <div class="dict-content">
              <div class="explain">直接释义，没有词性</div>
            </div>
          </body>
        </html>
      `

      const result = parseEudicHtml(html, 'test')

      expect(result.definitions).toEqual([{ meaning: '直接释义，没有词性' }])
    })

    it('应该处理复杂的词性格式', () => {
      const html = `
        <html>
          <body>
            <div class="dict-content">
              <div class="explain">vt. 及物动词释义</div>
              <div class="explain">vi. 不及物动词释义</div>
              <div class="explain">num. 数词释义</div>
            </div>
          </body>
        </html>
      `

      const result = parseEudicHtml(html, 'test')

      expect(result.definitions).toEqual([
        { partOfSpeech: 'vt.', meaning: '及物动词释义' },
        { partOfSpeech: 'vi.', meaning: '不及物动词释义' },
        { partOfSpeech: 'num.', meaning: '数词释义' }
      ])
    })
  })
})
