import {
    ChangeDetectionStrategy,
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    computed,
    inject,
    OnInit,
    signal
} from '@angular/core';

import { forkJoin } from 'rxjs';

import {
    ProveedoresService,
    ProveedoresResponse,
    CreateProveedores,
    UpdateProveedores
} from '../../../../../services/proveedores.service';

import {
    ComprasService,
    ComprasResponse
} from '../../../../../services/compras.service';

import {
    PagosProveedoresService,
    PagosProveedoresResponse
} from '../../../../../services/pagos_proveedores.service';


type FiltroEstado = 'todos' | 'activos' | 'inactivos';

interface ProveedorForm {
    nombre_empresa: string;
    ruc: string;
    telefono: string;
    correo: string;
    direccion: string;
    estado: boolean;
}


@Component({
    selector: 'app-proveedores',
    standalone: true,
    imports: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './proveedores.html',
    changeDetection: ChangeDetectionStrategy.OnPush
    /*__STYLES__*/
})
export class ProveedoresComponent implements OnInit {

    private readonly proveedoresService = inject(ProveedoresService);
    private readonly comprasService = inject(ComprasService);
    private readonly pagosService = inject(PagosProveedoresService);

    /* ESTADO */
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly loadingAny = computed(() => this.loading() || this.saving());
    readonly errorMessage = signal<string | null>(null);

    readonly searchTerm = signal('');
    readonly filtro = signal<FiltroEstado>('todos');

    /* DATOS */
    readonly proveedores = signal<ProveedoresResponse[]>([]);
    readonly compras = signal<ComprasResponse[]>([]);
    readonly pagos = signal<PagosProveedoresResponse[]>([]);

    /* MODALES */
    readonly modalOpen = signal(false);
    readonly editingId = signal<number | null>(null);
    readonly form = signal<ProveedorForm>(this.emptyForm());
    readonly deleteTarget = signal<ProveedoresResponse | null>(null);

    /* MAPAS */
    readonly comprasPorProveedor = computed(() =>
        this.contar(this.compras().map(c => c.proveedor_id))
    );

    readonly pagosPorProveedor = computed(() =>
        this.contar(this.pagos().map(p => p.proveedor_id))
    );

    /* INDICADORES */
    readonly totalProveedores = computed(() => this.proveedores().length);
    readonly totalActivos = computed(() => this.proveedores().filter(p => p.estado).length);
    readonly totalInactivos = computed(() => this.proveedores().filter(p => !p.estado).length);
    readonly totalConCompras = computed(() =>
        this.proveedores().filter(p => (this.comprasPorProveedor().get(p.proveedor_id) ?? 0) > 0).length
    );

    /* FILTRO */
    readonly filtrados = computed(() => {

        const search = this.searchTerm().trim().toLowerCase();
        const filtro = this.filtro();

        return this.proveedores()
            .filter(p => {
                if (filtro === 'activos' && !p.estado) return false;
                if (filtro === 'inactivos' && p.estado) return false;
                if (!search) return true;

                return [p.nombre_empresa, p.ruc, p.telefono, p.correo, p.direccion]
                    .join(' ')
                    .toLowerCase()
                    .includes(search);
            })
            .sort((a, b) => a.nombre_empresa.localeCompare(b.nombre_empresa));
    });

    /* VALIDACIÓN */
    readonly rucInvalido = computed(() => {
        return !/^\d{14}$/.test(this.form().ruc.trim());
    });
    
    readonly correoInvalido = computed(() => {
        const correo = this.form().correo.trim();
        return !!correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
    });

    readonly telefonoInvalido = computed(() => {
        const tel = this.form().telefono.trim();
        // El backend usa @IsPhoneNumber() sin región: exige formato internacional (+505...)
        return !!tel && !/^\+\d{8,15}$/.test(tel.replace(/[\s-]/g, ''));
    });

    readonly isFormValid = computed(() => {
        const f = this.form();

        return (
            !!f.nombre_empresa.trim() &&
            !this.rucInvalido() &&
            !!f.telefono.trim() &&
            !!f.correo.trim() &&
            !!f.direccion.trim() &&
            !this.correoInvalido() &&
            !this.telefonoInvalido()
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
            proveedores: this.proveedoresService.getProveedores(),
            compras: this.comprasService.getCompras(),
            pagos: this.pagosService.getPagos()
        }).subscribe({

            next: (datos) => {
                this.proveedores.set(datos.proveedores);
                this.compras.set(datos.compras);
                this.pagos.set(datos.pagos);
                this.loading.set(false);
            },

            error: (error) => {
                console.error('Error cargando proveedores:', error);
                this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar los proveedores.'));
                this.loading.set(false);
            }
        });
    }

    refreshData(): void {
        if (this.loadingAny()) return;
        this.loadData();
    }


