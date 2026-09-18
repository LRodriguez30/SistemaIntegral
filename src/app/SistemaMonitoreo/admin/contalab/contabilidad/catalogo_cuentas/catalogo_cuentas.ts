import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  CatalogoCuentasResponse,
  CatalogoCuentasService
} from '../../../../../services/catalogo_cuentas.service';


/*
 * =============================================================
 * CUENTAS BASE
 * =============================================================
 *
 * Estas cuentas forman parte de la estructura contable
 * predeterminada utilizada por la aplicación.
 *
 * Se pueden generar nuevamente cuando el catálogo
 * se encuentra vacío.
 *
 * No forman parte de la lógica de eliminación de cuentas
 * registradas por el usuario.
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
 * MODELO
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
   * =============================================================
   * SERVICIOS
   * =============================================================
   */

  readonly catalogoCuentasService =
    inject(CatalogoCuentasService);


  /*
   * =============================================================
   * DATOS
   * =============================================================
   *
   * El catálogo comienza vacío.
   *
   * Posteriormente estas cuentas se cagan solicitando información
   * al backend
   */

  readonly cuentas =
    signal<CatalogoCuentasResponse[]>([]);


  /*
   * =============================================================
   * ESTADO DEL CATÁLOGO
   * =============================================================
   */

  readonly hasAccounts = computed(
    () => this.cuentas().length > 0
  );

  readonly loadingAccounts =
    signal(false);


  /*
   * =============================================================
   * CUENTA SELECCIONADA PARA ACCIONES DEL TOOLBAR
   * =============================================================
   */

  readonly toolbarAccount =
    signal<CatalogoCuentasResponse | null>(null);


  /*
   * =============================================================
   * MODALES
   * =============================================================
   */

  readonly modalMode =
    signal<'create' | 'edit' | 'child' | null>(null);

  readonly selectedAccount =
    signal<CatalogoCuentasResponse | null>(null);


  /*
   * =============================================================
   * FORMULARIO
   * =============================================================
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
   * =============================================================
   * FILTROS
   * =============================================================
   */

  readonly searchTerm =
    signal('');

  readonly selectedType =
    signal('TODOS');

  readonly selectedStatus =
    signal('TODOS');


  /*
   * =============================================================
   * ÁRBOL DE CUENTAS
   * =============================================================
   */

  readonly expandedAccounts =
    signal<Set<number>>(new Set());


  /*
   * =============================================================
   * CUENTAS BASE
   * =============================================================
   *
   * Estas son las cuentas iniciales que puede generar
   * el sistema cuando el catálogo está vacío.
   *
   * Ej: Las cuentas 1 - 6 son las cuentas raíz.
   *
   * Las cuentas intermedias representan clasificaciones
   * estructurales.
   *
   * Las cuentas finales permiten movimiento.
   */

  private readonly baseAccountCodes =
    new Set<string>(
      Object.values(CuentaBaseCodigo)
    );


  /*
   * =============================================================
   * RESUMEN
   * =============================================================
   */

  readonly totalAccounts = computed(
    () => this.cuentas().length
  );

  readonly movementAccounts = computed(
    () =>
      this.cuentas().filter(
        cuenta => cuenta.permite_movimiento
      ).length
  );

  readonly activeAccounts = computed(
    () =>
      this.cuentas().filter(
        cuenta => cuenta.estado
      ).length
  );

  readonly parentAccounts = computed(
    () =>
      this.cuentas().filter(
        cuenta => !cuenta.permite_movimiento
      ).length
  );


  /*
   * =============================================================
   * CUENTAS FILTRADAS
   * =============================================================
   */

  readonly filteredAccounts = computed(() => {

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
          (status === 'ACTIVAS' && cuenta.estado) ||
          (status === 'INACTIVAS' && !cuenta.estado);

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
   * =============================================================
   * CUENTAS PADRE DISPONIBLES
   * =============================================================
   */

  readonly parentOptions = computed(() =>
    this.cuentas().filter(
      cuenta =>
        !cuenta.permite_movimiento
    )
  );


  /*
   * =============================================================
   * CICLO DE VIDA
   * =============================================================
   */

  ngOnInit(): void {
    this.getAccounts();
  }


  /*
   * =============================================================
   * OBTENER CUENTAS
   * =============================================================
   */

  getAccounts(): void {

    this.loadingAccounts.set(true);

    this.catalogoCuentasService
      .getCatalogoCuentas()
      .subscribe({

        next: (data) => {

          console.log(data);

          this.cuentas.set(data);

          this.loadingAccounts.set(false);
        },

        error: (error) => {

          console.error(error);

          this.loadingAccounts.set(false);
        }

      });
  }


  /*
   * =============================================================
   * GENERAR CUENTAS BASE
   * =============================================================
   *
   * Esta función permite reconstruir el catálogo inicial.
   *
   * Se conecta al backend para crear una plantilla base.
   * 
   * Si se crea correctamente renderiza los cambios.
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

          /*
           * Si se agregó una subcuenta,
           * dejamos visible a su padre.
           */

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
   * =============================================================
   * LIMPIAR CATÁLOGO
   * =============================================================
   *
   * Elimina todas las cuentas actualmente cargadas.
   */

  clearAccounts(): void {

    this.cuentas.set([]);

    this.expandedAccounts.set(
      new Set()
    );

    this.searchTerm.set('');
    this.selectedType.set('TODOS');
    this.selectedStatus.set('TODOS');
  }


  /*
   * =============================================================
   * CUENTA SELECCIONADA
   * =============================================================
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
   * =============================================================
   * VALIDACIONES DEL TOOLBAR
   * =============================================================
   */

  readonly selectedAccountHasChildren = computed(() => {

    const cuenta =
      this.toolbarAccount();

    if (!cuenta) {
      return false;
    }

    return this.hasChildren(cuenta);
  });


  readonly canDeleteSelectedAccount = computed(() => {

    const cuenta =
      this.toolbarAccount();

    if (!cuenta) {
      return false;
    }

    return !this.hasChildren(cuenta);
  });


  readonly canAddChildSelectedAccount = computed(() => {

    const cuenta =
      this.toolbarAccount();

    if (!cuenta) {
      return false;
    }

    return !cuenta.permite_movimiento;
  });


  readonly canEditSelectedAccount = computed(() => {

    const cuenta =
      this.toolbarAccount();

    if (!cuenta) {
      return false;
    }

    return !this.isBaseAccount(cuenta);
  });


  /*
   * =============================================================
   * VALIDAR ELIMINACIÓN
   * =============================================================
   */

  canDeleteAccount(
    cuenta: CatalogoCuentasResponse
  ): boolean {

    // if (this.isBaseAccount(cuenta)) {
    //   return false;
    // }

    if (this.hasChildren(cuenta)) {
      return false;
    }

    return true;
  }


  /*
   * =============================================================
   * VALIDACIONES DEL FORMULARIO
   * =============================================================
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
   * =============================================================
   * ÁRBOL
   * =============================================================
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

    // console.log(
    //   'CUENTA SELECCIONADA:',
    //   cuenta.cuenta_id,
    //   cuenta.codigo_cuenta,
    //   cuenta.nombre_cuenta
    // );

    // console.log(
    //   'HIJOS ENCONTRADOS:',
    //   children
    // );

    return children.length > 0;
  }


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


  isExpanded(
    cuentaId: number
  ): boolean {

    return this.expandedAccounts()
      .has(cuentaId);
  }


  toggleAccount(
    cuentaId: number
  ): void {

    const expanded =
      new Set(
        this.expandedAccounts()
      );

    if (expanded.has(cuentaId)) {

      expanded.delete(cuentaId);

    } else {

      expanded.add(cuentaId);
    }

    this.expandedAccounts.set(
      expanded
    );
  }


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
   * =============================================================
   * CUENTAS BASE
   * =============================================================
   */

  isBaseAccount(
    cuenta: CatalogoCuentasResponse
  ): boolean {

    return this.baseAccountCodes.has(
      cuenta.codigo_cuenta
    );
  }


  /*
   * =============================================================
   * FORMULARIO
   * =============================================================
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
   * =============================================================
   * CREAR CUENTA
   * =============================================================
   */

  createAccount(): void {

    this.selectedAccount.set(null);

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

    this.modalMode.set('create');
  }


  /*
   * =============================================================
   * EDITAR CUENTA
   * =============================================================
   */

  editAccount(
    cuenta: CatalogoCuentasResponse
  ): void {

    this.selectedAccount.set(cuenta);

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

    this.modalMode.set('edit');
  }


  /*
   * =============================================================
   * CREAR SUBCUENTA
   * =============================================================
   */

  addChildAccount(
    cuenta: CatalogoCuentasResponse
  ): void {

    this.selectedAccount.set(cuenta);

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

      permite_movimiento: true,
      estado: true

    });

    this.modalMode.set('child');
  }


  /*
   * =============================================================
   * CERRAR MODAL
   * =============================================================
   */

  closeModal(): void {

    this.modalMode.set(null);

    this.selectedAccount.set(null);
  }


  /*
   * =============================================================
   * GUARDAR
   * =============================================================
   */

  saveAccount(): void {

    const form =
      this.accountForm();

    const mode =
      this.modalMode();

    if (!this.isFormValid()) {
      return;
    }


    /*
     * ---------------------------------------------------------
     * VALIDAR CÓDIGO DUPLICADO
     * ---------------------------------------------------------
     */

    const currentAccount =
      this.selectedAccount();

    const duplicated =
      this.cuentas().some(
        cuenta =>

          cuenta.codigo_cuenta
            .toLowerCase() ===

          form.codigo_cuenta
            .trim()
            .toLowerCase() &&

          cuenta.cuenta_id !==
          currentAccount?.cuenta_id
      );

    if (duplicated) {

      console.warn(
        'El código de cuenta ya existe.'
      );

      return;
    }


    /*
     * ---------------------------------------------------------
     * CREAR
     * ---------------------------------------------------------
     *
     * Tanto una cuenta normal como una subcuenta
     * son cuentas nuevas.
     */

    if (
      mode === 'create' ||
      mode === 'child'
    ) {

      this.catalogoCuentasService
        .createCuenta({
          ...form,

          codigo_cuenta:
            form.codigo_cuenta.trim(),

          nombre_cuenta:
            form.nombre_cuenta.trim()
        })
        .subscribe({

          next: (account) => {

            this.cuentas.update(
              accounts => [
                ...accounts,
                account
              ]
            );

            /*
             * Si se agregó una subcuenta,
             * dejamos visible a su padre.
             */

            if (
              mode === 'child' &&
              form.cuenta_padre_id !== null
            ) {

              const expanded =
                new Set(
                  this.expandedAccounts()
                );

              expanded.add(
                form.cuenta_padre_id
              );

              this.expandedAccounts.set(
                expanded
              );
            }

            this.closeModal();
          },

          error: (error) => {

            console.error(
              'Error al crear la cuenta:',
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

    if (mode === 'edit') {

      const account =
        this.selectedAccount();

      if (!account) {
        return;
      }

      this.catalogoCuentasService
        .updateCuenta(
          account.cuenta_id,
          {
            ...form,

            codigo_cuenta:
              form.codigo_cuenta.trim(),

            nombre_cuenta:
              form.nombre_cuenta.trim()
          }
        )
        .subscribe({

          next: (updatedAccount) => {

            this.cuentas.update(
              accounts =>
                accounts.map(
                  item =>
                    item.cuenta_id ===
                      updatedAccount.cuenta_id
                      ? updatedAccount
                      : item
                )
            );

            this.closeModal();
          },

          error: (error) => {

            console.error(
              'Error al actualizar la cuenta:',
              error
            );

          }

        });

      return;
    }
  }


  /*
   * =============================================================
   * ELIMINAR CUENTA
   * =============================================================
   */

  deleteAccount(
    cuenta: CatalogoCuentasResponse
  ): void {

    // if (this.isBaseAccount(cuenta)) {
    //   return;
    // }

    if (this.hasChildren(cuenta)) {
      return;
    }

    this.catalogoCuentasService
      .deleteCuenta(cuenta.cuenta_id)
      .subscribe({

        next: (cuentaEliminada) => {

          console.log(
            'Cuenta eliminada correctamente:',
            cuentaEliminada
          );

          this.toolbarAccount.set(null);

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
   * =============================================================
   * ELIMINAR RAMA
   * =============================================================
   */

  deleteAccountBranch(): void {

    const cuenta =
      this.toolbarAccount();

    if (!cuenta) {
      return;
    }

    const confirmed =
      confirm(
        `¿Está seguro de eliminar toda la rama de "${cuenta.nombre_cuenta}"?`
      );

    if (!confirmed) {
      return;
    }

    this.catalogoCuentasService
      .deleteCuentaRama(cuenta.cuenta_id)
      .subscribe({

        next: (response) => {

          console.log(
            'Rama eliminada correctamente:',
            response
          );

          this.toolbarAccount.set(null);

          this.getAccounts();
        },

        error: (error) => {

          console.error(
            'Error eliminando la rama:',
            error
          );

        }

      });
  }


  /*
   * =============================================================
   * ELIMINAR RAMA DESDE LA FILA
   * =============================================================
   */

  deleteAccountBranchFor(
    cuenta: CatalogoCuentasResponse
  ): void {

    this.toolbarAccount.set(cuenta);

    this.deleteAccountBranch();
  }


  /*
   * =============================================================
   * ESTADO
   * =============================================================
   */

  toggleStatus(
    cuenta: CatalogoCuentasResponse
  ): void {

    this.cuentas.update(
      accounts =>
        accounts.map(
          item =>
            item.cuenta_id ===
              cuenta.cuenta_id

              ? {
                ...item,
                estado:
                  !item.estado
              }

              : item
        )
    );
  }


  /*
   * =============================================================
   * TRACKING
   * =============================================================
   */

  trackById(
    _index: number,
    cuenta: CatalogoCuentasResponse
  ): number {

    return cuenta.cuenta_id;
  }
}