import { ElMessage } from 'element-plus'

// 工具函数

/**
 * 更新JSON统计信息
 * @param jsonString JSON字符串
 * @returns 统计信息
 */
export function updateJsonStats(jsonString: string): JsonStats {
  const lines = jsonString.split('\n').length
  const size = formatFileSize(new Blob([jsonString]).size)
  const totalFields = getTotalFields(JSON.parse(jsonString))
  return { lines, size, totalFields }
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化JSON字符串
 * @param jsonString 原始JSON字符串
 * @returns 格式化后的JSON字符串
 */
export function formatJsonString(jsonString: string): string {
  const parsed = JSON.parse(jsonString)
  return JSON.stringify(parsed, null, 2)
}

/**
 * 处理JSON文件上传
 * @param file 上传的文件
 * @returns Promise<string> 文件内容
 */
export function handleJsonFileUpload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      ElMessage.error('请上传JSON格式的文件')
      reject(new Error('文件格式不正确'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        // 验证JSON格式
        JSON.parse(content)
        resolve(content)
      } catch (error) {
        ElMessage.error('文件内容不是有效的JSON格式')
        reject(error)
      }
    }
    reader.onerror = () => {
      ElMessage.error('文件读取失败')
      reject(new Error('文件读取失败'))
    }
    reader.readAsText(file)
  })
}

/**
 * 格式化显示值
 * @param value 要格式化的值
 * @returns 格式化后的字符串
 */
export function formatDisplayValue(value: any): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

/**
 * 计算对象的总字段数
 * @param obj 要计算的对象
 * @returns 字段总数
 */
export function getTotalFields(obj: any): number {
  if (typeof obj !== 'object' || obj === null) return 1

  if (Array.isArray(obj)) {
    return obj.reduce((count, item) => count + getTotalFields(item), 0)
  }

  return Object.keys(obj).reduce(
    (count, key) => count + getTotalFields(obj[key]),
    Object.keys(obj).length
  )
}

/**
 * 检查路径是否应该被忽略
 * @param path 路径字符串
 * @param rules 比较规则
 * @returns 是否应该忽略
 */
function shouldIgnorePath(path: string, rules: JsonCompareRulesContent): boolean {
  // 检查忽略的键名
  if (rules.rules.ignoreKeys.length > 0) {
    const pathParts = path.split(/[.\[\]]/).filter(p => p !== '')
    for (const ignoredKey of rules.rules.ignoreKeys) {
      if (pathParts.includes(ignoredKey)) {
        return true
      }
    }
  }

  // 检查自定义忽略模式
  if (rules.rules.customIgnorePatterns.length > 0) {
    for (const pattern of rules.rules.customIgnorePatterns) {
      try {
        const regex = new RegExp(pattern)
        if (regex.test(path)) {
          return true
        }
      } catch (e) {
        // 忽略无效的正则表达式
      }
    }
  }

  return false
}

/**
 * 标准化值以应用规则
 * @param value 原始值
 * @param rules 比较规则
 * @returns 标准化后的值
 */
function normalizeValue(value: any, rules: JsonCompareRulesContent): any {
  if (value === null && rules.rules.ignoreNullUndefined) {
    return undefined
  }
  if (value === undefined && rules.rules.ignoreNullUndefined) {
    return null
  }
  if (typeof value === 'string') {
    let normalized = value
    if (rules.rules.ignoreWhitespace) {
      normalized = normalized.trim()
    }
    if (rules.rules.ignoreCase) {
      normalized = normalized.toLowerCase()
    }
    return normalized
  }
  return value
}

/**
 * 比较两个值是否相等（考虑自定义规则）
 * @param val1 值1
 * @param val2 值2
 * @param rules 比较规则
 * @returns 是否相等
 */
function valuesEqual(val1: any, val2: any, rules: JsonCompareRulesContent): boolean {
  const norm1 = normalizeValue(val1, rules)
  const norm2 = normalizeValue(val2, rules)

  // 类型强制转换
  if (rules.rules.typeCoercion) {
    // eslint-disable-next-line eqeqeq
    return norm1 == norm2
  }

  // null/undefined 等价处理
  if (rules.rules.ignoreNullUndefined) {
    if ((norm1 === null || norm1 === undefined) && (norm2 === null || norm2 === undefined)) {
      return true
    }
  }

  return JSON.stringify(norm1) === JSON.stringify(norm2)
}

/**
 * 比较数组（考虑顺序忽略）
 * @param arr1 数组1
 * @param arr2 数组2
 * @param path 当前路径
 * @param rules 比较规则
 * @returns 差异列表
 */
