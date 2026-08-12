import { UsersRole } from "../../../../services/users.service";

export function getRoleClass(role: UsersRole | string): string {

  switch (role) {

    // DUEÑO
    case UsersRole.Dueño:
    case 'Dueño':
      return `
        bg-amber-50
        text-amber-700

        border border-amber-200
        ring-1 ring-amber-100

        dark:bg-amber-400/10
        dark:text-amber-100
      `;

    // ADMIN
    case UsersRole.Admin:
    case 'Admin':
    case 'Administrador':
      return `
        bg-indigo-50
        text-indigo-700

        border border-indigo-200
        ring-1 ring-indigo-100

        dark:bg-indigo-400/10
        dark:text-indigo-100
      `;

    // ORGANIZADOR
    case UsersRole.Organizador:
    case 'Organizador':
      return `
        bg-orange-50
        text-orange-700

        border border-orange-200
        ring-1 ring-orange-100

        dark:bg-orange-400/10
        dark:text-orange-100
      `;

    // VISITANTE
    case UsersRole.Visitante:
    case 'Visitante':
      return `
        bg-sky-50
        text-sky-700

        border border-sky-200
        ring-1 ring-sky-100

        dark:bg-sky-400/10
        dark:text-sky-100
      `;

    default:
      return `
        bg-slate-50
        text-slate-700

        border border-slate-200
        ring-1 ring-slate-100

        dark:bg-slate-400/10
        dark:text-slate-100
      `;
  }
}

export function getRoleIcon(role: UsersRole | string): string {

  switch (role) {

    case UsersRole.Dueño:
    case 'Dueño':
      return 'workspace_premium';

    case UsersRole.Admin:
    case 'Admin':
    case 'Administrador':
      return 'shield';

    case UsersRole.Organizador:
    case 'Organizador':
      return 'event';

    case UsersRole.Visitante:
    case 'Visitante':
      return 'visibility';

    default:
      return 'person';
  }
}

export function getRoleLabel(role: UsersRole | string): string {

  switch (role) {

    case UsersRole.Dueño:
    case 'Dueño':
      return 'Dueño';

    case UsersRole.Admin:
    case 'Admin':
    case 'Administrador':
      return 'Administrador';

    case UsersRole.Organizador:
    case 'Organizador':
      return 'Organizador';

    case UsersRole.Visitante:
    case 'Visitante':
      return 'Visitante';

    default:
      return role;
  }
}