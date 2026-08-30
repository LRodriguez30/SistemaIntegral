import { NgOptimizedImage } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-auth',
    standalone: true,
    imports: [RouterOutlet, NgOptimizedImage],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './auth.html',
})
export class AuthComponent {
    readonly currentYear = new Date().getFullYear();

    constructor(
        private readonly router: Router
    ) {}

    goToLogin(): void {
        this.router.navigate(['/auth/login']);
    }

    goToRegister(): void {
        this.router.navigate(['/auth/register']);
    }

    goToLanding(): void {
        this.router.navigate(['/']);
    }

    goBack(): void {
        window.history.back();
    }
}