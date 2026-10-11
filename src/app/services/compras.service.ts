import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';

export interface ComprasResponse {
    compra_id: number;
    proveedor_id: number;
    usuario_id?: number;
    fecha: Date | string;
    estado: string;
}

export interface CreateCompras {
    proveedor_id: number;
    usuario_id?: number;
    fecha: string;
    estado: string;
}

// OJO: el backend todavía no tiene PATCH /compras/:id
// (y update-compras.dto.ts exporta la clase como CreateComprasDTO).
export interface UpdateCompras {
    usuario_id?: number;
    estado?: string;
}

export interface DeleteComprasResponse {
    message: string;
}

@Injectable({ providedIn: 'root' })
export class ComprasService {

    private readonly url = `${baseUrl}/compras`;

    constructor(private readonly http: HttpClient) {}

    // GET /
    getCompras() {
        return this.http.get<ComprasResponse[]>(this.url, { withCredentials: true });
    }

    // GET /:compraId
    getCompraById(compraId: number) {
        return this.http.get<ComprasResponse>(`${this.url}/${compraId}`, { withCredentials: true });
    }

    // GET /proveedor/:proveedorId
    getCompraByProveedorId(proveedorId: number) {
        return this.http.get<ComprasResponse>(`${this.url}/proveedor/${proveedorId}`, { withCredentials: true });
    }

    // GET /user/:userId
    getCompraByUserId(userId: number) {
        return this.http.get<ComprasResponse>(`${this.url}/user/${userId}`, { withCredentials: true });
    }

    // POST /
    createCompra(dto: CreateCompras) {
        return this.http.post<ComprasResponse>(this.url, dto, { withCredentials: true });
    }

    // PATCH /:compraId  (requiere agregar el endpoint en el backend)
    updateCompra(compraId: number, dto: UpdateCompras) {
        return this.http.patch<ComprasResponse>(`${this.url}/${compraId}`, dto, { withCredentials: true });
    }

    // DELETE /:compraId
    deleteCompra(compraId: number) {
        return this.http.delete<DeleteComprasResponse>(`${this.url}/${compraId}`, { withCredentials: true });
    }
}