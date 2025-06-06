import service from "@/utils/request";

export const useDirectApi = (message: string): Promise<ResponseContent<Record<string, any>>> => {
    return service.post('/api/micro_service/direct', {
        message
    });
};

// NLU 分析接口
export const useNluApi = (message: string): Promise<ResponseContent<Record<string, any>>> => {
    return service.post('/api/micro_service/nlu', {
        message
    });
};

// 查询接口
export const useQueryApi = (message: string): Promise<ResponseContent<Record<string, any>>> => {
    return service.post('/api/micro_service/query', {
        message
    });
};

// 纠正接口
export const useRectifyApi = (message: string): Promise<ResponseContent<Record<string, any>>> => {
    return service.post('/api/micro_service/rectify', {
        message
    });
};

export const useTestRectifyApi = (message: string): Promise<ResponseContent<Record<string, any>>> => {
    console.log(message);
    return service.post('/api/micro_service/test/rectify', {
        message
    });
};