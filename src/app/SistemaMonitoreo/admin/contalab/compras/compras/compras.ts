import {
    ChangeDetectionStrategy,
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    computed,
    inject,
    OnInit,
    signal
} from '@angular/core';

import { forkJoin, map, of, switchMap } from 'rxjs';

import {
    ComprasService,
    ComprasResponse,
    CreateCompras
} from '../../../../../services/compras.service';

import {
    DetalleCompraService,
    DetalleCompraResponse
} from '../../../../../services/detalle_compra.service';

import {
    DetallePagoProveedorService,
    DetallePagoProveedorResponse
} from '../../../../../services/detalle_pago_proveedor.service';

import {
    ProveedoresService,
    ProveedoresResponse
} from '../../../../../services/proveedores.service';

import {
    ProductosService,
    ProductosResponse
} from '../../../../../services/productos.service';


interface EstadoCompraInfo {
    id: string;
    label: string;
    icon: string;
    chip: string;
}

interface CompraForm {
    proveedor_id: number | null;
    fecha: string;
}

interface LineaNueva {
    producto_id: number;
    cantidad: number;
    costo_unitario: number;
}


@Component({
    selector: 'app-compras',
    standalone: true,
    imports: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './compras.html',
    changeDetection: ChangeDetectionStrategy.OnPush
    /*__STYLES__*/
})
export class ComprasComponent implements OnInit {

    private readonly comprasService = inject(ComprasService);
    private readonly detalleCompraService = inject(DetalleCompraService);
    private readonly aplicacionesService = inject(DetallePagoProveedorService);
    private readonly proveedoresService = inject(ProveedoresService);
    private readonly productosService = inject(ProductosService);

    /* CONSTANTES */
    readonly estados: EstadoCompraInfo[] = [
        { id: 'PENDIENTE', label: 'Pendiente', icon: 'lucide:clock', chip: 'bg-[#f8ecd5] text-[#8a5a12]' },
        { id: 'PARCIAL', label: 'Pago parcial', icon: 'lucide:circle-dashed', chip: 'bg-[#e3edf6] text-[#2f5276]' },
        { id: 'PAGADA', label: 'Pagada', icon: 'lucide:badge-check', chip: 'bg-[#dcefe2] text-[#2c5a3d]' },
        { id: 'ANULADA', label: 'Anulada', icon: 'lucide:ban', chip: 'bg-[#f6e0e0] text-[#7d2c2c]' }
    ];

    /* ESTADO */
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly loadingAny = computed(() => this.loading() || this.saving());
    readonly errorMessage = signal<string | null>(null);

    readonly searchTerm = signal('');
    readonly filtroEstado = signal<string>('TODOS');
    readonly selectedId = signal<number | null>(null);

    /* DATOS */
    readonly compras = signal<ComprasResponse[]>([]);
    readonly detalles = signal<DetalleCompraResponse[]>([]);
    readonly aplicaciones = signal<DetallePagoProveedorResponse[]>([]);
    readonly proveedores = signal<ProveedoresResponse[]>([]);
    readonly productos = signal<ProductosResponse[]>([]);

    /* MODALES */
    readonly createModalOpen = signal(false);
    readonly deleteTarget = signal<ComprasResponse | null>(null);
    readonly compraForm = signal<CompraForm>(this.emptyForm());
    readonly lineasNuevas = signal<LineaNueva[]>([]);

    readonly addProducto = signal<number | null>(null);
    readonly addCantidad = signal('1');
    readonly addCosto = signal('');

    /* MAPAS */
    readonly proveedoresMap = computed(() =>
        new Map(this.proveedores().map(p => [p.proveedor_id, p] as const))
    );

    readonly productosMap = computed(() =>
        new Map(this.productos().map(p => [p.producto_id, p] as const))
    );

    readonly lineasPorCompra = computed(() => {
        const map = new Map<number, DetalleCompraResponse[]>();
        for (const d of this.detalles()) {
            const lista = map.get(d.compra_id) ?? [];
            lista.push(d);
            map.set(d.compra_id, lista);
        }
        return map;
    });

