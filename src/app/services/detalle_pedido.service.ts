import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';


export interface DetallePedidoResponse {
    detalle_pedido_id: number;
    pedido_id: number;
    producto_id?: number;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
}


export interface CreateDetallePedido {
    pedido_id: number;
    producto_id?: number;
    cantidad: number;
    precio_unitario: number;
}


export interface UpdateDetallePedido {
    producto_id?: number;
    cantidad?: number;
    precio_unitario?: number;
}


export interface DeleteDetallePedidoResponse {
    message: string;
}



@Injectable({
    providedIn: 'root'
})
export class DetallePedidoService {

    private readonly url =
        `${baseUrl}/detalle-pedido`;


    constructor(
        private readonly http: HttpClient
    ) {}


    // =========================================================
    // GET ALL
    // GET /
    // =========================================================

    getDetalles() {

        return this.http.get<DetallePedidoResponse[]>(
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

        return this.http.get<DetallePedidoResponse>(
            `${this.url}/${detalleId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY PEDIDO ID
    // GET /pedido/:pedidoId
    // =========================================================

    getDetalleByPedidoId(
        pedidoId: number
    ) {

        return this.http.get<DetallePedidoResponse>(
            `${this.url}/pedido/${pedidoId}`,
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

        return this.http.get<DetallePedidoResponse>(
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
        dto: CreateDetallePedido
    ) {

        return this.http.post<DetallePedidoResponse>(
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
        dto: UpdateDetallePedido
    ) {

        return this.http.patch<DetallePedidoResponse>(
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

        return this.http.delete<DeleteDetallePedidoResponse>(
            `${this.url}/${detalleId}`,
            {
                withCredentials: true
            }
        );

    }

}