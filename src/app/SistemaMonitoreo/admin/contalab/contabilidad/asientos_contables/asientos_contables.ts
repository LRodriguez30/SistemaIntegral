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

type TipoOrigen =
  | 'MANUAL'
  | 'VENTA'
  | 'COMPRA'
  | 'COBRO'
  | 'PAGO'
  | 'NOMINA'
  | 'OTRO';

type FiltroEstado =
  | 'TODOS'
  | 'ACTIVOS'
  | 'INACTIVOS';


/* =============================================================
   CUENTA CONTABLE
   ============================================================= */

interface CuentaContable {
  cuenta_id: number;
  codigo_cuenta: string;
  nombre_cuenta: string;

  tipo_cuenta:
    | 'ACTIVO'
    | 'PASIVO'
    | 'PATRIMONIO'
    | 'INGRESO'
    | 'COSTO'
    | 'GASTO';

  naturaleza:
    | 'DEUDORA'
    | 'ACREEDORA';

  cuenta_padre_id: number | null;
  nivel_cuenta: number;
  permite_movimiento: boolean;
  estado: boolean;
}


/* =============================================================
   DETALLE DEL ASIENTO
   -------------------------------------------------------------
   Cada objeto representa un registro de
   detalles_asientos_contables.

   Un asiento puede tener 2, 3, 4 o N detalles.
   ============================================================= */

interface DetalleAsiento {
  detalle_id: number | null;

  cuenta_id: number | null;

  debe: number;
  haber: number;
}


/* =============================================================
   ASIENTO CONTABLE
   -------------------------------------------------------------
   Representa el registro principal de
   asientos_contables junto con sus detalles
   para facilitar el manejo desde la interfaz.
   ============================================================= */

interface AsientoContable {
  asiento_id: number;

  usuario_id: number;

  fecha: string;

  concepto: string;

  tipo_origen: TipoOrigen | null;

  estado: boolean;

  total_debe: number;

  total_haber: number;

  detalles: DetalleAsiento[];
}


/* =============================================================
   FORMULARIO
   ============================================================= */

interface AsientoForm {
  usuario_id: number;

  fecha: string;

  concepto: string;

  tipo_origen: TipoOrigen | null;

  estado: boolean;

  detalles: DetalleAsiento[];
}


/* =============================================================
   COMPONENTE
   ============================================================= */

@Component({
  selector: 'app-asientos-contables',
  standalone: true,

  imports: [
    CommonModule
  ],

  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],

  templateUrl: './asientos_contables.html'
})
export class AsientosContablesComponent {


  /* =============================================================
     ESTADO PRINCIPAL
     ============================================================= */

  readonly searchTerm = signal('');

  readonly selectedStatus =
    signal<FiltroEstado>('TODOS');

  readonly selectedOrigin =
    signal<TipoOrigen | 'TODOS'>('TODOS');


  /* =============================================================
     MODALES
     ============================================================= */

  readonly modalMode =
    signal<'create' | 'edit' | null>(null);

  readonly viewModalOpen =
    signal(false);

  readonly selectedAsiento =
    signal<AsientoContable | null>(null);


  /* =============================================================
     FORMULARIO
     ============================================================= */

  readonly form = signal<AsientoForm>({
    usuario_id: 1,

    fecha: this.getToday(),

    concepto: '',

    tipo_origen: 'MANUAL',

    estado: true,

    detalles: [
      this.createEmptyDetail(),
      this.createEmptyDetail()
    ]
  });


  /* =============================================================
     CUENTAS
     ============================================================= */

