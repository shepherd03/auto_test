import service from "@/utils/request";

export const useFixedReplyFormat = () => {
    return service.get('/api/data_view/fixed_reply')
}