    /* CREAR / EDITAR */
    openCreate(): void {
        if (this.loadingAny()) return;
        this.editingId.set(null);
        this.form.set(this.emptyForm());
        this.modalOpen.set(true);
    }

    openEdit(proveedor: ProveedoresResponse): void {
        if (this.loadingAny()) return;
        this.editingId.set(proveedor.proveedor_id);
        this.form.set({
            nombre_empresa: proveedor.nombre_empresa,
            ruc: proveedor.ruc,
            telefono: proveedor.telefono,
            correo: proveedor.correo,
            direccion: proveedor.direccion,
            estado: proveedor.estado
        });
        this.modalOpen.set(true);
    }

    closeModal(): void {
        if (this.saving()) return;
        this.modalOpen.set(false);
    }

    updateForm<K extends keyof ProveedorForm>(field: K, value: ProveedorForm[K]): void {
        this.form.update(f => ({ ...f, [field]: value }));
    }

    save(): void {

        if (!this.isFormValid() || this.saving()) return;

        const f = this.form();

        const dto: CreateProveedores = {
            nombre_empresa: f.nombre_empresa.trim(),
            ruc: f.ruc.trim(),
            telefono: f.telefono.replace(/[\s-]/g, ''),
            correo: f.correo.trim(),
            direccion: f.direccion.trim(),
            estado: f.estado
        };

        const id = this.editingId();

        this.saving.set(true);
        this.errorMessage.set(null);

        const peticion$ = id === null
            ? this.proveedoresService.createProveedor(dto)
            : this.proveedoresService.updateProveedor(id, dto as UpdateProveedores);

        peticion$.subscribe({

            next: () => {
                this.saving.set(false);
                this.modalOpen.set(false);
                this.loadData();
            },

            error: (error) => {
                console.error('Error guardando el proveedor:', error);
                this.errorMessage.set(this.getErrorMessage(error, 'No se pudo guardar el proveedor.'));
                this.saving.set(false);
                this.modalOpen.set(false);
            }
        });
    }

    toggleEstado(proveedor: ProveedoresResponse): void {

        if (this.loadingAny()) return;

        this.saving.set(true);
        this.errorMessage.set(null);

        this.proveedoresService
            .updateProveedor(proveedor.proveedor_id, { estado: !proveedor.estado })
            .subscribe({

                next: () => {
                    this.saving.set(false);
                    this.loadData();
                },

                error: (error) => {
                    console.error('Error cambiando el estado:', error);
                    this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cambiar el estado.'));
                    this.saving.set(false);
                }
            });
    }


    /* ELIMINAR */
    puedeEliminar(proveedor: ProveedoresResponse | null): boolean {
        return !!proveedor
            && this.getTotalCompras(proveedor.proveedor_id) === 0
            && this.getTotalPagos(proveedor.proveedor_id) === 0;
    }

    openDelete(proveedor: ProveedoresResponse): void {
        if (this.loadingAny()) return;
        this.deleteTarget.set(proveedor);
    }

    closeDelete(): void {
        if (this.saving()) return;
        this.deleteTarget.set(null);
    }

    confirmDelete(): void {

        const proveedor = this.deleteTarget();

        if (!proveedor || this.saving() || !this.puedeEliminar(proveedor)) return;

        this.saving.set(true);
        this.errorMessage.set(null);

        this.proveedoresService.deleteProveedor(proveedor.proveedor_id).subscribe({

            next: () => {
                this.saving.set(false);
                this.deleteTarget.set(null);
                this.loadData();
            },

            error: (error) => {
                console.error('Error eliminando el proveedor:', error);
                this.errorMessage.set(this.getErrorMessage(error, 'No se pudo eliminar el proveedor.'));
                this.saving.set(false);
                this.deleteTarget.set(null);
            }
        });
    }


    /* AYUDAS */
    getTotalCompras(proveedorId: number): number {
        return this.comprasPorProveedor().get(proveedorId) ?? 0;
    }

    getTotalPagos(proveedorId: number): number {
        return this.pagosPorProveedor().get(proveedorId) ?? 0;
    }

    getIniciales(nombre: string): string {
        return nombre
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(p => p.charAt(0).toUpperCase())
            .join('');
    }

    private contar(ids: number[]): Map<number, number> {
        const map = new Map<number, number>();
        for (const id of ids) {
            map.set(id, (map.get(id) ?? 0) + 1);
        }
        return map;
    }

    private emptyForm(): ProveedorForm {
        return {
            nombre_empresa: '',
            ruc: '',
            telefono: '',
            correo: '',
            direccion: '',
            estado: true
        };
    }

    private getErrorMessage(error: any, fallback: string): string {
        const message = error?.error?.message;
        if (Array.isArray(message)) return message.join(' · ');
        return typeof message === 'string' && message ? message : fallback;
    }
}