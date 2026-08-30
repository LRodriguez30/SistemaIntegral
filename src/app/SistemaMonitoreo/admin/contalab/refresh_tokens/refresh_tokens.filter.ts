// import {
//     DataType,
//     FilterEngine,
//     FilterType
// } from "../../engines/FilterEngine";

// export interface RefreshTokenFilter {
//     id: string;
//     user_id: string;
//     token_hash: string;
//     device_info: Record<string, any> | null;
//     expires_at: string;
//     created_at: string;
//     revoked: boolean | null;
// }

// export function InitializeFilterEngine() {

//     return new FilterEngine<RefreshTokenFilter>(
//         [
//             {
//                 field: 'id',
//                 filter: {
//                     label: "ID del Token",
//                     filterType: FilterType.EQUALS,
//                     dataType: DataType.TEXT
//                 }
//             },
//             {
//                 field: 'user_id',
//                 filter: {
//                     label: "ID del Usuario",
//                     filterType: FilterType.EQUALS,
//                     dataType: DataType.TEXT
//                 }
//             },
//             {
//                 field: 'token_hash',
//                 filter: {
//                     label: "Clave del Token",
//                     filterType: FilterType.EQUALS,
//                     dataType: DataType.TEXT
//                 }
//             },
//             {
//                 field: 'device_info',
//                 filter: {
//                     label: "Información del dispositivo",
//                     filterType: FilterType.EQUALS,
//                     dataType: DataType.TEXT
//                 }
//             },
//             {
//                 field: 'expires_at',
//                 filter: {
//                     label: "Fecha de expiración",
//                     filterType: FilterType.EQUALS,
//                     dataType: DataType.TEXT
//                 }
//             },
//             {
//                 field: 'created_at',
//                 filter: {
//                     label: "Fecha de creación",
//                     filterType: FilterType.EQUALS,
//                     dataType: DataType.TEXT
//                 }
//             },
//             {
//                 field: 'revoked',
//                 filter: {
//                     label: "Estado del token",
//                     filterType: FilterType.SELECT,
//                     dataType: DataType.BOOLEAN,
//                     options: [
//                         {
//                             label: 'Válido',
//                             value: false
//                         },
//                         {
//                             label: 'Revocado',
//                             value: true
//                         }
//                     ]
//                 }
//             }
//         ],
//         {
//             id: '',
//             user_id: '',
//             token_hash: '',
//             device_info: null,
//             expires_at: '',
//             created_at: '',
//             revoked: null
//         }
//     );
// }