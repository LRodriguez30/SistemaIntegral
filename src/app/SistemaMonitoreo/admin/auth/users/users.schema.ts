export const InitializeTableSchema = () => {
    return {
        fields: [
            { key: 'rowIndex', label: '#', type: 'index', source: 'ui' },

            { key: 'UsuarioId', label: 'ID Usuario', type: 'number' },
            { key: 'PersonaId', label: 'ID Persona', type: 'number' },

            { key: 'CorreoElectronico', label: 'Correo electrónico', type: 'text' },
            { key: 'RolId', label: 'Rol', type: 'select' },
            { key: 'Estado', label: 'Estado', type: 'boolean' },

            { key: 'actions', label: 'Acciones', type: 'actions', source: 'ui' }
        ]
    };
};


export const GUID_COLUMNS: string[] = [
    'UsuarioId',
    'PersonaId'
];