# JsonInput 组件使用文档

`JsonInput` 是一个用于输入、编辑、格式化和上传 JSON 数据的文本区域组件。它提供了实时的 JSON 统计信息（行数和大小），并集成了文件上传、格式化和清空功能。

## 组件属性 (Props)

| 属性名       | 类型     | 默认值   | 说明                                   |
| ------------ | -------- | -------- | -------------------------------------- |
| `modelValue` | `string` | `''`     | 绑定的 JSON 字符串内容，支持 `v-model`。 |
| `title`      | `string` | `'JSON'` | 输入框的标题。                         |
| `rows`       | `number` | `22`     | 文本区域的行数。                       |

## 组件事件 (Events)

| 事件名          | 参数类型   | 说明                                   |
| --------------- | ---------- | -------------------------------------- |
| `update:modelValue` | `string`   | 当 JSON 内容改变时触发，用于 `v-model` 更新。 |
| `stats-updated` | `JsonStats` | 当 JSON 统计信息更新时触发。           |

## 类型定义

### `JsonStats` 接口

定义了 JSON 统计信息的结构。

```typescript
interface JsonStats {
  lines: number; // JSON 内容的行数
  size: string;  // JSON 内容的大小（例如 '1.2 KB'）
}
```

## 内部方法

- `handleUpdateJsonStats()`: 更新并发出 JSON 统计信息。
- `formatJson()`: 格式化当前 JSON 内容，如果格式错误会显示错误消息。
- `clearInput()`: 清空输入框内容和统计信息。
- `handleFileUpload(file: File)`: 处理文件上传，读取文件内容并更新输入框，支持 JSON 文件。

## 使用示例

```vue
<template>
  <div style="display: flex; gap: 20px;">
    <JsonInput
      v-model="jsonA"
      title="JSON A"
      @stats-updated="handleStatsA"
    />
    <JsonInput
      v-model="jsonB"
      title="JSON B"
      @stats-updated="handleStatsB"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import JsonInput from '@/components/Json/JsonInput.vue';
import type { JsonStats } from '@/utils/jsonCompareUtils'; // 假设 JsonStats 定义在此处

const jsonA = ref('{\n  "name": "Alice",\n  "age": 30\n}');
const jsonB = ref('{\n  "name": "Bob",\n  "city": "New York"\n}');

const handleStatsA = (stats: JsonStats) => {
  console.log('JSON A Stats:', stats);
};

const handleStatsB = (stats: JsonStats) => {
  console.log('JSON B Stats:', stats);
};
</script>
```