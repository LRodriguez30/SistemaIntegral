import { Routes } from '@angular/router';

// Módulos Sistema Comercial
import { Home } from './SistemaComercial/home/home';
import { Catalog } from './SistemaComercial/catalog/catalog';
import { NotFoundComponent } from './SistemaComercial/not-found/not-found.component';
import { Branch } from './SistemaComercial/branch/branch';
import { About } from './SistemaComercial/about/about';
import { FAQ } from './SistemaComercial/faq/faq';
import { Policy } from './SistemaComercial/policy/policy';
import { Contact } from './SistemaComercial/contact/contact';


// Módulos Sistema Monitoreo
import { Admin } from './SistemaMonitoreo/admin/admin';
import { adminGuard } from './SistemaMonitoreo/admin/admin.guard';
import { Users } from './SistemaMonitoreo/admin/contalab/users/users';


// Layouts
import { DashboardLayout } from './layouts/dashboard/dashboard-layout';
import { Unauthorized } from './unauthorized/unauthorized';
import { BaseComercial } from './SistemaComercial/base';
import { Panel } from './SistemaMonitoreo/admin/panelMaestro/panelMaestro';
import { Pasos } from './SistemaMonitoreo/admin/pasos/pasos';
import { Contalab } from './SistemaMonitoreo/admin/contalab/contalab';
import { LoginComponent } from './SistemaMonitoreo/admin/auth/login/login';
import { AuthComponent } from './SistemaMonitoreo/admin/auth/auth';
import { loginGuard } from './SistemaMonitoreo/admin/auth/login/login.guard';
import { AuthLayout } from './layouts/auth/auth-layout';
import { Roles } from './SistemaMonitoreo/admin/contalab/roles/roles';
import { Personas } from './SistemaMonitoreo/admin/contalab/personas/personas';
import { RefreshTokens } from './SistemaMonitoreo/admin/contalab/refresh_tokens/refresh_tokens';

export const routes: Routes = [
    // Rutas Sistema Comercial
    {
        path: '',
        title: "Pasos",
        component: BaseComercial,
        children: [
            {
                path: '',
                title: "Pasos | Nicaragua camina con Pasos",
                redirectTo: 'home',
                pathMatch: 'full'
            },
            {
                path: 'home',
                title: "Pasos | ¡Nicaragua camina con Pasos!",
                component: Home
            },
            {
                path: 'branch',
                title: "Puntos de Venta | Pasos",
                component: Branch
            },
            {
                path: 'catalog',
                title: "Catálogo | Pasos",
                component: Catalog
            },
            {
                path: 'faq',
                title: "Preguntas Frecuentes | Pasos",
                component: FAQ
            },
            {
                path: 'policy',
                title: "Políticas | Pasos",
                component: Policy
            },
            {
                path: 'about',
                title: "Acerca de Nosotros | Pasos",
                component: About
            },
            {
                path: 'contact',
                title: "Contacto | Pasos",
                component: Contact
            },
        ]
    },

    {
        path: 'auth',
        component: AuthLayout,
        children: [
            {
                path: '',
                component: AuthComponent,
                children: [
                    {
                        path: '',
                        redirectTo: 'login',
                        pathMatch: 'full'
                    },
                    {
                        path: 'login',
                        title: 'Iniciar sesión',
                        component: LoginComponent,
                        canActivate: [loginGuard]
                    }
                ]
            }
        ]
    },

    {
        path: 'admin',
        component: DashboardLayout,
        canActivate: [adminGuard],
        children: [
            {
                path: '',
                component: Admin,
                children: [
                    // =====================================================
                    // PANEL MAESTRO
                    // =====================================================

                    {
                        path: '',
                        redirectTo: 'panel',
                        pathMatch: 'full'
                    },

                    {
                        path: 'panel',
                        title: 'PASOS | Panel Maestro',
                        component: Panel
                    },


                    // // =====================================================
                    // // PASOS
                    // // =====================================================

                    // {
                    //     path: 'pasos',
                    //     title: 'PASOS | Administración',
                    //     component: Pasos,
                    // },


                    // =====================================================
                    // CONTALAB
                    // =====================================================

                    {
                        path: 'contalab',
                        title: 'Contalab | Administración',
                        component: Contalab
                    },

                    {
                        path: 'contalab/usuarios',
                        title: 'Contalab | Usuarios',
                        component: Users
                    },

                    {
                        path: 'contalab/roles',
                        title: 'Contalab | Roles y permisos',
                        component: Roles
                    },

                    {
                        path: 'contalab/personas',
                        title: 'Contalab | Personas',
                        component: Personas
                    },

                    {
                        path: 'contalab/refresh-tokens',
                        title: 'Contalab | Refresh Tokens',
                        component: RefreshTokens
                    },
                ]
            },

        ]
    },

    // Rutas de error
    // {
    //     path: 'server-error',
    //     title: '500 - Error inesperado',
    //     component: ServerError
    // },
    // {
    //     path: 'server-disconnected',
    //     title: 'Conexión perdida',
    //     component: ServerDisconnected
    // },
    {
        path: 'unauthorized',
        title: '401 - Acceso Denegado',
        component: Unauthorized
    },
    {
        path: '**',
        component: NotFoundComponent
    }
];
