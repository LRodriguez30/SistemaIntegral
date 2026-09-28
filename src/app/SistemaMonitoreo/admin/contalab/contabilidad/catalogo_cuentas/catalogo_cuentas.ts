import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
  signal
} from '@angular/core';

import { forkJoin } from 'rxjs';

import {
  CatalogoCuentasResponse,
  CatalogoCuentasService
} from '../../../../../services/catalogo_cuentas.service';

import {
  DetallesAsientosContablesService
} from '../../../../../services/detalles_asientos_contables.service';


/*
 * =============================================================
 * CUENTAS BASE
 * =============================================================
 */

enum CuentaBaseCodigo {
  ACTIVOS = '1',
  PASIVOS = '2',
  PATRIMONIO = '3',
  INGRESOS = '4',
  COSTOS = '5',
  GASTOS = '6',
}


/*
 * =============================================================
 * FORMULARIO
 * =============================================================
 */

interface CuentaForm {
  codigo_cuenta: string;
  nombre_cuenta: string;
  tipo_cuenta: CatalogoCuentasResponse['tipo_cuenta'];
  naturaleza: CatalogoCuentasResponse['naturaleza'];
  cuenta_padre_id: number | null;
  nivel_cuenta: number;
  permite_movimiento: boolean;
  estado: boolean;
}


/*
 * =============================================================
 * COMPONENTE
 * =============================================================
 */

@Component({
  selector: 'app-catalogo-cuentas',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './catalogo_cuentas.css',
  templateUrl: './catalogo_cuentas.html'
})
export class CatalogoCuentasComponent implements OnInit {

  /*
   * ===========================================================
   * SERVICIOS
   * ===========================================================
   */

  readonly catalogoCuentasService =
    inject(CatalogoCuentasService);

  readonly detallesAsientosContablesService =
    inject(DetallesAsientosContablesService);


  /*
   * ===========================================================
   * ESTADO PRINCIPAL
   * ===========================================================
   */

  readonly cuentas =
    signal<CatalogoCuentasResponse[]>([]);

  readonly hasAccounts =
    computed(() =>
      this.cuentas().length > 0
    );

  readonly loadingAccounts =
    signal(false);


  /*
   * ===========================================================
   * CUENTAS UTILIZADAS EN DETALLES DE ASIENTOS
   * ===========================================================
   */

  readonly usedAccountIds =
    signal<Set<number>>(
      new Set()
    );


  /*
   * ===========================================================
   * MODALES
   * ===========================================================
   */

  readonly modalMode =
    signal<
      'create' |
      'edit' |
      'child' |
      null
    >(null);

  readonly selectedAccount =
    signal<CatalogoCuentasResponse | null>(
      null
    );

  readonly deleteBranchTarget =
    signal<CatalogoCuentasResponse | null>(
      null
    );


  /*
   * ===========================================================
   * SELECCIÓN DE TOOLBAR
   * ===========================================================
   */

  readonly toolbarAccount =
    signal<CatalogoCuentasResponse | null>(
      null
    );


  /*
   * ===========================================================
   * FORMULARIO
   * ===========================================================
   */

  readonly accountForm =
    signal<CuentaForm>({
      codigo_cuenta: '',
      nombre_cuenta: '',
      tipo_cuenta: 'ACTIVO',
      naturaleza: 'DEUDORA',
      cuenta_padre_id: null,
      nivel_cuenta: 1,
      permite_movimiento: true,
      estado: true
    });


  /*
   * ===========================================================
   * FILTROS
   * ===========================================================
   */

  readonly searchTerm =
    signal('');

  readonly selectedType =
    signal('TODOS');

  readonly selectedStatus =
    signal('TODOS');


  /*
   * ===========================================================
   * ÁRBOL
   * ===========================================================
   */

  readonly expandedAccounts =
    signal<Set<number>>(
      new Set()
    );


  /*
   * ===========================================================
   * CUENTAS BASE
   * ===========================================================
   */

  private readonly baseAccountCodes =
    new Set<string>(
      Object.values(CuentaBaseCodigo)
    );


  /*
   * ===========================================================
   * RESUMEN
   * ===========================================================
   */

  readonly totalAccounts =
    computed(() =>
      this.cuentas().length
    );

  readonly movementAccounts =
    computed(() =>
      this.cuentas().filter(
        cuenta =>
          cuenta.permite_movimiento
      ).length
    );

