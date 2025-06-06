<template>
  <div class="json-viewer-container">
    <!-- 左侧输入操作区 -->
    <div class="left-panel">
      <div class="input-area">
        <el-input
          v-model="jsonInput"
          type="textarea"
          :rows="18"
          placeholder="请输入/粘贴 JSON 数据"
          resize="none"
          class="input-box"
        />
        <div class="action-bar">
          <el-button-group class="primary-actions">
            <el-tooltip content="解析JSON数据" placement="top">
              <el-button type="primary" @click="parseJson" :icon="MagicStick">
                解析
              </el-button>
            </el-tooltip>
            <el-tooltip content="格式化JSON数据" placement="top">  
              <el-button type="success" @click="formatJson" :icon="SetUp">
                格式化
              </el-button>
            </el-tooltip>
          </el-button-group>

          <div class="secondary-actions">
            <el-tooltip content="复制到剪贴板" placement="top">
              <el-button type="info" @click="copyToClipboard" :icon="DocumentCopy" circle />
            </el-tooltip>
            <el-tooltip content="下载JSON文件" placement="top">
              <el-button type="info" @click="downloadJson" :icon="Download" circle />
            </el-tooltip>
            <el-tooltip content="清空输入" placement="top">
              <el-button type="danger" @click="clearInput" :icon="Delete" circle />
            </el-tooltip>
            <el-upload
              class="upload-btn"
              action=""
              :show-file-list="false"
              :before-upload="handleFileUpload"
            >
              <el-tooltip content="上传JSON文件" placement="top">
                <el-button type="warning" :icon="Upload" circle />
              </el-tooltip>
            </el-upload>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧展示区 -->
    <div class="right-panel">
      <el-tabs v-model="activeTab" class="smart-tabs" type="border-card">
        <!-- 树形视图 -->
        <el-tab-pane label="树形视图" name="tree">
          <el-scrollbar class="viewer-scrollbar">
            <div class="viewer-content">
              <div class="view-toolbar">
                <div class="search-bar">
                  <el-input
                    v-model="searchText"
                    placeholder="搜索节点..."
                    :prefix-icon="Search"
                    clearable
                    @input="handleSearch"
                  />
                </div>
                <div class="tree-actions">
                  <el-button-group>
                    <el-tooltip content="展开全部" placement="top">
                      <el-button @click="expandAll" :icon="ArrowDown" />
                    </el-tooltip>
                    <el-tooltip content="折叠全部" placement="top">
                      <el-button @click="collapseAll" :icon="ArrowUp" />
                    </el-tooltip>
                  </el-button-group>
                </div>
              </div>
              <el-tree 
                v-if="parsedData"
                :data="treeData"
                :props="treeProps"
                node-key="id"
                :default-expanded-keys="expandedKeys"
                :filter-node-method="filterNode"
                ref="tree"
                class="custom-tree"
                @node-click="handleNodeClick"
              >
                <template #default="{ node, data }">
                  <span class="tree-node">
                    <span class="node-label">{{ node.label }}</span>
                    <span v-if="!data.children" class="node-value">{{ data.name }}</span>
                  </span>
                </template>
              </el-tree>
              <el-empty v-else description="暂无数据" />
            </div>
          </el-scrollbar>
        </el-tab-pane>

        <!-- 添加键值视图 tab -->
        <el-tab-pane label="键值视图" name="keyValue">
          <el-scrollbar class="viewer-scrollbar">
            <div class="viewer-content">
              <el-descriptions 
                v-if="parsedData" 
                :column="1" 
                border
                class="key-value-view"
              >
                <template v-for="(value, key) in flattenedData" :key="key">
                  <el-descriptions-item :label="key">
                    <pre class="value-pre">{{ formatValue(value) }}</pre>
                  </el-descriptions-item>
                </template>
              </el-descriptions>
              <el-empty v-else description="暂无数据" />
            </div>
          </el-scrollbar>
        </el-tab-pane>

        <!-- 添加代码视图 tab -->
        <el-tab-pane label="代码视图" name="code">
          <el-scrollbar class="viewer-scrollbar">
            <div class="viewer-content">
              <div class="code-toolbar">
                <el-select v-model="indentSize" size="small" style="width: 120px">
                  <el-option label="2空格" value="2" />
                  <el-option label="4空格" value="4" />
                  <el-option label="Tab" value="tab" />
                </el-select>
                <el-button-group>
                  <el-tooltip content="复制代码" placement="top">
                    <el-button size="small" @click="copyFormattedCode" :icon="DocumentCopy" />
                  </el-tooltip>
                  <el-tooltip content="下载代码" placement="top">
                    <el-button size="small" @click="downloadFormattedCode" :icon="Download" />
                  </el-tooltip>
                </el-button-group>
              </div>
              <pre v-if="parsedData" class="code-block">{{ formattedCode }}</pre>
              <el-empty v-else description="暂无数据" />
            </div>
          </el-scrollbar>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 错误提示 -->
    <transition name="el-fade-in-linear">
      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        effect="dark"
        class="floating-alert"
        closable
        show-icon
        @close="errorMessage = ''"
      />
    </transition>
  </div>
