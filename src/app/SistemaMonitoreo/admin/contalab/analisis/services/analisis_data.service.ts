import { Injectable, inject, signal } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

import { ClientesService, ClientesResponse } from '../../../../../services/clientes.service';
import { ProductosService, ProductosResponse } from '../../../../../services/productos.service';
import { CategoriaProductosService, CategoriaProductosResponse } from '../../../../../services/categoria_productos.service';
import { PedidosService, PedidosResponse } from '../../../../../services/pedidos.service';
import { DetallePedidoService, DetallePedidoResponse } from '../../../../../services/detalle_pedido.service';
import { FacturasService, FacturasResponse } from '../../../../../services/facturas.service';
import { DetalleFacturaService, DetalleFacturaResponse } from '../../../../../services/detalle_factura.service';
import { CobrosService, CobrosResponse } from '../../../../../services/cobros.service';
import { DetalleCobroService, DetalleCobroResponse } from '../../../../../services/detalle_cobro.service';
import { ProveedoresService, ProveedoresResponse } from '../../../../../services/proveedores.service';
import { ComprasService, ComprasResponse } from '../../../../../services/compras.service';
import { DetalleCompraService, DetalleCompraResponse } from '../../../../../services/detalle_compra.service';
import { PagosProveedoresService, PagosProveedoresResponse } from '../../../../../services/pagos_proveedores.service';
import { DetallePagoProveedorService, DetallePagoProveedorResponse } from '../../../../../services/detalle_pago_proveedor.service';
import { NominaService, NominaResponse } from '../../../../../services/nomina.service';
import { DetalleNominaService, DetalleNominaResponse } from '../../../../../services/detalle_nomina.service';
import { EmpleadosService, EmpleadosResponse } from '../../../../../services/empleados.service';
import { CatalogoCuentasService, CatalogoCuentasResponse } from '../../../../../services/catalogo_cuentas.service';
import { AsientosContablesService, AsientosContablesResponse } from '../../../../../services/asientos_contables.service';
import { DetallesAsientosContablesService, DetallesAsientosContablesResponse } from '../../../../../services/detalles_asientos_contables.service';

import { C, R, ReportColumn, ReportDocument, ReportRow, ReportSection, dmy } from './analisis_export.service';


/* =============================================================
   DATOS
   ============================================================= */

export interface AnalisisData {
    clientes: ClientesResponse[];
    productos: ProductosResponse[];
    categorias: CategoriaProductosResponse[];
    pedidos: PedidosResponse[];
    detallesPedido: DetallePedidoResponse[];
    facturas: FacturasResponse[];
    detallesFactura: DetalleFacturaResponse[];
    cobros: CobrosResponse[];
    detallesCobro: DetalleCobroResponse[];
    proveedores: ProveedoresResponse[];
    compras: ComprasResponse[];
    detallesCompra: DetalleCompraResponse[];
    pagos: PagosProveedoresResponse[];
    detallesPago: DetallePagoProveedorResponse[];
    nominas: NominaResponse[];
    detallesNomina: DetalleNominaResponse[];
    empleados: EmpleadosResponse[];
    cuentas: CatalogoCuentasResponse[];
    asientos: AsientosContablesResponse[];
    detallesAsientos: DetallesAsientosContablesResponse[];
}

export interface Filtro {
    desde: string;   // YYYY-MM-DD
    hasta: string;   // YYYY-MM-DD
    nivel: number;   // nivel de detalle en estados financieros
}

export interface ReportDef {
    id: string;
    nombre: string;
    descripcion: string;
    grupo: string;
    icon: string;
    modo: 'rango' | 'corte';
}

export const REPORTES: ReportDef[] = [
    { id: 'libro-diario', nombre: 'Libro diario', descripcion: 'Asientos contables en orden cronológico con sus movimientos.', grupo: 'Contabilidad', icon: 'lucide:book-open', modo: 'rango' },
    { id: 'libro-mayor', nombre: 'Libro mayor', descripcion: 'Movimientos y saldo corrido de cada cuenta.', grupo: 'Contabilidad', icon: 'lucide:book-text', modo: 'rango' },
    { id: 'catalogo-cuentas', nombre: 'Catálogo de cuentas', descripcion: 'Plan de cuentas con su jerarquía y naturaleza.', grupo: 'Contabilidad', icon: 'lucide:folder-tree', modo: 'corte' },
    { id: 'ventas-periodo', nombre: 'Ventas del periodo', descripcion: 'Facturas emitidas, cobrado y saldo por factura.', grupo: 'Ventas', icon: 'lucide:receipt-text', modo: 'rango' },
    { id: 'ventas-producto', nombre: 'Ventas por producto', descripcion: 'Unidades, ventas, costo y margen por producto.', grupo: 'Ventas', icon: 'lucide:package', modo: 'rango' },
    { id: 'pedidos', nombre: 'Pedidos', descripcion: 'Seguimiento de pedidos y su estado de envío.', grupo: 'Ventas', icon: 'lucide:route', modo: 'rango' },
    { id: 'cobros', nombre: 'Cobros recibidos', descripcion: 'Cobros registrados por cliente y método.', grupo: 'Ventas', icon: 'lucide:hand-coins', modo: 'rango' },
    { id: 'cuentas-por-cobrar', nombre: 'Cuentas por cobrar', descripcion: 'Antigüedad de saldos de clientes.', grupo: 'Ventas', icon: 'lucide:clock-arrow-up', modo: 'corte' },
    { id: 'compras-periodo', nombre: 'Compras del periodo', descripcion: 'Compras a proveedores, pagado y saldo.', grupo: 'Compras', icon: 'lucide:shopping-cart', modo: 'rango' },
    { id: 'pagos-proveedores', nombre: 'Pagos a proveedores', descripcion: 'Pagos realizados por proveedor y método.', grupo: 'Compras', icon: 'lucide:credit-card', modo: 'rango' },
    { id: 'cuentas-por-pagar', nombre: 'Cuentas por pagar', descripcion: 'Antigüedad de saldos con proveedores.', grupo: 'Compras', icon: 'lucide:clock-arrow-down', modo: 'corte' },
    { id: 'nomina', nombre: 'Planilla de nómina', descripcion: 'Ingresos, deducciones, neto y aportes patronales.', grupo: 'Nómina', icon: 'lucide:users-round', modo: 'rango' },
    { id: 'productos-margenes', nombre: 'Productos y márgenes', descripcion: 'Lista de precios, costos y margen unitario.', grupo: 'Inventario', icon: 'lucide:tags', modo: 'corte' }
];

export const ESTADOS: ReportDef[] = [
    { id: 'balance-general', nombre: 'Balance general', descripcion: 'Situación financiera: activos, pasivos y patrimonio.', grupo: 'Estados', icon: 'lucide:scale', modo: 'corte' },
    { id: 'estado-resultados', nombre: 'Estado de resultados', descripcion: 'Ingresos, costos, gastos y utilidad del periodo.', grupo: 'Estados', icon: 'lucide:trending-up', modo: 'rango' },
    { id: 'balanza-comprobacion', nombre: 'Balanza de comprobación', descripcion: 'Sumas y saldos de las cuentas de movimiento.', grupo: 'Estados', icon: 'lucide:list-checks', modo: 'corte' },
    { id: 'flujo-efectivo', nombre: 'Flujo de efectivo', descripcion: 'Entradas y salidas de caja y bancos por origen.', grupo: 'Estados', icon: 'lucide:waves', modo: 'rango' }
];


