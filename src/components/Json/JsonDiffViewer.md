# JsonDiffViewer 组件使用文档

`JsonDiffViewer` 是一个用于展示 JSON 数据差异的组件，它能够清晰地显示两个 JSON 之间的“新增”、“删除”和“修改”部分，并提供过滤功能。

## 组件属性 (Props)

| 属性名       | 类型                 | 默认值   | 说明                               |
| ------------ | -------------------- | -------- | ---------------------------------- |
| `differences` | `JsonDifference[]`   | `[]`     | 包含 JSON 差异信息的数组，必填。 |
| `leftTitle`   | `string`             | `'JSON A'` | 左侧 JSON 的标题。                 |
| `rightTitle`  | `string`             | `'JSON B'` | 右侧 JSON 的标题。                 |

## 类型定义

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

## 内部状态

- `diffFilter`: `string`，用于过滤差异类型，可选值包括 `'all'`、`'added'`、`'removed'`、`'modified'`，默认为 `'all'`。

## 计算属性

- `addedCount`: `number`，新增差异的数量。
- `removedCount`: `number`，删除差异的数量。
- `modifiedCount`: `number`，修改差异的数量。
- `filteredDifferences`: `JsonDifference[]`，根据 `diffFilter` 过滤后的差异列表。

## 使用示例

```vue
<template>
  <div style="height: 500px;">
    <JsonDiffViewer
      :differences="myDifferences"
      leftTitle="原始数据"
      rightTitle="修改后数据"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import JsonDiffViewer from '@/components/Json/JsonDiffViewer.vue';
import type { JsonDifference } from '@/utils/jsonCompareUtils'; // 假设 JsonDifference 定义在此处

const myDifferences = ref<JsonDifference[]>([
  { path: 'user.name', type: 'modified', left: 'Alice', right: 'Bob' },
  { path: 'user.age', type: 'added', right: 30 },
  { path: 'user.email', type: 'removed', left: 'alice@example.com' },
]);
</script>
```