import { CommonModule, NgOptimizedImage } from "@angular/common";
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  signal
} from "@angular/core";
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from "@angular/router";

import { AuthService } from "../../services/auth.service";

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
  badge?: string;
}

@Component({
  selector: 'app-admin',
  imports: [
    CommonModule,
    RouterOutlet,
    NgOptimizedImage,
    RouterLink,
    RouterLinkActive
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {

  sidebarOpen = false;

  userName = signal('');
  userRole = signal('');
  userImage = signal('');

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  // =========================================================
  // SIDEBAR
  // =========================================================

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  // =========================================================
  // USUARIO ACTUAL
  // =========================================================

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe({
      next: (res) => {

        const allowedRoles = ['Admin', 'Dueño'];

        const user = res.user;
        const profile = res.profile;

        if (!allowedRoles.includes(user.role)) {
          // this.router.navigate(['/unauthorized']);
          return;
        }

        this.userName.set(user.name);
        this.userRole.set(user.role);

        this.userImage.set(
          (profile as any)?.imageUrl || ''
        );
      },

      error: () => {
        // this.router.navigate(['/unauthorized']);
      }
    });
  }

  // =========================================================
  // AVATAR
  // =========================================================

  getAvatar(): string {

    const image = this.userImage();

    const isValidImage =
      typeof image === 'string' &&
      image.trim().length > 0 &&
      !['null', 'undefined', ''].includes(image.trim());

    if (isValidImage) {
      return image;
    }

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      this.userName() || 'User'
    )}&background=000000&color=ffffff&size=128`;
  }

  // =========================================================
  // POSTGRESQL
  // =========================================================

  postgresNav: NavItem[] = [

    // -------------------------------------------------------
    // AUTENTICACIÓN Y SEGURIDAD
    // -------------------------------------------------------

    {
      label: 'Autenticación',
      icon: 'lucide:shield-check',

      children: [
        {
          label: 'Usuarios',
          icon: 'lucide:users',
          route: 'panel/users'
        },
        {
          label: 'Roles y permisos',
          icon: 'lucide:shield',
          route: '/db/roles'
        },
        {
          label: 'Refresh Tokens',
          icon: 'lucide:key-round',
          route: '/db/refresh-tokens'
        }
      ]
    },

    // -------------------------------------------------------
    // PERSONAL
    // -------------------------------------------------------

    {
      label: 'Personal',
      icon: 'lucide:briefcase-business',

      children: [
        {
          label: 'Empleados',
          icon: 'lucide:user-round',
          route: '/db/employees'
        },
        {
          label: 'Departamentos',
          icon: 'lucide:building-2',
          route: '/db/departments'
        },
        {
          label: 'Turnos',
          icon: 'lucide:clock-3',
          route: '/db/shifts'
        },
        {
          label: 'Asistencia',
          icon: 'lucide:calendar-check',
          route: '/db/attendance'
        }
      ]
    },

    // -------------------------------------------------------
    // FÁBRICA / PRODUCCIÓN
    // -------------------------------------------------------

    {
      label: 'Fábrica',
      icon: 'lucide:factory',

      children: [
        {
          label: 'Productos',
          icon: 'lucide:package',
          route: '/db/products'
        },
        {
          label: 'Materias primas',
          icon: 'lucide:boxes',
          route: '/db/raw-materials'
        },
        {
          label: 'Inventario',
          icon: 'lucide:warehouse',
          route: '/db/inventory'
        },
        {
          label: 'Producción',
          icon: 'lucide:clipboard-list',
          route: '/db/production'
        },
        {
          label: 'Órdenes de producción',
          icon: 'lucide:factory',
          route: '/db/production-orders'
        },
        {
          label: 'Movimientos de inventario',
          icon: 'lucide:arrow-left-right',
          route: '/db/inventory-movements'
        }
      ]
    },

    // -------------------------------------------------------
    // PEDIDOS Y VENTAS
    // -------------------------------------------------------

    {
      label: 'Pedidos y ventas',
      icon: 'lucide:shopping-cart',

      children: [
        {
          label: 'Pedidos',
          icon: 'lucide:receipt',
          route: '/db/orders'
        },
        {
          label: 'Detalle de pedidos',
          icon: 'lucide:list-checks',
          route: '/db/order-details'
        },
        {
          label: 'Clientes',
          icon: 'lucide:contact',
          route: '/db/customers'
        },
        {
          label: 'Ventas',
          icon: 'lucide:badge-dollar-sign',
          route: '/db/sales'
        },
        {
          label: 'Devoluciones',
          icon: 'lucide:undo-2',
          route: '/db/returns'
        }
      ]
    },

    // -------------------------------------------------------
    // SUCURSALES / LOCALES
    // -------------------------------------------------------

    {
      label: 'Sucursales',
      icon: 'lucide:store',

      children: [
        {
          label: 'Locales',
          icon: 'lucide:store',
          route: '/db/branches'
        },
        {
          label: 'Personal por sucursal',
          icon: 'lucide:users-round',
          route: '/db/branch-employees'
        },
        {
          label: 'Inventario por sucursal',
          icon: 'lucide:boxes',
          route: '/db/branch-inventory'
        },
        {
          label: 'Ventas por sucursal',
          icon: 'lucide:chart-no-axes-combined',
          route: '/db/branch-sales'
        },
        {
          label: 'Horarios',
          icon: 'lucide:calendar-clock',
          route: '/db/branch-schedules'
        }
      ]
    },

    // -------------------------------------------------------
    // CONTABILIDAD Y FINANZAS
    // -------------------------------------------------------

    {
      label: 'Contabilidad',
      icon: 'lucide:landmark',

      children: [
        {
          label: 'Cuentas contables',
          icon: 'lucide:book-open',
          route: '/db/accounting-accounts'
        },
        {
          label: 'Movimientos contables',
          icon: 'lucide:arrow-left-right',
          route: '/db/accounting-movements'
        },
        {
          label: 'Ingresos',
          icon: 'lucide:circle-arrow-down',
          route: '/db/income'
        },
        {
          label: 'Gastos',
          icon: 'lucide:circle-arrow-up',
          route: '/db/expenses'
        },
        {
          label: 'Pagos',
          icon: 'lucide:credit-card',
          route: '/db/payments'
        },
        {
          label: 'Reportes financieros',
          icon: 'lucide:chart-column',
          route: '/db/financial-reports'
        }
      ]
    },

    // -------------------------------------------------------
    // SESIONES Y OPERACIÓN DEL SISTEMA
    // -------------------------------------------------------

    {
      label: 'Sesiones',
      icon: 'lucide:monitor-cog',

      children: [
        {
          label: 'Sesiones activas',
          icon: 'lucide:monitor-dot',
          route: '/db/sessions'
        },
        {
          label: 'Historial de sesiones',
          icon: 'lucide:history',
          route: '/db/session-history'
        },
        {
          label: 'Dispositivos',
          icon: 'lucide:smartphone',
          route: '/db/devices'
        },
        {
          label: 'Actividad de usuarios',
          icon: 'lucide:activity',
          route: '/db/user-activity'
        }
      ]
    }

  ];

  // =========================================================
  // MONGODB
  // =========================================================

  mongoNav: NavItem[] = [

    {
      label: 'Registros del sistema',
      icon: 'lucide:database',

      children: [

        {
          label: 'Auditoría',
          icon: 'lucide:file-clock',
          route: '/mongo/audit-logs'
        },

        {
          label: 'Eventos del sistema',
          icon: 'lucide:zap',
          route: '/mongo/events'
        },

        {
          label: 'Actividad administrativa',
          icon: 'lucide:shield-alert',
          route: '/mongo/admin-activity'
        },

        {
          label: 'Historial de cambios',
          icon: 'lucide:history',
          route: '/mongo/change-history'
        }

      ]
    }

  ];

}