/* =============================================================
   UTILIDADES
   ============================================================= */

export const num = (v: unknown): number => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
export const ymd = (v: unknown): string => !v ? '' : typeof v === 'string' ? v.slice(0, 10) : new Date(v as any).toISOString().slice(0, 10);
export const r2 = (x: number): number => Math.round(x * 100) / 100;
const anulado = (e: unknown): boolean => /ANUL|CANCEL/i.test(String(e ?? ''));
const days = (a: string, b: string): number => Math.floor((Date.parse(b) - Date.parse(a)) / 86400000);
const byCode = (a: CatalogoCuentasResponse, b: CatalogoCuentasResponse) =>
    a.codigo_cuenta.localeCompare(b.codigo_cuenta, undefined, { numeric: true });

const SIGNO: Record<string, number> = { ACTIVO: 1, COSTO: 1, GASTO: 1, PASIVO: -1, PATRIMONIO: -1, INGRESO: -1 };

const ORIGEN: Record<string, string> = {
    VENTA: 'Ventas y cobros a clientes',
    COMPRA: 'Compras y pagos a proveedores',
    CAJA: 'Movimientos de caja',
    BANCO: 'Movimientos bancarios',
    NOMINA: 'Pago de nómina',
    AJUSTE: 'Ajustes contables',
    DEPRECIACION: 'Depreciación',
    CIERRE: 'Asientos de cierre'
};

interface Line { asiento_id: number; cuenta_id: number; fecha: string; debe: number; haber: number; origen: string; concepto: string; }
type Sum = { debe: number; haber: number };


/* =============================================================
   MOTOR: construye reportes, estados y datos de gráficas
   ============================================================= */

export class AnalisisEngine {

    readonly clientes = new Map<number, ClientesResponse>();
    readonly productos = new Map<number, ProductosResponse>();
    readonly categorias = new Map<number, CategoriaProductosResponse>();
    readonly proveedores = new Map<number, ProveedoresResponse>();
    readonly empleados = new Map<number, EmpleadosResponse>();
    readonly cuentas = new Map<number, CatalogoCuentasResponse>();
    readonly hijos = new Map<number, CatalogoCuentasResponse[]>();
    readonly cuentasOrdenadas: CatalogoCuentasResponse[];

    readonly facturaTotal = new Map<number, number>();
    readonly facturaCobrado = new Map<number, number>();
    readonly cobroMonto = new Map<number, number>();
    readonly compraTotal = new Map<number, number>();
    readonly compraPagado = new Map<number, number>();
    readonly pagoMonto = new Map<number, number>();
    readonly pedidoTotal = new Map<number, number>();
    readonly lines: Line[] = [];

    constructor(readonly d: AnalisisData, readonly f: Filtro, readonly empresa: string) {

        d.clientes.forEach(x => this.clientes.set(x.cliente_id, x));
        d.productos.forEach(x => this.productos.set(x.producto_id, x));
        d.categorias.forEach(x => this.categorias.set(x.categoria_id, x));
        d.proveedores.forEach(x => this.proveedores.set(x.proveedor_id, x));
        d.empleados.forEach(x => this.empleados.set(x.empleado_id, x));
        d.cuentas.forEach(x => this.cuentas.set(x.cuenta_id, x));

        this.cuentasOrdenadas = [...d.cuentas].sort(byCode);

        d.cuentas.forEach(c => {
            if (c.cuenta_padre_id !== null) {
                const l = this.hijos.get(Number(c.cuenta_padre_id)) ?? [];
                l.push(c);
                this.hijos.set(Number(c.cuenta_padre_id), l);
            }
        });

        const add = (m: Map<number, number>, k: number, v: number) => m.set(k, (m.get(k) ?? 0) + v);

        d.detallesFactura.forEach(x => add(this.facturaTotal, x.factura_id, num(x.cantidad) * num(x.precio_unitario)));
        d.detallesCompra.forEach(x => add(this.compraTotal, x.compra_id, num(x.cantidad) * num(x.costo_unitario)));
        d.detallesPedido.forEach(x => add(this.pedidoTotal, x.pedido_id, num(x.cantidad) * num(x.precio_unitario)));

        const cobrosOk = new Set(d.cobros.filter(c => !anulado(c.estado)).map(c => c.cobro_id));
        d.detallesCobro.forEach(x => {
            add(this.cobroMonto, x.cobro_id, num(x.monto_aplicado));
            if (cobrosOk.has(x.cobro_id)) add(this.facturaCobrado, x.factura_id, num(x.monto_aplicado));
        });

        const pagosOk = new Set(d.pagos.filter(p => !anulado(p.estado)).map(p => p.pago_id));
        d.detallesPago.forEach(x => {
            add(this.pagoMonto, x.pago_id, num(x.monto_aplicado));
            if (pagosOk.has(x.pago_id)) add(this.compraPagado, x.compra_id, num(x.monto_aplicado));
        });

        const asientos = new Map<number, AsientosContablesResponse>();
        d.asientos.forEach(a => asientos.set(a.asiento_id, a));

        d.detallesAsientos.forEach(x => {
            const a = asientos.get(x.asiento_id);
            if (!a) return;
            this.lines.push({
                asiento_id: x.asiento_id, cuenta_id: x.cuenta_id, fecha: ymd(a.fecha),
                debe: num(x.debe), haber: num(x.haber), origen: a.tipo_origen, concepto: a.concepto
            });
        });
    }


    /* ---------- helpers de estructura ---------- */

    private inR = (v: unknown) => { const t = ymd(v); return t >= this.f.desde && t <= this.f.hasta; };

    private doc(id: string, title: string, subtitle: string, modo: 'rango' | 'corte', sections: ReportSection[], notes?: string[]): ReportDocument {
        return {
            id, title, subtitle,
            company: this.empresa,
            period: modo === 'rango' ? `Del ${dmy(this.f.desde)} al ${dmy(this.f.hasta)}` : `Al ${dmy(this.f.hasta)}`,
            generatedAt: new Date().toLocaleString('es-NI'),
            sections, notes
        };
    }

    clienteNombre(id: number): string {
        const c = this.clientes.get(id);
        if (!c) return `Cliente #${id}`;
        return [c.nombre_cliente, c.apellido_cliente].filter(Boolean).join(' ') + (c.nombre_empresa ? ` (${c.nombre_empresa})` : '');
    }

    proveedorNombre(id: number): string {
        return this.proveedores.get(id)?.nombre_empresa ?? `Proveedor #${id}`;
    }

    empleadoNombre(id: number): string {
        const e = this.empleados.get(id);
        return e ? `Empleado #${id} · ${e.cargo}` : `Empleado #${id}`;
    }

    private sumaTotal(rows: ReportRow[], keys: string[], label: Record<string, string>): ReportRow {
        const cells: Record<string, number | string> = { ...label };
        keys.forEach(k => cells[k] = r2(rows.reduce((s, r) => s + num(r.cells[k]), 0)));
        return R(cells, 'total');
    }

