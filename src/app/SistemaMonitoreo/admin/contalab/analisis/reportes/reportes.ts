import {
    ChangeDetectionStrategy,
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    computed,
    inject,
    OnInit,
    signal
} from '@angular/core';

import { catchError, concatMap, from, map, Observable, of } from 'rxjs';

import {
    AnalisisData,
    AnalisisDataService,
    Filtro,
    REPORTES,
    ReportDef
} from '../services/analisis_data.service';

import { AnalisisExportService } from '../services/analisis_export.service';
import { ReportViewerComponent } from './report_viewer/report_viewer';

import { ProveedoresService } from '../../../../../services/proveedores.service';
import { ClientesService } from '../../../../../services/clientes.service';
import { ProductosService } from '../../../../../services/productos.service';
import { CatalogoCuentasService, TipoCuenta, Naturaleza } from '../../../../../services/catalogo_cuentas.service';


/* =============================================================
   IMPORTACIÓN: DEFINICIÓN DE CONJUNTOS DE DATOS
   ============================================================= */

type DatasetId = 'proveedores' | 'clientes' | 'productos' | 'cuentas';

interface ImportField {
    key: string;
    label: string;
    required?: boolean;
    aliases?: string[];
    example: string | number;
}

interface ImportDataset {
    id: DatasetId;
    label: string;
    descripcion: string;
    icon: string;
    fields: ImportField[];
}

interface ImportRow {
    line: number;
    value: any | null;
    error: string | null;
    status: 'pendiente' | 'ok' | 'error';
    message: string;
    resumen: string;
}

const DATASETS: ImportDataset[] = [
    {
        id: 'proveedores', label: 'Proveedores', icon: 'lucide:truck',
        descripcion: 'Empresas a las que compras.',
        fields: [
            { key: 'nombre_empresa', label: 'Empresa', required: true, aliases: ['empresa', 'nombre', 'razon_social'], example: 'Distribuidora Central S.A.' },
            { key: 'ruc', label: 'RUC', required: true, example: 'J0310000000001' },
            { key: 'telefono', label: 'Teléfono', required: true, aliases: ['tel'], example: '+50588888888' },
            { key: 'correo', label: 'Correo', required: true, aliases: ['email', 'correo_electronico'], example: 'ventas@empresa.com' },
            { key: 'direccion', label: 'Dirección', required: true, example: 'Managua, Nicaragua' },
            { key: 'estado', label: 'Activo (sí/no)', aliases: ['activo'], example: 'si' }
        ]
    },
    {
        id: 'clientes', label: 'Clientes', icon: 'lucide:users-round',
        descripcion: 'Personas o empresas a las que vendes.',
        fields: [
            { key: 'nombre_cliente', label: 'Nombre', required: true, aliases: ['nombre'], example: 'María' },
            { key: 'apellido_cliente', label: 'Apellido', required: true, aliases: ['apellido'], example: 'López' },
            { key: 'direccion_cliente', label: 'Dirección', required: true, aliases: ['direccion'], example: 'Masaya, Nicaragua' },
            { key: 'correo_cliente', label: 'Correo', required: true, aliases: ['correo', 'email'], example: 'maria@correo.com' },
            { key: 'telefono_cliente', label: 'Teléfono', aliases: ['telefono'], example: '+50587777777' },
            { key: 'nombre_empresa', label: 'Empresa', aliases: ['empresa'], example: '' },
            { key: 'ruc', label: 'RUC', example: '' },
            { key: 'fecha_registro_cl', label: 'Fecha de registro', aliases: ['fecha_registro'], example: '2026-01-15' },
            { key: 'activo', label: 'Activo (sí/no)', aliases: ['estado'], example: 'si' }
        ]
    },
    {
        id: 'productos', label: 'Productos', icon: 'lucide:package',
        descripcion: 'Catálogo de productos con precio y costo.',
        fields: [
            { key: 'codigo', label: 'Código', required: true, example: 'PRD-001' },
            { key: 'nombre_producto', label: 'Producto', required: true, aliases: ['nombre', 'producto'], example: 'Zapato clásico' },
            { key: 'descripcion', label: 'Descripción', example: '' },
            { key: 'precio_venta', label: 'Precio de venta', required: true, aliases: ['precio'], example: 850 },
            { key: 'costo_unitario', label: 'Costo unitario', required: true, aliases: ['costo'], example: 520 },
            { key: 'categoria', label: 'Categoría (nombre o id)', required: true, aliases: ['categoria_id', 'nombre_categoria'], example: 'Calzado' },
            { key: 'estado', label: 'Activo (sí/no)', aliases: ['activo'], example: 'si' }
        ]
    },
    {
        id: 'cuentas', label: 'Catálogo de cuentas', icon: 'lucide:folder-tree',
        descripcion: 'Cuentas contables; el padre se enlaza por código.',
        fields: [
            { key: 'codigo_cuenta', label: 'Código', required: true, aliases: ['codigo'], example: '1.1.01' },
            { key: 'nombre_cuenta', label: 'Nombre', required: true, aliases: ['nombre', 'cuenta'], example: 'Caja general' },
            { key: 'tipo_cuenta', label: 'Tipo', aliases: ['tipo'], example: 'ACTIVO' },
            { key: 'naturaleza', label: 'Naturaleza', example: 'DEUDORA' },
            { key: 'cuenta_padre', label: 'Código de cuenta padre', aliases: ['padre', 'codigo_padre'], example: '1.1' },
            { key: 'permite_movimiento', label: 'Permite movimiento', aliases: ['movimiento'], example: 'si' },
            { key: 'estado', label: 'Activa (sí/no)', aliases: ['activo'], example: 'si' }
        ]
    }
];

