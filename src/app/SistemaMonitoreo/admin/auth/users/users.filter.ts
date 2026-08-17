import { DataType, FilterEngine, FilterType } from "../../engines/FilterEngine";
import { RolesType } from "../../../../services/users.service";

export interface UserFilter {
    usuarioId: string;
    personaId: string;
    correoElectronico: string;
    rolId: RolesType[];
    estado: boolean | null;
}

export function InitializeFilterEngine() {

    return new FilterEngine<UserFilter>(
        [
            {
                field: 'rolId',
                filter: {
                    label: "Rol de Usuario",
                    filterType: FilterType.MULTI_SELECT,
                    dataType: DataType.SELECT,
                    options: [
                        {
                            label: 'SUPERADMINISTRADOR',
                            value: RolesType.SUPERADMINISTRADOR
                        },
                        {
                            label: 'ADMINISTRADOR GERENCIAL',
                            value: RolesType.ADMINISTRADORGERENCIAL
                        },
                        {
                            label: 'ADMINISTRADOR CONTABLE',
                            value: RolesType.ADMINISTRADORCONTABLE
                        },
                        {
                            label: 'ADMINISTRADOR OPERATIVO',
                            value: RolesType.ADMINISTRADOROPERATIVO
                        },
                        {
                            label: 'USUARIO ESTÁNDAR',
                            value: RolesType.USUARIOESTANDAR
                        }
                    ]
                }
            },
            {
                field: 'correoElectronico',
                filter: {
                    label: "Correo electrónico",
                    filterType: FilterType.EQUALS,
                    dataType: DataType.TEXT
                }
            },
            {
                field: 'usuarioId',
                filter: {
                    label: "ID Usuario",
                    filterType: FilterType.EQUALS,
                    dataType: DataType.NUMBER
                }
            },
            {
                field: 'personaId',
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
            rolId: [],
            correoElectronico: '',
            usuarioId: '',
            personaId: '',
            estado: null
        }
    );
}