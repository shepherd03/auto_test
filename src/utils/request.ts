import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import qs from 'qs'
import { ElMessage } from 'element-plus'
import store from '@/store'
import cache from '@/utils/cache'

// axios实例
const service = axios.create({
	baseURL: import.meta.env.VITE_API_URL as any,
	timeout: 60000,
	headers: { 'Content-Type': 'application/json;charset=UTF-8' }
})

// 请求拦截器
service.interceptors.request.use(
	(config: any) => {
		config.headers['Accept-Language'] = cache.getLanguage()

		// 追加时间戳，防止GET请求缓存
		if (config.method?.toUpperCase() === 'GET') {
			config.params = { ...config.params, t: new Date().getTime() }
		}

		if (Object.values(config.headers).includes('application/x-www-form-urlencoded')) {
			config.data = qs.stringify(config.data)
		}

		return config
	},
	error => {
		return Promise.reject(error)
	}
)

// 响应拦截器
// modify
service.interceptors.response.use(
	response => {
		if (response.status < 200 || response.status >= 300) {
			return Promise.reject(new Error(response.data.msg))
		}

		const res = response.data
		// 响应成功
		if (res.code === 1) {
			ElMessage.error(res.data.msg)
			return Promise.reject(new Error(res.msg || 'Error'))
		}
		// 没有权限，如：未登录、登录过期等，需要跳转到登录页
		if (res.code === 401) {
			location.reload()
		}
		return res
	},
	error => {
		return Promise.reject(error)
	}
)

// 导出 axios 实例
export default service

// 使用TypeScript接口定义请求和响应的类型
interface ApiResponse<T> {
	data: T;
	status: number;
	statusText: string;
}

export function fetchData<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
	return axios.get<T>(url, config)
		.then((response: AxiosResponse<T>) => {
			return {
				data: response.data,
				status: response.status,
				statusText: response.statusText
			};
		})
		.catch(error => {
			console.error('Request failed:', error);
			throw error;
		});
}
