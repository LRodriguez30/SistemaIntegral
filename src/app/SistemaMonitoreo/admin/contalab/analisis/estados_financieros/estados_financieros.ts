import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';


/* =============================================================
   TIPOS
============================================================= */

type TipoEstado = 'situacion' | 'resultados';

interface CuentaFinanciera {
  codigo: string;
  nombre: string;
  tipo:
    | 'ACTIVO'
    | 'PASIVO'
    | 'PATRIMONIO'
    | 'INGRESO'
    | 'COSTO'
    | 'GASTO';
  saldo: number;
  nivel: number;
}

interface DatosFinancieros {
  periodo: string;
  fechaCorte: string;
  cuentas: CuentaFinanciera[];
}


/* =============================================================
   COMPONENTE
============================================================= */

@Component({
  selector: 'app-estados-financieros',
  standalone: true,

  imports: [
    CommonModule
  ],

  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],

  templateUrl: './estados_financieros.html'
})
export class EstadosFinancierosComponent {


  /* ===========================================================
     ESTADO DE LA VISTA
  =========================================================== */

  selectedStatement = signal<TipoEstado>('situacion');

  selectedPeriod = signal<string>('2026');

  selectedDate = signal<string>('2026-09-30');

  exportMenuOpen = signal(false);


  /* ===========================================================
     DATOS DE EJEMPLO
  =========================================================== */

