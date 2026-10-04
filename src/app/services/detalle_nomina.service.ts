import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';


export interface DetalleNominaResponse {
    detalle_nomina_id: number;
    nomina_id: number;
    empleado_id: number;
    salario_base: number;
    salario_quincenal: number;
    horas_extras: number;
    ingreso_horas_extras: number;
    total_ingresos: number;
    inss_laboral: number;
    ir: number;
    total_deducciones: number;
    salario_neto: number;
    inatec: number;
    inss_patronal: number;
    vacaciones: number;
    treceavo_mes: number;
    indemnización: number;
}


export interface CreateDetalleNomina {
    nomina_id: number;
    empleado_id: number;
    salario_base: number;
    horas_extras: number;
}


@Injectable({
    providedIn: 'root'
})
export class DetalleNominaService {

    private readonly url =
        `${baseUrl}/detalle-nomina`;


    constructor(
        private readonly http: HttpClient
    ) {}


    // =========================================================
    // GET ALL
    // GET /
    // =========================================================

    getDetallesNomina() {

        return this.http.get<DetalleNominaResponse[]>(
            this.url,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY DETALLE ID
    // GET /:detalleNominaId
    // =========================================================

    getDetalleNominaById(
        detalleNominaId: number
    ) {

        return this.http.get<DetalleNominaResponse>(
            `${this.url}/${detalleNominaId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // GET BY NOMINA ID
    // GET /nomina/:nominaId
    // =========================================================

    getDetallesByNominaId(
        nominaId: number
    ) {

        return this.http.get<DetalleNominaResponse[]>(
            `${this.url}/nomina/${nominaId}`,
            {
                withCredentials: true
            }
        );

    }


    // =========================================================
    // CREATE / UPSERT
    // POST /
    // =========================================================

    createDetallesNomina(
        dto: CreateDetalleNomina[]
    ) {

        return this.http.post<DetalleNominaResponse[]>(
            this.url,
            dto,
            {
                withCredentials: true
            }
        );

    }

}