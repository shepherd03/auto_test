import * as XLSX from 'xlsx'

/**
 * 将数据导出为Excel文件
 * @param data 要导出的数据数组
 * @param fileName 文件名（不含扩展名）
 * @returns Promise<void>
 */
export async function exportToExcel(data: Record<string, any>[], fileName: string = 'export'): Promise<void> {
  if (!data || data.length === 0) {
    throw new Error('导出数据不能为空')
  }

  try {
    // 创建工作簿
    const workbook = XLSX.utils.book_new()

    // 将数据转换为工作表
    const worksheet = XLSX.utils.json_to_sheet(data)

    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '测试结果')

    // 导出文件
    XLSX.writeFile(workbook, `${fileName}.xlsx`)

    return Promise.resolve()
  } catch (error) {
    console.error('导出Excel失败:', error)
    return Promise.reject(error)
  }
}