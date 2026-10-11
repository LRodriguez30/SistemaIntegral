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
    forkJoin,
    map,
    of,
    switchMap
} from 'rxjs';

import { MatSelectChange, MatSelectModule } from '@angular/material/select';

import {
    CobrosService,
    CobrosResponse,
    CreateCobros
} from '../../../../../services/cobros.service';

import {
    DetalleCobroService,
    DetalleCobroResponse
} from '../../../../../services/detalle_cobro.service';

import {
    ClientesService,
    ClientesResponse
} from '../../../../../services/clientes.service';

import {
    FacturasService,
    FacturasResponse
} from '../../../../../services/facturas.service';

import {
    DetalleFacturaService,
    DetalleFacturaResponse
} from '../../../../../services/detalle_factura.service';


/* =============================================================
   TIPOS
   ============================================================= */

type FiltroEstado =
    | 'TODOS'
    | 'REGISTRADO'
    | 'APLICADO'
    | 'ANULADO';


interface MetodoPago {

    id: string;

    label: string;

    icon: string;

}


interface CobroForm {

    cliente_id: number | null;

    fecha_cobro: string;

    metodo_pago: string;

    referencia: string;

    observaciones: string;

    estado: string;

}


interface ResumenCobro {

    monto: number;

    facturas: number;

}


interface FacturaPendiente {

    factura: FacturasResponse;

    total: number;

    aplicado: number;

    saldo: number;

}


interface LineaCobro {

    detalle: DetalleCobroResponse;

    factura: FacturasResponse | null;

    totalFactura: number;

}


/* =============================================================
   COMPONENTE
   ============================================================= */

