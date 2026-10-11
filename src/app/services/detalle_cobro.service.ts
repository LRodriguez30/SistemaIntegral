import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';


export interface DetalleCobroResponse {
    detalle_cobro_id: number;
    cobro_id: number;
    factura_id: number;
    monto_aplicado: number;
}


export interface CreateDetalleCobro {
    cobro_id: number;
    factura_id: number;
    monto_aplicado: number;
}


export interface UpdateDetalleCobro {
    monto_aplicado: number;
}


export interface DeleteDetalleCobroResponse {
    message: string;
}



@Injectable({
    providedIn: 'root'
})
export class DetalleCobroService {

    private readonly url =
        `${baseUrl}/detalle-cobro`;


    constructor(
        private readonly http: HttpClient
    ) {}


    // =========================================================
    // GET ALL
    // GET /
    // =========================================================

    getDetalles() {

        return this.http.get<DetalleCobroResponse[]>(
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

        return this.http.get<DetalleCobroResponse>(
            `${this.url}/${detalleId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY COBRO ID
    // GET /cobro/:cobroId
    // =========================================================

    getDetalleByCobroId(
        cobroId: number
    ) {

        return this.http.get<DetalleCobroResponse>(
            `${this.url}/cobro/${cobroId}`,
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

        return this.http.get<DetalleCobroResponse>(
            `${this.url}/factura/${facturaId}`,
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
        dto: CreateDetalleCobro
    ) {

        return this.http.post<DetalleCobroResponse>(
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
        dto: UpdateDetalleCobro
    ) {

        return this.http.patch<DetalleCobroResponse>(
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

        return this.http.delete<DeleteDetalleCobroResponse>(
            `${this.url}/${detalleId}`,
            {
                withCredentials: true
            }
        );

    }

}