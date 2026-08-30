export const InitializeTableSchema = () => {

    return {

        fields: [

            {
                key: 'rowIndex',
                label: '#',
                type: 'index',
                source: 'ui'
            },

            {
                key: 'persona_id',
                label: 'ID Persona',
                type: 'number'
            },

            {
                key: 'primer_nombre',
                label: 'Primer nombre',
                type: 'text'
            },

            {
                key: 'segundo_nombre',
                label: 'Segundo nombre',
                type: 'text'
            },

            {
                key: 'primer_apellido',
                label: 'Primer apellido',
                type: 'text'
            },

            {
                key: 'segundo_apellido',
                label: 'Segundo apellido',
                type: 'text'
            },

            {
                key: 'telefono',
                label: 'Teléfono',
                type: 'phone-country'
            },

            {
                key: 'actions',
                label: 'Acciones',
                type: 'actions',
                source: 'ui'
            }

        ]

    };
};

export const HIDDEN_COLUMNS: string[] = [
    'persona_id'
];