import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';

import { catchError, map, of } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { isPlatformBrowser } from '@angular/common';

export const adminGuard: CanActivateFn = (_, state) => {

  const platformId = inject(PLATFORM_ID);

  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.getCurrentUser().pipe(

    map(res => {

      const allowedRoles = ['Admin', 'Dueño'];
      const role = res.user.role;

      if (allowedRoles.includes(role)) {
        return true;
      }


      if (isPlatformBrowser(platformId)) {
        localStorage.setItem('redirectAfterLogin', state.url);
        return router.createUrlTree(['/unauthorized']);
      }

      return false

    }),

    catchError(() => {

      if (isPlatformBrowser(platformId)) {
        localStorage.setItem('redirectAfterLogin', state.url);
      }

      return of(
        router.createUrlTree(['/unauthorized'])
      );

    })

  );

};