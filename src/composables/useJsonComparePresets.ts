import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  useJsonComparePresetsApi,
  saveJsonComparePresetApi,
  deleteJsonComparePresetApi,
  updateJsonComparePresetApi
} from '@/api/jsonCompare'

/**
 * JSON比较器预设管理组合式函数
 */
export function useJsonComparePresets() {
  const selectedPreset = ref<string>('')
  const availablePresets = ref<Record<string, JsonCompareRulesContent>>({})

  /**
   * 加载所有可用的预设
   */
  async function loadAvailablePresets(): Promise<void> {
    try {
      const response = await useJsonComparePresetsApi()

      // 检查数据格式
      if (response.data && typeof response.data === 'object') {
        // 确保数据是对象格式，且键是字符串，值是规则对象
        const validData: Record<string, JsonCompareRulesContent> = {}

        Object.entries(response.data).forEach(([key, value]) => {
          if (value && typeof value === 'object') {
            validData[value.name] = value
          } else {
            console.warn(`预设 "${key}" 的数据格式无效:`, value)
          }
        })

        availablePresets.value = validData
      } else {
        console.warn('预设数据格式无效:', response.data)
        availablePresets.value = {}
      }
    } catch (error) {
      console.warn('加载预设失败:', error)
      availablePresets.value = {}
    }
  }

  /**
   * 保存当前规则为预设
   * @param rules 要保存的规则
   */
  async function saveRulesPreset(rules: JsonCompareRules): Promise<void> {
    try {
      const { value } = await ElMessageBox.prompt('请输入预设名称', '保存规则预设', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
      if (value) {
        try {
          const result = await saveJsonComparePresetApi(value, rules)
          if (result.code === 0) {
            ElMessage.success(`规则预设 "${value}" 已保存`)
            await loadAvailablePresets() // 重新加载预设列表
          } else {
            ElMessage.error(result.msg || '保存预设失败')
          }
        } catch (error) {
          ElMessage.error('保存预设失败：' + (error as Error).message)
        }
      }
    } catch (error) {
      // 取消或其他错误
      if (error !== 'cancel') {
        ElMessage.error('保存预设失败')
      }
    }
  }

  /**
   * 删除预设
   * @param name 预设名称
   */
  async function deletePreset(name: string): Promise<void> {
    try {
      const confirmed = await ElMessageBox.confirm(
        `确定要删除预设 "${name}" 吗？`,
        '删除预设',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      if (confirmed) {
        const result = await deleteJsonComparePresetApi(name)
        if (result.code === 0) {
          ElMessage.success(`预设 "${name}" 已删除`)
          await loadAvailablePresets() // 重新加载预设列表
          if (selectedPreset.value === name) {
            selectedPreset.value = ''
          }
        } else {
          ElMessage.error(result.msg || '删除预设失败')
        }
      }
    } catch (error) {
      // 取消或其他错误
      if (error !== 'cancel') {
        ElMessage.error('删除预设失败')
      }
    }
  }

  /**
   * 更新预设
   * @param name 预设名称
   * @param rules 更新后的规则
   */
  async function updatePreset(name: string, rules: JsonCompareRules): Promise<void> {
    try {
      const result = await updateJsonComparePresetApi(name, rules)
      if (result.code === 0) {
        ElMessage.success(`预设 "${name}" 已更新`)
        await loadAvailablePresets() // 重新加载预设列表
      } else {
        ElMessage.error(result.msg || '更新预设失败')
      }
    } catch (error) {
      ElMessage.error('更新预设失败：' + (error as Error).message)
    }
  }

  return {
    selectedPreset,
    availablePresets,
    loadAvailablePresets,
    saveRulesPreset,
    deletePreset,
    updatePreset
  }
}