# JsonStatsViewer 组件使用文档

`JsonStatsViewer` 是一个用于展示 JSON 数据统计信息和比较结果的组件。它能够显示两个 JSON 的行数、大小、字段数，以及它们之间的差异统计（新增、删除、修改字段数量、相似度、比较时间），并列出应用的比较规则。

## 组件属性 (Props)

| 属性名           | 类型                 | 默认值     | 说明                                   |
| ---------------- | -------------------- | ---------- | -------------------------------------- |
| `leftJsonStats`  | `JsonStats`          | 无         | 左侧 JSON 的统计信息，必填。           |
| `rightJsonStats` | `JsonStats`          | 无         | 右侧 JSON 的统计信息，必填。           |
| `leftTotalFields`| `number`             | 无         | 左侧 JSON 的总字段数，必填。           |
| `rightTotalFields`| `number`             | 无         | 右侧 JSON 的总字段数，必填。           |
| `differences`    | `JsonDifference[]`   | 无         | 包含 JSON 差异信息的数组，必填。       |
| `compareTime`    | `string`             | `''`       | JSON 比较所花费的时间（例如 '123ms'）。 |
| `appliedRules`   | `string[]`           | `[]`       | 应用的比较规则名称列表。               |
| `leftTitle`      | `string`             | `'JSON A'` | 左侧 JSON 的标题。                     |
| `rightTitle`     | `string`             | `'JSON B'` | 右侧 JSON 的标题。                     |

## 类型定义

### `JsonStats` 接口

定义了 JSON 统计信息的结构。

```typescript
interface JsonStats {
  lines: number; // JSON 内容的行数
  size: string;  // JSON 内容的大小（例如 '1.2 KB'）
}
```

### `JsonDifference` 接口

定义了单个 JSON 差异的结构。

```typescript
interface JsonDifference {
  path: string; // 差异的路径，例如 'data[0].name'
  type: 'added' | 'removed' | 'modified'; // 差异类型
  left?: any; // 左侧 JSON 中对应路径的值 (如果类型不是 'added')
  right?: any; // 右侧 JSON 中对应路径的值 (如果类型不是 'removed')
}
```

## 计算属性

- `addedCount`: `number`，新增字段的数量。
- `removedCount`: `number`，删除字段的数量。
- `modifiedCount`: `number`，修改字段的数量。
- `similarity`: `number`，两个 JSON 的相似度百分比。

## 使用示例

```vue
<template>
  <div style="width: 800px;">
    <JsonStatsViewer
      :leftJsonStats="statsA"
      :rightJsonStats="statsB"
      :leftTotalFields="totalFieldsA"
      :rightTotalFields="totalFieldsB"
      :differences="diffs"
      compareTime="50ms"
      :appliedRules="['忽略数组顺序', '忽略大小写']"
      leftTitle="JSON 原始"
      rightTitle="JSON 对比"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import JsonStatsViewer from '@/components/Json/JsonStatsViewer.vue';
import type { JsonStats, JsonDifference } from '@/utils/jsonCompareUtils'; // 假设类型定义在此处

const statsA = ref<JsonStats>({ lines: 10, size: '1KB' });
const statsB = ref<JsonStats>({ lines: 12, size: '1.2KB' });
const totalFieldsA = ref(50);
const totalFieldsB = ref(55);
const diffs = ref<JsonDifference[]>([
  { path: 'user.name', type: 'modified', left: 'Alice', right: 'Bob' },
  { path: 'user.age', type: 'added', right: 30 },
]);
</script>
```