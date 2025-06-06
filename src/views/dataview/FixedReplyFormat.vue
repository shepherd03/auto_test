<template>
    <div>
      <el-alert 
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon 
        class="mt-4"
      />
   
      <JsonViewer 
        :jsonData="jsonData"
        class="mt-6"
      />
    </div>
  </template>
   
  <script setup>
  import { ref, onMounted } from 'vue';
  import JsonViewer from '../utils/JsonViewer.vue';
  import { useFixedReplyFormat } from '@/api/dataView'; 
   
  const jsonData = ref(null);
  const errorMessage = ref('');
   
  onMounted(async () => {
    const { data } = await useFixedReplyFormat()
    jsonData.value = data
  });
  </script>