import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';

export interface PersonasResponse {
    persona_id: number;
    primer_nombre: string;
    segundo_nombre: string;
    primer_apellido: string;
    segundo_apellido: string;
    telefono: string;
}

export interface CreatePersona {
    primer_nombre: string;
    segundo_nombre: string;
    primer_apellido: string;
    segundo_apellido: string;
    telefono: string;
}

export interface UpdatePersona {
    primer_nombre: string;
    segundo_nombre: string;
    primer_apellido: string;
    segundo_apellido: string;
    telefono: string;
}

@Injectable({ providedIn: 'root' })
export class PersonasService {

    private url = `${baseUrl}/personas`;

    constructor(private http: HttpClient) {}

    // GET ALL
    getPersonas() {
        return this.http.get<PersonasResponse[]>(this.url, {
            withCredentials: true
        });
    }

    // CREATE
    createPersona(dto: CreatePersona) {
        return this.http.post<PersonasResponse>(this.url, dto, {
            withCredentials: true
        });
    }

    // PATCH
    updatePersona(dto: UpdatePersona, id: number) {
    return this.http.patch<PersonasResponse>(`${this.url}/${id}`,
        dto,
        { withCredentials: true}
    );
    }

    // DELETE
    deletePersona(id: number) {
        return this.http.delete(`${this.url}/${id}`, {
            withCredentials: true
        });
    }
}