import service from "@/utils/request";
import { type QuestionBank } from "@/types";

export const useQuestionBanksApi = () => {
    return service.get('/api/question_banks')
}

export const addQuestionBanksApi = (data: QuestionBank) => {
    return service.post('api/question_banks', data)
}

export const deleteQuestionBanksApi = (id: number) => {
    return service.delete(`api/question_banks/${id}`)
}

export const updateQuestionBanksApi = (data: QuestionBank) => {
    return service.put(`api/question_banks/${data.id}`, data)
}