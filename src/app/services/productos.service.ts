import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';


export interface ProductosResponse {
    producto_id: number;
    codigo: string;
    nombre_producto: string;
    descripcion?: string;
    precio_venta: number;
    costo_unitario: number;
    categoria_id: number;
    estado: boolean;
}


export interface CreateProductos {
    codigo: string;
    nombre_producto: string;
    descripcion?: string;
    precio_venta: number;
    costo_unitario: number;
    categoria_id: number;
    estado: boolean;
}


export interface UpdateProductos {
    codigo?: string;
    nombre_producto?: string;
    descripcion?: string;
    precio_venta?: number;
    costo_unitario?: number;
    categoria_id?: number;
    estado?: boolean;
}


export interface DeleteProductosResponse {
    message: string;
}



@Injectable({
    providedIn: 'root'
})
export class ProductosService {

    private readonly url =
        `${baseUrl}/productos`;


    constructor(
        private readonly http: HttpClient
    ) {}


    // =========================================================
    // GET ALL
    // GET /
    // =========================================================

    getProductos() {

        return this.http.get<ProductosResponse[]>(
            this.url,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY PRODUCTO ID
    // GET /:productoId
    // =========================================================

    getProductoById(
        productoId: number
    ) {

        return this.http.get<ProductosResponse>(
            `${this.url}/${productoId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY CATEGORIA ID
    // GET /categoria/:categoriaId
    // =========================================================

    getProductoByCategoriaId(
        categoriaId: number
    ) {

        return this.http.get<ProductosResponse>(
            `${this.url}/categoria/${categoriaId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // CREATE
    // POST /
    // =========================================================

    createProducto(
        dto: CreateProductos
    ) {

        return this.http.post<ProductosResponse>(
            this.url,
            dto,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // UPDATE BY PRODUCTO ID
    // PATCH /:productoId
    // =========================================================

    updateProducto(
        productoId: number,
        dto: UpdateProductos
    ) {

        return this.http.patch<ProductosResponse>(
            `${this.url}/${productoId}`,
            dto,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // DELETE BY PRODUCTO ID
    // DELETE /:productoId
    // =========================================================

    deleteProducto(
        productoId: number
    ) {

        return this.http.delete<DeleteProductosResponse>(
            `${this.url}/${productoId}`,
            {
                withCredentials: true
            }
        );

    }

}