</template>

<script setup>
import {
  MagicStick,
  SetUp,
  DocumentCopy,
  Download,
  Delete,
  Upload,
  Search,
  ArrowDown,
  ArrowUp
} from '@element-plus/icons-vue'
import { ref, computed, watch, getCurrentInstance, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

// 定义 props
const props = defineProps({
  jsonData: {
    type: String,
    default: ''
  }
})

// 响应式数据
const jsonInput = ref(props.jsonData)
const parsedData = ref(null)
const activeTab = ref('tree')
const errorMessage = ref('')
const searchText = ref('')
const tree = ref(null)
const expandedKeys = ref([])
const indentSize = ref('2')

// 监听 jsonData 的变化
watch(() => props.jsonData, (newVal) => {
  jsonInput.value = newVal
})

// 树形结构配置
const treeProps = {
  label: 'name',
  children: 'children'
}

// 生成树形数据
const generateTreeData = (obj, parentId = 'root') => {
  if (!obj) return []
  
  return Object.entries(obj).map(([key, value], index) => {
    const nodeId = `${parentId}-${key}-${index}`
    return {
      id: nodeId,
      name: key,
      children: typeof value === 'object' && value !== null 
        ? generateTreeData(value, nodeId)
        : [{ id: `${nodeId}-value`, name: value?.toString() }]
    }
  })
}

// 解析 JSON
const parseJson = () => {
  try {
    parsedData.value = JSON.parse(jsonInput.value)
    errorMessage.value = ''
  } catch (e) {
    errorMessage.value = 'JSON 解析错误: ' + e.message
    parsedData.value = null
  }
}

// 复制到剪贴板
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(jsonInput.value)
    ElMessage.success('已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败')
  }
}

// 清空输入框
const clearInput = () => {
  jsonInput.value = ''
  parsedData.value = null
  errorMessage.value = ''
}

// 格式化 JSON
const formatJson = () => {
  try {
    const parsedJson = JSON.parse(jsonInput.value)
    jsonInput.value = JSON.stringify(parsedJson, null, 2)
    errorMessage.value = ''
  } catch (e) {
    errorMessage.value = 'JSON 格式化错误: ' + e.message
  }
}

// 下载 JSON
const downloadJson = () => {
  const blob = new Blob([jsonInput.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'data.json'
  a.click()
  URL.revokeObjectURL(url)
}

// 上传 JSON 文件
const handleFileUpload = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    jsonInput.value = e.target.result
    parseJson()
  }
  reader.readAsText(file)
  return false
}

// 搜索树节点
const handleSearch = () => {
  tree.value.filter(searchText.value)
}

const filterNode = (value, data) => {
  if (!value) return true
  return data.name.includes(value)
}

// 计算属性：生成树形数据
const treeData = computed(() => {
  return generateTreeData(parsedData.value)
})

// 树形视图相关方法
const expandAll = () => {
  if (tree.value) {
    const getAllNodeIds = (nodes) => {
      let ids = []
      if (!nodes) return ids
      
      for (const node of nodes) {
        ids.push(node.id)
        if (node.children && node.children.length > 0) {
          ids = ids.concat(getAllNodeIds(node.children))
        }
      }
      return ids
    }
    
    nextTick(() => {
      expandedKeys.value = getAllNodeIds(treeData.value)
      tree.value.store.defaultExpandedKeys = expandedKeys.value
      tree.value.store._expandedKeys = expandedKeys.value
    })
  }
}

