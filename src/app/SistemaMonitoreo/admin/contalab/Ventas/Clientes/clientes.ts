import {
    ChangeDetectionStrategy,
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    computed,
    inject,
    OnInit,
    signal
} from '@angular/core';

import {
    forkJoin
} from 'rxjs';

import {
    ClientesService,
    ClientesResponse,
    CreateClientes,
    UpdateClientes
} from '../../../../../services/clientes.service';

import {
    PedidosService,
    PedidosResponse
} from '../../../../../services/pedidos.service';

import {
    FacturasService,
    FacturasResponse
} from '../../../../../services/facturas.service';

import {
    CobrosService,
    CobrosResponse
} from '../../../../../services/cobros.service';


/* =============================================================
   TIPOS
   ============================================================= */

type FiltroEstado =
    | 'todos'
    | 'activos'
    | 'inactivos';


interface ClienteForm {

    nombre_cliente: string;

    apellido_cliente: string;

    direccion_cliente: string;

    telefono_cliente: string;

    correo_cliente: string;

    fecha_registro_cl: string;

    nombre_empresa: string;

    ruc: string;

    activo: boolean;

}


interface RelacionesCliente {

    pedidos: number;

    facturas: number;

    cobros: number;

}


/* =============================================================
   COMPONENTE
   ============================================================= */

