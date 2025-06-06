<template>
  <div class="diff-content">
    <div class="diff-filters">
      <el-radio-group v-model="diffFilter" size="small">
        <el-radio-button label="all">全部 ({{ differences.length }})</el-radio-button>
        <el-radio-button label="added">新增 ({{ addedCount }})</el-radio-button>
        <el-radio-button label="removed">删除 ({{ removedCount }})</el-radio-button>
        <el-radio-button label="modified">修改 ({{ modifiedCount }})</el-radio-button>
      </el-radio-group>
    </div>
    
    <div class="diff-list">
      <div v-if="filteredDifferences.length === 0" class="empty-state">
        <el-empty description="没有找到差异" />
      </div>
      
      <div 
        v-for="(diff, index) in filteredDifferences" 
        :key="index" 
        class="diff-item"
        :class="`diff-${diff.type}`"
      >
        <div class="diff-header">
          <el-tag 
            :type="diff.type === 'added' ? 'success' : diff.type === 'removed' ? 'danger' : 'warning'"
            size="small"
          >
            {{ diff.type === 'added' ? '新增' : diff.type === 'removed' ? '删除' : '修改' }}
          </el-tag>
          <code class="diff-path">{{ diff.path }}</code>
        </div>
        
        <div class="diff-values">
          <div v-if="diff.type !== 'added'" class="value-item left-value">
            <span class="value-label">{{ leftTitle }}:</span>
            <pre class="value-content">{{ formatDisplayValue(diff.left) }}</pre>
          </div>
          
          <div v-if="diff.type !== 'removed'" class="value-item right-value">
            <span class="value-label">{{ rightTitle }}:</span>
            <pre class="value-content">{{ formatDisplayValue(diff.right) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Warning } from '@element-plus/icons-vue'
import { formatDisplayValue } from '@/utils/jsonCompareUtils'

// 组件属性
const props = defineProps({
  differences: {
    type: Array as () => JsonDifference[],
    required: true
  },
  leftTitle: {
    type: String,
    default: 'JSON A'
  },
  rightTitle: {
    type: String,
    default: 'JSON B'
  }
})

// 响应式状态
const diffFilter = ref<string>('all')

// 计算属性
const addedCount = computed<number>(() => {
  return props.differences.filter(d => d.type === 'added').length
})

const removedCount = computed<number>(() => {
  return props.differences.filter(d => d.type === 'removed').length
})

const modifiedCount = computed<number>(() => {
  return props.differences.filter(d => d.type === 'modified').length
})

const filteredDifferences = computed<JsonDifference[]>(() => {
  if (diffFilter.value === 'all') {
    return props.differences
  }
  return props.differences.filter(d => d.type === diffFilter.value)
})
</script>

<style scoped>
.diff-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.diff-filters {
  padding: 12px;
  background: var(--theme-bg-color-overlay);
  border-radius: 6px;
  border: 1px solid var(--theme-border-color);
}

.diff-list {
  flex: 1;
  overflow: auto;
}

.diff-item {
  margin-bottom: 16px;
  padding: 16px;
  background: var(--theme-bg-color-overlay);
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
}

.diff-item.diff-added {
  border-left: 4px solid var(--el-color-success);
}

.diff-item.diff-removed {
  border-left: 4px solid var(--el-color-danger);
}

.diff-item.diff-modified {
  border-left: 4px solid var(--el-color-warning);
}

.diff-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.diff-path {
  font-family: var(--theme-code-font-family);
  background: var(--theme-bg-color);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.diff-values {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.value-item {
  padding: 12px;
  background: var(--theme-bg-color);
  border-radius: 6px;
  border: 1px solid var(--theme-border-color);
}

.value-label {
  font-weight: bold;
  color: var(--theme-text-color-secondary);
  font-size: 12px;
  margin-bottom: 8px;
  display: block;
}

.value-content {
  font-family: var(--theme-code-font-family);
  font-size: 13px;
  line-height: 1.4;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.left-value {
  border-left: 3px solid var(--el-color-danger);
}

.right-value {
  border-left: 3px solid var(--el-color-success);
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .diff-filters {
    padding: 8px;
  }
  
  .diff-item {
    padding: 12px;
  }
}
</style>