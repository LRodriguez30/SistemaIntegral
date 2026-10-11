import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';


export interface CategoriaProductosResponse {
    categoria_id: number;
    nombre_categoria: string;
}


export interface CreateCategoriaProductos {
    nombre_categoria: string;
}


export interface UpdateCategoriaProductos {
    nombre_categoria?: string;
}


export interface DeleteCategoriaProductosResponse {
    message: string;
}



@Injectable({
    providedIn: 'root'
})
export class CategoriaProductosService {

    private readonly url =
        `${baseUrl}/categoria-productos`;


    constructor(
        private readonly http: HttpClient
    ) {}


    // =========================================================
    // GET ALL
    // GET /
    // =========================================================

    getCategorias() {

        return this.http.get<CategoriaProductosResponse[]>(
            this.url,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY CATEGORIA ID
    // GET /:categoriaId
    // =========================================================

    getCategoriaById(
        categoriaId: number
    ) {

        return this.http.get<CategoriaProductosResponse>(
            `${this.url}/${categoriaId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // CREATE
    // POST /
    // =========================================================

    createCategoria(
        dto: CreateCategoriaProductos
    ) {

        return this.http.post<CategoriaProductosResponse>(
            this.url,
            dto,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // UPDATE BY CATEGORIA ID
    // PATCH /:categoriaId
    // =========================================================

    updateCategoria(
        categoriaId: number,
        dto: UpdateCategoriaProductos
    ) {

        return this.http.patch<CategoriaProductosResponse>(
            `${this.url}/${categoriaId}`,
            dto,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // DELETE BY CATEGORIA ID
    // DELETE /:categoriaId
    // =========================================================

    deleteCategoria(
        categoriaId: number
    ) {

        return this.http.delete<DeleteCategoriaProductosResponse>(
            `${this.url}/${categoriaId}`,
            {
                withCredentials: true
            }
        );

    }

}