import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';

export interface UsersResponse {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
    last_login: string;
}

export interface CreateUser {
    name: string;
    email: string;
    password: string;
    role: string;
}

export interface GrantRole {
    id: string;
    role: string;
}

export enum UsersRole {
    Dueño = 'Dueño',
    Admin = 'Admin',
    Organizador = 'Organizador',
    Visitante = 'Visitante'
}

export interface UserEnums {
  userRole: UsersRole;
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

    // GET BY ID
    getUserById(id: string) {
        return this.http.get<UsersResponse>(`${this.url}/${id}`, {
            withCredentials: true
        });
    }

    // GET BY EMAIL
    getUserByEmail(email: string) {
        return this.http.get<UsersResponse>(`${this.url}/email/${email}`, {
            withCredentials: true
        });
    }

    // CREATE
    createUser(dto: CreateUser) {
        return this.http.post<UsersResponse>(this.url, dto, {
            withCredentials: true
        });
    }

    // PATCH
    grantRole(dto: GrantRole) {
    return this.http.patch<UsersResponse>(`${this.url}/role`,
        dto,
        { withCredentials: true}
    );
    }

    // DELETE
    deleteUser(id: string) {
        return this.http.delete(`${this.url}/${id}`, {
            withCredentials: true
        });
    }
}