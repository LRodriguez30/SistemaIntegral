import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';


export interface DetallesAsientosContablesResponse {
    detalle_id: number;
    debe: number;
    haber: number;
    asiento_id: number;
    cuenta_id: number;
}


export interface CreateDetallesAsientosContables {
    debe: number;
    haber: number;
    asiento_id: number;
    cuenta_id: number;
}


export interface UpdateDetallesAsientosContables {
    debe?: number;
    haber?: number;
    asiento_id?: number;
    cuenta_id?: number;
}


@Injectable({
    providedIn: 'root'
})
export class DetallesAsientosContablesService {

    private readonly url =
        `${baseUrl}/detalles-asientos-contables`;


    constructor(
        private readonly http: HttpClient
    ) {}


    // =========================================================
    // GET ALL
    // =========================================================

    getDetallesAsientosContables() {

        return this.http.get<
            DetallesAsientosContablesResponse[]
        >(
            this.url,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY DETALLE ID
    // =========================================================

    getDetalleAsientoContableById(
        detalleId: number
    ) {

        return this.http.get<
            DetallesAsientosContablesResponse
        >(
            `${this.url}/${detalleId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY ASIENTO ID
    // =========================================================

    getDetallesByAsientoId(
        asientoId: number
    ) {

        return this.http.get<
            DetallesAsientosContablesResponse
        >(
            `${this.url}/${asientoId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY CUENTA ID
    // =========================================================

    getDetallesByCuentaId(
        cuentaId: number
    ) {

        return this.http.get<
            DetallesAsientosContablesResponse
        >(
            `${this.url}/${cuentaId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // CREATE
    // =========================================================

    createDetalleAsientoContable(
        dto: CreateDetallesAsientosContables
    ) {

        return this.http.post<
            DetallesAsientosContablesResponse
        >(
            this.url,
            dto,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // UPDATE
    // =========================================================

    updateDetalleAsientoContable(
        detalleId: number,
        dto: UpdateDetallesAsientosContables
    ) {

        return this.http.patch<
            DetallesAsientosContablesResponse
        >(
            `${this.url}/${detalleId}`,
            dto,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // DELETE ALL
    // =========================================================

    deleteDetallesAsientosContables() {

        return this.http.delete(
            this.url,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // DELETE BY DETALLE ID
    // =========================================================

    deleteDetalleAsientoContable(
        detalleId: number
    ) {

        return this.http.delete(
            `${this.url}/${detalleId}`,
            {
                withCredentials: true
            }
        );

    }

}