  readonly activeAccounts =
    computed(() =>
      this.cuentas().filter(
        cuenta =>
          cuenta.estado
      ).length
    );

  readonly parentAccounts =
    computed(() =>
      this.cuentas().filter(
        cuenta =>
          !cuenta.permite_movimiento
      ).length
    );


  /*
   * ===========================================================
   * CUENTAS FILTRADAS
   * ===========================================================
   */

  readonly filteredAccounts =
    computed(() => {

      const search =
        this.searchTerm()
          .trim()
          .toLowerCase();

      const type =
        this.selectedType();

      const status =
        this.selectedStatus();

      return this.cuentas()
        .filter(cuenta => {

          const matchesSearch =
            !search ||
            cuenta.codigo_cuenta
              .toLowerCase()
              .includes(search) ||
            cuenta.nombre_cuenta
              .toLowerCase()
              .includes(search);

          const matchesType =
            type === 'TODOS' ||
            cuenta.tipo_cuenta === type;

          const matchesStatus =
            status === 'TODOS' ||
            (
              status === 'ACTIVAS' &&
              cuenta.estado
            ) ||
            (
              status === 'INACTIVAS' &&
              !cuenta.estado
            );

          return (
            matchesSearch &&
            matchesType &&
            matchesStatus
          );
        })
        .sort((a, b) =>
          a.codigo_cuenta.localeCompare(
            b.codigo_cuenta,
            undefined,
            {
              numeric: true
            }
          )
        );
    });


  /*
   * ===========================================================
   * OPCIONES DE CUENTA PADRE
   * ===========================================================
   */

  readonly parentOptions =
    computed(() =>
      this.cuentas().filter(
        cuenta =>
          !cuenta.permite_movimiento
      )
    );


  /*
   * ===========================================================
   * CICLO DE VIDA
   * ===========================================================
   */

  ngOnInit(): void {
    this.getAccounts();
  }


  /*
   * ===========================================================
   * OBTENER CUENTAS
   * ===========================================================
   */

  getAccounts(): void {

    this.loadingAccounts.set(true);

    forkJoin({

      cuentas:
        this.catalogoCuentasService
          .getCatalogoCuentas(),

      detalles:
        this.detallesAsientosContablesService
          .getDetallesAsientosContables()

    }).subscribe({

        next: ({
          cuentas: data,
          detalles
        }) => {

          console.log(data);

          this.cuentas.set(data);

          this.usedAccountIds.set(
            new Set(
              detalles.map(
                detalle =>
                  Number(detalle.cuenta_id)
              )
            )
          );

          this.loadingAccounts.set(false);
        },

        error: (error) => {

          console.error(error);

          this.loadingAccounts.set(false);
        }

      });
  }


  /*
   * ===========================================================
   * GENERAR CUENTAS BASE
   * ===========================================================
   */

  generateBaseAccounts(): void {

    if (this.cuentas().length > 0) {
      return;
    }

    this.loadingAccounts.set(true);

    this.catalogoCuentasService
      .initBaseLayout()
      .subscribe({

        next: (accounts) => {

          this.cuentas.set(accounts);

          this.expandedAccounts.set(
            new Set(
              accounts
                .filter(
                  cuenta =>
                    cuenta.nivel_cuenta <= 2
                )
                .map(
                  cuenta =>
                    cuenta.cuenta_id
                )
            )
          );

          this.loadingAccounts.set(false);
        },

        error: (error) => {

          console.error(
            'Error creando la plantilla base:',
            error
          );

          this.loadingAccounts.set(false);
        }

      });
  }


  /*
   * ===========================================================
   * LIMPIAR CATÁLOGO
   * ===========================================================
   */

  clearAccounts(): void {

    this.cuentas.set([]);

    this.expandedAccounts.set(
      new Set()
    );

    this.searchTerm.set('');

    this.selectedType.set(
      'TODOS'
    );

    this.selectedStatus.set(
      'TODOS'
    );
  }


  /*
   * ===========================================================
   * SELECCIÓN DE CUENTA PARA TOOLBAR
   * ===========================================================
   */

  selectAccountForToolbar(
    cuenta: CatalogoCuentasResponse
  ): void {

    const current =
      this.toolbarAccount();

    if (
      current?.cuenta_id ===
      cuenta.cuenta_id
    ) {

      this.toolbarAccount.set(null);

      return;
    }

    this.toolbarAccount.set(cuenta);
  }


  /*
   * ===========================================================
   * VALIDACIONES TOOLBAR
   * ===========================================================
   */