  private readonly datosPorPeriodo: Record<string, DatosFinancieros> = {

    /* ---------------------------------------------------------
       2026 — CUADRA
    --------------------------------------------------------- */

    '2026': {
      periodo: '2026',
      fechaCorte: '2026-09-30',

      cuentas: [

        /* Activos */

        {
          codigo: '1.1.01',
          nombre: 'Caja',
          tipo: 'ACTIVO',
          saldo: 6500,
          nivel: 3
        },

        {
          codigo: '1.1.02',
          nombre: 'Bancos',
          tipo: 'ACTIVO',
          saldo: 18400,
          nivel: 3
        },

        {
          codigo: '1.1.03',
          nombre: 'Cuentas por cobrar',
          tipo: 'ACTIVO',
          saldo: 7200,
          nivel: 3
        },

        {
          codigo: '1.2.01',
          nombre: 'Equipo de oficina',
          tipo: 'ACTIVO',
          saldo: 12700,
          nivel: 3
        },


        /* Pasivos */

        {
          codigo: '2.1.01',
          nombre: 'Proveedores',
          tipo: 'PASIVO',
          saldo: 6800,
          nivel: 3
        },


        /* Patrimonio */

        {
          codigo: '3.1.01',
          nombre: 'Capital social',
          tipo: 'PATRIMONIO',
          saldo: 25000,
          nivel: 3
        },

        {
          codigo: '3.2.01',
          nombre: 'Resultado del ejercicio',
          tipo: 'PATRIMONIO',
          saldo: 13000,
          nivel: 3
        },


        /* Ingresos */

        {
          codigo: '4.1.01',
          nombre: 'Ventas',
          tipo: 'INGRESO',
          saldo: 28500,
          nivel: 3
        },


        /* Costos */

        {
          codigo: '5.1.01',
          nombre: 'Costo de ventas',
          tipo: 'COSTO',
          saldo: 11200,
          nivel: 3
        },


        /* Gastos */

        {
          codigo: '6.1.01',
          nombre: 'Gastos administrativos',
          tipo: 'GASTO',
          saldo: 4300,
          nivel: 3
        }

      ]
    },


    /* ---------------------------------------------------------
       2025 — CUADRA
    --------------------------------------------------------- */

    '2025': {
      periodo: '2025',
      fechaCorte: '2025-12-31',

      cuentas: [

        /* Activos */

        {
          codigo: '1.1.01',
          nombre: 'Caja',
          tipo: 'ACTIVO',
          saldo: 5200,
          nivel: 3
        },

        {
          codigo: '1.1.02',
          nombre: 'Bancos',
          tipo: 'ACTIVO',
          saldo: 14600,
          nivel: 3
        },

        {
          codigo: '1.1.03',
          nombre: 'Cuentas por cobrar',
          tipo: 'ACTIVO',
          saldo: 5800,
          nivel: 3
        },

        {
          codigo: '1.2.01',
          nombre: 'Equipo de oficina',
          tipo: 'ACTIVO',
          saldo: 10400,
          nivel: 3
        },


        /* Pasivos */

        {
          codigo: '2.1.01',
          nombre: 'Proveedores',
          tipo: 'PASIVO',
          saldo: 6100,
          nivel: 3
        },


        /* Patrimonio */

        {
          codigo: '3.1.01',
          nombre: 'Capital social',
          tipo: 'PATRIMONIO',
          saldo: 20000,
          nivel: 3
        },

        {
          codigo: '3.2.01',
          nombre: 'Resultado del ejercicio',
          tipo: 'PATRIMONIO',
          saldo: 9900,
          nivel: 3
        },


        /* Ingresos */

        {
          codigo: '4.1.01',
          nombre: 'Ventas',
          tipo: 'INGRESO',
          saldo: 23100,
          nivel: 3
        },


        /* Costos */

        {
          codigo: '5.1.01',
          nombre: 'Costo de ventas',
          tipo: 'COSTO',
          saldo: 9200,
          nivel: 3
        },


        /* Gastos */

        {
          codigo: '6.1.01',
          nombre: 'Gastos administrativos',
          tipo: 'GASTO',
          saldo: 4000,
          nivel: 3
        }

      ]
    },


    /* ---------------------------------------------------------
       2024 — NO CUADRA
    --------------------------------------------------------- */

    '2024': {
      periodo: '2024',
      fechaCorte: '2024-12-31',

      cuentas: [

        /* Activos */

        {
          codigo: '1.1.01',
          nombre: 'Caja',
          tipo: 'ACTIVO',
          saldo: 4800,
          nivel: 3
        },

        {
          codigo: '1.1.02',
          nombre: 'Bancos',
          tipo: 'ACTIVO',
          saldo: 11200,
          nivel: 3
        },

        {
          codigo: '1.1.03',
          nombre: 'Cuentas por cobrar',
          tipo: 'ACTIVO',
          saldo: 4500,
          nivel: 3
        },

        {
          codigo: '1.2.01',
          nombre: 'Equipo de oficina',
          tipo: 'ACTIVO',
          saldo: 9000,
          nivel: 3
        },


        /* Pasivos */

        {
          codigo: '2.1.01',
          nombre: 'Proveedores',
          tipo: 'PASIVO',
          saldo: 5500,
          nivel: 3
        },


        /* Patrimonio */

        {
          codigo: '3.1.01',
          nombre: 'Capital social',
          tipo: 'PATRIMONIO',
          saldo: 18000,
          nivel: 3
        },

        {
          codigo: '3.2.01',
          nombre: 'Resultado del ejercicio',
          tipo: 'PATRIMONIO',
          saldo: 5000,
          nivel: 3
        },


        /* Ingresos */

        {
          codigo: '4.1.01',
          nombre: 'Ventas',
          tipo: 'INGRESO',
          saldo: 19800,
          nivel: 3
        },


        /* Costos */

        {
          codigo: '5.1.01',
          nombre: 'Costo de ventas',
          tipo: 'COSTO',
          saldo: 8600,
          nivel: 3
        },


        /* Gastos */

        {
          codigo: '6.1.01',
          nombre: 'Gastos administrativos',
          tipo: 'GASTO',
          saldo: 3200,
          nivel: 3
        }

      ]
    }

  };


  /* ===========================================================
     CUENTAS DEL PERÍODO ACTUAL
  =========================================================== */

  cuentas = computed(() => {

    return this.datosPorPeriodo[
      this.selectedPeriod()
    ]?.cuentas ?? [];

  });


  /* ===========================================================
     COMPUTED — SITUACIÓN FINANCIERA
  =========================================================== */

  activos = computed(() =>
    this.cuentas().filter(
      cuenta => cuenta.tipo === 'ACTIVO'
    )
  );


  pasivos = computed(() =>
    this.cuentas().filter(
      cuenta => cuenta.tipo === 'PASIVO'
    )
  );


  patrimonio = computed(() =>
    this.cuentas().filter(
      cuenta => cuenta.tipo === 'PATRIMONIO'
    )
  );


  totalActivos = computed(() =>
    this.sumAccounts(this.activos())
  );


  totalPasivos = computed(() =>
    this.sumAccounts(this.pasivos())
  );


  totalPatrimonio = computed(() =>
    this.sumAccounts(this.patrimonio())
  );


  totalPasivoPatrimonio = computed(() =>
    this.totalPasivos() +
    this.totalPatrimonio()
  );


