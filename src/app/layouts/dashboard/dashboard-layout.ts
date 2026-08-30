import {
  Component,
  OnInit,
  OnDestroy,
  signal
} from '@angular/core';

import {
  NavigationEnd,
  Router,
  RouterOutlet
} from '@angular/router';

import {
  filter,
  Subscription
} from 'rxjs';

import {
  DashboardLoaderService
} from '../../services/loaders/dashboard-loader.service';


// =========================================================
// IDENTIDAD DEL MÓDULO
// =========================================================

interface ModuleIdentity {

  name: string;

  subtitle: string;

  logo: string;

  logoAlt: string;

  description: string;

}


// =========================================================
// COMPONENTE
// =========================================================

@Component({

  selector: 'app-dashboard-layout',

  imports: [
    RouterOutlet
  ],

  templateUrl: './dashboard-layout.component.html'

})


export class DashboardLayout
  implements OnInit, OnDestroy {


  // =========================================================
  // ESTADO DEL LAYOUT
  // =========================================================

  booting = signal(true);

  loaderVisible = signal(true);

  transitioning = signal(false);


  // =========================================================
  // IDENTIDAD ACTUAL
  // =========================================================

  moduleName = signal('PASOS');

  moduleSubtitle = signal('Administración');

  moduleLogo = signal('Marca Pasos Ico.svg');

  moduleLogoAlt = signal('PASOS');

  moduleDescription = signal('PASOS');


  // =========================================================
  // TIMER
  // =========================================================

  private timer: ReturnType<typeof setTimeout> | undefined;

  private transitionTimer:
    ReturnType<typeof setTimeout> | undefined;


  // =========================================================
  // SUSCRIPCIÓN DEL ROUTER
  // =========================================================

  private routerSubscription?: Subscription;


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(

    public loader: DashboardLoaderService,

    private router: Router

  ) {}


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    // Determinar identidad inicial
    this.updateModuleIdentity(
      this.router.url
    );


    // Escuchar cambios de ruta
    this.routerSubscription =
      this.router.events

        .pipe(
          filter(
            event =>
              event instanceof NavigationEnd
          )
        )

        .subscribe(event => {

          const navigation =
            event as NavigationEnd;

          this.updateModuleIdentity(
            navigation.urlAfterRedirects
          );

        });


    // Iniciar loader
    this.start();

  }


  // =========================================================
  // DESTRUIR
  // =========================================================

  ngOnDestroy(): void {

    this.routerSubscription?.unsubscribe();


    if (this.timer) {

      clearTimeout(
        this.timer
      );

    }


    if (this.transitionTimer) {

      clearTimeout(
        this.transitionTimer
      );

    }

  }


  // =========================================================
  // INICIAR DASHBOARD
  // =========================================================

  start(): void {

    this.booting.set(true);

    this.loaderVisible.set(true);

    this.transitioning.set(false);


    this.loader.show();


    this.timer =
      setTimeout(() => {


        // ---------------------------------------------------
        // INICIAR FADE OUT
        // ---------------------------------------------------

        this.transitioning.set(true);

        this.loader.hide();


        // ---------------------------------------------------
        // ESPERAR ANIMACIÓN
        // ---------------------------------------------------

        this.transitionTimer =
          setTimeout(() => {

            this.loaderVisible.set(false);

            this.booting.set(false);

            this.transitioning.set(false);

          }, 300);


      }, 1200);

  }


  // =========================================================
  // DETERMINAR IDENTIDAD SEGÚN RUTA
  // =========================================================

  private updateModuleIdentity(
    url: string
  ): void {


    // =======================================================
    // CONTALAB
    // =======================================================

    if (
      url.startsWith('/admin/contalab') ||
      url.startsWith('/contalab')
    ) {

      this.setModuleIdentity({

        name: 'Contalab',

        subtitle: 'Administración contable',

        logo:
          '/Contalab Rounded/Contalab Light Rounded.png',

        logoAlt: 'Contalab',

        description:
          'CONTALAB'

      });

      return;

    }


    // =======================================================
    // PASOS
    // =======================================================

    if (
      url.startsWith('/admin/pasos') ||
      url.startsWith('/pasos')
    ) {

      this.setModuleIdentity({

        name: 'PASOS',

        subtitle: 'Administración',

        logo:
          'Marca Pasos Ico.svg',

        logoAlt: 'PASOS',

        description:
          'PASOS'

      });

      return;

    }


    // =======================================================
    // PANEL MAESTRO
    // =======================================================

    if (
      url.startsWith('/admin/panel') ||
      url.startsWith('/admin')
    ) {

      this.setModuleIdentity({

        name: 'Panel Maestro',

        subtitle: 'Administración',

        logo:
          'Marca Pasos Ico.svg',

        logoAlt: 'Panel Maestro',

        description:
          'PANEL MAESTRO'

      });

      return;

    }


    // =======================================================
    // IDENTIDAD POR DEFECTO
    // =======================================================

    this.setModuleIdentity({

      name: 'PASOS',

      subtitle: 'Administración',

      logo:
        'Marca Pasos Ico.svg',

      logoAlt: 'PASOS',

      description:
        'PASOS'

    });

  }


  // =========================================================
  // APLICAR IDENTIDAD
  // =========================================================

  private setModuleIdentity(
    identity: ModuleIdentity
  ): void {

    this.moduleName.set(
      identity.name
    );

    this.moduleSubtitle.set(
      identity.subtitle
    );

    this.moduleLogo.set(
      identity.logo
    );

    this.moduleLogoAlt.set(
      identity.logoAlt
    );

    this.moduleDescription.set(
      identity.description
    );

  }

}