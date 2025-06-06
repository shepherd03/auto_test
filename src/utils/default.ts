/**
 * 获取 JsonCompareRules 的默认值
 * @returns JsonCompareRules 的默认值对象
 */
export function defaultJsonCompareRules(): JsonCompareRules {
    return {
        ignoreKeys: [],
        ignoreArrayOrder: false,
        ignoreCase: false,
        ignoreWhitespace: false,
        typeCoercion: false,
        ignoreNullUndefined: false,
        customIgnorePatterns: []
    };
}

/**
 * 获取 JsonCompareRulesContent 的默认值
 * @returns JsonCompareRulesContent 的默认值对象
 */
export function defaultJsonCompareRulesContent(): JsonCompareRulesContent {
    return {
        id: '',
        name: 'default',
        rules: defaultJsonCompareRules()
    };
}

/**
 * 获取 JsonDifference 的默认值
 * @returns JsonDifference 的默认值对象
 */
export function defaultJsonDifference(): JsonDifference {
    return {
        path: '',
        left: null,
        right: null,
        type: 'modified'
    };
}

/**
 * 获取 JsonStats 的默认值
 * @returns JsonStats 的默认值对象
 */
export function defaultJsonStats(): JsonStats {
    return {
        lines: 0,
        size: '0 B',
        totalFields: 0
    };
}