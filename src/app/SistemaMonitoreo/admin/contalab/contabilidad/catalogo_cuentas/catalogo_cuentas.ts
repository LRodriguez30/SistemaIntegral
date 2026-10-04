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
 * TIPOS DE ACCIÓN
 * =============================================================
 */

type AccountAction =
  | 'deactivate'
  | 'activate'
  | 'delete'
  | 'delete-branch';


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
  templateUrl: './catalogo_cuentas.html',
  styles: [`

    .table-row-enter {
      animation: table-row-enter 250ms ease-out both;
    }

    @keyframes table-row-enter {
      from {
        opacity: 0;
        transform: translateY(4px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .summary-card-enter {
      animation: summary-card-enter 320ms ease-out both;
    }

    @keyframes summary-card-enter {
      from {
        opacity: 0;
        transform: translateY(6px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .skeleton {
      position: relative;
      overflow: hidden;
      background: #e9ebee;
    }

    .skeleton::after {
      content: '';
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, .65),
        transparent
      );
      animation: skeleton-shimmer 1.35s infinite;
    }

    @keyframes skeleton-shimmer {
      100% {
        transform: translateX(100%);
      }
    }

    @media (prefers-reduced-motion: reduce) {

      .table-row-enter,
      .summary-card-enter,
      .skeleton::after {
        animation: none !important;
      }

    }

  `]
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

  readonly savingAccount =
    signal(false);

  readonly actionLoading =
    signal(false);

  readonly actionAccountId =
    signal<number | null>(null);

  readonly actionType =
    signal<AccountAction | null>(null);


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

    if (this.loadingAccounts()) {
      return;
    }

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

        this.clearActionLoading();
      },

      error: (error) => {

        console.error(
          'Error obteniendo el catálogo de cuentas:',
          error
        );

        this.loadingAccounts.set(false);

        this.clearActionLoading();
      }

    });
  }


  /*
   * ===========================================================
   * GENERAR CUENTAS BASE
   * ===========================================================
   */

  generateBaseAccounts(): void {

    if (
      this.cuentas().length > 0 ||
      this.loadingAccounts()
    ) {
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

    this.toolbarAccount.set(null);

    this.selectedAccount.set(null);

    this.deleteBranchTarget.set(null);

    this.clearActionLoading();
  }


  /*
   * ===========================================================
   * SELECCIÓN DE CUENTA PARA TOOLBAR
   * ===========================================================
   */

  selectAccountForToolbar(
    cuenta: CatalogoCuentasResponse
  ): void {

    if (this.actionLoading()) {
      return;
    }

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

    if (
      this.actionLoading() ||
      this.loadingAccounts()
    ) {
      return;
    }

    if (!this.canDeactivateAccount(cuenta)) {
      return;
    }

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

    this.startActionLoading(
      cuenta.cuenta_id,
      'deactivate'
    );

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

        this.toolbarAccount.set(null);

        this.getAccounts();
      },

      error: (error) => {

        console.error(
          'Error desactivando la cuenta:',
          error
        );

        this.clearActionLoading();
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

    if (
      this.actionLoading() ||
      this.loadingAccounts()
    ) {
      return;
    }

    if (!this.canActivateAccount(cuenta)) {
      return;
    }

    this.startActionLoading(
      cuenta.cuenta_id,
      'activate'
    );

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

          this.toolbarAccount.set(null);

          this.getAccounts();
        },

        error: (error) => {

          console.error(
            'Error activando la cuenta:',
            error
          );

          this.clearActionLoading();
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


  canDeactivateAccount(
    cuenta: CatalogoCuentasResponse
  ): boolean {

    if (!cuenta.estado) {
      return false;
    }

    return !this.hasActiveChildren(cuenta);
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

    if (this.actionLoading()) {
      return;
    }

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

    if (
      this.loadingAccounts() ||
      this.actionLoading() ||
      this.savingAccount()
    ) {
      return;
    }

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

    if (
      this.loadingAccounts() ||
      this.actionLoading() ||
      this.savingAccount()
    ) {
      return;
    }

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

    if (
      this.loadingAccounts() ||
      this.actionLoading() ||
      this.savingAccount()
    ) {
      return;
    }

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

    if (this.savingAccount()) {
      return;
    }

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

    if (
      !this.isFormValid() ||
      this.savingAccount()
    ) {
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

    this.savingAccount.set(true);

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

            this.savingAccount.set(false);

            this.closeModal();
          },

          error: (error) => {

            console.error(
              'Error creando la cuenta:',
              error
            );

            this.savingAccount.set(false);
          }

        });

      return;
    }

    if (
      this.modalMode() === 'edit'
    ) {

      const selected =
        this.selectedAccount();

      if (!selected) {
        this.savingAccount.set(false);
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

            this.savingAccount.set(false);

            this.closeModal();
          },

          error: (error) => {

            console.error(
              'Error actualizando la cuenta:',
              error
            );

            this.savingAccount.set(false);
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

    if (
      this.actionLoading() ||
      this.loadingAccounts()
    ) {
      return;
    }

    if (!this.canDeleteAccount(cuenta)) {
      return;
    }

    this.startActionLoading(
      cuenta.cuenta_id,
      'delete'
    );

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

          this.clearActionLoading();
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

    if (
      this.actionLoading() ||
      this.loadingAccounts()
    ) {
      return;
    }

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

    if (
      this.isActionLoadingFor(
        'delete-branch'
      )
    ) {
      return;
    }

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

    if (
      this.actionLoading() ||
      this.loadingAccounts()
    ) {
      return;
    }

    const cuenta =
      this.deleteBranchTarget();

    if (!cuenta) {
      return;
    }

    this.startActionLoading(
      cuenta.cuenta_id,
      'delete-branch'
    );

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

          this.clearActionLoading();
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

    if (
      this.actionLoading() ||
      this.loadingAccounts()
    ) {
      return;
    }

    this.confirmDeleteAccountBranch(
      cuenta
    );
  }


  /*
   * ===========================================================
   * ESTADO DE LOADING DE UNA ACCIÓN
   * ===========================================================
   */

  isActionLoading(
    accountId: number,
    action: AccountAction
  ): boolean {

    return (
      this.actionLoading() &&
      this.actionAccountId() ===
        accountId &&
      this.actionType() ===
        action
    );
  }


  /*
   * ===========================================================
   * ESTADO DE UNA ACCIÓN SIN IMPORTAR LA CUENTA
   * ===========================================================
   */

  isActionLoadingFor(
    action: AccountAction
  ): boolean {

    return (
      this.actionLoading() &&
      this.actionType() === action
    );
  }


  /*
   * ===========================================================
   * INICIAR LOADING DE ACCIÓN
   * ===========================================================
   */

  private startActionLoading(
    accountId: number,
    action: AccountAction
  ): void {

    this.actionAccountId.set(
      accountId
    );

    this.actionType.set(
      action
    );

    this.actionLoading.set(
      true
    );
  }


  /*
   * ===========================================================
   * LIMPIAR LOADING DE ACCIÓN
   * ===========================================================
   */

  private clearActionLoading(): void {

    this.actionLoading.set(
      false
    );

    this.actionAccountId.set(
      null
    );

    this.actionType.set(
      null
    );
  }
}