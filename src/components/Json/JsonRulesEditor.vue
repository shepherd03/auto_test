<template>
  <div class="rules-editor">
    <!-- 基础规则 -->
    <el-card class="rule-section">
      <template #header>
        <span>基础规则</span>
      </template>
      
      <div class="rule-options">
        <el-checkbox v-model="customRules.rules.ignoreArrayOrder">
          忽略数组顺序
          <el-tooltip content="比较数组时忽略元素顺序" placement="top">
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-checkbox>
        
        <el-checkbox v-model="customRules.rules.ignoreCase">
          忽略字符串大小写
          <el-tooltip content="比较字符串时忽略大小写差异" placement="top">
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-checkbox>
        
        <el-checkbox v-model="customRules.rules.ignoreWhitespace">
          忽略字符串前后空格
          <el-tooltip content="比较字符串时忽略前后空白字符" placement="top">
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-checkbox>
        
        <el-checkbox v-model="customRules.rules.typeCoercion">
          启用类型强制转换
          <el-tooltip content="将 '1' 和 1 视为相等" placement="top">
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-checkbox>
        
        <el-checkbox v-model="customRules.rules.ignoreNullUndefined">
          null 和 undefined 等价
          <el-tooltip content="将 null 和 undefined 视为相等" placement="top">
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-checkbox>
      </div>
    </el-card>
    
    <!-- 忽略键值 -->
    <el-card class="rule-section">
      <template #header>
        <div class="section-header">
          <span>忽略键值</span>
        </div>
      </template>
      
      <div class="ignore-keys">
        <div class="input-with-button">
          <el-input
            v-model="newIgnoreKey"
            placeholder="输入要忽略的键名"
            @keyup.enter="addIgnoreKey"
            size="small"
          >
            <template #append>
              <el-button @click="addIgnoreKey" :icon="Plus" :disabled="!newIgnoreKey.trim()">
                添加
              </el-button>
            </template>
          </el-input>
        </div>
        
        <div class="tags-container">
          <el-tag
            v-for="key in customRules.rules.ignoreKeys"
            :key="key"
            closable
            @close="removeIgnoreKey(key)"
            class="key-tag"
          >
            {{ key }}
          </el-tag>
          <div v-if="customRules.rules.ignoreKeys.length === 0" class="empty-hint">
            暂无忽略的键名
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 自定义模式 -->
    <el-card class="rule-section">
      <template #header>
        <div class="section-header">
          <span>自定义忽略模式</span>
        </div>
      </template>
      
      <div class="ignore-patterns">
        <div class="input-with-button">
          <el-input
            v-model="newIgnorePattern"
            placeholder="输入正则表达式模式"
            @keyup.enter="addIgnorePattern"
            size="small"
          >
            <template #append>
              <el-button @click="addIgnorePattern" :icon="Plus" :disabled="!newIgnorePattern.trim()">
                添加
              </el-button>
            </template>
          </el-input>
        </div>
        
        <div class="patterns-container">
          <div 
            v-for="pattern in customRules.rules.customIgnorePatterns"
            :key="pattern"
            class="pattern-item"
          >
            <code class="pattern-code">{{ pattern }}</code>
            <el-button 
              @click="removeIgnorePattern(pattern)" 
              size="small" 
              type="danger" 
              text
              :icon="Delete"
            />
          </div>
          <div v-if="customRules.rules.customIgnorePatterns.length === 0" class="empty-hint">
            暂无自定义模式
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 预设管理 -->
    <el-card class="rule-section">
      <template #header>
        <span>规则预设</span>
      </template>
      
      <div class="preset-section">
        <div class="preset-status">
          <el-text class="status-text">
            当前状态: <strong>{{ currentStatus }}</strong>
            <el-tag v-if="hasModifications" type="warning" size="small" class="modified-tag">
              已修改
            </el-tag>
          </el-text>
        </div>
        
        <div class="preset-load">
          <el-select
            v-model="selectedPreset"
            placeholder="选择预设规则"
            style="width: 100%"
            size="small"
            @change="handlePresetChange"
            clearable
          >
            <el-option
              v-for="(preset, name) in availableRules"
              :key="preset.id"
              :label="name"
              :value="name"
            />
          </el-select>
        </div>
        
        <div class="preset-actions">
          <el-button @click="saveRulesPreset(customRules.rules)" :icon="Download" size="small">
            保存为新预设
          </el-button>
          
          <el-button 
            v-if="hasModifications" 
            @click="saveModificationsToPreset" 
            :icon="Upload" 
            size="small" 
            type="primary"
          >
            保存修改到预设
          </el-button>
          
          <el-button 
            v-if="hasModifications" 
            @click="revertToOriginal" 
            :icon="RefreshLeft" 
            size="small" 
            type="info"
          >
            恢复原始
          </el-button>
          
          <el-button @click="resetRules" :icon="RefreshLeft" size="small" type="warning">
            重置所有规则
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from 'vue'
import { 
  Delete, 
  Plus, 
  Download, 
  RefreshLeft, 
  QuestionFilled,
  Upload 
} from '@element-plus/icons-vue'

import { useJsonCompareRules } from '@/composables/useJsonCompareRules';

const props = defineProps<{
  modelValue: JsonCompareRulesContent
}>()

// 组件事件
const emit = defineEmits<{
  (e: 'update:modelValue', value: JsonCompareRulesContent): void
  (e: 'rules-changed', value: JsonCompareRulesContent): void
  (e: 'rules-reset'): void
}>()

const {
  // 状态
  customRules,
  selectedPreset,
  newIgnoreKey,
  newIgnorePattern,
  availableRules,
  
  // 计算属性
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
} = useJsonCompareRules()

// 处理预设变化
 const handlePresetChange = (presetName: string) => {
   if (presetName && availableRules.value[presetName]) {
     selectPreset(presetName, availableRules.value[presetName])
   }
 }

// 监听props变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    customRules.value = newValue
  }
}, { deep: true })

// 监听本地状态变化，更新父组件
watch(customRules, (newValue) => {
  emit('update:modelValue', newValue)
  emit('rules-changed', newValue)
}, { deep: true })

// 初始化加载预设
loadAvailableRules()

defineExpose({
  addIgnoreKey,
  removeIgnoreKey,
  addIgnorePattern,
  removeIgnorePattern,
  resetRules,
})
</script>

<style scoped>
.rules-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 8px;
}

.rule-section {
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.rule-section :deep(.el-card__header) {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 15px;
  border-bottom: 1px solid var(--theme-border-color);
}

.rule-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.help-icon {
  margin-left: 4px;
  font-size: 14px;
  color: var(--el-color-info);
  cursor: help;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-with-button {
  margin-bottom: 12px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 32px;
}

.key-tag {
  margin-right: 6px;
  margin-bottom: 6px;
}

.patterns-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pattern-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background-color: var(--theme-bg-color-overlay);
  border-radius: 4px;
  border: 1px solid var(--theme-border-color);
  min-height: 36px;
  gap: 8px;
}

.pattern-code {
  font-family: monospace;
  color: var(--el-color-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
  min-width: 0;
}

.empty-hint {
  color: var(--el-color-info);
  font-size: 14px;
  padding: 8px 0;
  font-style: italic;
}

.preset-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preset-status {
  margin-bottom: 12px;
  padding: 8px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.status-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modified-tag {
  margin-left: 8px;
}

.preset-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .preset-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .preset-actions .el-button {
    width: 100%;
  }
}
</style>