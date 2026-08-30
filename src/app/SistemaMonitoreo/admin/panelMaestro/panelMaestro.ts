import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

@Component({
    selector: 'app-admin-master-panel',
    standalone: true,
    imports: [
        RouterLink
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './panelMaestro.html'
})
export class Panel {

    private readonly router = inject(Router);

    currentRoute = '';

    constructor() {

        this.currentRoute = this.router.url;

        this.router.events
            .pipe(
                filter(
                    event => event instanceof NavigationEnd
                )
            )
            .subscribe(
                (event: NavigationEnd) => {
                    this.currentRoute = event.urlAfterRedirects;
                }
            );

    }


    /**
     * Determina si el usuario está actualmente
     * dentro del módulo indicado.
     */
    isModuleActive(module: 'pasos' | 'contalab'): boolean {

        if (module === 'pasos') {

            return (
                this.currentRoute.startsWith('/pasos')
            );

        }

        if (module === 'contalab') {

            return (
                this.currentRoute.startsWith('/contalab')
            );

        }

        return false;
    }


    /**
     * Determina si estamos exactamente
     * en el Panel Maestro.
     */
    isMasterPanel(): boolean {

        return (
            this.currentRoute === '/admin' ||
            this.currentRoute === '/admin/' ||
            this.currentRoute === '/'
        );

    }

}