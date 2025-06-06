import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'

import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import vueSetupExtend from 'vite-plugin-vue-setup-extend'

// 参考：https://cn.vitejs.dev/config/
export default defineConfig({
	// 基础公共路径
	base: './',

	// 静态资源目录
	publicDir: 'public',

	// 解析配置
	resolve: {
		// 路径别名
		alias: {
			'@': resolve(__dirname, './src'),
			'@types': resolve(__dirname, './types'),
			'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js'
		}
	},

	// 插件配置
	plugins: [
		vue(),  // Vue 3 单文件组件支持
		vueSetupExtend(),  // <script setup> 支持 name 属性
		Components({  // 自动导入组件
			resolvers: [
				ElementPlusResolver()
			]
		}),
		AutoImport({
			imports: [
				'vue',
				'vue-router',
				'pinia',
				'@vueuse/core'
			],
			resolvers: [
				ElementPlusResolver()
			],
			// 自动导入目录
			dirs: [
				'src/types/**',
				'src/utils'
			],
			// 生成类型声明文件
			dts: 'src/auto-imports.d.ts',
			// ESLint 支持
			eslintrc: {
				enabled: true,
			},
		}),
		createSvgIconsPlugin({  // SVG 图标处理
			iconDirs: [resolve(__dirname, 'src/icons/svg')],  // 图标目录
			symbolId: 'icon-[dir]-[name]'  // 图标 ID 格式
		})
	],

	// 开发服务器配置
	server: {
		proxy: {  // 代理配置
			'/api': {
				target: 'http://localhost:8396/',  // 后端地址
				changeOrigin: true,  // 改变源
				rewrite: (path) => path.replace(/^\/api/, '')  // 路径重写
			}
		},
		host: '0.0.0.0',  // 监听所有地址
		port: 8395,  // 端口号
		open: true  // 自动打开浏览器
	}
})
