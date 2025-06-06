import { TestItem } from "@/types";
import service from "@/utils/request";

export const useJudgeApi = (item: TestItem) => {
    const judgeResult = service.post('/api/judge', item)
    return judgeResult
}   