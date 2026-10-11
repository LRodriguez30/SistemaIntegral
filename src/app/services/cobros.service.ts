import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';


export interface CobrosResponse {
    cobro_id: number;
    cliente_id: number;
    usuario_id: number;
    fecha_cobro: Date | string;
    metodo_pago: string;
    referencia?: string;
    observaciones?: string;
    estado: string;
}


export interface CreateCobros {
    cliente_id: number;
    usuario_id: number;
    fecha_cobro: string;
    metodo_pago: string;
    referencia?: string;
    observaciones?: string;
    estado: string;
}


export interface DeleteCobrosResponse {
    message: string;
}



@Injectable({
    providedIn: 'root'
})
export class CobrosService {

    private readonly url =
        `${baseUrl}/cobros`;


    constructor(
        private readonly http: HttpClient
    ) {}


    // =========================================================
    // GET ALL
    // GET /
    // =========================================================

    getCobros() {

        return this.http.get<CobrosResponse[]>(
            this.url,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY COBRO ID
    // GET /:cobroId
    // =========================================================

    getCobroById(
        cobroId: number
    ) {

        return this.http.get<CobrosResponse>(
            `${this.url}/${cobroId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY CLIENTE ID
    // GET /cliente/:clienteId
    // =========================================================

    getCobroByClienteId(
        clienteId: number
    ) {

        return this.http.get<CobrosResponse>(
            `${this.url}/cliente/${clienteId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY USER ID
    // GET /user/:userId
    // =========================================================

    getCobroByUserId(
        userId: number
    ) {

        return this.http.get<CobrosResponse>(
            `${this.url}/user/${userId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // CREATE
    // POST /
    // =========================================================

    createCobro(
        dto: CreateCobros
    ) {

        return this.http.post<CobrosResponse>(
            this.url,
            dto,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // DELETE BY COBRO ID
    // DELETE /:cobroId
    // =========================================================

    deleteCobro(
        cobroId: number
    ) {

        return this.http.delete<DeleteCobrosResponse>(
            `${this.url}/${cobroId}`,
            {
                withCredentials: true
            }
        );

    }

}