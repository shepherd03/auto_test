import service from '@/utils/request'
// 获取所有预设规则
export const useJsonComparePresetsApi = (): Promise<ResponseContent<Array<JsonCompareRulesContent>>> => {
	return service.get('/api/json-compare/presets')
}

// 保存预设规则
export const saveJsonComparePresetApi = (name: string, rules: JsonCompareRules): Promise<ResponseContent<JsonCompareRulesContent>> => {
	return service.post('/api/json-compare/presets', { name, rules })
}

// 删除预设规则
export const deleteJsonComparePresetApi = (name: string): Promise<{ code: number; msg: string; data: { name: string } | null }> => {
	return service.delete(`/api/json-compare/presets/${encodeURIComponent(name)}`)
}

// 更新预设规则
export const updateJsonComparePresetApi = (name: string, rules: JsonCompareRules): Promise<{ code: number; msg: string; data: { name: string; rules: JsonCompareRules } | null }> => {
	return service.put(`/api/json-compare/presets/${encodeURIComponent(name)}`, { rules })
}

// 获取预设规则列表（仅包含基本信息）
export const getJsonComparePresetListApi = (): Promise<{ code: number; msg: string; data: Array<{ id: number; name: string; createTime: string; updateTime: string }> | null }> => {
	return service.get('/api/json-compare/presets/list')
}

// 根据名称获取单个预设规则
export const getJsonComparePresetByNameApi = (name: string): Promise<{ code: number; msg: string; data: { id: number; name: string; rules: JsonCompareRules; createTime: string; updateTime: string } | null }> => {
	return service.get(`/api/json-compare/presets/${encodeURIComponent(name)}`)
}