const collapseAll = () => {
  if (tree.value) {
    expandedKeys.value = []
    tree.value.store.defaultExpandedKeys = []
    tree.value.store._expandedKeys = []
  }
}

const handleNodeClick = (data) => {
  if (!data.children) {
    ElMessage({
      message: `值: ${data.name}`,
      type: 'info'
    })
  }
}

// 添加新的计算属性
const flattenedData = computed(() => {
  if (!parsedData.value) return {}
  return flattenObject(parsedData.value)
})

const formattedCode = computed(() => {
  if (!parsedData.value) return ''
  const indent = indentSize.value === 'tab' ? '\t' : ' '.repeat(Number(indentSize.value))
  return JSON.stringify(parsedData.value, null, indent)
})

// 添加新的方法
const flattenObject = (obj, prefix = '') => {
  let result = {}
  
  for (const key in obj) {
    const value = obj[key]
    const newKey = prefix ? `${prefix}.${key}` : key
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey))
    } else {
      result[newKey] = value
    }
  }
  
  return result
}

const formatValue = (value) => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (Array.isArray(value)) return JSON.stringify(value, null, 2)
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

const copyFormattedCode = async () => {
  try {
    await navigator.clipboard.writeText(formattedCode.value)
    ElMessage.success('代码已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败')
  }
}

const downloadFormattedCode = () => {
  const blob = new Blob([formattedCode.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'formatted-code.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.json-viewer-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  height: 85vh;
  padding: 20px;
  background: var(--theme-bg-color);
  font-family: var(--theme-font-family);
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-box {
  border-radius: 8px;
  background: var(--theme-bg-color);
  border: 1px solid var(--theme-border-color);
  box-shadow: var(--theme-box-shadow-light);
}

.input-box :deep(.el-textarea__inner) {
  height: 78vh !important;
  font-family: var(--theme-code-font-family);
  font-size: 14px;
  line-height: 1.5;
  padding: 12px;
  color: var(--theme-text-color);
  background: var(--theme-bg-color);
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  gap: 12px;
}

.primary-actions {
  flex-grow: 1;
}

.secondary-actions {
  display: flex;
  gap: 8px;
}

.right-panel {
  background: var(--theme-bg-color-overlay);
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  box-shadow: var(--theme-box-shadow-light);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.smart-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.viewer-scrollbar {
  height: calc(100vh - 240px);
}

.viewer-content {
  padding: 16px;
}

.custom-tree {
  font-family: var(--theme-code-font-family);
  color: var(--theme-text-color);
}

.custom-table {
  width: 100%;
}

.custom-descriptions {
  width: 100%;
}

.search-bar {
  margin-bottom: 16px;
  position: sticky;
  top: 0;
  background: var(--theme-bg-color-overlay);
  z-index: 1;
  padding: 8px 0;
}

.key-label {
  font-weight: bold;
  color: var(--el-color-primary);
}

.value-pre {
  margin: 4px 0;
  padding: 8px;
  background: var(--el-bg-color-page);
  border-radius: 4px;
  font-family: var(--theme-code-font-family);
  font-size: 13px;
  color: var(--theme-text-color);
  white-space: pre-wrap;
  word-break: break-all;
}

.floating-alert {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 380px;
  border-radius: 8px;
  box-shadow: var(--el-box-shadow);
  z-index: 2000;
}

.view-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  position: sticky;
  top: 0;
  background: var(--theme-bg-color-overlay);
  z-index: 1;
  padding: 8px 0;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-label {
  font-weight: bold;
}

.node-value {
  color: var(--el-text-color-secondary);
  font-family: var(--theme-code-font-family);
}

/* 添加新的样式 */
.key-value-view {
  width: 100%;
}

.key-value-view :deep(.el-descriptions__label) {
  width: 200px;
  word-break: break-all;
  background-color: var(--el-bg-color-page);
}

.code-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 8px 0;
  position: sticky;
  top: 0;
  background: var(--theme-bg-color-overlay);
  z-index: 1;
}

.code-block {
  margin: 0;
  padding: 16px;
  background: var(--el-bg-color-page);
  border-radius: 4px;
  font-family: var(--theme-code-font-family);
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>