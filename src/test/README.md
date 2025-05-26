# EchoLab 测试套件

本目录包含 EchoLab 项目的测试文件，使用 Vitest 作为测试框架。

## 测试结构

### 测试文件

- **`eudicHtmlParser.test.ts`** - 欧陆词典HTML解析函数的单元测试
- **`dictionaryHandlers.test.ts`** - 词典处理器的集成测试（包含网络请求模拟）
- **`setup.ts`** - 测试环境设置文件

### 测试覆盖范围

#### 欧陆词典HTML解析器测试 (`eudicHtmlParser.test.ts`)

1. **完整HTML解析**

   - 解析包含音标、释义、例句、翻译的完整HTML
   - 正确解析带词性的释义
   - 处理复杂词性格式

2. **备用解析策略**

   - 使用列表选择器作为备用方案
   - 优先级处理（dict-content > 列表选择器）

3. **音标解析**

   - 正确解析音标
   - 处理没有音标的情况
   - 处理空音标

4. **例句解析**

   - 解析多个例句
   - 处理没有例句的情况

5. **翻译解析**

   - 解析多个翻译
   - 处理没有翻译的情况

6. **边界情况和错误处理**

   - 过滤空的释义、例句、翻译
   - 处理完全空的HTML
   - 处理无效HTML
   - 处理特殊字符
   - 处理嵌套HTML结构

7. **词性解析准确性**
   - 识别各种词性缩写（n., v., adj., adv., prep., conj., int., pron.等）
   - 处理没有词性的释义
   - 处理复杂词性格式（vt., vi., num.等）

## 运行测试

### 基本命令

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行测试（单次运行，不监听文件变化）
pnpm test:run

# 启动测试UI界面
pnpm test:ui
```

### 运行特定测试文件

```bash
# 只运行HTML解析器测试
pnpm test eudicHtmlParser.test.ts

# 只运行词典处理器测试
pnpm test dictionaryHandlers.test.ts
```

### 运行特定测试用例

```bash
# 运行包含特定描述的测试
pnpm test -t "应该解析包含所有元素的完整HTML"

# 运行特定describe块
pnpm test -t "完整HTML解析"
```

## 测试配置

### Vitest 配置 (`vitest.config.ts`)

- **环境**: jsdom（用于DOM操作）
- **全局变量**: 启用（可直接使用describe, it, expect等）
- **设置文件**: `./src/test/setup.ts`
- **覆盖率提供者**: v8
- **路径别名**: 支持 @main, @renderer, @preload

### 测试设置 (`setup.ts`)

- Mock Electron IPC
- Mock fetch API
- Mock console方法（减少测试输出噪音）
- 设置MSW服务器（用于API请求模拟）

## 测试最佳实践

### 1. 测试命名

- 使用中文描述测试用例，清晰表达测试意图
- 使用"应该"开头描述期望行为
- 按功能分组测试用例

### 2. 测试结构

```typescript
describe('功能模块名称', () => {
  describe('子功能或场景', () => {
    it('应该执行特定行为', () => {
      // 准备数据
      const input = '测试输入'

      // 执行操作
      const result = functionUnderTest(input)

      // 验证结果
      expect(result).toEqual(expectedOutput)
    })
  })
})
```

### 3. Mock 策略

- 对外部依赖进行Mock（网络请求、文件系统等）
- 保持Mock的简单性和可维护性
- 在每个测试前清理Mock状态

### 4. 测试数据

- 使用真实的HTML结构作为测试数据
- 覆盖各种边界情况
- 包含正常情况和异常情况

## 持续集成

测试可以集成到CI/CD流程中：

```bash
# 在CI环境中运行测试
pnpm test:run --coverage

# 检查测试覆盖率是否达到要求
# 可以在package.json中配置最低覆盖率要求
```

## 调试测试

### 1. 使用测试UI

```bash
pnpm test:ui
```

启动可视化测试界面，可以：

- 查看测试结果
- 调试失败的测试
- 查看覆盖率报告

### 2. 单独运行失败的测试

```bash
# 只运行失败的测试
pnpm test --reporter=verbose --run

# 使用调试模式
pnpm test --inspect-brk
```

### 3. 查看详细输出

```bash
# 显示详细的测试输出
pnpm test --reporter=verbose
```

## 扩展测试

### 添加新的测试文件

1. 在 `src/test/` 目录下创建 `.test.ts` 文件
2. 导入必要的测试工具和被测试的模块
3. 编写测试用例
4. 运行测试确保通过

### 测试覆盖率目标

- **行覆盖率**: > 80%
- **函数覆盖率**: > 90%
- **分支覆盖率**: > 75%

## 常见问题

### Q: 测试运行缓慢怎么办？

A:

- 检查是否有不必要的异步操作
- 优化Mock设置
- 使用 `--run` 参数避免监听模式

### Q: Mock不生效怎么办？

A:

- 确保Mock在导入被测试模块之前设置
- 检查Mock的路径是否正确
- 使用 `vi.clearAllMocks()` 清理Mock状态

### Q: 如何测试异步函数？

A:

```typescript
it('应该处理异步操作', async () => {
  const result = await asyncFunction()
  expect(result).toBe(expectedValue)
})
```

### Q: 如何测试错误情况？

A:

```typescript
it('应该抛出错误', () => {
  expect(() => {
    functionThatThrows()
  }).toThrow('错误信息')
})
```
