import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';


export interface NominaResponse {
    nomina_id: number;
    periodo_inicio: Date | string;
    periodo_fin: Date | string;
    fecha_pago: Date | string;
    estado: string;
}


export interface CreateNomina {
    periodo_inicio: string;
    periodo_fin: string;
    fecha_pago: string;
    estado: string;
}


export interface UpdateNomina {
    periodo_inicio?: string;
    periodo_fin?: string;
    fecha_pago?: string;
    estado?: string;
}


export interface DeleteNominaResponse {
    message: string;
}



@Injectable({
    providedIn: 'root'
})
export class NominaService {

    private readonly url =
        `${baseUrl}/nomina`;


    constructor(
        private readonly http: HttpClient
    ) {}


    // =========================================================
    // GET ALL
    // GET /
    // =========================================================

    getNominas() {

        return this.http.get<NominaResponse[]>(
            this.url,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY NOMINA ID
    // GET /:nominaId
    // =========================================================

    getNominaById(
        nominaId: number
    ) {

        return this.http.get<NominaResponse>(
            `${this.url}/${nominaId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // CREATE
    // POST /
    // =========================================================

    createNomina(
        dto: CreateNomina
    ) {

        return this.http.post<NominaResponse>(
            this.url,
            dto,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // UPDATE BY NOMINA ID
    // PATCH /:nominaId
    // =========================================================

    updateNomina(
        nominaId: number,
        dto: UpdateNomina
    ) {

        return this.http.patch<NominaResponse>(
            `${this.url}/${nominaId}`,
            dto,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // DELETE BY NOMINA ID
    // DELETE /:nominaId
    // =========================================================

    deleteNomina(
        nominaId: number
    ) {

        return this.http.delete<DeleteNominaResponse>(
            `${this.url}/${nominaId}`,
            {
                withCredentials: true
            }
        );

    }

}