  readonly selectedAccountHasChildren =
    computed(() => {

      const cuenta =
        this.toolbarAccount();

      if (!cuenta) {
        return false;
      }

      return this.hasChildren(cuenta);
    });


  readonly selectedAccountInUse =
    computed(() => {

      const cuenta =
        this.toolbarAccount();

      if (!cuenta) {
        return false;
      }

      return this.isInUse(cuenta);
    });


  readonly canDeleteSelectedAccount =
    computed(() => {

      const cuenta =
        this.toolbarAccount();

      if (!cuenta) {
        return false;
      }

      return (
        !this.hasChildren(cuenta) &&
        !this.isInUse(cuenta)
      );
    });


  readonly canAddChildSelectedAccount =
    computed(() => {

      const cuenta =
        this.toolbarAccount();

      if (!cuenta) {
        return false;
      }

      return !cuenta.permite_movimiento;
    });


  readonly canEditSelectedAccount =
    computed(() => {

      const cuenta =
        this.toolbarAccount();

      if (!cuenta) {
        return false;
      }

      return !this.isBaseAccount(cuenta);
    });


  /*
   * ===========================================================
   * VALIDAR ELIMINACIÓN DE CUENTA
   * ===========================================================
   */

  canDeleteAccount(
    cuenta: CatalogoCuentasResponse
  ): boolean {

    if (this.hasChildren(cuenta)) {
      return false;
    }

    if (this.isInUse(cuenta)) {
      return false;
    }

    return true;
  }


  /*
   * ===========================================================
   * USO EN DETALLES DE ASIENTOS
   * ===========================================================
   */

  isInUse(
    cuenta: CatalogoCuentasResponse
  ): boolean {

    const used =
      this.usedAccountIds();

    if (
      used.has(
        Number(cuenta.cuenta_id)
      )
    ) {
      return true;
    }

    return this.getDescendants(cuenta)
      .some(
        child =>
          used.has(
            Number(child.cuenta_id)
          )
      );
  }


  getDescendants(
    cuenta: CatalogoCuentasResponse
  ): CatalogoCuentasResponse[] {

    const all =
      this.cuentas();

    const result:
      CatalogoCuentasResponse[] = [];

    const pending = [
      Number(cuenta.cuenta_id)
    ];

    while (pending.length > 0) {

      const parentId =
        pending.pop()!;

      for (const child of all) {

        if (
          child.cuenta_padre_id !== null &&
          Number(child.cuenta_padre_id) ===
          parentId
        ) {

          result.push(child);

          pending.push(
            Number(child.cuenta_id)
          );
        }
      }
    }

    return result;
  }


  /*
   * ===========================================================
   * DESACTIVAR CUENTA Y DESCENDIENTES
   * ===========================================================
   */

  deactivateAccount(
    cuenta: CatalogoCuentasResponse
  ): void {

    const targets = [
      cuenta,
      ...this.getDescendants(cuenta)
    ].filter(
      item =>
        item.estado
    );

    if (targets.length === 0) {
      return;
    }

    this.loadingAccounts.set(true);

    forkJoin(
      targets.map(
        item =>
          this.catalogoCuentasService
            .updateCuenta(
              item.cuenta_id,
              {
                codigo_cuenta:
                  item.codigo_cuenta,

                nombre_cuenta:
                  item.nombre_cuenta,

                tipo_cuenta:
                  item.tipo_cuenta,

                naturaleza:
                  item.naturaleza,

                cuenta_padre_id:
                  item.cuenta_padre_id,

                nivel_cuenta:
                  item.nivel_cuenta,

                permite_movimiento:
                  item.permite_movimiento,

                estado:
                  false
              }
            )
      )
    ).subscribe({

      next: () => {

        this.toolbarAccount.set(
          null
        );

        this.getAccounts();
      },

      error: (error) => {

        console.error(
          'Error desactivando la cuenta:',
          error
        );

        this.loadingAccounts.set(false);
      }

    });
  }
  
    /*
   * ===========================================================
   * VALIDAR ACTIVACIÓN DE CUENTA
   * ===========================================================
   */

  canActivateAccount(
    cuenta: CatalogoCuentasResponse
  ): boolean {

    if (cuenta.estado) {
      return false;
    }

    if (cuenta.cuenta_padre_id === null) {
      return true;
    }

    const parent =
      this.cuentas().find(
        c =>
          Number(c.cuenta_id) ===
          Number(cuenta.cuenta_padre_id)
      );

    return !parent || parent.estado;
  }


