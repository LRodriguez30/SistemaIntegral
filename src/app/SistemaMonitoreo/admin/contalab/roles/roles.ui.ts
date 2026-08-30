import { RolesType } from "../../../../services/users.service";

/**
 * Normaliza cualquier representación del rol:
 * - ID numérico: 1, 2, 3...
 * - string numérico: "1", "2", "3"...
 * - enum RolesType
 * - nombre del rol
 */
function normalizeRole(role: RolesType | string | number): RolesType | null {

  const value = String(role).trim();

  switch (value) {

    // IDs provenientes de la API
    case '1':
      return RolesType.SUPERADMINISTRADOR;

    case '2':
      return RolesType.ADMINISTRADORGERENCIAL;

    case '3':
      return RolesType.ADMINISTRADORCONTABLE;

    case '4':
      return RolesType.ADMINISTRADOROPERATIVO;

    case '5':
      return RolesType.USUARIOESTANDAR;


    // Nombres provenientes de la API
    case 'Superadministrador':
      return RolesType.SUPERADMINISTRADOR;

    case 'Administrador Gerencial':
      return RolesType.ADMINISTRADORGERENCIAL;

    case 'Administrador Contable':
      return RolesType.ADMINISTRADORCONTABLE;

    case 'Administrador Operativo':
      return RolesType.ADMINISTRADOROPERATIVO;

    case 'Usuario Estándar':
      return RolesType.USUARIOESTANDAR;


    // Valores del enum
    default:

      if (
        Object.values(RolesType)
          .map(String)
          .includes(value)
      ) {
        return role as RolesType;
      }

      return null;
  }
}


/**
 * Clase visual del rol
 */
export function getRoleClass(
  role: RolesType | string | number
): string {

  switch (normalizeRole(role)) {

    case RolesType.SUPERADMINISTRADOR:
      return `
        bg-zinc-900
        text-white
        border border-zinc-900
        ring-2 ring-zinc-900/20
        shadow-sm
      `;

    case RolesType.ADMINISTRADORGERENCIAL:
      return `
        bg-zinc-700
        text-white
        border border-zinc-700
        ring-2 ring-zinc-700/20
        shadow-sm
      `;

    case RolesType.ADMINISTRADORCONTABLE:
      return `
        bg-slate-600
        text-white
        border border-slate-600
        ring-2 ring-slate-600/20
        shadow-sm
      `;

    case RolesType.ADMINISTRADOROPERATIVO:
      return `
        bg-slate-200
        text-slate-900
        border border-slate-400
        ring-2 ring-slate-400/20
        shadow-sm
      `;

    case RolesType.USUARIOESTANDAR:
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


/**
 * Icono del rol
 */
export function getRoleIcon(
  role: RolesType | string | number
): string {

  switch (normalizeRole(role)) {

    case RolesType.SUPERADMINISTRADOR:
      return 'workspace_premium';

    case RolesType.ADMINISTRADORGERENCIAL:
      return 'admin_panel_settings';

    case RolesType.ADMINISTRADORCONTABLE:
      return 'account_balance';

    case RolesType.ADMINISTRADOROPERATIVO:
      return 'manage_accounts';

    case RolesType.USUARIOESTANDAR:
      return 'person';

    default:
      return 'person';
  }
}


/**
 * Nombre visible del rol
 */
export function getRoleLabel(
  role: RolesType | string | number
): string {

  switch (normalizeRole(role)) {

    case RolesType.SUPERADMINISTRADOR:
      return 'Superadministrador';

    case RolesType.ADMINISTRADORGERENCIAL:
      return 'Administrador Gerencial';

    case RolesType.ADMINISTRADORCONTABLE:
      return 'Administrador Contable';

    case RolesType.ADMINISTRADOROPERATIVO:
      return 'Administrador Operativo';

    case RolesType.USUARIOESTANDAR:
      return 'Usuario Estándar';

    default:
      return 'Rol desconocido';
  }
}