# JSON比较器组件使用文档

## 组件概述

`JsonCompare`是一个功能强大的JSON比较工具组件，可以帮助用户比较两个JSON数据的差异，并提供直观的差异展示和统计信息。该组件已经被重构为可复用的模块，可以轻松地集成到其他组件或页面中。

## 组件特性

- 支持两个JSON数据的比较和差异展示
- 提供差异统计信息（新增、删除、修改）
- 支持自定义比较规则（忽略数组顺序、忽略大小写等）
- 支持规则预设的保存和加载
- 支持比较结果的导出
- 响应式设计，适配不同屏幕尺寸

## 使用方式

### 1. 直接使用JsonCompare组件

```vue
<template>
  <div>
    <JsonCompare 
      ref="jsonCompareRef"
      :initialLeftJson="leftJsonData" 
      :initialRightJson="rightJsonData"
      :leftTitle="'数据A'"
      :rightTitle="'数据B'"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import JsonCompare from '@/views/utils/JsonCompare.vue'

const jsonCompareRef = ref()
const leftJsonData = ref('{"name": "测试数据A"}')
const rightJsonData = ref('{"name": "测试数据B"}')

// 调用组件方法示例
function startCompare() {
  jsonCompareRef.value.compareJson()
}

function exportCompareResult() {
  jsonCompareRef.value.exportResults()
}

function getResults() {
  const results = jsonCompareRef.value.getComparisonResult()
  console.log('比较结果:', results)
}
</script>
```

### 2. 使用useJsonCompare组合式函数

如果您需要在自定义组件中使用JSON比较功能，可以直接使用`useJsonCompare`组合式函数：

```vue
<template>
  <div>
    <!-- 自定义UI，使用组合式函数提供的状态和方法 -->
    <div class="json-inputs">
      <textarea v-model="leftJson" @input="() => handleUpdateJsonStats('left')"></textarea>
      <textarea v-model="rightJson" @input="() => handleUpdateJsonStats('right')"></textarea>
    </div>
    
    <button @click="compareJson" :disabled="!canCompare">比较JSON</button>
    
    <div v-if="comparisonResult">
      <h3>发现 {{ differences.length }} 处差异</h3>
      <div v-for="(diff, index) in differences" :key="index">
        <p>{{ diff.path }}: {{ diff.type }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useJsonCompare } from '@/composables/useJsonCompare'

// 使用组合式函数
const {
  leftJson,
  rightJson,
  comparisonResult,
  differences,
  canCompare,
  handleUpdateJsonStats,
  compareJson
} = useJsonCompare({
  initialLeftJson: '{"example": "data"}',
  initialRightJson: '{"example": "modified"}',
  leftTitle: '原始数据',
  rightTitle: '新数据'
})
</script>
```

### 3. 使用预设管理功能

如果需要使用预设管理功能，可以结合`useJsonComparePresets`组合式函数：

```vue
<script setup lang="ts">
import { useJsonCompare } from '@/composables/useJsonCompare'
import { useJsonComparePresets } from '@/composables/useJsonComparePresets'

// 使用JSON比较组合式函数
const {
  customRules,
  // ... 其他状态和方法
} = useJsonCompare()

// 使用预设管理组合式函数
const {
  selectedPreset,
  availablePresets,
  loadAvailablePresets,
  saveRulesPreset
} = useJsonComparePresets()

// 加载预设
function loadSelectedPreset() {
  if (selectedPreset.value && availablePresets.value[selectedPreset.value]) {
    customRules.value = availablePresets.value[selectedPreset.value]
  }
}

// 保存当前规则为预设
function savePreset() {
  saveRulesPreset(customRules.value.rules)
}

// 初始化时加载预设列表
onMounted(() => {
  loadAvailablePresets()
})
</script>
```

## 组件属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| initialLeftJson | String | '' | 左侧JSON初始数据 |
| initialRightJson | String | '' | 右侧JSON初始数据 |
| leftTitle | String | 'JSON A' | 左侧面板标题 |
| rightTitle | String | 'JSON B' | 右侧面板标题 |

## 组件方法

| 方法名 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| setJsonContent | (content: string, side: 'left' \| 'right') | void | 设置指定侧的JSON内容 |
| getComparisonResult | () | Object | 获取比较结果 |
| compareJson | () | void | 执行JSON比较 |
| exportResults | () | void | 导出比较结果 |
| resetRules | () | void | 重置比较规则 |

## useJsonCompare组合式函数

### 参数

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| initialLeftJson | String | '' | 左侧JSON初始数据 |
| initialRightJson | String | '' | 右侧JSON初始数据 |
| leftTitle | String | 'JSON A' | 左侧面板标题 |
| rightTitle | String | 'JSON B' | 右侧面板标题 |

### 返回值

返回一个包含多个响应式状态和方法的对象，可用于自定义UI实现。主要包括：

- **状态**：leftJson, rightJson, differences, comparisonResult等
- **计算属性**：canCompare, addedCount, removedCount, modifiedCount等
- **方法**：compareJson, formatJson, exportResults等

## useJsonComparePresets组合式函数

用于管理JSON比较规则预设，提供以下功能：

- **loadAvailablePresets**：加载所有可用的预设
- **saveRulesPreset**：保存当前规则为预设
- **deletePreset**：删除预设
- **updatePreset**：更新预设

## 实际应用示例

以下是在业务测试组件中使用JsonCompare组件的示例：

```vue
<template>
  <div class="compare-test-container">
    <!-- 测试表单 -->
    <el-card class="test-form">
      <template #header>
        <h3>API响应比较测试</h3>
      </template>
      
      <el-form :model="formData" label-width="120px">
        <!-- 表单内容 -->
        <el-form-item>
          <el-button type="primary" @click="handleCompare" :disabled="!canCompare">
            <el-icon><VideoPlay /></el-icon>发送请求并比较
          </el-button>
          <el-button @click="resetForm">
            <el-icon><RefreshRight /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- JSON比较器组件 -->
    <div class="json-compare-container" v-if="showCompare">
      <JsonCompare 
        ref="jsonCompareRef"
        :initialLeftJson="responseA" 
        :initialRightJson="responseB"
        :leftTitle="serviceALabel"
        :rightTitle="serviceBLabel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import JsonCompare from '@/views/utils/JsonCompare.vue'

// 组件状态
const jsonCompareRef = ref()
const responseA = ref('')
const responseB = ref('')
const serviceALabel = ref('服务A响应')
const serviceBLabel = ref('服务B响应')
const showCompare = ref(false)

// 处理比较逻辑
async function handleCompare() {
  // 发送API请求获取响应数据
  // ...
  
  // 显示比较组件并设置数据
  showCompare.value = true
  
  // 等待DOM更新后执行比较
  await nextTick()
  jsonCompareRef.value.compareJson()
}
</script>
```

## 注意事项

1. 确保传入的JSON字符串格式正确，否则可能导致解析错误
2. 对于大型JSON数据，比较操作可能需要一定时间
3. 自定义规则会影响比较结果，请根据实际需求设置
4. 组件高度默认为100vh，可能需要根据实际布局调整

## 未来优化方向

1. 支持更多的比较规则和选项
2. 优化大型JSON数据的比较性能
3. 提供更多的导出格式选项
4. 增加JSON路径查询功能