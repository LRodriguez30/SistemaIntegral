import { DataType, FilterEngine, FilterType } from "../../engines/FilterEngine";
import { UsersRole } from "../../../../services/users.service";

export interface UserFilter {
    id: string;
    name: string;
    email: string;
    role: UsersRole[];
    created_at: { from: string; to: string; };
    updated_at: { from: string; to: string; };
    last_login: { from: string; to: string; };
}

export function InitializeFilterEngine() {

    return new FilterEngine<UserFilter>(
        [
            {
                field: 'role',
                filter: {
                    label: "Rol de Usuario",
                    filterType: FilterType.MULTI_SELECT,
                    dataType: DataType.SELECT,
                    options: [
                        { label: 'DUEÑO', value: 'Dueño' },
                        { label: 'ADMIN', value: 'Admin' },
                        { label: 'ORGANIZADOR', value: 'Organizador' },
                        { label: 'VISITANTE', value: 'Visitante' }
                    ]
                }
            },
            {
                field: 'created_at',
                filter: {
                    label: "Se creó entre las Fechas:",
                    filterType: FilterType.DATE_RANGE,
                    dataType: DataType.DATETIME
                }
            },
            {
                field: 'updated_at',
                filter: {
                    label: "Se actualizó entre las Fechas:",
                    filterType: FilterType.DATE_RANGE,
                    dataType: DataType.DATETIME
                }
            },
            {
                field: 'last_login',
                filter: {
                    label: "Inició sesión entre las Fechas:",
                    filterType: FilterType.DATE_RANGE,
                    dataType: DataType.DATETIME
                }
            },
            {
                field: 'email',
                filter: {
                    label: "Correo",
                    filterType: FilterType.EQUALS,
                    dataType: DataType.TEXT
                }
            },
            {
                field: 'name',
                filter: {
                    label: "Nombre",
                    filterType: FilterType.EQUALS,
                    dataType: DataType.TEXT
                }
            },
            {
                field: 'id',
                filter: {
                    label: "ID Usuario",
                    filterType: FilterType.EQUALS,
                    dataType: DataType.GUID
                }
            }
        ],
        {
            role: [],
            email: '',
            name: '',
            id: '',
            created_at: { from: '', to: '' },
            updated_at: { from: '', to: '' },
            last_login: { from: '', to: '' }
        }
    );
}