export enum FilterType {
    EQUALS = "equals",
    NUMBER_RANGE = "number-range",
    MULTI_SELECT = "multi-select",
    DATE_RANGE = "date-range"
}

export enum DataType {
    TEXT = 'text',
    NUMBER = 'number',
    DATE = 'date',
    DATETIME = 'datetime',
    SELECT = 'select',
    GUID = 'guid',
    INT = 'int'
}

export interface FilterOption<T = any> {
    label: string;
    value: T;
}

export interface FilterField<T = any> {
    styleClass?: string;
    label: string;
    filterType: FilterType;
    dataType: DataType;
    options?: readonly FilterOption<T>[];
}

export type FilterRule<
    T,
    K extends keyof T = keyof T
> = {
    field: K;
    filter: FilterField<T[K]>;
}

export class FilterEngine<T extends Record<string, any>> {

    constructor(
        public rules: FilterRule<T>[],
        private initialState: T
    ) { }

    createState(): T {
        return structuredClone(this.initialState);
    }

    reset(): T {
        return this.createState();
    }

    apply(row: T, filterState: T): boolean {

        for (const rule of this.rules) {

            const value = filterState[rule.field];
            const rowValue = row[rule.field];

            if (
                value === null ||
                value === undefined ||
                value === '' ||
                (Array.isArray(value) && value.length === 0)
            ) {
                continue;
            }

            switch (rule.filter.filterType) {

                case 'multi-select':

                    if (
                        Array.isArray(value) &&
                        !value.includes(rowValue)
                    ) {
                        return false;
                    }

                    break;

                case 'equals':

                    if (
                        String(rowValue)
                            .toLowerCase()
                            .includes(String(value).toLowerCase()) === false
                    ) {
                        return false;
                    }

                    break;

                case 'number-range':

                    if (
                        value.min !== null &&
                        Number(rowValue) < Number(value.min)
                    ) {
                        return false;
                    }

                    if (
                        value.max !== null &&
                        Number(rowValue) > Number(value.max)
                    ) {
                        return false;
                    }

                    break;

                case 'date-range':

                    if (value.from) {

                        const from = new Date(value.from);

                        if (new Date(rowValue) < from) {
                            return false;
                        }
                    }

                    if (value.to) {

                        const to = new Date(value.to);
                        to.setHours(23, 59, 59);

                        if (new Date(rowValue) > to) {
                            return false;
                        }
                    }

                    break;
            }
        }

        return true;
    }

    countActive(filter: T): number {

        let count = 0;

        for (const rule of this.rules) {

            const value = filter[rule.field];

            if (value === null || value === undefined) continue;

            if (Array.isArray(value) && value.length === 0) continue;

            if (value !== '') count++;
        }

        return count;
    }
}