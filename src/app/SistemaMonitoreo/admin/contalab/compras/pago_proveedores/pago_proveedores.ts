import {
    ChangeDetectionStrategy,
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    computed,
    inject,
    OnInit,
    signal
} from '@angular/core';

import { forkJoin, map, switchMap } from 'rxjs';

import {
    PagosProveedoresService,
    PagosProveedoresResponse,
    CreatePagosProveedores,
    UpdatePagosProveedores,
    EstadosPago
} from '../../../../../services/pagos_proveedores.service';

import {
    DetallePagoProveedorService,
    DetallePagoProveedorResponse
} from '../../../../../services/detalle_pago_proveedor.service';

import {
    ComprasService,
    ComprasResponse
} from '../../../../../services/compras.service';

import {
    DetalleCompraService,
    DetalleCompraResponse
} from '../../../../../services/detalle_compra.service';

import {
    ProveedoresService,
    ProveedoresResponse
} from '../../../../../services/proveedores.service';


interface EstadoPagoInfo {
    id: string;
    label: string;
    icon: string;
    chip: string;
}

interface PagoForm {
    proveedor_id: number | null;
    fecha_pago: string;
    metodo_pago: string;
    referencia: string;
    observaciones: string;
    estado: string;
}

interface DatosForm {
    referencia: string;
    observaciones: string;
    estado: string;
}


@Component({
    selector: 'app-pagos-proveedores',
    standalone: true,
    imports: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './pago_proveedores.html',
    changeDetection: ChangeDetectionStrategy.OnPush
    /*__STYLES__*/
})
export class PagosProveedoresComponent implements OnInit {

    private readonly pagosService = inject(PagosProveedoresService);
    private readonly aplicacionesService = inject(DetallePagoProveedorService);
    private readonly comprasService = inject(ComprasService);
    private readonly detalleCompraService = inject(DetalleCompraService);
    private readonly proveedoresService = inject(ProveedoresService);

    /* CONSTANTES */

    // AJUSTAR: debe coincidir con los valores de EstadosPago (estados-pago.enum.ts)
    readonly estados: EstadoPagoInfo[] = [
        {
            id: EstadosPago.REGISTRADO,
            label: 'Registrado',
            icon: 'lucide:clock',
            chip: 'bg-[#f8ecd5] text-[#8a5a12]'
        },
        {
            id: EstadosPago.APLICADO,
            label: 'Aplicado',
            icon: 'lucide:badge-check',
            chip: 'bg-[#dcefe2] text-[#2c5a3d]'
        },
        {
            id: EstadosPago.ANULADO,
            label: 'Anulado',
            icon: 'lucide:ban',
            chip: 'bg-[#f6e0e0] text-[#7d2c2c]'
        }
    ];

    // Coincide con MetodosDePago (metodos-de-pago.enum.ts)
    readonly metodos: { id: string; label: string; icon: string }[] = [
        { id: 'EFECTIVO', label: 'Efectivo', icon: 'lucide:banknote' },
        { id: 'TRANSFERENCIA', label: 'Transferencia', icon: 'lucide:landmark' },
        { id: 'TARJETA', label: 'Tarjeta', icon: 'lucide:credit-card' },
        { id: 'CHEQUE', label: 'Cheque', icon: 'lucide:file-text' },
        { id: 'OTRO', label: 'Otro', icon: 'lucide:ellipsis' }
    ];

    /* ESTADO */
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly loadingAny = computed(() => this.loading() || this.saving());
    readonly errorMessage = signal<string | null>(null);

    readonly searchTerm = signal('');
    readonly selectedId = signal<number | null>(null);

    /* DATOS */
    readonly pagos = signal<PagosProveedoresResponse[]>([]);
    readonly aplicaciones = signal<DetallePagoProveedorResponse[]>([]);
    readonly compras = signal<ComprasResponse[]>([]);
    readonly detallesCompra = signal<DetalleCompraResponse[]>([]);
    readonly proveedores = signal<ProveedoresResponse[]>([]);

    /* MODALES / EDICIÓN */
    readonly createModalOpen = signal(false);
    readonly deleteTarget = signal<PagosProveedoresResponse | null>(null);
    readonly pagoForm = signal<PagoForm>(this.emptyForm());
    // compra_id -> monto escrito (string porque viene del input)
    readonly montosNuevos = signal<Record<number, string>>({});

