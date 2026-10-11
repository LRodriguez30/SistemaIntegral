import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';


export interface DetalleFacturaResponse {
    detalle_factura_id: number;
    factura_id: number;
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
}


export interface CreateDetalleFactura {
    factura_id: number;
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
}


export interface UpdateDetalleFactura {
    cantidad: number;
    precio_unitario: number;
}


export interface DeleteDetalleFacturaResponse {
    message: string;
}



@Injectable({
    providedIn: 'root'
})
export class DetalleFacturaService {

    private readonly url =
        `${baseUrl}/detalle-factura`;


    constructor(
        private readonly http: HttpClient
    ) {}


    // =========================================================
    // GET ALL
    // GET /
    // =========================================================

    getDetalles() {

        return this.http.get<DetalleFacturaResponse[]>(
            this.url,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY DETALLE ID
    // GET /:detalleId
    // =========================================================

    getDetalleById(
        detalleId: number
    ) {

        return this.http.get<DetalleFacturaResponse>(
            `${this.url}/${detalleId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY FACTURA ID
    // GET /factura/:facturaId
    // =========================================================

    getDetalleByFacturaId(
        facturaId: number
    ) {

        return this.http.get<DetalleFacturaResponse>(
            `${this.url}/factura/${facturaId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY PRODUCTO ID
    // GET /producto/:productoId
    // =========================================================

    getDetalleByProductoId(
        productoId: number
    ) {

        return this.http.get<DetalleFacturaResponse>(
            `${this.url}/producto/${productoId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // CREATE
    // POST /
    // =========================================================

    createDetalle(
        dto: CreateDetalleFactura
    ) {

        return this.http.post<DetalleFacturaResponse>(
            this.url,
            dto,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // UPDATE BY DETALLE ID
    // PATCH /:detalleId
    // =========================================================

    updateDetalle(
        detalleId: number,
        dto: UpdateDetalleFactura
    ) {

        return this.http.patch<DetalleFacturaResponse>(
            `${this.url}/${detalleId}`,
            dto,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // DELETE BY DETALLE ID
    // DELETE /:detalleId
    // =========================================================

    deleteDetalle(
        detalleId: number
    ) {

        return this.http.delete<DeleteDetalleFacturaResponse>(
            `${this.url}/${detalleId}`,
            {
                withCredentials: true
            }
        );

    }

}