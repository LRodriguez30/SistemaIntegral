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
    switchMap
} from 'rxjs';

import {
    PedidosService,
    PedidosResponse,
    CreatePedidos,
    UpdatePedidos
} from '../../../../../services/pedidos.service';

import {
    DetallePedidoService,
    DetallePedidoResponse
} from '../../../../../services/detalle_pedido.service';

import {
    ClientesService,
    ClientesResponse
} from '../../../../../services/clientes.service';

import {
    ProductosService,
    ProductosResponse
} from '../../../../../services/productos.service';

import {
    FacturasService,
    FacturasResponse
} from '../../../../../services/facturas.service';


/* =============================================================
   TIPOS
   ============================================================= */

type Vista =
    | 'tablero'
    | 'lista';


interface EstadoPedidoInfo {

    id: string;

    label: string;

    icon: string;

    // Clases completas para que Tailwind las detecte
    chip: string;

    dot: string;

    stripe: string;

    head: string;

}


interface PedidoForm {

    cliente_id: number | null;

    direccion_entrega: string;

    fecha_pedido: string;

    fecha_salida: string;

    fecha_entrega: string;

    observaciones: string;

}


interface LineaNueva {

    producto_id: number;

    cantidad: number;

    precio_unitario: number;

}


interface DatosForm {

    direccion_entrega: string;

    observaciones: string;

}


/* =============================================================
   COMPONENTE
   ============================================================= */

