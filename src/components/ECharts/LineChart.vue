<template>
  <div style="display: flex;">
    <div ref="chartRef" :style="style"></div>
    <div>
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

// 定义 props 并设置默认值
const props = withDefaults(defineProps<{
  data?: Array<{ value: number; name: string }>;
  style?: string;
  title?: string;
  subtext?: string;
  showPercentage?: boolean;
  colors?: string[];
  legend?: boolean;
  onClick?: (params: echarts.EChartsEventObject) => void;
}>(), {
  style: 'width: 40vw; height: 40vh;',
  data: () => [],
  title: '折线图',
  subtext: '',
  showPercentage: false,
  colors: () => ['#c23531', '#2f4554', '#61a0a8', '#d48265', '#91c7ae'],
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  onClick: () => {}
});

const chartRef = ref<HTMLElement | null>(null);
let myChart: echarts.ECharts | null = null;

// 构建饼状图的选项
const buildOption = (): echarts.EChartsOption => {
  return {
    dataset: props.data
    title: {
      text: props.title
    }
  }
}

// 初始化图表
const initChart = () => {
  if (chartRef.value) {
    myChart = echarts.init(chartRef.value);
    setOption();
    // 添加点击事件监听器
    if (props.onClick) {
      myChart.on('click', props.onClick);
    }
  }
};

// 设置图表选项
const setOption = () => {
  if (myChart) {
    myChart.setOption(buildOption());
  }
};

const saveAsImage = (name:string = 'chart') => {
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

// 监听数据的变化并更新图表
watch(
  () => [props.data, props.title, props.showPercentage, props.colors, props.legend, props.labelStyle],
  () => {
    nextTick(() => {
      setOption();
    });
  },
  { deep: true }
);

onMounted(() => {
  nextTick(() => {
    initChart();
  });
});

// 确保在组件卸载时正确销毁图表实例和事件监听器
onBeforeUnmount(() => {
  if (myChart) {
    myChart.off('click'); // 移除点击事件监听器
    myChart.dispose();
    myChart = null;
  }
});
</script>