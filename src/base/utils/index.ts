/**
 * 工具函数统一导出
 */

// TODO: 实现具体的工具函数
export const StringUtils = {
    isEmpty: (str: string): boolean => !str || str.trim().length === 0,
    capitalize: (str: string): string => str.charAt(0).toUpperCase() + str.slice(1)
};

export const ArrayUtils = {
    unique: <T>(arr: T[]): T[] => [...new Set(arr)],
    chunk: <T>(arr: T[], size: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    }
};