@Component({

    selector: 'app-cobros',

    standalone: true,

    imports: [MatSelectModule],

    schemas: [
        CUSTOM_ELEMENTS_SCHEMA
    ],

    templateUrl: './cobros.html',

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
export class CobrosComponent
    implements OnInit {


    /* =============================================================
       SERVICIOS
       ============================================================= */

    private readonly cobrosService =
        inject(CobrosService);

    private readonly detalleCobroService =
        inject(DetalleCobroService);

    private readonly clientesService =
        inject(ClientesService);

    private readonly facturasService =
        inject(FacturasService);

    private readonly detalleFacturaService =
        inject(DetalleFacturaService);


    /* =============================================================
       CONSTANTES DE VISTA
       ============================================================= */

    readonly filtros: {
        id: FiltroEstado;
        label: string;
    }[] = [

            { id: 'TODOS', label: 'Todos' },

            { id: 'REGISTRADO', label: 'Registrados' },

            { id: 'APLICADO', label: 'Aplicados' },

            { id: 'ANULADO', label: 'Anulados' }

        ];

    readonly metodosPago: MetodoPago[] = [

        { id: 'EFECTIVO', label: 'Efectivo', icon: 'lucide:banknote' },

        { id: 'TRANSFERENCIA', label: 'Transferencia', icon: 'lucide:landmark' },

        { id: 'TARJETA', label: 'Tarjeta', icon: 'lucide:credit-card' },

        { id: 'CHEQUE', label: 'Cheque', icon: 'lucide:receipt-text' },

        { id: 'OTRO', label: 'Otro', icon: 'lucide:circle-ellipsis' }

    ];

    readonly estadosCobro: string[] = [
        'REGISTRADO',
        'APLICADO',
        'ANULADO'
    ];


    /* =============================================================
       ESTADO PRINCIPAL
       ============================================================= */

    readonly searchTerm =
        signal('');

    readonly filtroEstado =
        signal<FiltroEstado>('TODOS');


    /* =============================================================
       CARGA
       ============================================================= */

    readonly loading =
        signal(false);

    readonly saving =
        signal(false);

    readonly loadingCobros =
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

    readonly cobros =
        signal<CobrosResponse[]>([]);

    readonly detallesCobro =
        signal<DetalleCobroResponse[]>([]);

    readonly clientes =
        signal<ClientesResponse[]>([]);

    readonly facturas =
        signal<FacturasResponse[]>([]);

    readonly detallesFactura =
        signal<DetalleFacturaResponse[]>([]);


    /* =============================================================
       MODALES
       ============================================================= */

    readonly createModalOpen =
        signal(false);

    readonly detalleTarget =
        signal<CobrosResponse | null>(null);

    readonly deleteTarget =
        signal<CobrosResponse | null>(null);

    readonly cobroForm =
        signal<CobroForm>(
            this.emptyForm()
        );

    // Monto digitado por factura (id de factura -> texto del input)
    readonly montos =
        signal<Record<number, string>>({});


    /* =============================================================
       MAPAS DE APOYO
       ============================================================= */

    readonly clientesMap =
        computed(() =>
            new Map(
                this.clientes().map(
                    cliente =>
                        [cliente.cliente_id, cliente] as const
                )
            )
        );

    readonly facturasMap =
        computed(() =>
            new Map(
                this.facturas().map(
                    factura =>
                        [factura.factura_id, factura] as const
                )
            )
        );

    readonly cobrosMap =
        computed(() =>
            new Map(
                this.cobros().map(
                    cobro =>
                        [cobro.cobro_id, cobro] as const
                )
            )
        );

    readonly totalPorFactura =
        computed(() => {

            const map =
                new Map<number, number>();

            for (const detalle of this.detallesFactura()) {

                map.set(
                    detalle.factura_id,
                    (map.get(detalle.factura_id) ?? 0) +
                    this.toNumber(detalle.cantidad) *
                    this.toNumber(detalle.precio_unitario)
                );

            }

            return map;

        });

    readonly aplicadoPorFactura =
        computed(() => {

            const map =
                new Map<number, number>();

            const cobros =
                this.cobrosMap();

            for (const detalle of this.detallesCobro()) {

                const cobro =
                    cobros.get(detalle.cobro_id);

                if (
                    cobro &&
                    this.normalizeEstado(
                        cobro.estado
                    ) === 'ANULADO'
                ) {
                    continue;
                }

                map.set(
                    detalle.factura_id,
                    (map.get(detalle.factura_id) ?? 0) +
                    this.toNumber(detalle.monto_aplicado)
                );

            }

            return map;

        });

    readonly resumenPorCobro =
        computed(() => {

            const resumen =
                new Map<number, ResumenCobro>();

            for (const detalle of this.detallesCobro()) {

                const actual =
                    resumen.get(detalle.cobro_id) ?? {
                        monto: 0,
                        facturas: 0
                    };

                resumen.set(
                    detalle.cobro_id,
                    {
                        monto:
                            actual.monto +
                            this.toNumber(
                                detalle.monto_aplicado
                            ),

                        facturas:
                            actual.facturas + 1
                    }
                );

            }

            return resumen;

        });


    /* =============================================================
       TARJETAS DE RESUMEN
       ============================================================= */

    readonly cobrosVigentes =
        computed(() =>
            this.cobros().filter(
                cobro =>
                    this.normalizeEstado(
                        cobro.estado
                    ) !== 'ANULADO'
            )
        );

    readonly totalCobrado =
        computed(() =>
            this.cobrosVigentes().reduce(
                (suma, cobro) =>
                    suma +
                    this.getResumen(
                        cobro.cobro_id
                    ).monto,
                0
            )
        );

    readonly totalAnulados =
        computed(() =>
            this.cobros().length -
            this.cobrosVigentes().length
        );

    readonly totalPorCobrar =
        computed(() => {

            let suma = 0;

            for (const factura of this.facturas()) {

                if (
                    this.normalizeEstado(
                        factura.estado
                    ) === 'ANULADA'
                ) {
                    continue;
                }

                suma += Math.max(
                    this.getSaldoFactura(
                        factura.factura_id
                    ),
                    0
                );

            }

            return suma;

        });


    /* =============================================================
       LISTADO FILTRADO
       ============================================================= */

    readonly cobrosFiltrados =
        computed(() => {

            const search =
                this.searchTerm()
                    .trim()
                    .toLowerCase();

            const filtro =
                this.filtroEstado();

            return [...this.cobros()]
                .filter(
                    cobro => {

                        if (
                            filtro !== 'TODOS' &&
                            this.normalizeEstado(
                                cobro.estado
                            ) !== filtro
                        ) {
                            return false;
                        }

                        if (!search) {
                            return true;
                        }

                        return [
                            String(cobro.cobro_id),
                            this.getClienteNombre(
                                cobro.cliente_id
                            ),
                            cobro.referencia ?? '',
                            cobro.metodo_pago ?? ''
                        ]
                            .join(' ')
                            .toLowerCase()
                            .includes(search);

                    }
                )
                .sort(
                    (a, b) =>
                        b.cobro_id -
                        a.cobro_id
                );

        });


    /* =============================================================
       NUEVO COBRO
       ============================================================= */

    readonly clientesActivos =
        computed(() =>
            this.clientes().filter(
                cliente =>
                    cliente.activo
            )
        );

    readonly facturasPendientes =
        computed<FacturaPendiente[]>(() => {

            const clienteId =
                this.cobroForm().cliente_id;

            if (clienteId === null) {
                return [];
            }

            return this.facturas()
                .filter(
                    factura =>
                        factura.cliente_id === clienteId &&
                        this.normalizeEstado(
                            factura.estado
                        ) !== 'ANULADA'
                )
                .map(
                    factura => {

                        const total =
                            this.roundAmount(
                                this.totalPorFactura().get(
                                    factura.factura_id
                                ) ?? 0
                            );

                        const aplicado =
                            this.roundAmount(
                                this.aplicadoPorFactura().get(
                                    factura.factura_id
                                ) ?? 0
                            );

                        return {

                            factura,

                            total,

                            aplicado,

                            saldo:
                                this.roundAmount(
                                    total - aplicado
                                )

                        };

                    }
                )
                .filter(
                    item =>
                        item.saldo > 0.005
                )
                .sort(
                    (a, b) =>
                        a.factura.factura_id -
                        b.factura.factura_id
                );

        });

    readonly totalAplicar =
        computed(() => {

            const montos =
                this.montos();

            return this.roundAmount(
                this.facturasPendientes().reduce(
                    (suma, item) =>
                        suma +
                        this.parseAmount(
                            montos[item.factura.factura_id]
                        ),
                    0
                )
            );

        });

    readonly montosValidos =
        computed(() => {

            const montos =
                this.montos();

            return this.facturasPendientes().every(
                item =>
                    this.parseAmount(
                        montos[item.factura.factura_id]
                    ) <= item.saldo + 0.005
            );

        });

    readonly isFormValid =
        computed(() => {

            const form =
                this.cobroForm();

            return (
                form.cliente_id !== null &&
                !!form.fecha_cobro &&
                !!form.metodo_pago &&
                !!form.estado &&
                this.totalAplicar() > 0 &&
                this.montosValidos()
            );

        });


    /* =============================================================
       DETALLE DE COBRO
       ============================================================= */

    readonly detalleLineas =
        computed<LineaCobro[]>(() => {

            const cobro =
                this.detalleTarget();

            if (!cobro) {
                return [];
            }

            return this.detallesCobro()
                .filter(
                    detalle =>
                        detalle.cobro_id ===
                        cobro.cobro_id
                )
                .map(
                    detalle => ({

                        detalle,

                        factura:
                            this.facturasMap().get(
                                detalle.factura_id
                            ) ?? null,

                        totalFactura:
                            this.roundAmount(
                                this.totalPorFactura().get(
                                    detalle.factura_id
                                ) ?? 0
                            )

                    })
                );

        });

    readonly lineasDeEliminar =
        computed(() => {

            const cobro =
                this.deleteTarget();

            return cobro
                ? this.getResumen(
                    cobro.cobro_id
                ).facturas
                : 0;

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

            cobros:
                this.cobrosService
                    .getCobros(),

            detallesCobro:
                this.detalleCobroService
                    .getDetalles(),

            clientes:
                this.clientesService
                    .getClientes(),

            facturas:
                this.facturasService
                    .getFacturas(),

            detallesFactura:
                this.detalleFacturaService
                    .getDetalles()

        }).subscribe({

            next: (datos) => {

                this.cobros.set(datos.cobros);

                this.detallesCobro.set(datos.detallesCobro);

                this.clientes.set(datos.clientes);

                this.facturas.set(datos.facturas);

                this.detallesFactura.set(datos.detallesFactura);

                this.loading.set(false);

            },

            error: (error) => {

                console.error(
                    'Error cargando los cobros:',
                    error
                );

                this.errorMessage.set(
                    this.getErrorMessage(
                        error,
                        'No se pudieron cargar los cobros.'
                    )
                );

                this.loading.set(false);

            }

        });

    }


    refreshData(): void {

        if (this.loadingCobros()) {
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
       NUEVO COBRO
       ============================================================= */

    openCreateCobro(): void {

        if (this.loadingCobros()) {
            return;
        }

        this.cobroForm.set(
            this.emptyForm()
        );

        this.montos.set({});

        this.createModalOpen.set(true);

    }


    closeCreateCobro(): void {

        if (this.saving()) {
            return;
        }

        this.createModalOpen.set(false);

    }


    onClienteChange(
        event: MatSelectChange
    ): void {

        this.cobroForm.update(
            form => ({

                ...form,

                cliente_id:
                    event.value ?? null

            })
        );

        this.montos.set({});

    }


    onMetodoChange(
        event: MatSelectChange
    ): void {

        this.updateForm(
            'metodo_pago',
            event.value
        );

    }


    onEstadoChange(
        event: MatSelectChange
    ): void {

        this.updateForm(
            'estado',
            event.value
        );

    }


    updateForm<K extends keyof CobroForm>(
        field: K,
        value: CobroForm[K]
    ): void {

        this.cobroForm.update(
            form => ({

                ...form,

                [field]: value

            })
        );

    }


    /* =============================================================
       MONTOS POR FACTURA
       ============================================================= */

    getMontoInput(
        facturaId: number
    ): string {

        return this.montos()[facturaId] ?? '';

    }


    setMonto(
        facturaId: number,
        value: string
    ): void {

        this.montos.update(
            montos => ({

                ...montos,

                [facturaId]: value

            })
        );

    }


    saldarFactura(
        item: FacturaPendiente
    ): void {

        if (this.saving()) {
            return;
        }

        this.setMonto(
            item.factura.factura_id,
            String(item.saldo)
        );

    }


    limpiarMonto(
        facturaId: number
    ): void {

        this.setMonto(facturaId, '');

    }


    montoExcede(
        item: FacturaPendiente
    ): boolean {

        return (
            this.parseAmount(
                this.getMontoInput(
                    item.factura.factura_id
                )
            ) >
            item.saldo + 0.005
        );

    }


    /* =============================================================
       GUARDAR COBRO
       ============================================================= */

    saveCobro(): void {

        if (
            !this.isFormValid() ||
            this.saving()
        ) {
            return;
        }

        const form =
            this.cobroForm();

        const montos =
            this.montos();

        const aplicaciones =
            this.facturasPendientes()
                .map(
                    item => ({

                        factura_id:
                            item.factura.factura_id,

                        monto:
                            this.parseAmount(
                                montos[item.factura.factura_id]
                            )

                    })
                )
                .filter(
                    aplicacion =>
                        aplicacion.monto > 0
                );

        const referencia =
            form.referencia.trim();

        const observaciones =
            form.observaciones.trim();

        const dto: CreateCobros = {

            cliente_id:
                form.cliente_id as number,

            usuario_id:
                this.usuarioActualId(),

            fecha_cobro:
                form.fecha_cobro,

            metodo_pago:
                form.metodo_pago,

            estado:
                form.estado,

            ...(referencia
                ? { referencia }
                : {}),

            ...(observaciones
                ? { observaciones }
                : {})

        };

        this.saving.set(true);

        this.errorMessage.set(null);

        this.cobrosService
            .createCobro(dto)
            .pipe(
                switchMap(
                    cobro =>
                        forkJoin(
                            aplicaciones.map(
                                aplicacion =>
                                    this.detalleCobroService
                                        .createDetalle({

                                            cobro_id:
                                                cobro.cobro_id,

                                            factura_id:
                                                aplicacion.factura_id,

                                            monto_aplicado:
                                                aplicacion.monto

                                        })
                            )
                        ).pipe(
                            map(() => cobro)
                        )
                )
            )
            .subscribe({

                next: () => {

                    this.saving.set(false);

                    this.createModalOpen.set(false);

                    this.loadData();

                },

                error: (error) => {

                    console.error(
                        'Error creando el cobro:',
                        error
                    );

                    this.errorMessage.set(
                        this.getErrorMessage(
                            error,
                            'No se pudo registrar el cobro.'
                        )
                    );

                    this.saving.set(false);

                    this.createModalOpen.set(false);

                    this.loadData();

                }

            });

    }


    /* =============================================================
       VER DETALLE
       ============================================================= */

    openDetalle(
        cobro: CobrosResponse
    ): void {

        this.detalleTarget.set(cobro);

    }


    closeDetalle(): void {

        this.detalleTarget.set(null);

    }


    /* =============================================================
       ELIMINAR
       ============================================================= */

    openDeleteCobro(
        cobro: CobrosResponse
    ): void {

        if (this.loadingCobros()) {
            return;
        }

        this.deleteTarget.set(cobro);

    }


    closeDeleteCobro(): void {

        if (this.saving()) {
            return;
        }

        this.deleteTarget.set(null);

    }


    confirmDeleteCobro(): void {

        const cobro =
            this.deleteTarget();

        if (
            !cobro ||
            this.saving()
        ) {
            return;
        }

        const lineas =
            this.detallesCobro().filter(
                detalle =>
                    detalle.cobro_id ===
                    cobro.cobro_id
            );

        this.saving.set(true);

        this.errorMessage.set(null);

        // El backend no permite eliminar un cobro con detalles,
        // por lo que primero se eliminan sus aplicaciones.
        const eliminarLineas$ =
            lineas.length
                ? forkJoin(
                    lineas.map(
                        linea =>
                            this.detalleCobroService
                                .deleteDetalle(
                                    linea.detalle_cobro_id
                                )
                    )
                )
                : of([]);

        eliminarLineas$
            .pipe(
                switchMap(
                    () =>
                        this.cobrosService
                            .deleteCobro(
                                cobro.cobro_id
                            )
                )
            )
            .subscribe({

                next: () => {

                    this.saving.set(false);

                    this.deleteTarget.set(null);

                    this.loadData();

                },

                error: (error) => {

                    console.error(
                        'Error eliminando el cobro:',
                        error
                    );

                    this.errorMessage.set(
                        this.getErrorMessage(
                            error,
                            'No se pudo eliminar el cobro.'
                        )
                    );

                    this.saving.set(false);

                    this.deleteTarget.set(null);

                    this.loadData();

                }

            });

    }


    /* =============================================================
       USUARIO ACTUAL
       ============================================================= */

    // TODO: reemplazar por el id del usuario autenticado
    // (AuthService / UsersService del proyecto).
    private usuarioActualId(): number {

        return 1;

    }


    /* =============================================================
       AYUDAS
       ============================================================= */

    getResumen(
        cobroId: number
    ): ResumenCobro {

        return (
            this.resumenPorCobro().get(cobroId) ?? {
                monto: 0,
                facturas: 0
            }
        );

    }


    getSaldoFactura(
        facturaId: number
    ): number {

        return this.roundAmount(
            (this.totalPorFactura().get(facturaId) ?? 0) -
            (this.aplicadoPorFactura().get(facturaId) ?? 0)
        );

    }


    getClienteNombre(
        clienteId: number
    ): string {

        const cliente =
            this.clientesMap().get(clienteId);

        if (!cliente) {
            return `Cliente #${clienteId}`;
        }

        return [
            cliente.nombre_cliente,
            cliente.apellido_cliente
        ]
            .filter(Boolean)
            .join(' ');

    }


    getClienteEmpresa(
        clienteId: number
    ): string {

        return (
            this.clientesMap().get(clienteId)
                ?.nombre_empresa ?? ''
        );

    }


    getClienteIniciales(
        clienteId: number
    ): string {

        const cliente =
            this.clientesMap().get(clienteId);

        if (!cliente) {
            return 'CL';
        }

        return (
            (cliente.nombre_cliente?.trim().charAt(0) ?? '') +
            (cliente.apellido_cliente?.trim().charAt(0) ?? '')
        ).toUpperCase() || 'CL';

    }


    getMetodo(
        metodo:
            string |
            null |
            undefined
    ): MetodoPago {

        const id =
            this.normalizeEstado(metodo);

        return (
            this.metodosPago.find(
                item =>
                    item.id === id
            ) ?? {
                id,
                label: this.formatEstado(metodo),
                icon: 'lucide:circle-ellipsis'
            }
        );

    }


    /* =============================================================
       FORMATO
       ============================================================= */

    formatAmount(
        amount: number
    ): string {

        return new Intl.NumberFormat(
            'es-NI',
            {

                minimumFractionDigits: 2,

                maximumFractionDigits: 2

            }
        ).format(amount);

    }


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


    normalizeEstado(
        estado:
            string |
            null |
            undefined
    ): string {

        return (estado ?? '')
            .trim()
            .toUpperCase();

    }


    formatEstado(
        estado:
            string |
            null |
            undefined
    ): string {

        const text =
            (estado ?? '')
                .trim()
                .toLowerCase();

        if (!text) {
            return '—';
        }

        return (
            text.charAt(0).toUpperCase() +
            text.slice(1)
        );

    }


    estadoBadgeClass(
        estado:
            string |
            null |
            undefined
    ): string {

        switch (
        this.normalizeEstado(estado)
        ) {

            case 'APLICADO':
                return 'bg-[#edf6ef] text-[#477553]';

            case 'REGISTRADO':
                return 'bg-[#eaf1f8] text-[#3b6288]';

            case 'ANULADO':
                return 'bg-[#f1f2f3] text-[#737b83]';

            default:
                return 'bg-[#f1f2f3] text-[#737b83]';

        }

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


    private emptyForm(): CobroForm {

        return {

            cliente_id: null,

            fecha_cobro:
                this.toInputDate(
                    new Date()
                ),

            metodo_pago: 'EFECTIVO',

            referencia: '',

            observaciones: '',

            estado: 'APLICADO'

        };

    }


    /* =============================================================
       NÚMEROS
       ============================================================= */

    private toNumber(
        value:
            number |
            string |
            null |
            undefined
    ): number {

        const number =
            Number(value);

        return Number.isFinite(
            number
        )
            ? number
            : 0;

    }


    private parseAmount(
        value:
            string |
            undefined
    ): number {

        const amount =
            Number(value);

        if (
            !Number.isFinite(
                amount
            ) ||
            amount < 0
        ) {

            return 0;

        }

        return this.roundAmount(
            amount
        );

    }


    private roundAmount(
        amount: number
    ): number {

        return Math.round(
            amount * 100
        ) / 100;

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