@Component({

    selector: 'app-clientes',

    standalone: true,

    imports: [],

    schemas: [
        CUSTOM_ELEMENTS_SCHEMA
    ],

    templateUrl: './clientes.html',

    changeDetection: ChangeDetectionStrategy.OnPush,

    styles: [`

    :host {
      display: block;
      min-height: 100%;
    }

    /* ENTRADA DE PANTALLA */
    .accounting-page-enter { animation: accounting-page-enter 360ms ease-out both; }
    @keyframes accounting-page-enter {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* BACKDROP DE MODALES */
    .modal-backdrop-enter { animation: modal-backdrop-enter 180ms ease-out both; }
    @keyframes modal-backdrop-enter {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    /* PANEL DE MODAL */
    .modal-panel-enter { animation: modal-panel-enter 220ms cubic-bezier(.22, 1, .36, 1) both; }
    @keyframes modal-panel-enter {
      from { opacity: 0; transform: translateY(14px) scale(.985); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* FILAS */
    .table-row-enter { animation: table-row-enter 260ms ease-out both; }
    @keyframes table-row-enter {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* RESUMEN */
    .summary-card-enter { animation: summary-card-enter 320ms ease-out both; }
    @keyframes summary-card-enter {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* SKELETON */
    .skeleton { position: relative; overflow: hidden; background: #e9ebee; }
    .skeleton::after {
      content: '';
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .65), transparent);
      animation: skeleton-shimmer 1.35s infinite;
    }
    @keyframes skeleton-shimmer { 100% { transform: translateX(100%); } }

    /* PULSO DE ESTADO */
    .status-pulse { animation: status-pulse 240ms ease-out; }
    @keyframes status-pulse {
      0%   { transform: scale(.96); opacity: .5; }
      100% { transform: scale(1); opacity: 1; }
    }

    /* SCROLLBAR */
    .accounting-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
    .accounting-scroll::-webkit-scrollbar-track { background: transparent; }
    .accounting-scroll::-webkit-scrollbar-thumb { background: #d5d8dc; border-radius: 999px; }
    .accounting-scroll::-webkit-scrollbar-thumb:hover { background: #bfc3c8; }

    /* REDUCE MOTION */
    @media (prefers-reduced-motion: reduce) {
      .accounting-page-enter,
      .modal-backdrop-enter,
      .modal-panel-enter,
      .table-row-enter,
      .summary-card-enter,
      .status-pulse,
      .skeleton::after { animation: none !important; }
      * { scroll-behavior: auto !important; }
    }

  `]

})
export class ClientesComponent
    implements OnInit {


    /* =============================================================
       SERVICIOS
       ============================================================= */

    private readonly clientesService =
        inject(ClientesService);

    private readonly pedidosService =
        inject(PedidosService);

    private readonly facturasService =
        inject(FacturasService);

    private readonly cobrosService =
        inject(CobrosService);


    /* =============================================================
       CONSTANTES DE VISTA
       ============================================================= */

    readonly filtros: {
        id: FiltroEstado;
        label: string;
    }[] = [

            { id: 'todos', label: 'Todos' },

            { id: 'activos', label: 'Activos' },

            { id: 'inactivos', label: 'Inactivos' }

        ];


    /* =============================================================
       ESTADO PRINCIPAL
       ============================================================= */

    readonly searchTerm =
        signal('');

    readonly filtroEstado =
        signal<FiltroEstado>('todos');


    /* =============================================================
       CARGA
       ============================================================= */

    readonly loading =
        signal(false);

    readonly saving =
        signal(false);

    readonly loadingClientes =
        computed(() =>
            this.loading() ||
            this.saving()
        );


    /* =============================================================
       ERROR
       ============================================================= */

    readonly errorMessage =
        signal<string | null>(null);


    /* =============================================================
       DATOS
       ============================================================= */

    readonly clientes =
        signal<ClientesResponse[]>([]);

    readonly pedidos =
        signal<PedidosResponse[]>([]);

    readonly facturas =
        signal<FacturasResponse[]>([]);

    readonly cobros =
        signal<CobrosResponse[]>([]);


    /* =============================================================
       MODALES
       ============================================================= */

    readonly clienteModalMode =
        signal<'create' | 'edit' | null>(null);

    readonly editingCliente =
        signal<ClientesResponse | null>(null);

    readonly deleteClienteTarget =
        signal<ClientesResponse | null>(null);

    readonly clienteForm =
        signal<ClienteForm>(
            this.emptyForm()
        );


    /* =============================================================
       RELACIONES (PEDIDOS / FACTURAS / COBROS)
       ============================================================= */

    readonly relaciones =
        computed(() => {

            const map =
                new Map<number, RelacionesCliente>();

            const obtener = (
                clienteId: number
            ): RelacionesCliente => {

                let actual =
                    map.get(clienteId);

                if (!actual) {

                    actual = {
                        pedidos: 0,
                        facturas: 0,
                        cobros: 0
                    };

                    map.set(clienteId, actual);

                }

                return actual;

            };

            for (const pedido of this.pedidos()) {
                obtener(pedido.cliente_id).pedidos++;
            }

            for (const factura of this.facturas()) {
                obtener(factura.cliente_id).facturas++;
            }

            for (const cobro of this.cobros()) {
                obtener(cobro.cliente_id).cobros++;
            }

            return map;

        });


    /* =============================================================
       RESUMEN
       ============================================================= */

    readonly totalActivos =
        computed(() =>
            this.clientes().filter(
                cliente =>
                    cliente.activo
            ).length
        );

    readonly totalInactivos =
        computed(() =>
            this.clientes().length -
            this.totalActivos()
        );

    readonly totalEmpresas =
        computed(() =>
            this.clientes().filter(
                cliente =>
                    !!cliente.ruc ||
                    !!cliente.nombre_empresa
            ).length
        );

    readonly nuevosEsteMes =
        computed(() => {

            const ahora =
                new Date();

            const prefijo =
                `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

            return this.clientes().filter(
                cliente =>
                    this.normalizeDate(
                        cliente.fecha_registro_cl
                    ).startsWith(prefijo)
            ).length;

        });


    /* =============================================================
       LISTADO FILTRADO
       ============================================================= */

    readonly clientesFiltrados =
        computed(() => {

            const search =
                this.searchTerm()
                    .trim()
                    .toLowerCase();

            const filtro =
                this.filtroEstado();

            return [...this.clientes()]
                .filter(
                    cliente => {

                        if (
                            filtro === 'activos' &&
                            !cliente.activo
                        ) {
                            return false;
                        }

                        if (
                            filtro === 'inactivos' &&
                            cliente.activo
                        ) {
                            return false;
                        }

                        if (!search) {
                            return true;
                        }

                        return [
                            this.getNombreCompleto(cliente),
                            cliente.nombre_empresa ?? '',
                            cliente.ruc ?? '',
                            cliente.correo_cliente ?? '',
                            cliente.telefono_cliente ?? '',
                            String(cliente.cliente_id)
                        ]
                            .join(' ')
                            .toLowerCase()
                            .includes(search);

                    }
                )
                .sort(
                    (a, b) =>
                        b.cliente_id -
                        a.cliente_id
                );

        });


    /* =============================================================
       FORMULARIO
       ============================================================= */

    readonly telefonoValido =
        computed(() => {

            const telefono =
                this.clienteForm()
                    .telefono_cliente
                    .trim();

            return /^\+[1-9]\d{7,14}$/.test(
                telefono.replace(/[\s-]/g, '')
            );

        });

    readonly correoValido =
        computed(() =>
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                this.clienteForm()
                    .correo_cliente
                    .trim()
            )
        );

    readonly rucValido =
        computed(() => {

            const ruc =
                this.clienteForm()
                    .ruc
                    .trim();

            return (
                !ruc ||
                /^\d{14}$/.test(ruc)
            );

        });

    readonly isFormValid =
        computed(() => {

            const form =
                this.clienteForm();

            return (
                !!form.nombre_cliente.trim() &&
                !!form.apellido_cliente.trim() &&
                !!form.direccion_cliente.trim() &&
                !!form.fecha_registro_cl &&
                this.telefonoValido() &&
                this.correoValido() &&
                this.rucValido()
            );

        });

    readonly relacionesEliminando =
        computed(() => {

            const cliente =
                this.deleteClienteTarget();

            return cliente
                ? this.getRelaciones(
                    cliente.cliente_id
                )
                : null;

        });

    readonly puedeEliminar =
        computed(() => {

            const relaciones =
                this.relacionesEliminando();

            return (
                !!relaciones &&
                relaciones.pedidos === 0 &&
                relaciones.facturas === 0 &&
                relaciones.cobros === 0
            );

        });


    /* =============================================================
       INICIALIZACIÓN
       ============================================================= */

    ngOnInit(): void {

        this.loadData();

    }


    /* =============================================================
       CARGAR DATOS
       ============================================================= */

    private loadData(): void {

        this.loading.set(true);

        this.errorMessage.set(null);

        forkJoin({

            clientes:
                this.clientesService
                    .getClientes(),

            pedidos:
                this.pedidosService
                    .getPedidos(),

            facturas:
                this.facturasService
                    .getFacturas(),

            cobros:
                this.cobrosService
                    .getCobros()

        }).subscribe({

            next: ({
                clientes,
                pedidos,
                facturas,
                cobros
            }) => {

                this.clientes.set(clientes);

                this.pedidos.set(pedidos);

                this.facturas.set(facturas);

                this.cobros.set(cobros);

                this.loading.set(false);

            },

            error: (error) => {

                console.error(
                    'Error cargando los clientes:',
                    error
                );

                this.errorMessage.set(
                    this.getErrorMessage(
                        error,
                        'No se pudieron cargar los clientes.'
                    )
                );

                this.loading.set(false);

            }

        });

    }


    refreshData(): void {

        if (this.loadingClientes()) {
            return;
        }

        this.loadData();

    }


    /* =============================================================
       FILTROS
       ============================================================= */

    setFiltro(
        filtro: FiltroEstado
    ): void {

        this.filtroEstado.set(filtro);

    }


    /* =============================================================
       CREAR / EDITAR
       ============================================================= */

    openCreateCliente(): void {

        if (this.loadingClientes()) {
            return;
        }

        this.editingCliente.set(null);

        this.clienteForm.set(
            this.emptyForm()
        );

        this.clienteModalMode.set('create');

    }


    openEditCliente(
        cliente: ClientesResponse
    ): void {

        if (this.loadingClientes()) {
            return;
        }

        this.editingCliente.set(cliente);

        this.clienteForm.set({

            nombre_cliente:
                cliente.nombre_cliente ?? '',

            apellido_cliente:
                cliente.apellido_cliente ?? '',

            direccion_cliente:
                cliente.direccion_cliente ?? '',

            telefono_cliente:
                cliente.telefono_cliente ?? '',

            correo_cliente:
                cliente.correo_cliente ?? '',

            fecha_registro_cl:
                this.normalizeDate(
                    cliente.fecha_registro_cl
                ),

            nombre_empresa:
                cliente.nombre_empresa ?? '',

            ruc:
                cliente.ruc ?? '',

            activo:
                cliente.activo

        });

        this.clienteModalMode.set('edit');

    }


    closeClienteModal(): void {

        if (this.saving()) {
            return;
        }

        this.clienteModalMode.set(null);

        this.editingCliente.set(null);

    }


    updateForm<K extends keyof ClienteForm>(
        field: K,
        value: ClienteForm[K]
    ): void {

        this.clienteForm.update(
            form => ({

                ...form,

                [field]: value

            })
        );

    }


    saveCliente(): void {

        if (
            !this.isFormValid() ||
            this.saving()
        ) {
            return;
        }

        const form =
            this.clienteForm();

        const mode =
            this.clienteModalMode();

        const telefono =
            form.telefono_cliente
                .replace(/[\s-]/g, '');

        const empresa =
            form.nombre_empresa.trim();

        const ruc =
            form.ruc.trim();

        this.saving.set(true);

        this.errorMessage.set(null);

        if (mode === 'create') {

            const dto: CreateClientes = {

                nombre_cliente:
                    form.nombre_cliente.trim(),

                apellido_cliente:
                    form.apellido_cliente.trim(),

                direccion_cliente:
                    form.direccion_cliente.trim(),

                telefono_cliente:
                    telefono,

                correo_cliente:
                    form.correo_cliente.trim(),

                fecha_registro_cl:
                    form.fecha_registro_cl,

                activo:
                    form.activo,

                ...(empresa
                    ? { nombre_empresa: empresa }
                    : {}),

                ...(ruc
                    ? { ruc }
                    : {})

            };

            this.clientesService
                .createCliente(dto)
                .subscribe({

                    next: () => {

                        this.saving.set(false);

                        this.closeClienteModal();

                        this.loadData();

                    },

                    error: (error) => {

                        console.error(
                            'Error creando el cliente:',
                            error
                        );

                        this.errorMessage.set(
                            this.getErrorMessage(
                                error,
                                'No se pudo crear el cliente.'
                            )
                        );

                        this.saving.set(false);

                    }

                });

            return;

        }

        const cliente =
            this.editingCliente();

        if (!cliente) {

            this.saving.set(false);

            return;

        }

        const dto: UpdateClientes = {

            nombre_cliente:
                form.nombre_cliente.trim(),

            apellido_cliente:
                form.apellido_cliente.trim(),

            direccion_cliente:
                form.direccion_cliente.trim(),

            telefono_cliente:
                telefono,

            correo_cliente:
                form.correo_cliente.trim(),

            activo:
                form.activo,

            ...(empresa
                ? { nombre_empresa: empresa }
                : {}),

            ...(ruc
                ? { ruc }
                : {})

        };

        this.clientesService
            .updateCliente(
                cliente.cliente_id,
                dto
            )
            .subscribe({

                next: () => {

                    this.saving.set(false);

                    this.closeClienteModal();

                    this.loadData();

                },

                error: (error) => {

                    console.error(
                        'Error actualizando el cliente:',
                        error
                    );

                    this.errorMessage.set(
                        this.getErrorMessage(
                            error,
                            'No se pudo actualizar el cliente.'
                        )
                    );

                    this.saving.set(false);

                }

            });

    }


    /* =============================================================
       ACTIVAR / DESACTIVAR
       ============================================================= */

    toggleActivo(
        cliente: ClientesResponse
    ): void {

        if (this.loadingClientes()) {
            return;
        }

        this.saving.set(true);

        this.errorMessage.set(null);

        this.clientesService
            .updateCliente(
                cliente.cliente_id,
                {
                    activo: !cliente.activo
                }
            )
            .subscribe({

                next: () => {

                    this.saving.set(false);

                    this.loadData();

                },

                error: (error) => {

                    console.error(
                        'Error cambiando el estado del cliente:',
                        error
                    );

                    this.errorMessage.set(
                        this.getErrorMessage(
                            error,
                            'No se pudo cambiar el estado del cliente.'
                        )
                    );

                    this.saving.set(false);

                }

            });

    }


    /* =============================================================
       ELIMINAR
       ============================================================= */

    openDeleteCliente(
        cliente: ClientesResponse
    ): void {

        if (this.loadingClientes()) {
            return;
        }

        this.deleteClienteTarget.set(
            cliente
        );

    }


    closeDeleteCliente(): void {

        if (this.saving()) {
            return;
        }

        this.deleteClienteTarget.set(null);

    }


    confirmDeleteCliente(): void {

        const cliente =
            this.deleteClienteTarget();

        if (
            !cliente ||
            this.saving() ||
            !this.puedeEliminar()
        ) {
            return;
        }

        this.saving.set(true);

        this.errorMessage.set(null);

        this.clientesService
            .deleteCliente(
                cliente.cliente_id
            )
            .subscribe({

                next: () => {

                    this.saving.set(false);

                    this.deleteClienteTarget.set(null);

                    this.loadData();

                },

                error: (error) => {

                    console.error(
                        'Error eliminando el cliente:',
                        error
                    );

                    this.errorMessage.set(
                        this.getErrorMessage(
                            error,
                            'No se pudo eliminar el cliente.'
                        )
                    );

                    this.saving.set(false);

                    this.deleteClienteTarget.set(null);

                }

            });

    }


    /* =============================================================
       AYUDAS DE CLIENTE
       ============================================================= */

    getRelaciones(
        clienteId: number
    ): RelacionesCliente {

        return (
            this.relaciones().get(clienteId) ?? {
                pedidos: 0,
                facturas: 0,
                cobros: 0
            }
        );

    }


    getNombreCompleto(
        cliente: ClientesResponse
    ): string {

        return [
            cliente.nombre_cliente,
            cliente.apellido_cliente
        ]
            .filter(Boolean)
            .join(' ');

    }


    getIniciales(
        cliente: ClientesResponse
    ): string {

        const first =
            cliente.nombre_cliente
                ?.trim()
                .charAt(0) ?? '';

        const last =
            cliente.apellido_cliente
                ?.trim()
                .charAt(0) ?? '';

        return (
            first + last
        ).toUpperCase() || 'CL';

    }


    /* =============================================================
       FORMATO
       ============================================================= */

    formatDate(
        value:
            Date |
            string |
            null |
            undefined
    ): string {

        const text =
            this.normalizeDate(value);

        if (!text) {
            return '—';
        }

        const [year, month, day] =
            text
                .split('-')
                .map(Number);

        const parsed =
            new Date(
                year,
                month - 1,
                day
            );

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


    private normalizeDate(
        value:
            Date |
            string |
            null |
            undefined
    ): string {

        if (!value) {
            return '';
        }

        if (
            typeof value === 'string'
        ) {

            return value.slice(0, 10);

        }

        return value
            .toISOString()
            .slice(0, 10);

    }


    private toInputDate(
        date: Date
    ): string {

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, '0');

        const day =
            String(
                date.getDate()
            ).padStart(2, '0');

        return `${year}-${month}-${day}`;

    }


    private emptyForm(): ClienteForm {

        return {

            nombre_cliente: '',

            apellido_cliente: '',

            direccion_cliente: '',

            telefono_cliente: '',

            correo_cliente: '',

            fecha_registro_cl:
                this.toInputDate(
                    new Date()
                ),

            nombre_empresa: '',

            ruc: '',

            activo: true

        };

    }


    /* =============================================================
       ERRORES
       ============================================================= */

    private getErrorMessage(
        error: any,
        fallback: string
    ): string {

        const message =
            error?.error?.message;

        if (Array.isArray(message)) {
            return message.join(' · ');
        }

        return typeof message === 'string' && message
            ? message
            : fallback;

    }

}