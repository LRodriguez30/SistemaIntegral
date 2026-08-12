export type FieldType =
    | 'text'
    | 'counter'
    | 'number'
    | 'int'
    | 'currency'
    | 'date'
    | 'datetime'
    | 'status'
    | 'badge'
    | 'select'
    | 'guid'
    | 'actions';

type TableKey<T> = keyof T | string;

export interface TableField<T> {
    key: TableKey<T>;

    label: string;

    type: FieldType;

    visible?: boolean;
    filter?: boolean;

    options?: { label: string; value: any }[];

    // Dato real, creado por el sistema o adicional
    source?: 'data' | 'computed' | 'ui';
}

export interface TableSchema<T> {
    fields: TableField<T>[];
}