import { DataType, FilterEngine, FilterType } from "../../engines/FilterEngine";
import { RolesType } from "../../../../services/users.service";

export interface UserFilter {
    usuario_id: string;
    persona_id: string;
    correo_electronico: string;
    rol_id: RolesType[];
    estado: boolean | null;
}

export function InitializeFilterEngine() {

    return new FilterEngine<UserFilter>(
        [
            {
                field: 'rol_id',
                filter: {
                    label: "Rol de Usuario",
                    filterType: FilterType.MULTI_SELECT,
                    dataType: DataType.SELECT,
                    options: [
                        {
                            label: 'Superadministrador',
                            value: RolesType.SUPERADMINISTRADOR
                        },
                        {
                            label: 'Administrador Gerencial',
                            value: RolesType.ADMINISTRADORGERENCIAL
                        },
                        {
                            label: 'Administrador Contable',
                            value: RolesType.ADMINISTRADORCONTABLE
                        },
                        {
                            label: 'Administrador Operativo',
                            value: RolesType.ADMINISTRADOROPERATIVO
                        },
                        {
                            label: 'Usuario Estándar',
                            value: RolesType.USUARIOESTANDAR
                        }
                    ]
                }
            },
            {
                field: 'correo_electronico',
                filter: {
                    label: "Correo electrónico",
                    filterType: FilterType.EQUALS,
                    dataType: DataType.TEXT
                }
            },
            {
                field: 'usuario_id',
                filter: {
                    label: "ID Usuario",
                    filterType: FilterType.EQUALS,
                    dataType: DataType.NUMBER
                }
            },
            {
                field: 'persona_id',
                filter: {
                    label: "ID Persona",
                    filterType: FilterType.EQUALS,
                    dataType: DataType.NUMBER
                }
            },
            {
                field: 'estado',
                filter: {
                    label: "Estado",
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
            rol_id: [],
            correo_electronico: '',
            usuario_id: '',
            persona_id: '',
            estado: null
        }
    );
}