import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';


/* =============================================================
   MODELO DE DOCUMENTO (lo consumen la vista previa y todos los formatos)
   ============================================================= */

export type ColType = 'text' | 'money' | 'number' | 'date' | 'percent';
export type RowKind = 'normal' | 'group' | 'subtotal' | 'total';
export type Cell = string | number | null | undefined;

export interface ReportColumn {
    key: string;
    label: string;
    type: ColType;
    align: 'left' | 'right' | 'center';
}

export interface ReportRow {
    kind?: RowKind;
    indent?: number;
    cells: Record<string, Cell>;
}

export interface ReportSection {
    title?: string;
    columns: ReportColumn[];
    rows: ReportRow[];
    note?: string;
}

export interface ReportDocument {
    id: string;
    company: string;
    title: string;
    subtitle?: string;
    period: string;
    generatedAt: string;
    sections: ReportSection[];
    notes?: string[];
    signatures?: string[];
    landscape?: boolean;
}

export type ExportFormat = 'pdf' | 'xlsx' | 'doc' | 'csv' | 'json' | 'html' | 'md';

export const FORMATOS: { id: ExportFormat; label: string; ext: string; icon: string; hint: string }[] = [
    { id: 'pdf', label: 'PDF', ext: '.pdf', icon: 'lucide:file-text', hint: 'Documento formal' },
    { id: 'xlsx', label: 'Excel', ext: '.xlsx', icon: 'lucide:file-spreadsheet', hint: 'Hoja de cálculo' },
    { id: 'doc', label: 'Word', ext: '.doc', icon: 'lucide:file-type', hint: 'Documento editable' },
    { id: 'csv', label: 'CSV', ext: '.csv', icon: 'lucide:table', hint: 'Datos separados por comas' },
    { id: 'json', label: 'JSON', ext: '.json', icon: 'lucide:braces', hint: 'Datos estructurados' },
    { id: 'html', label: 'HTML', ext: '.html', icon: 'lucide:code-xml', hint: 'Página web' },
    { id: 'md', label: 'Markdown', ext: '.md', icon: 'lucide:file-code', hint: 'Texto con tablas' }
];

export const R = (
    cells: Record<string, Cell>,
    kind?: RowKind,
    indent?: number
): ReportRow => ({ cells, kind, indent });

export const C = (
    key: string,
    label: string,
    type: ColType = 'text',
    align?: 'left' | 'right' | 'center'
): ReportColumn => ({
    key,
    label,
    type,
    align: align ?? (type === 'text' || type === 'date' ? 'left' : 'right')
});


/* =============================================================
   FORMATO DE VALORES
   ============================================================= */

