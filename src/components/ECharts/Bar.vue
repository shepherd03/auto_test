<template>
  <div ref="chartRef" :style="style"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

// 定义 props 并设置默认值
const props = withDefaults(defineProps<{
  option?: echarts.EChartsOption;
  style?: string;
}>(), {
  style: 'width: 1000px; height: 600px;', // 默认样式
  option: () => ({}) // 默认空选项
});

const chartRef = ref<HTMLElement | null>(null);
let myChart: echarts.ECharts | null = null;

// 初始化图表
const initChart = () => {
  if (chartRef.value && props.option) {
    myChart = echarts.init(chartRef.value);
    setOption(props.option);
  }
};

// 设置图表选项
const setOption = (option: echarts.EChartsOption) => {
  if (myChart) {
    myChart.setOption(option);
  }
};

// 监听 option 的变化并更新图表
watch(
  () => props.option,
  (newOption) => {
    if (newOption) {
      nextTick(() => {
        setOption(newOption);
      });
    }
  },
  { deep: true }
);

onMounted(() => {
  nextTick(() => {
    initChart();
  });
});

// 确保在组件卸载时正确销毁图表实例
onBeforeUnmount(() => {
  if (myChart) {
    myChart.dispose();
    myChart = null;
  }
});
</script>