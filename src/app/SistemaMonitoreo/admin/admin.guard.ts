import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { catchError, map, of } from 'rxjs';

import { AuthService } from '../../services/auth.service';

export const adminGuard: CanActivateFn = (_, state) => {

    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.getCurrentUser().pipe(

        map(response => {

            // console.log(
            //     'ADMIN GUARD - Datos del usuario recibido:',
            //     response
            // );

            // =====================================================
            // SESIÓN VÁLIDA
            // =====================================================

            if (response && response.user.estado === true) {

                // console.log(
                //     'ADMIN GUARD - Acceso permitido:',
                //     state.url
                // );

                return true;
            }

            // =====================================================
            // NO AUTENTICADO
            // =====================================================

            // console.log(
            //     'ADMIN GUARD - Redirigiendo al login:',
            //     state.url
            // );

            return router.createUrlTree(
                ['/auth/login'],
                {
                    queryParams: {
                        returnUrl: state.url
                    }
                }
            );

        }),

        catchError(error => {

            // console.error(
            //     'ADMIN GUARD - Error verificando sesión:',
            //     error
            // );

            return of(
                router.createUrlTree(
                    ['/auth/login'],
                    {
                        queryParams: {
                            returnUrl: state.url
                        }
                    }
                )
            );

        })

    );

};