@Component({

    selector: 'app-pedidos',

    standalone: true,

    imports: [],

    schemas: [
        CUSTOM_ELEMENTS_SCHEMA
    ],

    templateUrl: './pedidos.html',

    changeDetection: ChangeDetectionStrategy.OnPush,

/*__STYLES__*/

})
export class PedidosComponent
    implements OnInit {


    /* =============================================================
       SERVICIOS
       ============================================================= */

    private readonly pedidosService =
        inject(PedidosService);

    private readonly detallePedidoService =
        inject(DetallePedidoService);

    private readonly clientesService =
        inject(ClientesService);

    private readonly productosService =
        inject(ProductosService);

    private readonly facturasService =
        inject(FacturasService);


    /* =============================================================
       CONSTANTES DE VISTA
       ============================================================= */

    readonly estados: EstadoPedidoInfo[] = [

        {
            id: 'SOLICITADO',
            label: 'Solicitado',
            icon: 'lucide:inbox',
            chip: 'bg-[#e6e8e4] text-[#555d56]',
            dot: 'bg-[#8a9189]',
            stripe: 'border-l-[#8a9189]',
            head: 'bg-[#8a9189]'
        },

        {
            id: 'CONFIRMADO',
            label: 'Confirmado',
            icon: 'lucide:circle-check',
            chip: 'bg-[#e3edf6] text-[#2f5276]',
            dot: 'bg-[#3b6288]',
            stripe: 'border-l-[#3b6288]',
            head: 'bg-[#3b6288]'
        },

        {
            id: 'PREPARACION',
            label: 'En preparación',
            icon: 'lucide:package-open',
            chip: 'bg-[#f8ecd5] text-[#8a5a12]',
            dot: 'bg-[#b7791f]',
            stripe: 'border-l-[#b7791f]',
            head: 'bg-[#b7791f]'
        },

        {
            id: 'LISTO',
            label: 'Listo',
            icon: 'lucide:package-check',
            chip: 'bg-[#d9efec] text-[#0b5a54]',
            dot: 'bg-[#0f766e]',
            stripe: 'border-l-[#0f766e]',
            head: 'bg-[#0f766e]'
        },

        {
            id: 'ENVIADO',
            label: 'Enviado',
            icon: 'lucide:truck',
            chip: 'bg-[#ebe3f6] text-[#533583]',
            dot: 'bg-[#6d4aa8]',
            stripe: 'border-l-[#6d4aa8]',
            head: 'bg-[#6d4aa8]'
        },

        {
            id: 'ENTREGADO',
            label: 'Entregado',
            icon: 'lucide:badge-check',
            chip: 'bg-[#dcefe2] text-[#2c5a3d]',
            dot: 'bg-[#3c7650]',
            stripe: 'border-l-[#3c7650]',
            head: 'bg-[#3c7650]'
        },

        {
            id: 'CANCELADO',
            label: 'Cancelado',
            icon: 'lucide:ban',
            chip: 'bg-[#f6e0e0] text-[#7d2c2c]',
            dot: 'bg-[#9d3b3b]',
            stripe: 'border-l-[#9d3b3b]',
            head: 'bg-[#9d3b3b]'
        }

    ];

    // Recorrido normal de un pedido (sin cancelado)
    readonly flujo: string[] = [
        'SOLICITADO',
        'CONFIRMADO',
        'PREPARACION',
        'LISTO',
        'ENVIADO',
        'ENTREGADO'
    ];

    // Estado de envío que corresponde a cada estado del pedido
    private readonly envioPorEstado: Record<string, string> = {
        SOLICITADO: 'PENDIENTE',
        CONFIRMADO: 'PENDIENTE',
        PREPARACION: 'PREPARANDO',
        LISTO: 'PREPARANDO',
        ENVIADO: 'DESPACHADO',
        ENTREGADO: 'ENTREGADO',
        CANCELADO: 'CANCELADO'
    };

    readonly estadosEnvio: {
        id: string;
        label: string;
    }[] = [

            { id: 'PENDIENTE', label: 'Pendiente' },

            { id: 'PREPARANDO', label: 'Preparando' },

            { id: 'DESPACHADO', label: 'Despachado' },

            { id: 'ENTRANSITO', label: 'En tránsito' },

            { id: 'ENTREGADO', label: 'Entregado' },

            { id: 'DEVUELTO', label: 'Devuelto' },

            { id: 'CANCELADO', label: 'Cancelado' }

        ];

    private readonly estadosEditables: string[] = [
        'SOLICITADO',
        'CONFIRMADO',
        'PREPARACION'
    ];


    /* =============================================================
       ESTADO PRINCIPAL
       ============================================================= */

    readonly vista =
        signal<Vista>('tablero');

    readonly searchTerm =
        signal('');

    readonly selectedId =
        signal<number | null>(null);


    /* =============================================================
       CARGA
       ============================================================= */

    readonly loading =
        signal(false);

    readonly saving =
        signal(false);

    readonly loadingPedidos =
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

    readonly pedidos =
        signal<PedidosResponse[]>([]);

    readonly detalles =
        signal<DetallePedidoResponse[]>([]);

    readonly clientes =
        signal<ClientesResponse[]>([]);

    readonly productos =
        signal<ProductosResponse[]>([]);

    readonly facturas =
        signal<FacturasResponse[]>([]);


    /* =============================================================
       MODALES Y EDICIÓN
       ============================================================= */

    readonly createModalOpen =
        signal(false);

    readonly deleteTarget =
        signal<PedidosResponse | null>(null);

    readonly cancelarTarget =
        signal<PedidosResponse | null>(null);

    readonly editandoDatos =
        signal(false);

    readonly datosForm =
        signal<DatosForm>({
            direccion_entrega: '',
            observaciones: ''
        });

    readonly pedidoForm =
        signal<PedidoForm>(
            this.emptyForm()
        );

    readonly lineasNuevas =
        signal<LineaNueva[]>([]);

    // Selector "agregar producto"
    readonly addProducto =
        signal<number | null>(null);

    // Se mantiene como string porque viene directamente del input.
    readonly addCantidad =
        signal('1');


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

    readonly facturaPorPedido =
        computed(() =>
            new Map(
                this.facturas().map(
                    factura =>
                        [factura.pedido_id, factura] as const
                )
            )
        );

    readonly lineasPorPedido =
        computed(() => {

            const map =
                new Map<number, DetallePedidoResponse[]>();

            for (const detalle of this.detalles()) {

                const lista =
                    map.get(detalle.pedido_id) ?? [];

                lista.push(detalle);

                map.set(detalle.pedido_id, lista);

            }

            return map;

        });

    readonly productosActivos =
        computed(() =>
            this.productos().filter(
                producto =>
                    producto.estado
            )
        );

    readonly clientesActivos =
        computed(() =>
            this.clientes().filter(
                cliente =>
                    cliente.activo
            )
        );


    /* =============================================================
       FILTRO Y COLUMNAS DEL TABLERO
       ============================================================= */

    readonly pedidosFiltrados =
        computed(() => {

            const search =
                this.searchTerm()
                    .trim()
                    .toLowerCase();

            return this.pedidos().filter(
                pedido => {

                    if (!search) {
                        return true;
                    }

                    return [
                        String(pedido.pedido_id),
                        this.getClienteNombre(pedido.cliente_id),
                        this.getClienteEmpresa(pedido.cliente_id),
                        pedido.direccion_entrega ?? ''
                    ]
                        .join(' ')
                        .toLowerCase()
                        .includes(search);

                }
            );

        });

    readonly columnas =
        computed(() =>
            this.estados.map(
                estado => ({

                    estado,

                    pedidos:
                        this.pedidosFiltrados()
                            .filter(
                                pedido =>
                                    this.normalizeEstado(
                                        pedido.estado_pedido
                                    ) === estado.id
                            )
                            .sort(
                                (a, b) =>
                                    this.normalizeDate(a.fecha_entrega)
                                        .localeCompare(
                                            this.normalizeDate(b.fecha_entrega)
                                        ) ||
                                    a.pedido_id - b.pedido_id
                            )

                })
            )
        );

    readonly listaOrdenada =
        computed(() =>
            [...this.pedidosFiltrados()].sort(
                (a, b) =>
                    b.pedido_id -
                    a.pedido_id
            )
        );


    /* =============================================================
       INDICADORES OPERATIVOS
       ============================================================= */

    readonly totalEnProceso =
        computed(() =>
            this.pedidos().filter(
                pedido =>
                    ['SOLICITADO', 'CONFIRMADO', 'PREPARACION', 'LISTO']
                        .includes(
                            this.normalizeEstado(
                                pedido.estado_pedido
                            )
                        )
            ).length
        );

    readonly totalListos =
        computed(() =>
            this.contarEstado('LISTO')
        );

    readonly totalEnRuta =
        computed(() =>
            this.contarEstado('ENVIADO')
        );

    readonly totalEntregados =
        computed(() =>
            this.contarEstado('ENTREGADO')
        );

    readonly totalAtrasados =
        computed(() =>
            this.pedidos().filter(
                pedido =>
                    this.isAtrasado(pedido)
            ).length
        );


    /* =============================================================
       PEDIDO SELECCIONADO
       ============================================================= */

    readonly pedidoSeleccionado =
        computed(() =>
            this.pedidos().find(
                pedido =>
                    pedido.pedido_id ===
                    this.selectedId()
            ) ?? null
        );

    readonly lineasSeleccionado =
        computed(() => {

            const pedido =
                this.pedidoSeleccionado();

            return pedido
                ? [...(
                    this.lineasPorPedido().get(
                        pedido.pedido_id
                    ) ?? []
                )].sort(
                    (a, b) =>
                        a.detalle_pedido_id -
                        b.detalle_pedido_id
                )
                : [];

        });

    readonly totalSeleccionado =
        computed(() =>
            this.sumarLineas(
                this.lineasSeleccionado()
            )
        );

    readonly facturaSeleccionado =
        computed(() => {

            const pedido =
                this.pedidoSeleccionado();

            return pedido
                ? this.facturaPorPedido().get(
                    pedido.pedido_id
                ) ?? null
                : null;

        });

    readonly lineasEditables =
        computed(() => {

            const pedido =
                this.pedidoSeleccionado();

            return (
                !!pedido &&
                this.estadosEditables.includes(
                    this.normalizeEstado(
                        pedido.estado_pedido
                    )
                ) &&
                !this.facturaSeleccionado()
            );

        });

    readonly puedeCancelar =
        computed(() => {

            const pedido =
                this.pedidoSeleccionado();

            if (!pedido) {
                return false;
            }

            const estado =
                this.normalizeEstado(
                    pedido.estado_pedido
                );

            return (
                estado !== 'ENTREGADO' &&
                estado !== 'CANCELADO' &&
                !this.facturaSeleccionado()
            );

        });

    readonly siguienteEstadoSeleccionado =
        computed(() => {

            const pedido =
                this.pedidoSeleccionado();

            return pedido
                ? this.siguienteEstado(
                    pedido.estado_pedido
                )
                : null;

        });


    /* =============================================================
       NUEVO PEDIDO
       ============================================================= */

    readonly totalNuevo =
        computed(() =>
            this.roundAmount(
                this.lineasNuevas().reduce(
                    (suma, linea) =>
                        suma +
                        linea.cantidad *
                        linea.precio_unitario,
                    0
                )
            )
        );

    readonly isFormValid =
        computed(() => {

            const form =
                this.pedidoForm();

            return (
                form.cliente_id !== null &&
                !!form.direccion_entrega.trim() &&
                !!form.fecha_pedido &&
                !!form.fecha_salida &&
                !!form.fecha_entrega &&
                form.fecha_salida >= form.fecha_pedido &&
                form.fecha_entrega >= form.fecha_salida &&
                this.lineasNuevas().length > 0
            );

        });

    readonly fechasInvalidas =
        computed(() => {

            const form =
                this.pedidoForm();

            return (
                (
                    !!form.fecha_salida &&
                    !!form.fecha_pedido &&
                    form.fecha_salida < form.fecha_pedido
                ) ||
                (
                    !!form.fecha_entrega &&
                    !!form.fecha_salida &&
                    form.fecha_entrega < form.fecha_salida
                )
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

            pedidos:
                this.pedidosService
                    .getPedidos(),

            detalles:
                this.detallePedidoService
                    .getDetalles(),

            clientes:
                this.clientesService
                    .getClientes(),

            productos:
                this.productosService
                    .getProductos(),

            facturas:
                this.facturasService
                    .getFacturas()

        }).subscribe({

            next: (datos) => {

                this.pedidos.set(datos.pedidos);

                this.detalles.set(datos.detalles);

                this.clientes.set(datos.clientes);

                this.productos.set(datos.productos);

                this.facturas.set(datos.facturas);

                const seleccionado =
                    this.selectedId();

                if (
                    seleccionado !== null &&
                    !datos.pedidos.some(
                        pedido =>
                            pedido.pedido_id === seleccionado
                    )
                ) {
                    this.selectedId.set(null);
                }

                this.loading.set(false);

            },

            error: (error) => {

                console.error(
                    'Error cargando los pedidos:',
                    error
                );

                this.errorMessage.set(
                    this.getErrorMessage(
                        error,
                        'No se pudieron cargar los pedidos.'
                    )
                );

                this.loading.set(false);

            }

        });

    }


    refreshData(): void {

        if (this.loadingPedidos()) {
            return;
        }

        this.loadData();

    }


    setVista(
        vista: Vista
    ): void {

        this.vista.set(vista);

    }


    /* =============================================================
       PANEL DE SEGUIMIENTO
       ============================================================= */

    openPedido(
        pedido: PedidosResponse
    ): void {

        this.selectedId.set(pedido.pedido_id);

        this.editandoDatos.set(false);

        this.addProducto.set(null);

        this.addCantidad.set('1');

    }


    closePedido(): void {

        this.selectedId.set(null);

        this.editandoDatos.set(false);

    }


    /* =============================================================
       CAMBIOS DE ESTADO
       ============================================================= */

    avanzar(
        pedido: PedidosResponse
    ): void {

        const siguiente =
            this.siguienteEstado(
                pedido.estado_pedido
            );

        if (
            !siguiente ||
            this.saving()
        ) {
            return;
        }

        if (
            siguiente === 'CONFIRMADO' ||
            siguiente === 'PREPARACION' ||
            siguiente === 'LISTO' ||
            siguiente === 'ENVIADO' ||
            siguiente === 'ENTREGADO'
        ) {

            const lineas =
                this.lineasPorPedido().get(
                    pedido.pedido_id
                ) ?? [];

            if (!lineas.length) {

                this.errorMessage.set(
                    `El pedido #${pedido.pedido_id} no tiene productos. Agrega al menos uno antes de avanzar.`
                );

                return;

            }

        }

        this.actualizarPedido(
            pedido.pedido_id,
            {
                estado_pedido: siguiente,
                estado_envio:
                    this.envioPorEstado[siguiente]
            },
            'No se pudo avanzar el pedido.'
        );

    }


    cambiarEnvio(
        pedidoId: number,
        estadoEnvio: string
    ): void {

        if (this.saving()) {
            return;
        }

        this.actualizarPedido(
            pedidoId,
            {
                estado_envio: estadoEnvio
            },
            'No se pudo cambiar el estado de envío.'
        );

    }


    openCancelar(
        pedido: PedidosResponse
    ): void {

        if (this.loadingPedidos()) {
            return;
        }

        this.cancelarTarget.set(pedido);

    }


    closeCancelar(): void {

        if (this.saving()) {
            return;
        }

        this.cancelarTarget.set(null);

    }


    confirmCancelar(): void {

        const pedido =
            this.cancelarTarget();

        if (
            !pedido ||
            this.saving()
        ) {
            return;
        }

        this.cancelarTarget.set(null);

        this.actualizarPedido(
            pedido.pedido_id,
            {
                estado_pedido: 'CANCELADO',
                estado_envio: 'CANCELADO'
            },
            'No se pudo cancelar el pedido.'
        );

    }


    private actualizarPedido(
        pedidoId: number,
        dto: UpdatePedidos,
        fallback: string
    ): void {

        this.saving.set(true);

        this.errorMessage.set(null);

        this.pedidosService
            .updatePedido(pedidoId, dto)
            .subscribe({

                next: () => {

                    this.saving.set(false);

                    this.editandoDatos.set(false);

                    this.loadData();

                },

                error: (error) => {

                    console.error(
                        'Error actualizando el pedido:',
                        error
                    );

                    this.errorMessage.set(
                        this.getErrorMessage(
                            error,
                            fallback
                        )
                    );

                    this.saving.set(false);

                }

            });

    }


    /* =============================================================
       DATOS DE ENTREGA
       ============================================================= */

    openEditDatos(): void {

        const pedido =
            this.pedidoSeleccionado();

        if (!pedido) {
            return;
        }

        this.datosForm.set({

            direccion_entrega:
                pedido.direccion_entrega ?? '',

            observaciones:
                pedido.observaciones ?? ''

        });

        this.editandoDatos.set(true);

    }


    cancelEditDatos(): void {

        this.editandoDatos.set(false);

    }


    updateDatos<K extends keyof DatosForm>(
        field: K,
        value: DatosForm[K]
    ): void {

        this.datosForm.update(
            form => ({

                ...form,

                [field]: value

            })
        );

    }


    saveDatos(): void {

        const pedido =
            this.pedidoSeleccionado();

        const form =
            this.datosForm();

        if (
            !pedido ||
            this.saving() ||
            !form.direccion_entrega.trim()
        ) {
            return;
        }

        this.actualizarPedido(
            pedido.pedido_id,
            {
                direccion_entrega:
                    form.direccion_entrega.trim(),

                observaciones:
                    form.observaciones.trim()
            },
            'No se pudieron guardar los datos de entrega.'
        );

    }


    /* =============================================================
       LÍNEAS DEL PEDIDO (PANEL)
       ============================================================= */

    agregarLineaPedido(): void {

        const pedido =
            this.pedidoSeleccionado();

        const productoId =
            this.addProducto();

        const cantidad =
            this.parsePositiveInteger(
                this.addCantidad()
            );

        if (
            !pedido ||
            productoId === null ||
            cantidad === null ||
            this.saving() ||
            !this.lineasEditables()
        ) {
            return;
        }

        const producto =
            this.productosMap().get(productoId);

        const existente =
            this.lineasSeleccionado().find(
                linea =>
                    linea.producto_id === productoId
            );

        this.saving.set(true);

        this.errorMessage.set(null);

        const peticion$ =
            existente
                ? this.detallePedidoService
                    .updateDetalle(
                        existente.detalle_pedido_id,
                        {
                            cantidad:
                                this.toNumber(existente.cantidad) +
                                cantidad
                        }
                    )
                : this.detallePedidoService
                    .createDetalle({

                        pedido_id:
                            pedido.pedido_id,

                        producto_id:
                            productoId,

                        cantidad,

                        precio_unitario:
                            this.toNumber(
                                producto?.precio_venta
                            )

                    });

        peticion$.subscribe({

            next: () => {

                this.saving.set(false);

                this.addProducto.set(null);

                this.addCantidad.set('1');

                this.loadData();

            },

            error: (error) => {

                console.error(
                    'Error agregando el producto al pedido:',
                    error
                );

                this.errorMessage.set(
                    this.getErrorMessage(
                        error,
                        'No se pudo agregar el producto al pedido.'
                    )
                );

                this.saving.set(false);

            }

        });

    }


    actualizarLinea(
        linea: DetallePedidoResponse,
        campo: 'cantidad' | 'precio_unitario',
        input: HTMLInputElement
    ): void {

        const valor =
            campo === 'cantidad'
                ? this.parsePositiveInteger(
                    input.value
                )
                : this.parseAmount(
                    input.value
                );

        const actual =
            this.toNumber(linea[campo]);

        const invalido =
            campo === 'cantidad'
                ? valor === null
                : valor! < 0;

        if (
            invalido ||
            valor === actual ||
            this.saving() ||
            !this.lineasEditables()
        ) {

            input.value = String(actual);

            return;

        }

        this.saving.set(true);

        this.errorMessage.set(null);

        this.detallePedidoService
            .updateDetalle(
                linea.detalle_pedido_id,
                {
                    [campo]: valor
                }
            )
            .subscribe({

                next: () => {

                    this.saving.set(false);

                    this.loadData();

                },

                error: (error) => {

                    console.error(
                        'Error actualizando la línea del pedido:',
                        error
                    );

                    this.errorMessage.set(
                        this.getErrorMessage(
                            error,
                            'No se pudo actualizar la línea del pedido.'
                        )
                    );

                    input.value = String(actual);

                    this.saving.set(false);

                }

            });

    }


    eliminarLinea(
        linea: DetallePedidoResponse
    ): void {

        if (
            this.saving() ||
            !this.lineasEditables()
        ) {
            return;
        }

        this.saving.set(true);

        this.errorMessage.set(null);

        this.detallePedidoService
            .deleteDetalle(
                linea.detalle_pedido_id
            )
            .subscribe({

                next: () => {

                    this.saving.set(false);

                    this.loadData();

                },

                error: (error) => {

                    console.error(
                        'Error eliminando la línea del pedido:',
                        error
                    );

                    this.errorMessage.set(
                        this.getErrorMessage(
                            error,
                            'No se pudo quitar el producto del pedido.'
                        )
                    );

                    this.saving.set(false);

                }

            });

    }


    /* =============================================================
       NUEVO PEDIDO
       ============================================================= */

    openCreatePedido(): void {

        if (this.loadingPedidos()) {
            return;
        }

        this.pedidoForm.set(
            this.emptyForm()
        );

        this.lineasNuevas.set([]);

        this.addProducto.set(null);

        this.addCantidad.set('1');

        this.createModalOpen.set(true);

    }


    closeCreatePedido(): void {

        if (this.saving()) {
            return;
        }

        this.createModalOpen.set(false);

    }


    updateForm<K extends keyof PedidoForm>(
        field: K,
        value: PedidoForm[K]
    ): void {

        this.pedidoForm.update(
            form => ({

                ...form,

                [field]: value

            })
        );

    }


    onClienteChange(
        value: string
    ): void {

        const previo =
            this.pedidoForm().cliente_id;

        const clienteId =
            value
                ? Number(value)
                : null;

        const direccionPrevia =
            previo !== null
                ? this.clientesMap().get(previo)
                    ?.direccion_cliente ?? ''
                : '';

        const direccionNueva =
            clienteId !== null
                ? this.clientesMap().get(clienteId)
                    ?.direccion_cliente ?? ''
                : '';

        this.pedidoForm.update(
            form => ({

                ...form,

                cliente_id:
                    clienteId,

                direccion_entrega:
                    !form.direccion_entrega.trim() ||
                    form.direccion_entrega === direccionPrevia
                        ? direccionNueva
                        : form.direccion_entrega

            })
        );

    }


    onAddProducto(
        value: string
    ): void {

        const productoId =
            value
                ? Number(value)
                : null;

        this.addProducto.set(
            productoId !== null &&
            Number.isFinite(productoId)
                ? productoId
                : null
        );

    }


    /* =============================================================
       CONTROL DE CANTIDADES
       ============================================================= */

    /**
     * Bloquea la escritura directa.
     *
     * La cantidad se modifica mediante las flechas
     * del input type="number".
     */
    bloquearEntradaCantidad(
        event: KeyboardEvent
    ): void {

        const teclasPermitidas = [
            'ArrowUp',
            'ArrowDown',
            'Tab',
            'Shift',
            'Control',
            'Alt',
            'Escape',
            'Enter'
        ];

        if (
            !teclasPermitidas.includes(
                event.key
            )
        ) {
            event.preventDefault();
        }

    }


    /**
     * Evita pegar una cantidad directamente.
     */
    bloquearPegadoCantidad(
        event: ClipboardEvent
    ): void {

        event.preventDefault();

    }


    /**
     * Evita que el navegador deje una cantidad
     * inválida como 0, negativa, decimal o vacía.
     */
    onAddCantidad(
        event: Event
    ): void {

        const input =
            event.target as HTMLInputElement;

        const cantidad =
            this.parsePositiveInteger(
                input.value
            );

        if (cantidad === null) {

            input.value = '1';

            this.addCantidad.set('1');

            return;

        }

        const value =
            String(cantidad);

        input.value = value;

        this.addCantidad.set(value);

    }


    /**
     * Protege también los inputs de cantidades
     * que ya pertenecen a una línea.
     */
    normalizarCantidadInput(
        event: Event
    ): void {

        const input =
            event.target as HTMLInputElement;

        const cantidad =
            this.parsePositiveInteger(
                input.value
            );

        input.value =
            cantidad === null
                ? '1'
                : String(cantidad);

    }


    /* =============================================================
       LÍNEAS NUEVAS
       ============================================================= */

    agregarLineaNueva(): void {

        console.log('=== AGREGANDO PRODUCTO ===');

    console.log('Producto seleccionado:', this.addProducto());
    console.log('Cantidad:', this.addCantidad());
    console.log('Líneas antes:', this.lineasNuevas());

        const productoId =
            this.addProducto();

        const cantidad =
            this.parsePositiveInteger(
                this.addCantidad()
            );

        if (
            productoId === null ||
            cantidad === null
        ) {
            return;
        }

        const producto =
            this.productosMap().get(productoId);

        this.lineasNuevas.update(
            lineas => {

                const existe =
                    lineas.some(
                        linea =>
                            linea.producto_id === productoId
                    );

                return existe
                    ? lineas.map(
                        linea =>
                            linea.producto_id === productoId
                                ? {
                                    ...linea,
                                    cantidad:
                                        linea.cantidad + cantidad
                                }
                                : linea
                    )
                    : [
                        ...lineas,
                        {
                            producto_id: productoId,
                            cantidad,
                            precio_unitario:
                                this.toNumber(
                                    producto?.precio_venta
                                )
                        }
                    ];

            }
        );

        this.addProducto.set(null);

        this.addCantidad.set('1');

    }


    actualizarLineaNueva(
        productoId: number,
        campo: 'cantidad' | 'precio_unitario',
        value: string
    ): void {

        const valor =
            campo === 'cantidad'
                ? this.parsePositiveInteger(value)
                : this.parseAmount(value);

        if (
            campo === 'cantidad' &&
            valor === null
        ) {
            return;
        }

        this.lineasNuevas.update(
            lineas =>
                lineas.map(
                    linea =>
                        linea.producto_id === productoId
                            ? {
                                ...linea,
                                [campo]: valor
                            }
                            : linea
                )
        );

    }


    quitarLineaNueva(
        productoId: number
    ): void {

        this.lineasNuevas.update(
            lineas =>
                lineas.filter(
                    linea =>
                        linea.producto_id !== productoId
                )
        );

    }


    /* =============================================================
       GUARDAR PEDIDO
       ============================================================= */

    savePedido(): void {

        if (
            !this.isFormValid() ||
            this.saving()
        ) {
            return;
        }

        const form =
            this.pedidoForm();

        const lineas =
            this.lineasNuevas().filter(
                linea =>
                    Number.isInteger(linea.cantidad) &&
                    linea.cantidad > 0
            );

        if (!lineas.length) {
            return;
        }

        const dto: CreatePedidos = {

            cliente_id:
                form.cliente_id as number,

            fecha_pedido:
                form.fecha_pedido,

            estado_pedido:
                'SOLICITADO',

            direccion_entrega:
                form.direccion_entrega.trim(),

            estado_envio:
                this.envioPorEstado['SOLICITADO'],

            fecha_salida:
                form.fecha_salida,

            fecha_entrega:
                form.fecha_entrega,

            observaciones:
                form.observaciones.trim()

        };

        this.saving.set(true);

        this.errorMessage.set(null);

        this.pedidosService
            .createPedido(dto)
            .pipe(
                switchMap(
                    pedido =>
                        forkJoin(
                            lineas.map(
                                linea =>
                                    this.detallePedidoService
                                        .createDetalle({

                                            pedido_id:
                                                pedido.pedido_id,

                                            producto_id:
                                                linea.producto_id,

                                            cantidad:
                                                linea.cantidad,

                                            precio_unitario:
                                                linea.precio_unitario

                                        })
                            )
                        ).pipe(
                            map(() => pedido)
                        )
                )
            )
            .subscribe({

                next: (pedido) => {

                    this.saving.set(false);

                    this.createModalOpen.set(false);

                    this.selectedId.set(
                        pedido.pedido_id
                    );

                    this.loadData();

                },

                error: (error) => {

                    console.error(
                        'Error creando el pedido:',
                        error
                    );

                    this.errorMessage.set(
                        this.getErrorMessage(
                            error,
                            'No se pudo crear el pedido.'
                        )
                    );

                    this.saving.set(false);

                    this.createModalOpen.set(false);

                    this.loadData();

                }

            });

    }


    /* =============================================================
       ELIMINAR
       ============================================================= */

    openDeletePedido(
        pedido: PedidosResponse
    ): void {

        if (this.loadingPedidos()) {
            return;
        }

        this.deleteTarget.set(pedido);

    }


    closeDeletePedido(): void {

        if (this.saving()) {
            return;
        }

        this.deleteTarget.set(null);

    }


    puedeEliminar(
        pedido: PedidosResponse | null
    ): boolean {

        return (
            !!pedido &&
            !this.facturaPorPedido().has(
                pedido.pedido_id
            )
        );

    }


    confirmDeletePedido(): void {

        const pedido =
            this.deleteTarget();

        if (
            !pedido ||
            this.saving() ||
            !this.puedeEliminar(pedido)
        ) {
            return;
        }

        this.saving.set(true);

        this.errorMessage.set(null);

        this.pedidosService
            .deletePedido(pedido.pedido_id)
            .subscribe({

                next: () => {

                    this.saving.set(false);

                    this.deleteTarget.set(null);

                    if (
                        this.selectedId() === pedido.pedido_id
                    ) {
                        this.selectedId.set(null);
                    }

                    this.loadData();

                },

                error: (error) => {

                    console.error(
                        'Error eliminando el pedido:',
                        error
                    );

                    this.errorMessage.set(
                        this.getErrorMessage(
                            error,
                            'No se pudo eliminar el pedido.'
                        )
                    );

                    this.saving.set(false);

                    this.deleteTarget.set(null);

                }

            });

    }


    /* =============================================================
       AYUDAS DE PEDIDO
       ============================================================= */

    getEstado(
        estado:
            string |
            null |
            undefined
    ): EstadoPedidoInfo {

        const id =
            this.normalizeEstado(estado);

        return (
            this.estados.find(
                item =>
                    item.id === id
            ) ?? this.estados[0]
        );

    }


    getIndiceFlujo(
        estado:
            string |
            null |
            undefined
    ): number {

        return this.flujo.indexOf(
            this.normalizeEstado(estado)
        );

    }


    siguienteEstado(
        estado:
            string |
            null |
            undefined
    ): string | null {

        const indice =
            this.getIndiceFlujo(estado);

        return (
            indice >= 0 &&
            indice < this.flujo.length - 1
        )
            ? this.flujo[indice + 1]
            : null;

    }


    getEstadoLabel(
        id: string
    ): string {

        return this.getEstado(id).label;

    }


    getEnvioLabel(
        estado:
            string |
            null |
            undefined
    ): string {

        const id =
            this.normalizeEstado(estado);

        return (
            this.estadosEnvio.find(
                item =>
                    item.id === id
            )?.label ?? this.formatTexto(estado)
        );

    }


    isAtrasado(
        pedido: PedidosResponse
    ): boolean {

        const estado =
            this.normalizeEstado(
                pedido.estado_pedido
            );

        if (
            estado === 'ENTREGADO' ||
            estado === 'CANCELADO'
        ) {
            return false;
        }

        const entrega =
            this.normalizeDate(
                pedido.fecha_entrega
            );

        return (
            !!entrega &&
            entrega <
            this.toInputDate(new Date())
        );

    }


    getLineas(
        pedidoId: number
    ): DetallePedidoResponse[] {

        return (
            this.lineasPorPedido().get(pedidoId) ?? []
        );

    }


    getTotalPedido(
        pedidoId: number
    ): number {

        return this.sumarLineas(
            this.getLineas(pedidoId)
        );

    }


    getProductoNombre(
        productoId:
            number |
            null |
            undefined
    ): string {

        if (
            productoId === null ||
            productoId === undefined
        ) {
            return 'Sin producto';
        }

        return (
            this.productosMap().get(productoId)
                ?.nombre_producto ??
            `Producto #${productoId}`
        );

    }


    getProductoCodigo(
        productoId:
            number |
            null |
            undefined
    ): string {

        if (
            productoId === null ||
            productoId === undefined
        ) {
            return '—';
        }

        return (
            this.productosMap().get(productoId)
                ?.codigo ?? '—'
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


    getClienteTelefono(
        clienteId: number
    ): string {

        return (
            this.clientesMap().get(clienteId)
                ?.telefono_cliente ?? ''
        );

    }


    private contarEstado(
        estado: string
    ): number {

        return this.pedidos().filter(
            pedido =>
                this.normalizeEstado(
                    pedido.estado_pedido
                ) === estado
        ).length;

    }


    private sumarLineas(
        lineas: DetallePedidoResponse[]
    ): number {

        return this.roundAmount(
            lineas.reduce(
                (suma, linea) =>
                    suma +
                    this.toNumber(linea.cantidad) *
                    this.toNumber(linea.precio_unitario),
                0
            )
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
                month: 'short'
            }
        ).format(parsed);

    }


    formatDateLong(
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

        return new Intl.DateTimeFormat(
            'es-NI',
            {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }
        ).format(
            new Date(year, month - 1, day)
        );

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


    private formatTexto(
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


    private emptyForm(): PedidoForm {

        const hoy =
            new Date();

        const manana =
            new Date(hoy);

        manana.setDate(
            hoy.getDate() + 1
        );

        const entrega =
            new Date(hoy);

        entrega.setDate(
            hoy.getDate() + 3
        );

        return {

            cliente_id: null,

            direccion_entrega: '',

            fecha_pedido:
                this.toInputDate(hoy),

            fecha_salida:
                this.toInputDate(manana),

            fecha_entrega:
                this.toInputDate(entrega),

            observaciones: ''

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


    /**
     * Convierte un valor a cantidad positiva entera.
     *
     * Retorna null si no es una cantidad válida.
     */
    private parsePositiveInteger(
        value:
            string |
            number |
            null |
            undefined
    ): number | null {

        if (
            value === null ||
            value === undefined ||
            value === ''
        ) {
            return null;
        }

        const number =
            Number(value);

        if (
            !Number.isFinite(number) ||
            !Number.isInteger(number) ||
            number < 1
        ) {
            return null;
        }

        return number;

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