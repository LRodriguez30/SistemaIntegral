import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';


export type TipoOrigen =
    | 'VENTA'
    | 'COMPRA'
    | 'CAJA'
    | 'BANCO'
    | 'NOMINA'
    | 'AJUSTE'
    | 'DEPRECIACION'
    | 'CIERRE';


export interface AsientosContablesResponse {
    asiento_id: number;
    usuario_id: number;
    fecha: Date;
    concepto: string;
    tipo_origen: TipoOrigen;
    total_debe: number;
    total_haber: number;
}


export interface CreateAsientoContable {
    usuario_id: number;
    fecha: string;
    concepto: string;
    tipo_origen: TipoOrigen;
    total_debe: number;
    total_haber: number;
}


export interface CreateDetalleAsientoContable {
    debe: number;
    haber: number;
    asiento_id: number;
    cuenta_id: number;
}


export interface CreateFullAsientoContable {
    asiento_contable: CreateAsientoContable;
    detalles_asientos_contables: CreateDetalleAsientoContable[];
}


export interface UpdateAsientoContable {
    total_debe?: number;
    total_haber?: number;
    fecha?: string;
    concepto?: string;
    tipo_origen?: TipoOrigen;
}


@Injectable({
    providedIn: 'root'
})
export class AsientosContablesService {

    private url = `${baseUrl}/asientos-contables`;


    constructor(
        private http: HttpClient
    ) {}


    // =========================================================
    // GET ALL
    // GET /
    // =========================================================

    getAsientosContables() {
        return this.http.get<AsientosContablesResponse[]>(
            this.url,
            {
                withCredentials: true
            }
        );
    }


    // =========================================================
    // GET BY ASIENTO ID
    // GET /:asientoId
    // =========================================================

    getAsientoContableById(asientoId: number) {
        return this.http.get<AsientosContablesResponse>(
            `${this.url}/${asientoId}`,
            {
                withCredentials: true
            }
        );
    }


    // =========================================================
    // GET BY USER ID
    // GET /:userId
    // =========================================================

    getAsientoContableByUserId(userId: number) {
        return this.http.get<AsientosContablesResponse[]>(
            `${this.url}/${userId}`,
            {
                withCredentials: true
            }
        );
    }


    // =========================================================
    // CREATE
    // POST /
    // =========================================================

    createAsientoContable(dto: CreateAsientoContable) {
        return this.http.post<AsientosContablesResponse>(
            this.url,
            dto,
            {
                withCredentials: true
            }
        );
    }


    // =========================================================
    // CREATE FULL
    // POST /full
    // =========================================================

    createAsientoContableFull(dto: CreateFullAsientoContable) {
        return this.http.post<AsientosContablesResponse>(
            `${this.url}/full`,
            dto,
            {
                withCredentials: true
            }
        );
    }


    // =========================================================
    // UPDATE BY ID
    // PATCH /:id
    // =========================================================

    updateAsientoContable(
        asientoId: number,
        dto: UpdateAsientoContable
    ) {
        return this.http.patch<AsientosContablesResponse>(
            `${this.url}/${asientoId}`,
            dto,
            {
                withCredentials: true
            }
        );
    }


    // =========================================================
    // CREATE BASE LAYOUT
    // POST /layout
    // =========================================================

    createBaseLayout() {
        return this.http.post<AsientosContablesResponse[]>(
            `${this.url}/layout`,
            {},
            {
                withCredentials: true
            }
        );
    }


    // =========================================================
    // CREATE FULL BASE LAYOUT
    // POST /full-layout
    // =========================================================

    createFullBaseLayout() {
        return this.http.post<AsientosContablesResponse[]>(
            `${this.url}/full-layout`,
            {},
            {
                withCredentials: true
            }
        );
    }


    // =========================================================
    // DELETE ALL RECORDS
    // DELETE /
    // =========================================================

    deleteRecords() {
        return this.http.delete(
            this.url,
            {
                withCredentials: true
            }
        );
    }


    // =========================================================
    // DELETE BY ASIENTO ID
    // DELETE /:asientoId
    // =========================================================

    deleteAsientoContable(asientoId: number) {
        return this.http.delete(
            `${this.url}/${asientoId}`,
            {
                withCredentials: true
            }
        );
    }

}