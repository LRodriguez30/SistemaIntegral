import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  forkJoin
} from 'rxjs';

import { CatalogoCuentasService } from '../../../../../services/catalogo_cuentas.service';

import {
  AsientosContablesService,
  AsientosContablesResponse,
  CreateAsientoContable,
  UpdateAsientoContable
} from '../../../../../services/asientos_contables.service';

import {
  DetallesAsientosContablesService,
  DetallesAsientosContablesResponse,
  CreateDetallesAsientosContables,
  UpdateDetallesAsientosContables
} from '../../../../../services/detalles_asientos_contables.service';


/* =============================================================
   TIPOS
   ============================================================= */

type TipoOrigen =
  | 'VENTA'
  | 'COMPRA'
  | 'CAJA'
  | 'BANCO'
  | 'NOMINA'
  | 'AJUSTE'
  | 'DEPRECIACION'
  | 'CIERRE';


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
   ============================================================= */

interface DetalleAsiento {

  detalle_id: number | null;

  cuenta_id: number | null;

  debe: number;

  haber: number;

}


/* =============================================================
   ASIENTO CONTABLE
   ============================================================= */

interface AsientoContable {

  asiento_id: number;

  usuario_id: number;

  fecha: string;

  concepto: string;

  tipo_origen: TipoOrigen | null;

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
export class AsientosContablesComponent
  implements OnInit {


  /* =============================================================
     SERVICIOS
     ============================================================= */

  private readonly catalogoCuentasService =
    inject(CatalogoCuentasService);

  private readonly asientosContablesService =
    inject(AsientosContablesService);

  private readonly detallesAsientosContablesService =
    inject(DetallesAsientosContablesService);


  /* =============================================================
     ESTADO PRINCIPAL
     ============================================================= */

  readonly searchTerm =
    signal('');

  readonly selectedOrigin =
    signal<TipoOrigen | 'TODOS'>('TODOS');


  /* =============================================================
     CARGA
     ============================================================= */

  readonly loading =
    signal(false);

  readonly saving =
    signal(false);


  /* =============================================================
     ESTADO PARA ACCIONES DEL HEADER
     ============================================================= */

  readonly loadingAsientos =
    computed(() =>
      this.loading() ||
      this.saving()
    );

  readonly hasAsientos =
    computed(() =>
      this.asientos().length > 0
    );


  /* =============================================================
     ERROR
     ============================================================= */

  readonly errorMessage =
    signal<string | null>(null);


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

  readonly form =
    signal<AsientoForm>({

      usuario_id: 1,

      fecha: this.getToday(),

      concepto: '',

      tipo_origen: 'AJUSTE',

      detalles: [

        this.createEmptyDetail(),

        this.createEmptyDetail()

      ]

    });


  /* =============================================================
     CUENTAS
     ============================================================= */

  readonly cuentas =
    signal<CuentaContable[]>([]);


  /* =============================================================
     ASIENTOS
     ============================================================= */

  readonly asientos =
    signal<AsientoContable[]>([]);


  /* =============================================================
     INICIALIZACIÓN
     ============================================================= */

  ngOnInit(): void {

    this.loadData();

  }


  /* =============================================================
     CARGAR DATOS
     -------------------------------------------------------------
     Se cargan:

     - Catálogo de cuentas
     - Encabezados de asientos
     - Todos los detalles

     Los detalles se agrupan posteriormente por asiento_id.
     ============================================================= */

  private loadData(): void {

    this.loading.set(true);

    this.errorMessage.set(null);

    forkJoin({

      cuentas:
        this.catalogoCuentasService
          .getCatalogoCuentas(),

      asientos:
        this.asientosContablesService
          .getAsientosContables(),

      detalles:
        this.detallesAsientosContablesService
          .getDetallesAsientosContables()

    }).subscribe({

      next: ({
        cuentas,
        asientos,
        detalles
      }) => {

        this.cuentas.set(
          cuentas as CuentaContable[]
        );

        this.asientos.set(
          this.combineAsientos(
            asientos,
            detalles
          )
        );

        this.loading.set(false);

      },

      error: (error) => {

        console.error(
          'Error cargando datos contables:',
          error
        );

        this.errorMessage.set(
          'No se pudieron cargar los datos contables.'
        );

        this.loading.set(false);

      }

    });

  }


  /* =============================================================
     ACTUALIZAR DATOS
     -------------------------------------------------------------
     Método utilizado por el botón "Actualizar" del HTML.
     ============================================================= */

  loadAccountingEntries(): void {

    if (this.loadingAsientos()) {
      return;
    }

    this.loadData();

  }


  /* =============================================================
     CREAR PLANTILLA BASE
     -------------------------------------------------------------
     POST /asientos-contables/layout
     ============================================================= */

  generateBaseEntries(): void {

    if (this.loadingAsientos()) {
      return;
    }

    this.loading.set(true);

    this.errorMessage.set(null);

    this.asientosContablesService
      .createBaseLayout()
      .subscribe({

        next: () => {

          this.loadData();

        },

        error: (error) => {

          console.error(
            'Error creando la plantilla base:',
            error
          );

          this.errorMessage.set(
            'No se pudo crear la plantilla base.'
          );

          this.loading.set(false);

        }

      });

  }


  /* =============================================================
     CREAR PLANTILLA COMPLETA
     -------------------------------------------------------------
     POST /asientos-contables/full-layout
     ============================================================= */

  generateFullBaseEntries(): void {

    if (this.loadingAsientos()) {
      return;
    }

    this.loading.set(true);

    this.errorMessage.set(null);

    this.asientosContablesService
      .createFullBaseLayout()
      .subscribe({

        next: () => {

          this.loadData();

        },

        error: (error) => {

          console.error(
            'Error creando la plantilla completa:',
            error
          );

          this.errorMessage.set(
            'No se pudo crear la plantilla completa.'
          );

          this.loading.set(false);

        }

      });

  }


  /* =============================================================
     ELIMINAR TODOS LOS REGISTROS
     -------------------------------------------------------------
     Primero se eliminan los detalles y después los encabezados
     porque los detalles tienen una FK hacia los asientos.
     ============================================================= */

  deleteAllEntries(): void {

    if (
      this.loadingAsientos() ||
      !this.hasAsientos()
    ) {
      return;
    }

    this.loading.set(true);

    this.errorMessage.set(null);

    this.detallesAsientosContablesService
      .deleteDetallesAsientosContables()
      .subscribe({

        next: () => {

          this.deleteAllAsientos();

        },

        error: (error) => {

          console.error(
            'Error eliminando los detalles de los asientos:',
            error
          );

          this.errorMessage.set(
            'No se pudieron eliminar los detalles de los asientos.'
          );

          this.loading.set(false);

        }

      });

  }


  /* =============================================================
     ELIMINAR TODOS LOS ENCABEZADOS
     ============================================================= */

  private deleteAllAsientos(): void {

    this.asientosContablesService
      .deleteRecords()
      .subscribe({

        next: () => {

          this.asientos.set([]);

          this.loadData();

        },

        error: (error) => {

          console.error(
            'Error eliminando los asientos:',
            error
          );

          this.errorMessage.set(
            'No se pudieron eliminar los asientos contables.'
          );

          this.loading.set(false);

        }

      });

  }


  /* =============================================================
     COMBINAR ASIENTOS + DETALLES
     ============================================================= */

  private combineAsientos(
    asientos: AsientosContablesResponse[],
    detalles: DetallesAsientosContablesResponse[]
  ): AsientoContable[] {

    return asientos.map(
      asiento => {

        const detallesAsiento =
          detalles
            .filter(
              detalle =>
                detalle.asiento_id ===
                asiento.asiento_id
            )
            .map(
              detalle => ({

                detalle_id:
                  detalle.detalle_id,

                cuenta_id:
                  detalle.cuenta_id,

                debe:
                  this.toNumber(
                    detalle.debe
                  ),

                haber:
                  this.toNumber(
                    detalle.haber
                  )

              })
            );

        return {

          asiento_id:
            asiento.asiento_id,

          usuario_id:
            asiento.usuario_id,

          fecha:
            this.normalizeDate(
              asiento.fecha
            ),

          concepto:
            asiento.concepto,

          tipo_origen:
            asiento.tipo_origen,

          total_debe:
            this.toNumber(
              asiento.total_debe
            ),

          total_haber:
            this.toNumber(
              asiento.total_haber
            ),

          detalles:
            detallesAsiento

        };

      }
    );

  }


  /* =============================================================
     INFORMACIÓN DEL FORMULARIO
     ============================================================= */

  readonly cuentasMovimiento =
    computed(() =>
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

    'VENTA',

    'COMPRA',

    'CAJA',

    'BANCO',

    'NOMINA',

    'AJUSTE',

    'DEPRECIACION',

    'CIERRE'

  ];


  /* =============================================================
     FILTROS
     ============================================================= */

  readonly filteredAsientos =
    computed(() => {

      const search =
        this.searchTerm()
          .trim()
          .toLowerCase();

      const origin =
        this.selectedOrigin();

      return this.asientos()
        .filter(
          asiento => {

            const matchesSearch =
              !search ||

              asiento.concepto
                .toLowerCase()
                .includes(search) ||

              asiento.asiento_id
                .toString()
                .includes(search) ||

              (
                asiento.tipo_origen ?? ''
              )
                .toLowerCase()
                .includes(search);

            const matchesOrigin =
              origin === 'TODOS' ||
              asiento.tipo_origen === origin;

            return (
              matchesSearch &&
              matchesOrigin
            );

          }
        );

    });


  /* =============================================================
     RESUMEN
     ============================================================= */

  readonly totalAsientos =
    computed(() =>
      this.asientos().length
    );


  readonly balanceados =
    computed(() =>
      this.asientos()
        .filter(
          asiento =>
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

  readonly detalleCount =
    computed(() =>
      this.form().detalles.length
    );


  /* =============================================================
     TOTALES DEL FORMULARIO
     ============================================================= */

  readonly totalDebe =
    computed(() =>
      this.form()
        .detalles
        .reduce(
          (total, detalle) =>
            total +
            this.toNumber(
              detalle.debe
            ),
          0
        )
    );


  readonly totalHaber =
    computed(() =>
      this.form()
        .detalles
        .reduce(
          (total, detalle) =>
            total +
            this.toNumber(
              detalle.haber
            ),
          0
        )
    );


  readonly diferencia =
    computed(() =>
      this.totalDebe() -
      this.totalHaber()
    );


  readonly diferenciaAbsoluta =
    computed(() =>
      Math.abs(
        this.diferencia()
      )
    );


  readonly asientoBalanceado =
    computed(() =>
      this.isBalancedAmount(
        this.totalDebe(),
        this.totalHaber()
      )
    );


  /* =============================================================
     CAMBIOS RESPECTO AL ASIENTO ORIGINAL
     ============================================================= */

  readonly hasChanges =
    computed(() => {

      if (
        this.modalMode() !== 'edit'
      ) {
        return true;
      }

      const asiento =
        this.selectedAsiento();

      if (!asiento) {
        return false;
      }

      const currentForm =
        this.form();

      return (
        this.hasHeaderChanges(
          asiento,
          currentForm
        ) ||
        this.hasDetailsChanges(
          asiento,
          currentForm.detalles
        )
      );

    });


  /* =============================================================
     VALIDACIÓN
     ============================================================= */

  readonly canSave =
    computed(() => {

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

      if (!currentForm.tipo_origen) {
        return false;
      }

      if (
        currentForm.usuario_id <= 0
      ) {
        return false;
      }

      if (
        detalles.length < 2
      ) {
        return false;
      }

      const detallesValidos =
        detalles.every(
          detalle => {

            if (this.isDetailLocked(detalle)) {
              return true;
            }

            const cuenta =
              this.getCuenta(
                detalle.cuenta_id
              );

            const cuentaValida =
              !!cuenta &&
              cuenta.permite_movimiento &&
              cuenta.estado;

            const debe =
              this.toNumber(
                detalle.debe
              );

            const haber =
              this.toNumber(
                detalle.haber
              );

            const tieneDebe =
              debe > 0;

            const tieneHaber =
              haber > 0;

            const ladoValido =
              tieneDebe !==
              tieneHaber;

            return (
              cuentaValida &&
              ladoValido
            );

          }
        );

      return (
        detallesValidos &&
        this.asientoBalanceado() &&
        this.hasChanges()
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

      tipo_origen: 'AJUSTE',

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
     ============================================================= */

  editEntry(
    asiento: AsientoContable
  ): void {

    this.selectedAsiento.set(
      asiento
    );

    this.form.set({

      usuario_id:
        asiento.usuario_id,

      fecha:
        asiento.fecha,

      concepto:
        asiento.concepto,

      tipo_origen:
        asiento.tipo_origen,

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

    this.selectedAsiento.set(
      asiento
    );

    this.viewModalOpen.set(
      true
    );

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
     ============================================================= */

  removeDetail(
    index: number
  ): void {

    const current =
      this.form();

    if (
      index < 0 ||
      index >=
        current.detalles.length
    ) {
      return;
    }

    if (
      this.isDetailLocked(
        current.detalles[index]
      )
    ) {
      return;
    }

    const detalles =
      current.detalles.filter(
        (_, i) =>
          i !== index
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

    if (this.isDetailLocked(detalles[index])) {
      return;
    }

    detalles[index] = {

      ...detalles[index],

      cuenta_id:
        cuentaId

    };

    this.updateDetails(
      detalles
    );

  }


  /* =============================================================
     ACTUALIZAR DEBE
     ============================================================= */

  updateDetailDebe(
    index: number,
    value: string
  ): void {

    const debe =
      this.parseAmount(
        value
      );

    const detalles =
      this.cloneDetails();

    if (!detalles[index]) {
      return;
    }

    detalles[index] = {

      ...detalles[index],

      debe,

      haber:
        debe > 0
          ? 0
          : detalles[index].haber

    };

    this.updateDetails(
      detalles
    );

  }


  /* =============================================================
     ACTUALIZAR HABER
     ============================================================= */

  updateDetailHaber(
    index: number,
    value: string
  ): void {

    const haber =
      this.parseAmount(
        value
      );

    const detalles =
      this.cloneDetails();

    if (!detalles[index]) {
      return;
    }

    detalles[index] = {

      ...detalles[index],

      haber,

      debe:
        haber > 0
          ? 0
          : detalles[index].debe

    };

    this.updateDetails(
      detalles
    );

  }


  /* =============================================================
     GUARDAR ASIENTO
     ============================================================= */

  saveEntry(): void {

    if (
      !this.canSave() ||
      this.saving()
    ) {
      return;
    }

    const mode =
      this.modalMode();

    if (
      mode === 'create'
    ) {

      this.createEntryInBackend();

      return;

    }

    if (
      mode === 'edit' &&
      this.selectedAsiento()
    ) {

      this.updateEntryInBackend();

    }

  }


  /* =============================================================
     CREAR EN BACKEND
     -------------------------------------------------------------
     Primero se crea el encabezado para obtener
     el asiento_id generado por PostgreSQL.

     Después se crean todos sus detalles.
     ============================================================= */

  private createEntryInBackend(): void {

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

    const dto:
      CreateAsientoContable = {

      usuario_id:
        currentForm.usuario_id,

      fecha:
        currentForm.fecha,

      concepto:
        currentForm.concepto.trim(),

      tipo_origen:
        currentForm.tipo_origen!,

      total_debe:
        totalDebe,

      total_haber:
        totalHaber

    };

    this.saving.set(true);

    this.asientosContablesService
      .createAsientoContable(dto)
      .subscribe({

        next: (asientoCreado) => {

          const detalles =
            currentForm.detalles.map(
              detalle => ({

                debe:
                  this.roundAmount(
                    detalle.debe
                  ),

                haber:
                  this.roundAmount(
                    detalle.haber
                  ),

                asiento_id:
                  asientoCreado.asiento_id,

                cuenta_id:
                  detalle.cuenta_id!

              })
            );

          this.createDetailsAfterHeader(
            detalles
          );

        },

        error: (error) => {

          console.error(
            'Error creando el asiento:',
            error
          );

          this.saving.set(false);

        }

      });

  }


  /* =============================================================
     CREAR DETALLES DESPUÉS DEL ENCABEZADO
     ============================================================= */

  private createDetailsAfterHeader(
    detalles: CreateDetallesAsientosContables[]
  ): void {

    const requests =
      detalles.map(
        detalle =>
          this.detallesAsientosContablesService
            .createDetalleAsientoContable(
              detalle
            )
      );

    if (!requests.length) {

      this.finishSave();

      return;

    }

    forkJoin(
      requests
    ).subscribe({

      next: () => {

        this.finishSave();

      },

      error: (error) => {

        console.error(
          'Error creando los detalles del asiento:',
          error
        );

        this.saving.set(false);

      }

    });

  }


  /* =============================================================
     ACTUALIZAR ASIENTO EN BACKEND
     -------------------------------------------------------------
     Solo se envía al encabezado lo que realmente cambió.
     Si el encabezado no cambió, se salta directo a los detalles.
     ============================================================= */

  private updateEntryInBackend(): void {

    const asiento =
      this.selectedAsiento();

    if (!asiento) {
      return;
    }

    const currentForm =
      this.form();

    const asientoDto =
      this.buildHeaderChanges(
        asiento,
        currentForm
      );

    this.saving.set(true);

    if (
      !Object.keys(asientoDto).length
    ) {

      this.updateDetailsInBackend(
        asiento,
        currentForm.detalles
      );

      return;

    }

    this.asientosContablesService
      .updateAsientoContable(
        asiento.asiento_id,
        asientoDto
      )
      .subscribe({

        next: () => {

          this.updateDetailsInBackend(
            asiento,
            currentForm.detalles
          );

        },

        error: (error) => {

          console.error(
            'Error actualizando el asiento:',
            error
          );

          this.saving.set(false);

        }

      });

  }


  /* =============================================================
     ACTUALIZAR DETALLES EN BACKEND
     -------------------------------------------------------------
     Existente y modificado:
       PATCH (solo campos modificados)

     Nuevo:
       POST

     Eliminado:
       DELETE
     ============================================================= */

  private updateDetailsInBackend(
    asiento: AsientoContable,
    nuevosDetalles: DetalleAsiento[]
  ): void {

    const detallesOriginales =
      asiento.detalles;

    const idsActuales =
      nuevosDetalles
        .map(
          detalle =>
            detalle.detalle_id
        )
        .filter(
          (
            id
          ): id is number =>
            id !== null
        );

    const detallesEliminados =
      detallesOriginales.filter(
        detalle =>
          detalle.detalle_id !== null &&
          !idsActuales.includes(
            detalle.detalle_id
          )
      );

    const updates =
      nuevosDetalles
        .filter(
          detalle =>
            detalle.detalle_id !== null
        )
        .map(
          detalle => {

            const original =
              detallesOriginales.find(
                item =>
                  item.detalle_id ===
                  detalle.detalle_id
              );

            if (!original) {
              return null;
            }

            const dto =
              this.buildDetailChanges(
                original,
                detalle
              );

            if (
              !Object.keys(dto).length
            ) {
              return null;
            }

            return this.detallesAsientosContablesService
              .updateDetalleAsientoContable(
                detalle.detalle_id!,
                dto
              );

          }
        )
        .filter(
          (
            request
          ) =>
            request !== null
        );

    const creates =
      nuevosDetalles
        .filter(
          detalle =>
            detalle.detalle_id === null
        )
        .map(
          detalle => {

            const dto:
              CreateDetallesAsientosContables = {

              debe:
                this.roundAmount(
                  detalle.debe
                ),

              haber:
                this.roundAmount(
                  detalle.haber
                ),

              asiento_id:
                asiento.asiento_id,

              cuenta_id:
                detalle.cuenta_id!

            };

            return this.detallesAsientosContablesService
              .createDetalleAsientoContable(
                dto
              );

          }
        );

    const deletes =
      detallesEliminados
        .map(
          detalle =>
            this.detallesAsientosContablesService
              .deleteDetalleAsientoContable(
                detalle.detalle_id!
              )
        );

    const requests = [

      ...updates,

      ...creates,

      ...deletes

    ];

    if (!requests.length) {

      this.finishSave();

      return;

    }

    forkJoin(
      requests
    ).subscribe({

      next: () => {

        this.finishSave();

      },

      error: (error) => {

        console.error(
          'Error actualizando los detalles del asiento:',
          error
        );

        this.saving.set(false);

      }

    });

  }


  /* =============================================================
     FINALIZAR GUARDADO
     ============================================================= */

  private finishSave(): void {

    this.closeFormModal();

    this.loadData();

    this.saving.set(false);

  }


  /* =============================================================
     ELIMINAR ASIENTO
     -------------------------------------------------------------
     Primero elimina sus detalles porque la FK de detalles
     referencia al asiento.
     ============================================================= */

  deleteEntry(
    asiento: AsientoContable
  ): void {

    if (this.saving()) {
      return;
    }

    this.saving.set(true);

    const deleteDetails =
      asiento.detalles.map(
        detalle =>
          detalle.detalle_id !== null
            ? this.detallesAsientosContablesService
                .deleteDetalleAsientoContable(
                  detalle.detalle_id
                )
            : null
      )
      .filter(
        (
          request
        ) =>
          request !== null
      );

    if (!deleteDetails.length) {

      this.deleteHeaderAfterDetails(
        asiento.asiento_id
      );

      return;

    }

    forkJoin(
      deleteDetails
    ).subscribe({

      next: () => {

        this.deleteHeaderAfterDetails(
          asiento.asiento_id
        );

      },

      error: (error) => {

        console.error(
          'Error eliminando los detalles:',
          error
        );

        this.saving.set(false);

      }

    });

  }


  /* =============================================================
     ELIMINAR ENCABEZADO
     ============================================================= */

  private deleteHeaderAfterDetails(
    asientoId: number
  ): void {

    this.asientosContablesService
      .deleteAsientoContable(
        asientoId
      )
      .subscribe({

        next: () => {

          this.loadData();

          this.saving.set(false);

        },

        error: (error) => {

          console.error(
            'Error eliminando el asiento:',
            error
          );

          this.saving.set(false);

        }

      });

  }


  /* =============================================================
     CAMBIOS DEL ENCABEZADO
     ============================================================= */

  private hasHeaderChanges(
    asiento: AsientoContable,
    currentForm: AsientoForm
  ): boolean {

    return (
      currentForm.fecha !==
        asiento.fecha ||

      currentForm.concepto.trim() !==
        asiento.concepto.trim() ||

      currentForm.tipo_origen !==
        asiento.tipo_origen
    );

  }


  private buildHeaderChanges(
    asiento: AsientoContable,
    currentForm: AsientoForm
  ): UpdateAsientoContable {

    const dto:
      UpdateAsientoContable = {};

    if (
      currentForm.fecha !==
      asiento.fecha
    ) {

      dto.fecha =
        currentForm.fecha;

    }

    if (
      currentForm.concepto.trim() !==
      asiento.concepto.trim()
    ) {

      dto.concepto =
        currentForm.concepto.trim();

    }

    if (
      currentForm.tipo_origen &&
      currentForm.tipo_origen !==
        asiento.tipo_origen
    ) {

      dto.tipo_origen =
        currentForm.tipo_origen;

    }

    const totalDebe =
      this.roundAmount(
        this.totalDebe()
      );

    const totalHaber =
      this.roundAmount(
        this.totalHaber()
      );

    if (
      totalDebe !==
      this.roundAmount(
        asiento.total_debe
      )
    ) {

      dto.total_debe =
        totalDebe;

    }

    if (
      totalHaber !==
      this.roundAmount(
        asiento.total_haber
      )
    ) {

      dto.total_haber =
        totalHaber;

    }

    return dto;

  }


  /* =============================================================
     CAMBIOS DE LOS DETALLES
     ============================================================= */

  private hasDetailsChanges(
    asiento: AsientoContable,
    detalles: DetalleAsiento[]
  ): boolean {

    if (
      detalles.length !==
      asiento.detalles.length
    ) {
      return true;
    }

    return detalles.some(
      detalle => {

        if (
          detalle.detalle_id === null
        ) {
          return true;
        }

        const original =
          asiento.detalles.find(
            item =>
              item.detalle_id ===
              detalle.detalle_id
          );

        if (!original) {
          return true;
        }

        return (
          Object.keys(
            this.buildDetailChanges(
              original,
              detalle
            )
          ).length > 0
        );

      }
    );

  }


  private buildDetailChanges(
    original: DetalleAsiento,
    current: DetalleAsiento
  ): UpdateDetallesAsientosContables {

    const dto:
      UpdateDetallesAsientosContables = {};

    if (
      current.cuenta_id !==
      original.cuenta_id
    ) {

      dto.cuenta_id =
        current.cuenta_id!;

    }

    if (
      this.roundAmount(current.debe) !==
      this.roundAmount(original.debe)
    ) {

      dto.debe =
        this.roundAmount(
          current.debe
        );

    }

    if (
      this.roundAmount(current.haber) !==
      this.roundAmount(original.haber)
    ) {

      dto.haber =
        this.roundAmount(
          current.haber
        );

    }

    return dto;

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
          cuenta.cuenta_id ===
          cuentaId
      ) ?? null
    );

  }

  isDetailLocked(
    detalle: DetalleAsiento
  ): boolean {

    if (detalle.detalle_id === null) {
      return false;
    }

    const cuenta =
      this.getCuenta(
        detalle.cuenta_id
      );

    return !!cuenta && !cuenta.estado;

  }


  /* =============================================================
     NOMBRE DE CUENTA
     ============================================================= */

  getNombreCuenta(
    cuentaId: number | null
  ): string {

    const cuenta =
      this.getCuenta(
        cuentaId
      );

    if (!cuenta) {
      return 'Sin cuenta';
    }

    return `${cuenta.codigo_cuenta} - ${cuenta.nombre_cuenta}`;

  }


  /* =============================================================
     FORMATO ORIGEN
     ============================================================= */

  formatOrigin(
    origin:
      TipoOrigen |
      string |
      null
  ): string {

    if (!origin) {
      return '—';
    }

    return origin;

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
     NORMALIZAR FECHA
     ============================================================= */

  private normalizeDate(
    value:
      string |
      Date
  ): string {

    if (
      typeof value === 'string'
    ) {

      return value.slice(
        0,
        10
      );

    }

    return value
      .toISOString()
      .slice(
        0,
        10
      );

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

    return Number.isFinite(
      number
    )
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
      !Number.isFinite(
        amount
      )
    ) {

      return 0;

    }

    if (
      amount < 0
    ) {

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
        this.roundAmount(
          debe
        ) -
        this.roundAmount(
          haber
        )
      ) < 0.005
    );

  }

}