import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';

export interface ProveedoresResponse {
    proveedor_id: number;
    nombre_empresa: string;
    ruc: string;
    telefono: string;
    correo: string;
    direccion: string;
    estado: boolean;
}

export interface CreateProveedores {
    nombre_empresa: string;
    ruc: string;
    telefono: string;
    correo: string;
    direccion: string;
    estado: boolean;
}

export interface UpdateProveedores {
    nombre_empresa?: string;
    ruc?: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    estado?: boolean;
}

export interface DeleteProveedoresResponse {
    message: string;
}

@Injectable({ providedIn: 'root' })
export class ProveedoresService {

    private readonly url = `${baseUrl}/proveedores`;

    constructor(private readonly http: HttpClient) {}

    // GET /
    getProveedores() {
        return this.http.get<ProveedoresResponse[]>(this.url, { withCredentials: true });
    }

    // GET /:proveedorId
    getProveedorById(proveedorId: number) {
        return this.http.get<ProveedoresResponse>(`${this.url}/${proveedorId}`, { withCredentials: true });
    }

    // POST /
    createProveedor(dto: CreateProveedores) {
        return this.http.post<ProveedoresResponse>(this.url, dto, { withCredentials: true });
    }

    // PATCH /:proveedorId
    updateProveedor(proveedorId: number, dto: UpdateProveedores) {
        return this.http.patch<ProveedoresResponse>(`${this.url}/${proveedorId}`, dto, { withCredentials: true });
    }

    // DELETE /:proveedorId
    deleteProveedor(proveedorId: number) {
        return this.http.delete<DeleteProveedoresResponse>(`${this.url}/${proveedorId}`, { withCredentials: true });
    }
}