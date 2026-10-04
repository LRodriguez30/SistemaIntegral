import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';

export interface PersonaEmpleado {
    persona_id: number;
    primer_nombre: string;
    segundo_nombre: string | null;
    primer_apellido: string;
    segundo_apellido: string | null;
    telefono: string | null;
}

export interface UsuarioEmpleado {
    usuario_id: number;
    persona_id: number;
    correo_electronico: string;
    rol_id: number;
    estado: boolean;
}

export interface EmpleadosResponse {
    empleado_id: number;
    persona_id: number;
    cargo: string;
    fecha_ingreso: Date;
    salario_base: number;
    estado: boolean;

    /*
     * Se dejan opcionales porque actualmente
     * el endpoint de empleados devuelve solamente
     * los campos propios de empleados.
     */
    persona?: PersonaEmpleado;
    usuario?: UsuarioEmpleado | null;
}

export interface CreateEmpleado {
    persona_id: number;
    cargo: string;
    fecha_ingreso: Date;
    salario_base: number;
    estado: boolean;
}

export interface UpdateEmpleado {
    cargo: string;
    fecha_ingreso: Date;
    salario_base: number;
    estado: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class EmpleadosService {

    private url = `${baseUrl}/empleados`;

    constructor(
        private http: HttpClient
    ) {}

    // GET ALL

    getEmpleados() {
        return this.http.get<EmpleadosResponse[]>(
            this.url,
            {
                withCredentials: true
            }
        );
    }

    // GET BY EMPLEADO ID

    getEmpleadoById(id: number) {
        return this.http.get<EmpleadosResponse>(
            `${this.url}/${id}`,
            {
                withCredentials: true
            }
        );
    }

    // GET BY PERSONA ID

    getEmpleadoByPersonaId(personaId: number) {
        return this.http.get<EmpleadosResponse>(
            `${this.url}/persona/${personaId}`,
            {
                withCredentials: true
            }
        );
    }

    // CREATE

    createEmpleado(dto: CreateEmpleado) {
        return this.http.post<EmpleadosResponse>(
            this.url,
            dto,
            {
                withCredentials: true
            }
        );
    }

    // UPDATE

    updateEmpleado(
        id: number,
        dto: UpdateEmpleado
    ) {
        return this.http.patch<EmpleadosResponse>(
            `${this.url}/${id}`,
            dto,
            {
                withCredentials: true
            }
        );
    }

    // DELETE BY EMPLEADO ID

    deleteEmpleado(id: number) {
        return this.http.delete(
            `${this.url}/${id}`,
            {
                withCredentials: true
            }
        );
    }

    // DELETE BY PERSONA ID

    deleteEmpleadoByPersonaId(personaId: number) {
        return this.http.delete(
            `${this.url}/persona/${personaId}`,
            {
                withCredentials: true
            }
        );
    }
}