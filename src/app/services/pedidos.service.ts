import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';


export interface PedidosResponse {
    pedido_id: number;
    cliente_id: number;
    usuario_id?: number;
    fecha_pedido: Date | string;
    estado_pedido: string;
    direccion_entrega: string;
    estado_envio: string;
    fecha_salida: Date | string;
    fecha_entrega: Date | string;
    observaciones: string;
}


export interface CreatePedidos {
    cliente_id: number;
    usuario_id?: number;
    fecha_pedido: string;
    estado_pedido: string;
    direccion_entrega: string;
    estado_envio: string;
    fecha_salida: string;
    fecha_entrega: string;
    observaciones: string;
}


export interface UpdatePedidos {
    usuario_id?: number;
    estado_pedido?: string;
    direccion_entrega?: string;
    estado_envio?: string;
    observaciones?: string;
}


export interface DeletePedidosResponse {
    message: string;
}



@Injectable({
    providedIn: 'root'
})
export class PedidosService {

    private readonly url =
        `${baseUrl}/pedidos`;


    constructor(
        private readonly http: HttpClient
    ) {}


    // =========================================================
    // GET ALL
    // GET /
    // =========================================================

    getPedidos() {

        return this.http.get<PedidosResponse[]>(
            this.url,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY PEDIDO ID
    // GET /:pedidoId
    // =========================================================

    getPedidoById(
        pedidoId: number
    ) {

        return this.http.get<PedidosResponse>(
            `${this.url}/${pedidoId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY CLIENTE ID
    // GET /cliente/:clienteId
    // =========================================================

    getPedidoByClienteId(
        clienteId: number
    ) {

        return this.http.get<PedidosResponse>(
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

    getPedidoByUserId(
        userId: number
    ) {

        return this.http.get<PedidosResponse>(
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

    createPedido(
        dto: CreatePedidos
    ) {

        return this.http.post<PedidosResponse>(
            this.url,
            dto,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // UPDATE BY PEDIDO ID
    // PATCH /:pedidoId
    // =========================================================

    updatePedido(
        pedidoId: number,
        dto: UpdatePedidos
    ) {

        return this.http.patch<PedidosResponse>(
            `${this.url}/${pedidoId}`,
            dto,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // DELETE BY PEDIDO ID
    // DELETE /:pedidoId
    // =========================================================

    deletePedido(
        pedidoId: number
    ) {

        return this.http.delete<DeletePedidosResponse>(
            `${this.url}/${pedidoId}`,
            {
                withCredentials: true
            }
        );

    }

}