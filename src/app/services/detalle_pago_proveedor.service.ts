import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';

export interface DetallePagoProveedorResponse {
    detalle_pago_id: number;
    pago_id: number;
    compra_id: number;
    monto_aplicado: number;
}

export interface CreateDetallePagoProveedor {
    pago_id: number;
    compra_id: number;
    monto_aplicado: number;
}

export interface UpdateDetallePagoProveedor {
    monto_aplicado?: number;
}

export interface DeleteDetallePagoProveedorResponse {
    message: string;
}

@Injectable({ providedIn: 'root' })
export class DetallePagoProveedorService {

    private readonly url = `${baseUrl}/detalle-pago-proveedor`;

    constructor(private readonly http: HttpClient) {}

    // GET /
    getDetalles() {
        return this.http.get<DetallePagoProveedorResponse[]>(this.url, { withCredentials: true });
    }

    // GET /:detalleId
    getDetalleById(detalleId: number) {
        return this.http.get<DetallePagoProveedorResponse>(`${this.url}/${detalleId}`, { withCredentials: true });
    }

    // GET /pago/:pagoId
    getDetalleByPagoId(pagoId: number) {
        return this.http.get<DetallePagoProveedorResponse>(`${this.url}/pago/${pagoId}`, { withCredentials: true });
    }

    // GET /compra/:compraId
    getDetalleByCompraId(compraId: number) {
        return this.http.get<DetallePagoProveedorResponse>(`${this.url}/compra/${compraId}`, { withCredentials: true });
    }

    // POST /
    createDetalle(dto: CreateDetallePagoProveedor) {
        return this.http.post<DetallePagoProveedorResponse>(this.url, dto, { withCredentials: true });
    }

    // PATCH /:detalleId
    updateDetalle(detalleId: number, dto: UpdateDetallePagoProveedor) {
        return this.http.patch<DetallePagoProveedorResponse>(`${this.url}/${detalleId}`, dto, { withCredentials: true });
    }

    // DELETE /:detalleId
    deleteDetalle(detalleId: number) {
        return this.http.delete<DeleteDetallePagoProveedorResponse>(`${this.url}/${detalleId}`, { withCredentials: true });
    }
}