<template>
  <div class="json-compare-container">
    <!-- 主要内容区域 -->
    <div class="main-content" :class="{ 'sidebar-open': sidebarVisible }">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button-group>
            <el-tooltip content="交换JSON A和B的内容" placement="top">
              <el-button :icon="Switch" @click="swapJsons" :disabled="!leftJson || !rightJson">
                交换
              </el-button>
            </el-tooltip>
            <el-tooltip content="复制JSON A到B" placement="top">
              <el-button :icon="CopyDocument" @click="copyLeftToRight" :disabled="!leftJson">
                A→B
              </el-button>
            </el-tooltip>
            <el-tooltip content="复制JSON B到A" placement="top">
              <el-button :icon="CopyDocument" @click="copyRightToLeft" :disabled="!rightJson">
                B→A
              </el-button>
            </el-tooltip>
          </el-button-group>
        </div>
        
        <div class="toolbar-center">
          <el-tooltip content="自定义比较规则" placement="top">
            <div class="custom-rules-button">
              <el-button @click="() => rulesDialogVisible = true" :icon="Setting" size="large" type="primary">
                自定义规则
              </el-button>
              <el-badge v-if="activeRulesCount > 0" :value="activeRulesCount" class="rules-badge" />
            </div>
          </el-tooltip>
          
          <el-button 
            type="primary" 
            :icon="Compare"
            @click="compareJson"
            :disabled="!canCompare"
            size="large"
          >
            开始比较
          </el-button>
        </div>
        
        <div class="toolbar-right">
          <el-button-group>
            <el-tooltip content="导出比较结果" placement="top">
              <el-button :icon="Download" @click="exportResults" :disabled="!comparisonResult">
                导出结果
              </el-button>
            </el-tooltip>
            <el-tooltip content="查看比较结果" placement="top">
              <el-button 
                :icon="View" 
                @click="toggleSidebar" 
                :disabled="!comparisonResult"
                :type="sidebarVisible ? 'success' : 'default'"
              >
                {{ sidebarVisible ? '隐藏结果' : '查看结果' }}
              </el-button>
            </el-tooltip>
          </el-button-group>
        </div>
      </div>

      <!-- 左右输入区域 -->
      <div class="compare-panels">
        <!-- 左侧JSON输入 -->
        <JsonInput
          v-model="leftJson"
          :title="leftTitle"
          :rows="22"
          @stats-updated="(stats) => leftJsonStats = stats"
        />

        <!-- 右侧JSON输入 -->
        <JsonInput
          v-model="rightJson"
          :title="rightTitle"
          :rows="22"
          @stats-updated="(stats) => rightJsonStats = stats"
        />
      </div>
    </div>

    <!-- 侧边栏 - 比较结果 -->
    <el-drawer
      v-model="sidebarVisible"
      title="比较结果"
      direction="rtl"
      size="45%"
      :with-header="true"
      :modal="true"
      class="result-drawer"
    >
      <template #header>
        <div class="drawer-header">
          <h3>比较结果</h3>
          <div class="result-summary" v-if="comparisonResult">
            <el-tag :type="differences.length === 0 ? 'success' : 'warning'" size="large">
              {{ differences.length === 0 ? '完全相同' : `发现 ${differences.length} 处差异` }}
            </el-tag>
          </div>
        </div>
      </template>
      
      <div v-if="comparisonResult" class="drawer-content">
        <el-tabs v-model="activeTab" class="result-tabs">
          <!-- 差异视图 -->
          <el-tab-pane name="diff">
            <template #label>
              <span>
                <el-icon><Warning /></el-icon>
                差异详情 ({{ differences.length }})
              </span>
            </template>
            
            <JsonDiffViewer 
              :differences="differences"
              :leftTitle="leftTitle"
              :rightTitle="rightTitle"
            />
          </el-tab-pane>
          
          <!-- 统计视图 -->
          <el-tab-pane name="stats">
            <template #label>
              <span>
                <el-icon><DataAnalysis /></el-icon>
                统计信息
              </span>
            </template>
            
            <JsonStatsViewer 
              :leftJsonStats="leftJsonStats"
              :rightJsonStats="rightJsonStats"
              :comparison-result="compareResult"
              :leftTitle="leftTitle"
              :rightTitle="rightTitle"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-drawer>

    <!-- 自定义规则对话框 -->
    <el-drawer
      v-model="rulesDialogVisible"
      title="自定义比较规则"
      direction="rtl"
      size="500px"
      class="rules-drawer"
      :before-close="() => rulesDialogVisible = false"
    >
      <JsonRulesEditor 
        ref="rulesEditorRef"
        v-model="customRules" 
      />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, defineProps, defineExpose } from 'vue'
import { 
  Connection as Compare,
  Switch,
  CopyDocument,
  Download,
  View,
  Warning,
  DataAnalysis,
  Setting
} from '@element-plus/icons-vue'
import { updateJsonStats } from '@/utils/jsonCompareUtils'
import { useJsonCompare } from '@/composables/useJsonCompare'
import JsonInput from '@/components/Json/JsonInput.vue'
import JsonDiffViewer from '@/components/Json/JsonDiffViewer.vue'
import JsonStatsViewer from '@/components/Json/JsonStatsViewer.vue'
import JsonRulesEditor from '@/components/Json/JsonRulesEditor.vue'

const rulesEditorRef = ref<InstanceType<typeof JsonRulesEditor>>()
const rulesDialogVisible = ref(false)

// 组件属性
const props = defineProps({
  initialLeftJson: {
    type: String,
    default: ''
  },
  initialRightJson: {
    type: String,
    default: ''
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

// 使用组合式函数
const {
  // 状态
  leftJson,
  rightJson,
  comparisonResult,
  activeTab,
  differences,
  sidebarVisible,
  compareTime,
  leftJsonStats,
  rightJsonStats,
  customRules,

  // 计算属性
  canCompare,
  activeRulesCount,
  compareResult,

  // 方法
  swapJsons,
  copyLeftToRight,
  copyRightToLeft,
  compareJson,
  toggleSidebar,
  exportResults,
  setJsonContent,
} = useJsonCompare({
  initialLeftJson: props.initialLeftJson,
  initialRightJson: props.initialRightJson,
  leftTitle: props.leftTitle,
  rightTitle: props.rightTitle
})

// 生命周期
onMounted(() => {
  // 初始化统计信息
  if (leftJson.value) {
    leftJsonStats.value = updateJsonStats(leftJson.value)
  }
  if (rightJson.value) {
    rightJsonStats.value = updateJsonStats(rightJson.value)
  }
})

// 暴露给父组件的方法
defineExpose({
  setJsonContent,
  compareJson,
  exportResults,
  resetRules: () => rulesEditorRef.value?.resetRules
})
</script>

<style scoped>
.json-compare-container {
  display: flex;
  height: 100vh;
  background: var(--theme-bg-color);
  position: relative;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 15px;
  gap: 20px;
  transition: margin-right 0.3s ease;
}

.main-content.sidebar-open {
  margin-right: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--theme-bg-color-overlay);
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 8px;
}

.toolbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 16px; /* 添加按钮之间的间距 */
  align-items: center;
}

.custom-rules-button {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.rules-badge {
  position: absolute;
  top: -8px;
  right: -8px;
}

.compare-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  flex: 1;
}

.result-drawer :deep(.el-drawer__body) {
  padding: 0;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.drawer-content {
  height: 100%;
  padding: 0px 20px;
}

.result-tabs {
  height: 100%;
}
</style>