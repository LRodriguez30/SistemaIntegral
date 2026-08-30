import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';

export interface RolesResponse {
    rol_id: number;
    nombre_rol: string;
    descripcion: string;
    estado: boolean;
}

export interface CreateRol {
    nombre_rol: string;
    descripcion: string;
    estado: boolean;
}

export interface UpdateRol {
    nombre_rol: string;
    descripcion: string;
    estado: boolean;
}

@Injectable({ providedIn: 'root' })
export class RolesService {

    private url = `${baseUrl}/roles`;

    constructor(private http: HttpClient) {}

    // GET ALL
    getRoles() {
        return this.http.get<RolesResponse[]>(this.url, {
            withCredentials: true
        });
    }

    // CREATE
    createRol(dto: CreateRol) {
        return this.http.post<RolesResponse>(this.url, dto, {
            withCredentials: true
        });
    }

    // PATCH
    updateRol(dto: UpdateRol, id: number) {
    return this.http.patch<RolesResponse>(`${this.url}/${id}`,
        dto,
        { withCredentials: true}
    );
    }

    // DELETE
    deleteRol(id: number) {
        return this.http.delete(`${this.url}/${id}`, {
            withCredentials: true
        });
    }
}