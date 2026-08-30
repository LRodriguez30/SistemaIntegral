import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * 
 * @param req 
 * @param next 
 * @returns
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {

    const auth = inject(AuthService);

    return next(req).pipe(

        catchError((error: HttpErrorResponse) => {

            // Solo un 401
            if (error.status !== 401) {
                return throwError(() => error);
            }
            
            // No intentar refresh sobre el propio endpoint de refresh
            if (req.url.includes('/auth/refresh')) {
                return throwError(() => error);
            }
            
            // console.log(
            //     'AUTH INTERCEPTOR - Access token expirado. Intentando refresh...'
            // );

            return auth.refresh().pipe(

                switchMap(() => {

                    // console.log(
                    //     'AUTH INTERCEPTOR - Access token renovado. Reintentando petición...'
                    // );

                    return next(req);
                }),

                catchError(refreshError => {

                    // console.error(
                    //     'AUTH INTERCEPTOR - No se pudo renovar el token:',
                    //     refreshError
                    // );

                    return throwError(() => refreshError);
                })

            );
        })

    );
};