  /*
   * ===========================================================
   * ACTIVAR CUENTA
   * ===========================================================
   */

  activateAccount(
    cuenta: CatalogoCuentasResponse
  ): void {

    if (!this.canActivateAccount(cuenta)) {
      return;
    }

    this.loadingAccounts.set(true);

    this.catalogoCuentasService
      .updateCuenta(
        cuenta.cuenta_id,
        {
          codigo_cuenta:
            cuenta.codigo_cuenta,

          nombre_cuenta:
            cuenta.nombre_cuenta,

          tipo_cuenta:
            cuenta.tipo_cuenta,

          naturaleza:
            cuenta.naturaleza,

          cuenta_padre_id:
            cuenta.cuenta_padre_id,

          nivel_cuenta:
            cuenta.nivel_cuenta,

          permite_movimiento:
            cuenta.permite_movimiento,

          estado:
            true
        }
      )
      .subscribe({

        next: () => {

          this.toolbarAccount.set(
            null
          );

          this.getAccounts();
        },

        error: (error) => {

          console.error(
            'Error activando la cuenta:',
            error
          );

          this.loadingAccounts.set(false);
        }

      });
  }


  /*
   * ===========================================================
   * VALIDACIONES DEL FORMULARIO
   * ===========================================================
   */

  canChangeMovement(): boolean {

    const cuenta =
      this.selectedAccount();

    if (!cuenta) {
      return true;
    }

    return !this.hasChildren(cuenta);
  }


  canChangeStatus(): boolean {

    const cuenta =
      this.selectedAccount();

    if (!cuenta) {
      return true;
    }

    return !this.hasActiveChildren(cuenta);
  }


  canChangeParent(): boolean {

    const cuenta =
      this.selectedAccount();

    if (!cuenta) {
      return true;
    }

    return !this.hasChildren(cuenta);
  }


  isFormValid(): boolean {

    const form =
      this.accountForm();

    return (
      form.codigo_cuenta
        .trim()
        .length > 0 &&
      form.nombre_cuenta
        .trim()
        .length > 0
    );
  }


  /*
   * ===========================================================
   * ÁRBOL — HIJOS
   * ===========================================================
   */

  hasChildren(
    cuenta: CatalogoCuentasResponse
  ): boolean {

    const children =
      this.cuentas().filter(
        child =>
          child.cuenta_padre_id !== null &&
          Number(child.cuenta_padre_id) ===
          Number(cuenta.cuenta_id)
      );

    return children.length > 0;
  }


  /*
   * ===========================================================
   * ÁRBOL — HIJOS ACTIVOS
   * ===========================================================
   */

  hasActiveChildren(
    cuenta: CatalogoCuentasResponse
  ): boolean {

    return this.cuentas().some(
      child =>
        child.cuenta_padre_id !== null &&
        Number(child.cuenta_padre_id) ===
        Number(cuenta.cuenta_id) &&
        child.estado
    );
  }


  /*
   * ===========================================================
   * ÁRBOL — EXPANDIDO
   * ===========================================================
   */

  isExpanded(
    cuentaId: number
  ): boolean {

    return this.expandedAccounts()
      .has(cuentaId);
  }


  /*
   * ===========================================================
   * ÁRBOL — EXPANDIR / CONTRAER
   * ===========================================================
   */

  toggleAccount(
    cuentaId: number
  ): void {

    const expanded =
      new Set(
        this.expandedAccounts()
      );

    if (
      expanded.has(cuentaId)
    ) {

      expanded.delete(cuentaId);

    } else {

      expanded.add(cuentaId);
    }

    this.expandedAccounts.set(
      expanded
    );
  }


  /*
   * ===========================================================
   * ÁRBOL — VISIBILIDAD
   * ===========================================================
   */

  isVisible(
    cuenta: CatalogoCuentasResponse
  ): boolean {

    if (
      cuenta.cuenta_padre_id === null
    ) {
      return true;
    }

    const parent =
      this.cuentas().find(
        c =>
          c.cuenta_id ===
          cuenta.cuenta_padre_id
      );

    if (!parent) {
      return true;
    }

    return (
      this.isExpanded(
        parent.cuenta_id
      ) &&
      this.isVisible(parent)
    );
  }


  /*
   * ===========================================================
   * CUENTA BASE
   * ===========================================================
   */

