<template>
  <div class="json-input-panel">
    <div class="panel-header">
      <span class="panel-title">{{ title }}</span>
      <div class="panel-info">
        <el-tag size="small" v-if="jsonStats.lines">{{ jsonStats.lines }} 行</el-tag>
        <el-tag size="small" type="info" v-if="jsonStats.size">{{ jsonStats.size }}</el-tag>
      </div>
      <div class="panel-actions">
        <el-upload
          class="upload-btn"
          action=""
          :show-file-list="false"
          :before-upload="handleFileUpload"
        >
          <el-tooltip :content="`上传${title}文件`" placement="top">
            <el-button type="primary" :icon="Upload" circle size="small" />
          </el-tooltip>
        </el-upload>
        <el-tooltip content="格式化" placement="top">
          <el-button 
            type="success" 
            :icon="SetUp"
            @click="formatJson" 
            circle 
            size="small"
          />
        </el-tooltip>
        <el-tooltip content="清空" placement="top">
          <el-button 
            type="danger" 
            :icon="Delete"
            @click="clearInput" 
            circle 
            size="small"
          />
        </el-tooltip>
      </div>
    </div>
    <el-input
      v-model="jsonContent"
      type="textarea"
      :rows="rows"
      :placeholder="`请输入/粘贴${title}数据`"
      resize="none"
      class="json-input"
      @input="handleUpdateJsonStats"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Upload,
  SetUp,
  Delete
} from '@element-plus/icons-vue'
import { 
  updateJsonStats, 
  formatJsonString, 
  handleJsonFileUpload 
} from '@/utils/jsonCompareUtils'

// 组件属性
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: 'JSON'
  },
  rows: {
    type: Number,
    default: 22
  }
})

// 组件事件
const emit = defineEmits(['update:modelValue', 'stats-updated'])

// 响应式状态
const jsonContent = ref<string>(props.modelValue)
const jsonStats = ref<JsonStats>(defaultJsonStats())

// 监听属性变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== jsonContent.value) {
    jsonContent.value = newValue
    handleUpdateJsonStats()
  }
}, { immediate: true })

// 监听内部状态变化
watch(jsonContent, (newValue) => {
  emit('update:modelValue', newValue)
})

// 方法
function handleUpdateJsonStats(): void {
  const stats = updateJsonStats(jsonContent.value)
  jsonStats.value = stats
  emit('stats-updated', stats)
}

function formatJson(): void {
  try {
    const formatted = formatJsonString(jsonContent.value)
    jsonContent.value = formatted
    handleUpdateJsonStats()
    ElMessage.success('JSON格式化成功')
  } catch (error) {
    ElMessage.error('JSON格式错误，无法格式化')
  }
}

function clearInput(): void {
  jsonContent.value = ''
  jsonStats.value = defaultJsonStats()
  emit('stats-updated', jsonStats.value)
}

async function handleFileUpload(file: File): Promise<boolean> {
  try {
    const content = await handleJsonFileUpload(file)
    jsonContent.value = content
    handleUpdateJsonStats()
    ElMessage.success('文件上传成功')
  } catch (error) {
    // 错误已在工具函数中处理
  }
  return false // 阻止默认上传行为
}
</script>

<style scoped>
.json-input-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--theme-bg-color-overlay);
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--theme-text-color);
}

.panel-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.panel-actions {
  display: flex;
  gap: 6px;
}

.json-input {
  flex: 1;
  font-family: var(--theme-code-font-family);
}

.json-input :deep(.el-textarea__inner) {
  height: 100% !important;
  font-family: var(--theme-code-font-family);
  font-size: 14px;
  line-height: 1.5;
  color: var(--theme-text-color);
  background: var(--theme-bg-color);
  border-radius: 6px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .panel-actions {
    align-self: flex-end;
  }
}
</style>