    build(id: string): ReportDocument {
        switch (id) {
            case 'libro-diario': return this.libroDiario();
            case 'libro-mayor': return this.libroMayor();
            case 'catalogo-cuentas': return this.catalogo();
            case 'ventas-periodo': return this.ventasPeriodo();
            case 'ventas-producto': return this.ventasProducto();
            case 'pedidos': return this.pedidos();
            case 'cobros': return this.cobros();
            case 'cuentas-por-cobrar': return this.antiguedad('cobrar');
            case 'compras-periodo': return this.comprasPeriodo();
            case 'pagos-proveedores': return this.pagos();
            case 'cuentas-por-pagar': return this.antiguedad('pagar');
            case 'nomina': return this.nomina();
            case 'productos-margenes': return this.margenes();
            case 'balance-general': return this.balanceGeneral();
            case 'estado-resultados': return this.estadoResultados();
            case 'balanza-comprobacion': return this.balanza();
            case 'flujo-efectivo': return this.flujoEfectivo();
            default: return this.doc(id, 'Reporte', '', 'rango', []);
        }
    }


    /* =========================================================
       CONTABILIDAD
       ========================================================= */

    private cuentaLabel(id: number): string {
        const c = this.cuentas.get(id);
        return c ? `${c.codigo_cuenta} · ${c.nombre_cuenta}` : `Cuenta #${id}`;
    }

    private libroDiario(): ReportDocument {

        const asientos = this.d.asientos
            .filter(a => this.inR(a.fecha))
            .sort((a, b) => ymd(a.fecha).localeCompare(ymd(b.fecha)) || a.asiento_id - b.asiento_id);

        const rows: ReportRow[] = [];
        let td = 0, th = 0;

        for (const a of asientos) {
            const ls = this.lines.filter(l => l.asiento_id === a.asiento_id);
            rows.push(R({ fecha: ymd(a.fecha), ref: `AS-${String(a.asiento_id).padStart(5, '0')}`, cuenta: `${a.concepto} (${a.tipo_origen})` }, 'group'));
            ls.forEach(l => {
                rows.push(R({ cuenta: this.cuentaLabel(l.cuenta_id), debe: l.debe, haber: l.haber }, 'normal', 1));
                td += l.debe; th += l.haber;
            });
        }

        if (rows.length) rows.push(R({ cuenta: 'TOTAL DEL PERIODO', debe: r2(td), haber: r2(th) }, 'total'));

        return this.doc('libro-diario', 'Libro diario', 'Registro cronológico de asientos contables', 'rango', [{
            columns: [C('fecha', 'Fecha', 'date'), C('ref', 'Asiento'), C('cuenta', 'Cuenta / Concepto'), C('debe', 'Debe', 'money'), C('haber', 'Haber', 'money')],
            rows
        }], [Math.abs(td - th) < 0.005 ? 'Partida doble verificada: total debe = total haber.' : `Atención: diferencia entre debe y haber de C$ ${r2(td - th)}.`]);
    }

    private libroMayor(): ReportDocument {

        const sections: ReportSection[] = [];

        for (const c of this.cuentasOrdenadas.filter(x => x.permite_movimiento)) {

            const ls = this.lines.filter(l => l.cuenta_id === c.cuenta_id);
            if (!ls.length) continue;

            const sg = c.naturaleza === 'DEUDORA' ? 1 : -1;
            const apertura = ls.filter(l => l.fecha < this.f.desde).reduce((s, l) => s + sg * (l.debe - l.haber), 0);
            const periodo = ls.filter(l => this.inR(l.fecha)).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.asiento_id - b.asiento_id);

            if (!periodo.length && Math.abs(apertura) < 0.005) continue;

            let saldo = apertura, td = 0, th = 0;
            const rows: ReportRow[] = [R({ concepto: 'Saldo inicial', saldo: r2(apertura) }, 'subtotal')];

            periodo.forEach(l => {
                saldo += sg * (l.debe - l.haber); td += l.debe; th += l.haber;
                rows.push(R({ fecha: l.fecha, ref: `AS-${String(l.asiento_id).padStart(5, '0')}`, concepto: l.concepto, debe: l.debe, haber: l.haber, saldo: r2(saldo) }));
            });

            rows.push(R({ concepto: 'Saldo final', debe: r2(td), haber: r2(th), saldo: r2(saldo) }, 'total'));

            sections.push({
                title: `${c.codigo_cuenta} — ${c.nombre_cuenta} (${c.naturaleza.toLowerCase()})`,
                columns: [C('fecha', 'Fecha', 'date'), C('ref', 'Asiento'), C('concepto', 'Concepto'), C('debe', 'Debe', 'money'), C('haber', 'Haber', 'money'), C('saldo', 'Saldo', 'money')],
                rows
            });
        }

