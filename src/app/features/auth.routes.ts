import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('../SistemaMonitoreo/admin/auth/auth').then(
                m => m.AuthComponent
            ),
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'login'
            },
            {
                path: 'login',
                loadComponent: () =>
                    import('../SistemaMonitoreo/admin/auth/login/login').then(
                        m => m.LoginComponent
                    )
            },
        ]
    }
];