  isBaseAccount(
    cuenta: CatalogoCuentasResponse
  ): boolean {

    return this.baseAccountCodes.has(
      cuenta.codigo_cuenta
    );
  }


  /*
   * ===========================================================
   * FORMULARIO — ACTUALIZAR CAMPO
   * ===========================================================
   */

  updateForm<K extends keyof CuentaForm>(
    field: K,
    value: CuentaForm[K]
  ): void {

    this.accountForm.update(
      form => ({
        ...form,
        [field]: value
      })
    );
  }


  /*
   * ===========================================================
   * FORMULARIO — ACTUALIZAR PADRE
   * ===========================================================
   */

  updateParent(
    parentId: number | null
  ): void {

    const parent =
      parentId === null
        ? null
        : this.cuentas().find(
            cuenta =>
              cuenta.cuenta_id ===
              parentId
          );

    this.accountForm.update(
      form => ({

        ...form,

        cuenta_padre_id:
          parentId,

        nivel_cuenta:
          parent
            ? parent.nivel_cuenta + 1
            : 1,

        tipo_cuenta:
          parent?.tipo_cuenta ??
          form.tipo_cuenta,

        naturaleza:
          parent?.naturaleza ??
          form.naturaleza

      })
    );
  }


  /*
   * ===========================================================
   * CREAR CUENTA
   * ===========================================================
   */

  createAccount(): void {

    this.selectedAccount.set(
      null
    );

    this.accountForm.set({

      codigo_cuenta: '',

      nombre_cuenta: '',

      tipo_cuenta: 'ACTIVO',

      naturaleza: 'DEUDORA',

      cuenta_padre_id: null,

      nivel_cuenta: 1,

      permite_movimiento: true,

      estado: true

    });

    this.modalMode.set(
      'create'
    );
  }


  /*
   * ===========================================================
   * EDITAR CUENTA
   * ===========================================================
   */

  editAccount(
    cuenta: CatalogoCuentasResponse
  ): void {

    this.selectedAccount.set(
      cuenta
    );

    this.accountForm.set({

      codigo_cuenta:
        cuenta.codigo_cuenta,

      nombre_cuenta:
        cuenta.nombre_cuenta,

      tipo_cuenta:
        cuenta.tipo_cuenta,

      naturaleza:
        cuenta.naturaleza,

      cuenta_padre_id:
        cuenta.cuenta_padre_id,

      nivel_cuenta:
        cuenta.nivel_cuenta,

      permite_movimiento:
        cuenta.permite_movimiento,

      estado:
        cuenta.estado

    });

    this.modalMode.set(
      'edit'
    );
  }


  /*
   * ===========================================================
   * AGREGAR SUBCUENTA
   * ===========================================================
   */

  addChildAccount(
    cuenta: CatalogoCuentasResponse
  ): void {

    this.selectedAccount.set(
      cuenta
    );

    this.accountForm.set({

      codigo_cuenta: '',

      nombre_cuenta: '',

      tipo_cuenta:
        cuenta.tipo_cuenta,

      naturaleza:
        cuenta.naturaleza,

      cuenta_padre_id:
        cuenta.cuenta_id,

      nivel_cuenta:
        cuenta.nivel_cuenta + 1,

      permite_movimiento:
        true,

      estado:
        true

    });

    this.modalMode.set(
      'child'
    );
  }


  /*
   * ===========================================================
   * CERRAR MODAL
   * ===========================================================
   */

  closeModal(): void {

    this.modalMode.set(
      null
    );

    this.selectedAccount.set(
      null
    );
  }


  /*
   * ===========================================================
   * GUARDAR CUENTA
   * ===========================================================
   */