    readonly aplicacionesPorCompra = computed(() => {
        const map = new Map<number, DetallePagoProveedorResponse[]>();
        for (const a of this.aplicaciones()) {
            const lista = map.get(a.compra_id) ?? [];
            lista.push(a);
            map.set(a.compra_id, lista);
        }
        return map;
    });

    readonly proveedoresActivos = computed(() => this.proveedores().filter(p => p.estado));
    readonly productosActivos = computed(() => this.productos().filter(p => p.estado));

    /* FILTRO */
    readonly comprasFiltradas = computed(() => {

        const search = this.searchTerm().trim().toLowerCase();
        const filtro = this.filtroEstado();

        return this.compras()
            .filter(c => {
                if (filtro !== 'TODOS' && this.normalizeEstado(c.estado) !== filtro) return false;
                if (!search) return true;

                return [String(c.compra_id), this.getProveedorNombre(c.proveedor_id)]
                    .join(' ')
                    .toLowerCase()
                    .includes(search);
            })
            .sort((a, b) => b.compra_id - a.compra_id);
    });

    /* INDICADORES */
    readonly totalPendientes = computed(() => this.contarEstado('PENDIENTE'));
    readonly totalParciales = computed(() => this.contarEstado('PARCIAL'));
    readonly totalPagadas = computed(() => this.contarEstado('PAGADA'));

    readonly saldoPorPagar = computed(() =>
        this.roundAmount(
            this.compras()
                .filter(c => this.normalizeEstado(c.estado) !== 'ANULADA')
                .reduce((suma, c) => suma + Math.max(this.getSaldo(c.compra_id), 0), 0)
        )
    );

    /* SELECCIONADA */
    readonly compraSeleccionada = computed(() =>
        this.compras().find(c => c.compra_id === this.selectedId()) ?? null
    );

    readonly lineasSeleccionada = computed(() => {
        const compra = this.compraSeleccionada();
        return compra
            ? [...(this.lineasPorCompra().get(compra.compra_id) ?? [])]
                .sort((a, b) => a.detalle_compra_id - b.detalle_compra_id)
            : [];
    });

    readonly aplicacionesSeleccionada = computed(() => {
        const compra = this.compraSeleccionada();
        return compra ? this.aplicacionesPorCompra().get(compra.compra_id) ?? [] : [];
    });

    readonly totalSeleccionada = computed(() => this.sumarLineas(this.lineasSeleccionada()));

    readonly aplicadoSeleccionada = computed(() =>
        this.roundAmount(
            this.aplicacionesSeleccionada().reduce((s, a) => s + this.toNumber(a.monto_aplicado), 0)
        )
    );

    readonly saldoSeleccionada = computed(() =>
        this.roundAmount(this.totalSeleccionada() - this.aplicadoSeleccionada())
    );

    // Las líneas solo se editan si la compra sigue abierta y no tiene pagos aplicados
    readonly lineasEditables = computed(() => {
        const compra = this.compraSeleccionada();
        return (
            !!compra &&
            this.normalizeEstado(compra.estado) === 'PENDIENTE' &&
            this.aplicacionesSeleccionada().length === 0
        );
    });

    /* NUEVA COMPRA */
    readonly totalNueva = computed(() =>
        this.roundAmount(
            this.lineasNuevas().reduce((s, l) => s + l.cantidad * l.costo_unitario, 0)
        )
    );

    readonly isFormValid = computed(() => {
        const f = this.compraForm();
        return (
            f.proveedor_id !== null &&
            !!f.fecha &&
            this.lineasNuevas().length > 0 &&
            this.lineasNuevas().every(l => l.cantidad > 0 && l.costo_unitario > 0)
        );
    });


    ngOnInit(): void {
        this.loadData();
    }


    /* CARGA */
    private loadData(): void {

        this.loading.set(true);
        this.errorMessage.set(null);

        forkJoin({
            compras: this.comprasService.getCompras(),
            detalles: this.detalleCompraService.getDetalles(),
            aplicaciones: this.aplicacionesService.getDetalles(),
            proveedores: this.proveedoresService.getProveedores(),
            productos: this.productosService.getProductos()
        }).subscribe({

            next: (datos) => {
                this.compras.set(datos.compras);
                this.detalles.set(datos.detalles);
                this.aplicaciones.set(datos.aplicaciones);
                this.proveedores.set(datos.proveedores);
                this.productos.set(datos.productos);

                const seleccionada = this.selectedId();
                if (seleccionada !== null && !datos.compras.some(c => c.compra_id === seleccionada)) {
                    this.selectedId.set(null);
                }

                this.loading.set(false);
            },

            error: (error) => {
                console.error('Error cargando las compras:', error);
                this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar las compras.'));
                this.loading.set(false);
            }
        });
    }

