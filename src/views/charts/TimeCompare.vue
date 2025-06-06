<template>
  <div style="display: flex; width: 100%">
        <div ref="chartRef" :style="style"></div>
    <div style="width: 60vw; padding-left: 20px">
      <el-row>
        <el-col :span="24">
          <el-button circle @click="saveAsImage('运行时间对比折线图')">
            <el-icon><Download /></el-icon>
          </el-button>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="8">
          <el-card shadow="hover" class="stats-card">
            <template #header>
              <div class="card-header">
                <span>上次时间</span>
                <el-tooltip content="上次任务执行的时间统计" placement="top">
                  <el-icon><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>
            <el-statistic title="最大值 (s)" :value="formattedMaxTime" />
            <el-statistic title="最小值 (s)" :value="formattedMinTime" />
            <el-statistic title="平均值 (s)" :value="averageTime" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" class="stats-card">
            <template #header>
              <div class="card-header">
                <span>此次时间</span>
                <el-tooltip content="当前任务执行的时间统计" placement="top">
                  <el-icon><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>
            <el-statistic title="最大值 (s)" :value="formattedMaxRunTime" />
            <el-statistic title="最小值 (s)" :value="formattedMinRunTime" />
            <el-statistic title="平均值 (s)" :value="averageRunTime" />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
  
  <script setup lang="ts">
  import { ref, onMounted, watch, nextTick, onBeforeUnmount,computed } from 'vue';
  import { Download,QuestionFilled } from '@element-plus/icons-vue';
  import * as echarts from 'echarts';

  const dataEntries = computed(() => Object.values(props.data));
  const dataPointsCount = computed(() => dataEntries.value.length);
  const maxTime = computed(() => Math.max(...dataEntries.value.map(ele => ele.time) ) || 0);
const formattedMaxTime = computed(() => maxTime.value.toFixed(2));

const minTime = computed(() => Math.min(...dataEntries.value.map(ele => ele.time)) || 0);
const formattedMinTime = computed(() => minTime.value.toFixed(2));

const averageTime = computed(() => {
  const times = dataEntries.value.map(ele => ele.time);
  return times.length ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2) : '0.00';
});

const maxRunTime = computed(() => Math.max(...dataEntries.value.map(ele => ele.run_time)) || 0);
const formattedMaxRunTime = computed(() => maxRunTime.value.toFixed(2));

const minRunTime = computed(() => Math.min(...dataEntries.value.map(ele => ele.run_time)) || 0);
const formattedMinRunTime = computed(() => minRunTime.value.toFixed(2));

const averageRunTime = computed(() => {
  const runTimes = dataEntries.value.map(ele => ele.run_time);
  return runTimes.length ? (runTimes.reduce((a, b) => a + b, 0) / runTimes.length).toFixed(2) : '0.00';
});

const timeCostMoreItem = computed(()=>{
  return dataEntries.value.filter((val,idx)=>val.run_time>val.time)
})

  // 定义 props 并设置默认值
  const props = withDefaults(defineProps<{
    data: Record<string, any>;
    style?: string;
    title?: string;
    subtext?: string;
    showPercentage?: boolean;
    colors?: string[];
    legend?: any;
  }>(), {
    style: 'width: 40vw;height: 45vh;',
    title: '',
    subtext: '',
    showPercentage: false,
    colors: () => ['#5cb85c', '#d9534f', '#f0ad4e'],
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'top'
    },
  });
  
  const chartRef = ref<HTMLElement | null>(null);
  let myChart: echarts.ECharts | null = null;
  
  const buildOption = (): echarts.EChartsCoreOption => {
    const labelInterval = Math.max(1, Math.floor(dataPointsCount.value / 10)); // 计算间隔
    return {
      title: {
        text: props.title,
        subtext: props.subtext,
        left: 'center',
        textStyle: {
          fontSize: 20,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        borderWidth: 0,
        padding: [10, 15],
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#ccc',
        textStyle: {
          color: '#333'
        }
      },
      legend: props.legend,
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: Array.from({ length: dataPointsCount.value }, (_, i) => (i + 1).toString()),
        axisLabel: {
          interval: labelInterval - 1, // 根据计算的间隔显示标签
          formatter: (value: any, index: number) => index % labelInterval === 0 ? value : ''
        }
      },
      yAxis: {
        type: 'value',
        name: 'Time (s)', 
        min: 0, // 设置最小值为 0
        axisLabel: {
          formatter: '{value} s' // 格式化 y 轴标签
        }
      },
      series: [
        {
          name: '上次时间', // 系列名称
          type: 'line',
          data: dataEntries.value.map(ele => ele.time),
          itemStyle: {
            color: props.colors[0] // 应用第一个颜色
          }
        },
        {
          name: '此次时间', // 系列名称
          type: 'line',
          data: dataEntries.value.map(ele => ele.run_time),
          itemStyle: {
            color: props.colors[1] // 应用第二个颜色
          }
        }
      ]
    };
  };
  
  // 初始化图表
  const initChart = () => {
    if (chartRef.value) {
      myChart = echarts.init(chartRef.value);
      setOption();
      window.addEventListener('resize', handleResize); // 监听窗口大小变化
    }
  };
  
  // 设置图表选项
  const setOption = () => {
    if (myChart) {
      myChart.setOption(buildOption());
    }
  };
  
  // 处理窗口大小变化
  const handleResize = () => {
    if (myChart) {
      myChart.resize();
    }
  };
  
  // 保存图表为图片
  const saveAsImage = (name: string = 'chart') => {
    if (myChart) {
      const imgURL = myChart.getDataURL({
        pixelRatio: 2,
        backgroundColor: '#fff'
      });
  
      // 创建一个隐藏的 <a> 元素并触发点击事件来下载图片
      const a = document.createElement('a');
      a.href = imgURL;
      a.download = `${name}.png`; // 设置下载文件名
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  
  defineExpose({ saveAsImage });
  
  // 监听数据变化
  watch(() => props.data, () => {
    nextTick(() => {
      setOption();
    });
  }, { deep: true, immediate: true });
  
  onMounted(() => {
    nextTick(() => {
      initChart();
    });
  });
  
  onBeforeUnmount(() => {
    if (myChart) {
      myChart.dispose();
      myChart = null;
      window.removeEventListener('resize', handleResize);
    }
  });
  </script>

<style scoped>
.stats-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 添加任何必要的样式 */
</style>