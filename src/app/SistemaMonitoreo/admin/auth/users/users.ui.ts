import { RolesType } from "../../../../services/users.service";

export function getRoleClass(role: RolesType | string): string {

  switch (role) {

    // SUPERADMINISTRADOR
    case RolesType.SUPERADMINISTRADOR:
    case 'Superadministrador':
      return `
        bg-zinc-900
        text-white

        border border-zinc-900
        ring-2 ring-zinc-900/20
        shadow-sm
      `;

    // ADMINISTRADOR GERENCIAL
    case RolesType.ADMINISTRADORGERENCIAL:
    case 'Administrador Gerencial':
      return `
        bg-zinc-700
        text-white

        border border-zinc-700
        ring-2 ring-zinc-700/20
        shadow-sm
      `;

    // ADMINISTRADOR CONTABLE
    case RolesType.ADMINISTRADORCONTABLE:
    case 'Administrador Contable':
      return `
        bg-slate-600
        text-white

        border border-slate-600
        ring-2 ring-slate-600/20
        shadow-sm
      `;

    // ADMINISTRADOR OPERATIVO
    case RolesType.ADMINISTRADOROPERATIVO:
    case 'Administrador Operativo':
      return `
        bg-slate-200
        text-slate-900

        border border-slate-400
        ring-2 ring-slate-400/20
        shadow-sm
      `;

    // USUARIO ESTÁNDAR
    case RolesType.USUARIOESTANDAR:
    case 'Usuario Estándar':
      return `
        bg-slate-100
        text-slate-700

        border border-slate-300
        ring-2 ring-slate-300/20
        shadow-sm
      `;

    default:
      return `
        bg-slate-100
        text-slate-700

        border border-slate-300
        ring-1 ring-slate-300/20
      `;
  }
}


export function getRoleIcon(role: RolesType | string): string {

  switch (role) {

    // SUPERADMINISTRADOR
    case RolesType.SUPERADMINISTRADOR:
    case 'Superadministrador':
      return 'workspace_premium';

    // ADMINISTRADOR GERENCIAL
    case RolesType.ADMINISTRADORGERENCIAL:
    case 'Administrador Gerencial':
      return 'admin_panel_settings';

    // ADMINISTRADOR CONTABLE
    case RolesType.ADMINISTRADORCONTABLE:
    case 'Administrador Contable':
      return 'account_balance';

    // ADMINISTRADOR OPERATIVO
    case RolesType.ADMINISTRADOROPERATIVO:
    case 'Administrador Operativo':
      return 'manage_accounts';

    // USUARIO ESTÁNDAR
    case RolesType.USUARIOESTANDAR:
    case 'Usuario Estándar':
      return 'person';

    default:
      return 'person';
  }
}


export function getRoleLabel(role: RolesType | string): string {

  switch (role) {

    // SUPERADMINISTRADOR
    case RolesType.SUPERADMINISTRADOR:
    case 'Superadministrador':
      return 'Superadministrador';

    // ADMINISTRADOR GERENCIAL
    case RolesType.ADMINISTRADORGERENCIAL:
    case 'Administrador Gerencial':
      return 'Administrador Gerencial';

    // ADMINISTRADOR CONTABLE
    case RolesType.ADMINISTRADORCONTABLE:
    case 'Administrador Contable':
      return 'Administrador Contable';

    // ADMINISTRADOR OPERATIVO
    case RolesType.ADMINISTRADOROPERATIVO:
    case 'Administrador Operativo':
      return 'Administrador Operativo';

    // USUARIO ESTÁNDAR
    case RolesType.USUARIOESTANDAR:
    case 'Usuario Estándar':
      return 'Usuario Estándar';

    default:
      return role;
  }
}