    refreshData(): void {
        if (this.loadingAny()) return;
        this.loadData();
    }


    /* PANEL */
    openCompra(compra: ComprasResponse): void {
        this.selectedId.set(compra.compra_id);
        this.addProducto.set(null);
        this.addCantidad.set('1');
        this.addCosto.set('');
    }

    closeCompra(): void {
        this.selectedId.set(null);
    }


    /* LÍNEAS DE LA COMPRA (PANEL) */
    agregarLineaCompra(): void {

        const compra = this.compraSeleccionada();
        const productoId = this.addProducto();
        const cantidad = this.parsePositiveInteger(this.addCantidad());
        const costo = this.parseAmount(this.addCosto());

        if (
            !compra ||
            productoId === null ||
            cantidad === null ||
            costo <= 0 ||
            this.saving() ||
            !this.lineasEditables()
        ) {
            return;
        }

        const existente = this.lineasSeleccionada().find(l => l.producto_id === productoId);

        this.saving.set(true);
        this.errorMessage.set(null);

        const peticion$ = existente
            ? this.detalleCompraService.updateDetalle(existente.detalle_compra_id, {
                cantidad: this.toNumber(existente.cantidad) + cantidad,
                costo_unitario: costo
            })
            : this.detalleCompraService.createDetalle({
                compra_id: compra.compra_id,
                producto_id: productoId,
                cantidad,
                costo_unitario: costo
            });

        peticion$.subscribe({

            next: () => {
                this.saving.set(false);
                this.addProducto.set(null);
                this.addCantidad.set('1');
                this.addCosto.set('');
                this.loadData();
            },

            error: (error) => {
                console.error('Error agregando el producto a la compra:', error);
                this.errorMessage.set(this.getErrorMessage(error, 'No se pudo agregar el producto a la compra.'));
                this.saving.set(false);
            }
        });
    }

    actualizarLinea(
        linea: DetalleCompraResponse,
        campo: 'cantidad' | 'costo_unitario',
        input: HTMLInputElement
    ): void {

        const valor = campo === 'cantidad'
            ? this.parsePositiveInteger(input.value)
            : this.parseAmount(input.value);

        const actual = this.toNumber(linea[campo]);
        const invalido = campo === 'cantidad' ? valor === null : (valor as number) <= 0;

        if (invalido || valor === actual || this.saving() || !this.lineasEditables()) {
            input.value = String(actual);
            return;
        }

        this.saving.set(true);
        this.errorMessage.set(null);

        this.detalleCompraService
            .updateDetalle(linea.detalle_compra_id, { [campo]: valor })
            .subscribe({

                next: () => {
                    this.saving.set(false);
                    this.loadData();
                },

                error: (error) => {
                    console.error('Error actualizando la línea:', error);
                    this.errorMessage.set(this.getErrorMessage(error, 'No se pudo actualizar la línea.'));
                    input.value = String(actual);
                    this.saving.set(false);
                }
            });
    }

    eliminarLinea(linea: DetalleCompraResponse): void {

        if (this.saving() || !this.lineasEditables()) return;

        this.saving.set(true);
        this.errorMessage.set(null);

        this.detalleCompraService.deleteDetalle(linea.detalle_compra_id).subscribe({

            next: () => {
                this.saving.set(false);
                this.loadData();
            },

            error: (error) => {
                console.error('Error quitando la línea:', error);
                this.errorMessage.set(this.getErrorMessage(error, 'No se pudo quitar el producto.'));
                this.saving.set(false);
            }
        });
    }

    onAddProducto(value: string): void {
        const id = value ? Number(value) : null;
        this.addProducto.set(id !== null && Number.isFinite(id) ? id : null);
    }


