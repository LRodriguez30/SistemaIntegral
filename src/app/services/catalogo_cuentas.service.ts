import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';

export type TipoCuenta =
    | 'ACTIVO'
    | 'PASIVO'
    | 'PATRIMONIO'
    | 'INGRESO'
    | 'COSTO'
    | 'GASTO';

export type Naturaleza =
    | 'DEUDORA'
    | 'ACREEDORA';

export interface CatalogoCuentasResponse {
    cuenta_id: number;
    codigo_cuenta: string;
    nombre_cuenta: string;
    tipo_cuenta: TipoCuenta;
    naturaleza: Naturaleza;
    cuenta_padre_id: number | null;
    nivel_cuenta: number;
    permite_movimiento: boolean;
    estado: boolean;
}

export interface UpsertCuenta {
    codigo_cuenta: string;
    nombre_cuenta: string;
    tipo_cuenta: TipoCuenta;
    naturaleza: Naturaleza;
    cuenta_padre_id: number | null;
    nivel_cuenta: number;
    permite_movimiento: boolean;
    estado: boolean;
}

@Injectable({ providedIn: 'root' })
export class CatalogoCuentasService {

    private url = `${baseUrl}/catalogo-cuentas`;

    constructor(private http: HttpClient) {}

    // GET ALL
    getCatalogoCuentas() {
        return this.http.get<CatalogoCuentasResponse[]>(
            this.url,
            {
                withCredentials: true
            }
        );
    }

    // CREATE
    createCuenta(dto: UpsertCuenta) {
        return this.http.post<CatalogoCuentasResponse>(
            this.url,
            dto,
            {
                withCredentials: true
            }
        );
    }

    // UPDATE
    updateCuenta(id: number, dto: UpsertCuenta) {
        return this.http.put<CatalogoCuentasResponse>(
            `${this.url}/${id}`,
            dto,
            {
                withCredentials: true
            }
        );
    }

    // LAYOUT
    initBaseLayout() {
        return this.http.post<CatalogoCuentasResponse[]>(
            `${this.url}/layout`,
            {},
            {
                withCredentials: true
            }
        );
    }

    // DELETE ALL
    deleteRecords() {
        return this.http.delete(
            this.url,
            {
                withCredentials: true
            }
        );
    }

    // DELETE BY ID
    deleteCuenta(id: number) {
        return this.http.delete(
            `${this.url}/${id}`,
            {
                withCredentials: true
            }
        );
    }

    // DELETE RAMA BY CUENTA ID
    deleteCuentaRama(id: number) {
        return this.http.delete(
            `${this.url}/rama/${id}`,
            {
                withCredentials: true
            }
        );
    }
}