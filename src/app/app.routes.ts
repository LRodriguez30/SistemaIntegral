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
import { Users } from './SistemaMonitoreo/admin/auth/users/users';


// Layouts
import { DashboardLayout } from './layouts/dashboard/dashboard-layout';
import { Unauthorized } from './unauthorized/unauthorized';
import { BaseComercial } from './SistemaComercial/base';

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

    // Rutas Sistema Monitoreo
    {
        path: 'admin',
        title: 'Pasos',
        component: DashboardLayout,
        children: [
            {
                path: '',
                title: 'Admin | Pasos',
                component: Admin,
                // canActivate: [adminGuard],
                children: [
                    {
                        path: '',
                        redirectTo: 'panel/users',
                        pathMatch: 'full'
                    },
                    {
                        path: 'panel/users',
                        title: 'Admin | Usuarios | Pasos',
                        component: Users
                    }
                ]
            }
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