    /* NUEVA COMPRA */
    openCreate(): void {
        if (this.loadingAny()) return;
        this.compraForm.set(this.emptyForm());
        this.lineasNuevas.set([]);
        this.addProducto.set(null);
        this.addCantidad.set('1');
        this.addCosto.set('');
        this.createModalOpen.set(true);
    }

    closeCreate(): void {
        if (this.saving()) return;
        this.createModalOpen.set(false);
    }

    updateForm<K extends keyof CompraForm>(field: K, value: CompraForm[K]): void {
        this.compraForm.update(f => ({ ...f, [field]: value }));
    }

    onProveedorChange(value: string): void {
        this.updateForm('proveedor_id', value ? Number(value) : null);
    }

    agregarLineaNueva(): void {

        const productoId = this.addProducto();
        const cantidad = this.parsePositiveInteger(this.addCantidad());
        const costo = this.parseAmount(this.addCosto());

        if (productoId === null || cantidad === null || costo <= 0) return;

        this.lineasNuevas.update(lineas =>
            lineas.some(l => l.producto_id === productoId)
                ? lineas.map(l =>
                    l.producto_id === productoId
                        ? { ...l, cantidad: l.cantidad + cantidad, costo_unitario: costo }
                        : l
                )
                : [...lineas, { producto_id: productoId, cantidad, costo_unitario: costo }]
        );

        this.addProducto.set(null);
        this.addCantidad.set('1');
        this.addCosto.set('');
    }

    actualizarLineaNueva(
        productoId: number,
        campo: 'cantidad' | 'costo_unitario',
        value: string
    ): void {

        const valor = campo === 'cantidad'
            ? this.parsePositiveInteger(value)
            : this.parseAmount(value);

        if (campo === 'cantidad' && valor === null) return;

        this.lineasNuevas.update(lineas =>
            lineas.map(l => l.producto_id === productoId ? { ...l, [campo]: valor } : l)
        );
    }

    quitarLineaNueva(productoId: number): void {
        this.lineasNuevas.update(lineas => lineas.filter(l => l.producto_id !== productoId));
    }

    saveCompra(): void {

        if (!this.isFormValid() || this.saving()) return;

        const f = this.compraForm();
        const lineas = this.lineasNuevas();

        const dto: CreateCompras = {
            proveedor_id: f.proveedor_id as number,
            fecha: f.fecha,
            estado: 'PENDIENTE'
        };

        this.saving.set(true);
        this.errorMessage.set(null);

        this.comprasService
            .createCompra(dto)
            .pipe(
                switchMap(compra =>
                    forkJoin(
                        lineas.map(l =>
                            this.detalleCompraService.createDetalle({
                                compra_id: compra.compra_id,
                                producto_id: l.producto_id,
                                cantidad: l.cantidad,
                                costo_unitario: l.costo_unitario
                            })
                        )
                    ).pipe(map(() => compra))
                )
            )
            .subscribe({

                next: (compra) => {
                    this.saving.set(false);
                    this.createModalOpen.set(false);
                    this.selectedId.set(compra.compra_id);
                    this.loadData();
                },

                error: (error) => {
                    console.error('Error creando la compra:', error);
                    this.errorMessage.set(this.getErrorMessage(error, 'No se pudo crear la compra.'));
                    this.saving.set(false);
                    this.createModalOpen.set(false);
                    this.loadData();
                }
            });
    }


    /* ELIMINAR */
    puedeEliminar(compra: ComprasResponse | null): boolean {
        return !!compra && (this.aplicacionesPorCompra().get(compra.compra_id)?.length ?? 0) === 0;
    }

    openDelete(compra: ComprasResponse): void {
        if (this.loadingAny()) return;
        this.deleteTarget.set(compra);
    }

    closeDelete(): void {
        if (this.saving()) return;
        this.deleteTarget.set(null);
    }

