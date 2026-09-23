export const InitializeTableSchema = () => {
    return {
        fields: [
            { key: 'rowIndex', label: '#', type: 'index', source: 'ui' },
            
            { key: 'nombre_usuario', label: 'Nombre del Usuario', type: 'text'},

            { key: 'usuario_id', label: 'ID Usuario', type: 'number' },
            { key: 'persona_id', label: 'ID Persona', type: 'number' },

            { key: 'correo_electronico', label: 'Correo electrónico', type: 'text' },
            { key: 'rol_id', label: 'Rol', type: 'select' },
            { key: 'estado', label: 'Estado', type: 'boolean' },

            { key: 'actions', label: 'Acciones', type: 'actions', source: 'ui' }
        ]
    };
};


export const HIDDEN_COLUMNS: string[] = [
    'usuario_id',
    'persona_id'
];