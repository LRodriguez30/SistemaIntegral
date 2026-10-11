import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';


export interface ClientesResponse {
    cliente_id: number;
    nombre_cliente: string;
    apellido_cliente: string;
    direccion_cliente: string;
    telefono_cliente?: string;
    correo_cliente: string;
    fecha_registro_cl: Date | string;
    nombre_empresa?: string;
    ruc?: string;
    activo: boolean;
}


export interface CreateClientes {
    nombre_cliente: string;
    apellido_cliente: string;
    direccion_cliente: string;
    telefono_cliente?: string;
    correo_cliente: string;
    fecha_registro_cl: string;
    nombre_empresa?: string;
    ruc?: string;
    activo: boolean;
}


export interface UpdateClientes {
    nombre_cliente?: string;
    apellido_cliente?: string;
    direccion_cliente?: string;
    telefono_cliente?: string;
    correo_cliente?: string;
    nombre_empresa?: string;
    ruc?: string;
    activo?: boolean;
}


export interface DeleteClientesResponse {
    message: string;
}



@Injectable({
    providedIn: 'root'
})
export class ClientesService {

    private readonly url =
        `${baseUrl}/clientes`;


    constructor(
        private readonly http: HttpClient
    ) {}


    // =========================================================
    // GET ALL
    // GET /
    // =========================================================

    getClientes() {

        return this.http.get<ClientesResponse[]>(
            this.url,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY CLIENTE ID
    // GET /:clienteId
    // =========================================================

    getClienteById(
        clienteId: number
    ) {

        return this.http.get<ClientesResponse>(
            `${this.url}/${clienteId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // CREATE
    // POST /
    // =========================================================

    createCliente(
        dto: CreateClientes
    ) {

        return this.http.post<ClientesResponse>(
            this.url,
            dto,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // UPDATE BY CLIENTE ID
    // PATCH /:clienteId
    // =========================================================

    updateCliente(
        clienteId: number,
        dto: UpdateClientes
    ) {

        return this.http.patch<ClientesResponse>(
            `${this.url}/${clienteId}`,
            dto,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // DELETE BY CLIENTE ID
    // DELETE /:clienteId
    // =========================================================

    deleteCliente(
        clienteId: number
    ) {

        return this.http.delete<DeleteClientesResponse>(
            `${this.url}/${clienteId}`,
            {
                withCredentials: true
            }
        );

    }

}