  readonly cuentas =
    signal<CuentaContable[]>([

      {
        cuenta_id: 1,
        codigo_cuenta: '1',
        nombre_cuenta: 'ACTIVOS',
        tipo_cuenta: 'ACTIVO',
        naturaleza: 'DEUDORA',
        cuenta_padre_id: null,
        nivel_cuenta: 1,
        permite_movimiento: false,
        estado: true
      },

      {
        cuenta_id: 2,
        codigo_cuenta: '1.1',
        nombre_cuenta: 'ACTIVOS CORRIENTES',
        tipo_cuenta: 'ACTIVO',
        naturaleza: 'DEUDORA',
        cuenta_padre_id: 1,
        nivel_cuenta: 2,
        permite_movimiento: false,
        estado: true
      },

      {
        cuenta_id: 3,
        codigo_cuenta: '1.1.01',
        nombre_cuenta: 'CAJA',
        tipo_cuenta: 'ACTIVO',
        naturaleza: 'DEUDORA',
        cuenta_padre_id: 2,
        nivel_cuenta: 3,
        permite_movimiento: true,
        estado: true
      },

      {
        cuenta_id: 4,
        codigo_cuenta: '1.1.02',
        nombre_cuenta: 'BANCOS',
        tipo_cuenta: 'ACTIVO',
        naturaleza: 'DEUDORA',
        cuenta_padre_id: 2,
        nivel_cuenta: 3,
        permite_movimiento: true,
        estado: true
      },

      {
        cuenta_id: 5,
        codigo_cuenta: '1.1.03',
        nombre_cuenta: 'CUENTAS POR COBRAR',
        tipo_cuenta: 'ACTIVO',
        naturaleza: 'DEUDORA',
        cuenta_padre_id: 2,
        nivel_cuenta: 3,
        permite_movimiento: true,
        estado: true
      },

      {
        cuenta_id: 7,
        codigo_cuenta: '1.2.01',
        nombre_cuenta: 'EQUIPO DE OFICINA',
        tipo_cuenta: 'ACTIVO',
        naturaleza: 'DEUDORA',
        cuenta_padre_id: 6,
        nivel_cuenta: 3,
        permite_movimiento: true,
        estado: true
      },

      {
        cuenta_id: 10,
        codigo_cuenta: '2.1.01',
        nombre_cuenta: 'PROVEEDORES',
        tipo_cuenta: 'PASIVO',
        naturaleza: 'ACREEDORA',
        cuenta_padre_id: 9,
        nivel_cuenta: 3,
        permite_movimiento: true,
        estado: true
      },

      {
        cuenta_id: 12,
        codigo_cuenta: '3.1.01',
        nombre_cuenta: 'CAPITAL SOCIAL',
        tipo_cuenta: 'PATRIMONIO',
        naturaleza: 'ACREEDORA',
        cuenta_padre_id: 11,
        nivel_cuenta: 3,
        permite_movimiento: true,
        estado: true
      },

      {
        cuenta_id: 16,
        codigo_cuenta: '4.1.01',
        nombre_cuenta: 'VENTAS',
        tipo_cuenta: 'INGRESO',
        naturaleza: 'ACREEDORA',
        cuenta_padre_id: 13,
        nivel_cuenta: 3,
        permite_movimiento: true,
        estado: true
      },

      {
        cuenta_id: 17,
        codigo_cuenta: '5.1.01',
        nombre_cuenta: 'COSTO DE VENTAS',
        tipo_cuenta: 'COSTO',
        naturaleza: 'DEUDORA',
        cuenta_padre_id: 14,
        nivel_cuenta: 3,
        permite_movimiento: true,
        estado: true
      },

      {
        cuenta_id: 18,
        codigo_cuenta: '6.1.01',
        nombre_cuenta: 'GASTOS ADMINISTRATIVOS',
        tipo_cuenta: 'GASTO',
        naturaleza: 'DEUDORA',
        cuenta_padre_id: 15,
        nivel_cuenta: 3,
        permite_movimiento: true,
        estado: true
      }
    ]);


  /* =============================================================
     ASIENTOS
     ============================================================= */

