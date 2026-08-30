import {
    DataType,
    FilterEngine,
    FilterType
} from '../../engines/FilterEngine';

export interface PersonaFilter {

    primer_nombre: string;

    segundo_nombre: string;

    primer_apellido: string;

    segundo_apellido: string;

    telefono: string;
}

export const PHONE_COUNTRY_OPTIONS = [

    {
        label: 'Nicaragua',
        value: 'NI',
        meta: {
            dialCode: '+505'
        }
    },

    {
        label: 'Costa Rica',
        value: 'CR',
        meta: {
            dialCode: '+506'
        }
    },

    {
        label: 'Honduras',
        value: 'HN',
        meta: {
            dialCode: '+504'
        }
    },

    {
        label: 'El Salvador',
        value: 'SV',
        meta: {
            dialCode: '+503'
        }
    },

    {
        label: 'Guatemala',
        value: 'GT',
        meta: {
            dialCode: '+502'
        }
    },

    {
        label: 'Panamá',
        value: 'PA',
        meta: {
            dialCode: '+507'
        }
    },

    {
        label: 'México',
        value: 'MX',
        meta: {
            dialCode: '+52'
        }
    },

    {
        label: 'Estados Unidos',
        value: 'US',
        meta: {
            dialCode: '+1'
        }
    }

];

export function InitializeFilterEngine() {

    return new FilterEngine<PersonaFilter>(

        [

            {
                field: 'primer_nombre',

                filter: {
                    label: 'Primer nombre',
                    filterType: FilterType.EQUALS,
                    dataType: DataType.TEXT
                }
            },

            {
                field: 'segundo_nombre',

                filter: {
                    label: 'Segundo nombre',
                    filterType: FilterType.EQUALS,
                    dataType: DataType.TEXT
                }
            },

            {
                field: 'primer_apellido',

                filter: {
                    label: 'Primer apellido',
                    filterType: FilterType.EQUALS,
                    dataType: DataType.TEXT
                }
            },

            {
                field: 'segundo_apellido',

                filter: {
                    label: 'Segundo apellido',
                    filterType: FilterType.EQUALS,
                    dataType: DataType.TEXT
                }
            },

            {
                field: 'telefono',

                filter: {
                    label: 'País del teléfono',
                    filterType: FilterType.PHONE_COUNTRY,
                    dataType: DataType.SELECT,
                    options: PHONE_COUNTRY_OPTIONS
                }
            }

        ],

        {

            primer_nombre: '',

            segundo_nombre: '',

            primer_apellido: '',

            segundo_apellido: '',

            telefono: ''

        }

    );
}