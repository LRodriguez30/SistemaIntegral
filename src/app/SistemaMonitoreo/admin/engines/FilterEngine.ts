export enum FilterType {
    EQUALS = "equals",
    NUMBER_RANGE = "number-range",
    MULTI_SELECT = "multi-select",
    DATE_RANGE = "date-range",
    SELECT = "select",
    BOOLEAN = "boolean",
    PHONE_COUNTRY = "phone-country",
}

export enum DataType {
    TEXT = 'text',
    NUMBER = 'number',
    DATE = 'date',
    DATETIME = 'datetime',
    SELECT = 'select',
    BOOLEAN = 'boolean',
    GUID = 'guid',
    INT = 'int',
}

export interface FilterOption<T = any> {
    label: string;
    value: T;
    meta?: Record<string, any>;
}

export interface FilterField<
    TValue = any,
    TOption = TValue
> {
    styleClass?: string;
    label: string;
    filterType: FilterType;
    dataType: DataType;
    options?: readonly FilterOption<TOption>[];
    resolver?: (value: TValue) => any;
}

export type FilterRule<T> = {
    [K in keyof T]: {
        field: K;
        filter: FilterField<
            T[K],
            T[K] extends readonly (infer U)[] ? U : T[K]
        >;
    }
}[keyof T];

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

            const value =
                filterState[rule.field];

            const rowValue =
                row[rule.field];

            // Ignorar únicamente valores vacíos.
            // false sigue siendo un valor válido.
            if (
                value === null ||
                value === undefined ||
                value === '' ||
                (
                    Array.isArray(value) &&
                    value.length === 0
                )
            ) {
                continue;
            }

            switch (rule.filter.filterType) {

                // =========================================
                // MULTI SELECT
                // =========================================

                case FilterType.MULTI_SELECT:

                    if (
                        Array.isArray(value) &&
                        !value.includes(rowValue)
                    ) {
                        return false;
                    }

                    break;

                // =========================================
                // SELECT
                // =========================================

                case FilterType.SELECT:

                    if (rowValue !== value) {
                        return false;
                    }

                    break;

                // =========================================
                // EQUALS
                // =========================================

                case FilterType.EQUALS:

                    if (
                        String(rowValue)
                            .toLowerCase()
                            .includes(
                                String(value).toLowerCase()
                            ) === false
                    ) {
                        return false;
                    }

                    break;

                // =========================================
                // BOOLEAN
                // =========================================

                case FilterType.BOOLEAN:

                    if (rowValue !== value) {
                        return false;
                    }

                    break;

                // =========================================
                // NUMBER RANGE
                // =========================================

                case FilterType.NUMBER_RANGE:

                    if (
                        value.min !== null &&
                        Number(rowValue) <
                        Number(value.min)
                    ) {
                        return false;
                    }

                    if (
                        value.max !== null &&
                        Number(rowValue) >
                        Number(value.max)
                    ) {
                        return false;
                    }

                    break;

                // =========================================
                // DATE RANGE
                // =========================================

                case FilterType.DATE_RANGE:

                    if (value.from) {

                        const from =
                            new Date(value.from);

                        if (
                            new Date(rowValue) < from
                        ) {
                            return false;
                        }
                    }

                    if (value.to) {

                        const to =
                            new Date(value.to);

                        to.setHours(
                            23,
                            59,
                            59
                        );

                        if (
                            new Date(rowValue) > to
                        ) {
                            return false;
                        }
                    }

                    break;

                case FilterType.PHONE_COUNTRY:

                    if (!rowValue) {
                        return false;
                    }

                    const selectedCountry =
                        rule.filter.options?.find(
                            option => option.value === value
                        );

                    if (!selectedCountry) {
                        return false;
                    }

                    const dialCode =
                        selectedCountry.meta?.['dialCode'];

                    if (!dialCode) {
                        return false;
                    }

                    const phone =
                        String(rowValue)
                            .replace(/\D/g, '');

                    const prefix =
                        String(dialCode)
                            .replace(/\D/g, '');

                    if (!phone.startsWith(prefix)) {
                        return false;
                    }

                    break;

            }
        }

        return true;
    }

    countActive(filter: T): number {

        let count = 0;

        for (const rule of this.rules) {

            const value =
                filter[rule.field];

            if (
                value === null ||
                value === undefined
            ) {
                continue;
            }

            if (
                Array.isArray(value) &&
                value.length === 0
            ) {
                continue;
            }

            if (value !== '') {
                count++;
            }
        }

        return count;
    }
}