    confirmDelete(): void {

        const compra = this.deleteTarget();

        if (!compra || this.saving() || !this.puedeEliminar(compra)) return;

        const lineas = this.lineasPorCompra().get(compra.compra_id) ?? [];

        this.saving.set(true);
        this.errorMessage.set(null);

        // El backend no deja borrar una compra con detalles: se quitan primero las líneas.
        // (forkJoin con un arreglo vacío no emite, por eso el of([]))
        const quitarLineas$ = lineas.length
            ? forkJoin(lineas.map(l => this.detalleCompraService.deleteDetalle(l.detalle_compra_id)))
            : of([]);

        quitarLineas$
            .pipe(switchMap(() => this.comprasService.deleteCompra(compra.compra_id)))
            .subscribe({

                next: () => {
                    this.saving.set(false);
                    this.deleteTarget.set(null);
                    if (this.selectedId() === compra.compra_id) this.selectedId.set(null);
                    this.loadData();
                },

                error: (error) => {
                    console.error('Error eliminando la compra:', error);
                    this.errorMessage.set(this.getErrorMessage(error, 'No se pudo eliminar la compra.'));
                    this.saving.set(false);
                    this.deleteTarget.set(null);
                    this.loadData();
                }
            });
    }


    /* AYUDAS */
    getEstado(estado: string | null | undefined): EstadoCompraInfo {
        const id = this.normalizeEstado(estado);
        return this.estados.find(e => e.id === id) ?? this.estados[0];
    }

    getLineas(compraId: number): DetalleCompraResponse[] {
        return this.lineasPorCompra().get(compraId) ?? [];
    }

    getTotalCompra(compraId: number): number {
        return this.sumarLineas(this.getLineas(compraId));
    }

    getAplicado(compraId: number): number {
        return this.roundAmount(
            (this.aplicacionesPorCompra().get(compraId) ?? [])
                .reduce((s, a) => s + this.toNumber(a.monto_aplicado), 0)
        );
    }

    getSaldo(compraId: number): number {
        return this.roundAmount(this.getTotalCompra(compraId) - this.getAplicado(compraId));
    }

    getProveedorNombre(proveedorId: number): string {
        return this.proveedoresMap().get(proveedorId)?.nombre_empresa ?? `Proveedor #${proveedorId}`;
    }

    getProductoNombre(productoId: number): string {
        return this.productosMap().get(productoId)?.nombre_producto ?? `Producto #${productoId}`;
    }

    getProductoCodigo(productoId: number): string {
        return this.productosMap().get(productoId)?.codigo ?? '—';
    }

    private contarEstado(estado: string): number {
        return this.compras().filter(c => this.normalizeEstado(c.estado) === estado).length;
    }

    private sumarLineas(lineas: DetalleCompraResponse[]): number {
        return this.roundAmount(
            lineas.reduce((s, l) => s + this.toNumber(l.cantidad) * this.toNumber(l.costo_unitario), 0)
        );
    }


    /* FORMATO */
    formatAmount(amount: number): string {
        return new Intl.NumberFormat('es-NI', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    formatDate(value: Date | string | null | undefined): string {

        const text = this.normalizeDate(value);
        if (!text) return '—';

        const [year, month, day] = text.split('-').map(Number);

        return new Intl.DateTimeFormat('es-NI', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(new Date(year, month - 1, day));
    }

    normalizeEstado(estado: string | null | undefined): string {
        return (estado ?? '').trim().toUpperCase();
    }

    private normalizeDate(value: Date | string | null | undefined): string {
        if (!value) return '';
        return typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10);
    }

    private toInputDate(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    private emptyForm(): CompraForm {
        return {
            proveedor_id: null,
            fecha: this.toInputDate(new Date())
        };
    }


    /* NÚMEROS */
    private toNumber(value: number | string | null | undefined): number {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    }

    private parsePositiveInteger(value: string | number | null | undefined): number | null {
        if (value === null || value === undefined || value === '') return null;
        const n = Number(value);
        return Number.isFinite(n) && Number.isInteger(n) && n >= 1 ? n : null;
    }

    private parseAmount(value: string | undefined): number {
        const n = Number(value);
        return Number.isFinite(n) && n >= 0 ? this.roundAmount(n) : 0;
    }

    private roundAmount(amount: number): number {
        return Math.round(amount * 100) / 100;
    }

    private getErrorMessage(error: any, fallback: string): string {
        const message = error?.error?.message;
        if (Array.isArray(message)) return message.join(' · ');
        return typeof message === 'string' && message ? message : fallback;
    }
}