export const InitializeTableSchema = () => {
    return {
        fields: [
            { key: 'rowIndex', label: '#', type: 'index', source: 'ui' },
            { key: 'id', label: 'ID', type: 'guid' },
            { key: 'name', label: 'Nombre', type: 'text' },
            { key: 'email', label: 'Correo', type: 'text' },
            { key: 'role', label: 'Rol', type: 'select' },
            { key: 'created_at', label: 'Creado', type: 'datetime' },
            { key: 'updated_at', label: 'Actualizado', type: 'datetime' },
            { key: 'last_login', label: 'Último acceso', type: 'datetime' },
            { key: 'actions', label: 'Acciones', type: 'actions', source: 'ui' }
        ]
    };
};

export const GUID_COLUMNS = ['id'];