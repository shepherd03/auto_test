<template>
  <div class="compare-test-container">
    <div class="main-content">
      <!-- 左侧面板 - 测试配置 -->
      <div class="left-panel">
        <div class="panel-content">
          <el-card class="test-config-card">
            <template #header>
              <div class="panel-header">
                <span>测试配置</span>
              </div>
            </template>

            <el-form :model="formTestInput" label-position="top">
              <el-form-item label="输入内容">
                <el-input
                  v-model="formTestInput"
                  type="textarea"
                  :rows="6"
                  placeholder="请输入测试内容"
                />
              </el-form-item>

              <el-form-item label="选择服务 A">
                <el-select v-model="firstService" placeholder="请选择服务 A" value-key="name">
                  <el-option 
                    v-for="service in services" 
                    :label="service.name" 
                    :value="service">
                  </el-option>
                </el-select>
              </el-form-item>

              <el-form-item label="选择服务 B">
                <el-select v-model="secondService" placeholder="请选择服务 B" value-key="name">
                  <el-option 
                    v-for="service in services" 
                    :label="service.name" 
                    :value="service">
                  </el-option>
                </el-select>
              </el-form-item>

              <div class="action-buttons">
                <el-button 
                  type="primary" 
                  :loading="isLoading" 
                  @click="handleCompare"
                  :disabled="!canCompare"
                >
                  发送请求并比较
                </el-button>
                <el-button @click="resetForm">重置</el-button>
              </div>
            </el-form>
          </el-card>
        </div>
      </div>

      <!-- 右侧面板 - JSON比较 -->
      <div class="right-panel">
        <div class="panel-content">
          <el-card class="json-compare-card">
            <template #header>
              <div class="panel-header">
                <span>接口响应比较</span>
              </div>
            </template>
            <JsonCompare 
                class="json-compare"
                ref="jsonCompareRef"
                :leftTitle="firstService?.name || 'JSON A'"
                :rightTitle="secondService?.name || 'JSON B'"
            />
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import JsonCompare from '@/views/utils/JsonCompare.vue'
import { useMicroService } from '@/composables/useMicroService'

const {
   services,
   firstService,
   secondService,
   runFirstService,
   runSecondService
} = useMicroService()

// 表单配置
const formTestInput = ref('')

// 状态管理
const isLoading = ref(false)
const jsonCompareRef = ref<InstanceType<typeof JsonCompare>>()

// 计算属性
const canCompare = computed(() => {
  return (
    formTestInput.value.trim() !== '' && 
    firstService.value && 
    firstService.value &&
    firstService.value !== firstService.value
  )
})

// 方法
const handleCompare = async () => {
  if (!canCompare.value) {
    ElMessage.warning('请完成所有必填项，并确保选择了两个不同的服务')
    return
  }

  isLoading.value = true
  
  try {
    // 准备输入数据
    const input = formTestInput.value
    console.log('Input:', input)
    // 并行发送两个请求
    const [responseA, responseB] = await Promise.all([
      runFirstService(input),
      runSecondService(input)
    ])

    // 设置JSON比较组件的内容
    if (jsonCompareRef.value) {
      jsonCompareRef.value.setJsonContent(JSON.stringify(responseA?.data ?? {}, null, 2),'left',
      )

      jsonCompareRef.value.setJsonContent(JSON.stringify(responseB?.data ?? {}, null, 2),'right',
      )
      
      // 自动开始比较
      jsonCompareRef.value.compareJson()
    }
    
    ElMessage.success('请求成功，已加载比较结果')
  } catch (error: any) {
    ElMessage.error(`请求失败: ${error.message || '未知错误'}`)
    console.error('请求错误:', error)
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  formTestInput.value = ''
  
  // 清空JSON比较组件
  if (jsonCompareRef.value) {
    jsonCompareRef.value.setJsonContent('', 'left')
    jsonCompareRef.value.setJsonContent('', 'right')
  }
}

// 生命周期钩子
onMounted(() => {
  // 初始化逻辑
})
</script>

<style scoped>
.compare-test-container {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.main-content {
  display: flex;
  height: 85vh;
  gap: 20px;
}

.left-panel {
  width: 30%;
  min-width: 300px;
  display: flex;
  flex-direction: column;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.panel-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.test-config-card,
.json-compare-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
}

.json-compare {
  height: 100%;
  overflow: hidden;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: auto; /* 关键属性，将按钮推到容器底部 */
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }
  
  .left-panel {
    width: 100%;
    min-width: unset;
    margin-bottom: 20px;
  }
  
  .right-panel {
    width: 100%;
  }
}
</style>