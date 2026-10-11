import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';

export interface DetalleCompraResponse {
    detalle_compra_id: number;
    compra_id: number;
    producto_id: number;
    cantidad: number;
    costo_unitario: number;
}

export interface CreateDetalleCompra {
    compra_id: number;
    producto_id: number;
    cantidad: number;
    costo_unitario: number;
}

export interface UpdateDetalleCompra {
    cantidad?: number;
    costo_unitario?: number;
}

export interface DeleteDetalleCompraResponse {
    message: string;
}

@Injectable({ providedIn: 'root' })
export class DetalleCompraService {

    private readonly url = `${baseUrl}/detalle-compra`;

    constructor(private readonly http: HttpClient) {}

    // GET /
    getDetalles() {
        return this.http.get<DetalleCompraResponse[]>(this.url, { withCredentials: true });
    }

    // GET /:detalleId
    getDetalleById(detalleId: number) {
        return this.http.get<DetalleCompraResponse>(`${this.url}/${detalleId}`, { withCredentials: true });
    }

    // GET /compra/:compraId
    getDetalleByCompraId(compraId: number) {
        return this.http.get<DetalleCompraResponse>(`${this.url}/compra/${compraId}`, { withCredentials: true });
    }

    // GET /producto/:productoId
    getDetalleByProductoId(productoId: number) {
        return this.http.get<DetalleCompraResponse>(`${this.url}/producto/${productoId}`, { withCredentials: true });
    }

    // POST /
    createDetalle(dto: CreateDetalleCompra) {
        return this.http.post<DetalleCompraResponse>(this.url, dto, { withCredentials: true });
    }

    // PATCH /:detalleId
    updateDetalle(detalleId: number, dto: UpdateDetalleCompra) {
        return this.http.patch<DetalleCompraResponse>(`${this.url}/${detalleId}`, dto, { withCredentials: true });
    }

    // DELETE /:detalleId
    deleteDetalle(detalleId: number) {
        return this.http.delete<DeleteDetalleCompraResponse>(`${this.url}/${detalleId}`, { withCredentials: true });
    }
}