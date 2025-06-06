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
  data: Record<string,number>;
  style?: string;
  title?: string;
  subtext?: string;
  showPercentage?: boolean;
  colors?: string[];
  legend?: any;
}>(), {
  style: 'width: 40vw; height: 40vh;',
  title: '',
  subtext: '',
  showPercentage: false,
  colors: () => ['#5cb85c', '#d9534f ', '#f0ad4e'],
  legend: {
    orient: 'vertical',
    left: 'left'
  },
});

const chartRef = ref<HTMLElement | null>(null);
let myChart: echarts.ECharts | null = null;

// 构建饼状图的选项
const buildPieOption = (): echarts.EChartsCoreOption => {
  const pieData = Object.entries(props.data).map(([name, value]) => ({ name, value }));
  return {
  title: {
    text: props.title,
    subtext: props.subtext,
    left: 'center',
    textStyle: {
      fontSize: 20,
    }
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)',
    borderWidth: 1,
    padding: [5, 10],
  },
  legend: props.legend,
  color: props.colors,
  series: [
    {
      type: 'pie',
      radius: '60%',
      data: pieData,
      label: {
        show: true,
        position: 'outside',
        formatter: '{b}: {c} ({d}%)',
      },
      labelLine: {
        show: true,
        length: 20,
        length2: 30,
        lineStyle: {
          width: 1
        }
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
    }
  ]
  }
};

// 初始化图表
const initChart = () => {
  if (chartRef.value) {
    myChart = echarts.init(chartRef.value);
    setOption();
  }
};

// 设置图表选项
const setOption = () => {
  if (myChart) {
    myChart.setOption(buildPieOption());
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
  () => props.data,
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

onBeforeUnmount(() => {
  if (myChart) {
    myChart.dispose();
    myChart = null;
  }
});
</script>