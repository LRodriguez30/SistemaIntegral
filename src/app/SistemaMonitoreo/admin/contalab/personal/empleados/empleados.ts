import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    inject,
    signal,
    computed,
    CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';

import {
    EmpleadosService,
    EmpleadosResponse
} from '../../../../../services/empleados.service';

import {
    PersonasService,
    PersonasResponse
} from '../../../../../services/personas.service';

import {
    UsersService,
    UsersResponse
} from '../../../../../services/users.service';

import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

type ModalMode = 'create' | 'edit' | null;

type EmployeeAction =
    | 'delete'
    | 'activate'
    | 'deactivate';

@Component({
    selector: 'app-empleados',
    standalone: true,
    imports: [
        CommonModule,
        MatSelectModule,
        MatInputModule,
        MatFormFieldModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './empleados.html',
    styleUrl: './empleados.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [`

        .table-row-enter {
            animation: table-row-enter 260ms ease-out both;
        }

        @keyframes table-row-enter {
            from {
                opacity: 0;
                transform: translateY(4px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .summary-card-enter {
            animation: summary-card-enter 320ms ease-out both;
        }

        @keyframes summary-card-enter {
            from {
                opacity: 0;
                transform: translateY(6px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .skeleton {
            position: relative;
            overflow: hidden;
            background: #e9ebee;
        }

        .skeleton::after {
            content: '';
            position: absolute;
            inset: 0;
            transform: translateX(-100%);
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, .65),
                transparent
            );
            animation: skeleton-shimmer 1.35s infinite;
        }

        @keyframes skeleton-shimmer {
            100% {
                transform: translateX(100%);
            }
        }

        @media (prefers-reduced-motion: reduce) {

            .table-row-enter,
            .summary-card-enter,
            .skeleton::after {
                animation: none !important;
            }

        }

    `]
})
export class EmpleadosComponent implements OnInit {

    private readonly empleadosService = inject(EmpleadosService);
    private readonly personasService = inject(PersonasService);
    private readonly usersService = inject(UsersService);


    // =========================================================
    // DATA
    // =========================================================

    readonly empleados = signal<EmpleadosResponse[]>([]);

    readonly personas = signal<PersonasResponse[]>([]);

    readonly usuarios = signal<UsersResponse[]>([]);

    readonly loadingEmpleados = signal(false);

    readonly loadingPersonas = signal(false);

    readonly loadingUsuarios = signal(false);

    readonly savingEmpleado = signal(false);

    readonly deleteTarget = signal<EmpleadosResponse | null>(null);

    // =========================================================
    // SEARCH / FILTERS
    // =========================================================

    readonly searchTerm = signal('');

    readonly personaSearchTerm = signal('');

    readonly selectedStatus = signal<
        'TODOS' | 'ACTIVOS' | 'INACTIVOS'
    >('TODOS');


    // =========================================================
    // MODAL
    // =========================================================

    readonly modalMode = signal<ModalMode>(null);

    readonly selectedEmpleado =
        signal<EmpleadosResponse | null>(null);


    // =========================================================
    // ACTION LOADING
    // =========================================================

    readonly actionLoading = signal(false);

    readonly actionEmpleadoId =
        signal<number | null>(null);

    readonly actionType =
        signal<EmployeeAction | null>(null);


    // =========================================================
    // FORM
    // =========================================================

    readonly empleadoForm = signal({
        persona_id: null as number | null,
        cargo: '',
        fecha_ingreso: '',
        salario_base: 0,
        estado: true
    });


    // =========================================================
    // COMPUTED
    // =========================================================

    readonly totalEmpleados = computed(() =>
        this.empleados().length
    );


    readonly empleadosActivos = computed(() =>
        this.empleados().filter(
            empleado => empleado.estado
        ).length
    );


    readonly empleadosInactivos = computed(() =>
        this.empleados().filter(
            empleado => !empleado.estado
        ).length
    );


    readonly cargosRegistrados = computed(() =>
        new Set(
            this.empleados()
                .map(empleado => empleado.cargo)
                .filter(Boolean)
        ).size
    );


    // =========================================================
    // PERSONAS DISPONIBLES
    // =========================================================

    readonly personasDisponibles = computed(() => {

        const empleados = this.empleados();

        const empleadoActual =
            this.selectedEmpleado();

        const personaIdsOcupados = new Set(
            empleados
                .filter(empleado =>
                    empleado.empleado_id !==
                    empleadoActual?.empleado_id
                )
                .map(empleado =>
                    empleado.persona_id
                )
        );

        const search =
            this.personaSearchTerm()
                .trim()
                .toLowerCase();

        return this.personas().filter(persona => {

            if (
                personaIdsOcupados.has(
                    persona.persona_id
                )
            ) {
                return false;
            }

            if (!search) {
                return true;
            }

            const nombre = [
                persona.primer_nombre,
                persona.segundo_nombre,
                persona.primer_apellido,
                persona.segundo_apellido
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return (
                nombre.includes(search) ||
                persona.telefono
                    ?.toLowerCase()
                    .includes(search) ||
                persona.persona_id
                    .toString()
                    .includes(search)
            );
        });
    });


    // =========================================================
    // FILTERED EMPLOYEES
    // =========================================================

    readonly filteredEmpleados = computed(() => {

        const search = this.searchTerm()
            .trim()
            .toLowerCase();

        const status = this.selectedStatus();

        return this.empleados().filter(empleado => {

            const matchesStatus =
                status === 'TODOS' ||
                (status === 'ACTIVOS' && empleado.estado) ||
                (status === 'INACTIVOS' && !empleado.estado);

            if (!matchesStatus) {
                return false;
            }

            if (!search) {
                return true;
            }

            const persona = empleado.persona;

            const nombrePersona = persona
                ? [
                    persona.primer_nombre,
                    persona.segundo_nombre,
                    persona.primer_apellido,
                    persona.segundo_apellido
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                : '';

            return (
                empleado.cargo
                    ?.toLowerCase()
                    .includes(search) ||

                nombrePersona.includes(search) ||

                empleado.persona_id
                    .toString()
                    .includes(search) ||

                empleado.empleado_id
                    .toString()
                    .includes(search)
            );
        });
    });


    // =========================================================
    // INIT
    // =========================================================

    ngOnInit(): void {

        this.getEmpleados();
        this.getPersonas();
        this.getUsuarios();
    }


    // =========================================================
    // GET EMPLEADOS
    // =========================================================

    getEmpleados(): void {

        this.loadingEmpleados.set(true);

        this.empleadosService
            .getEmpleados()
            .subscribe({

                next: empleados => {

                    this.empleados.set(
                        empleados
                    );

                    this.loadingEmpleados.set(false);
                },

                error: error => {

                    console.error(
                        'Error obteniendo empleados:',
                        error
                    );

                    this.loadingEmpleados.set(false);
                }
            });
    }


    // =========================================================
    // GET PERSONAS
    // =========================================================

    getPersonas(): void {

        this.loadingPersonas.set(true);

        this.personasService
            .getPersonas()
            .subscribe({

                next: personas => {

                    this.personas.set(
                        personas
                    );

                    this.loadingPersonas.set(false);
                },

                error: error => {

                    console.error(
                        'Error obteniendo personas:',
                        error
                    );

                    this.loadingPersonas.set(false);
                }
            });
    }


    // =========================================================
    // GET USUARIOS
    // =========================================================

    getUsuarios(): void {

        this.loadingUsuarios.set(true);

        this.usersService
            .getUsers()
            .subscribe({

                next: usuarios => {

                    this.usuarios.set(
                        usuarios
                    );

                    this.loadingUsuarios.set(false);
                },

                error: error => {

                    console.error(
                        'Error obteniendo usuarios:',
                        error
                    );

                    this.loadingUsuarios.set(false);
                }
            });
    }


    // =========================================================
    // REFRESH
    // =========================================================

    refreshData(): void {

        this.getEmpleados();
        this.getPersonas();
        this.getUsuarios();
    }


    // =========================================================
    // MODAL
    // =========================================================

    createEmpleado(): void {

        this.selectedEmpleado.set(null);

        this.personaSearchTerm.set('');

        this.empleadoForm.set({
            persona_id: null,
            cargo: '',
            fecha_ingreso: '',
            salario_base: 0,
            estado: true
        });

        this.modalMode.set('create');
    }


    editEmpleado(
        empleado: EmpleadosResponse
    ): void {

        this.selectedEmpleado.set(
            empleado
        );

        this.personaSearchTerm.set('');

        this.empleadoForm.set({
            persona_id: empleado.persona_id,
            cargo: empleado.cargo,
            fecha_ingreso: this.formatDateForInput(
                empleado.fecha_ingreso
            ),
            salario_base: empleado.salario_base,
            estado: empleado.estado
        });

        this.modalMode.set('edit');
    }


    closeModal(): void {

        if (this.savingEmpleado()) {
            return;
        }

        this.modalMode.set(null);

        this.selectedEmpleado.set(null);

        this.personaSearchTerm.set('');
    }


    // =========================================================
    // FORM
    // =========================================================

    updateForm(
        field: keyof ReturnType<typeof this.empleadoForm>,
        value: any
    ): void {

        this.empleadoForm.update(form => ({
            ...form,
            [field]: value
        }));
    }


    isFormValid(): boolean {

        const form =
            this.empleadoForm();

        if (
            form.persona_id === null ||
            form.persona_id <= 0
        ) {
            return false;
        }

        return (
            form.cargo.trim().length > 0 &&
            form.fecha_ingreso.length > 0 &&
            form.salario_base >= 0
        );
    }


    // =========================================================
    // PERSON SELECT
    // =========================================================

    selectPersona(
        personaId: number
    ): void {

        this.updateForm(
            'persona_id',
            personaId
        );

        this.personaSearchTerm.set('');
    }


    clearPersonaSearch(): void {

        this.personaSearchTerm.set('');
    }


    // =========================================================
    // SAVE
    // =========================================================

    saveEmpleado(): void {

        if (!this.isFormValid()) {
            return;
        }

        const form =
            this.empleadoForm();

        this.savingEmpleado.set(true);


        // -----------------------------------------------------
        // CREATE
        // -----------------------------------------------------

        if (this.modalMode() === 'create') {

            this.empleadosService
                .createEmpleado({

                    persona_id:
                        form.persona_id!,

                    cargo:
                        form.cargo.trim(),

                    fecha_ingreso:
                        new Date(
                            form.fecha_ingreso
                        ),

                    salario_base:
                        Number(
                            form.salario_base
                        ),

                    estado:
                        form.estado
                })
                .subscribe({

                    next: () => {

                        this.savingEmpleado.set(false);

                        this.closeModal();

                        this.getEmpleados();
                    },

                    error: error => {

                        console.error(
                            'Error creando empleado:',
                            error
                        );

                        this.savingEmpleado.set(false);
                    }
                });

            return;
        }


        // -----------------------------------------------------
        // UPDATE
        // -----------------------------------------------------

        const empleado =
            this.selectedEmpleado();

        if (!empleado) {

            this.savingEmpleado.set(false);

            return;
        }


        this.empleadosService
            .updateEmpleado(

                empleado.empleado_id,

                {
                    cargo:
                        form.cargo.trim(),

                    fecha_ingreso:
                        new Date(
                            form.fecha_ingreso
                        ),

                    salario_base:
                        Number(
                            form.salario_base
                        ),

                    estado:
                        form.estado
                }
            )
            .subscribe({

                next: () => {

                    this.savingEmpleado.set(false);

                    this.closeModal();

                    this.getEmpleados();
                },

                error: error => {

                    console.error(
                        'Error actualizando empleado:',
                        error
                    );

                    this.savingEmpleado.set(false);
                }
            });
    }


    // =========================================================
    // DELETE
    // =========================================================

    deleteEmpleado(
        empleado: EmpleadosResponse
    ): void {

        if (this.actionLoading()) {
            return;
        }

        this.deleteTarget.set(empleado);
    }

    cancelDelete(): void {
        this.deleteTarget.set(null);
    }


    confirmDelete(): void {

        const empleado =
            this.deleteTarget();

        if (
            !empleado ||
            this.actionLoading()
        ) {
            return;
        }

        this.startActionLoading(
            empleado.empleado_id,
            'delete'
        );

        const startTime =
            Date.now();

        const minimumDelay = 500;

        this.empleadosService
            .deleteEmpleado(
                empleado.empleado_id
            )
            .subscribe({

                next: () => {

                    const elapsed =
                        Date.now() - startTime;

                    const remaining =
                        Math.max(
                            0,
                            minimumDelay - elapsed
                        );

                    setTimeout(() => {

                        this.clearActionLoading();

                        this.deleteTarget.set(null);

                        this.getEmpleados();

                    }, remaining);

                },

                error: error => {

                    console.error(
                        'Error eliminando empleado:',
                        error
                    );

                    const elapsed =
                        Date.now() - startTime;

                    const remaining =
                        Math.max(
                            0,
                            minimumDelay - elapsed
                        );

                    setTimeout(() => {

                        this.clearActionLoading();

                    }, remaining);

                }

            });
    }

    // =========================================================
    // ACTIVATE
    // =========================================================

    activateEmpleado(
        empleado: EmpleadosResponse
    ): void {

        if (
            this.actionLoading() ||
            empleado.estado
        ) {
            return;
        }

        this.startActionLoading(
            empleado.empleado_id,
            'activate'
        );

        this.empleadosService
            .updateEmpleado(

                empleado.empleado_id,

                {
                    cargo:
                        empleado.cargo,

                    fecha_ingreso:
                        new Date(
                            empleado.fecha_ingreso
                        ),

                    salario_base:
                        empleado.salario_base,

                    estado: true
                }
            )
            .subscribe({

                next: () => {

                    this.clearActionLoading();

                    this.getEmpleados();
                },

                error: error => {

                    console.error(
                        'Error activando empleado:',
                        error
                    );

                    this.clearActionLoading();
                }
            });
    }


    // =========================================================
    // DEACTIVATE
    // =========================================================

    deactivateEmpleado(
        empleado: EmpleadosResponse
    ): void {

        if (
            this.actionLoading() ||
            !empleado.estado
        ) {
            return;
        }

        this.startActionLoading(
            empleado.empleado_id,
            'deactivate'
        );

        this.empleadosService
            .updateEmpleado(

                empleado.empleado_id,

                {
                    cargo:
                        empleado.cargo,

                    fecha_ingreso:
                        new Date(
                            empleado.fecha_ingreso
                        ),

                    salario_base:
                        empleado.salario_base,

                    estado: false
                }
            )
            .subscribe({

                next: () => {

                    this.clearActionLoading();

                    this.getEmpleados();
                },

                error: error => {

                    console.error(
                        'Error desactivando empleado:',
                        error
                    );

                    this.clearActionLoading();
                }
            });
    }


    // =========================================================
    // ACTION LOADING
    // =========================================================

    isActionLoading(
        empleadoId: number,
        action: EmployeeAction
    ): boolean {

        return (
            this.actionLoading() &&
            this.actionEmpleadoId() === empleadoId &&
            this.actionType() === action
        );
    }


    private startActionLoading(
        empleadoId: number,
        action: EmployeeAction
    ): void {

        this.actionEmpleadoId.set(
            empleadoId
        );

        this.actionType.set(
            action
        );

        this.actionLoading.set(true);
    }


    private clearActionLoading(): void {

        this.actionLoading.set(false);

        this.actionEmpleadoId.set(null);

        this.actionType.set(null);
    }


    // =========================================================
    // PERSONA
    // =========================================================

    getPersonaName(
        empleado: EmpleadosResponse
    ): string {

        if (empleado.persona) {

            return [
                empleado.persona.primer_nombre,
                empleado.persona.segundo_nombre,
                empleado.persona.primer_apellido,
                empleado.persona.segundo_apellido
            ]
                .filter(Boolean)
                .join(' ');
        }

        const persona =
            this.getPersonaById(
                empleado.persona_id
            );

        if (!persona) {
            return `Persona #${empleado.persona_id}`;
        }


        // 3. Construir nombre desde PersonasService
        return [
            persona.primer_nombre,
            persona.segundo_nombre,
            persona.primer_apellido,
            persona.segundo_apellido
        ]
            .filter(Boolean)
            .join(' ');
    }


    getInitials(
        empleado: EmpleadosResponse
    ): string {

        const persona =
            empleado.persona ??
            this.getPersonaById(
                empleado.persona_id
            );

        if (!persona) {
            return 'PE';
        }

        const first =
            persona.primer_nombre
                ?.trim()
                .charAt(0) ?? '';

        const last =
            persona.segundo_apellido
                ?.trim()
                .charAt(0) ?? '';

        return (
            first + last
        ).toUpperCase();
    }


    getPersonaById(
        personaId: number | null
    ): PersonasResponse | null {

        if (personaId === null) {
            return null;
        }

        return this.personas().find(
            persona =>
                persona.persona_id === personaId
        ) ?? null;
    }


    getPersonaNameById(
        personaId: number | null
    ): string {

        const persona =
            this.getPersonaById(
                personaId
            );

        if (!persona) {
            return '';
        }

        return [
            persona.primer_nombre,
            persona.segundo_nombre,
            persona.primer_apellido,
            persona.segundo_apellido
        ]
            .filter(Boolean)
            .join(' ');
    }


    // =========================================================
    // USUARIO
    // =========================================================

    getUsuarioByPersonaId(
        personaId: number
    ): UsersResponse | null {

        return this.usuarios().find(
            usuario =>
                usuario.persona_id === personaId
        ) ?? null;
    }


    hasUsuario(
        empleado: EmpleadosResponse
    ): boolean {

        return !!this.getUsuarioByPersonaId(
            empleado.persona_id
        );
    }


    getUsuarioEmail(
        empleado: EmpleadosResponse
    ): string {

        return this.getUsuarioByPersonaId(
            empleado.persona_id
        )?.correo_electronico ?? '';
    }


    // =========================================================
    // DATES
    // =========================================================

    formatDate(
        date: Date | string
    ): string {

        if (!date) {
            return '—';
        }

        const parsed =
            new Date(date);

        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {
            return '—';
        }

        return new Intl.DateTimeFormat(
            'es-NI',
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }
        ).format(parsed);
    }


    formatDateForInput(
        date: Date | string
    ): string {

        if (!date) {
            return '';
        }

        const parsed =
            new Date(date);

        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {
            return '';
        }

        const year =
            parsed.getFullYear();

        const month =
            String(
                parsed.getMonth() + 1
            ).padStart(2, '0');

        const day =
            String(
                parsed.getDate()
            ).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }


    // =========================================================
    // CURRENCY
    // =========================================================

    formatCurrency(
        value: number
    ): string {

        return new Intl.NumberFormat(
            'es-NI',
            {
                style: 'currency',
                currency: 'NIO',
                minimumFractionDigits: 2
            }
        ).format(
            value ?? 0
        );
    }
}