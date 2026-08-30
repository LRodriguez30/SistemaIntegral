export const InitializeTableSchema = () => {
    return {
        fields: [
            { key: 'rowIndex', label: '#', type: 'index', source: 'ui' },

            { key: 'rol_id', label: 'ID Rol', type: 'number' },

            { key: 'nombre_rol', label: 'Nombre del rol', type: 'text' },

            { key: 'descripcion', label: 'Descripción', type: 'text' },

            { key: 'estado', label: 'Estado', type: 'boolean' },

            { key: 'actions', label: 'Acciones', type: 'actions', source: 'ui' }
        ]
    };
};


export const HIDDEN_COLUMNS: string[] = [
    'rol_id'
];