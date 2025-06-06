import type { TableColumnCtx } from 'element-plus'

export interface TestItem {
    id?: number,
    question: string,
    result: string,
    result_type: number | string,
    time: number,
    bank_id: number,
    interface_id: number,
    run_result?: string,
    run_result_type?: number | string,
    currentStep?: number,
    running?: boolean;
    run_time?: number
}

export interface Judge {
    question: string,
    result: string,
    result_type: number | string,
    time: number,
    run_result: string,
    run_result_type: number | string,
    run_time: number,
    judge_results: Array<JudgeResult>
}

export interface JudgeResult {
    judge_type: JudgeTypeKey,
    judge_name: string,
    judge_info: Array<Map<string, [number | string, number | string]>>
}

export const JudgeType = {
    SUCCESS: 0,  // 成功
    RESULT_TYPE_ERROR: 1,  // 结果类型错误
    RESULT_CONTENT_ERROR: 2,  // 结果内容错误
    DATE_DIFFERENCE: 3,  // 日期差异
    DATE_COUNT_DIFFERENCE: 4,  // 日期数量差异
    DATA_DIFFERENCE: 5,  // 数据差异
    DATA_COUNT_DIFFERENCE: 6,  // 数据数量差异
    SUSPICIOUS: 7  // 可疑
} as const;

export const JudgeText: Array<string> = ["成功", "结果类型错误", "结果内容错误", "日期差异", "日期数量差异", "数据差异", "数据数量差异", "可疑"]

export const JudgeTypeToText = (t: JudgeTypeKey): string => {
    return JudgeText[parseInt(t)]
};

export type JudgeTypeKey = keyof typeof JudgeType;

export interface TableColumn<T> {
    prop: keyof T;
    label: string;
    width?: number | string;
    visible: boolean;
}

export interface SpanMethodProps<T> {
    row: T
    column: TableColumnCtx<T>
    rowIndex: number
    columnIndex: number
}

export interface JudgeAccuracyStatistics {
    total: number,
    success: number,
    errors: number,
    suspicious: number,
    accuracy: number,
}

export interface QuestionBank {
    id?: number,
    name: string,
    description: string,
    create_time?: string
}

export interface InterfaceConfig {
    id?: number,
    name: string,
    description: string,
    direct_interface: string,
    nlu_interface: string,
    query_interface: string,
    rectify_interface: string,
    create_time?: string
}