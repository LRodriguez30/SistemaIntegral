import { RolesType } from "../../../../services/users.service";

/**
 * Normaliza cualquier representación del rol:
 * - ID numérico: 1, 2, 3...
 * - string numérico: "1", "2", "3"...
 * - enum RolesType
 * - nombre del rol
 */
function normalizeRole(
  role: RolesType | string | number
): RolesType | null {

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
            return RolesType.ADMINISTRADORDEPRODUCCION;

        case '5':
            return RolesType.ADMINISTRADOROPERATIVO;

        case '6':
            return RolesType.USUARIOESTANDAR;


        // Nombres provenientes de la API

        case 'Superadministrador':
            return RolesType.SUPERADMINISTRADOR;

        case 'Administrador Gerencial':
            return RolesType.ADMINISTRADORGERENCIAL;

        case 'Administrador Contable':
            return RolesType.ADMINISTRADORCONTABLE;

        case 'Administrador de Producción':
            return RolesType.ADMINISTRADORDEPRODUCCION;

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
        bg-black
        text-white
        border border-violet-200
        ring-2 ring-violet-500/10
      `;

    case RolesType.ADMINISTRADORGERENCIAL:
      return `
        bg-blue-100
        text-blue-800
        border border-blue-200
        ring-2 ring-blue-500/10
      `;

    case RolesType.ADMINISTRADORCONTABLE:
      return `
        bg-emerald-100
        text-emerald-800
        border border-emerald-200
        ring-2 ring-emerald-500/10
      `;

    case RolesType.ADMINISTRADOROPERATIVO:
      return `
        bg-amber-100
        text-amber-800
        border border-amber-200
        ring-2 ring-amber-500/10
      `;

    case RolesType.USUARIOESTANDAR:
      return `
        bg-slate-200
        text-slate-700
        border border-slate-200
        ring-2 ring-slate-400/10
      `;

    default:
      return `
        bg-slate-100
        text-slate-700
        border border-slate-200
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