const NF_MONEY = new Intl.NumberFormat('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const NF_NUM = new Intl.NumberFormat('es-NI', { maximumFractionDigits: 2 });

export const dmy = (v: string): string => {
    const t = (v ?? '').slice(0, 10);
    const [y, m, d] = t.split('-');
    return y && m && d ? `${d}/${m}/${y}` : t;
};

export function formatValue(col: ReportColumn, v: Cell): string {

    if (v === null || v === undefined || v === '') return '';

    if (col.type === 'text') return String(v);
    if (col.type === 'date') return dmy(String(v));

    const x = Number(v);
    if (!Number.isFinite(x)) return String(v);

    switch (col.type) {
        case 'money':
            if (Math.abs(x) < 0.005) return '-';
            return x < 0 ? `(${NF_MONEY.format(-x)})` : NF_MONEY.format(x);
        case 'percent':
            return `${x.toFixed(1)} %`;
        default:
            return NF_NUM.format(x);
    }
}

const esc = (s: unknown): string =>
    String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const slug = (s: string): string =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const isWide = (doc: ReportDocument): boolean =>
    doc.landscape ?? doc.sections.some(s => s.columns.length > 6);


/* =============================================================
   SERVICIO
   ============================================================= */

@Injectable({ providedIn: 'root' })
export class AnalisisExportService {

    /* ---------------------------------------------------------
       DESCARGA
       --------------------------------------------------------- */

    download(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    fileName(doc: ReportDocument, ext: string): string {
        const d = new Date();
        const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        return `${slug(doc.title)}_${stamp}${ext}`;
    }

    /** Exporta el documento al formato indicado. */
    async export(doc: ReportDocument, format: ExportFormat): Promise<void> {
        const formato = FORMATOS.find(f => f.id === format);

        if (!formato) {
            throw new Error(`Formato de exportación no soportado: ${format}`);
        }

        const name = this.fileName(doc, formato.ext);

        switch (format) {
            case 'pdf':
                this.buildPdf(doc).save(name);
                break;

            case 'xlsx':
                await this.exportXlsx(doc, name);
                break;

            case 'doc':
                this.download(
                    new Blob(
                        ['\ufeff', this.renderWord(doc)],
                        { type: 'application/msword' }
                    ),
                    name
                );
                break;

            case 'csv':
                this.download(
                    new Blob(
                        ['\ufeff', this.toCsv(doc)],
                        { type: 'text/csv;charset=utf-8' }
                    ),
                    name
                );
                break;

            case 'json':
                this.download(
                    new Blob(
                        [this.toJson(doc)],
                        { type: 'application/json;charset=utf-8' }
                    ),
                    name
                );
                break;

            case 'html':
                this.download(
                    new Blob(
                        [this.renderHtml(doc, false)],
                        { type: 'text/html;charset=utf-8' }
                    ),
                    name
                );
                break;

            case 'md':
                this.download(
                    new Blob(
                        [this.toMarkdown(doc)],
                        { type: 'text/markdown;charset=utf-8' }
                    ),
                    name
                );
                break;
        }
    }

    print(doc: ReportDocument): void {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
        document.body.appendChild(iframe);
        iframe.srcdoc = this.renderHtml(doc, false);
        iframe.onload = () => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => iframe.remove(), 2000);
        };
    }


    /* ---------------------------------------------------------
       HTML (vista previa, impresión, HTML y Word)
       --------------------------------------------------------- */

    renderHtml(doc: ReportDocument, preview: boolean): string {

        const sections = doc.sections.map(s => {

            const head = s.columns
                .map(c => `<th class="${c.align === 'right' ? 'r' : c.align === 'center' ? 'c' : ''}">${esc(c.label)}</th>`)
                .join('');

            const body = s.rows.map(r => {
                const tds = s.columns.map((c, i) => {
                    const pad = i === 0 && r.indent ? ` style="padding-left:${8 + r.indent * 16}px"` : '';
                    const cls = c.align === 'right' ? 'r' : c.align === 'center' ? 'c' : '';
                    return `<td class="${cls}"${pad}>${esc(formatValue(c, r.cells[c.key]))}</td>`;
                }).join('');
                return `<tr class="${r.kind ?? 'normal'}">${tds}</tr>`;
            }).join('');

            return `
              ${s.title ? `<h2>${esc(s.title)}</h2>` : ''}
              <table><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td colspan="${s.columns.length}" class="c empty">Sin registros en el periodo seleccionado.</td></tr>`}</tbody></table>
              ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}`;
        }).join('');

        const notes = doc.notes?.length
            ? `<div class="notes"><strong>Notas:</strong><br>${doc.notes.map(n => esc(n)).join('<br>')}</div>`
            : '';

        const sign = doc.signatures?.length
            ? `<div class="sign">${doc.signatures.map(s => `<div>${esc(s)}</div>`).join('')}</div>`
            : '';

        const css = `
        *{box-sizing:border-box}
        body{margin:0;font-family:Cambria,Georgia,'Times New Roman',serif;color:#1c2733;font-size:12px}
        .page{background:#fff;max-width:${isWide(doc) ? 1280 : 1040}px;margin:0 auto;padding:44px 52px}
        body.preview{background:#dde1e6;padding:26px 12px}
        body.preview .page{box-shadow:0 1px 3px rgba(0,0,0,.18),0 14px 34px rgba(23,50,77,.14);min-height:560px}
        .hd{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;border-bottom:3px double #17324d;padding-bottom:12px;margin-bottom:18px}
        .co{font:600 10.5px Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#52606d}
        h1{font-size:23px;margin:5px 0 2px;color:#17324d;font-weight:700}
        .sub{color:#52606d;font-style:italic;font-size:12px}
        .meta{text-align:right;font:10px/1.7 Helvetica,Arial,sans-serif;color:#68737d;white-space:nowrap}
        .meta b{color:#17324d}
        h2{font:700 11.5px Helvetica,Arial,sans-serif;margin:24px 0 6px;color:#17324d;text-transform:uppercase;letter-spacing:.07em}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th{font:700 9.5px Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:.05em;color:#17324d;border-top:1.5px solid #17324d;border-bottom:1.5px solid #17324d;padding:6px 8px;background:#f4f6f8;text-align:left;white-space:nowrap}
        td{padding:4px 8px;border-bottom:1px solid #e6e9ec;vertical-align:top}
        th.r,td.r{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
        th.c,td.c{text-align:center}
        td.empty{padding:22px;color:#8b949d;font-style:italic}
        tr.group td{font-weight:700;background:#f4f6f8;color:#17324d}
        tr.subtotal td{font-weight:700;border-top:1px solid #17324d}
        tr.total td{font-weight:700;border-top:1.5px solid #17324d;border-bottom:3px double #17324d;background:#eef1f4;color:#17324d}
        .note{font-size:10px;color:#68737d;font-style:italic;margin:6px 0 0}
        .notes{margin-top:24px;font-size:10px;line-height:1.7;color:#52606d;border-top:1px solid #d5dae0;padding-top:8px}
        .sign{display:flex;gap:44px;margin-top:70px}
        .sign div{flex:1;border-top:1px solid #17324d;text-align:center;padding-top:5px;font:10px Helvetica,Arial,sans-serif;color:#52606d}
        .ft{margin-top:30px;font:9px Helvetica,Arial,sans-serif;color:#8b949d;text-align:center}
        @page{size:A4 ${isWide(doc) ? 'landscape' : 'portrait'};margin:14mm}
        @media print{body.preview{background:#fff;padding:0}.page{box-shadow:none!important;padding:0;max-width:none}h2{break-after:avoid}tr{break-inside:avoid}}`;

        return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${esc(doc.title)}</title><style>${css}</style></head>
        <body class="${preview ? 'preview' : ''}"><div class="page">
          <div class="hd">
            <div><div class="co">${esc(doc.company)}</div><h1>${esc(doc.title)}</h1>${doc.subtitle ? `<div class="sub">${esc(doc.subtitle)}</div>` : ''}</div>
            <div class="meta"><b>${esc(doc.period)}</b><br>Expresado en córdobas (C$)<br>Generado: ${esc(doc.generatedAt)}</div>
          </div>
          ${sections}${notes}${sign}
          <div class="ft">${esc(doc.company)} · ${esc(doc.title)} · Documento generado por Contalab</div>
        </div></body></html>`;
    }

    private renderWord(doc: ReportDocument): string {
        return this.renderHtml(doc, false).replace(
            '<html lang="es">',
            '<html lang="es" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
        );
    }


    /* ---------------------------------------------------------
       PDF
       --------------------------------------------------------- */

    buildPdf(doc: ReportDocument): jsPDF {

        const pdf = new jsPDF({
            orientation: isWide(doc) ? 'landscape' : 'portrait',
            unit: 'pt',
            format: 'a4'
        });

        const W = pdf.internal.pageSize.getWidth();
        const M = 40;

        pdf.setTextColor(82, 96, 109);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.text(doc.company.toUpperCase(), M, 42);

        pdf.setTextColor(23, 50, 77);
        pdf.setFontSize(17);
        pdf.text(doc.title, M, 62);

        if (doc.subtitle) {
            pdf.setFont('helvetica', 'italic');
            pdf.setFontSize(9);
            pdf.setTextColor(82, 96, 109);
            pdf.text(doc.subtitle, M, 76);
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setTextColor(23, 50, 77);
        pdf.text(doc.period, W - M, 48, { align: 'right' });
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(104, 115, 125);
        pdf.text('Expresado en córdobas (C$)', W - M, 60, { align: 'right' });
        pdf.text(`Generado: ${doc.generatedAt}`, W - M, 72, { align: 'right' });

        pdf.setDrawColor(23, 50, 77);
        pdf.setLineWidth(1.6);
        pdf.line(M, 86, W - M, 86);
        pdf.setLineWidth(0.5);
        pdf.line(M, 89, W - M, 89);

        let y = 104;

        for (const s of doc.sections) {

            if (s.title) {
                if (y > pdf.internal.pageSize.getHeight() - 90) { pdf.addPage(); y = 50; }
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(9);
                pdf.setTextColor(23, 50, 77);
                pdf.text(s.title.toUpperCase(), M, y);
                y += 6;
            }

            autoTable(pdf, {
                startY: y,
                margin: { left: M, right: M, bottom: 50 },
                theme: 'plain',
                head: [s.columns.map(c => c.label)],
                body: s.rows.map(r => s.columns.map((c, i) => {
                    const txt = formatValue(c, r.cells[c.key]);
                    return i === 0 && r.indent ? '\u00A0\u00A0\u00A0\u00A0'.repeat(r.indent) + txt : txt;
                })),
                styles: { font: 'helvetica', fontSize: 7.6, cellPadding: { top: 3, bottom: 3, left: 5, right: 5 }, textColor: [28, 39, 51], lineColor: [230, 233, 236], lineWidth: { bottom: 0.4 } },
                headStyles: { fillColor: [244, 246, 248], textColor: [23, 50, 77], fontStyle: 'bold', fontSize: 7, lineColor: [23, 50, 77], lineWidth: { top: 1, bottom: 1 } },
                columnStyles: Object.fromEntries(s.columns.map((c, i) => [i, { halign: c.align }])),
                didParseCell: (d: any) => {
                    if (d.section !== 'body') return;
                    const kind = s.rows[d.row.index]?.kind;
                    if (kind === 'group') { d.cell.styles.fontStyle = 'bold'; d.cell.styles.fillColor = [244, 246, 248]; d.cell.styles.textColor = [23, 50, 77]; }
                    if (kind === 'subtotal') { d.cell.styles.fontStyle = 'bold'; d.cell.styles.lineColor = [23, 50, 77]; d.cell.styles.lineWidth = { top: 0.8, bottom: 0.4 }; }
                    if (kind === 'total') { d.cell.styles.fontStyle = 'bold'; d.cell.styles.fillColor = [238, 241, 244]; d.cell.styles.textColor = [23, 50, 77]; d.cell.styles.lineColor = [23, 50, 77]; d.cell.styles.lineWidth = { top: 1, bottom: 1.4 }; }
                }
            });

            y = ((pdf as any).lastAutoTable?.finalY ?? y) + 8;

            if (s.note) {
                pdf.setFont('helvetica', 'italic');
                pdf.setFontSize(7.5);
                pdf.setTextColor(104, 115, 125);
                pdf.text(s.note, M, y + 4);
                y += 12;
            }

            y += 12;
        }

        if (doc.notes?.length) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7.5);
            pdf.setTextColor(82, 96, 109);
            doc.notes.forEach(n => {
                if (y > pdf.internal.pageSize.getHeight() - 60) { pdf.addPage(); y = 50; }
                pdf.text(n, M, y);
                y += 11;
            });
        }

        if (doc.signatures?.length) {
            const H = pdf.internal.pageSize.getHeight();
            if (y > H - 130) { pdf.addPage(); y = 60; }
            const gap = 30;
            const w = (W - M * 2 - gap * (doc.signatures.length - 1)) / doc.signatures.length;
            const sy = Math.max(y + 50, 0);
            doc.signatures.forEach((s, i) => {
                const x = M + i * (w + gap);
                pdf.setDrawColor(23, 50, 77);
                pdf.setLineWidth(0.6);
                pdf.line(x, sy, x + w, sy);
                pdf.setFontSize(8);
                pdf.text(s, x + w / 2, sy + 11, { align: 'center' });
            });
        }

        const pages = pdf.getNumberOfPages();
        const H = pdf.internal.pageSize.getHeight();

        for (let p = 1; p <= pages; p++) {
            pdf.setPage(p);
            pdf.setDrawColor(213, 218, 224);
            pdf.setLineWidth(0.5);
            pdf.line(M, H - 34, W - M, H - 34);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7.5);
            pdf.setTextColor(139, 148, 157);
            pdf.text(`${doc.company} · ${doc.title}`, M, H - 22);
            pdf.text(`Página ${p} de ${pages}`, W - M, H - 22, { align: 'right' });
        }

        return pdf;
    }

    /** URL de objeto para la vista previa en un iframe. Hay que revocarla con URL.revokeObjectURL. */
    pdfUrl(doc: ReportDocument): string {
        return URL.createObjectURL(this.buildPdf(doc).output('blob'));
    }

    /** Informe gráfico: cada gráfica como imagen PNG. */
    buildChartsPdf(
        meta: { company: string; title: string; period: string; generatedAt: string },
        charts: { title: string; png: string; ratio: number }[]
    ): jsPDF {

        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const W = pdf.internal.pageSize.getWidth();
        const H = pdf.internal.pageSize.getHeight();
        const M = 40;

        const header = () => {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(82, 96, 109);
            pdf.text(meta.company.toUpperCase(), M, 40);
            pdf.setFontSize(16);
            pdf.setTextColor(23, 50, 77);
            pdf.text(meta.title, M, 60);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8.5);
            pdf.text(meta.period, W - M, 46, { align: 'right' });
            pdf.setDrawColor(23, 50, 77);
            pdf.setLineWidth(1.4);
            pdf.line(M, 72, W - M, 72);
        };

        header();
        let y = 90;
        const w = W - M * 2;

        for (const c of charts) {
            const h = w * c.ratio;
            if (y + h + 28 > H - 50) { pdf.addPage(); header(); y = 90; }
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
            pdf.setTextColor(23, 50, 77);
            pdf.text(c.title.toUpperCase(), M, y);
            pdf.addImage(c.png, 'PNG', M, y + 8, w, h);
            y += h + 34;
        }

        const pages = pdf.getNumberOfPages();
        for (let p = 1; p <= pages; p++) {
            pdf.setPage(p);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7.5);
            pdf.setTextColor(139, 148, 157);
            pdf.text(`${meta.company} · Generado: ${meta.generatedAt}`, M, H - 22);
            pdf.text(`Página ${p} de ${pages}`, W - M, H - 22, { align: 'right' });
        }

        return pdf;
    }


    /* ---------------------------------------------------------
       EXCEL
       --------------------------------------------------------- */

    private async exportXlsx(
        doc: ReportDocument,
        filename: string
    ): Promise<void> {
        const workbook = new ExcelJS.Workbook();

        workbook.creator = doc.company;
        workbook.subject = doc.title;
        workbook.created = new Date();

        const perSheet = doc.sections.length <= 12;
        const usedNames = new Set<string>();

        const sheetName = (title: string): string => {
            const base =
                (title || 'Reporte')
                    .replace(/[\\/?*[\]:]/g, ' ')
                    .trim()
                    .slice(0, 31) || 'Hoja';

            let name = base;
            let index = 2;

            while (usedNames.has(name.toLowerCase())) {
                const suffix = ` ${index++}`;
                name = `${base.slice(0, 31 - suffix.length)}${suffix}`;
            }

            usedNames.add(name.toLowerCase());
            return name;
        };

        const raw = (
            column: ReportColumn,
            value: Cell,
            indent: number,
            first: boolean
        ): string | number => {
            if (value === null || value === undefined || value === '') {
                return '';
            }

            if (
                column.type === 'money' ||
                column.type === 'number' ||
                column.type === 'percent'
            ) {
                const number = Number(value);
                return Number.isFinite(number) ? number : String(value);
            }

            return first && indent
                ? '    '.repeat(indent) + String(value)
                : String(value);
        };

        const buildSheet = (
            sections: ReportSection[],
            title: string
        ): void => {
            const worksheet = workbook.addWorksheet(sheetName(title));

            worksheet.addRow([doc.company]);
            worksheet.addRow([doc.title]);
            worksheet.addRow([doc.period]);
            worksheet.addRow([`Generado: ${doc.generatedAt}`]);
            worksheet.addRow([]);

            worksheet.getRow(1).font = {
                bold: true,
                color: { argb: 'FF52606D' },
                size: 10
            };

            worksheet.getRow(2).font = {
                bold: true,
                color: { argb: 'FF17324D' },
                size: 16
            };

            worksheet.getRow(3).font = { italic: true };
            worksheet.getRow(4).font = {
                color: { argb: 'FF68737D' },
                size: 9
            };

            let maxCols = 1;

            for (const section of sections) {
                if (section.title) {
                    const row = worksheet.addRow([section.title]);

                    row.font = {
                        bold: true,
                        color: { argb: 'FF17324D' }
                    };
                }

                maxCols = Math.max(maxCols, section.columns.length);

                const header = worksheet.addRow(
                    section.columns.map(column => column.label)
                );

                header.font = {
                    bold: true,
                    color: { argb: 'FF17324D' }
                };

                header.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF4F6F8' }
                };

                header.eachCell(cell => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FF17324D' } },
                        bottom: { style: 'thin', color: { argb: 'FF17324D' } }
                    };
                });

                for (const reportRow of section.rows) {
                    const row = worksheet.addRow(
                        section.columns.map((column, index) =>
                            raw(
                                column,
                                reportRow.cells[column.key],
                                reportRow.indent ?? 0,
                                index === 0
                            )
                        )
                    );

                    row.eachCell((cell, columnIndex) => {
                        const column = section.columns[columnIndex - 1];

                        if (!column) return;

                        cell.alignment = {
                            horizontal: column.align,
                            vertical: 'middle'
                        };

                        if (column.type === 'money' && typeof cell.value === 'number') {
                            cell.numFmt = '#,##0.00;(#,##0.00);"-"';
                        }

                        if (column.type === 'number' && typeof cell.value === 'number') {
                            cell.numFmt = '#,##0.##';
                        }

                        if (column.type === 'percent' && typeof cell.value === 'number') {
                            cell.numFmt = '0.0"%"';
                        }

                        if (
                            reportRow.kind === 'group' ||
                            reportRow.kind === 'subtotal' ||
                            reportRow.kind === 'total'
                        ) {
                            cell.font = { bold: true };
                        }

                        if (reportRow.kind === 'total') {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFEEF1F4' }
                            };

                            cell.border = {
                                top: { style: 'thin', color: { argb: 'FF17324D' } },
                                bottom: { style: 'double', color: { argb: 'FF17324D' } }
                            };
                        }
                    });
                }

                if (section.note) {
                    const note = worksheet.addRow([section.note]);

                    note.font = {
                        italic: true,
                        color: { argb: 'FF68737D' },
                        size: 9
                    };
                }

                worksheet.addRow([]);
            }

            worksheet.columns = Array.from({ length: maxCols }, (_, index) => {
                let width = 12;

                worksheet.eachRow(row => {
                    const value = row.getCell(index + 1).value;

                    if (value !== null && value !== undefined) {
                        const text =
                            typeof value === 'object' && 'richText' in value
                                ? value.richText.map(part => part.text).join('')
                                : String(value);

                        width = Math.max(
                            width,
                            Math.min(text.length + 2, 46)
                        );
                    }
                });

                return {
                    width: index === 0 ? Math.max(width, 14) : width
                };
            });

            worksheet.views = [{ state: 'frozen', ySplit: 5 }];
        };

        if (perSheet && doc.sections.length > 0) {
            for (const section of doc.sections) {
                buildSheet([section], section.title ?? doc.title);
            }
        } else {
            buildSheet(doc.sections, 'Reporte');
        }

        const buffer = await workbook.xlsx.writeBuffer();

        this.download(
            new Blob([buffer as BlobPart], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }),
            filename
        );
    }


    /* ---------------------------------------------------------
       CSV / JSON / MARKDOWN
       --------------------------------------------------------- */

    private toCsv(doc: ReportDocument): string {

        const q = (v: unknown) => {
            const s = String(v ?? '');
            return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };

        const lines: string[] = [q(doc.company), q(doc.title), q(doc.period), ''];

        for (const s of doc.sections) {
            if (s.title) lines.push(q(s.title));
            lines.push(s.columns.map(c => q(c.label)).join(','));
            s.rows.forEach(r => lines.push(
                s.columns.map((c, i) => {
                    const v = r.cells[c.key];
                    if (v === null || v === undefined || v === '') return '';
                    if (c.type === 'money' || c.type === 'number' || c.type === 'percent') return String(Number(v));
                    return q(i === 0 && r.indent ? '  '.repeat(r.indent) + v : v);
                }).join(',')
            ));
            lines.push('');
        }

        return lines.join('\r\n');
    }

    private toJson(doc: ReportDocument): string {
        return JSON.stringify({
            empresa: doc.company,
            reporte: doc.title,
            periodo: doc.period,
            generado: doc.generatedAt,
            secciones: doc.sections.map(s => ({
                titulo: s.title ?? null,
                columnas: s.columns.map(c => ({ clave: c.key, etiqueta: c.label, tipo: c.type })),
                filas: s.rows.map(r => ({ tipo: r.kind ?? 'normal', nivel: r.indent ?? 0, ...r.cells }))
            })),
            notas: doc.notes ?? []
        }, null, 2);
    }

    private toMarkdown(doc: ReportDocument): string {

        const out: string[] = [`# ${doc.title}`, '', `**${doc.company}** · ${doc.period}`, ''];

        for (const s of doc.sections) {
            if (s.title) out.push(`## ${s.title}`, '');
            out.push(`| ${s.columns.map(c => c.label).join(' | ')} |`);
            out.push(`| ${s.columns.map(c => (c.align === 'right' ? '---:' : '---')).join(' | ')} |`);
            s.rows.forEach(r => {
                const cells = s.columns.map((c, i) => {
                    const t = formatValue(c, r.cells[c.key]).replace(/\|/g, '\\|');
                    const bold = r.kind && r.kind !== 'normal' && t ? `**${t}**` : t;
                    return i === 0 && r.indent ? '&nbsp;&nbsp;'.repeat(r.indent) + bold : bold;
                });
                out.push(`| ${cells.join(' | ')} |`);
            });
            out.push('');
            if (s.note) out.push(`_${s.note}_`, '');
        }

        return out.join('\n');
    }


    /* ---------------------------------------------------------
       GRÁFICAS (SVG / PNG)
       --------------------------------------------------------- */

    async svgToPng(svg: string, width: number, height: number, scale = 2): Promise<string> {

        const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
        const img = new Image();

        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('No se pudo renderizar la gráfica.'));
            img.src = url;
        });

        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        return canvas.toDataURL('image/png');
    }

    downloadDataUrl(dataUrl: string, filename: string): void {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }


    /* ---------------------------------------------------------
       IMPORTACIÓN (CSV, TSV, TXT, JSON, XLSX, XLS, ODS)
       --------------------------------------------------------- */

    async readFile(file: File): Promise<Record<string, any>[]> {

        const ext = (file.name.split('.').pop() ?? '').toLowerCase();

        if (ext === 'json') {
            const parsed = JSON.parse(await file.text());
            const list = Array.isArray(parsed)
                ? parsed
                : Object.values(parsed).find(v => Array.isArray(v)) as any[] | undefined;

            if (!list) throw new Error('El JSON debe ser un arreglo de objetos.');
            return list.filter(x => x && typeof x === 'object');
        }

        if (ext === 'xlsx') {
            const workbook = new ExcelJS.Workbook();

            await workbook.xlsx.load(await file.arrayBuffer());

            const worksheet = workbook.worksheets[0];

            if (!worksheet || worksheet.rowCount === 0) {
                return [];
            }

            const normalizeCell = (value: ExcelJS.CellValue): unknown => {
                if (value === null || value === undefined) {
                    return '';
                }

                if (value instanceof Date) {
                    return value.toISOString().slice(0, 10);
                }

                if (typeof value !== 'object') {
                    return value;
                }

                if ('richText' in value) {
                    return value.richText.map(part => part.text).join('');
                }

                if ('text' in value) {
                    return value.text;
                }

                if ('result' in value) {
                    return value.result ?? '';
                }

                if (
                    'hyperlink' in value &&
                    typeof value.hyperlink === 'string'
                ) {
                    return 'text' in value && typeof value.text === 'string'
                        ? value.text
                        : value.hyperlink;
                }

                return String(value);
            };

            const headerRow = worksheet.getRow(1);

            const headers = Array.from(
                { length: headerRow.cellCount },
                (_, index) =>
                    String(
                        normalizeCell(
                            headerRow.getCell(index + 1).value
                        )
                    ).trim()
            );

            const result: Record<string, unknown>[] = [];

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) {
                    return;
                }

                const record: Record<string, unknown> = {};

                headers.forEach((header, index) => {
                    if (header) {
                        record[header] = normalizeCell(
                            row.getCell(index + 1).value
                        );
                    }
                });

                if (
                    Object.values(record).some(
                        value => value !== '' && value !== null && value !== undefined
                    )
                ) {
                    result.push(record);
                }
            });

            return result;
        }

        if (['csv', 'tsv', 'txt'].includes(ext)) {
            const matrix = this.parseDelimited((await file.text()).replace(/^\ufeff/, ''));
            if (matrix.length < 2) return [];
            const headers = matrix[0].map(h => h.trim());
            return matrix.slice(1)
                .filter(r => r.some(c => c.trim() !== ''))
                .map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])));
        }

        throw new Error(`Formato .${ext} no soportado. Usa CSV, JSON o Excel.`);
    }

    private parseDelimited(text: string): string[][] {

        const first = text.split(/\r?\n/, 1)[0] ?? '';
        const delim = [',', ';', '\t', '|']
            .map(d => ({ d, n: first.split(d).length }))
            .sort((a, b) => b.n - a.n)[0].d;

        const rows: string[][] = [];
        let row: string[] = [], cur = '', quoted = false;

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];

            if (quoted) {
                if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
                else if (ch === '"') quoted = false;
                else cur += ch;
            } else if (ch === '"') quoted = true;
            else if (ch === delim) { row.push(cur); cur = ''; }
            else if (ch === '\n' || ch === '\r') {
                if (ch === '\r' && text[i + 1] === '\n') i++;
                row.push(cur); rows.push(row); row = []; cur = '';
            } else cur += ch;
        }

        if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
        return rows;
    }

    async downloadTemplate(
        name: string,
        headers: string[],
        example: (string | number)[],
        format: 'csv' | 'xlsx'
    ): Promise<void> {
        if (format === 'csv') {
            const escapeCsv = (value: string | number): string => {
                const text = String(value);

                return /[",\r\n;]/.test(text)
                    ? `"${text.replace(/"/g, '""')}"`
                    : text;
            };

            const content = [
                headers.map(escapeCsv).join(','),
                headers.map((_, index) => escapeCsv(example[index] ?? '')).join(',')
            ].join('\r\n');

            this.download(
                new Blob(['\ufeff', content], {
                    type: 'text/csv;charset=utf-8'
                }),
                `plantilla_${name}.csv`
            );

            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Plantilla');

        const headerRow = worksheet.addRow(headers);

        headerRow.font = {
            bold: true,
            color: { argb: 'FF17324D' }
        };

        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF4F6F8' }
        };

        worksheet.addRow(
            headers.map((_, index) => example[index] ?? '')
        );

        worksheet.columns = headers.map(header => ({
            width: Math.max(14, header.length + 2)
        }));

        const buffer = await workbook.xlsx.writeBuffer();

        this.download(
            new Blob([buffer as BlobPart], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }),
            `plantilla_${name}.xlsx`
        );
    }
}