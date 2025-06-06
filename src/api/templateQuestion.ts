import { TestItem } from '@/types'
import service from '@/utils/request'

export const useTemplateQuestionApi = () => {
    const result = service.get('/api/template_questions')
    return result
}

export const useTemplateQuestionByBankIdApi = (bank_id: number) => {
    const result = service.get(`/api/template_question/${bank_id}`)
    return result
}

export const addTemplateQuestionApi = (data: TestItem) => {
    return service.post('/api/template_questions', data)
}

export const updateTemplateQuestionApi = (id: number, data: any) => {
    return service.put(`/api/template_questions/${id}`, data)
}

export const deleteTemplateQuestionApi = (id: number) => {
    const result = service.delete(`/api/template_questions/${id}`)
    return result
}