        return this.doc('libro-mayor', 'Libro mayor', 'Movimientos por cuenta con saldo corrido', 'rango', sections);
    }

    private catalogo(): ReportDocument {
        const rows = this.cuentasOrdenadas.map(c => R({
            codigo: c.codigo_cuenta, cuenta: c.nombre_cuenta, tipo: c.tipo_cuenta, naturaleza: c.naturaleza,
            mov: c.permite_movimiento ? 'Sí' : 'No', estado: c.estado ? 'Activa' : 'Inactiva'
        }, c.permite_movimiento ? 'normal' : 'group', c.nivel_cuenta - 1));

        return this.doc('catalogo-cuentas', 'Catálogo de cuentas', 'Plan de cuentas contable', 'corte', [{
            columns: [C('codigo', 'Código'), C('cuenta', 'Cuenta'), C('tipo', 'Tipo'), C('naturaleza', 'Naturaleza'), C('mov', 'Movimiento', 'text', 'center'), C('estado', 'Estado', 'text', 'center')],
            rows
        }]);
    }


    /* =========================================================
       ESTADOS FINANCIEROS
       ========================================================= */

    private sums(pred: (l: Line) => boolean): Map<number, Sum> {
        const m = new Map<number, Sum>();
        for (const l of this.lines) {
            if (!pred(l)) continue;
            const s = m.get(l.cuenta_id) ?? { debe: 0, haber: 0 };
            s.debe += l.debe; s.haber += l.haber;
            m.set(l.cuenta_id, s);
        }
        return m;
    }

    private rollup(own: Map<number, Sum>): Map<number, Sum> {
        const out = new Map<number, Sum>();
        const walk = (id: number): Sum => {
            const hit = out.get(id);
            if (hit) return hit;
            const o = own.get(id) ?? { debe: 0, haber: 0 };
            const t = { debe: o.debe, haber: o.haber };
            out.set(id, t);
            for (const ch of this.hijos.get(id) ?? []) { const s = walk(ch.cuenta_id); t.debe += s.debe; t.haber += s.haber; }
            return t;
        };
        this.d.cuentas.forEach(c => walk(c.cuenta_id));
        return out;
    }

    private net(s?: Sum): number { return s ? s.debe - s.haber : 0; }

    private tipoNeto(tipo: string, rolled: Map<number, Sum>): number {
        return this.d.cuentas
            .filter(c => c.tipo_cuenta === tipo && (c.cuenta_padre_id === null || this.cuentas.get(Number(c.cuenta_padre_id))?.tipo_cuenta !== tipo))
            .reduce((s, c) => s + this.net(rolled.get(c.cuenta_id)), 0);
    }

    private filasTipo(tipo: string, rolled: Map<number, Sum>): ReportRow[] {
        const rows: ReportRow[] = [];
        for (const c of this.cuentasOrdenadas) {
            if (c.tipo_cuenta !== tipo || c.nivel_cuenta > this.f.nivel) continue;
            const s = rolled.get(c.cuenta_id);
            if (!s || (Math.abs(s.debe) < 0.005 && Math.abs(s.haber) < 0.005)) continue;
            const conHijos = (this.hijos.get(c.cuenta_id)?.length ?? 0) > 0 && c.nivel_cuenta < this.f.nivel;
            rows.push(R({ codigo: c.codigo_cuenta, cuenta: c.nombre_cuenta, saldo: r2(SIGNO[tipo] * this.net(s)) }, conHijos ? 'group' : 'normal', c.nivel_cuenta - 1));
        }
        return rows;
    }

    resumen() {
        const acum = this.rollup(this.sums(l => l.fecha <= this.f.hasta));
        const per = this.rollup(this.sums(l => this.inR(l.fecha)));

        const activo = SIGNO['ACTIVO'] * this.tipoNeto('ACTIVO', acum);
        const pasivo = SIGNO['PASIVO'] * this.tipoNeto('PASIVO', acum);
        const patrimonioBase = SIGNO['PATRIMONIO'] * this.tipoNeto('PATRIMONIO', acum);
        const resultadoAcum = -this.tipoNeto('INGRESO', acum) - this.tipoNeto('COSTO', acum) - this.tipoNeto('GASTO', acum);

        const ingresos = -this.tipoNeto('INGRESO', per);
        const costos = this.tipoNeto('COSTO', per);
        const gastos = this.tipoNeto('GASTO', per);

        return {
            activo: r2(activo), pasivo: r2(pasivo), patrimonioBase: r2(patrimonioBase), resultadoAcum: r2(resultadoAcum),
            patrimonio: r2(patrimonioBase + resultadoAcum), cuadre: r2(activo - pasivo - patrimonioBase - resultadoAcum),
            ingresos: r2(ingresos), costos: r2(costos), gastos: r2(gastos), utilidad: r2(ingresos - costos - gastos),
            acum, per
        };
    }

    private balanceGeneral(): ReportDocument {

        const r = this.resumen();
        const cols = [C('codigo', 'Código'), C('cuenta', 'Cuenta'), C('saldo', 'Saldo', 'money')];
        const rows: ReportRow[] = [];

        rows.push(R({ cuenta: 'ACTIVOS' }, 'group'), ...this.filasTipo('ACTIVO', r.acum), R({ cuenta: 'TOTAL ACTIVOS', saldo: r.activo }, 'total'));
        rows.push(R({ cuenta: 'PASIVOS' }, 'group'), ...this.filasTipo('PASIVO', r.acum), R({ cuenta: 'TOTAL PASIVOS', saldo: r.pasivo }, 'subtotal'));
        rows.push(R({ cuenta: 'PATRIMONIO' }, 'group'), ...this.filasTipo('PATRIMONIO', r.acum));
        rows.push(R({ cuenta: 'Resultado del ejercicio (acumulado)', saldo: r.resultadoAcum }, 'normal', 1));
        rows.push(R({ cuenta: 'TOTAL PATRIMONIO', saldo: r.patrimonio }, 'subtotal'));
        rows.push(R({ cuenta: 'TOTAL PASIVOS + PATRIMONIO', saldo: r2(r.pasivo + r.patrimonio) }, 'total'));

        return this.doc('balance-general', 'Balance general', 'Estado de situación financiera', 'corte', [{ columns: cols, rows }], [
            Math.abs(r.cuadre) < 0.005
                ? 'Ecuación contable verificada: Activos = Pasivos + Patrimonio.'
                : `Atención: el balance no cuadra (diferencia de C$ ${r.cuadre.toLocaleString('es-NI')}). Revise los asientos del periodo.`,
            `El resultado del ejercicio corresponde a ingresos menos costos y gastos acumulados al ${dmy(this.f.hasta)}.`
        ]);
    }

    private estadoResultados(): ReportDocument {

        const r = this.resumen();
        const cols = [C('codigo', 'Código'), C('cuenta', 'Cuenta'), C('saldo', 'Monto', 'money'), C('pct', '% de ingresos', 'percent')];
        const pct = (v: number) => (r.ingresos ? (v / r.ingresos) * 100 : null);
        const withPct = (rows: ReportRow[]) => rows.map(x => ({ ...x, cells: { ...x.cells, pct: pct(num(x.cells['saldo'])) } }));

        const rows: ReportRow[] = [
            R({ cuenta: 'INGRESOS' }, 'group'), ...withPct(this.filasTipo('INGRESO', r.per)), R({ cuenta: 'TOTAL INGRESOS', saldo: r.ingresos, pct: pct(r.ingresos) }, 'subtotal'),
            R({ cuenta: 'COSTOS' }, 'group'), ...withPct(this.filasTipo('COSTO', r.per)), R({ cuenta: 'TOTAL COSTOS', saldo: r.costos, pct: pct(r.costos) }, 'subtotal'),
            R({ cuenta: 'UTILIDAD BRUTA', saldo: r2(r.ingresos - r.costos), pct: pct(r.ingresos - r.costos) }, 'total'),
            R({ cuenta: 'GASTOS' }, 'group'), ...withPct(this.filasTipo('GASTO', r.per)), R({ cuenta: 'TOTAL GASTOS', saldo: r.gastos, pct: pct(r.gastos) }, 'subtotal'),
            R({ cuenta: r.utilidad >= 0 ? 'UTILIDAD DEL PERIODO' : 'PÉRDIDA DEL PERIODO', saldo: r.utilidad, pct: pct(r.utilidad) }, 'total')
        ];

        return this.doc('estado-resultados', 'Estado de resultados', 'Estado de ganancias y pérdidas', 'rango', [{ columns: cols, rows }],
            ['Cifras antes de impuesto sobre la renta, salvo que este se registre como gasto en el catálogo.']);
    }

    private balanza(): ReportDocument {

        const acum = this.sums(l => l.fecha <= this.f.hasta);
        const rows: ReportRow[] = [];
        let d = 0, h = 0, sd = 0, sa = 0;

        for (const c of this.cuentasOrdenadas) {
            if (!c.permite_movimiento) continue;
            const s = acum.get(c.cuenta_id);
            if (!s) continue;
            const n = s.debe - s.haber;
            const deudor = n > 0 ? n : 0, acreedor = n < 0 ? -n : 0;
            d += s.debe; h += s.haber; sd += deudor; sa += acreedor;
            rows.push(R({ codigo: c.codigo_cuenta, cuenta: c.nombre_cuenta, tipo: c.tipo_cuenta, debe: r2(s.debe), haber: r2(s.haber), deudor: r2(deudor), acreedor: r2(acreedor) }));
        }

        if (rows.length) rows.push(R({ cuenta: 'SUMAS IGUALES', debe: r2(d), haber: r2(h), deudor: r2(sd), acreedor: r2(sa) }, 'total'));

        return this.doc('balanza-comprobacion', 'Balanza de comprobación', 'Sumas y saldos acumulados de cuentas de movimiento', 'corte', [{
            columns: [C('codigo', 'Código'), C('cuenta', 'Cuenta'), C('tipo', 'Tipo'), C('debe', 'Suma debe', 'money'), C('haber', 'Suma haber', 'money'), C('deudor', 'Saldo deudor', 'money'), C('acreedor', 'Saldo acreedor', 'money')],
            rows
        }], [Math.abs(sd - sa) < 0.005 ? 'La balanza cuadra: saldos deudores = saldos acreedores.' : `Atención: diferencia de C$ ${r2(sd - sa)} entre saldos deudores y acreedores.`]);
    }

    private flujoEfectivo(): ReportDocument {

        const cash = new Set(this.d.cuentas
            .filter(c => c.tipo_cuenta === 'ACTIVO' && c.permite_movimiento && /caja|banco|efectivo/i.test(c.nombre_cuenta))
            .map(c => c.cuenta_id));

        const cols = [C('concepto', 'Concepto'), C('entradas', 'Entradas', 'money'), C('salidas', 'Salidas', 'money'), C('neto', 'Neto', 'money')];

        if (!cash.size) {
            return this.doc('flujo-efectivo', 'Flujo de efectivo', 'Entradas y salidas de caja y bancos', 'rango', [{ columns: cols, rows: [] }],
                ['No se encontraron cuentas de efectivo. Se buscan cuentas de activo con movimiento cuyo nombre contenga "caja", "banco" o "efectivo".']);
        }

        const apertura = this.lines.filter(l => cash.has(l.cuenta_id) && l.fecha < this.f.desde).reduce((s, l) => s + l.debe - l.haber, 0);
        const cierre = this.lines.filter(l => cash.has(l.cuenta_id) && l.fecha <= this.f.hasta).reduce((s, l) => s + l.debe - l.haber, 0);

        const porAsiento = new Map<number, { origen: string; neto: number }>();
        this.lines.filter(l => cash.has(l.cuenta_id) && this.inR(l.fecha)).forEach(l => {
            const x = porAsiento.get(l.asiento_id) ?? { origen: l.origen, neto: 0 };
            x.neto += l.debe - l.haber;
            porAsiento.set(l.asiento_id, x);
        });

        const porOrigen = new Map<string, { e: number; s: number }>();
        porAsiento.forEach(x => {
            const o = porOrigen.get(x.origen) ?? { e: 0, s: 0 };
            if (x.neto > 0) o.e += x.neto; else o.s += -x.neto;
            porOrigen.set(x.origen, o);
        });

        const rows: ReportRow[] = [R({ concepto: 'Saldo de efectivo al inicio del periodo', neto: r2(apertura) }, 'subtotal')];
        let te = 0, ts = 0;

        porOrigen.forEach((o, k) => {
            te += o.e; ts += o.s;
            rows.push(R({ concepto: ORIGEN[k] ?? k, entradas: r2(o.e), salidas: r2(o.s), neto: r2(o.e - o.s) }, 'normal', 1));
        });

        rows.push(R({ concepto: 'VARIACIÓN NETA DE EFECTIVO', entradas: r2(te), salidas: r2(ts), neto: r2(te - ts) }, 'subtotal'));
        rows.push(R({ concepto: 'SALDO DE EFECTIVO AL FINAL DEL PERIODO', neto: r2(cierre) }, 'total'));

        return this.doc('flujo-efectivo', 'Flujo de efectivo', 'Entradas y salidas de caja y bancos por origen', 'rango', [{ columns: cols, rows }],
            ['Método directo simplificado: se calcula con los asientos que afectan cuentas de caja, bancos o efectivo, agrupados por su origen.']);
    }


    /* =========================================================
       VENTAS
       ========================================================= */

    private facturasVigentes() { return this.d.facturas.filter(f => !anulado(f.estado)); }

    private ventasPeriodo(): ReportDocument {

        const rows = this.facturasVigentes()
            .filter(f => this.inR(f.fecha))
            .sort((a, b) => ymd(a.fecha).localeCompare(ymd(b.fecha)) || a.factura_id - b.factura_id)
            .map(f => {
                const t = this.facturaTotal.get(f.factura_id) ?? 0, c = this.facturaCobrado.get(f.factura_id) ?? 0;
                return R({ factura: `F-${f.factura_id}`, fecha: ymd(f.fecha), cliente: this.clienteNombre(f.cliente_id), pedido: `#${f.pedido_id}`, estado: f.estado, total: r2(t), cobrado: r2(c), saldo: r2(t - c) });
            });

        if (rows.length) rows.push(this.sumaTotal(rows, ['total', 'cobrado', 'saldo'], { factura: 'TOTAL' }));

        return this.doc('ventas-periodo', 'Ventas del periodo', 'Facturas emitidas', 'rango', [{
            columns: [C('factura', 'Factura'), C('fecha', 'Fecha', 'date'), C('cliente', 'Cliente'), C('pedido', 'Pedido'), C('estado', 'Estado'), C('total', 'Total', 'money'), C('cobrado', 'Cobrado', 'money'), C('saldo', 'Saldo', 'money')],
            rows
        }], ['Excluye facturas anuladas. El total de cada factura se calcula con su detalle.']);
    }

    private ventasProducto(): ReportDocument {

        const ids = new Set(this.facturasVigentes().filter(f => this.inR(f.fecha)).map(f => f.factura_id));
        const agg = new Map<number, { cant: number; venta: number }>();

        this.d.detallesFactura.filter(x => ids.has(x.factura_id)).forEach(x => {
            const a = agg.get(x.producto_id) ?? { cant: 0, venta: 0 };
            a.cant += num(x.cantidad); a.venta += num(x.cantidad) * num(x.precio_unitario);
            agg.set(x.producto_id, a);
        });

        const rows = [...agg.entries()].sort((a, b) => b[1].venta - a[1].venta).map(([pid, a]) => {
            const p = this.productos.get(pid);
            const costo = a.cant * num(p?.costo_unitario), ut = a.venta - costo;
            return R({
                codigo: p?.codigo ?? '-', producto: p?.nombre_producto ?? `Producto #${pid}`,
                categoria: p ? this.categorias.get(p.categoria_id)?.nombre_categoria ?? '-' : '-',
                cantidad: a.cant, ventas: r2(a.venta), costo: r2(costo), utilidad: r2(ut), margen: a.venta ? (ut / a.venta) * 100 : 0
            });
        });

        if (rows.length) {
            const t = this.sumaTotal(rows, ['cantidad', 'ventas', 'costo', 'utilidad'], { producto: 'TOTAL' });
            t.cells['margen'] = num(t.cells['ventas']) ? (num(t.cells['utilidad']) / num(t.cells['ventas'])) * 100 : 0;
            rows.push(t);
        }

        return this.doc('ventas-producto', 'Ventas por producto', 'Unidades, ventas, costo y margen', 'rango', [{
            columns: [C('codigo', 'Código'), C('producto', 'Producto'), C('categoria', 'Categoría'), C('cantidad', 'Cantidad', 'number'), C('ventas', 'Ventas', 'money'), C('costo', 'Costo', 'money'), C('utilidad', 'Utilidad', 'money'), C('margen', 'Margen', 'percent')],
            rows
        }], ['El costo se calcula con el costo unitario actual del producto.']);
    }

    private pedidos(): ReportDocument {
        const rows = this.d.pedidos.filter(p => this.inR(p.fecha_pedido))
            .sort((a, b) => ymd(a.fecha_pedido).localeCompare(ymd(b.fecha_pedido)) || a.pedido_id - b.pedido_id)
            .map(p => R({ pedido: `#${p.pedido_id}`, fecha: ymd(p.fecha_pedido), cliente: this.clienteNombre(p.cliente_id), entrega: ymd(p.fecha_entrega), estado: p.estado_pedido, envio: p.estado_envio, total: r2(this.pedidoTotal.get(p.pedido_id) ?? 0) }));
        if (rows.length) rows.push(this.sumaTotal(rows, ['total'], { pedido: 'TOTAL' }));
        return this.doc('pedidos', 'Pedidos', 'Seguimiento de pedidos', 'rango', [{
            columns: [C('pedido', 'Pedido'), C('fecha', 'Fecha', 'date'), C('cliente', 'Cliente'), C('entrega', 'Entrega', 'date'), C('estado', 'Estado'), C('envio', 'Envío'), C('total', 'Total', 'money')],
            rows
        }]);
    }

    private cobros(): ReportDocument {
        const rows = this.d.cobros.filter(c => !anulado(c.estado) && this.inR(c.fecha_cobro))
            .sort((a, b) => ymd(a.fecha_cobro).localeCompare(ymd(b.fecha_cobro)) || a.cobro_id - b.cobro_id)
            .map(c => R({ cobro: `CB-${c.cobro_id}`, fecha: ymd(c.fecha_cobro), cliente: this.clienteNombre(c.cliente_id), metodo: c.metodo_pago, referencia: c.referencia ?? '', estado: c.estado, monto: r2(this.cobroMonto.get(c.cobro_id) ?? 0) }));
        if (rows.length) rows.push(this.sumaTotal(rows, ['monto'], { cobro: 'TOTAL' }));
        return this.doc('cobros', 'Cobros recibidos', 'Cobros aplicados a facturas', 'rango', [{
            columns: [C('cobro', 'Cobro'), C('fecha', 'Fecha', 'date'), C('cliente', 'Cliente'), C('metodo', 'Método'), C('referencia', 'Referencia'), C('estado', 'Estado'), C('monto', 'Monto', 'money')],
            rows
        }]);
    }

    /** Antigüedad de saldos al corte (por cobrar o por pagar). */
    private antiguedad(tipo: 'cobrar' | 'pagar'): ReportDocument {

        const cobrar = tipo === 'cobrar';
        const items = (cobrar
            ? this.facturasVigentes().map(f => ({ party: this.clienteNombre(f.cliente_id), ref: `F-${f.factura_id}`, fecha: ymd(f.fecha), total: this.facturaTotal.get(f.factura_id) ?? 0, pagado: this.facturaCobrado.get(f.factura_id) ?? 0 }))
            : this.d.compras.filter(c => !anulado(c.estado)).map(c => ({ party: this.proveedorNombre(c.proveedor_id), ref: `C-${c.compra_id}`, fecha: ymd(c.fecha), total: this.compraTotal.get(c.compra_id) ?? 0, pagado: this.compraPagado.get(c.compra_id) ?? 0 }))
        ).filter(x => x.fecha <= this.f.hasta && x.total - x.pagado > 0.005);

        const bucket = (d: number) => d <= 30 ? 'b0' : d <= 60 ? 'b1' : d <= 90 ? 'b2' : 'b3';
        const resumen = new Map<string, Record<string, number>>();

        items.forEach(x => {
            const m = resumen.get(x.party) ?? { b0: 0, b1: 0, b2: 0, b3: 0, total: 0 };
            const s = x.total - x.pagado;
            m[bucket(days(x.fecha, this.f.hasta))] += s; m['total'] += s;
            resumen.set(x.party, m);
        });

        const sumRows: ReportRow[] = [...resumen.entries()].sort((a, b) => b[1]['total'] - a[1]['total'])
            .map(([p, m]) => R({ party: p, b0: r2(m['b0']), b1: r2(m['b1']), b2: r2(m['b2']), b3: r2(m['b3']), total: r2(m['total']) }));
        if (sumRows.length) sumRows.push(this.sumaTotal(sumRows, ['b0', 'b1', 'b2', 'b3', 'total'], { party: 'TOTAL' }));

        const detRows: ReportRow[] = items.sort((a, b) => a.party.localeCompare(b.party) || a.fecha.localeCompare(b.fecha))
            .map(x => R({ party: x.party, ref: x.ref, fecha: x.fecha, dias: days(x.fecha, this.f.hasta), total: r2(x.total), pagado: r2(x.pagado), saldo: r2(x.total - x.pagado) }));

        const label = cobrar ? 'Cliente' : 'Proveedor';

        return this.doc(cobrar ? 'cuentas-por-cobrar' : 'cuentas-por-pagar', cobrar ? 'Cuentas por cobrar' : 'Cuentas por pagar', 'Antigüedad de saldos', 'corte', [
            { title: 'Resumen por antigüedad', columns: [C('party', label), C('b0', '0 - 30 días', 'money'), C('b1', '31 - 60 días', 'money'), C('b2', '61 - 90 días', 'money'), C('b3', 'Más de 90', 'money'), C('total', 'Total', 'money')], rows: sumRows },
            { title: 'Detalle de documentos pendientes', columns: [C('party', label), C('ref', 'Documento'), C('fecha', 'Fecha', 'date'), C('dias', 'Días', 'number'), C('total', 'Total', 'money'), C('pagado', cobrar ? 'Cobrado' : 'Pagado', 'money'), C('saldo', 'Saldo', 'money')], rows: detRows }
        ], ['La antigüedad se cuenta desde la fecha del documento hasta la fecha de corte.']);
    }


    /* =========================================================
       COMPRAS
       ========================================================= */

    private comprasPeriodo(): ReportDocument {
        const rows = this.d.compras.filter(c => !anulado(c.estado) && this.inR(c.fecha))
            .sort((a, b) => ymd(a.fecha).localeCompare(ymd(b.fecha)) || a.compra_id - b.compra_id)
            .map(c => { const t = this.compraTotal.get(c.compra_id) ?? 0, p = this.compraPagado.get(c.compra_id) ?? 0; return R({ compra: `C-${c.compra_id}`, fecha: ymd(c.fecha), proveedor: this.proveedorNombre(c.proveedor_id), estado: c.estado, total: r2(t), pagado: r2(p), saldo: r2(t - p) }); });
        if (rows.length) rows.push(this.sumaTotal(rows, ['total', 'pagado', 'saldo'], { compra: 'TOTAL' }));
        return this.doc('compras-periodo', 'Compras del periodo', 'Compras a proveedores', 'rango', [{
            columns: [C('compra', 'Compra'), C('fecha', 'Fecha', 'date'), C('proveedor', 'Proveedor'), C('estado', 'Estado'), C('total', 'Total', 'money'), C('pagado', 'Pagado', 'money'), C('saldo', 'Saldo', 'money')],
            rows
        }], ['Excluye compras anuladas.']);
    }

    private pagos(): ReportDocument {
        const rows = this.d.pagos.filter(p => !anulado(p.estado) && this.inR(p.fecha_pago))
            .sort((a, b) => ymd(a.fecha_pago).localeCompare(ymd(b.fecha_pago)) || a.pago_id - b.pago_id)
            .map(p => R({ pago: `PG-${p.pago_id}`, fecha: ymd(p.fecha_pago), proveedor: this.proveedorNombre(p.proveedor_id), metodo: p.metodo_pago, referencia: p.referencia ?? '', estado: p.estado, monto: r2(this.pagoMonto.get(p.pago_id) ?? 0) }));
        if (rows.length) rows.push(this.sumaTotal(rows, ['monto'], { pago: 'TOTAL' }));
        return this.doc('pagos-proveedores', 'Pagos a proveedores', 'Pagos aplicados a compras', 'rango', [{
            columns: [C('pago', 'Pago'), C('fecha', 'Fecha', 'date'), C('proveedor', 'Proveedor'), C('metodo', 'Método'), C('referencia', 'Referencia'), C('estado', 'Estado'), C('monto', 'Monto', 'money')],
            rows
        }]);
    }


    /* =========================================================
       NÓMINA E INVENTARIO
       ========================================================= */

    private nomina(): ReportDocument {

        const sections: ReportSection[] = this.d.nominas
            .filter(n => this.inR(n.fecha_pago))
            .sort((a, b) => ymd(a.fecha_pago).localeCompare(ymd(b.fecha_pago)))
            .map(n => {
                const rows = this.d.detallesNomina.filter(x => x.nomina_id === n.nomina_id).map(x => R({
                    empleado: this.empleadoNombre(x.empleado_id), base: num(x.salario_base), ingresos: num(x.total_ingresos),
                    inss: num(x.inss_laboral), ir: num(x.ir), neto: num(x.salario_neto),
                    inssp: num(x.inss_patronal), inatec: num(x.inatec), vac: num(x.vacaciones), tm: num(x.treceavo_mes), ind: num((x as any)['indemnización'])
                }));
                if (rows.length) rows.push(this.sumaTotal(rows, ['base', 'ingresos', 'inss', 'ir', 'neto', 'inssp', 'inatec', 'vac', 'tm', 'ind'], { empleado: 'TOTAL' }));
                return {
                    title: `Nómina #${n.nomina_id} · ${dmy(ymd(n.periodo_inicio))} al ${dmy(ymd(n.periodo_fin))} · Pago ${dmy(ymd(n.fecha_pago))} · ${n.estado}`,
                    columns: [C('empleado', 'Empleado'), C('base', 'Salario base', 'money'), C('ingresos', 'Total ingresos', 'money'), C('inss', 'INSS laboral', 'money'), C('ir', 'IR', 'money'), C('neto', 'Salario neto', 'money'), C('inssp', 'INSS patronal', 'money'), C('inatec', 'INATEC', 'money'), C('vac', 'Vacaciones', 'money'), C('tm', '13.º mes', 'money'), C('ind', 'Indemniz.', 'money')],
                    rows
                };
            });

        return this.doc('nomina', 'Planilla de nómina', 'Detalle por periodo de pago', 'rango', sections, ['Las columnas patronales y de provisiones corresponden a costos de la empresa, no se descuentan al empleado.']);
    }

    private margenes(): ReportDocument {
        const rows = [...this.d.productos].sort((a, b) => a.codigo.localeCompare(b.codigo)).map(p => {
            const m = num(p.precio_venta) - num(p.costo_unitario);
            return R({ codigo: p.codigo, producto: p.nombre_producto, categoria: this.categorias.get(p.categoria_id)?.nombre_categoria ?? '-', costo: num(p.costo_unitario), precio: num(p.precio_venta), margen: r2(m), pct: num(p.precio_venta) ? (m / num(p.precio_venta)) * 100 : 0, estado: p.estado ? 'Activo' : 'Inactivo' });
        });
        return this.doc('productos-margenes', 'Productos y márgenes', 'Lista de precios y margen unitario', 'corte', [{
            columns: [C('codigo', 'Código'), C('producto', 'Producto'), C('categoria', 'Categoría'), C('costo', 'Costo', 'money'), C('precio', 'Precio venta', 'money'), C('margen', 'Margen', 'money'), C('pct', 'Margen %', 'percent'), C('estado', 'Estado')],
            rows
        }]);
    }


    /* =========================================================
       GRÁFICAS
       ========================================================= */

    meses(): string[] {
        const out: string[] = [];
        let [y, m] = this.f.desde.split('-').map(Number);
        const [yh, mh] = this.f.hasta.split('-').map(Number);
        while ((y < yh || (y === yh && m <= mh)) && out.length < 60) {
            out.push(`${y}-${String(m).padStart(2, '0')}`);
            if (++m > 12) { m = 1; y++; }
        }
        return out.slice(-18);
    }

    mesLabel(k: string): string {
        const [y, m] = k.split('-').map(Number);
        return `${['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][m - 1]} ${String(y).slice(2)}`;
    }

    mensual() {
        const meses = this.meses();
        const z = () => new Map(meses.map(k => [k, 0]));
        const ventas = z(), compras = z(), ingresos = z(), egresos = z();

        this.facturasVigentes().filter(f => this.inR(f.fecha)).forEach(f => { const k = ymd(f.fecha).slice(0, 7); if (ventas.has(k)) ventas.set(k, ventas.get(k)! + (this.facturaTotal.get(f.factura_id) ?? 0)); });
        this.d.compras.filter(c => !anulado(c.estado) && this.inR(c.fecha)).forEach(c => { const k = ymd(c.fecha).slice(0, 7); if (compras.has(k)) compras.set(k, compras.get(k)! + (this.compraTotal.get(c.compra_id) ?? 0)); });

        this.lines.filter(l => this.inR(l.fecha)).forEach(l => {
            const t = this.cuentas.get(l.cuenta_id)?.tipo_cuenta, k = l.fecha.slice(0, 7);
            if (t === 'INGRESO' && ingresos.has(k)) ingresos.set(k, ingresos.get(k)! + l.haber - l.debe);
            if ((t === 'COSTO' || t === 'GASTO') && egresos.has(k)) egresos.set(k, egresos.get(k)! + l.debe - l.haber);
        });

        const arr = (m: Map<string, number>) => meses.map(k => r2(m.get(k) ?? 0));
        return { labels: meses.map(k => this.mesLabel(k)), ventas: arr(ventas), compras: arr(compras), ingresos: arr(ingresos), egresos: arr(egresos) };
    }

    topProductos(n = 10) {
        const ids = new Set(this.facturasVigentes().filter(f => this.inR(f.fecha)).map(f => f.factura_id));
        const agg = new Map<number, number>();
        this.d.detallesFactura.filter(x => ids.has(x.factura_id)).forEach(x => agg.set(x.producto_id, (agg.get(x.producto_id) ?? 0) + num(x.cantidad) * num(x.precio_unitario)));
        return [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([id, v]) => ({ label: this.productos.get(id)?.nombre_producto ?? `Producto #${id}`, value: r2(v) }));
    }

    ventasPorCategoria() {
        const ids = new Set(this.facturasVigentes().filter(f => this.inR(f.fecha)).map(f => f.factura_id));
        const agg = new Map<string, number>();
        this.d.detallesFactura.filter(x => ids.has(x.factura_id)).forEach(x => {
            const p = this.productos.get(x.producto_id);
            const cat = p ? this.categorias.get(p.categoria_id)?.nombre_categoria ?? 'Sin categoría' : 'Sin categoría';
            agg.set(cat, (agg.get(cat) ?? 0) + num(x.cantidad) * num(x.precio_unitario));
        });
        return [...agg.entries()].sort((a, b) => b[1] - a[1]).map(([label, v]) => ({ label, value: r2(v) }));
    }

    aging(tipo: 'cobrar' | 'pagar'): number[] {
        const doc = this.antiguedad(tipo).sections[0].rows.find(r => r.kind === 'total');
        return ['b0', 'b1', 'b2', 'b3'].map(k => num(doc?.cells[k]));
    }

    nominaPeriodos() {
        return this.d.nominas.filter(n => this.inR(n.fecha_pago)).sort((a, b) => ymd(a.fecha_pago).localeCompare(ymd(b.fecha_pago))).map(n => {
            const ds = this.d.detallesNomina.filter(x => x.nomina_id === n.nomina_id);
            return { label: dmy(ymd(n.fecha_pago)).slice(0, 5), neto: r2(ds.reduce((s, x) => s + num(x.salario_neto), 0)), patronal: r2(ds.reduce((s, x) => s + num(x.inss_patronal) + num(x.inatec), 0)) };
        });
    }

    conteo<T>(items: T[], key: (x: T) => string) {
        const m = new Map<string, number>();
        items.forEach(x => m.set(key(x) || 'N/D', (m.get(key(x) || 'N/D') ?? 0) + 1));
        return [...m.entries()].map(([label, value]) => ({ label, value }));
    }

    pedidosPorEstado() { return this.conteo(this.d.pedidos.filter(p => this.inR(p.fecha_pedido)), p => p.estado_pedido); }

    montosPorMetodo(tipo: 'cobros' | 'pagos') {
        const m = new Map<string, number>();
        if (tipo === 'cobros') this.d.cobros.filter(c => !anulado(c.estado) && this.inR(c.fecha_cobro)).forEach(c => m.set(c.metodo_pago, (m.get(c.metodo_pago) ?? 0) + (this.cobroMonto.get(c.cobro_id) ?? 0)));
        else this.d.pagos.filter(p => !anulado(p.estado) && this.inR(p.fecha_pago)).forEach(p => m.set(p.metodo_pago, (m.get(p.metodo_pago) ?? 0) + (this.pagoMonto.get(p.pago_id) ?? 0)));
        return [...m.entries()].map(([label, v]) => ({ label, value: r2(v) }));
    }

    kpis() {
        const v = this.facturasVigentes().filter(f => this.inR(f.fecha));
        const c = this.d.compras.filter(x => !anulado(x.estado) && this.inR(x.fecha));
        const ventas = v.reduce((s, f) => s + (this.facturaTotal.get(f.factura_id) ?? 0), 0);
        const compras = c.reduce((s, x) => s + (this.compraTotal.get(x.compra_id) ?? 0), 0);
        const cobrado = this.d.cobros.filter(x => !anulado(x.estado) && this.inR(x.fecha_cobro)).reduce((s, x) => s + (this.cobroMonto.get(x.cobro_id) ?? 0), 0);
        const pagado = this.d.pagos.filter(x => !anulado(x.estado) && this.inR(x.fecha_pago)).reduce((s, x) => s + (this.pagoMonto.get(x.pago_id) ?? 0), 0);
        const nominaNeta = this.nominaPeriodos().reduce((s, x) => s + x.neto, 0);
        const res = this.resumen();
        return {
            ventas: r2(ventas), compras: r2(compras), cobrado: r2(cobrado), pagado: r2(pagado),
            porCobrar: r2(this.aging('cobrar').reduce((a, b) => a + b, 0)), porPagar: r2(this.aging('pagar').reduce((a, b) => a + b, 0)),
            utilidad: res.utilidad, nominaNeta: r2(nominaNeta), facturas: v.length, compras_n: c.length
        };
    }
}


