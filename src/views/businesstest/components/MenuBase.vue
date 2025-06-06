<template>
  <div>
    <div v-show="!showResMenu">
      <el-table :data="paginatedItems">
        <el-table-column label="序号" width="60">
          <template #default="scope">
            {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column 
          v-for="itemProp in itemProps" 
          :key="itemProp.prop" 
          :prop="itemProp.prop" 
          :label="itemProp.label" 
          :width="itemProp.width"
        />
      </el-table>

      <div>
        <el-pagination
          background 
          layout="total, prev, pager, next, jumper"
          :total="props.items.length"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="goToPage"
        />
      </div>
    </div>
    
    <div v-show="showResMenu">
      <el-card>
        <Accuracy :data="calStatistics.accracy" title="准确率"></Accuracy>
      </el-card>
      <el-card>
        <judge-detail :data="calStatistics.judge" title="评判统计"></judge-detail>
      </el-card>
      <el-card>
        <time-compare :data="calStatistics.time" title="运行时间"></time-compare>
      </el-card>
    </div>

    <el-drawer v-model="showSidebar" title="配置" :destroy-on-close="true" :size="drawerWidth">
      <el-divider content-position="left">显示配置</el-divider>
      <switch-item 
        v-for="(item, index) in itemProps" 
        v-model="item.visible" 
        :title="item.label"
      />
      <select-item 
        v-model="pageSize as any" 
        :options="pageSizeOptions" 
        title="每页显示个数"
      />
      <el-divider />
      
      <el-space direction="vertical">
        <div class="config-btn">
          <el-button type="success" @click="handleStartAllTasksClick">
            一键执行
          </el-button>
          <el-button type="warning" @click="handleStopAllTasksClick">
            停止任务
          </el-button>
          <el-button type="primary" @click="exportToExcel(items, undefined, 'Test')">
            导入任务
          </el-button>
          <el-button type="primary" @click="exportToExcel(items, undefined, 'Test')">
            导出结果
          </el-button>
          <el-button 
            type="primary" 
            size="default" 
            @click="showResMenu = !showResMenu; showSidebar=false;"
          >
            切换到{{ showResMenu ? '查看' : '结果' }}界面
          </el-button>
        </div>
      </el-space>
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { exportToExcel } from '@/utils/excel';
import { useDirectApi } from '@/api/microService';
import { Judge, TestItem, TableColumn, JudgeAccuracyStatistics } from '@/types/index';
import { getReplyContent, getReplyType, getTime } from '@/utils/resultParser';
import SwitchItem from '@/layout/components/Settings/components/SwitchItem.vue';
import SelectItem from '@/layout/components/Settings/components/SelectItem.vue';
import { useJudgeApi } from '@/api/judge';
import { JudgeType, JudgeTypeKey, JudgeText,JudgeTypeToText } from '@/types'
import Accuracy from '@/views/charts/Accuracy.vue';
import JudgeDetail from '@/views/charts/JudgeDetail.vue';
import TimeCompare from '@/views/charts/TimeCompare.vue';
import { number } from 'echarts';

const props = defineProps({
  items: {
    type: Array as () => TestItem[],
    required: true,
    default: () => []
  },
});

const allJudgeResults = ref<Array<Judge>>([]);
const isRunning = ref(false);
const taskQueue: Array<any> = [];
const processingItem = ref();
const showResMenu = ref(false);

// 初始化配置
const initializeItems = async () => {
  props.items.forEach(item => initializeItem(item));
};

const initializeItem = (item: TestItem) => {
  item.running = false;
  item.currentStep = 0;
  item.run_result = '';
  item.run_result_type = '';
  item.run_time = 0;
};

let itemProps = ref<Array<TableColumn<TestItem>>>([
  { prop: "question", label: "问题", visible: true },
  { prop: "result", label: "结果", visible: true },
  { prop: "run_result", label: "当前运行结果", visible: true },
]);

// 队列处理相关方法
const enqueueTask = (fn: Function) => {
  taskQueue.push(fn);
  processQueue();
};

const enqueueRunTest = (item: TestItem) => {
  if (!item) {
    console.error(`任务已不存在`);
    ElMessage({ message: '该任务已不存在。', type: 'error' });
    return;
  }
  if (item.running) {
    ElMessage({ message: '该任务已经在运行中，请稍后再试。', type: 'warning' });
    return;
  }
  enqueueTask(() => runTest(item));
};

const enqueueDeleteTest = (item: TestItem) => {
  if (isRunning.value) {
    ElMessage({ message: '运行任务时无法删除任务', type: 'error' });
    return;
  }
  enqueueTask(() => deleteTest(item));
};

const processQueue = () => {
  if (taskQueue.length > 0 && !isRunning.value) {
    isRunning.value = true;
    const task = taskQueue.shift();
    task().finally(() => {
      isRunning.value = false;
      processQueue();
    });
  }
};

const generateTestItemResult = async (item: TestItem) => {
  if (!item) return;
  try {
    item.running = true;
    const response = await useDirectApi(item.question);
    item.run_result = getReplyContent(response);
    item.run_result_type = getReplyType(response);
    item.run_time = getTime(response)
  } catch (error) {
    console.error(`数据项 ${item.id} 请求失败`, error);
  } finally {
    item.currentStep = 0;
    item.running = false;
    return item;
  }
};

const runTest = async (item: TestItem) => {
  if (!item) return;
  initializeItem(item);
  processingItem.value = item;
  const testItem = await generateTestItemResult(item);
  processingItem.value = null;

  try {
    const response = await useJudgeApi(testItem as TestItem);
    const judgeResult = response.data;
    allJudgeResults.value.push(judgeResult); // 收集评判结果
  } catch (error) {
    console.error(`评判 ${item.question} 失败`, error);
  }
};

const deleteTest = async (item: TestItem) => {
  const index = props.items.findIndex(ele => ele.id === item.id);
  if (index !== -1) {
    props.items.splice(index, 1); // 删除项目
  }

  taskQueue.forEach((task, taskIdx) => {
    if (task.toString().includes(`任务 ${item.id}`)) {
      taskQueue.splice(taskIdx, 1);
    }
  });
};

const showSidebar = ref(false);
const drawerThreshold = 1; // 距离右边多少像素时显示抽屉
const drawerWidth = ref(280);
onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleMouseMove);
});

