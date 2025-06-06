import { ElMessage, ElMessageBox } from 'element-plus'
import {
    useJsonComparePresetsApi,
    saveJsonComparePresetApi,
    deleteJsonComparePresetApi,
    updateJsonComparePresetApi
} from '@/api/jsonCompare'

export function useJsonCompareRules() {
    const customRules = ref<JsonCompareRulesContent>(defaultJsonCompareRulesContent())
    const selectedPreset = ref<string>('') // 当前选择的预设名称
    const isModified = ref<boolean>(false) // 标记规则是否被修改过
    const originalPresetRules = ref<JsonCompareRulesContent | null>(null) // 保存原始预设规则

    const newIgnoreKey = ref<string>('')
    const newIgnorePattern = ref<string>('')
    const availableRules = ref<Record<string, JsonCompareRulesContent>>({})

    const activeRulesCount = computed<number>(() => {
        let count = 0
        if (customRules.value.rules.ignoreArrayOrder) count++
        if (customRules.value.rules.ignoreCase) count++
        if (customRules.value.rules.ignoreWhitespace) count++
        if (customRules.value.rules.typeCoercion) count++
        if (customRules.value.rules.ignoreNullUndefined) count++
        count += customRules.value.rules.ignoreKeys.length
        count += customRules.value.rules.customIgnorePatterns.length
        return count
    })

    const appliedRulesText = computed<Array<string>>(() => {
        const appliedRules: string[] = []
        if (customRules.value.rules.ignoreArrayOrder) appliedRules.push('忽略数组顺序')
        if (customRules.value.rules.ignoreCase) appliedRules.push('忽略大小写')
        if (customRules.value.rules.ignoreWhitespace) appliedRules.push('忽略空格')
        if (customRules.value.rules.typeCoercion) appliedRules.push('类型强制转换')
        if (customRules.value.rules.ignoreNullUndefined) appliedRules.push('null/undefined等价')
        if (customRules.value.rules.ignoreKeys.length > 0) {
            appliedRules.push(`忽略键值(${customRules.value.rules.ignoreKeys.length}个)`)
        }
        if (customRules.value.rules.customIgnorePatterns.length > 0) {
            appliedRules.push(`自定义模式(${customRules.value.rules.customIgnorePatterns.length}个)`)
        }
        return appliedRules
    })

    // 检测当前规则是否与原始预设规则不同
    const hasModifications = computed<boolean>(() => {
        if (!originalPresetRules.value || !selectedPreset.value) {
            return false
        }
        return JSON.stringify(customRules.value.rules) !== JSON.stringify(originalPresetRules.value.rules)
    })

    // 当前状态描述
    const currentStatus = computed<string>(() => {
        if (!selectedPreset.value) {
            return '自定义规则'
        }
        if (hasModifications.value) {
            return `${selectedPreset.value} (已修改)`
        }
        return selectedPreset.value
    })

    // 规则管理方法
    function addIgnoreKey(): void {
        const key = newIgnoreKey.value.trim()
        if (!key) {
            ElMessage.warning('请输入键名')
            return
        }

        if (customRules.value.rules.ignoreKeys.includes(key)) {
            ElMessage.warning('该键名已存在')
            return
        }

        customRules.value.rules.ignoreKeys.push(key)
        newIgnoreKey.value = ''
        ElMessage.success(`已添加忽略键名: ${key}`)
    }

    function removeIgnoreKey(key: string): void {
        const index = customRules.value.rules.ignoreKeys.indexOf(key)
        if (index > -1) {
            customRules.value.rules.ignoreKeys.splice(index, 1)
            ElMessage.success(`已移除忽略键名: ${key}`)
        }
    }

    function addIgnorePattern(): void {
        const pattern = newIgnorePattern.value.trim()
        if (!pattern) {
            ElMessage.warning('请输入正则表达式')
            return
        }

        try {
            new RegExp(pattern) // 验证正则表达式

            if (customRules.value.rules.customIgnorePatterns.includes(pattern)) {
                ElMessage.warning('该模式已存在')
                return
            }

            customRules.value.rules.customIgnorePatterns.push(pattern)
            newIgnorePattern.value = ''
            ElMessage.success(`已添加忽略模式: ${pattern}`)
        } catch (e) {
            ElMessage.error('无效的正则表达式')
        }
    }

    function removeIgnorePattern(pattern: string): void {
        const index = customRules.value.rules.customIgnorePatterns.indexOf(pattern)
        if (index > -1) {
            customRules.value.rules.customIgnorePatterns.splice(index, 1)
            ElMessage.success(`已移除忽略模式: ${pattern}`)
        }
    }

    function resetRules(): void {
        customRules.value = defaultJsonCompareRulesContent();
        selectedPreset.value = ''
        originalPresetRules.value = null
        isModified.value = false
        newIgnoreKey.value = ''
        newIgnorePattern.value = ''
        ElMessage.success('已重置所有规则')
    }

    /**
     * 选择预设规则
     * @param presetName 预设名称
     * @param preset 预设规则内容
     */
    function selectPreset(presetName: string, preset: JsonCompareRulesContent): void {
        // 如果当前有修改未保存，提示用户
        if (hasModifications.value) {
            ElMessage.warning(`切换预设前，当前对"${selectedPreset.value}"的修改将丢失`)
        }

        selectedPreset.value = presetName
        originalPresetRules.value = JSON.parse(JSON.stringify(preset)) // 深拷贝保存原始规则
        customRules.value = JSON.parse(JSON.stringify(preset)) // 深拷贝应用规则
        isModified.value = false

        ElMessage.success(`已应用预设: ${presetName}`)
    }

    /**
     * 恢复到原始预设规则
     */
    function revertToOriginal(): void {
        if (!originalPresetRules.value || !selectedPreset.value) {
            ElMessage.warning('没有可恢复的预设规则')
            return
        }

        customRules.value = JSON.parse(JSON.stringify(originalPresetRules.value))
        isModified.value = false
        ElMessage.success(`已恢复到原始预设: ${selectedPreset.value}`)
    }

    /**
     * 保存修改到当前预设
     */
    async function saveModificationsToPreset(): Promise<void> {
        if (!selectedPreset.value || !hasModifications.value) {
            ElMessage.warning('没有需要保存的修改')
            return
        }

        try {
            await updatePreset(selectedPreset.value, customRules.value.rules)
            originalPresetRules.value = JSON.parse(JSON.stringify(customRules.value))
            isModified.value = false
            ElMessage.success(`已保存修改到预设: ${selectedPreset.value}`)
        } catch (error) {
            ElMessage.error('保存修改失败')
        }
    }

    async function loadAvailableRules(): Promise<void> {
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

                availableRules.value = validData
            } else {
                console.warn('预设数据格式无效:', response.data)
                availableRules.value = {}
            }
        } catch (error) {
            console.warn('加载预设失败:', error)
            availableRules.value = {}
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
                        await loadAvailableRules() // 重新加载预设列表
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
                    await loadAvailableRules() // 重新加载预设列表
                    if (customRules.value?.name === name) {
                        customRules.value = defaultJsonCompareRulesContent()
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
                await loadAvailableRules() // 重新加载预设列表
            } else {
                ElMessage.error(result.msg || '更新预设失败')
            }
        } catch (error) {
            ElMessage.error('更新预设失败：' + (error as Error).message)
        }
    }

    // 监听规则变化，自动更新修改状态
    watch(
        customRules,
        () => {
            if (selectedPreset.value && originalPresetRules.value) {
                isModified.value = JSON.stringify(customRules.value) !== JSON.stringify(originalPresetRules.value)
            } else if (!selectedPreset.value) {
                isModified.value = false
            }
        },
        { deep: true }
    )

    return {
        // 状态
        customRules,
        selectedPreset,
        isModified,
        originalPresetRules,
        newIgnoreKey,
        newIgnorePattern,
        availableRules,

        // 计算属性
        activeRulesCount,
        appliedRulesText,
        hasModifications,
        currentStatus,

        // 方法
        addIgnoreKey,
        removeIgnoreKey,
        addIgnorePattern,
        removeIgnorePattern,
        resetRules,
        selectPreset,
        revertToOriginal,
        saveModificationsToPreset,
        loadAvailableRules,
        saveRulesPreset,
        deletePreset,
        updatePreset
    }
}