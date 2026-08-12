export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'datetime' | 'select' | 'guid' | 'int' | 'guid-text';
  required?: boolean;
  options?: { label: string; value: any }[];
}

export interface DynamicCreateModel {
  title: string;
  endpoint: string;
  fields: FieldConfig[];
}