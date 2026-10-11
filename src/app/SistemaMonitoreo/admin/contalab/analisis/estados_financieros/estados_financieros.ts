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
    AnalisisData,
    AnalisisDataService,
    ESTADOS,
    Filtro
} from '../services/analisis_data.service';

import { ReportViewerComponent } from '../reportes/report_viewer/report_viewer';


@Component({
    selector: 'app-estados-financieros',
    standalone: true,
    imports: [ReportViewerComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './estados_financieros.html',
    changeDetection: ChangeDetectionStrategy.OnPush
    /*__STYLES__*/
})
export class EstadosFinancierosComponent implements OnInit {

    private readonly dataService = inject(AnalisisDataService);

    readonly estados = ESTADOS;
    readonly empresa = this.dataService.empresa;

    readonly loading = signal(false);
    readonly errorMessage = signal<string | null>(null);
    readonly warnings = signal<string[]>([]);
    readonly data = signal<AnalisisData | null>(null);

    readonly selectedId = signal('balance-general');
    readonly filtro = signal<Filtro>(this.dataService.defaultFiltro());

    readonly seleccionado = computed(() => ESTADOS.find(e => e.id === this.selectedId())!);
    readonly usaNivel = computed(() => ['balance-general', 'estado-resultados'].includes(this.selectedId()));
    readonly rangoInvalido = computed(() => this.filtro().desde > this.filtro().hasta);

    readonly engine = computed(() => {
        const d = this.data();
        return d ? this.dataService.engine(d, this.filtro()) : null;
    });

    readonly doc = computed(() => {
        const e = this.engine();
        if (!e) return null;
        try { return e.build(this.selectedId()); } catch (err) { console.error('Error construyendo el estado:', err); return null; }
    });

    readonly resumen = computed(() => this.engine()?.resumen() ?? null);

    /** Razones financieras básicas (se muestran solo si hay base para calcularlas). */
    readonly razones = computed(() => {
        const r = this.resumen();
        if (!r) return [];
        const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)} %` : '—');
        return [
            { label: 'Endeudamiento', valor: pct(r.pasivo, r.activo), hint: 'Pasivos ÷ Activos' },
            { label: 'Autonomía financiera', valor: pct(r.patrimonio, r.activo), hint: 'Patrimonio ÷ Activos' },
            { label: 'Margen bruto', valor: pct(r.ingresos - r.costos, r.ingresos), hint: '(Ingresos − Costos) ÷ Ingresos' },
            { label: 'Margen neto', valor: pct(r.utilidad, r.ingresos), hint: 'Utilidad ÷ Ingresos' }
        ];
    });

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
                console.error('Error cargando estados financieros:', e);
                this.errorMessage.set('No se pudo reunir la información contable.');
                this.loading.set(false);
            }
        });
    }

    setFiltro<K extends keyof Filtro>(campo: K, valor: Filtro[K]): void {
        this.filtro.update(f => ({ ...f, [campo]: valor }));
    }

    preset(p: 'mes' | 'trimestre' | 'anio' | 'anio-anterior'): void {

        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const y = now.getFullYear(), m = now.getMonth();

        const [a, b] = {
            'mes': [new Date(y, m, 1), now],
            'trimestre': [new Date(y, Math.floor(m / 3) * 3, 1), now],
            'anio': [new Date(y, 0, 1), now],
            'anio-anterior': [new Date(y - 1, 0, 1), new Date(y - 1, 11, 31)]
        }[p];

        this.filtro.update(f => ({ ...f, desde: fmt(a), hasta: fmt(b) }));
    }

    setEmpresa(v: string): void {
        this.empresa.set(v.trim() || 'Contalab');
    }

    money(v: number): string {
        const n = new Intl.NumberFormat('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));
        return v < 0 ? `(${n})` : n;
    }
}