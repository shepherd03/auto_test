# ExcelColumnSelector 组件使用文档

`ExcelColumnSelector` 组件用于提供一个界面，允许用户上传 Excel 文件，选择工作表、数据列，并以行范围或随机方式选择数据进行预览和确认。

## 组件用途

- 上传 `.xlsx` 或 `.xls` 格式的 Excel 文件。
- 列出文件中的所有工作表供用户选择。
- 列出所选工作表中的所有数据列供用户选择。
- 支持两种数据选择模式：
  - **行选择 (Range Selection)**：用户可以指定起始行和结束行来选择连续的数据。
  - **随机选择 (Random Selection)**：用户可以指定随机选择的数据条数。
- 实时预览所选数据。
- 确认选择后，通过事件将选定的数据及其元信息（工作表、列、行范围）传递出去。

## 传入参数 (Props)

该组件目前没有直接的 `props` 传入。

## 事件 (Emits)

- `select` (data: SelectedData): 当用户点击“确认选择”按钮且数据有效时触发。它会返回一个包含所选数据和相关元信息的对象。

## 类型定义

### `SelectedData` 接口

```typescript
interface SelectedData {
  sheet: string; // 所选工作表的名称
  column: string; // 所选数据列的名称
  startRow: number; // 选择的起始行（行选择模式下有效，随机模式下为 -1）
  endRow: number; // 选择的结束行（行选择模式下有效，随机模式下为 -1）
  data: Array<string | number | null>; // 实际选中的数据数组
}
```

### `PreviewColumn` 接口

```typescript
interface PreviewColumn {
  prop: string; // 表格列的属性名
  label: string; // 表格列的显示名称
  width?: string; // 可选：表格列的宽度
}
```

### `PreviewRow` 接口

```typescript
interface PreviewRow {
  index: number; // 数据的原始行号
  value: string | number | null; // 对应行的数据值
}
```

### `UploadFile` 接口

```typescript
interface UploadFile {
  name: string; // 文件名
  size: number; // 文件大小 (字节)
  raw: File; // 原始 File 对象
}
```

### `ExcelData` 类型

```typescript
type ExcelData = Array<Array<string | number | null>>; // Excel 数据的二维数组表示
```
