<template>
  <div class="redis-viewer-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="left-tools">
        <el-select 
          v-model="selectedApiKey" 
          placeholder="请选择Redis中的数据部分" 
          @change="fetchDataFromRedis"
          :disabled="loading"
          class="data-selector"
        >
          <el-option 
            v-for="(option, index) in options"
            :key="index"
            :label="option.label" 
            :value="option.apiKey" 
          />
        </el-select>

        <el-button-group class="action-group">
          <el-button 
            type="primary" 
            :icon="Refresh"
            :loading="loading"
            @click="fetchDataFromRedis"
          >
            刷新
          </el-button>
        </el-button-group>
      </div>

      <div class="data-stats" v-if="jsonData">
        <el-tag>数据量: {{ dataCount }}</el-tag>
        <el-tag type="info">更新时间: {{ updateTime }}</el-tag>
      </div>
    </div>

    <!-- 错误提示 -->
    <el-alert 
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon 
      class="mt-4"
    />

    <!-- 数据展示区 -->
    <div class="viewer-wrapper">
      <el-skeleton :loading="loading" animated :rows="10">
        <template #default>
          <JsonViewer 
            :jsonData="jsonData"
            class="mt-6"
            ref="jsonViewerRef"
          />
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Refresh, Download } from '@element-plus/icons-vue'
import JsonViewer from '../utils/JsonViewer.vue'
import { 
  useTemplate,
  useZbcjData,
  useStandardDivOrgList,
  useStandardMktOrgList,
  useDimen,
  useGdhf,
  useGlzbData,
  useIndicatorAndMultiDim
} from '@/api/redisReader'

const selectedApiKey = ref('')
const jsonData = ref(null)
const loading = ref(false)
const errorMessage = ref('')
const jsonViewerRef = ref()
const updateTime = ref('')

// API映射
const apiMap = {
  template: useTemplate,
  zbcj: useZbcjData,
  standardDiv: useStandardDivOrgList,
  standardMkt: useStandardMktOrgList,
  dimen: useDimen,
  gdhf: useGdhf,
  glzb: useGlzbData,
  indicatorAndMultiDim: useIndicatorAndMultiDim,
}

// 下拉选项配置
const options = ref([
  { label: "指标采集数据(zbcj)", apiKey: "zbcj" },
  { label: "模板意图对应关系(Template)", apiKey: "template" },
  { label: "标准部门组织(StandardDivOrgList)", apiKey: "standardDiv" },
  { label: "标准市场组织(StandardMktOrgList)", apiKey: "standardMkt" },
  { label: "维度配置(Dimen)", apiKey: "dimen" },
  { label: "固定回复(Gdhf)", apiKey: "gdhf" },
  { label: "关联指标(GlzbData)", apiKey: "glzb" },
  { label: "指标和多维度(indicatorAndMultiDim)", apiKey: "indicatorAndMultiDim" }
])

// 计算数据量
const dataCount = computed(() => {
  if (!jsonData.value) return 0
  if (Array.isArray(jsonData.value)) {
    return jsonData.value.length
  }
  return Object.keys(jsonData.value).length
})

// 获取Redis数据
async function fetchDataFromRedis() {
  if (!selectedApiKey.value) return
  
  try {
    loading.value = true
    errorMessage.value = ''
    
    const apiHandler = apiMap[selectedApiKey.value]
    const { data } = await apiHandler()
    
    jsonData.value = data
    updateTime.value = new Date().toLocaleString()
  } catch (err) {
    console.error("数据获取失败:", err)
    errorMessage.value = `数据加载失败: ${err.message}`
    jsonData.value = null
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(async () => {
  if (options.value.length > 0) {
    selectedApiKey.value = options.value[0].apiKey
    await fetchDataFromRedis()
  }
})
</script>

<style scoped>
.redis-viewer-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
}

.left-tools {
  display: flex;
  gap: 16px;
  align-items: center;
}

.data-selector {
  width: 300px;
}

.action-group {
  display: flex;
  gap: 8px;
}

.data-stats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.viewer-wrapper {
  flex: 1;
  min-height: 0;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
}

:deep(.el-skeleton) {
  height: 100%;
}
</style>