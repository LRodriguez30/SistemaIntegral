import {
    ChangeDetectionStrategy,
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    computed,
    inject,
    OnDestroy,
    OnInit,
    signal
} from '@angular/core';

import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';

import {
    AnalisisData,
    AnalisisDataService,
    Filtro
} from '../services/analisis_data.service';

import {
    AnalisisExportService,
    C,
    ExportFormat,
    FORMATOS,
    R,
    ReportDocument
} from '../services/analisis_export.service';

import { jsPDF } from 'jspdf';


/* =============================================================
   GENERADORES SVG (autónomos: sirven para mostrar y para exportar)
   ============================================================= */

const PAL = ['#17324d', '#b7791f', '#4d8c5c', '#6d4aa8', '#a94442', '#3b6288', '#0f766e', '#8a9189'];
const W = 640;

const nf = new Intl.NumberFormat('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const short = (v: number) => { const a = Math.abs(v); return a >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : a >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : v.toFixed(0); };
const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

const wrap = (inner: string, h: number) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" font-family="Helvetica,Arial,sans-serif"><rect width="${W}" height="${h}" fill="#ffffff"/>${inner}</svg>`;

const vacio = (h = 260) =>
    wrap(`<text x="${W / 2}" y="${h / 2}" text-anchor="middle" font-size="13" fill="#8b949d">Sin datos en el periodo seleccionado</text>`, h);

function niceMax(v: number): number {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    return ([1, 2, 2.5, 5, 10].map(m => m * p).find(x => x >= v) ?? 10 * p);
}

interface Serie { name: string; color: string; values: number[]; }

function leyenda(series: Serie[]): string {
    let x = 54;
    return series.map(s => {
        const g = `<rect x="${x}" y="12" width="10" height="10" rx="2" fill="${s.color}"/><text x="${x + 15}" y="21" font-size="10.5" fill="#52606d">${esc(s.name)}</text>`;
        x += 28 + s.name.length * 6;
        return g;
    }).join('');
}

function ejes(lo: number, hi: number, ml: number, mt: number, pw: number, ph: number, ticks = 5) {
    const y = (v: number) => mt + ph * (hi - v) / (hi - lo);
    let g = '';
    for (let i = 0; i <= ticks; i++) {
        const v = lo + (hi - lo) * i / ticks;
        g += `<line x1="${ml}" x2="${ml + pw}" y1="${y(v)}" y2="${y(v)}" stroke="${Math.abs(v) < 1e-9 ? '#8b949d' : '#e6e9ec'}" stroke-width="1"/>`
            + `<text x="${ml - 8}" y="${y(v) + 3.5}" text-anchor="end" font-size="9.5" fill="#68737d">${short(v)}</text>`;
    }
    return { g, y };
}

function barras(labels: string[], series: Serie[], h = 300): string {

    const all = series.flatMap(s => s.values);
    if (!labels.length || all.every(v => Math.abs(v) < 0.005)) return vacio(h);

    const ml = 54, mr = 14, mt = 38, mb = 34, pw = W - ml - mr, ph = h - mt - mb;
    const hi = niceMax(Math.max(0, ...all)), lo = Math.min(...all) < 0 ? -niceMax(-Math.min(...all)) : 0;
    const { g, y } = ejes(lo, hi, ml, mt, pw, ph);

    const band = pw / labels.length, bw = Math.min(30, band * 0.72 / series.length);
    const skip = Math.ceil(labels.length / 10);
    let out = g + leyenda(series);

    labels.forEach((l, i) => {
        const x0 = ml + band * i + (band - bw * series.length) / 2;
        series.forEach((s, j) => {
            const v = s.values[i] ?? 0, y0 = y(0), y1 = y(v);
            out += `<rect x="${x0 + bw * j}" y="${Math.min(y0, y1)}" width="${bw - 1.5}" height="${Math.max(Math.abs(y0 - y1), 0.5)}" fill="${s.color}" rx="1.5"><title>${esc(s.name)} · ${esc(l)}: C$ ${nf.format(v)}</title></rect>`;
        });
        if (i % skip === 0) out += `<text x="${ml + band * (i + 0.5)}" y="${h - 14}" text-anchor="middle" font-size="9.5" fill="#52606d">${esc(l)}</text>`;
    });

    return wrap(out, h);
}

function lineas(labels: string[], series: Serie[], h = 300): string {

    const all = series.flatMap(s => s.values);
    if (labels.length < 1 || all.every(v => Math.abs(v) < 0.005)) return vacio(h);

    const ml = 54, mr = 20, mt = 38, mb = 34, pw = W - ml - mr, ph = h - mt - mb;
    const hi = niceMax(Math.max(0, ...all)), lo = Math.min(...all) < 0 ? -niceMax(-Math.min(...all)) : 0;
    const { g, y } = ejes(lo, hi, ml, mt, pw, ph);
    const x = (i: number) => labels.length === 1 ? ml + pw / 2 : ml + pw * i / (labels.length - 1);
    const skip = Math.ceil(labels.length / 10);

    let out = g + leyenda(series);

    series.forEach(s => {
        out += `<polyline fill="none" stroke="${s.color}" stroke-width="2.2" stroke-linejoin="round" points="${s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}"/>`;
        s.values.forEach((v, i) => out += `<circle cx="${x(i)}" cy="${y(v)}" r="3.2" fill="#fff" stroke="${s.color}" stroke-width="1.8"><title>${esc(s.name)} · ${esc(labels[i])}: C$ ${nf.format(v)}</title></circle>`);
    });

    labels.forEach((l, i) => { if (i % skip === 0) out += `<text x="${x(i)}" y="${h - 14}" text-anchor="middle" font-size="9.5" fill="#52606d">${esc(l)}</text>`; });

    return wrap(out, h);
}

function horizontales(items: { label: string; value: number }[]): string {

    if (!items.length || items.every(i => i.value <= 0)) return vacio(240);

    const row = 28, mt = 14, ml = 176, mr = 90, h = mt * 2 + items.length * row;
    const max = Math.max(...items.map(i => i.value));
    let out = '';

    items.forEach((it, i) => {
        const y = mt + i * row, w = (W - ml - mr) * it.value / max;
        out += `<text x="${ml - 10}" y="${y + 15}" text-anchor="end" font-size="10.5" fill="#1c2733">${esc(cut(it.label, 28))}</text>`
            + `<rect x="${ml}" y="${y + 4}" width="${Math.max(w, 1)}" height="16" rx="2" fill="${PAL[0]}" opacity="${1 - i * 0.055}"><title>${esc(it.label)}: C$ ${nf.format(it.value)}</title></rect>`
            + `<text x="${ml + w + 7}" y="${y + 16}" font-size="10" fill="#52606d" font-family="monospace">${short(it.value)}</text>`;
    });

    return wrap(out, h);
}

function dona(items: { label: string; value: number }[], moneda = true, h = 280): string {

    const total = items.reduce((s, i) => s + i.value, 0);
    if (!items.length || total <= 0) return vacio(h);

    const cx = 165, cy = h / 2, r = 80, sw = 38, circ = 2 * Math.PI * r;
    let off = 0, out = '';

    items.forEach((it, i) => {
        const len = circ * it.value / total;
        out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${PAL[i % PAL.length]}" stroke-width="${sw}" stroke-dasharray="${len} ${circ - len}" stroke-dashoffset="${-off}" transform="rotate(-90 ${cx} ${cy})"><title>${esc(it.label)}: ${moneda ? 'C$ ' + nf.format(it.value) : it.value} (${(it.value / total * 100).toFixed(1)} %)</title></circle>`;
        off += len;
    });

    out += `<text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="17" font-weight="700" fill="#17324d">${moneda ? short(total) : total}</text>`
        + `<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="9.5" fill="#68737d">${moneda ? 'C$ total' : 'total'}</text>`;

    items.slice(0, 9).forEach((it, i) => {
        const y = 40 + i * 24;
        out += `<rect x="318" y="${y}" width="11" height="11" rx="2" fill="${PAL[i % PAL.length]}"/>`
            + `<text x="336" y="${y + 9.5}" font-size="11" fill="#1c2733">${esc(cut(it.label, 24))}</text>`
            + `<text x="${W - 14}" y="${y + 9.5}" text-anchor="end" font-size="10.5" fill="#52606d" font-family="monospace">${(it.value / total * 100).toFixed(1)} %</text>`;
    });

    return wrap(out, h);
}


/* =============================================================
   COMPONENTE
   ============================================================= */

interface ChartCard {
    id: string;
    title: string;
    subtitle: string;
    svg: string;
    html: SafeHtml;
    h: number;
    vacio: boolean;
    cols: string[];
    rows: (string | number)[][];
    money: boolean;
}

@Component({
    selector: 'app-graficas',
    standalone: true,
    imports: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './graficas.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [`:host ::ng-deep .chart svg { width: 100%; height: auto; display: block; }`]
})
export class GraficasComponent implements OnInit, OnDestroy {

    private readonly dataService = inject(AnalisisDataService);
    private readonly exporter = inject(AnalisisExportService);
    private readonly sanitizer = inject(DomSanitizer);

    readonly formatos = FORMATOS;
    readonly empresa = this.dataService.empresa;

    readonly loading = signal(false);
    readonly errorMessage = signal<string | null>(null);
    readonly warnings = signal<string[]>([]);
    readonly data = signal<AnalisisData | null>(null);
    readonly filtro = signal<Filtro>(this.dataService.defaultFiltro());

    readonly menuOpen = signal(false);
    readonly working = signal<string | null>(null);

    readonly pdfModal = signal(false);
    readonly pdfBuilding = signal(false);
    readonly pdfSrc = signal<SafeResourceUrl | null>(null);
    private pdfRaw: string | null = null;
    private pdfDoc: jsPDF | null = null;

    readonly rangoInvalido = computed(() => this.filtro().desde > this.filtro().hasta);

    readonly engine = computed(() => {
        const d = this.data();
        return d ? this.dataService.engine(d, this.filtro()) : null;
    });

    readonly kpis = computed(() => {
        const k = this.engine()?.kpis();
        if (!k) return [];
        return [
            { label: 'Ventas', valor: k.ventas, icon: 'lucide:receipt-text', nota: `${k.facturas} facturas`, tono: 'text-[#17324d]' },
            { label: 'Compras', valor: k.compras, icon: 'lucide:shopping-cart', nota: `${k.compras_n} compras`, tono: 'text-[#17324d]' },
            { label: 'Cobrado', valor: k.cobrado, icon: 'lucide:hand-coins', nota: 'Cobros aplicados', tono: 'text-[#3c7650]' },
            { label: 'Pagado a proveedores', valor: k.pagado, icon: 'lucide:credit-card', nota: 'Pagos aplicados', tono: 'text-[#9d3b3b]' },
            { label: 'Por cobrar', valor: k.porCobrar, icon: 'lucide:clock-arrow-up', nota: 'Saldo al corte', tono: 'text-[#b7791f]' },
            { label: 'Por pagar', valor: k.porPagar, icon: 'lucide:clock-arrow-down', nota: 'Saldo al corte', tono: 'text-[#b7791f]' },
            { label: k.utilidad >= 0 ? 'Utilidad contable' : 'Pérdida contable', valor: k.utilidad, icon: 'lucide:trending-up', nota: 'Según asientos', tono: k.utilidad >= 0 ? 'text-[#3c7650]' : 'text-[#9d3b3b]' },
            { label: 'Nómina neta', valor: k.nominaNeta, icon: 'lucide:users-round', nota: 'Salarios netos', tono: 'text-[#17324d]' }
        ];
    });

    readonly charts = computed<ChartCard[]>(() => {

        const e = this.engine();
        if (!e) return [];

        const m = e.mensual();
        const res = e.resumen();
        const top = e.topProductos(10);
        const cat = e.ventasPorCategoria();
        const cxc = e.aging('cobrar'), cxp = e.aging('pagar');
        const bk = ['0 - 30 días', '31 - 60 días', '61 - 90 días', 'Más de 90'];
        const nom = e.nominaPeriodos();
        const ped = e.pedidosPorEstado();
        const mc = e.montosPorMetodo('cobros'), mp = e.montosPorMetodo('pagos');
        const fin = [{ label: 'Pasivos', value: Math.max(res.pasivo, 0) }, { label: 'Patrimonio', value: Math.max(res.patrimonio, 0) }];

        const mk = (id: string, title: string, subtitle: string, svg: string, h: number, cols: string[], rows: (string | number)[][], money = true): ChartCard => ({
            id, title, subtitle, svg, h, cols, rows, money,
            html: this.sanitizer.bypassSecurityTrustHtml(svg),
            vacio: svg.includes('Sin datos en el periodo')
        });

        return [
            mk('ventas-compras', 'Ventas vs. compras', 'Totales facturados y comprados por mes', barras(m.labels, [{ name: 'Ventas', color: PAL[0], values: m.ventas }, { name: 'Compras', color: PAL[1], values: m.compras }]), 300,
                ['Ventas', 'Compras'], m.labels.map((l, i) => [l, m.ventas[i], m.compras[i]])),

            mk('resultados', 'Ingresos y egresos contables', 'Según asientos: ingresos vs. costos y gastos', lineas(m.labels, [{ name: 'Ingresos', color: PAL[2], values: m.ingresos }, { name: 'Costos y gastos', color: PAL[4], values: m.egresos }]), 300,
                ['Ingresos', 'Costos y gastos'], m.labels.map((l, i) => [l, m.ingresos[i], m.egresos[i]])),

            mk('top-productos', 'Productos más vendidos', 'Top 10 por monto vendido', horizontales(top), 14 * 2 + Math.max(top.length, 1) * 28 || 240, ['Ventas'], top.map(t => [t.label, t.value])),

            mk('categorias', 'Ventas por categoría', 'Participación en el monto vendido', dona(cat), 280, ['Ventas'], cat.map(c => [c.label, c.value])),

            mk('aging-cxc', 'Cuentas por cobrar', 'Antigüedad de saldos de clientes', barras(bk, [{ name: 'Por cobrar', color: PAL[1], values: cxc }], 260), 260, ['Saldo'], bk.map((b, i) => [b, cxc[i]])),

            mk('aging-cxp', 'Cuentas por pagar', 'Antigüedad de saldos con proveedores', barras(bk, [{ name: 'Por pagar', color: PAL[4], values: cxp }], 260), 260, ['Saldo'], bk.map((b, i) => [b, cxp[i]])),

            mk('financiamiento', 'Estructura de financiamiento', 'Pasivos y patrimonio al corte', dona(fin), 280, ['Monto'], fin.map(f => [f.label, f.value])),

            mk('nomina', 'Costo de nómina', 'Salario neto y cargas patronales por periodo de pago', barras(nom.map(n => n.label), [{ name: 'Salario neto', color: PAL[0], values: nom.map(n => n.neto) }, { name: 'INSS patronal + INATEC', color: PAL[3], values: nom.map(n => n.patronal) }], 260), 260,
                ['Salario neto', 'Cargas patronales'], nom.map(n => [n.label, n.neto, n.patronal])),

            mk('pedidos', 'Pedidos por estado', 'Cantidad de pedidos del periodo', dona(ped, false), 280, ['Pedidos'], ped.map(p => [p.label, p.value]), false),

            mk('metodos-cobro', 'Cobros por método', 'Monto cobrado según método de pago', dona(mc), 280, ['Monto'], mc.map(x => [x.label, x.value])),

            mk('metodos-pago', 'Pagos por método', 'Monto pagado a proveedores según método', dona(mp), 280, ['Monto'], mp.map(x => [x.label, x.value]))
        ];
    });

    ngOnInit(): void {
        this.cargar();
    }

    ngOnDestroy(): void {
        this.liberarPdf();
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
                console.error('Error cargando gráficas:', e);
                this.errorMessage.set('No se pudo reunir la información para las gráficas.');
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


    /* ---------- exportación de una gráfica ---------- */

    descargarSvg(c: ChartCard): void {
        this.exporter.download(new Blob([c.svg], { type: 'image/svg+xml;charset=utf-8' }), `${c.id}.svg`);
    }

    async descargarPng(c: ChartCard): Promise<void> {
        try {
            this.exporter.downloadDataUrl(await this.exporter.svgToPng(c.svg, 640, c.h, 2.5), `${c.id}.png`);
        } catch (e) {
            console.error(e);
            this.errorMessage.set('No se pudo generar la imagen PNG.');
        }
    }


    /* ---------- exportación de los datos (todos los formatos) ---------- */

    private periodo(): string {
        const f = this.filtro();
        const d = (v: string) => v.split('-').reverse().join('/');
        return `Del ${d(f.desde)} al ${d(f.hasta)}`;
    }

    datasetDoc(): ReportDocument {
        return {
            id: 'graficas-datos',
            company: this.empresa(),
            title: 'Datos de gráficas',
            subtitle: 'Series utilizadas en los gráficos del análisis',
            period: this.periodo(),
            generatedAt: new Date().toLocaleString('es-NI'),
            sections: this.charts().map(c => ({
                title: c.title,
                note: c.subtitle,
                columns: [C('label', 'Concepto'), ...c.cols.map((n, i) => C(`v${i}`, n, c.money ? 'money' : 'number'))],
                rows: c.rows.map(r => R(Object.fromEntries([['label', r[0]], ...r.slice(1).map((v, i) => [`v${i}`, v])])))
            }))
        };
    }

    exportarDatos(format: ExportFormat): void {

        if (this.working()) return;

        this.menuOpen.set(false);
        this.working.set(format);

        setTimeout(() => {
            try { this.exporter.export(this.datasetDoc(), format); }
            catch (e) { console.error(e); this.errorMessage.set('No se pudo generar el archivo.'); }
            finally { this.working.set(null); }
        }, 30);
    }


    /* ---------- informe PDF con las gráficas ---------- */

    async abrirVistaPdf(): Promise<void> {

        if (this.pdfBuilding() || !this.charts().length) return;

        this.pdfBuilding.set(true);
        this.pdfModal.set(true);
        this.liberarPdf();

        try {
            const imgs = await Promise.all(
                this.charts().filter(c => !c.vacio).map(async c => ({
                    title: c.title, png: await this.exporter.svgToPng(c.svg, 640, c.h, 2), ratio: c.h / 640
                }))
            );

            this.pdfDoc = this.exporter.buildChartsPdf(
                { company: this.empresa(), title: 'Informe gráfico', period: this.periodo(), generatedAt: new Date().toLocaleString('es-NI') },
                imgs
            );

            this.pdfRaw = URL.createObjectURL(this.pdfDoc.output('blob'));
            this.pdfSrc.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfRaw));
        } catch (e) {
            console.error('Error generando el informe PDF:', e);
            this.errorMessage.set('No se pudo generar el informe PDF.');
            this.pdfModal.set(false);
        } finally {
            this.pdfBuilding.set(false);
        }
    }

    descargarPdf(): void {
        this.pdfDoc?.save(`informe_graficas_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.pdf`);
    }

    cerrarVistaPdf(): void {
        this.pdfModal.set(false);
        this.liberarPdf();
    }

    private liberarPdf(): void {
        if (this.pdfRaw) URL.revokeObjectURL(this.pdfRaw);
        this.pdfRaw = null;
        this.pdfDoc = null;
        this.pdfSrc.set(null);
    }
}