    readonly editandoDatos = signal(false);
    readonly datosForm = signal<DatosForm>({
        referencia: '',
        observaciones: '',
        estado: EstadosPago.REGISTRADO
    });

    readonly addCompra = signal<number | null>(null);
    readonly addMonto = signal('');

    /* MAPAS */
    readonly proveedoresMap = computed(() =>
        new Map(this.proveedores().map(p => [p.proveedor_id, p] as const))
    );

    readonly comprasMap = computed(() =>
        new Map(this.compras().map(c => [c.compra_id, c] as const))
    );

    readonly aplicacionesPorPago = computed(() => {
        const map = new Map<number, DetallePagoProveedorResponse[]>();
        for (const a of this.aplicaciones()) {
            const lista = map.get(a.pago_id) ?? [];
            lista.push(a);
            map.set(a.pago_id, lista);
        }
        return map;
    });

    readonly aplicadoPorCompra = computed(() => {
        const map = new Map<number, number>();
        for (const a of this.aplicaciones()) {
            map.set(a.compra_id, (map.get(a.compra_id) ?? 0) + this.toNumber(a.monto_aplicado));
        }
        return map;
    });

    readonly totalPorCompra = computed(() => {
        const map = new Map<number, number>();
        for (const d of this.detallesCompra()) {
            map.set(
                d.compra_id,
                (map.get(d.compra_id) ?? 0) + this.toNumber(d.cantidad) * this.toNumber(d.costo_unitario)
            );
        }
        return map;
    });

    readonly proveedoresActivos = computed(() => this.proveedores().filter(p => p.estado));

