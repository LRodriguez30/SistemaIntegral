import { CommonModule } from '@angular/common';
import {
    Component,
    computed,
    CUSTOM_ELEMENTS_SCHEMA,
    inject,
    OnInit,
    signal
} from '@angular/core';

import {
    MatFormFieldModule
} from '@angular/material/form-field';

import {
    MatSelectModule
} from '@angular/material/select';

import {
    CreateProductos,
    ProductosResponse,
    ProductosService,
    UpdateProductos
} from '../../../../../services/productos.service';

import {
    CategoriaProductosResponse,
    CategoriaProductosService,
    CreateCategoriaProductos,
    UpdateCategoriaProductos
} from '../../../../../services/categoria_productos.service';

@Component({
    selector: 'app-productos',
    standalone: true,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [
        CommonModule,
        MatFormFieldModule,
        MatSelectModule
    ],
    templateUrl: './productos.html',
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
export class ProductosComponent implements OnInit {

    private readonly productosService =
        inject(ProductosService);

    private readonly categoriaProductosService =
        inject(CategoriaProductosService);

    // =========================================================
    // ESTADO PRINCIPAL
    // =========================================================

    productos = signal<ProductosResponse[]>([]);

    categorias = signal<CategoriaProductosResponse[]>([]);

    loading = signal(false);

    loadingCategorias = signal(false);

    saving = signal(false);

    savingCategoria = signal(false);

    errorMessage = signal('');

    searchTerm = signal('');

    // =========================================================
    // MODAL PRODUCTOS
    // =========================================================

    modalOpen = signal(false);

    deleteModalOpen = signal(false);

    editingProducto =
        signal<ProductosResponse | null>(null);

    deleteTarget =
        signal<ProductosResponse | null>(null);

    // =========================================================
    // MODAL CATEGORÍAS
    // =========================================================

    categoriasModalOpen = signal(false);

    categoriaModalOpen = signal(false);

    deleteCategoriaModalOpen = signal(false);

    editingCategoria =
        signal<CategoriaProductosResponse | null>(null);

    deleteCategoriaTarget =
        signal<CategoriaProductosResponse | null>(null);

    categoriaForm = signal<CreateCategoriaProductos>({
        nombre_categoria: ''
    });

    // =========================================================
    // FORMULARIO PRODUCTO
    // =========================================================

    form = signal<CreateProductos>({
        codigo: '',
        nombre_producto: '',
        descripcion: '',
        precio_venta: 0,
        costo_unitario: 0,
        categoria_id: 0,
        estado: true
    });

    // =========================================================
    // DATOS CALCULADOS
    // =========================================================

    productosFiltrados = computed(() => {

        const term = this.searchTerm()
            .trim()
            .toLowerCase();

        const productos = this.productos();

        if (!term) {
            return productos;
        }

        return productos.filter(producto => {

            const categoria =
                this.getCategoriaNombre(
                    producto.categoria_id
                ).toLowerCase();

            return (
                producto.codigo
                    .toLowerCase()
                    .includes(term) ||

                producto.nombre_producto
                    .toLowerCase()
                    .includes(term) ||

                (producto.descripcion ?? '')
                    .toLowerCase()
                    .includes(term) ||

                categoria.includes(term) ||

                String(producto.categoria_id)
                    .includes(term)
            );

        });

    });

    totalProductos = computed(() =>
        this.productos().length
    );

    productosActivos = computed(() =>
        this.productos()
            .filter(producto => producto.estado)
    );

    productosInactivos = computed(() =>
        this.productos()
            .filter(producto => !producto.estado)
    );

    totalCategorias = computed(() =>
        this.categorias().length
    );

    valorCostos = computed(() =>
        this.productos().reduce(
            (total, producto) =>
                total +
                Number(producto.costo_unitario || 0),
            0
        )
    );

    readonly codigoProductoValido = computed(() => {
        return /^PROD-\d{6}$/.test(this.form().codigo.trim());
    });

    readonly siguienteCodigoProducto = computed(() => {
        const productos = this.productos();

        if (productos.length === 0) {
            return 'PROD-000001';
        }

        const numeros = productos
            .map(producto => {
                const match = producto.codigo.match(/^PROD-(\d{6})$/);

                return match
                    ? Number(match[1])
                    : 0;
            })
            .filter(numero => numero > 0);

        const siguiente = Math.max(...numeros, 0) + 1;

        return `PROD-${String(siguiente).padStart(6, '0')}`;
    });

    codigoProductoDisponible = computed(() => {
        const codigo = this.form().codigo.trim();

        if (!codigo) {
            return false;
        }

        return !this.productos().some(
            producto => producto.codigo === codigo
        );
    });

    // =========================================================
    // INICIALIZACIÓN
    // =========================================================

    ngOnInit(): void {

        this.loadProductos();

        this.loadCategorias();

    }

    // =========================================================
    // PRODUCTOS
    // =========================================================

    loadProductos(): void {

        this.loading.set(true);

        this.errorMessage.set('');

        this.productosService
            .getProductos()
            .subscribe({

                next: productos => {

                    this.productos.set(productos);

                    this.loading.set(false);

                },

                error: error => {

                    console.error(
                        'Error cargando productos:',
                        error
                    );

                    this.errorMessage.set(
                        'No fue posible cargar los productos.'
                    );

                    this.loading.set(false);

                }

            });

    }

    // =========================================================
    // CATEGORÍAS
    // =========================================================

    loadCategorias(): void {

        this.loadingCategorias.set(true);

        this.categoriaProductosService
            .getCategorias()
            .subscribe({

                next: categorias => {

                    this.categorias.set(categorias);

                    if (
                        categorias.length > 0 &&
                        this.form().categoria_id === 0
                    ) {
                        this.form.update(current => ({
                            ...current,
                            categoria_id: categorias[0].categoria_id
                        }));
                    }

                    this.loadingCategorias.set(false);

                },

                error: error => {

                    console.error(
                        'Error cargando categorías:',
                        error
                    );

                    this.errorMessage.set(
                        'No fue posible cargar las categorías de productos.'
                    );

                    this.loadingCategorias.set(false);

                }

            });

    }

    refreshData(): void {

        this.loadProductos();

        this.loadCategorias();

    }

    // =========================================================
    // CREAR PRODUCTO
    // =========================================================

    openCreateProducto(): void {

        this.editingProducto.set(null);

        const categorias = this.categorias();

        this.form.set({
            codigo: this.siguienteCodigoProducto(),
            nombre_producto: '',
            descripcion: '',
            precio_venta: 0,
            costo_unitario: 0,
            categoria_id:
            categorias.length > 0
                ? categorias[0].categoria_id
                : 0,
            estado: true
        });

        this.errorMessage.set('');

        this.modalOpen.set(true);

    }

    // =========================================================
    // EDITAR PRODUCTO
    // =========================================================

    openEditProducto(
        producto: ProductosResponse
    ): void {

        this.editingProducto.set(producto);

        this.form.set({

            codigo:
                producto.codigo,

            nombre_producto:
                producto.nombre_producto,

            descripcion:
                producto.descripcion ?? '',

            precio_venta:
                Number(producto.precio_venta),

            costo_unitario:
                Number(producto.costo_unitario),

            categoria_id:
                producto.categoria_id,

            estado:
                producto.estado

        });

        this.errorMessage.set('');

        this.modalOpen.set(true);

    }

    // =========================================================
    // CERRAR MODAL PRODUCTO
    // =========================================================

    closeModal(): void {

        if (this.saving()) {
            return;
        }

        this.modalOpen.set(false);

        this.editingProducto.set(null);

    }

    // =========================================================
    // FORMULARIO PRODUCTO
    // =========================================================

    updateForm(
        field: keyof CreateProductos,
        value: string | number | boolean
    ): void {

        this.form.update(current => ({

            ...current,

            [field]: value

        }));

    }

    updateNumberField(
        field:
            | 'precio_venta'
            | 'costo_unitario',
        value: string | number
    ): void {

        const numberValue = Number(value);

        this.form.update(current => ({

            ...current,

            [field]:
                Number.isFinite(numberValue)
                    ? numberValue
                    : 0

        }));

    }

    toggleEstado(): void {

        this.form.update(current => ({

            ...current,

            estado: !current.estado

        }));

    }

    // =========================================================
    // VALIDACIÓN PRODUCTO
    // =========================================================

    isFormValid(): boolean {

        const form = this.form();

        return (
            this.codigoProductoValido() &&

            this.codigoProductoDisponible() &&

            form.nombre_producto
                .trim()
                .length > 0 &&

            Number(form.precio_venta) >= 0 &&

            Number(form.costo_unitario) >= 0 &&

            Number(form.categoria_id) > 0

        );

    }

    // =========================================================
    // GUARDAR PRODUCTO
    // =========================================================

    saveProducto(): void {

        if (
            !this.isFormValid() ||
            this.saving()
        ) {
            return;
        }

        this.saving.set(true);

        this.errorMessage.set('');

        const current =
            this.editingProducto();

        // =====================================================
        // ACTUALIZAR
        // =====================================================

        if (current) {

            const dto: UpdateProductos = {

                codigo:
                    this.form()
                        .codigo
                        .trim(),

                nombre_producto:
                    this.form()
                        .nombre_producto
                        .trim(),

                descripcion:
                    this.form()
                        .descripcion
                        ?.trim(),

                precio_venta:
                    Number(
                        this.form()
                            .precio_venta
                    ),

                costo_unitario:
                    Number(
                        this.form()
                            .costo_unitario
                    ),

                categoria_id:
                    Number(
                        this.form()
                            .categoria_id
                    ),

                estado:
                    this.form()
                        .estado

            };

            this.productosService
                .updateProducto(
                    current.producto_id,
                    dto
                )
                .subscribe({

                    next: producto => {

                        this.productos.update(
                            productos =>

                                productos.map(
                                    item =>

                                        item.producto_id ===
                                        producto.producto_id

                                            ? producto
                                            : item
                                )

                        );

                        this.saving.set(false);

                        this.modalOpen.set(false);

                        this.editingProducto.set(null);

                    },

                    error: error => {

                        console.error(
                            'Error actualizando producto:',
                            error
                        );

                        this.errorMessage.set(
                            'No fue posible actualizar el producto.'
                        );

                        this.saving.set(false);

                    }

                });

            return;

        }

        // =====================================================
        // CREAR
        // =====================================================

        const dto: CreateProductos = {

            codigo:
                this.form()
                    .codigo
                    .trim(),

            nombre_producto:
                this.form()
                    .nombre_producto
                    .trim(),

            descripcion:
                this.form()
                    .descripcion
                    ?.trim(),

            precio_venta:
                Number(
                    this.form()
                        .precio_venta
                ),

            costo_unitario:
                Number(
                    this.form()
                        .costo_unitario
                ),

            categoria_id:
                Number(
                    this.form()
                        .categoria_id
                ),

            estado:
                this.form()
                    .estado

        };

        this.productosService
            .createProducto(dto)
            .subscribe({

                next: producto => {

                    this.productos.update(
                        productos => [
                            producto,
                            ...productos
                        ]
                    );

                    this.saving.set(false);

                    this.modalOpen.set(false);

                },

                error: error => {

                    console.error(
                        'Error creando producto:',
                        error
                    );

                    this.errorMessage.set(
                        'No fue posible crear el producto.'
                    );

                    this.saving.set(false);

                }

            });

    }

    // =========================================================
    // ELIMINAR PRODUCTO
    // =========================================================

    openDeleteProducto(
        producto: ProductosResponse
    ): void {

        this.deleteTarget.set(producto);

        this.deleteModalOpen.set(true);

    }

    closeDeleteProducto(): void {

        if (this.saving()) {
            return;
        }

        this.deleteModalOpen.set(false);

        this.deleteTarget.set(null);

    }

    confirmDeleteProducto(): void {

        const producto =
            this.deleteTarget();

        if (
            !producto ||
            this.saving()
        ) {
            return;
        }

        this.saving.set(true);

        this.productosService
            .deleteProducto(
                producto.producto_id
            )
            .subscribe({

                next: () => {

                    this.productos.update(
                        productos =>

                            productos.filter(
                                item =>
                                    item.producto_id !==
                                    producto.producto_id
                            )

                    );

                    this.saving.set(false);

                    this.deleteModalOpen.set(false);

                    this.deleteTarget.set(null);

                },

                error: error => {

                    console.error(
                        'Error eliminando producto:',
                        error
                    );

                    this.errorMessage.set(
                        'No fue posible eliminar el producto.'
                    );

                    this.saving.set(false);

                }

            });

    }

    // =========================================================
    // CATEGORÍAS
    // =========================================================

    openCategorias(): void {

        this.errorMessage.set('');

        this.loadCategorias();

        this.categoriasModalOpen.set(true);

    }

    closeCategorias(): void {

        if (this.savingCategoria()) {
            return;
        }

        this.categoriasModalOpen.set(false);

    }

    // =========================================================
    // CREAR / EDITAR CATEGORÍA
    // =========================================================

    openCreateCategoria(): void {

        this.editingCategoria.set(null);

        this.categoriaForm.set({
            nombre_categoria: ''
        });

        this.errorMessage.set('');

        this.categoriaModalOpen.set(true);

    }

    openEditCategoria(
        categoria: CategoriaProductosResponse
    ): void {

        this.editingCategoria.set(categoria);

        this.categoriaForm.set({

            nombre_categoria:
                categoria.nombre_categoria

        });

        this.errorMessage.set('');

        this.categoriaModalOpen.set(true);

    }

    closeCategoriaModal(): void {

        if (this.savingCategoria()) {
            return;
        }

        this.categoriaModalOpen.set(false);

        this.editingCategoria.set(null);

    }

    updateCategoriaForm(
        value: string
    ): void {

        this.categoriaForm.update(
            current => ({

                ...current,

                nombre_categoria: value

            })
        );

    }

    isCategoriaFormValid(): boolean {

        return this.categoriaForm()
            .nombre_categoria
            .trim()
            .length > 0;

    }

    // =========================================================
    // GUARDAR CATEGORÍA
    // =========================================================

    saveCategoria(): void {

        if (
            !this.isCategoriaFormValid() ||
            this.savingCategoria()
        ) {
            return;
        }

        this.savingCategoria.set(true);

        this.errorMessage.set('');

        const current =
            this.editingCategoria();

        // =====================================================
        // ACTUALIZAR CATEGORÍA
        // =====================================================

        if (current) {

            const dto: UpdateCategoriaProductos = {

                nombre_categoria:
                    this.categoriaForm()
                        .nombre_categoria
                        .trim()

            };

            this.categoriaProductosService
                .updateCategoria(
                    current.categoria_id,
                    dto
                )
                .subscribe({

                    next: categoria => {

                        this.categorias.update(
                            categorias =>

                                categorias.map(
                                    item =>

                                        item.categoria_id ===
                                        categoria.categoria_id

                                            ? categoria
                                            : item
                                )

                        );

                        this.savingCategoria.set(false);

                        this.categoriaModalOpen.set(false);

                        this.editingCategoria.set(null);

                    },

                    error: error => {

                        console.error(
                            'Error actualizando categoría:',
                            error
                        );

                        this.errorMessage.set(
                            'No fue posible actualizar la categoría.'
                        );

                        this.savingCategoria.set(false);

                    }

                });

            return;

        }

        // =====================================================
        // CREAR CATEGORÍA
        // =====================================================

        const dto: CreateCategoriaProductos = {

            nombre_categoria:
                this.categoriaForm()
                    .nombre_categoria
                    .trim()

        };

        this.categoriaProductosService
            .createCategoria(dto)
            .subscribe({

                next: categoria => {

                    this.categorias.update(
                        categorias => [
                            ...categorias,
                            categoria
                        ]
                    );

                    this.savingCategoria.set(false);

                    this.categoriaModalOpen.set(false);

                },

                error: error => {

                    console.error(
                        'Error creando categoría:',
                        error
                    );

                    this.errorMessage.set(
                        'No fue posible crear la categoría.'
                    );

                    this.savingCategoria.set(false);

                }

            });

    }

    // =========================================================
    // ELIMINAR CATEGORÍA
    // =========================================================

    openDeleteCategoria(
        categoria: CategoriaProductosResponse
    ): void {

        this.deleteCategoriaTarget.set(categoria);

        this.deleteCategoriaModalOpen.set(true);

    }

    closeDeleteCategoria(): void {

        if (this.savingCategoria()) {
            return;
        }

        this.deleteCategoriaModalOpen.set(false);

        this.deleteCategoriaTarget.set(null);

    }

    confirmDeleteCategoria(): void {

        const categoria =
            this.deleteCategoriaTarget();

        if (
            !categoria ||
            this.savingCategoria()
        ) {
            return;
        }

        this.savingCategoria.set(true);

        this.categoriaProductosService
            .deleteCategoria(
                categoria.categoria_id
            )
            .subscribe({

                next: () => {

                    this.categorias.update(
                        categorias =>

                            categorias.filter(
                                item =>
                                    item.categoria_id !==
                                    categoria.categoria_id
                            )

                    );

                    this.savingCategoria.set(false);

                    this.deleteCategoriaModalOpen.set(false);

                    this.deleteCategoriaTarget.set(null);

                },

                error: error => {

                    console.error(
                        'Error eliminando categoría:',
                        error
                    );

                    this.errorMessage.set(
                        'No fue posible eliminar la categoría.'
                    );

                    this.savingCategoria.set(false);

                }

            });

    }

    // =========================================================
    // UTILIDADES
    // =========================================================

    getCategoriaNombre(
        categoriaId: number
    ): string {

        const categoria =
            this.categorias().find(
                categoria =>
                    categoria.categoria_id ===
                    categoriaId
            );

        return (
            categoria?.nombre_categoria ??
            'Sin categoría'
        );

    }

    formatAmount(
        value: number
    ): string {

        return new Intl.NumberFormat(
            'es-NI',
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        ).format(
            Number(value) || 0
        );

    }

    getMargen(
        producto: ProductosResponse
    ): number {

        const precio =
            Number(
                producto.precio_venta
            );

        const costo =
            Number(
                producto.costo_unitario
            );

        if (precio <= 0) {
            return 0;
        }

        return (
            ((precio - costo) / precio) *
            100
        );

    }

    getGanancia(
        producto: ProductosResponse
    ): number {

        return (
            Number(
                producto.precio_venta
            ) -

            Number(
                producto.costo_unitario
            )
        );

    }

}