  saveAccount(): void {

    if (!this.isFormValid()) {
      return;
    }

    const form =
      this.accountForm();

    const codigo =
      form.codigo_cuenta.trim();

    const nombre =
      form.nombre_cuenta.trim();

    const duplicate =
      this.cuentas().some(
        cuenta => {

          const sameCode =
            cuenta.codigo_cuenta
              .toLowerCase() ===
            codigo.toLowerCase();

          if (!sameCode) {
            return false;
          }

          const selected =
            this.selectedAccount();

          if (
            selected &&
            cuenta.cuenta_id ===
            selected.cuenta_id
          ) {
            return false;
          }

          return true;
        }
      );

    if (duplicate) {

      console.warn(
        'Ya existe una cuenta con ese código.'
      );

      return;
    }


    /*
     * ---------------------------------------------------------
     * CREAR
     * ---------------------------------------------------------
     */

    if (
      this.modalMode() === 'create' ||
      this.modalMode() === 'child'
    ) {

      this.catalogoCuentasService
        .createCuenta({

          ...form,

          codigo_cuenta:
            codigo,

          nombre_cuenta:
            nombre

        })
        .subscribe({

          next: (cuenta) => {

            this.cuentas.update(
              cuentas => [
                ...cuentas,
                cuenta
              ]
            );

            if (
              this.modalMode() ===
              'child' &&
              cuenta.cuenta_padre_id !==
              null
            ) {

              const expanded =
                new Set(
                  this.expandedAccounts()
                );

              expanded.add(
                cuenta.cuenta_padre_id
              );

              this.expandedAccounts.set(
                expanded
              );
            }

            this.closeModal();
          },

          error: (error) => {

            console.error(
              'Error creando la cuenta:',
              error
            );

          }

        });

      return;
    }


    /*
     * ---------------------------------------------------------
     * EDITAR
     * ---------------------------------------------------------
     */

    if (
      this.modalMode() === 'edit'
    ) {

      const selected =
        this.selectedAccount();

      if (!selected) {
        return;
      }

      this.catalogoCuentasService
        .updateCuenta(
          selected.cuenta_id,
          {

            ...form,

            codigo_cuenta:
              codigo,

            nombre_cuenta:
              nombre

          }
        )
        .subscribe({

          next: (updatedAccount) => {

            this.cuentas.update(
              cuentas =>
                cuentas.map(
                  cuenta =>
                    cuenta.cuenta_id ===
                    updatedAccount.cuenta_id
                      ? updatedAccount
                      : cuenta
                )
            );

            this.toolbarAccount.update(
              current =>
                current?.cuenta_id ===
                updatedAccount.cuenta_id
                  ? updatedAccount
                  : current
            );

            this.closeModal();
          },

          error: (error) => {

            console.error(
              'Error actualizando la cuenta:',
              error
            );

          }

        });
    }
  }


  /*
   * ===========================================================
   * ELIMINAR CUENTA
   * ===========================================================
   */

  deleteAccount(
    cuenta: CatalogoCuentasResponse
  ): void {

    if (this.hasChildren(cuenta)) {
      return;
    }

    if (this.isInUse(cuenta)) {
      return;
    }

    this.catalogoCuentasService
      .deleteCuenta(
        cuenta.cuenta_id
      )
      .subscribe({

        next: (cuentaEliminada) => {

          console.log(
            'Cuenta eliminada correctamente:',
            cuentaEliminada
          );

          this.toolbarAccount.set(
            null
          );

          this.getAccounts();
        },

        error: (error) => {

          console.error(
            'Error eliminando la cuenta:',
            error
          );

        }

      });
  }


  /*
   * ===========================================================
   * CONFIRMAR ELIMINACIÓN DE RAMA
   * ===========================================================
   */

  confirmDeleteAccountBranch(
    cuenta: CatalogoCuentasResponse
  ): void {

    if (!this.hasChildren(cuenta)) {
      return;
    }

    if (this.isInUse(cuenta)) {
      return;
    }

    this.deleteBranchTarget.set(
      cuenta
    );
  }


  /*
   * ===========================================================
   * CANCELAR ELIMINACIÓN DE RAMA
   * ===========================================================
   */

  cancelDeleteAccountBranch(): void {

    this.deleteBranchTarget.set(
      null
    );
  }


  /*
   * ===========================================================
   * ELIMINAR RAMA
   * ===========================================================
   */

  deleteAccountBranch(): void {

    const cuenta =
      this.deleteBranchTarget();

    if (!cuenta) {
      return;
    }

    this.catalogoCuentasService
      .deleteCuentaRama(
        cuenta.cuenta_id
      )
      .subscribe({

        next: (response) => {

          console.log(
            'Rama eliminada correctamente:',
            response
          );

          this.deleteBranchTarget.set(
            null
          );

          this.toolbarAccount.set(
            null
          );

          this.getAccounts();
        },

        error: (error) => {

          console.error(
            'Error eliminando la rama:',
            error
          );

          this.deleteBranchTarget.set(
            null
          );
        }

      });
  }


  /*
   * ===========================================================
   * ELIMINAR RAMA DESDE LA FILA
   * ===========================================================
   */

  deleteAccountBranchFor(
    cuenta: CatalogoCuentasResponse
  ): void {

    this.confirmDeleteAccountBranch(
      cuenta
    );
  }
}