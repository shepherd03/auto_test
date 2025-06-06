<template>
  <div style="display: flex;">
    <div ref="chartRef" :style="style"></div>
    <div style="width: 60vw; padding-left: 20px; height: 40vh;">
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <el-table :data="tableData" height="45vh" border>
            <!-- 判定类型列 -->
            <el-table-column prop="judge_name" label="判定类型" width="120"></el-table-column>

            <!-- 嵌套表格列，用来展示 judge_info -->
            <el-table-column label="判定信息">
              <template #default="scope">
                <!-- 嵌套表格 -->
                <el-table :data="scope.row.judge_info" border style="width: 100%;">
                  <!-- 展示 judge_info 中的各个字段 -->
                  <el-table-column label="问题描述" prop="description"></el-table-column>
                  <el-table-column label="预期结果" prop="expected"></el-table-column>
                  <el-table-column label="实际结果" prop="actual"></el-table-column>
                  <el-table-column label="附加信息" prop="additional_info">
                    <template #default="scope">
                      <div v-for="info in scope.row.additional_info">
                        <div>{{ Object.entries(info)[0][0] }} : {{ Object.entries(info)[0][1] }}</div>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
  
  <script setup lang="ts">
  import { ref, onMounted, watch, nextTick, onBeforeUnmount,computed } from 'vue';
  import * as echarts from 'echarts';
  
  const tableData = computed(() => {
  let res: Array<any> = [];
  for (const key of Object.keys(props.data)) {
    if (key === '成功') continue;
    res = res.concat(props.data[key].map(val => {
      return val; // 每个元素包含 judge_info 数组
    }));
  }
  console.log(res)
  return res;
});
  // 定义 props 并设置默认值
  const props = withDefaults(defineProps<{
    data: Record<string, Array<any>>;
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
      right: 'right', // 将 legend 放在右侧
      top: 'top' // 将 legend 放在顶部
    },
  });
  
  const chartRef = ref<HTMLElement | null>(null);
  let myChart: echarts.ECharts | null = null;
  
  const buildOption = (): echarts.EChartsCoreOption => {
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
        trigger: 'item',
        borderWidth: 0, // 去除边框
        padding: [10, 15], // 增加内边距
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // 设置提示框背景色
        borderColor: '#ccc', // 设置提示框边框颜色
        textStyle: {
          color: '#333' // 提示框文字颜色
        }
      },
      legend: props.legend,
      grid: {
        left: '3%', // 调整网格左边距
        right: '15%', // 调整网格右边距，留出空间给 legend
        bottom: '3%',
        containLabel: true // 确保标签在网格内
      },
      xAxis: {
        type: 'category',
        data: Object.keys(props.data),
        axisLabel: {
          interval: 0,
          margin: 10,
          fontSize: 12,
          formatter: (value: string) => {
            return value.length > 5 ? `${value.slice(0, 4)}\n${value.slice(4)}` : value;
          }
        },
        axisLine: {
          lineStyle: {
            color: '#ccc'
          }
        },
        axisTick: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        name: '个数',
        axisLabel: {
          formatter: '{value}',
        },
        axisLine: {
          show: false
        },
        splitLine: {
          lineStyle: {
            type: 'dashed',
            color: '#ddd'
          }
        }
      },
      series: [
        {
          type: 'bar',
          data: Object.values(props.data).map(ele => ele.length),
          barWidth: '60%', // 控制柱子的宽度
          itemStyle: {
            borderRadius: [5, 5, 0, 0], // 圆角柱子
            color: new echarts.graphic.LinearGradient(
              0, 0, 0, 1, // 渐变方向
              [
                { offset: 0, color: props.colors[0] }, // 渐变起始颜色
                { offset: 1, color: '#fff' } // 渐变结束颜色
              ]
            )
          },
          label: {
            show: true,
            position: 'top',
            color: '#333',
            fontSize: 12,
            formatter: '{c}'
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
  
  watch(
  () => props.data,
  () => {
    nextTick(() => {
      setOption();
    });
  },
  { deep: true, immediate: true } 
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
      window.removeEventListener('resize', handleResize);
    }
  });
  </script>

<style scoped>

</style>