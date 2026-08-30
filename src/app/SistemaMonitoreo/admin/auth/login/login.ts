import { Component, inject, signal } from '@angular/core';
import {
    FormBuilder,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../services/auth.service';
import { baseUrl } from '../../../../app';
import { AuthLoaderService } from '../../../../services/loaders/auth-loader.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './login.html',
})
export class LoginComponent {

    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);

    private readonly loader = inject(AuthLoaderService);


    // =====================================================
    // ESTADO
    // =====================================================

    loading = signal(false);

    showPassword = signal(false);

    errorMessage = signal('');


    // =====================================================
    // FORMULARIO
    // =====================================================

    readonly loginForm = this.fb.nonNullable.group({

        email: [
            '',
            [
                Validators.required,
                Validators.email
            ]
        ],

        password: [
            '',
            [
                Validators.required
            ]
        ],

        rememberMe: [
            false
        ]

    });


    // =====================================================
    // GETTERS
    // =====================================================

    get email() {
        return this.loginForm.controls.email;
    }


    get password() {
        return this.loginForm.controls.password;
    }


    // =====================================================
    // MOSTRAR / OCULTAR CONTRASEÑA
    // =====================================================

    togglePassword(): void {

        this.showPassword.update(
            value => !value
        );

    }


    // =====================================================
    // LOGIN
    // =====================================================

    private getDeviceInfo() {

        const userAgent = navigator.userAgent;

        let deviceType = 'desktop';

        if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
            deviceType = 'tablet';
        } else if (/mobile|iphone|ipod|android/i.test(userAgent)) {
            deviceType = 'mobile';
        }

        let os = 'Unknown';

        if (/windows nt/i.test(userAgent)) {
            os = 'Windows';
        } else if (/android/i.test(userAgent)) {
            os = 'Android';
        } else if (/iphone|ipad|ipod/i.test(userAgent)) {
            os = 'iOS';
        } else if (/mac os x/i.test(userAgent)) {
            os = 'macOS';
        } else if (/linux/i.test(userAgent)) {
            os = 'Linux';
        }

        let browser = 'Unknown';

        if (/edg\//i.test(userAgent)) {
            browser = 'Microsoft Edge';

        } else if (/opr\//i.test(userAgent)) {
            browser = 'Opera';

        } else if ((navigator as any).brave) {
            browser = 'Brave';

        } else if (/firefox\//i.test(userAgent)) {
            browser = 'Mozilla Firefox';

        } else if (/chrome\//i.test(userAgent)) {
            browser = 'Google Chrome';

        } else if (/safari\//i.test(userAgent)) {
            browser = 'Safari';
        }

        return {
            deviceType,
            os,
            browser
        };
    }

    submit(): void {

        // Evitar doble petición

        if (this.loading()) {
            return;
        }


        // Limpiar error anterior

        this.errorMessage.set('');


        // Validar formulario

        if (this.loginForm.invalid) {

            this.loginForm.markAllAsTouched();

            return;
        }


        // Activar loading

        this.loading.set(true);
        this.loader.show('Iniciando sesión...');


        const form =
            this.loginForm.getRawValue();


        const loginData = {

            correo_electronico:
                form.email.trim(),

            contraseña:
                form.password,

            device_info:
                this.getDeviceInfo()

        };

        this.authService
            .login(loginData)

            .pipe(

                finalize(() => {

                    this.loading.set(false);
                    this.loader.hide();

                })

            )

            .subscribe({

                // =====================================
                // ÉXITO
                // =====================================

                next: (response) => {

                    console.log(
                        'Usuario autenticado:',
                        response
                    );

                    this.router.navigate([
                        '/admin'
                    ]);

                },


                // =====================================
                // ERROR
                // =====================================

                error: (error) => {

                    this.handleLoginError(error);

                }

            });

    }


    // =====================================================
    // ERROR DEL LOGIN
    // =====================================================

    private handleLoginError(error: any): void {

        const status =
            error?.status;


        // const backendMessage =
        //     error?.error?.message;

        const backendMessage =
            "";


        switch (status) {

            case 400:

                this.errorMessage.set(
                    backendMessage ||
                    'Los datos enviados no son válidos.'
                );

                break;


            case 401:

                this.errorMessage.set(
                    backendMessage ||
                    'El correo electrónico o la contraseña son incorrectos.'
                );

                break;


            case 403:

                this.errorMessage.set(
                    backendMessage ||
                    'Tu cuenta no tiene permiso para acceder al sistema.'
                );

                break;


            case 404:

                this.errorMessage.set(
                    backendMessage ||
                    'No se encontró una cuenta con esas credenciales.'
                );

                break;


            case 429:

                this.errorMessage.set(
                    'Demasiados intentos. Espera unos momentos antes de volver a intentarlo.'
                );

                break;


            case 0:

                this.errorMessage.set(
                    'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo nuevamente.'
                );

                break;


            default:

                this.errorMessage.set(
                    backendMessage ||
                    'No se pudo iniciar sesión. Inténtalo nuevamente.'
                );

                break;

        }

    }


    // =====================================================
    // REINTENTAR
    // =====================================================

    retryLogin(): void {

        if (this.loading()) {
            return;
        }

        this.submit();

    }


    // =====================================================
    // LOGIN MICROSOFT
    // =====================================================

    loginWithMicrosoft(): void {

        window.location.href =
            `${baseUrl}/auth/microsoft`;

    }


    // =====================================================
    // REGISTRO
    // =====================================================

    goToRegister(): void {

        this.router.navigate([
            '/auth/register'
        ]);

    }


    // =====================================================
    // RECUPERAR CONTRASEÑA
    // =====================================================

    forgotPassword(): void {

        this.router.navigate([
            '/auth/forgot-password'
        ]);

    }

}