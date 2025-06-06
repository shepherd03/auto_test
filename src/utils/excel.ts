import * as XLSX from 'xlsx';

export const exportToExcel = (items: any, white_list = ["id", "currentStep", "running"], filName: string = 'task') => {
    const worksheetData = [];
    let head = Object.keys(items[0])
    head = head.filter(key => !white_list.includes(key));
    worksheetData.push(head)

    for (let item of items) {
        const filteredItemValues = head.map(key => item[key]);
        worksheetData.push(filteredItemValues);
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData, { cellStyles: true });

    // 设置默认列宽
    const defaultColWidth = 50;
    worksheet['!cols'] = head.map(() => ({ width: defaultColWidth }));

    // 设置单元格样式
    const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (!worksheet[cellRef]) continue;

            // 创建单元格样式对象
            worksheet[cellRef].s = {
                alignment: {
                    vertical: 'center',
                    horizontal: 'center',
                    wrapText: true
                },
                border: {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' }
                },
                font: {
                    name: '微软雅黑',
                    sz: 11,
                    bold: R === 0 // 表头加粗
                }
            };

            // 设置列宽
            const columnWidth = String(worksheet[cellRef].v).length * 2;
            const col = XLSX.utils.encode_col(C);
            if (!worksheet['!cols']) worksheet['!cols'] = [];
            if (!worksheet['!cols'][C] || worksheet['!cols'][C].width < columnWidth) {
                worksheet['!cols'][C] = { width: Math.min(Math.max(columnWidth, 8), 50) };
            }
        }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${filName}.xlsx`);
};

export const readFromExcel = (excel: any, sheetName: string = 'default'): any => {
    if (sheetName === 'default') {
        sheetName = excel.SheetNames[0];
    }
    // 检查工作表是否存在
    else if (!excel.Sheets[sheetName]) {
        throw new Error(`工作表 "${sheetName}" 不存在`);
    }

    let sheet = excel.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(sheet);

    return data;
}

function resetExcelFormat(filePath: string): void {
    // 检查文件是否存在

    console.log(`正在重置文件格式: ${filePath}`);

    try {
        // 加载现有的Excel文件
        const workbook = XLSX.readFile(filePath);

        // 获取所有工作表的名字
        const sheetNames = workbook.SheetNames;

        for (const sheetName of sheetNames) {
            const worksheet = workbook.Sheets[sheetName];

            // 清除所有现有样式
            const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                    const cell = worksheet[cellRef];
                    if (cell) {
                        delete cell.f; // 删除公式
                        delete cell.t; // 删除类型
                        delete cell.v; // 删除值
                        delete cell.z; // 删除数字格式
                        delete cell.s; // 删除样式
                    }
                }
            }
        }

        // 保存文件
        XLSX.writeFile(workbook, filePath);
        console.log(`文件格式重置成功: ${filePath}`);
    } catch (error) {
        console.error(`加载或保存文件时发生错误: ${error}`);
    }
}

function adjustColumnWidthsAndWrapText(filePath: string): void {
    const workbook = XLSX.readFile(filePath);

    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];

        // 计算每列的最大宽度
        const dimensionDict: { [key: string]: number } = {};
        const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                const cell = worksheet[cellRef];
                if (cell && cell.t === 's') {
                    const columnLetter = XLSX.utils.encode_col(C);
                    const valueLength = String(cell.v).length;
                    if (!dimensionDict[columnLetter] || valueLength > dimensionDict[columnLetter]) {
                        dimensionDict[columnLetter] = valueLength;
                    }
                }
            }
        }

        // 设置列宽并启用自动换行及居中对齐
        for (const [columnLetter, maxLength] of Object.entries(dimensionDict)) {
            const adjustedWidth = Math.min(maxLength + 2, 65);  // 防止列宽过大，这里设定了最大值为65字符
            worksheet[`!cols`] = worksheet[`!cols`] || [];
            worksheet[`!cols`][parseInt(columnLetter, 36) - 1] = { wch: adjustedWidth };
        }
    }

    XLSX.writeFile(workbook, filePath);
}

function adjustRowHeights(filePath: string, maxRowHeight: number = 100): void {
    const workbook = XLSX.readFile(filePath);

    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];

        // 获取每列的实际宽度
        const columnWidths: { [key: string]: number } = {};
        worksheet[`!cols`]?.forEach((col, index) => {
            columnWidths[XLSX.utils.encode_col(index)] = col.wch!;
        });

        // 遍历每一行，根据内容调整行高
        const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
        for (let R = range.s.r; R <= range.e.r; ++R) {
            let maxLines = 1;  // 假设最少需要一行
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                const cell = worksheet[cellRef];
                if (cell && cell.t === 's') {
                    // 根据内容长度和列宽估算行数
                    const linesNeeded = (String(cell.v).length / columnWidths[XLSX.utils.encode_col(C)]) + 1;
                    maxLines = Math.max(maxLines, Math.ceil(linesNeeded));
                }
            }

            // 设置行高，这里假设每行的高度为15点，每增加一行增加15点
            worksheet[`!rows`] = worksheet[`!rows`] || [];
            worksheet[`!rows`][R] = { hpx: Math.min(15 * maxLines, maxRowHeight) };
        }
    }

    XLSX.writeFile(workbook, filePath);
}