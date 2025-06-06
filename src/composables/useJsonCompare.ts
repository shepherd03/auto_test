import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  updateJsonStats,
  findJsonDifferences,
  exportComparisonResult,
  getTotalFields
} from '@/utils/jsonCompareUtils'
import { useJsonCompareRules } from './useJsonCompareRules'

/**
 * JSON比较器组合式函数
 * @param initialLeftJson 初始左侧JSON字符串
 * @param initialRightJson 初始右侧JSON字符串
 * @param leftTitle 左侧标题（可选）
 * @param rightTitle 右侧标题（可选）
 */
export function useJsonCompare({
  initialLeftJson = '',
  initialRightJson = '',
  leftTitle = 'JSON A',
  rightTitle = 'JSON B'
} = {}) {
  // 响应式状态
  const leftJson = ref<string>(initialLeftJson)
  const rightJson = ref<string>(initialRightJson)
  const comparisonResult = ref<boolean>(false)
  const activeTab = ref<string>('diff')
  const differences = ref<JsonDifference[]>([])
  const sidebarVisible = ref<boolean>(false)
  const diffFilter = ref<string>('all')
  const compareTime = ref<string>('')
  const leftJsonStats = ref<JsonStats>(defaultJsonStats())
  const rightJsonStats = ref<JsonStats>(defaultJsonStats())

  // 自定义规则状态
  const {
    customRules,
    appliedRulesText,
    activeRulesCount
  } = useJsonCompareRules()

  // 计算属性
  const canCompare = computed<boolean>(() => {
    return leftJson.value.trim() !== '' && rightJson.value.trim() !== ''
  })

  const addedCount = computed<number>(() => {
    return differences.value.filter(d => d.type === 'added').length
  })

  const removedCount = computed<number>(() => {
    return differences.value.filter(d => d.type === 'removed').length
  })

  const modifiedCount = computed<number>(() => {
    return differences.value.filter(d => d.type === 'modified').length
  })

  const filteredDifferences = computed<JsonDifference[]>(() => {
    if (diffFilter.value === 'all') {
      return differences.value
    }
    return differences.value.filter(d => d.type === diffFilter.value)
  })

  const compareResult = computed<JsonComparisonResult>(() => {
    return {
      similarity: similarity.value,
      totalDifferences: differences.value.length,
      addedCount: addedCount.value,
      removedCount: removedCount.value,
      modifiedCount: modifiedCount.value,
      compareTime: compareTime.value,
      appliedRules: appliedRulesText.value
    }
  })

  const similarity = computed<number>(() => {
    if (!comparisonResult.value) return 0
    const totalFields = Math.max(leftJsonStats.value.totalFields, rightJsonStats.value.totalFields)
    if (totalFields === 0) return 100
    const similarFields = totalFields - differences.value.length
    return Math.round((similarFields / totalFields) * 100)
  })

  // 方法
  function swapJsons(): void {
    const temp = leftJson.value
    leftJson.value = rightJson.value
    rightJson.value = temp

    // 更新统计信息
    leftJsonStats.value = updateJsonStats(leftJson.value)
    rightJsonStats.value = updateJsonStats(rightJson.value)

    ElMessage.success('JSON内容已交换')
  }

  function copyLeftToRight(): void {
    rightJson.value = leftJson.value
    rightJsonStats.value = { ...leftJsonStats.value }
    ElMessage.success('已复制JSON A到B')
  }

  function copyRightToLeft(): void {
    leftJson.value = rightJson.value
    leftJsonStats.value = { ...rightJsonStats.value }
    ElMessage.success('已复制JSON B到A')
  }

  function compareJson(): void {
    try {
      const startTime = Date.now()

      const leftParsed = JSON.parse(leftJson.value)
      const rightParsed = JSON.parse(rightJson.value)

      differences.value = findJsonDifferences(leftParsed, rightParsed, customRules.value)

      const endTime = Date.now()
      compareTime.value = `${endTime - startTime}ms`

      comparisonResult.value = true
      sidebarVisible.value = true

      ElMessage.success(
        differences.value.length === 0
          ? 'JSON完全相同'
          : `比较完成，发现${differences.value.length}处差异`
      )
    } catch (error) {
      ElMessage.error('JSON格式错误，请检查输入')
    }
  }

  function toggleSidebar(): void {
    sidebarVisible.value = !sidebarVisible.value
  }

  function exportResults(): void {
    if (!comparisonResult.value) {
      ElMessage.warning('请先进行比较')
      return
    }

    exportComparisonResult(
      leftJson.value,
      rightJson.value,
      differences.value,
      customRules.value,
      leftJsonStats.value,
      rightJsonStats.value,
      appliedRulesText.value
    )
  }

  // 设置JSON内容的方法（用于外部调用）
  function setJsonContent(content: string, side: 'left' | 'right'): void {
    if (side === 'left') {
      leftJson.value = content
      leftJsonStats.value = updateJsonStats(content)
    } else {
      rightJson.value = content
      rightJsonStats.value = updateJsonStats(content)
    }
  }

  return {
    // 状态
    leftJson,
    rightJson,
    leftTitle,
    rightTitle,
    comparisonResult,
    activeTab,
    differences,
    sidebarVisible,
    diffFilter,
    compareTime,
    leftJsonStats,
    rightJsonStats,
    customRules,
    appliedRulesText,
    activeRulesCount,

    // 计算属性
    canCompare,
    addedCount,
    removedCount,
    modifiedCount,
    filteredDifferences,
    compareResult,
    similarity,

    // 方法
    swapJsons,
    copyLeftToRight,
    copyRightToLeft,
    compareJson,
    toggleSidebar,
    exportResults,
    setJsonContent
  }
}