  diferenciaSituacion = computed(() =>
    this.totalActivos() -
    this.totalPasivoPatrimonio()
  );


  /* ===========================================================
     COMPUTED — ESTADO DE RESULTADOS
  =========================================================== */

  ingresos = computed(() =>
    this.cuentas().filter(
      cuenta => cuenta.tipo === 'INGRESO'
    )
  );


  costos = computed(() =>
    this.cuentas().filter(
      cuenta => cuenta.tipo === 'COSTO'
    )
  );


  gastos = computed(() =>
    this.cuentas().filter(
      cuenta => cuenta.tipo === 'GASTO'
    )
  );


  totalIngresos = computed(() =>
    this.sumAccounts(this.ingresos())
  );


  totalCostos = computed(() =>
    this.sumAccounts(this.costos())
  );


  totalGastos = computed(() =>
    this.sumAccounts(this.gastos())
  );


  utilidadBruta = computed(() =>
    this.totalIngresos() -
    this.totalCostos()
  );


  utilidadNeta = computed(() =>
    this.utilidadBruta() -
    this.totalGastos()
  );


  /* ===========================================================
     COMPUTED — ESTADO
  =========================================================== */

  estadoBalanceado = computed(() =>
    Math.abs(this.diferenciaSituacion()) < 0.01
  );


  resultadoPositivo = computed(() =>
    this.utilidadNeta() >= 0
  );


  estadoContable = computed(() =>
    this.estadoBalanceado()
      ? 'Cuadra'
      : 'No cuadra'
  );


  estadoContableDescripcion = computed(() =>
    this.estadoBalanceado()
      ? 'La ecuación contable se encuentra equilibrada.'
      : 'Existe una diferencia entre los activos y el pasivo más patrimonio.'
  );


  /* ===========================================================
     NAVEGACIÓN
  =========================================================== */

  selectStatement(
    statement: TipoEstado
  ): void {

    this.selectedStatement.set(statement);

  }


  onPeriodChange(
    event: Event
  ): void {

    const value = (
      event.target as HTMLSelectElement
    ).value;

    this.selectedPeriod.set(value);

    const datos = this.datosPorPeriodo[value];

    if (datos) {

      this.selectedDate.set(
        datos.fechaCorte
      );

    }

  }


  onDateChange(
    event: Event
  ): void {

    const value = (
      event.target as HTMLInputElement
    ).value;

    this.selectedDate.set(value);

  }


  /* ===========================================================
     EXPORTACIÓN
  =========================================================== */

  toggleExportMenu(): void {

    this.exportMenuOpen.update(
      open => !open
    );

  }


  exportToExcel(): void {

    this.exportMenuOpen.set(false);

    console.log(
      'Exportar estado financiero a Excel'
    );

  }


  exportToPdf(): void {

    this.exportMenuOpen.set(false);

    console.log(
      'Exportar estado financiero a PDF'
    );

  }


  exportToCsv(): void {

    this.exportMenuOpen.set(false);

    console.log(
      'Exportar estado financiero a CSV'
    );

  }


  /* ===========================================================
     INSPECCIÓN
  =========================================================== */

  inspectAccounts(): void {

    console.log(
      'Inspeccionar cuentas y movimientos',
      {
        periodo: this.selectedPeriod(),
        fecha: this.selectedDate()
      }
    );

  }


  /* ===========================================================
     HELPERS
  =========================================================== */

  private sumAccounts(
    accounts: CuentaFinanciera[]
  ): number {

    return accounts.reduce(
      (total, account) =>
        total + account.saldo,
      0
    );

  }


  formatAmount(
    amount: number
  ): string {

    return new Intl.NumberFormat(
      'es-NI',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    ).format(amount);

  }


  formatDate(
    date: string
  ): string {

    if (!date) {
      return '';
    }

    const [
      year,
      month,
      day
    ] = date.split('-');

    return `${day}/${month}/${year}`;

  }


  getStatementTitle(): string {

    if (
      this.selectedStatement() === 'situacion'
    ) {

      return 'Estado de situación financiera';

    }

    return 'Estado de resultados';

  }


  getStatementDescription(): string {

    if (
      this.selectedStatement() === 'situacion'
    ) {

      return 'Presenta la posición financiera de la empresa a una fecha determinada.';

    }

    return 'Muestra los ingresos, costos y gastos del período para determinar el resultado del ejercicio.';

  }

}