    /* FILTRO */
    readonly pagosFiltrados = computed(() => {

        const search = this.searchTerm().trim().toLowerCase();

        return this.pagos()
            .filter(p => {
                if (!search) return true;

                return [
                    String(p.pago_id),
                    this.getProveedorNombre(p.proveedor_id),
                    p.referencia ?? '',
                    this.getMetodoLabel(p.metodo_pago)
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(search);
            })
            .sort((a, b) => b.pago_id - a.pago_id);
    });

    /* INDICADORES */
    readonly totalPagos = computed(() => this.pagos().length);

    readonly totalAplicado = computed(() =>
        this.roundAmount(
            this.pagos()
                .filter(p => this.normalizeEstado(p.estado) !== 'ANULADO')
                .reduce((s, p) => s + this.getTotalPago(p.pago_id), 0)
        )
    );

    readonly totalSinAplicar = computed(() =>
        this.pagos().filter(p =>
            this.normalizeEstado(p.estado) !== 'ANULADO' &&
            (this.aplicacionesPorPago().get(p.pago_id)?.length ?? 0) === 0
        ).length
    );

    readonly totalMes = computed(() => {

        const prefijo = this.toInputDate(new Date()).slice(0, 7);

        return this.roundAmount(
            this.pagos()
                .filter(p =>
                    this.normalizeEstado(p.estado) !== 'ANULADO' &&
                    this.normalizeDate(p.fecha_pago).startsWith(prefijo)
                )
                .reduce((s, p) => s + this.getTotalPago(p.pago_id), 0)
        );
    });

    /* SELECCIONADO */
    readonly pagoSeleccionado = computed(() =>
        this.pagos().find(p => p.pago_id === this.selectedId()) ?? null
    );

    readonly aplicacionesSeleccionado = computed(() => {
        const pago = this.pagoSeleccionado();
        return pago
            ? [...(this.aplicacionesPorPago().get(pago.pago_id) ?? [])]
                .sort((a, b) => a.detalle_pago_id - b.detalle_pago_id)
            : [];
    });

    readonly totalSeleccionado = computed(() =>
        this.roundAmount(
            this.aplicacionesSeleccionado().reduce((s, a) => s + this.toNumber(a.monto_aplicado), 0)
        )
    );

    readonly aplicacionesEditables = computed(() => {
        const pago = this.pagoSeleccionado();
        return !!pago && this.normalizeEstado(pago.estado) !== 'ANULADO';
    });

    readonly comprasAbiertasSeleccionado = computed(() => {
        const pago = this.pagoSeleccionado();
        return pago ? this.comprasAbiertas(pago.proveedor_id) : [];
    });

    /* NUEVO PAGO */
    readonly comprasAbiertasNuevo = computed(() => {
        const id = this.pagoForm().proveedor_id;
        return id !== null ? this.comprasAbiertas(id) : [];
    });

    readonly totalNuevo = computed(() =>
        this.roundAmount(
            Object.values(this.montosNuevos()).reduce((s, v) => s + this.parseAmount(v), 0)
        )
    );

    readonly montosExcedidos = computed(() =>
        this.comprasAbiertasNuevo().some(c =>
            this.parseAmount(this.montosNuevos()[c.compra_id]) > this.getSaldoCompra(c.compra_id)
        )
    );

    readonly isFormValid = computed(() => {
        const f = this.pagoForm();
        return (
            f.proveedor_id !== null &&
            !!f.fecha_pago &&
            !!f.metodo_pago &&
            this.totalNuevo() > 0 &&
            !this.montosExcedidos()
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
            pagos: this.pagosService.getPagos(),
            aplicaciones: this.aplicacionesService.getDetalles(),
            compras: this.comprasService.getCompras(),
            detallesCompra: this.detalleCompraService.getDetalles(),
            proveedores: this.proveedoresService.getProveedores()
        }).subscribe({

            next: (datos) => {
                this.pagos.set(datos.pagos);
                this.aplicaciones.set(datos.aplicaciones);
                this.compras.set(datos.compras);
                this.detallesCompra.set(datos.detallesCompra);
                this.proveedores.set(datos.proveedores);

                const seleccionado = this.selectedId();
                if (seleccionado !== null && !datos.pagos.some(p => p.pago_id === seleccionado)) {
                    this.selectedId.set(null);
                }

                this.loading.set(false);
            },

            error: (error) => {
                console.error('Error cargando los pagos:', error);
                this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar los pagos.'));
                this.loading.set(false);
            }
        });
    }

    refreshData(): void {
        if (this.loadingAny()) return;
        this.loadData();
    }


    /* PANEL */
    openPago(pago: PagosProveedoresResponse): void {
        this.selectedId.set(pago.pago_id);
        this.editandoDatos.set(false);
        this.addCompra.set(null);
        this.addMonto.set('');
    }

    closePago(): void {
        this.selectedId.set(null);
        this.editandoDatos.set(false);
    }


    /* DATOS DEL PAGO */
    openEditDatos(): void {
        const pago = this.pagoSeleccionado();
        if (!pago) return;

        this.datosForm.set({
            referencia: pago.referencia ?? '',
            observaciones: pago.observaciones ?? '',
            estado: this.normalizeEstado(pago.estado)
        });

        this.editandoDatos.set(true);
    }

    cancelEditDatos(): void {
        this.editandoDatos.set(false);
    }

    updateDatos<K extends keyof DatosForm>(field: K, value: DatosForm[K]): void {
        this.datosForm.update(f => ({ ...f, [field]: value }));
    }

    saveDatos(): void {

        const pago = this.pagoSeleccionado();
        const f = this.datosForm();

        if (!pago || this.saving()) return;

        const dto: UpdatePagosProveedores = {
            referencia: f.referencia.trim(),
            observaciones: f.observaciones.trim(),
            estado: f.estado
        };

        this.saving.set(true);
        this.errorMessage.set(null);

        this.pagosService.updatePago(pago.pago_id, dto).subscribe({

            next: () => {
                this.saving.set(false);
                this.editandoDatos.set(false);
                this.loadData();
            },

            error: (error) => {
                console.error('Error actualizando el pago:', error);
                this.errorMessage.set(this.getErrorMessage(error, 'No se pudo actualizar el pago.'));
                this.saving.set(false);
            }
        });
    }


    /* APLICACIONES (PANEL) */
    onAddCompra(value: string): void {

        const id = value ? Number(value) : null;
        const compraId = id !== null && Number.isFinite(id) ? id : null;

        this.addCompra.set(compraId);
        this.addMonto.set(compraId !== null ? String(this.getSaldoCompra(compraId)) : '');
    }

    
    agregarAplicacion(): void {
        const pago = this.pagoSeleccionado();
        const compraId = this.addCompra();
        const monto = this.parseAmount(this.addMonto());

        if (
            !pago ||
            compraId === null ||
            monto <= 0 ||
            monto > this.getSaldoCompra(compraId) ||
            this.saving() ||
            !this.aplicacionesEditables()
        ) {
            return;
        }

        this.saving.set(true);
        this.errorMessage.set(null);

        this.aplicacionesService.createDetalle({
            pago_id: pago.pago_id,
            compra_id: compraId,
            monto_aplicado: monto
        }).subscribe({
            next: () => {
                this.saving.set(false);
                this.addCompra.set(null);
                this.addMonto.set('');
                this.loadData();
            },
            error: (error) => {
                console.error('Error aplicando el pago:', error);
                this.errorMessage.set(
                    this.getErrorMessage(
                        error,
                        'No se pudo aplicar el pago a la compra.'
                    )
                );
                this.saving.set(false);
            }
        });
    }

    actualizarAplicacion(aplicacion: DetallePagoProveedorResponse, input: HTMLInputElement): void {

        const monto = this.parseAmount(input.value);
        const actual = this.toNumber(aplicacion.monto_aplicado);

        // El máximo permitido es el saldo de la compra más lo que ya tenía aplicado
        const maximo = this.roundAmount(this.getSaldoCompra(aplicacion.compra_id) + actual);

        if (monto <= 0 || monto > maximo || monto === actual || this.saving() || !this.aplicacionesEditables()) {
            input.value = String(actual);
            return;
        }

        this.saving.set(true);
        this.errorMessage.set(null);

        this.aplicacionesService
            .updateDetalle(aplicacion.detalle_pago_id, { monto_aplicado: monto })
            .subscribe({

                next: () => {
                    this.saving.set(false);
                    this.loadData();
                },

                error: (error) => {
                    console.error('Error actualizando la aplicación:', error);
                    this.errorMessage.set(this.getErrorMessage(error, 'No se pudo actualizar el monto.'));
                    input.value = String(actual);
                    this.saving.set(false);
                }
            });
    }

    eliminarAplicacion(aplicacion: DetallePagoProveedorResponse): void {

        if (this.saving() || !this.aplicacionesEditables()) return;

        this.saving.set(true);
        this.errorMessage.set(null);

        this.aplicacionesService.deleteDetalle(aplicacion.detalle_pago_id).subscribe({

            next: () => {
                this.saving.set(false);
                this.loadData();
            },

            error: (error) => {
                console.error('Error quitando la aplicación:', error);
                this.errorMessage.set(this.getErrorMessage(error, 'No se pudo quitar la aplicación.'));
                this.saving.set(false);
            }
        });
    }


    /* NUEVO PAGO */
    openCreate(): void {
        if (this.loadingAny()) return;
        this.pagoForm.set(this.emptyForm());
        this.montosNuevos.set({});
        this.createModalOpen.set(true);
    }

    closeCreate(): void {
        if (this.saving()) return;
        this.createModalOpen.set(false);
    }

    updateForm<K extends keyof PagoForm>(field: K, value: PagoForm[K]): void {
        this.pagoForm.update(f => ({ ...f, [field]: value }));
    }

    onProveedorChange(value: string): void {
        this.updateForm('proveedor_id', value ? Number(value) : null);
        this.montosNuevos.set({});
    }

    setMonto(compraId: number, value: string): void {
        this.montosNuevos.update(m => ({ ...m, [compraId]: value }));
    }

    pagarSaldo(compraId: number): void {
        this.setMonto(compraId, String(this.getSaldoCompra(compraId)));
    }

    quitarMonto(compraId: number): void {
        this.setMonto(compraId, '');
    }

    savePago(): void {

        if (!this.isFormValid() || this.saving()) return;

        const f = this.pagoForm();

        const aplicaciones = this.comprasAbiertasNuevo()
            .map(c => ({
                compra_id: c.compra_id,
                monto_aplicado: this.parseAmount(this.montosNuevos()[c.compra_id])
            }))
            .filter(a => a.monto_aplicado > 0);

        if (!aplicaciones.length) return;

        // referencia y observaciones son @IsString() obligatorios en el DTO: se envían aunque estén vacíos
        const dto: CreatePagosProveedores = {
            proveedor_id: f.proveedor_id as number,
            fecha_pago: f.fecha_pago,
            metodo_pago: f.metodo_pago,
            referencia: f.referencia.trim(),
            observaciones: f.observaciones.trim(),
            estado: f.estado
        };

        this.saving.set(true);
        this.errorMessage.set(null);

        this.pagosService
            .createPago(dto)
            .pipe(
                switchMap(pago =>
                    forkJoin(
                        aplicaciones.map(a =>
                            this.aplicacionesService.createDetalle({
                                pago_id: pago.pago_id,
                                compra_id: a.compra_id,
                                monto_aplicado: a.monto_aplicado
                            })
                        )
                    ).pipe(map(() => pago))
                )
            )
            .subscribe({

                next: (pago) => {
                    this.saving.set(false);
                    this.createModalOpen.set(false);
                    this.selectedId.set(pago.pago_id);
                    this.loadData();
                },

                error: (error) => {
                    console.error('Error creando el pago:', error);
                    this.errorMessage.set(this.getErrorMessage(error, 'No se pudo registrar el pago.'));
                    this.saving.set(false);
                    this.createModalOpen.set(false);
                    this.loadData();
                }
            });
    }


    /* ELIMINAR */
    openDelete(pago: PagosProveedoresResponse): void {
        if (this.loadingAny()) return;
        this.deleteTarget.set(pago);
    }

    closeDelete(): void {
        if (this.saving()) return;
        this.deleteTarget.set(null);
    }

    confirmDelete(): void {

        const pago = this.deleteTarget();

        if (!pago || this.saving()) return;

        this.saving.set(true);
        this.errorMessage.set(null);

        // El backend elimina el pago con la función delete_pago_proveedores (rpc)
        this.pagosService.deletePago(pago.pago_id).subscribe({

            next: () => {
                this.saving.set(false);
                this.deleteTarget.set(null);
                if (this.selectedId() === pago.pago_id) this.selectedId.set(null);
                this.loadData();
            },

            error: (error) => {
                console.error('Error eliminando el pago:', error);
                this.errorMessage.set(this.getErrorMessage(error, 'No se pudo eliminar el pago.'));
                this.saving.set(false);
                this.deleteTarget.set(null);
            }
        });
    }


    /* AYUDAS */
    getEstado(estado: string | null | undefined): EstadoPagoInfo {
        const id = this.normalizeEstado(estado);
        return this.estados.find(e => e.id === id) ?? this.estados[0];
    }

    getMetodo(id: string | null | undefined) {
        const key = this.normalizeEstado(id);
        return this.metodos.find(m => m.id === key) ?? this.metodos[this.metodos.length - 1];
    }

    getMetodoLabel(id: string | null | undefined): string {
        return this.getMetodo(id).label;
    }

    getAplicaciones(pagoId: number): DetallePagoProveedorResponse[] {
        return this.aplicacionesPorPago().get(pagoId) ?? [];
    }

    getTotalPago(pagoId: number): number {
        return this.roundAmount(
            this.getAplicaciones(pagoId).reduce((s, a) => s + this.toNumber(a.monto_aplicado), 0)
        );
    }

    getTotalCompra(compraId: number): number {
        return this.roundAmount(this.totalPorCompra().get(compraId) ?? 0);
    }

    getSaldoCompra(compraId: number): number {
        return this.roundAmount(
            this.getTotalCompra(compraId) - (this.aplicadoPorCompra().get(compraId) ?? 0)
        );
    }

    getProveedorNombre(proveedorId: number): string {
        return this.proveedoresMap().get(proveedorId)?.nombre_empresa ?? `Proveedor #${proveedorId}`;
    }

    getCompraResumen(compraId: number): string {
        const compra = this.comprasMap().get(compraId);
        return compra ? `#${compraId} · ${this.formatDate(compra.fecha)}` : `#${compraId}`;
    }

    // Compras del proveedor que todavía tienen saldo
    private comprasAbiertas(proveedorId: number): ComprasResponse[] {
        return this.compras()
            .filter(c => {
                const estado = this.normalizeEstado(c.estado);
                return (
                    c.proveedor_id === proveedorId &&
                    estado !== 'ANULADA' &&
                    estado !== 'PAGADA' &&
                    this.getSaldoCompra(c.compra_id) > 0
                );
            })
            .sort((a, b) => a.compra_id - b.compra_id);
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

    private emptyForm(): PagoForm {
        return {
            proveedor_id: null,
            fecha_pago: this.toInputDate(new Date()),
            metodo_pago: 'EFECTIVO',
            referencia: '',
            observaciones: '',
            estado: EstadosPago.REGISTRADO
        };
    }


    /* NÚMEROS */
    private toNumber(value: number | string | null | undefined): number {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
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