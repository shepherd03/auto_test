<template>
  <div class="stats-content">
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card class="stats-card">
          <template #header>
            <span>{{ leftTitle }} 统计</span>
          </template>
          <div class="stats-item">
            <span class="stats-label">行数:</span>
            <span class="stats-value">{{ leftJsonStats.lines }}</span>
          </div>
          <div class="stats-item">
            <span class="stats-label">大小:</span>
            <span class="stats-value">{{ leftJsonStats.size }}</span>
          </div>
          <div class="stats-item">
            <span class="stats-label">字段数:</span>
            <span class="stats-value">{{ leftJsonStats.totalFields }}</span>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="stats-card">
          <template #header>
            <span>{{ rightTitle }} 统计</span>
          </template>
          <div class="stats-item">
            <span class="stats-label">行数:</span>
            <span class="stats-value">{{ rightJsonStats.lines }}</span>
          </div>
          <div class="stats-item">
            <span class="stats-label">大小:</span>
            <span class="stats-value">{{ rightJsonStats.size }}</span>
          </div>
          <div class="stats-item">
            <span class="stats-label">字段数:</span>
            <span class="stats-value">{{ rightJsonStats.totalFields }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card class="stats-card comparison-stats">
      <template #header>
        <span>比较统计</span>
      </template>
      <div class="stats-grid">
        <div class="stats-item">
          <span class="stats-label">相似度:</span>
          <span class="stats-value">{{ comparisonResult.similarity }}%</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">总差异:</span>
          <span class="stats-value">{{ comparisonResult.totalDifferences }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">新增字段:</span>
          <span class="stats-value text-success">{{ comparisonResult.addedCount }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">删除字段:</span>
          <span class="stats-value text-danger">{{ comparisonResult.removedCount }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">修改字段:</span>
          <span class="stats-value text-warning">{{ comparisonResult.modifiedCount }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">比较时间:</span>
          <span class="stats-value">{{ comparisonResult.compareTime }}</span>
        </div>
      </div>
    </el-card>
    
    <el-card class="stats-card" v-if="comparisonResult.appliedRules.length > 0">
      <template #header>
        <span>应用的规则</span>
      </template>
      <div class="applied-rules">
        <el-tag 
          v-for="rule in comparisonResult.appliedRules" 
          :key="rule" 
          size="small" 
          class="rule-tag"
        >
          {{ rule }}
        </el-tag>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">

// 组件属性
const props = defineProps({
  // 左侧JSON单个统计
  leftJsonStats: {
    type: Object as () => JsonStats,
    required: true
  },
  // 右侧JSON单个统计
  rightJsonStats: {
    type: Object as () => JsonStats,
    required: true
  },
  // 比较统计信息
  comparisonResult: {
    type: Object as () => JsonComparisonResult,
    default: () => ({})
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

</script>

<style scoped>
.stats-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-card {
  border: 1px solid var(--theme-border-color);
}

.stats-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--theme-border-color-light);
}

.stats-item:last-child {
  border-bottom: none;
}

.stats-label {
  font-weight: 500;
  color: var(--theme-text-color-secondary);
}

.stats-value {
  font-weight: bold;
  color: var(--theme-text-color);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.comparison-stats {
  margin-top: 16px;
}

.applied-rules {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rule-tag {
  margin: 0;
}

.text-success {
  color: var(--el-color-success) !important;
}

.text-danger {
  color: var(--el-color-danger) !important;
}

.text-warning {
  color: var(--el-color-warning) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>