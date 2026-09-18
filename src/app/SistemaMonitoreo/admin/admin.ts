import { CommonModule } from '@angular/common';

import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  signal
} from '@angular/core';

import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { filter } from 'rxjs';

import { AuthService, AuthUser } from '../../services/auth.service';
import { UsersResponse } from '../../services/users.service';
import { PersonasResponse } from '../../services/personas.service';


// =========================================================
// IDENTIDAD DE CADA SECCIÓN
// =========================================================

interface SectionIdentity {

  title: string;

  subtitle: string;

  logo: string;

  logoAlt: string;

  accent: string;

}


// =========================================================
// SECCIONES ADMINISTRATIVAS
// =========================================================

type AdminSection =
  | 'panel'
  | 'contalab'
  | 'pasos';


// =========================================================
// ITEM DE NAVEGACIÓN
// =========================================================

interface NavItem {

  label: string;

  icon: string;

  route: string;

  home?: boolean;

}


// =========================================================
// GRUPO DE NAVEGACIÓN
// =========================================================

interface NavGroup {

  label: string;

  icon: string;

  items: NavItem[];

  defaultOpen?: boolean;

}


// =========================================================
// RESPUESTA DEL USUARIO
// =========================================================

interface CurrentUser {

  usuario_id: number;

  persona_id: number;

  nombre_usuario: string;

  correo_electronico: string;

  rol_id: number;

  estado: boolean;

}


// =========================================================
// PERSONA
// =========================================================

interface CurrentPerson {

  persona_id?: number;

  primer_nombre?: string;

  segundo_nombre?: string;

  primer_apellido?: string;

  segundo_apellido?: string;

  telefono?: string;

}


// =========================================================
// RESPUESTA /AUTH/ME
// =========================================================

interface CurrentUserResponse {

  user: CurrentUser;

  persona?: CurrentPerson;

  profile?: any;

}


// =========================================================
// COMPONENTE
// =========================================================

@Component({

  selector: 'app-admin',

  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],

  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  templateUrl: './admin.html',

  styleUrl: './admin.css',

})


export class Admin implements OnInit {


  // =========================================================
  // SIDEBAR
  // =========================================================

  sidebarOpen = false;


  // =========================================================
  // MENÚ DE USUARIO
  // =========================================================

  userMenuOpen = false;


  // =========================================================
  // GRUPOS ABIERTOS
  // =========================================================

  expandedGroups: Record<string, boolean> = {};


  // =========================================================
  // USUARIO
  // =========================================================

  userName = signal('');

  userEmail = signal('');

  userRole = signal('');

  userImage = signal('');


  // =========================================================
  // SECCIÓN ACTUAL
  // =========================================================

  currentSection: AdminSection = 'panel';


  // =========================================================
  // IDENTIDAD ACTUAL
  // =========================================================

  currentIdentity: SectionIdentity = {

    title: 'Panel Maestro',

    subtitle: 'Administración',

    logo: 'Marca Pasos Ico.svg',

    logoAlt: 'PASOS',

    accent: 'zinc'

  };


  // =========================================================
  // INFORMACIÓN DEL LAYOUT
  // =========================================================

  adminTitle = 'Panel Maestro';

  adminSubtitle = 'Administración';

  pageTitle = 'Panel Maestro';


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(

    private readonly auth: AuthService,

    private readonly router: Router

  ) { }


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.loadCurrentUser();

    this.updateSection(this.router.url);

    this.openActiveGroup(this.router.url);


    this.router.events

      .pipe(
        filter(
          event => event instanceof NavigationEnd
        )
      )