  readonly asientos =
    signal<AsientoContable[]>([

      {
        asiento_id: 1,
        usuario_id: 1,
        fecha: '2026-09-01',
        concepto: 'Registro de efectivo inicial',
        tipo_origen: 'MANUAL',
        estado: true,
        total_debe: 5000,
        total_haber: 5000,

        detalles: [
          {
            detalle_id: 1,
            cuenta_id: 3,
            debe: 5000,
            haber: 0
          },
          {
            detalle_id: 2,
            cuenta_id: 12,
            debe: 0,
            haber: 5000
          }
        ]
      },

      {
        asiento_id: 2,
        usuario_id: 1,
        fecha: '2026-09-03',
        concepto: 'Compra de equipo de oficina al contado',
        tipo_origen: 'COMPRA',
        estado: true,
        total_debe: 1200,
        total_haber: 1200,

        detalles: [
          {
            detalle_id: 3,
            cuenta_id: 7,
            debe: 1200,
            haber: 0
          },
          {
            detalle_id: 4,
            cuenta_id: 3,
            debe: 0,
            haber: 1200
          }
        ]
      },

      {
        asiento_id: 3,
        usuario_id: 1,
        fecha: '2026-09-05',
        concepto: 'Compra de materiales a crédito',
        tipo_origen: 'COMPRA',
        estado: true,
        total_debe: 850,
        total_haber: 850,

        detalles: [
          {
            detalle_id: 5,
            cuenta_id: 7,
            debe: 850,
            haber: 0
          },
          {
            detalle_id: 6,
            cuenta_id: 10,
            debe: 0,
            haber: 850
          }
        ]
      },

      {
        asiento_id: 4,
        usuario_id: 1,
        fecha: '2026-09-08',
        concepto: 'Venta de contado',
        tipo_origen: 'VENTA',
        estado: true,
        total_debe: 2500,
        total_haber: 2500,

        detalles: [
          {
            detalle_id: 7,
            cuenta_id: 3,
            debe: 2500,
            haber: 0
          },
          {
            detalle_id: 8,
            cuenta_id: 16,
            debe: 0,
            haber: 2500
          }
        ]
      },

      {
        asiento_id: 5,
        usuario_id: 1,
        fecha: '2026-09-10',
        concepto: 'Aporte adicional de capital',
        tipo_origen: 'MANUAL',
        estado: false,
        total_debe: 3000,
        total_haber: 3000,

        detalles: [
          {
            detalle_id: 9,
            cuenta_id: 4,
            debe: 3000,
            haber: 0
          },
          {
            detalle_id: 10,
            cuenta_id: 12,
            debe: 0,
            haber: 3000
          }
        ]
      }
    ]);


  /* =============================================================
     CUENTAS DE MOVIMIENTO
     ============================================================= */

  readonly cuentasMovimiento = computed(() =>
    this.cuentas().filter(
      cuenta =>
        cuenta.permite_movimiento &&
        cuenta.estado
    )
  );


  /* =============================================================
     ORÍGENES
     ============================================================= */

  readonly tiposOrigen: TipoOrigen[] = [
    'MANUAL',
    'VENTA',
    'COMPRA',
    'COBRO',
    'PAGO',
    'NOMINA',
    'OTRO'
  ];


  /* =============================================================
     FILTROS
     ============================================================= */

