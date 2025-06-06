<template>
  <!-- 当 items 为空时显示文件加载区域 -->
  <excel-drop-area v-if="showUploadArea" @afterFileLoaded="afterFileLoaded" />
  <menu-base v-else :items="items" :allowDelete="true"/>
</template>

<script setup>
import { ref, computed } from 'vue';
import MenuBase from './components/MenuBase.vue';
import ExcelDropArea from '@/components/Excel/ExcelDropArea.vue';

const items = ref([]);

const constructItem = (question) => ({
  question: question,
});

const afterFileLoaded = (data) => {
  for (const dataItem of data) {
    const question = dataItem['问题'];
    items.value.push(constructItem(question));
  }
};

// 计算属性，判断是否显示文件加载区域
const showUploadArea = computed(() => items.value.length === 0);
</script>