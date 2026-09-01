// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { baseUrl } from '../app';

// export interface UsersResponse {
//     UsuarioId: number;
//     PersonaId: number;
//     CorreoElectronico: string;
//     Contraseña: string;
//     RolId: RolesType;
//     Estado: boolean;
// }

// export interface CreateUser {
//     personaId: number;
//     correoElectronico: string;
//     contraseña: string;
//     rolId: RolesType;
//     estado: boolean;
// }

// export interface UpdateUser {
//     rolId: RolesType;
//     estado: boolean;
// }

// export enum RolesType {
//     SUPERADMINISTRADOR = 1,
//     ADMINISTRADORGERENCIAL = 2,
//     ADMINISTRADORCONTABLE = 3,
//     ADMINISTRADOROPERATIVO = 4,
//     USUARIOESTANDAR = 5
// }

// export interface UserEnums {
//   userRole: RolesType;
// }

// @Injectable({ providedIn: 'root' })
// export class UsersService {

//     private url = `${baseUrl}/users/sqlServer`;

//     constructor(private http: HttpClient) {}

//     // GET ALL
//     getUsers() {
//         return this.http.get<UsersResponse[]>(this.url, {
//             withCredentials: true
//         });
//     }

//     // // GET BY ID
//     // getUserById(id: string) {
//     //     return this.http.get<UsersResponse>(`${this.url}/${id}`, {
//     //         withCredentials: true
//     //     });
//     // }

//     // // GET BY EMAIL
//     // getUserByEmail(email: string) {
//     //     return this.http.get<UsersResponse>(`${this.url}/email/${email}`, {
//     //         withCredentials: true
//     //     });
//     // }

//     // CREATE
//     createUser(dto: CreateUser) {
//         return this.http.post<UsersResponse>(this.url, dto, {
//             withCredentials: true
//         });
//     }

//     // PATCH
//     grantRole(dto: UpdateUser, id: number) {
//     return this.http.patch<UsersResponse>(`${this.url}/${id}`,
//         dto,
//         { withCredentials: true}
//     );
//     }

//     // DELETE
//     deleteUser(id: number) {
//         return this.http.delete(`${this.url}/${id}`, {
//             withCredentials: true
//         });
//     }
// }


import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';

export interface UsersResponse {
    usuario_id: number;
    persona_id: number;
    correo_electronico: string;
    contraseña: string;
    rol_id: RolesType;
    estado: boolean;
}

export interface CreateUser {
    persona_id: number;
    correo_electronico: string;
    contraseña: string;
    rol_id: RolesType;
    estado: boolean;
}

export interface UpdateUser {
    rol_id: RolesType;
    estado: boolean;
}

export enum RolesType {
    SUPERADMINISTRADOR = 1,
    ADMINISTRADORGERENCIAL = 2,
    ADMINISTRADORCONTABLE = 3,
    ADMINISTRADORDEPRODUCCION = 4,
    ADMINISTRADOROPERATIVO = 5,
    USUARIOESTANDAR = 6
}

export interface UserEnums {
  userRole: RolesType;
}

@Injectable({ providedIn: 'root' })
export class UsersService {

    private url = `${baseUrl}/users`;

    constructor(private http: HttpClient) {}

    // GET ALL
    getUsers() {
        return this.http.get<UsersResponse[]>(this.url, {
            withCredentials: true
        });
    }

    // // GET BY ID
    // getUserById(id: string) {
    //     return this.http.get<UsersResponse>(`${this.url}/${id}`, {
    //         withCredentials: true
    //     });
    // }

    // // GET BY EMAIL
    // getUserByEmail(email: string) {
    //     return this.http.get<UsersResponse>(`${this.url}/email/${email}`, {
    //         withCredentials: true
    //     });
    // }

    // CREATE
    createUser(dto: CreateUser) {
        return this.http.post<UsersResponse>(this.url, dto, {
            withCredentials: true
        });
    }

    // PATCH
    grantRole(dto: UpdateUser, id: number) {
    return this.http.patch<UsersResponse>(`${this.url}/${id}`,
        dto,
        { withCredentials: true}
    );
    }

    // DELETE
    deleteUser(id: number) {
        return this.http.delete(`${this.url}/${id}`, {
            withCredentials: true
        });
    }
}