import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { catchError, finalize, map, of } from 'rxjs';

import { AuthService } from '../../../../services/auth.service';
import { AuthLoaderService } from '../../../../services/loaders/auth-loader.service';

export const loginGuard: CanActivateFn = (route) => {

    const auth = inject(AuthService);
    const router = inject(Router);
    const loader = inject(AuthLoaderService);

    loader.show('Verificando sesión...');

    return auth.getCurrentUser().pipe(

        map(response => {

            if (response?.user?.estado === true) {

                const returnUrl =
                    route.queryParamMap.get('returnUrl');

                return router.createUrlTree([
                    returnUrl || '/admin'
                ]);
            }

            return true;
        }),

        catchError(() => of(true)),

        finalize(() => {
            loader.hide();
        })
    );
};