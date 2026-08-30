import {
    DataType,
    FilterEngine,
    FilterType
} from "../../engines/FilterEngine";

export interface RolesFilter {
    rol_id: string;
    nombre_rol: string;
    descripcion: string;
    estado: boolean | null;
}

export function InitializeFilterEngine() {

    return new FilterEngine<RolesFilter>(
        [
            {
                field: 'rol_id',
                filter: {
                    label: 'ID Rol',
                    filterType: FilterType.EQUALS,
                    dataType: DataType.NUMBER
                }
            },
            {
                field: 'nombre_rol',
                filter: {
                    label: 'Nombre del rol',
                    filterType: FilterType.EQUALS,
                    dataType: DataType.TEXT
                }
            },
            {
                field: 'descripcion',
                filter: {
                    label: 'Descripción',
                    filterType: FilterType.EQUALS,
                    dataType: DataType.TEXT
                }
            },
            {
                field: 'estado',
                filter: {
                    label: 'Estado',
                    filterType: FilterType.SELECT,
                    dataType: DataType.BOOLEAN,
                    options: [
                        {
                            label: 'Activo',
                            value: true
                        },
                        {
                            label: 'Inactivo',
                            value: false
                        }
                    ]
                }
            }
        ],
        {
            rol_id: '',
            nombre_rol: '',
            descripcion: '',
            estado: null
        }
    );
}