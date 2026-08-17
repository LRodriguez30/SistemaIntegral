import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';

export interface UsersResponse {
    usuarioId: number;
    personaId: number;
    correoElectronico: string;
    contraseña: string;
    rolId: string;
    estado: boolean;
}

export interface CreateUser {
    personaId: number;
    correoElectronico: string;
    contraseña: string;
    rolId: string;
    estado: boolean;
}

export interface UpdateUser {
    rolId: string;
    estado: boolean;
}

export enum RolesType {
    SUPERADMINISTRADOR = "Superadministrador",
    ADMINISTRADORGERENCIAL = "Administrador Gerencial",
    ADMINISTRADORCONTABLE = "Administrador Contable",
    ADMINISTRADOROPERATIVO = "Administrador Operativo",
    USUARIOESTANDAR = "Usuario Estándar"
}

export interface UserEnums {
  userRole: RolesType;
}

@Injectable({ providedIn: 'root' })
export class UsersService {

    private url = `${baseUrl}/users/sqlServer`;

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