import { type EChartsCoreOption } from "echarts";

export const defaultChartOptions: EChartsCoreOption = {
    // 在这里定义默认的图表选项
    title: {
        text: 'ECharts  '
    },
    tooltip: {},
    xAxis: {
        data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子']
    },
    yAxis: {},
    series: [
        {
            name: '销量',
            type: 'bar',
            data: [5, 20, 36, 10, 10, 20]
        }
    ]
};