function compareArrays(
  arr1: any[],
  arr2: any[],
  path: string,
  rules: JsonCompareRulesContent
): JsonDifference[] {
  const diffs: JsonDifference[] = []

  if (rules.rules.ignoreArrayOrder) {
    // 忽略顺序的数组比较
    const arr1Copy = [...arr1]
    const arr2Copy = [...arr2]
    const matched = new Set<number>()

    // 找到匹配的元素
    for (let i = 0; i < arr1Copy.length; i++) {
      for (let j = 0; j < arr2Copy.length; j++) {
        if (!matched.has(j) && valuesEqual(arr1Copy[i], arr2Copy[j], rules)) {
          matched.add(j)
          break
        }
      }
    }

    // 检查未匹配的元素
    for (let i = 0; i < arr2Copy.length; i++) {
      if (!matched.has(i)) {
        diffs.push({
          path: `${path}[${i}]`,
          left: undefined,
          right: arr2Copy[i],
          type: 'added'
        })
      }
    }

    // 检查arr1中多余的元素
    let matchedCount = 0
    for (let i = 0; i < arr1Copy.length; i++) {
      let found = false
      for (let j = matchedCount; j < arr2Copy.length; j++) {
        if (matched.has(j) && valuesEqual(arr1Copy[i], arr2Copy[j], rules)) {
          found = true
          matchedCount++
          break
        }
      }
      if (!found) {
        diffs.push({
          path: `${path}[${i}]`,
          left: arr1Copy[i],
          right: undefined,
          type: 'removed'
        })
      }
    }
  } else {
    // 按顺序比较数组
    const maxLength = Math.max(arr1.length, arr2.length)
    for (let i = 0; i < maxLength; i++) {
      const currentPath = `${path}[${i}]`

      if (shouldIgnorePath(currentPath, rules)) continue

      if (i >= arr1.length) {
        diffs.push({
          path: currentPath,
          left: undefined,
          right: arr2[i],
          type: 'added'
        })
      } else if (i >= arr2.length) {
        diffs.push({
          path: currentPath,
          left: arr1[i],
          right: undefined,
          type: 'removed'
        })
      } else if (typeof arr1[i] === 'object' && arr1[i] !== null &&
        typeof arr2[i] === 'object' && arr2[i] !== null) {
        diffs.push(...findDifferences(arr1[i], arr2[i], currentPath, rules))
      } else if (!valuesEqual(arr1[i], arr2[i], rules)) {
        diffs.push({
          path: currentPath,
          left: arr1[i],
          right: arr2[i],
          type: 'modified'
        })
      }
    }
  }

  return diffs
}

/**
 * 比较两个对象并找出差异
 * @param obj1 对象1
 * @param obj2 对象2
 * @param path 当前路径
 * @param rules 比较规则
 * @returns 差异列表
 */
function findDifferences(
  obj1: any,
  obj2: any,
  path: string = '',
  rules: JsonCompareRulesContent
): JsonDifference[] {
  const diffs: JsonDifference[] = []

  // 处理数组
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    return compareArrays(obj1, obj2, path, rules)
  }

  // 处理对象
  if (typeof obj1 === 'object' && typeof obj2 === 'object' &&
    obj1 !== null && obj2 !== null) {
    // 获取所有唯一键
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)])

    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key

      // 检查是否应该忽略此路径
      if (shouldIgnorePath(currentPath, rules)) continue

      if (!(key in obj1)) {
        diffs.push({
          path: currentPath,
          left: undefined,
          right: obj2[key],
          type: 'added'
        })
      } else if (!(key in obj2)) {
        diffs.push({
          path: currentPath,
          left: obj1[key],
          right: undefined,
          type: 'removed'
        })
      } else if (typeof obj1[key] === 'object' && obj1[key] !== null &&
        typeof obj2[key] === 'object' && obj2[key] !== null) {
        diffs.push(...findDifferences(obj1[key], obj2[key], currentPath, rules))
      } else if (!valuesEqual(obj1[key], obj2[key], rules)) {
        diffs.push({
          path: currentPath,
          left: obj1[key],
          right: obj2[key],
          type: 'modified'
        })
      }
    }
    return diffs
  }

  // 处理基本类型
  if (!valuesEqual(obj1, obj2, rules)) {
    diffs.push({
      path: path || 'root',
      left: obj1,
      right: obj2,
      type: 'modified'
    })
  }

  return diffs
}

/**
 * 查找JSON差异的主函数
 * @param obj1 对象1
 * @param obj2 对象2
 * @param rules 比较规则
 * @returns 差异列表
 */
export function findJsonDifferences(
  obj1: any,
  obj2: any,
  rules: JsonCompareRulesContent
): JsonDifference[] {
  return findDifferences(obj1, obj2, '', rules)
}

/**
 * 导出比较结果
 * @param leftJson 左侧JSON字符串
 * @param rightJson 右侧JSON字符串
 * @param differences 差异列表
 * @param rules 应用的规则
 * @param leftStats 左侧统计信息
 * @param rightStats 右侧统计信息
 * @param appliedRules 应用的规则描述
 */
export function exportComparisonResult(
  leftJson: string,
  rightJson: string,
  differences: JsonDifference[],
  rules: JsonCompareRulesContent,
  leftStats: JsonStats,
  rightStats: JsonStats,
  appliedRules: string[]
): void {
  try {
    const addedCount = differences.filter(d => d.type === 'added').length
    const removedCount = differences.filter(d => d.type === 'removed').length
    const modifiedCount = differences.filter(d => d.type === 'modified').length

    const leftTotalFields = getTotalFields(JSON.parse(leftJson))
    const rightTotalFields = getTotalFields(JSON.parse(rightJson))
    const totalFields = Math.max(leftTotalFields, rightTotalFields)
    const similarity = totalFields === 0 ? 100 : Math.round(((totalFields - differences.length) / totalFields) * 100)

    const result = {
      exportTime: new Date().toISOString(),
      summary: {
        totalDifferences: differences.length,
        added: addedCount,
        removed: removedCount,
        modified: modifiedCount,
        similarity: `${similarity}%`
      },
      appliedRules: appliedRules.length > 0 ? appliedRules : ['无自定义规则'],
      customRulesConfig: { ...rules },
      differences: differences,
      jsonStats: {
        jsonA: leftStats,
        jsonB: rightStats
      },
      metadata: {
        leftTotalFields,
        rightTotalFields,
        exportVersion: '1.0.0'
      }
    }

    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `json-compare-result-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    ElMessage.success('比较结果已导出')
  } catch (error) {
    ElMessage.error('导出失败: ' + (error as Error).message)
  }
}