import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';


export interface FacturasResponse {
    factura_id: number;
    cliente_id: number;
    pedido_id: number;
    usuario_id?: number;
    fecha: Date | string;
    estado: string;
}


export interface CreateFacturas {
    cliente_id: number;
    pedido_id: number;
    usuario_id: number;
    fecha: string;
    estado: string;
}


export interface DeleteFacturasResponse {
    message: string;
}



@Injectable({
    providedIn: 'root'
})
export class FacturasService {

    private readonly url =
        `${baseUrl}/facturas`;


    constructor(
        private readonly http: HttpClient
    ) {}


    // =========================================================
    // GET ALL
    // GET /
    // =========================================================

    getFacturas() {

        return this.http.get<FacturasResponse[]>(
            this.url,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY FACTURA ID
    // GET /:facturaId
    // =========================================================

    getFacturaById(
        facturaId: number
    ) {

        return this.http.get<FacturasResponse>(
            `${this.url}/${facturaId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY CLIENTE ID
    // GET /cliente/:clienteId
    // =========================================================

    getFacturaByClienteId(
        clienteId: number
    ) {

        return this.http.get<FacturasResponse>(
            `${this.url}/cliente/${clienteId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY PEDIDO ID
    // GET /pedido/:pedidoId
    // =========================================================

    getFacturaByPedidoId(
        pedidoId: number
    ) {

        return this.http.get<FacturasResponse>(
            `${this.url}/pedido/${pedidoId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY USER ID
    // GET /user/:userId
    // =========================================================

    getFacturaByUserId(
        userId: number
    ) {

        return this.http.get<FacturasResponse>(
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

    createFactura(
        dto: CreateFacturas
    ) {

        return this.http.post<FacturasResponse>(
            this.url,
            dto,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // DELETE BY FACTURA ID
    // DELETE /:facturaId
    // =========================================================

    deleteFactura(
        facturaId: number
    ) {

        return this.http.delete<DeleteFacturasResponse>(
            `${this.url}/${facturaId}`,
            {
                withCredentials: true
            }
        );

    }

}