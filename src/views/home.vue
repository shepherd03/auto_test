<template>
	<el-card class="layout-home">
	  <h2>介绍</h2>
	  <p>e点智询测试平台是基于Vue3、TypeScript、Element Plus、Vue Router、Pinia、Axios、Vite等技术开发的内部管理工具。</p>
	  <p>该平台旨在简化内部工作流程，并确保数据的安全性和准确性。</p>
	  <p>平台采用模块化设计，易于维护和扩展，以适应不断变化的业务需求。</p>
  
	  <h2>功能特点</h2>
	  <el-row gutter={20}>
		<el-col v-for="(feature, index) in features" :key="index" :span="24">
		  <el-card class="feature-card">
			<h3>{{ feature.title }}</h3>
			<p>{{ feature.description }}</p>
		  </el-card>
		</el-col>
	  </el-row>
  
	  <h2>使用指南</h2>
	  <p>暂无</p>
	</el-card>
  </template>
  
  <script setup>
  const features = [
	{ title: "自动美化表格功能", description: "一键优化表格布局，提升数据展示的专业性和美观度。" },
	{ title: "自动生成问题功能", description: "根据用户输入的关键信息，智能生成相关问题，提高问题解决效率。" },
	{ title: "导出Excel功能", description: "支持将数据导出为Excel文件，方便数据的进一步处理和分析。" },
	{ title: "自动测试功能", description: "提供自动化测试工具，减少人工测试的工作量，提高测试效率和准确性。" },
	{ title: "测试模式调整", description: "支持根据不同测试需求调整测试模式，灵活应对不同的测试场景。" },
  ]
  </script>
  
  <style scoped>
  .layout-home {
	line-height: 1.5;
	padding-left: 20px;
  }
  
  .layout-home h2 {
	margin: 10px 0;
  }
  
  .layout-home p {
	margin-bottom: 12px;
  }
  
  .feature-card {
	padding: 12px;
	border-radius: 8px;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  
  .feature-card h3 {
	margin-bottom: 10px;
  }
  
  .feature-card p {
	color: var(--theme-menu-text-color);
  }
  </style>
  