# JsonRulesEditor 组件使用文档

`JsonRulesEditor` 是一个用于配置 JSON 比较规则的组件。它允许用户设置基础比较规则（如忽略数组顺序、忽略大小写等）、添加忽略键值、定义自定义忽略模式，并提供了规则预设的保存和加载功能。

## 组件属性 (Props)

| 属性名       | 类型                   | 默认值 | 说明                               |
| ------------ | ---------------------- | ------ | ---------------------------------- |
| `modelValue` | `JsonCompareRulesContent` | 无     | 绑定的 JSON 比较规则内容，支持 `v-model`。 |

## 组件事件 (Events)

| 事件名             | 参数类型                  | 说明                               |
| ------------------ | ------------------------- | ---------------------------------- |
| `update:modelValue` | `JsonCompareRulesContent` | 当规则内容改变时触发，用于 `v-model` 更新。 |
| `rules-changed`    | `JsonCompareRulesContent` | 当规则内容改变时触发。             |
| `rules-reset`      | 无                        | 当规则被重置为默认值时触发。       |

## 类型定义

### `JsonCompareRulesContent` 接口

定义了 JSON 比较规则的详细内容。

```typescript
interface JsonCompareRulesContent {
  rules: JsonCompareRules; // 具体的比较规则
  // ... 其他可能的字段
}
```

### `JsonCompareRules` 接口

定义了具体的 JSON 比较规则。

```typescript
interface JsonCompareRules {
  ignoreArrayOrder: boolean; // 是否忽略数组元素的顺序
  ignoreCase: boolean;       // 比较字符串时是否忽略大小写
  ignoreWhitespace: boolean; // 比较字符串时是否忽略前后空白字符
  typeCoercion: boolean;     // 是否启用类型强制转换（例如 '1' 和 1 视为相等）
  ignoreNullUndefined: boolean; // 是否将 null 和 undefined 视为相等
  ignoreKeys: string[];      // 需要完全忽略的键名列表
  customIgnorePatterns: string[]; // 自定义忽略模式的正则表达式字符串列表
}
```

## 内部状态

- `customRules`: `JsonCompareRulesContent`，组件内部维护的当前规则状态。
- `newIgnoreKey`: `string`，用于输入新的忽略键名。
- `newIgnorePattern`: `string`，用于输入新的自定义忽略模式。
- `selectedPreset`: `string`，当前选中的预设规则名称。

## 内部方法

- `addIgnoreKey()`: 添加一个忽略键名。
- `removeIgnoreKey(key: string)`: 移除一个忽略键名。
- `addIgnorePattern()`: 添加一个自定义忽略模式。
- `removeIgnorePattern(pattern: string)`: 移除一个自定义忽略模式。
- `savePreset()`: 将当前规则保存为新的预设。
- `loadSelectedPreset()`: 加载选中的预设规则。
- `resetRules()`: 将所有规则重置为默认值。

## 使用示例

```vue
<template>
  <div style="width: 600px;">
    <JsonRulesEditor v-model="myRules" @rules-changed="handleRulesChange" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import JsonRulesEditor from '@/components/Json/JsonRulesEditor.vue';
import type { JsonCompareRulesContent } from '@/utils/jsonCompareUtils'; // 假设类型定义在此处

const myRules = ref<JsonCompareRulesContent>({
  rules: {
    ignoreArrayOrder: false,
    ignoreCase: false,
    ignoreWhitespace: false,
    typeCoercion: false,
    ignoreNullUndefined: false,
    ignoreKeys: [],
    customIgnorePatterns: [],
  },
});

const handleRulesChange = (rules: JsonCompareRulesContent) => {
  console.log('规则已更新:', rules);
};
</script>
```