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
    FacturasService,
    FacturasResponse,
    CreateFacturas
} from '../../../../../services/facturas.service';

import {
    ClientesService,
    ClientesResponse
} from '../../../../../services/clientes.service';

import {
    PedidosService,
    PedidosResponse
} from '../../../../../services/pedidos.service';

import {
    DetallePedidoService,
    DetallePedidoResponse
} from '../../../../../services/detalle_pedido.service';

import {
    DetalleFacturaService,
    DetalleFacturaResponse
} from '../../../../../services/detalle_factura.service';

import {
    DetalleCobroService,
    DetalleCobroResponse
} from '../../../../../services/detalle_cobro.service';

import {
    CobrosService,
    CobrosResponse
} from '../../../../../services/cobros.service';

import {
    ProductosService,
    ProductosResponse
} from '../../../../../services/productos.service';


/* =============================================================
   TIPOS
   ============================================================= */

type FiltroEstado =
    | 'TODAS'
    | 'PENDIENTE'
    | 'PARCIAL'
    | 'PAGADA'
    | 'ANULADA';


interface ResumenFactura {

    total: number;

    pagado: number;

    saldo: number;

    lineas: number;

}


interface FacturaForm {

    cliente_id: number | null;

    pedido_id: number | null;

    fecha: string;

    estado: string;

}


interface LineaFactura {

    detalle: DetalleFacturaResponse;

    producto: string;

    codigo: string;

    subtotal: number;

}


interface CobroAplicado {

    detalle: DetalleCobroResponse;

    cobro: CobrosResponse | null;

}


/* =============================================================
   COMPONENTE
   ============================================================= */