      .subscribe(event => {

        const navigation =
          event as NavigationEnd;

        const url =
          navigation.urlAfterRedirects;

        this.updateSection(url);

        this.openActiveGroup(url);

        // Cerramos el menú de usuario al navegar.

        this.userMenuOpen = false;

      });

  }


  // =========================================================
  // CARGAR USUARIO AUTENTICADO
  // =========================================================

  private loadCurrentUser(): void {

    this.auth.getCurrentUser().subscribe({

      next: (response: AuthUser) => {

        // ================================================
        // GUARDAR USUARIO EN EL SERVICIO
        // ================================================

        this.auth.setCurrentUser(response);


        // ================================================
        // DE LA RESPUESTA SEGMENTAR DATOS
        // ================================================

        const user: UsersResponse = response.user;
        const persona: PersonasResponse = response.persona;


        // ================================================
        // NOMBRE
        // ================================================

        const nombreCompleto = [

          persona.primer_nombre,

          persona.segundo_nombre,

          persona.primer_apellido,

          persona.segundo_apellido

        ]

          .filter(Boolean)

          .join(' ');


        this.userName.set(

          nombreCompleto ||
          'Usuario'

        );


        this.userEmail.set(
          user.correo_electronico ||
          'correo@gmail.com'
        )


        // ================================================
        // ROL
        // ================================================

        this.userRole.set(

          this.getRoleName(user.rol_id)

        );


        // ================================================
        // IMAGEN
        // ================================================

        this.userImage.set('');

      },


      error: (error) => {

        console.error(
          'No se pudo obtener el usuario actual:',
          error
        );

      }

    });

  }

  // =========================================================
  // CONSTRUIR NOMBRE
  // =========================================================

  private buildFullName(
    persona: CurrentPerson | undefined,
    fallback: string
  ): string {

    if (!persona) {
      return fallback;
    }


    const parts = [

      persona.primer_nombre,

      persona.segundo_nombre,

      persona.primer_apellido,

      persona.segundo_apellido

    ];


    const fullName =
      parts
        .filter(
          value =>
            typeof value === 'string' &&
            value.trim().length > 0
        )
        .join(' ');


    return fullName || fallback;

  }


  // =========================================================
  // NOMBRE DEL ROL
  // =========================================================

  private getRoleName(roleId: number): string {

    const roles: Record<number, string> = {

      1: 'Superadministrador',

      2: 'Administrador Gerencial',

      3: 'Administrador Contable',

      4: 'Administrador Operativo',

      5: 'Usuario Estándar'

    };


    return roles[roleId] ??
      `Rol ${roleId}`;

  }


  // =========================================================
  // MENÚ DE USUARIO
  // =========================================================

  toggleUserMenu(): void {

    this.userMenuOpen =
      !this.userMenuOpen;

  }


  // =========================================================
  // CERRAR SESIÓN
  // =========================================================

  logout(): void {

    this.userMenuOpen = false;


    this.auth.logout().subscribe({

      next: () => {

        this.clearUserState();

        this.router.navigate(['/auth']);

      },


      error: (error) => {

        console.error(
          'Error al cerrar sesión:',
          error
        );


        /*
         * Aunque el backend falle, no debemos
         * dejar al usuario atrapado en el panel.
         *
         * El access token ya podría estar
         * invalidado, por lo que limpiamos
         * igualmente el estado local.
         */

        this.clearUserState();

        this.router.navigate(['/']);

      }

    });

  }


  // =========================================================
  // LIMPIAR ESTADO DEL USUARIO
  // =========================================================

  private clearUserState(): void {

    this.userName.set('');

    this.userEmail.set('');

    this.userRole.set('');

    this.userImage.set('');

    // this.auth.setLoggedIn(false);

  }


  // =========================================================
  // SIDEBAR
  // =========================================================

  toggleSidebar(): void {

    this.sidebarOpen =
      !this.sidebarOpen;

  }


  closeSidebar(): void {

    this.sidebarOpen = false;

  }


  // =========================================================
  // GRUPOS
  // =========================================================

  toggleGroup(group: NavGroup): void {

    this.expandedGroups[group.label] =
      !this.isGroupExpanded(group);

  }


  // =========================================================
  // ESTADO DEL GRUPO
  // =========================================================

  isGroupExpanded(group: NavGroup): boolean {

    if (
      this.expandedGroups[group.label]
      !== undefined
    ) {

      return this.expandedGroups[group.label];

    }

    return group.defaultOpen ?? false;

  }


  // =========================================================
  // ABRIR GRUPO ACTIVO
  // =========================================================

  private openActiveGroup(url: string): void {

    const groups =
      this.currentNavGroups;

    for (const group of groups) {

      const hasActiveRoute =
        group.items.some(item =>
          this.isRouteActive(
            item.route,
            url
          )
        );


      if (hasActiveRoute) {

        this.expandedGroups[group.label] =
          true;

      }

    }

  }


  // =========================================================
  // RUTA ACTIVA
  // =========================================================

  isRouteActive(
    route: string,
    url: string
  ): boolean {

    if (
      route === '/admin/contalab' ||
      route === '/admin/pasos' ||
      route === '/admin/panel'
    ) {

      return (
        url === route ||
        url === `${route}/`
      );

    }

    return url.startsWith(route);

  }


  // =========================================================
  // AVATAR
  // =========================================================

  getAvatar(): string {

    const image =
      this.userImage();


    const isValidImage =

      typeof image === 'string' &&

      image.trim().length > 0 &&

      ![
        'null',
        'undefined'
      ].includes(
        image.trim()
      );


    if (isValidImage) {

      return image;

    }


    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      this.userName() || 'Usuario'
    )}&background=000000&color=ffffff&size=128`;

  }


  // =========================================================
  // DETECTAR SECCIÓN
  // =========================================================

  private updateSection(url: string): void {


    // -------------------------------------------------------
    // CONTALAB
    // -------------------------------------------------------

    if (url.startsWith('/admin/contalab')) {

      this.currentSection = 'contalab';

      this.currentIdentity = {

        title: 'CONTALAB',

        subtitle: 'Administración contable',

        logo: '/Contalab Rounded/Contalab Light Rounded.png',

        logoAlt: 'Contalab',

        accent: 'amber'

      };

      this.adminTitle =
        this.currentIdentity.title;

      this.adminSubtitle =
        this.currentIdentity.subtitle;

      this.pageTitle =
        this.getPageTitle(url);

      return;

    }


    // -------------------------------------------------------
    // PASOS
    // -------------------------------------------------------

    if (url.startsWith('/admin/pasos')) {

      this.currentSection = 'pasos';

      this.currentIdentity = {

        title: 'PASOS',

        subtitle: 'Administración',

        logo: 'Marca Pasos Ico.svg',

        logoAlt: 'PASOS',

        accent: 'emerald'

      };

      this.adminTitle =
        this.currentIdentity.title;

      this.adminSubtitle =
        this.currentIdentity.subtitle;

      this.pageTitle =
        this.getPageTitle(url);

      return;

    }


    // -------------------------------------------------------
    // PANEL MAESTRO
    // -------------------------------------------------------

    this.currentSection = 'panel';

    this.currentIdentity = {

      title: 'Panel Maestro',

      subtitle: 'Administración',

      logo: 'Marca Pasos Ico.svg',

      logoAlt: 'PASOS',

      accent: 'zinc'

    };

    this.adminTitle =
      this.currentIdentity.title;

    this.adminSubtitle =
      this.currentIdentity.subtitle;

    this.pageTitle =
      this.getPageTitle(url);

  }


  // =========================================================
  // TÍTULO DE LA PÁGINA
  // =========================================================

  private getPageTitle(url: string): string {

    if (
      url === '/admin/panel' ||
      url === '/admin/panel/'
    ) {

      return 'Panel Maestro';

    }


    if (url.includes('/admin/modulos')) {

      return 'Módulos';

    }


    if (url.includes('/admin/administradores')) {

      return 'Administradores';

    }


    if (url.includes('/admin/configuracion')) {

      return 'Configuración';

    }


    if (url.includes('/admin/seguridad')) {

      return 'Seguridad';

    }


    if (url.includes('/admin/auditoria')) {

      return 'Auditoría';

    }


    if (url.includes('/admin/sistema')) {

      return 'Estado del sistema';

    }


    // -------------------------------------------------------
    // CONTALAB
    // -------------------------------------------------------

    if (url.includes('/admin/contalab/usuarios')) {

      return 'Usuarios';

    }


    if (url.includes('/admin/contalab/roles')) {

      return 'Roles y permisos';

    }


    if (url.includes('/admin/contalab/personas')) {

      return 'Personas';

    }


    if (url.includes('/admin/contalab/refresh-tokens')) {

      return 'Refresh Tokens';

    }


    if (url.includes('/admin/contalab/cuentas')) {

      return 'Catálogo de cuentas';

    }


    if (url.includes('/admin/contalab/asientos')) {

      return 'Asientos contables';

    }


    if (url.includes('/admin/contalab/clientes')) {

      return 'Clientes';

    }


    if (url.includes('/admin/contalab/facturas')) {

      return 'Facturas';

    }


    if (url.includes('/admin/contalab/cobros')) {

      return 'Cobros';

    }


    if (url.includes('/admin/contalab/proveedores')) {

      return 'Proveedores';

    }


    if (url.includes('/admin/contalab/compras')) {

      return 'Compras';

    }


    if (url.includes('/admin/contalab/pagos-proveedores')) {

      return 'Pagos a proveedores';

    }


    if (url.includes('/admin/contalab/empleados')) {

      return 'Empleados';

    }


    if (url.includes('/admin/contalab/nomina')) {

      return 'Nómina';

    }


    if (url.includes('/admin/contalab/reportes')) {

      return 'Reportes';

    }


    if (
      url.includes(
        '/admin/contalab/estados-financieros'
      )
    ) {

      return 'Estados financieros';

    }


    if (url.includes('/admin/contalab/graficas')) {

      return 'Gráficas';

    }


    if (
      url === '/admin/contalab' ||
      url === '/admin/contalab/'
    ) {

      return 'Contalab';

    }


    // -------------------------------------------------------
    // PASOS
    // -------------------------------------------------------

    if (
      url === '/admin/pasos' ||
      url === '/admin/pasos/'
    ) {

      return 'PASOS';

    }


    if (url.includes('/admin/pasos/usuarios')) {

      return 'Usuarios';

    }


    return 'Administración';

  }


  // =========================================================
  // NAVEGACIÓN GLOBAL
  // =========================================================

  goToMasterPanel(): void {

    if (this.currentSection === 'panel') {
      return;
    }

    this.router.navigate(['/admin/panel']);

  }


  goToPasos(): void {

    if (this.currentSection === 'pasos') {
      return;
    }

    this.router.navigate(['/admin/pasos']);

  }


  goToContalab(): void {

    if (this.currentSection === 'contalab') {
      return;
    }

    this.router.navigate(['/admin/contalab']);

  }


  goToCommercialSite(): void {

    this.router.navigate(['/']);

  }


  // =========================================================
  // PANEL MAESTRO
  // =========================================================

  panelNavGroups: NavGroup[] = [

    {

      label: 'Inicio',

      icon: 'lucide:layout-dashboard',

      defaultOpen: true,

      items: [

        {
          label: 'Panel Maestro',
          icon: 'lucide:layout-dashboard',
          route: '/admin/panel',
          home: true
        }

      ]

    },

    {

      label: 'Administración',

      icon: 'lucide:settings',

      defaultOpen: true,

      items: [

        {
          label: 'Módulos',
          icon: 'lucide:blocks',
          route: '/admin/modulos'
        },

        {
          label: 'Administradores',
          icon: 'lucide:user-cog',
          route: '/admin/administradores'
        },

        {
          label: 'Configuración',
          icon: 'lucide:settings',
          route: '/admin/configuracion'
        }

      ]

    },

    {

      label: 'Seguridad',

      icon: 'lucide:shield-check',

      items: [

        {
          label: 'Seguridad',
          icon: 'lucide:shield-check',
          route: '/admin/seguridad'
        },

        {
          label: 'Auditoría',
          icon: 'lucide:file-clock',
          route: '/admin/auditoria'
        }

      ]

    },

    {

      label: 'Sistema',

      icon: 'lucide:activity',

      items: [

        {
          label: 'Estado del sistema',
          icon: 'lucide:activity',
          route: '/admin/sistema'
        }

      ]

    }

  ];


  // =========================================================
  // CONTALAB
  // =========================================================

  contalabNavGroups: NavGroup[] = [

    {

      label: 'Inicio',

      icon: 'lucide:layout-dashboard',

      defaultOpen: true,

      items: [

        {
          label: 'Panel',
          icon: 'lucide:layout-dashboard',
          route: '/admin/contalab',
          home: true
        }

      ]

    },

    {

      label: 'Seguridad y acceso',

      icon: 'lucide:shield-check',

      items: [

        {
          label: 'Usuarios',
          icon: 'lucide:users',
          route: '/admin/contalab/usuarios'
        },

        {
          label: 'Roles y permisos',
          icon: 'lucide:shield',
          route: '/admin/contalab/roles'
        },

        {
          label: 'Personas',
          icon: 'lucide:user-round',
          route: '/admin/contalab/personas'
        },

        {
          label: 'Refresh Tokens',
          icon: 'lucide:key-round',
          route: '/admin/contalab/refresh-tokens'
        }

      ]

    },

    {

      label: 'Contabilidad',

      icon: 'lucide:book-open',

      items: [

        {
          label: 'Catálogo de cuentas',
          icon: 'lucide:book-open',
          route: '/admin/contalab/contabilidad/catalogo-cuentas'
        },

        {
          label: 'Asientos contables',
          icon: 'lucide:receipt-text',
          route: '/admin/contalab/contabilidad/asientos-contables'
        }

      ]

    },

    {

      label: 'Ventas',

      icon: 'lucide:shopping-bag',

      items: [

        {
          label: 'Clientes',
          icon: 'lucide:users-round',
          route: '/admin/contalab/clientes'
        },

        {
          label: 'Facturas',
          icon: 'lucide:file-text',
          route: '/admin/contalab/facturas'
        },

        {
          label: 'Cobros',
          icon: 'lucide:hand-coins',
          route: '/admin/contalab/cobros'
        }

      ]

    },

    {

      label: 'Compras',

      icon: 'lucide:truck',

      items: [

        {
          label: 'Proveedores',
          icon: 'lucide:truck',
          route: '/admin/contalab/proveedores'
        },

        {
          label: 'Compras',
          icon: 'lucide:shopping-cart',
          route: '/admin/contalab/compras'
        },

        {
          label: 'Pagos a proveedores',
          icon: 'lucide:credit-card',
          route: '/admin/contalab/pagos-proveedores'
        }

      ]

    },

    {

      label: 'Personal',

      icon: 'lucide:users-round',

      items: [

        {
          label: 'Empleados',
          icon: 'lucide:user-round',
          route: '/admin/contalab/empleados'
        },

        {
          label: 'Nómina',
          icon: 'lucide:wallet-cards',
          route: '/admin/contalab/nomina'
        }

      ]

    },

    {

      label: 'Análisis',

      icon: 'lucide:chart-no-axes-combined',

      items: [

        {
          label: 'Reportes',
          icon: 'lucide:file-chart-column',
          route: '/admin/contalab/reportes'
        },

        {
          label: 'Estados financieros',
          icon: 'lucide:chart-column',
          route: '/admin/contalab/analisis/estados-financieros'
        },

        {
          label: 'Gráficas',
          icon: 'lucide:chart-pie',
          route: '/admin/contalab/graficas'
        }

      ]

    }

  ];


  // =========================================================
  // PASOS
  // =========================================================

  pasosNavGroups: NavGroup[] = [

    {

      label: 'Inicio',

      icon: 'lucide:layout-dashboard',

      defaultOpen: true,

      items: [

        {
          label: 'Panel',
          icon: 'lucide:layout-dashboard',
          route: '/admin/pasos',
          home: true
        }

      ]

    },

    {

      label: 'Administración',

      icon: 'lucide:settings',

      items: [

        {
          label: 'Usuarios',
          icon: 'lucide:users',
          route: '/admin/pasos/usuarios'
        }

      ]

    }

  ];


  // =========================================================
  // NAVEGACIÓN ACTUAL
  // =========================================================

  get currentNavGroups(): NavGroup[] {

    switch (this.currentSection) {

      case 'contalab':
        return this.contalabNavGroups;

      case 'pasos':
        return this.pasosNavGroups;

      default:
        return this.panelNavGroups;

    }

  }

}