/* =============================================================
   SERVICIO DE CARGA
   ============================================================= */

@Injectable({ providedIn: 'root' })
export class AnalisisDataService {

    readonly empresa = signal('Contalab');

    private readonly s = {
        clientes: inject(ClientesService), productos: inject(ProductosService), categorias: inject(CategoriaProductosService),
        pedidos: inject(PedidosService), detallesPedido: inject(DetallePedidoService),
        facturas: inject(FacturasService), detallesFactura: inject(DetalleFacturaService),
        cobros: inject(CobrosService), detallesCobro: inject(DetalleCobroService),
        proveedores: inject(ProveedoresService), compras: inject(ComprasService), detallesCompra: inject(DetalleCompraService),
        pagos: inject(PagosProveedoresService), detallesPago: inject(DetallePagoProveedorService),
        nominas: inject(NominaService), detallesNomina: inject(DetalleNominaService), empleados: inject(EmpleadosService),
        cuentas: inject(CatalogoCuentasService), asientos: inject(AsientosContablesService), detallesAsientos: inject(DetallesAsientosContablesService)
    };

    /** Carga todo en paralelo. Si un endpoint falla, ese conjunto queda vacío y se avisa en `warnings`. */
    load(): Observable<{ data: AnalisisData; warnings: string[] }> {

        const warnings: string[] = [];
        const safe = <T>(name: string, o: Observable<T[]>) =>
            o.pipe(catchError(() => { warnings.push(name); return of([] as T[]); }));

        return forkJoin({
            clientes: safe('clientes', this.s.clientes.getClientes()),
            productos: safe('productos', this.s.productos.getProductos()),
            categorias: safe('categorías', this.s.categorias.getCategorias()),
            pedidos: safe('pedidos', this.s.pedidos.getPedidos()),
            detallesPedido: safe('detalle de pedidos', this.s.detallesPedido.getDetalles()),
            facturas: safe('facturas', this.s.facturas.getFacturas()),
            detallesFactura: safe('detalle de facturas', this.s.detallesFactura.getDetalles()),
            cobros: safe('cobros', this.s.cobros.getCobros()),
            detallesCobro: safe('detalle de cobros', this.s.detallesCobro.getDetalles()),
            proveedores: safe('proveedores', this.s.proveedores.getProveedores()),
            compras: safe('compras', this.s.compras.getCompras()),
            detallesCompra: safe('detalle de compras', this.s.detallesCompra.getDetalles()),
            pagos: safe('pagos a proveedores', this.s.pagos.getPagos()),
            detallesPago: safe('detalle de pagos', this.s.detallesPago.getDetalles()),
            nominas: safe('nómina', this.s.nominas.getNominas()),
            detallesNomina: safe('detalle de nómina', this.s.detallesNomina.getDetallesNomina()),
            empleados: safe('empleados', this.s.empleados.getEmpleados()),
            cuentas: safe('catálogo de cuentas', this.s.cuentas.getCatalogoCuentas()),
            asientos: safe('asientos contables', this.s.asientos.getAsientosContables()),
            detallesAsientos: safe('detalle de asientos', this.s.detallesAsientos.getDetallesAsientosContables())
        }).pipe(map(data => ({ data: data as AnalisisData, warnings })));
    }

    engine(data: AnalisisData, filtro: Filtro): AnalisisEngine {
        return new AnalisisEngine(data, filtro, this.empresa());
    }

    /** Rango por defecto: del 1 de enero del año actual a hoy. */
    defaultFiltro(): Filtro {
        const now = new Date();
        const p = (n: number) => String(n).padStart(2, '0');
        return { desde: `${now.getFullYear()}-01-01`, hasta: `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`, nivel: 3 };
    }
}