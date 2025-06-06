<template>
  <div class="test-result-viewer">
    <!-- 测试结果抽屉 -->
    <el-drawer
      v-model="resultDrawerVisible"
      title="测试结果"
      :size="drawerSize"
      destroy-on-close
    >
      <template #header>
        <div class="drawer-header">
          <div class="header-title">
            <el-icon><DataAnalysis /></el-icon>
            <span>测试结果</span>
          </div>
          <div class="header-actions">
            <el-button type="primary" @click="exportResults" :disabled="!hasResults">
              <el-icon><Download /></el-icon>导出结果
            </el-button>
          </div>
        </div>
      </template>

      <div class="drawer-content">
        <!-- 筛选区域 -->
        <div class="filter-area" v-if="hasResults">
          <el-select v-model="serviceFilter" placeholder="筛选服务" clearable>
            <el-option
              v-for="service in serviceOptions"
              :key="service"
              :label="service"
              :value="service"
            />
          </el-select>
          
          <el-input
            v-model="searchKeyword"
            placeholder="搜索输入或输出"
            clearable
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <!-- 结果表格 -->
        <el-table
          v-if="hasResults"
          :data="filteredResults"
          style="width: 100%"
          border
          stripe
          highlight-current-row
          class="result-table"
          v-loading="isExporting"
        >
          <el-table-column type="index" label="序号" width="70" align="center" />
          <el-table-column prop="input" label="输入" min-width="180">
            <template #default="{row}">
              <div class="input-cell">{{ row.input }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="service" label="服务" width="120" align="center">
            <template #default="{row}">
              <el-tag :type="getServiceTagType(row.service)">{{ row.service }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="输出" min-width="280">
            <template #default="{row}">
              <div class="output-cell">
                <pre>{{ formatOutput(row.output) }}</pre>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="耗时" width="100" align="center">
            <template #default="{row}">
              <span>{{ row.duration }}ms</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="{row}">
              <el-button 
                type="primary" 
                link 
                @click="viewResultDetail(row)"
              >
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 无数据提示 -->
        <el-empty 
          v-else 
          description="暂无测试结果" 
          :image-size="200"
        >
          <el-button type="primary" @click="closeDrawer">返回测试</el-button>
        </el-empty>
      </div>
    </el-drawer>

    <!-- 结果详情对话框 -->
    <el-dialog
      v-model="resultDetailVisible"
      title="结果详情"
      width="70%"
      destroy-on-close
    >
      <div class="result-detail" v-if="currentResultDetail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="输入内容">
            <div class="detail-content">{{ currentResultDetail.input }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="服务">
            <el-tag :type="getServiceTagType(currentResultDetail.service)">
              {{ currentResultDetail.service }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="输出结果">
            <div class="detail-content">
              <pre>{{ formatOutput(currentResultDetail.output) }}</pre>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="耗时">
            <span>{{ currentResultDetail.duration }}ms</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Download, Search } from '@element-plus/icons-vue'
import { useTestResultUtils } from '@/composables/useTestResultUtils'

const props = defineProps<{
  results: TestResult[]
  visible: boolean
  drawerSize?: string | number
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'export-complete': [success: boolean]
}>()

const { 
  formatOutput, 
  getServiceTagType, 
  exportResults 
} = useTestResultUtils()

// 状态管理
const resultDrawerVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})
const serviceFilter = ref('')
const searchKeyword = ref('')
const isExporting = ref(false)

// 结果详情
const resultDetailVisible = ref(false)
const currentResultDetail = ref<TestResult | null>(null)

// 计算属性
const hasResults = computed(() => props.results.length > 0)

const serviceOptions = computed(() => {
  const options = new Set<string>()
  props.results.forEach(result => options.add(result.service))
  return Array.from(options)
})

const filteredResults = computed(() => {
  let filtered = [...props.results]
  
  // 服务筛选
  if (serviceFilter.value) {
    filtered = filtered.filter(result => result.service === serviceFilter.value)
  }
  
  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(result => 
      result.input.toLowerCase().includes(keyword) || 
      String(result.output).toLowerCase().includes(keyword)
    )
  }
  
  return filtered
})

// 方法
function closeDrawer() {
  resultDrawerVisible.value = false
}

function viewResultDetail(result: TestResult) {
  currentResultDetail.value = result
  resultDetailVisible.value = true
}

async function handleExportResults() {
  if (!hasResults.value) return
  
  isExporting.value = true
  
  try {
    // 准备导出数据
    const exportData = filteredResults.value.map(result => ({
      '序号': result.id,
      '输入': result.input,
      '服务': result.service,
      '输出': typeof result.output === 'string' ? result.output : JSON.stringify(result.output),
      '耗时(ms)': result.duration,
      '时间戳': result.timestamp
    }))
    
    // 导出文件名
    const fileName = `测试结果_${new Date().toISOString().replace(/[:.]/g, '-')}`
    
    // 执行导出
    await exportResults(exportData, fileName)
    ElMessage.success('导出成功')
    emit('export-complete', true)
  } catch (error) {
    console.error('导出错误:', error)
    ElMessage.error('导出失败')
    emit('export-complete', false)
  } finally {
    isExporting.value = false
  }
}
</script>

<style scoped lang="scss">
// 抽屉样式
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  
  .header-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.drawer-content {
  padding: 20px 0;
}

.filter-area {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  
  .search-input {
    max-width: 300px;
  }
}

.result-table {
  .input-cell,
  .output-cell {
    max-height: 120px;
    overflow: auto;
    word-break: break-word;
    white-space: pre-wrap;
    font-family: var(--theme-code-font-family, monospace);
    font-size: 14px;
    padding: 8px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
  }
}

// 结果详情样式
.result-detail {
  .detail-content {
    white-space: pre-wrap;
    word-break: break-word;
    font-family: var(--theme-code-font-family, monospace);
    max-height: 400px;
    overflow: auto;
    padding: 16px;
    background-color: var(--el-fill-color-light);
    border-radius: 6px;
    font-size: 14px;
    line-height: 1.6;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .filter-area {
    flex-direction: column;
    gap: 12px;
    
    .search-input {
      max-width: 100%;
    }
  }
}
</style>