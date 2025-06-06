import { exportToExcel } from '@/utils/exportUtils'

/**
 * 测试结果工具组合式API
 * 提供测试结果相关的工具函数
 */
export function useTestResultUtils() {
  /**
   * 格式化输出结果
   * @param output 输出结果
   * @returns 格式化后的字符串
   */
  const formatOutput = (output: any): string => {
    if (output === null || output === undefined) return ''

    try {
      // 如果已经是字符串，直接返回
      if (typeof output === 'string') return output

      // 如果是对象或数组，格式化为JSON字符串
      return JSON.stringify(output, null, 2)
    } catch (error) {
      console.error('格式化输出错误:', error)
      return String(output)
    }
  }

  /**
   * 获取服务标签类型
   * @param service 服务名称
   * @returns Element Plus标签类型
   */
  const getServiceTagType = (service: ServiceName): string => {
    const typeMap: Record<string, string> = {
      'Direct': 'success',
      'NLU': 'primary',
      'Query': 'warning',
      'Rectify': 'danger',
      'TestRectify': 'info'
    }

    return typeMap[service] || ''
  }

  /**
   * 导出测试结果
   * @param data 要导出的数据
   * @param fileName 文件名（不含扩展名）
   * @returns Promise<void>
   */
  const exportResults = async (data: Record<string, any>[], fileName: string = '测试结果'): Promise<void> => {
    return exportToExcel(data, fileName)
  }

  /**
   * 生成测试结果ID
   * @returns 唯一ID
   */
  const generateResultId = (): string => {
    return `result_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  }

  return {
    formatOutput,
    getServiceTagType,
    exportResults,
    generateResultId
  }
}