const handleMouseMove = (event: MouseEvent) => {
  const { clientX, clientY } = event;
  const windowWidth = window.innerWidth;

  if (clientX >= 0 && clientX <= windowWidth && clientY >= 0 && clientY <= window.innerHeight) {
    if (!showSidebar.value && windowWidth - clientX <= drawerThreshold) {
      showSidebar.value = true;
    } else if (showSidebar.value && windowWidth - clientX > drawerWidth.value) {
      showSidebar.value = false;
    }
  }
};

const handleStartAllTasksClick = async () => {
  if (isRunning.value) {
    ElMessage({ message: '已经有任务正在运行，请等待当前任务完成。', type: 'warning' });
    return;
  }

  // 清空之前的评判结果
  allJudgeResults.value = [];
  initializeItems()
  

  for (const item of props.items) {
    enqueueRunTest(item);
  }
};

const handleStopAllTasksClick = () => {
  if (!isRunning.value) {
    ElMessage({ message: '没有正在运行的任务。', type: 'warning' });
  } else {
    taskQueue.length = 0;
    for (const item of Object.values(props.items)) {
      item.currentStep = 0;
      item.running = false;
    }
  }
};

// 分页相关
const pageSize = ref(10);
const pageSizeOptions = ref([
  { label: '5项', value: 5 },
  { label: '10项', value: 10 },
  { label: '20项', value: 20 },
  { label: '30项', value: 30 },
  { label: '50项', value: 50 },
  { label: '100项', value: 100 },
]);
const currentPage = ref(1);
const totalPages = computed(() => Math.ceil(props.items.length / pageSize.value));

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return props.items.slice(start, end);
});

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const calStatistics = computed(() => {
  const stats = {
    accracy: {
      success: [],
      error: [],
      suspicious: [],
    },
    judge: JudgeText.reduce((acc:Record<string,any>,item)=>{
      acc[item] = []
      return acc
    },{}),
    time: props.items.map((ele)=>{
      return {
        question:ele.question,
        time:ele.time,
        run_time:ele.run_time?ele.run_time:0,
      }
    })
  };
  allJudgeResults.value.forEach(result => {
    const judge_results = result.judge_results
    let addFlag = false
    for(const res of judge_results){
      if(res.judge_type === JudgeType.SUCCESS){
        if(!addFlag){
          stats.accracy.success.push(result)
          addFlag = true
        }
      }
      else if(res.judge_type === JudgeType.SUSPICIOUS){
        if(!addFlag){
          stats.accracy.suspicious.push(result)
          addFlag = true
        }
      }
      else{
        if(!addFlag){
          stats.accracy.error.push(result)
          addFlag = true
        }
      }
      const judgeText = JudgeTypeToText(res.judge_type)
      if (!(judgeText in stats.judge)){
        stats.judge[judgeText] = []
      }
      stats.judge[judgeText].push(res)
    }
  });
  return stats;
});

initializeItems();
</script>

<style lang="scss">
.config-btn {
  button {
    width: 100%;
    margin-top: 10px;
  }

  .el-button + .el-button {
    margin-left: 0;
  }
}

.pagination-config {
  margin-top: 20px;

  label {
    margin-right: 10px;
  }

  select {
    padding: 8px;
    border: 1px solid;
    border-radius: 5px;
  }
}


@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    position: static;
    right: auto;
  }

  .sidebar.active {
    display: block;
  }

  .sidebar-toggle-area {
    display: none;
  }
}
</style>