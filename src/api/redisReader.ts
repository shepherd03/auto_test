import service from "@/utils/request";

export const useTemplate = () => {
    return service.get('/api/redis/template')
}

export const useZbcjData = () => {
    return service.get('/api/redis/zbcj')
}

// 标准部门组织列表 
export const useStandardDivOrgList = () => {
    return service.get('/api/redis/standard_div_org_list')
}

// 标准市场组织列表 
export const useStandardMktOrgList = () => {
    return service.get('/api/redis/standard_mkt_org_list')
}

// 维度配置接口 
export const useDimen = () => {
    return service.get('/api/redis/dimen')
}

export const useGdhf = () => {
    return service.get('/api/redis/gdhf')
}

export const useGlzbData = () => {
    return service.get('/api/redis/glzb_data')
}

export const useIndicatorAndMultiDim = () => {
    return service.get('/api/redis/indicatorAndMultiDim')
}