  readonly filteredAsientos = computed(() => {

    const search =
      this.searchTerm()
        .trim()
        .toLowerCase();

    const status =
      this.selectedStatus();

    const origin =
      this.selectedOrigin();

    return this.asientos().filter(asiento => {

      const matchesSearch =
        !search ||
        asiento.concepto
          .toLowerCase()
          .includes(search) ||
        asiento.asiento_id
          .toString()
          .includes(search) ||
        (asiento.tipo_origen ?? '')
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        status === 'TODOS' ||
        (status === 'ACTIVOS' && asiento.estado) ||
        (status === 'INACTIVOS' && !asiento.estado);

      const matchesOrigin =
        origin === 'TODOS' ||
        asiento.tipo_origen === origin;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesOrigin
      );
    });
  });


  /* =============================================================
     RESUMEN
     ============================================================= */

  readonly totalAsientos = computed(() =>
    this.asientos().length
  );

  readonly activos = computed(() =>
    this.asientos()
      .filter(asiento => asiento.estado)
      .length
  );

  readonly inactivos = computed(() =>
    this.asientos()
      .filter(asiento => !asiento.estado)
      .length
  );

  readonly balanceados = computed(() =>
    this.asientos()
      .filter(asiento =>
        this.isBalancedAmount(
          asiento.total_debe,
          asiento.total_haber
        )
      )
      .length
  );


  /* =============================================================
     CANTIDAD DE DETALLES
     ============================================================= */

  readonly detalleCount = computed(() =>
    this.form().detalles.length
  );


  /* =============================================================
     TOTALES DEL FORMULARIO
     -------------------------------------------------------------
     Los totales NO se editan manualmente.
     Se derivan de todos los detalles actuales.
     ============================================================= */

  readonly totalDebe = computed(() =>
    this.form().detalles.reduce(
      (total, detalle) =>
        total + this.toNumber(detalle.debe),
      0
    )
  );

  readonly totalHaber = computed(() =>
    this.form().detalles.reduce(
      (total, detalle) =>
        total + this.toNumber(detalle.haber),
      0
    )
  );

  readonly diferencia = computed(() =>
    this.totalDebe() - this.totalHaber()
  );

  readonly diferenciaAbsoluta = computed(() =>
    Math.abs(this.diferencia())
  );

  readonly asientoBalanceado = computed(() =>
    this.isBalancedAmount(
      this.totalDebe(),
      this.totalHaber()
    )
  );


  /* =============================================================
     VALIDACIÓN
     ============================================================= */

  readonly canSave = computed(() => {

    const currentForm =
      this.form();

    const detalles =
      currentForm.detalles;

    if (!currentForm.fecha.trim()) {
      return false;
    }

    if (!currentForm.concepto.trim()) {
      return false;
    }

    if (currentForm.usuario_id <= 0) {
      return false;
    }

    /*
     * Un asiento contable debe tener como mínimo
     * dos detalles para poder cuadrarse.
     */
    if (detalles.length < 2) {
      return false;
    }

    const detallesValidos =
      detalles.every(detalle => {

        const cuenta =
          this.getCuenta(detalle.cuenta_id);

        const cuentaValida =
          !!cuenta &&
          cuenta.permite_movimiento &&
          cuenta.estado;

        const debe =
          this.toNumber(detalle.debe);

        const haber =
          this.toNumber(detalle.haber);

        const tieneDebe =
          debe > 0;

        const tieneHaber =
          haber > 0;

        /*
         * Un detalle debe afectar exactamente
         * uno de los dos lados.
         */
        const ladoValido =
          tieneDebe !== tieneHaber;

        return (
          cuentaValida &&
          ladoValido
        );
      });

    return (
      detallesValidos &&
      this.asientoBalanceado()
    );
  });


  /* =============================================================
     CREAR ASIENTO
     ============================================================= */

  createEntry(): void {

    this.form.set({

      usuario_id: 1,

      fecha: this.getToday(),

      concepto: '',

      tipo_origen: 'MANUAL',

      estado: true,

      /*
       * Dos detalles iniciales.
       *
       * Esto NO limita la cantidad de detalles.
       * El usuario puede agregar N detalles.
       */
      detalles: [
        this.createEmptyDetail(),
        this.createEmptyDetail()
      ]
    });

    this.selectedAsiento.set(null);

    this.modalMode.set('create');
  }


  /* =============================================================
     EDITAR ASIENTO
     -------------------------------------------------------------
     Se carga el asiento completo:
     encabezado + TODOS sus detalles.
     ============================================================= */

  editEntry(
    asiento: AsientoContable
  ): void {

    this.selectedAsiento.set(asiento);

    this.form.set({

      usuario_id:
        asiento.usuario_id,

      fecha:
        asiento.fecha,

      concepto:
        asiento.concepto,

      tipo_origen:
        asiento.tipo_origen,

      estado:
        asiento.estado,

      /*
       * Clonamos todos los detalles.
       *
       * De esta forma:
       *
       * - Los existentes conservan su detalle_id.
       * - Los nuevos tendrán detalle_id = null.
       * - Los eliminados dejarán de existir en el arreglo.
       */
      detalles:
        this.cloneDetailsFrom(
          asiento.detalles
        )
    });

    this.modalMode.set('edit');
  }


  /* =============================================================
     VER ASIENTO
     ============================================================= */

  viewEntry(
    asiento: AsientoContable
  ): void {

    this.selectedAsiento.set(asiento);

    this.viewModalOpen.set(true);
  }


  /* =============================================================
     CERRAR FORMULARIO
     ============================================================= */

  closeFormModal(): void {

    this.modalMode.set(null);

    this.selectedAsiento.set(null);
  }


  /* =============================================================
     CERRAR MODAL VER
     ============================================================= */

  closeViewModal(): void {

    this.viewModalOpen.set(false);

    this.selectedAsiento.set(null);
  }


  /* =============================================================
     AGREGAR DETALLE
     ============================================================= */

  addDetail(): void {

    this.form.update(
      current => ({

        ...current,

        detalles: [
          ...current.detalles,

          this.createEmptyDetail()
        ]
      })
    );
  }


  /* =============================================================
     ELIMINAR DETALLE
     -------------------------------------------------------------
     Ahora sí se elimina físicamente del arreglo local.

     No obligamos a mantener dos detalles durante la edición.
     El formulario puede quedar temporalmente con uno.

     La validación de guardado exige nuevamente mínimo dos.
     ============================================================= */

  removeDetail(
    index: number
  ): void {

    const current =
      this.form();

    if (
      index < 0 ||
      index >= current.detalles.length
    ) {
      return;
    }

    const detalles =
      current.detalles.filter(
        (_, i) => i !== index
      );

    this.form.set({

      ...current,

      detalles
    });
  }


  /* =============================================================
     ACTUALIZAR CUENTA
     ============================================================= */

  updateDetailAccount(
    index: number,
    value: string
  ): void {

    const cuentaId =
      value
        ? Number(value)
        : null;

    const detalles =
      this.cloneDetails();

    if (!detalles[index]) {
      return;
    }

    detalles[index] = {

      ...detalles[index],

      cuenta_id:
        cuentaId
    };

    this.updateDetails(detalles);
  }


  /* =============================================================
     ACTUALIZAR DEBE
     ============================================================= */

  updateDetailDebe(
    index: number,
    value: string
  ): void {

    const debe =
      this.parseAmount(value);

    const detalles =
      this.cloneDetails();

    if (!detalles[index]) {
      return;
    }

    detalles[index] = {

      ...detalles[index],

      debe,

      /*
       * Si se escribe Debe,
       * Haber se limpia automáticamente.
       */
      haber:
        debe > 0
          ? 0
          : detalles[index].haber
    };

    this.updateDetails(detalles);
  }


  /* =============================================================
     ACTUALIZAR HABER
     ============================================================= */

  updateDetailHaber(
    index: number,
    value: string
  ): void {

    const haber =
      this.parseAmount(value);

    const detalles =
      this.cloneDetails();

    if (!detalles[index]) {
      return;
    }

    detalles[index] = {

      ...detalles[index],

      haber,

      /*
       * Si se escribe Haber,
       * Debe se limpia automáticamente.
       */
      debe:
        haber > 0
          ? 0
          : detalles[index].debe
    };

    this.updateDetails(detalles);
  }


  /* =============================================================
     GUARDAR ASIENTO
     -------------------------------------------------------------
     Simula:
     
     CREATE:
       INSERT asiento
       INSERT detalles

     EDIT:
       UPDATE asiento
       UPDATE detalles existentes
       INSERT detalles nuevos
       DELETE detalles eliminados
     
     Todo se representa localmente en el signal.
     ============================================================= */

  saveEntry(): void {

    if (!this.canSave()) {
      return;
    }

    const currentForm =
      this.form();

    const totalDebe =
      this.roundAmount(
        this.totalDebe()
      );

    const totalHaber =
      this.roundAmount(
        this.totalHaber()
      );


    /* =========================================================
       CREAR
       ========================================================= */

    if (
      this.modalMode() === 'create'
    ) {

      const newId =
        this.getNextAsientoId();

      const detalles =
        this.assignDetailIds(
          currentForm.detalles
        );

      const nuevoAsiento:
        AsientoContable = {

        asiento_id:
          newId,

        usuario_id:
          currentForm.usuario_id,

        fecha:
          currentForm.fecha,

        concepto:
          currentForm.concepto.trim(),

        tipo_origen:
          currentForm.tipo_origen,

        estado:
          currentForm.estado,

        total_debe:
          totalDebe,

        total_haber:
          totalHaber,

        detalles
      };

      this.asientos.update(
        asientos => [
          nuevoAsiento,
          ...asientos
        ]
      );
    }


    /* =========================================================
       EDITAR
       ========================================================= */

    else if (
      this.modalMode() === 'edit' &&
      this.selectedAsiento()
    ) {

      const id =
        this.selectedAsiento()!.asiento_id;

      /*
       * Los detalles actuales son la fuente de verdad.
       *
       * Si un detalle original ya no está aquí,
       * significa que fue eliminado.
       *
       * Si tiene detalle_id = null,
       * significa que es nuevo.
       */
      const detalles =
        this.assignDetailIds(
          currentForm.detalles
        );

      this.asientos.update(
        asientos =>
          asientos.map(
            asiento => {

              if (
                asiento.asiento_id !== id
              ) {
                return asiento;
              }

              return {

                ...asiento,

                usuario_id:
                  currentForm.usuario_id,

                fecha:
                  currentForm.fecha,

                concepto:
                  currentForm.concepto.trim(),

                tipo_origen:
                  currentForm.tipo_origen,

                estado:
                  currentForm.estado,

                total_debe:
                  totalDebe,

                total_haber:
                  totalHaber,

                /*
                 * Esta nueva colección reemplaza
                 * la anterior.
                 *
                 * Por tanto:
                 * - existentes modificados -> actualizados
                 * - nuevos -> agregados
                 * - ausentes -> eliminados
                 */
                detalles
              };
            }
          )
      );
    }

    this.closeFormModal();
  }


  /* =============================================================
     BUSCAR CUENTA
     ============================================================= */

  getCuenta(
    cuentaId: number | null
  ): CuentaContable | null {

    if (
      cuentaId === null
    ) {
      return null;
    }

    return (
      this.cuentas().find(
        cuenta =>
          cuenta.cuenta_id === cuentaId
      ) ?? null
    );
  }


  /* =============================================================
     NOMBRE DE CUENTA
     ============================================================= */

  getNombreCuenta(
    cuentaId: number | null
  ): string {

    const cuenta =
      this.getCuenta(cuentaId);

    if (!cuenta) {
      return 'Sin cuenta';
    }

    return `${cuenta.codigo_cuenta} - ${cuenta.nombre_cuenta}`;
  }


  /* =============================================================
     FORMATO ORIGEN
     ============================================================= */

  formatOrigin(
    origin: TipoOrigen | string | null
  ): string {

    if (!origin) {
      return '—';
    }

    return origin;
  }


  /* =============================================================
     FORMATO ESTADO
     ============================================================= */

  getStatusLabel(
    estado: boolean
  ): string {

    return estado
      ? 'Activo'
      : 'Inactivo';
  }


  /* =============================================================
     FORMATO MONETARIO
     ============================================================= */

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


  /* =============================================================
     CREAR DETALLE VACÍO
     ============================================================= */

  private createEmptyDetail():
    DetalleAsiento {

    return {

      detalle_id:
        null,

      cuenta_id:
        null,

      debe:
        0,

      haber:
        0
    };
  }


  /* =============================================================
     CLONAR DETALLES DEL ASIENTO
     ============================================================= */

  private cloneDetailsFrom(
    detalles: DetalleAsiento[]
  ): DetalleAsiento[] {

    return detalles.map(
      detalle => ({
        ...detalle
      })
    );
  }


  /* =============================================================
     CLONAR DETALLES DEL FORMULARIO
     ============================================================= */

  private cloneDetails():
    DetalleAsiento[] {

    return this.form()
      .detalles
      .map(
        detalle => ({
          ...detalle
        })
      );
  }


  /* =============================================================
     ACTUALIZAR DETALLES
     ============================================================= */

  private updateDetails(
    detalles: DetalleAsiento[]
  ): void {

    this.form.update(
      form => ({

        ...form,

        detalles
      })
    );
  }


  /* =============================================================
     ASIGNAR IDS TEMPORALES
     ============================================================= */

  private assignDetailIds(
    detalles: DetalleAsiento[]
  ): DetalleAsiento[] {

    let nextId =
      this.getNextDetailId();

    return detalles.map(
      detalle => {

        /*
         * Detalle existente.
         */
        if (
          detalle.detalle_id !== null
        ) {

          return {
            ...detalle
          };
        }

        /*
         * Detalle nuevo.
         */
        const newDetail = {

          ...detalle,

          detalle_id:
            nextId
        };

        nextId++;

        return newDetail;
      }
    );
  }


  /* =============================================================
     SIGUIENTE ID DE ASIENTO
     ============================================================= */

  private getNextAsientoId():
    number {

    const ids =
      this.asientos()
        .map(
          asiento =>
            asiento.asiento_id
        );

    if (!ids.length) {
      return 1;
    }

    return Math.max(...ids) + 1;
  }


  /* =============================================================
     SIGUIENTE ID DE DETALLE
     ============================================================= */

  private getNextDetailId():
    number {

    const ids =
      this.asientos()
        .flatMap(
          asiento =>
            asiento.detalles
              .map(
                detalle =>
                  detalle.detalle_id
              )
              .filter(
                (
                  id
                ): id is number =>
                  id !== null
              )
        );

    if (!ids.length) {
      return 1;
    }

    return Math.max(...ids) + 1;
  }


  /* =============================================================
     FECHA ACTUAL
     ============================================================= */

  private getToday():
    string {

    const date =
      new Date();

    const offset =
      date.getTimezoneOffset();

    const localDate =
      new Date(
        date.getTime() -
        offset * 60 * 1000
      );

    return localDate
      .toISOString()
      .slice(0, 10);
  }


  /* =============================================================
     CONVERTIR A NÚMERO
     ============================================================= */

  private toNumber(
    value:
      number |
      null |
      undefined
  ): number {

    const number =
      Number(value);

    return Number.isFinite(number)
      ? number
      : 0;
  }


  /* =============================================================
     PARSEAR MONTO
     ============================================================= */

  private parseAmount(
    value: string
  ): number {

    const amount =
      Number(value);

    if (
      !Number.isFinite(amount)
    ) {
      return 0;
    }

    if (amount < 0) {
      return 0;
    }

    return this.roundAmount(
      amount
    );
  }


  /* =============================================================
     REDONDEAR
     ============================================================= */

  private roundAmount(
    amount: number
  ): number {

    return Math.round(
      amount * 100
    ) / 100;
  }


  /* =============================================================
     VALIDAR BALANCE
     ============================================================= */

  isBalancedAmount(
    debe: number,
    haber: number
  ): boolean {

    return (
      Math.abs(
        this.roundAmount(debe) -
        this.roundAmount(haber)
      ) < 0.005
    );
  }
}