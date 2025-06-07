declare global {
    interface ResponseContent<T> {
        code: number,
        msg: string,
        data: T,
        time: number
    }

    interface JsonCompareRulesContent {
        id: string,
        name: string,
        rules: JsonCompareRules
    }

    interface JsonCompareRules {
        ignoreKeys: string[];
        ignoreArrayOrder: boolean;
        ignoreCase: boolean;
        ignoreWhitespace: boolean;
        typeCoercion: boolean;
        ignoreNullUndefined: boolean;
        customIgnorePatterns: string[];
    }

    interface JsonDifference {
        path: string
        left: any
        right: any
        type: 'added' | 'removed' | 'modified'
    }

    /**
     * 单个JSON统计信息接口
     */
    interface JsonStats {
        lines: number
        size: string
        totalFields: number
    }

    /**
     * JSON比较统计信息接口
     */
    interface JsonComparisonResult {
        similarity: number
        totalDifferences: number
        addedCount: number
        removedCount: number
        modifiedCount: number
        compareTime: string
        appliedRules: Array<string>
    }

    /**
     * 测试结果接口
     */
    interface TestResult {
        id: string;
        input: string;
        service: ServiceName;
        output: any;
        duration: number;
        timestamp: string;
    }

    type ServiceName = 'Direct' | 'NLU' | 'Query' | 'Rectify' | 'TestRectify';


    interface ServiceContent {
        name: ServiceName,
        api: (msg: string) => Promise<ResponseContent<any>>,
    }

    interface PreviewColumn {
        prop: string
        label: string
        width?: string
    }

    interface PreviewRow {
        index: number
        value: string | number | null
    }

    interface SelectedData {
        sheet: string
        column: string
        startRow: number
        endRow: number
        data: Array<string | number | null>
    }

    interface UploadFile {
        name: string
        size: number
        raw: File
    }
    type CellData = string | number | null

    type ExcelData = Array<Array<CellData>>
}

export { }