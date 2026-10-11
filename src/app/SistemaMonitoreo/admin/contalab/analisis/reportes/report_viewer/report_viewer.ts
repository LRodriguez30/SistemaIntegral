import {
    ChangeDetectionStrategy,
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    computed,
    effect,
    inject,
    input,
    OnDestroy,
    signal
} from '@angular/core';

import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';

import {
    AnalisisExportService,
    ExportFormat,
    FORMATOS,
    ReportDocument
} from '../../services/analisis_export.service';


/**
 * Visor formal de documentos: vista previa HTML (hoja) o PDF real,
 * zoom, impresión y exportación a todos los formatos.
 *
 * Uso: <app-report-viewer [doc]="doc()" [loading]="loading()" />
 */
@Component({
    selector: 'app-report-viewer',
    standalone: true,
    imports: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './report_viewer.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportViewerComponent implements OnDestroy {

    private readonly exporter = inject(AnalisisExportService);
    private readonly sanitizer = inject(DomSanitizer);

    readonly doc = input<ReportDocument | null>(null);
    readonly loading = input(false);

    readonly formatos = FORMATOS;
    readonly zoomOpciones = [75, 100, 125];

    readonly mode = signal<'documento' | 'pdf'>('documento');
    readonly zoom = signal(100);
    readonly menuOpen = signal(false);
    readonly working = signal<string | null>(null);
    readonly error = signal<string | null>(null);

    readonly pdfSrc = signal<SafeResourceUrl | null>(null);
    private pdfRaw: string | null = null;

    // El HTML lo genera el propio servicio y escapa todos los datos.
    readonly htmlSrc = computed<SafeHtml | null>(() => {
        const d = this.doc();
        return d ? this.sanitizer.bypassSecurityTrustHtml(this.exporter.renderHtml(d, true)) : null;
    });

    readonly filas = computed(() =>
        (this.doc()?.sections ?? []).reduce((s, x) => s + x.rows.length, 0)
    );

    constructor() {
        effect(() => {

            const d = this.doc();
            const m = this.mode();

            this.liberarPdf();

            if (m !== 'pdf' || !d) return;

            try {
                this.pdfRaw = this.exporter.pdfUrl(d);
                this.pdfSrc.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfRaw));
            } catch (e) {
                console.error('Error generando la vista previa PDF:', e);
                this.error.set('No se pudo generar la vista previa en PDF.');
                this.mode.set('documento');
            }
        });
    }

    ngOnDestroy(): void {
        this.liberarPdf();
    }

    private liberarPdf(): void {
        if (this.pdfRaw) URL.revokeObjectURL(this.pdfRaw);
        this.pdfRaw = null;
        this.pdfSrc.set(null);
    }

    setMode(mode: 'documento' | 'pdf'): void {
        this.mode.set(mode);
        this.error.set(null);
    }

    exportar(format: ExportFormat): void {

        const d = this.doc();
        if (!d || this.working()) return;

        this.menuOpen.set(false);
        this.error.set(null);
        this.working.set(format);

        // Se cede el hilo un instante para que se pinte el estado "generando".
        setTimeout(() => {
            try {
                this.exporter.export(d, format);
            } catch (e) {
                console.error('Error exportando:', e);
                this.error.set('No se pudo generar el archivo. Intenta de nuevo.');
            } finally {
                this.working.set(null);
            }
        }, 30);
    }

    imprimir(): void {
        const d = this.doc();
        if (d) this.exporter.print(d);
    }
}