const norm = (s: string): string =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const TIPOS: TipoCuenta[] = ['ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'COSTO', 'GASTO'];


@Component({
    selector: 'app-reportes',
    standalone: true,
    imports: [ReportViewerComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './reportes.html',
    changeDetection: ChangeDetectionStrategy.OnPush
    /*__STYLES__*/
})
export class ReportesComponent implements OnInit {

    private readonly dataService = inject(AnalisisDataService);
    private readonly exporter = inject(AnalisisExportService);
    private readonly proveedoresService = inject(ProveedoresService);
    private readonly clientesService = inject(ClientesService);
    private readonly productosService = inject(ProductosService);
    private readonly cuentasService = inject(CatalogoCuentasService);

    readonly empresa = this.dataService.empresa;
    readonly datasets = DATASETS;

    /* ESTADO */
    readonly tab = signal<'reportes' | 'importar'>('reportes');
    readonly loading = signal(false);
    readonly errorMessage = signal<string | null>(null);
    readonly warnings = signal<string[]>([]);
    readonly data = signal<AnalisisData | null>(null);

    readonly selectedId = signal<string>('libro-diario');
    readonly filtro = signal<Filtro>(this.dataService.defaultFiltro());
    readonly searchTerm = signal('');

    /* LISTA DE REPORTES */
    readonly grupos = computed(() => {

        const s = this.searchTerm().trim().toLowerCase();
        const lista = REPORTES.filter(r => !s || `${r.nombre} ${r.descripcion} ${r.grupo}`.toLowerCase().includes(s));
        const map = new Map<string, ReportDef[]>();

        lista.forEach(r => map.set(r.grupo, [...(map.get(r.grupo) ?? []), r]));

        let n = 0;
        return [...map.entries()].map(([nombre, items]) => ({
            nombre,
            items: items.map(r => ({ def: r, num: ++n }))
        }));
    });

    readonly seleccionado = computed(() => REPORTES.find(r => r.id === this.selectedId()) ?? null);

    readonly engine = computed(() => {
        const d = this.data();
        return d ? this.dataService.engine(d, this.filtro()) : null;
    });

    readonly doc = computed(() => {
        const e = this.engine(), id = this.selectedId();
        if (!e || !id) return null;
        try { return e.build(id); } catch (err) { console.error('Error construyendo el reporte:', err); return null; }
    });

    readonly rangoInvalido = computed(() => this.filtro().desde > this.filtro().hasta);


    /* IMPORTACIÓN */
    readonly datasetId = signal<DatasetId>('proveedores');
    readonly dataset = computed(() => DATASETS.find(d => d.id === this.datasetId())!);
    readonly fileName = signal<string | null>(null);
    readonly parsing = signal(false);
    readonly importing = signal(false);
    readonly dragging = signal(false);
    readonly importRows = signal<ImportRow[]>([]);
    readonly progress = signal(0);
    readonly importMessage = signal<string | null>(null);

    readonly validas = computed(() => this.importRows().filter(r => !r.error));
    readonly invalidas = computed(() => this.importRows().filter(r => !!r.error));
    readonly importadas = computed(() => this.importRows().filter(r => r.status === 'ok').length);
    readonly fallidas = computed(() => this.importRows().filter(r => r.status === 'error').length);
    readonly preview = computed(() => this.importRows().slice(0, 100));


    ngOnInit(): void {
        this.cargar();
    }

    cargar(): void {

        if (this.loading()) return;

        this.loading.set(true);
        this.errorMessage.set(null);

        this.dataService.load().subscribe({
            next: ({ data, warnings }) => {
                this.data.set(data);
                this.warnings.set(warnings);
                this.loading.set(false);
            },
            error: (e) => {
                console.error('Error cargando datos de análisis:', e);
                this.errorMessage.set('No se pudo reunir la información de los módulos.');
                this.loading.set(false);
            }
        });
    }


    /* FILTROS */
    setFiltro<K extends keyof Filtro>(campo: K, valor: Filtro[K]): void {
        this.filtro.update(f => ({ ...f, [campo]: valor }));
    }

    preset(p: 'mes' | 'trimestre' | 'anio' | 'anio-anterior'): void {

        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const y = now.getFullYear(), m = now.getMonth();

        const rangos = {
            'mes': [new Date(y, m, 1), now],
            'trimestre': [new Date(y, Math.floor(m / 3) * 3, 1), now],
            'anio': [new Date(y, 0, 1), now],
            'anio-anterior': [new Date(y - 1, 0, 1), new Date(y - 1, 11, 31)]
        }[p];

        this.filtro.update(f => ({ ...f, desde: fmt(rangos[0]), hasta: fmt(rangos[1]) }));
    }

    setEmpresa(v: string): void {
        this.empresa.set(v.trim() || 'Contalab');
    }


    /* =========================================================
       IMPORTAR
       ========================================================= */

    setDataset(id: DatasetId): void {
        if (this.importing()) return;
        this.datasetId.set(id);
        this.limpiarImport();
    }

    limpiarImport(): void {
        this.importRows.set([]);
        this.fileName.set(null);
        this.progress.set(0);
        this.importMessage.set(null);
    }

    plantilla(formato: 'csv' | 'xlsx'): void {
        const ds = this.dataset();
        this.exporter.downloadTemplate(ds.id, ds.fields.map(f => f.key), ds.fields.map(f => f.example), formato);
    }

    onFileInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) void this.leerArchivo(file);
        input.value = '';
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.dragging.set(false);
        const file = event.dataTransfer?.files?.[0];
        if (file) void this.leerArchivo(file);
    }

    private async leerArchivo(file: File): Promise<void> {

        if (this.importing() || this.parsing()) return;

        this.parsing.set(true);
        this.limpiarImport();
        this.fileName.set(file.name);

        try {
            const raw = await this.exporter.readFile(file);
            if (!raw.length) throw new Error('El archivo no contiene filas.');
            this.importRows.set(this.validar(this.dataset(), raw));
        } catch (e: any) {
            this.importMessage.set(e?.message ?? 'No se pudo leer el archivo.');
        } finally {
            this.parsing.set(false);
        }
    }


    /* ---------- validación por conjunto ---------- */

    private validar(ds: ImportDataset, filas: Record<string, any>[]): ImportRow[] {

        const data = this.data();
        const seen = new Set<string>();

        const existentes = {
            ruc: new Set((data?.proveedores ?? []).map(p => p.ruc.trim().toLowerCase())),
            codigo: new Set((data?.productos ?? []).map(p => p.codigo.trim().toLowerCase())),
            cuenta: new Set((data?.cuentas ?? []).map(c => c.codigo_cuenta.trim()))
        };

        const codigosArchivo = new Set(
            ds.id === 'cuentas'
                ? filas.map(f => String(this.leer(ds, f, 'codigo_cuenta') ?? '').trim()).filter(Boolean)
                : []
        );

        return filas.map((raw, i) => {

            const get = (k: string) => this.leer(ds, raw, k);
            const txt = (k: string) => String(get(k) ?? '').trim();
            const faltan = ds.fields.filter(f => f.required && !txt(f.key)).map(f => f.label);

            let error: string | null = faltan.length ? `Falta: ${faltan.join(', ')}` : null;
            let value: any = null;
            let resumen = '';

            if (!error) {
                switch (ds.id) {

                    case 'proveedores': {
                        const correo = txt('correo');
                        let tel = txt('telefono').replace(/[\s-]/g, '');
                        if (/^\d{8}$/.test(tel)) tel = `+505${tel}`;
                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) error = 'Correo no válido';
                        else if (!/^\+\d{8,15}$/.test(tel)) error = 'Teléfono no válido (usa +505XXXXXXXX)';
                        else if (existentes.ruc.has(txt('ruc').toLowerCase()) || seen.has(txt('ruc').toLowerCase())) error = 'RUC repetido';
                        else {
                            seen.add(txt('ruc').toLowerCase());
                            value = { nombre_empresa: txt('nombre_empresa'), ruc: txt('ruc'), telefono: tel, correo, direccion: txt('direccion'), estado: this.bool(get('estado'), true) };
                            resumen = `${value.nombre_empresa} · ${value.ruc}`;
                        }
                        break;
                    }

                    case 'clientes': {
                        const correo = txt('correo_cliente');
                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) error = 'Correo no válido';
                        else {
                            value = {
                                nombre_cliente: txt('nombre_cliente'), apellido_cliente: txt('apellido_cliente'), direccion_cliente: txt('direccion_cliente'),
                                correo_cliente: correo, fecha_registro_cl: this.fecha(get('fecha_registro_cl')) ?? new Date().toISOString().slice(0, 10),
                                activo: this.bool(get('activo'), true),
                                ...(txt('telefono_cliente') ? { telefono_cliente: txt('telefono_cliente').replace(/[\s-]/g, '') } : {}),
                                ...(txt('nombre_empresa') ? { nombre_empresa: txt('nombre_empresa') } : {}),
                                ...(txt('ruc') ? { ruc: txt('ruc') } : {})
                            };
                            resumen = `${value.nombre_cliente} ${value.apellido_cliente}`;
                        }
                        break;
                    }

                    case 'productos': {
                        const precio = this.money(get('precio_venta')), costo = this.money(get('costo_unitario'));
                        const cat = txt('categoria');
                        const categoria = (data?.categorias ?? []).find(c => String(c.categoria_id) === cat || norm(c.nombre_categoria) === norm(cat));
                        const codigo = txt('codigo').toLowerCase();

                        if (precio === null || precio < 0) error = 'Precio de venta no válido';
                        else if (costo === null || costo < 0) error = 'Costo unitario no válido';
                        else if (!categoria) error = `Categoría "${cat}" no existe`;
                        else if (existentes.codigo.has(codigo) || seen.has(codigo)) error = 'Código repetido';
                        else {
                            seen.add(codigo);
                            value = { codigo: txt('codigo'), nombre_producto: txt('nombre_producto'), precio_venta: precio, costo_unitario: costo, categoria_id: categoria.categoria_id, estado: this.bool(get('estado'), true), ...(txt('descripcion') ? { descripcion: txt('descripcion') } : {}) };
                            resumen = `${value.codigo} · ${value.nombre_producto}`;
                        }
                        break;
                    }

                    case 'cuentas': {
                        const codigo = txt('codigo_cuenta'), padre = txt('cuenta_padre');
                        const tipo = txt('tipo_cuenta').toUpperCase(), nat = txt('naturaleza').toUpperCase();
                        if (existentes.cuenta.has(codigo) || seen.has(codigo)) error = 'Código de cuenta repetido';
                        else if (tipo && !TIPOS.includes(tipo as TipoCuenta)) error = `Tipo "${tipo}" no válido`;
                        else if (nat && nat !== 'DEUDORA' && nat !== 'ACREEDORA') error = `Naturaleza "${nat}" no válida`;
                        else if (padre && !existentes.cuenta.has(padre) && !codigosArchivo.has(padre)) error = `Cuenta padre "${padre}" no existe`;
                        else if (padre === codigo) error = 'Una cuenta no puede ser su propio padre';
                        else {
                            seen.add(codigo);
                            value = { codigo_cuenta: codigo, nombre_cuenta: txt('nombre_cuenta'), tipo, naturaleza: nat, padre, permite_movimiento: this.bool(get('permite_movimiento'), true), estado: this.bool(get('estado'), true) };
                            resumen = `${codigo} · ${value.nombre_cuenta}`;
                        }
                        break;
                    }
                }
            }

            return { line: i + 2, value, error, status: 'pendiente', message: error ?? '', resumen: resumen || `Fila ${i + 2}` } as ImportRow;
        });
    }

    private leer(ds: ImportDataset, raw: Record<string, any>, key: string): any {
        const field = ds.fields.find(f => f.key === key);
        const names = new Set([norm(key), ...(field?.aliases ?? []).map(norm)]);
        for (const [k, v] of Object.entries(raw)) if (names.has(norm(k))) return v;
        return undefined;
    }

    private bool(v: any, def: boolean): boolean {
        if (v === undefined || v === null || v === '') return def;
        if (typeof v === 'boolean') return v;
        return ['si', 'sí', 's', 'true', '1', 'activo', 'activa', 'yes', 'y'].includes(norm(String(v)).replace(/_/g, ''));
    }

    private money(v: any): number | null {
        if (typeof v === 'number') return Number.isFinite(v) ? v : null;
        let s = String(v ?? '').replace(/[^\d.,-]/g, '');
        if (!s) return null;
        if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '');
        else if (s.includes(',')) s = s.replace(',', '.');
        const n = Number(s);
        return Number.isFinite(n) ? n : null;
    }

    private fecha(v: any): string | null {
        if (!v) return null;
        if (typeof v === 'number') return new Date(Math.round((v - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
        const s = String(v).trim();
        const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
        if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
        return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
    }


    /* ---------- ejecución secuencial ---------- */

    importar(): void {

        const filas = this.validas();
        if (!filas.length || this.importing()) return;

        const ds = this.dataset();
        this.importing.set(true);
        this.progress.set(0);
        this.importMessage.set(null);

        // Para cuentas: se procesan los padres primero y se enlazan por código.
        const orden = ds.id === 'cuentas'
            ? [...filas].sort((a, b) => String(a.value.codigo_cuenta).localeCompare(String(b.value.codigo_cuenta), undefined, { numeric: true }))
            : filas;

        const codigos = new Map<string, { id: number; nivel: number; tipo: TipoCuenta; naturaleza: Naturaleza }>();
        (this.data()?.cuentas ?? []).forEach(c => codigos.set(c.codigo_cuenta, { id: c.cuenta_id, nivel: c.nivel_cuenta, tipo: c.tipo_cuenta, naturaleza: c.naturaleza }));

        from(orden).pipe(
            concatMap(row =>
                this.crear(ds.id, row.value, codigos).pipe(
                    map(() => ({ row, ok: true, msg: 'Importada' })),
                    catchError(e => of({ row, ok: false, msg: this.mensajeError(e) }))
                )
            )
        ).subscribe({
            next: r => {
                this.importRows.update(rs => rs.map(x => x.line === r.row.line ? { ...x, status: r.ok ? 'ok' : 'error', message: r.msg } : x));
                this.progress.update(p => p + 1);
            },
            complete: () => {
                this.importing.set(false);
                this.importMessage.set(`Importación terminada: ${this.importadas()} correctas, ${this.fallidas()} con error.`);
                this.cargar();
            }
        });
    }

    private crear(id: DatasetId, v: any, codigos: Map<string, { id: number; nivel: number; tipo: TipoCuenta; naturaleza: Naturaleza }>): Observable<unknown> {

        switch (id) {
            case 'proveedores': return this.proveedoresService.createProveedor(v);
            case 'clientes': return this.clientesService.createCliente(v);
            case 'productos': return this.productosService.createProducto(v);
            case 'cuentas': {
                const padre = v.padre ? codigos.get(v.padre) : undefined;
                const tipo: TipoCuenta = (v.tipo || padre?.tipo || 'ACTIVO') as TipoCuenta;
                const naturaleza: Naturaleza = (v.naturaleza || padre?.naturaleza || (['ACTIVO', 'COSTO', 'GASTO'].includes(tipo) ? 'DEUDORA' : 'ACREEDORA')) as Naturaleza;
                const nivel = padre ? padre.nivel + 1 : 1;

                return this.cuentasService.createCuenta({
                    codigo_cuenta: v.codigo_cuenta, nombre_cuenta: v.nombre_cuenta, tipo_cuenta: tipo, naturaleza,
                    cuenta_padre_id: padre?.id ?? null, nivel_cuenta: nivel, permite_movimiento: v.permite_movimiento, estado: v.estado
                }).pipe(map(c => { codigos.set(v.codigo_cuenta, { id: c.cuenta_id, nivel, tipo, naturaleza }); return c; }));
            }
        }
    }

    private mensajeError(e: any): string {
        const m = e?.error?.message;
        return Array.isArray(m) ? m.join(' · ') : typeof m === 'string' && m ? m : 'No se pudo crear el registro';
    }
}