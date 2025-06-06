import { createRouter, createWebHistory, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import store from '@/store'
import { i18n } from '@/i18n'
import { pathToCamel } from '@/utils/tool'

NProgress.configure({ showSpinner: false })

const constantRoutes: RouteRecordRaw[] = [
	{
		path: '/redirect',
		component: () => import('../layout/index.vue'),
		children: [
			{
				path: '/redirect/:path(.*)',
				component: () => import('../layout/components/Router/Redirect.vue')
			}
		]
	},
	{
		path: '/404',
		component: () => import('../views/404.vue')
	},
]

const asyncRoutes: RouteRecordRaw = {
	path: '/',
	component: () => import('../layout/index.vue'),
	redirect: '/home',
	children: [
		{
			path: '/home',
			name: 'Home',
			component: () => import('../views/home.vue'),
			meta: {
				title: i18n.global.t('router.home'),
				affix: true
			}
		},
	]
}

export const errorRoute: RouteRecordRaw = {
	path: '/:pathMatch(.*)',
	redirect: '/404'
}

export const router = createRouter({
	history: createWebHashHistory(),
	routes: constantRoutes
})

let isload = false
// 路由加载前
router.beforeEach(async (to, from, next) => {
	NProgress.start()

	if (!isload) {
		const menuRoutes = await store.routerStore.getMenuRoutes()

		// 根据后端菜单路由，生成KeepAlive路由
		const keepAliveRoutes = getKeepAliveRoutes(menuRoutes, [])

		// 添加菜单路由
		asyncRoutes.children?.push(...keepAliveRoutes)
		router.addRoute(asyncRoutes)

		// 错误路由
		router.addRoute(errorRoute)

		// 保存路由数据
		store.routerStore.setRoutes(constantRoutes.concat(asyncRoutes))

		// 搜索菜单需要使用
		store.routerStore.setSearchMenu(keepAliveRoutes)
		isload = true
		next({ ...to, replace: true })
	} else {
		next()
	}

})

// 路由加载后
router.afterEach(() => {
	NProgress.done()
})

// 获取扁平化路由，将多级路由转换成一级路由
export const getKeepAliveRoutes = (rs: RouteRecordRaw[], breadcrumb: string[]): RouteRecordRaw[] => {
	const routerList: RouteRecordRaw[] = []

	rs.forEach((item: any) => {
		if (item.meta.title) {
			breadcrumb.push(item.meta.title)
		}

		if (item.children && item.children.length > 0) {
			routerList.push(...getKeepAliveRoutes(item.children, breadcrumb))
		} else {
			item.meta.breadcrumb.push(...breadcrumb)
			routerList.push(item)
		}

		breadcrumb.pop()
	})
	return routerList
}

// 加载vue组件
const layoutModules = import.meta.glob('/src/views/**/*.vue')

// 根据路径，动态获取vue组件
const getDynamicComponent = (path: string): any => {
	const component = layoutModules[`/src/views/${path}.vue`]
	if (!component) {
		console.error('没有正确获取到以下路由的组件:', path)
	}
	return component
}

// 根据菜单列表，生成路由数据
export const generateRoutes = (menuList: any): RouteRecordRaw[] => {
	const routerList: RouteRecordRaw[] = []

	menuList.forEach((menu: any) => {
		let component
		let path
		// 对于没有子菜单的菜单项，使用 getDynamicComponent 函数来动态获取组件。
		// 对于有子菜单的菜单项，则使用布局组件（例如 @/layout/index.vue）。
		if (menu.children && menu.children.length > 0) {
			component = () => import('@/layout/index.vue')
			path = '/p/' + menu.id
		} else {
			component = getDynamicComponent(menu.url)
			path = '/' + menu.url
		}
		const route: RouteRecordRaw = {
			path: path,
			name: pathToCamel(path),
			component: component,
			children: [],
			meta: {
				title: menu.name,
				icon: menu.icon,
				id: '' + menu.id,
				cache: true,
				_blank: menu.openStyle === 1,
				breadcrumb: []
			}
		}

		// 有子菜单的情况
		if (menu.children && menu.children.length > 0) {
			route.children?.push(...generateRoutes(menu.children))
		}

		routerList.push(route)
	})

	return routerList
}
