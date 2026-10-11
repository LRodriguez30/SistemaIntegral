import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';

export interface PagosProveedoresResponse {
    pago_id: number;
    proveedor_id: number;
    usuario_id?: number;
    fecha_pago: Date | string;
    metodo_pago: string;
    referencia?: string;
    observaciones?: string;
    estado: string;
}

export interface CreatePagosProveedores {
    proveedor_id: number;
    usuario_id?: number;
    fecha_pago: string;
    metodo_pago: string;
    referencia: string;
    observaciones: string;
    estado: string;
}

export interface UpdatePagosProveedores {
    usuario_id?: number;
    referencia?: string;
    observaciones?: string;
    estado?: string;
}

export interface DeletePagosProveedoresResponse {
    message: string;
}

export enum EstadosPago {
    REGISTRADO = 'REGISTRADO',
    APLICADO = 'APLICADO',
    ANULADO = 'ANULADO'
}

@Injectable({ providedIn: 'root' })
export class PagosProveedoresService {

    private readonly url = `${baseUrl}/pagos-proveedores`;

    constructor(private readonly http: HttpClient) {}

    // GET /
    getPagos() {
        return this.http.get<PagosProveedoresResponse[]>(this.url, { withCredentials: true });
    }

    // GET /:pagoId
    getPagoById(pagoId: number) {
        return this.http.get<PagosProveedoresResponse>(`${this.url}/${pagoId}`, { withCredentials: true });
    }

    // GET /user/:userId
    getPagoByUserId(userId: number) {
        return this.http.get<PagosProveedoresResponse>(`${this.url}/user/${userId}`, { withCredentials: true });
    }

    // POST /
    createPago(dto: CreatePagosProveedores) {
        return this.http.post<PagosProveedoresResponse>(this.url, dto, { withCredentials: true });
    }

    // PATCH /:pagoId
    updatePago(pagoId: number, dto: UpdatePagosProveedores) {
        return this.http.patch<PagosProveedoresResponse>(`${this.url}/${pagoId}`, dto, { withCredentials: true });
    }

    // DELETE /:pagoId
    deletePago(pagoId: number) {
        return this.http.delete<DeletePagosProveedoresResponse>(`${this.url}/${pagoId}`, { withCredentials: true });
    }
}