@Component({

    selector: 'app-facturas',

    standalone: true,

    imports: [MatSelectModule],

    schemas: [
        CUSTOM_ELEMENTS_SCHEMA
    ],

    templateUrl: './facturas.html',

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
export class FacturasComponent
    implements OnInit {


    /* =============================================================
       SERVICIOS
       ============================================================= */

    private readonly facturasService =
        inject(FacturasService);

    private readonly clientesService =
        inject(ClientesService);

    private readonly pedidosService =
        inject(PedidosService);

    private readonly detallePedidoService =
        inject(DetallePedidoService);

    private readonly detalleFacturaService =
        inject(DetalleFacturaService);

    private readonly detalleCobroService =
        inject(DetalleCobroService);

    private readonly cobrosService =
        inject(CobrosService);

    private readonly productosService =
        inject(ProductosService);


    /* =============================================================
       CONSTANTES DE VISTA
       ============================================================= */

    readonly filtros: {
        id: FiltroEstado;
        label: string;
    }[] = [

            { id: 'TODAS', label: 'Todas' },

            { id: 'PENDIENTE', label: 'Pendientes' },

            { id: 'PARCIAL', label: 'Parciales' },

            { id: 'PAGADA', label: 'Pagadas' },

            { id: 'ANULADA', label: 'Anuladas' }

        ];

    readonly estadosFactura: string[] = [
        'PENDIENTE',
        'PARCIAL',
        'PAGADA',
        'ANULADA'
    ];


    /* =============================================================
       ESTADO PRINCIPAL
       ============================================================= */

    readonly searchTerm =
        signal('');

    readonly filtroEstado =
        signal<FiltroEstado>('TODAS');


    /* =============================================================
       CARGA
       ============================================================= */

    readonly loading =
        signal(false);

    readonly saving =
        signal(false);

    readonly loadingFacturas =
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

    readonly facturas =
        signal<FacturasResponse[]>([]);

    readonly clientes =
        signal<ClientesResponse[]>([]);

    readonly pedidos =
        signal<PedidosResponse[]>([]);

    readonly detallesPedido =
        signal<DetallePedidoResponse[]>([]);

    readonly detallesFactura =
        signal<DetalleFacturaResponse[]>([]);

    readonly detallesCobro =
        signal<DetalleCobroResponse[]>([]);

    readonly cobros =
        signal<CobrosResponse[]>([]);

    readonly productos =
        signal<ProductosResponse[]>([]);


    /* =============================================================
       MODALES
       ============================================================= */

    readonly createModalOpen =
        signal(false);

    readonly detalleTarget =
        signal<FacturasResponse | null>(null);

    readonly deleteTarget =
        signal<FacturasResponse | null>(null);

    readonly facturaForm =
        signal<FacturaForm>(
            this.emptyForm()
        );


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

    readonly productosMap =
        computed(() =>
            new Map(
                this.productos().map(
                    producto =>
                        [producto.producto_id, producto] as const
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

    readonly totalPorPedido =
        computed(() => {

            const map =
                new Map<number, number>();

            for (const detalle of this.detallesPedido()) {

                map.set(
                    detalle.pedido_id,
                    (map.get(detalle.pedido_id) ?? 0) +
                    this.toNumber(detalle.cantidad) *
                    this.toNumber(detalle.precio_unitario)
                );

            }

            return map;

        });


    /* =============================================================
       RESUMEN POR FACTURA (TOTAL / PAGADO / SALDO)
       ============================================================= */

    readonly resumenPorFactura =
        computed(() => {

            const resumen =
                new Map<number, ResumenFactura>();

            const obtener = (
                facturaId: number
            ): ResumenFactura => {

                let actual =
                    resumen.get(facturaId);

                if (!actual) {

                    actual = {
                        total: 0,
                        pagado: 0,
                        saldo: 0,
                        lineas: 0
                    };

                    resumen.set(facturaId, actual);

                }

                return actual;

            };

            for (const detalle of this.detallesFactura()) {

                const actual =
                    obtener(detalle.factura_id);

                actual.total +=
                    this.toNumber(detalle.cantidad) *
                    this.toNumber(detalle.precio_unitario);

                actual.lineas++;

            }

            const cobros =
                this.cobrosMap();

            for (const detalle of this.detallesCobro()) {

                const cobro =
                    cobros.get(detalle.cobro_id);

                if (
                    cobro &&
                    this.isAnulado(cobro.estado)
                ) {
                    continue;
                }

                obtener(detalle.factura_id).pagado +=
                    this.toNumber(detalle.monto_aplicado);

            }

            for (const actual of resumen.values()) {

                actual.total =
                    this.roundAmount(actual.total);

                actual.pagado =
                    this.roundAmount(actual.pagado);

                actual.saldo =
                    this.roundAmount(
                        actual.total -
                        actual.pagado
                    );

            }

            return resumen;

        });


    /* =============================================================
       TARJETAS DE RESUMEN
       ============================================================= */

    readonly facturasVigentes =
        computed(() =>
            this.facturas().filter(
                factura =>
                    this.normalizeEstado(
                        factura.estado
                    ) !== 'ANULADA'
            )
        );

    readonly totalFacturado =
        computed(() =>
            this.facturasVigentes().reduce(
                (suma, factura) =>
                    suma +
                    this.getResumen(
                        factura.factura_id
                    ).total,
                0
            )
        );

    readonly totalCobrado =
        computed(() =>
            this.facturasVigentes().reduce(
                (suma, factura) =>
                    suma +
                    this.getResumen(
                        factura.factura_id
                    ).pagado,
                0
            )
        );

    readonly totalPorCobrar =
        computed(() =>
            this.facturasVigentes().reduce(
                (suma, factura) =>
                    suma +
                    Math.max(
                        this.getResumen(
                            factura.factura_id
                        ).saldo,
                        0
                    ),
                0
            )
        );


    /* =============================================================
       LISTADO FILTRADO
       ============================================================= */

    readonly facturasFiltradas =
        computed(() => {

            const search =
                this.searchTerm()
                    .trim()
                    .toLowerCase();

            const filtro =
                this.filtroEstado();

            return [...this.facturas()]
                .filter(
                    factura => {

                        if (
                            filtro !== 'TODAS' &&
                            this.normalizeEstado(
                                factura.estado
                            ) !== filtro
                        ) {
                            return false;
                        }

                        if (!search) {
                            return true;
                        }

                        return [
                            String(factura.factura_id),
                            `pedido ${factura.pedido_id}`,
                            this.getClienteNombre(
                                factura.cliente_id
                            ),
                            this.getClienteEmpresa(
                                factura.cliente_id
                            )
                        ]
                            .join(' ')
                            .toLowerCase()
                            .includes(search);

                    }
                )
                .sort(
                    (a, b) =>
                        b.factura_id -
                        a.factura_id
                );

        });


    /* =============================================================
       NUEVA FACTURA (DESDE PEDIDO)
       ============================================================= */

    readonly clientesActivos =
        computed(() =>
            this.clientes().filter(
                cliente =>
                    cliente.activo
            )
        );

    readonly pedidosDisponibles =
        computed(() => {

            const facturados =
                new Set(
                    this.facturas().map(
                        factura =>
                            factura.pedido_id
                    )
                );

            return this.pedidos()
                .filter(
                    pedido =>
                        this.normalizeEstado(pedido.estado_pedido) !== 'CANCELADO' &&
                        !facturados.has(pedido.pedido_id)
                )
                .sort(
                    (a, b) =>
                        b.pedido_id -
                        a.pedido_id
                );

        });

    readonly lineasPedido =
        computed(() => {

            const pedidoId =
                this.facturaForm().pedido_id;

            if (pedidoId === null) {
                return [];
            }

            return this.detallesPedido().filter(
                detalle =>
                    detalle.pedido_id === pedidoId
            );

        });

    readonly lineasPedidoFacturables =
        computed(() =>
            this.lineasPedido().filter(
                detalle =>
                    detalle.producto_id !== undefined &&
                    detalle.producto_id !== null
            )
        );

    readonly lineasSinProducto =
        computed(() =>
            this.lineasPedido().length -
            this.lineasPedidoFacturables().length
        );

    readonly totalNuevaFactura =
        computed(() =>
            this.roundAmount(
                this.lineasPedidoFacturables().reduce(
                    (suma, detalle) =>
                        suma +
                        this.toNumber(detalle.cantidad) *
                        this.toNumber(detalle.precio_unitario),
                    0
                )
            )
        );

    readonly isFormValid =
        computed(() => {

            const form =
                this.facturaForm();

            return (
                form.cliente_id !== null &&
                form.pedido_id !== null &&
                !!form.fecha &&
                !!form.estado &&
                this.lineasPedidoFacturables().length > 0
            );

        });


    /* =============================================================
       DETALLE DE FACTURA
       ============================================================= */

    readonly detalleLineas =
        computed<LineaFactura[]>(() => {

            const factura =
                this.detalleTarget();

            if (!factura) {
                return [];
            }

            return this.detallesFactura()
                .filter(
                    detalle =>
                        detalle.factura_id ===
                        factura.factura_id
                )
                .map(
                    detalle => {

                        const producto =
                            this.productosMap().get(
                                detalle.producto_id
                            );

                        return {

                            detalle,

                            producto:
                                producto?.nombre_producto ??
                                `Producto #${detalle.producto_id}`,

                            codigo:
                                producto?.codigo ?? '—',

                            subtotal:
                                this.roundAmount(
                                    this.toNumber(detalle.cantidad) *
                                    this.toNumber(detalle.precio_unitario)
                                )

                        };

                    }
                );

        });

    readonly detalleCobros =
        computed<CobroAplicado[]>(() => {

            const factura =
                this.detalleTarget();

            if (!factura) {
                return [];
            }

            return this.detallesCobro()
                .filter(
                    detalle =>
                        detalle.factura_id ===
                        factura.factura_id
                )
                .map(
                    detalle => ({

                        detalle,

                        cobro:
                            this.cobrosMap().get(
                                detalle.cobro_id
                            ) ?? null

                    })
                );

        });


    /* =============================================================
       ELIMINAR FACTURA
       ============================================================= */

    readonly cobrosDeEliminar =
        computed(() => {

            const factura =
                this.deleteTarget();

            return factura
                ? this.detallesCobro().filter(
                    detalle =>
                        detalle.factura_id ===
                        factura.factura_id
                ).length
                : 0;

        });

    readonly lineasDeEliminar =
        computed(() => {

            const factura =
                this.deleteTarget();

            return factura
                ? this.getResumen(
                    factura.factura_id
                ).lineas
                : 0;

        });

    readonly puedeEliminar =
        computed(() =>
            this.cobrosDeEliminar() === 0
        );


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

            facturas:
                this.facturasService
                    .getFacturas(),

            clientes:
                this.clientesService
                    .getClientes(),

            pedidos:
                this.pedidosService
                    .getPedidos(),

            detallesPedido:
                this.detallePedidoService
                    .getDetalles(),

            detallesFactura:
                this.detalleFacturaService
                    .getDetalles(),

            detallesCobro:
                this.detalleCobroService
                    .getDetalles(),

            cobros:
                this.cobrosService
                    .getCobros(),

            productos:
                this.productosService
                    .getProductos()

        }).subscribe({

            next: (datos) => {

                this.facturas.set(datos.facturas);

                this.clientes.set(datos.clientes);

                this.pedidos.set(datos.pedidos);

                this.detallesPedido.set(datos.detallesPedido);

                this.detallesFactura.set(datos.detallesFactura);

                this.detallesCobro.set(datos.detallesCobro);

                this.cobros.set(datos.cobros);

                this.productos.set(datos.productos);

                this.loading.set(false);

            },

            error: (error) => {

                console.error(
                    'Error cargando las facturas:',
                    error
                );

                this.errorMessage.set(
                    this.getErrorMessage(
                        error,
                        'No se pudieron cargar las facturas.'
                    )
                );

                this.loading.set(false);

            }

        });

    }


    refreshData(): void {

        if (this.loadingFacturas()) {
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
       NUEVA FACTURA
       ============================================================= */

    openCreateFactura(): void {

        if (this.loadingFacturas()) {
            return;
        }

        this.facturaForm.set(
            this.emptyForm()
        );

        this.createModalOpen.set(true);

    }


    closeCreateFactura(): void {

        if (this.saving()) {
            return;
        }

        this.createModalOpen.set(false);

    }


    onClienteChange(
        event: MatSelectChange
    ): void {

        this.facturaForm.update(
            form => ({

                ...form,

                cliente_id:
                    event.value ?? null,

                pedido_id: null

            })
        );

    }


    onPedidoChange(
        event: MatSelectChange
    ): void {

        const pedidoId =
            event.value ?? null;

        const pedido =
            this.pedidos().find(
                item =>
                    item.pedido_id === pedidoId
            );

        this.facturaForm.update(
            form => ({

                ...form,

                pedido_id: pedidoId,

                cliente_id:
                    pedido?.cliente_id ?? null

            })
        );

    }


    onEstadoChange(
        event: MatSelectChange
    ): void {

        this.facturaForm.update(
            form => ({

                ...form,

                estado:
                    event.value

            })
        );

    }


    updateFecha(
        value: string
    ): void {

        this.facturaForm.update(
            form => ({

                ...form,

                fecha: value

            })
        );

    }


    saveFactura(): void {

        if (
            !this.isFormValid() ||
            this.saving()
        ) {
            return;
        }

        const form =
            this.facturaForm();

        const lineas =
            this.lineasPedidoFacturables();

        const dto: CreateFacturas = {

            cliente_id:
                form.cliente_id as number,

            pedido_id:
                form.pedido_id as number,

            usuario_id:
                this.usuarioActualId(),

            fecha:
                form.fecha,

            estado:
                form.estado

        };

        this.saving.set(true);

        this.errorMessage.set(null);

        this.facturasService
            .createFactura(dto)
            .pipe(
                switchMap(
                    factura =>
                        forkJoin(
                            lineas.map(
                                linea =>
                                    this.detalleFacturaService
                                        .createDetalle({

                                            factura_id:
                                                factura.factura_id,

                                            producto_id:
                                                linea.producto_id as number,

                                            cantidad:
                                                this.toNumber(
                                                    linea.cantidad
                                                ),

                                            precio_unitario:
                                                this.toNumber(
                                                    linea.precio_unitario
                                                )

                                        })
                            )
                        ).pipe(
                            map(() => factura)
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
                        'Error creando la factura:',
                        error
                    );

                    this.errorMessage.set(
                        this.getErrorMessage(
                            error,
                            'No se pudo crear la factura.'
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
        factura: FacturasResponse
    ): void {

        this.detalleTarget.set(factura);

    }


    closeDetalle(): void {

        this.detalleTarget.set(null);

    }


    /* =============================================================
       ELIMINAR
       ============================================================= */

    openDeleteFactura(
        factura: FacturasResponse
    ): void {

        if (this.loadingFacturas()) {
            return;
        }

        this.deleteTarget.set(factura);

    }


    closeDeleteFactura(): void {

        if (this.saving()) {
            return;
        }

        this.deleteTarget.set(null);

    }


    confirmDeleteFactura(): void {

        const factura =
            this.deleteTarget();

        if (
            !factura ||
            this.saving() ||
            !this.puedeEliminar()
        ) {
            return;
        }

        const lineas =
            this.detallesFactura().filter(
                detalle =>
                    detalle.factura_id ===
                    factura.factura_id
            );

        this.saving.set(true);

        this.errorMessage.set(null);

        // El backend no permite eliminar una factura con detalles,
        // por lo que primero se eliminan sus líneas.
        const eliminarLineas$ =
            lineas.length
                ? forkJoin(
                    lineas.map(
                        linea =>
                            this.detalleFacturaService
                                .deleteDetalle(
                                    linea.detalle_factura_id
                                )
                    )
                )
                : of([]);

        eliminarLineas$
            .pipe(
                switchMap(
                    () =>
                        this.facturasService
                            .deleteFactura(
                                factura.factura_id
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
                        'Error eliminando la factura:',
                        error
                    );

                    this.errorMessage.set(
                        this.getErrorMessage(
                            error,
                            'No se pudo eliminar la factura.'
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
        facturaId: number
    ): ResumenFactura {

        return (
            this.resumenPorFactura().get(facturaId) ?? {
                total: 0,
                pagado: 0,
                saldo: 0,
                lineas: 0
            }
        );

    }


    getPorcentajeCobrado(
        facturaId: number
    ): number {

        const resumen =
            this.getResumen(facturaId);

        if (resumen.total <= 0) {
            return 0;
        }

        return Math.min(
            100,
            Math.round(
                (resumen.pagado / resumen.total) * 100
            )
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


    getTotalPedido(pedidoId: number): number {
        return this.detallesPedido()
            .filter(detalle => detalle.pedido_id === pedidoId)
            .reduce(
                (total, detalle) =>
                    total +
                    this.toNumber(detalle.cantidad) *
                    this.toNumber(detalle.precio_unitario),
                0
            );
    }

    getClienteEmpresa(clienteId: number): string {
        return (
            this.clientes().find(
                cliente => cliente.cliente_id === clienteId
            )?.nombre_empresa ?? ''
        );
    }

    getProductoNombre(productoId: number | null | undefined): string {
        if (productoId === null || productoId === undefined) {
            return 'Producto sin identificar';
        }

        return (
            this.productos().find(
                producto => producto.producto_id === productoId
            )?.nombre_producto ?? `Producto #${productoId}`
        );
    }

    onFechaChange(event: Event): void {
        const input = event.target as HTMLInputElement;

        this.facturaForm.update(form => ({
            ...form,
            fecha: input.value
        }));
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


    private isAnulado(
        estado:
            string |
            null |
            undefined
    ): boolean {

        return this.normalizeEstado(estado) === 'ANULADO';

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

            case 'PAGADA':
                return 'bg-[#edf6ef] text-[#477553]';

            case 'PARCIAL':
                return 'bg-[#eaf1f8] text-[#3b6288]';

            case 'PENDIENTE':
                return 'bg-[#fff6e5] text-[#8a6a2b]';

            case 'ANULADA':
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


    private emptyForm(): FacturaForm {

        return {

            cliente_id: null,

            pedido_id: null,

            fecha:
                this.toInputDate(
                    new Date()
                ),

            estado: 'PENDIENTE'

        };

    }


    /* =============================================================
       NÚMEROS
       ============================================================= */

    toNumber(
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