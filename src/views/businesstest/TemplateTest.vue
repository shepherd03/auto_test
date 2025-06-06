<template>
  <menu-base :items="items"/>
</template>

<script setup>
import MenuBase from './components/MenuBase.vue';
import {onMounted ,ref} from 'vue'
import { useTemplateQuestionApi } from '@/api/templateQuestion';

const items = ref([]);

const loadQuestions = async () => {
  try {
    const response = await useTemplateQuestionApi();
    items.value = response.data;
    console.log(items.value)
  } catch (error) {
    console.error('加载问题失败:', error);
  }
}
loadQuestions()

</script>

