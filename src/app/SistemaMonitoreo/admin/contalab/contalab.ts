import { CommonModule } from '@angular/common';

import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import { CatalogoCuentasService } from '../../../services/catalogo_cuentas.service';
import { AsientosContablesService } from '../../../services/asientos_contables.service';
import { ClientesService } from '../../../services/clientes.service';
import { FacturasService } from '../../../services/facturas.service';
import { CobrosService } from '../../../services/cobros.service';


interface QuickAction {

  label: string;

  description: string;

  icon: string;

  route: string;

}


interface ActivityItem {

  action: string;

  description: string;

  date: string;

  icon: string;

}


@Component({

  selector: 'app-contalab',

  imports: [
    CommonModule,
    RouterLink
  ],

  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],

  templateUrl: './contalab.html'

})


export class Contalab implements OnInit {

  private readonly catalogoCuentasService =
    inject(CatalogoCuentasService);

  private readonly asientosContablesService =
    inject(AsientosContablesService);

  private readonly clientesService = 
    inject(ClientesService);

  private readonly facturasService = 
    inject(FacturasService);

  private readonly cobrosService = 
   inject(CobrosService);


  // =========================================================
  // INICIALIZACIÓN
  // =========================================================

  ngOnInit(): void {

    this.loadAccountingStats();

  }


  // =========================================================
  // CARGAR ESTADÍSTICAS CONTABLES
  // =========================================================

  private loadAccountingStats(): void {

    this.catalogoCuentasService
      .getCatalogoCuentas()
      .subscribe({

        next: (cuentas) => {

          this.accountingStats.update(stats => ({

            ...stats,

            accounts: cuentas.length

          }));

        },

        error: (error) => {

          console.error(
            'Error obteniendo las cuentas contables:',
            error
          );

        }

      });

    this.asientosContablesService
      .getAsientosContables()
      .subscribe({

        next: (asientos) => {

          this.accountingStats.update(stats => ({

            ...stats,

            journalEntries: asientos.length

          }));

        },

        error: (error) => {

          console.error(
            'Error obteniendo las cuentas contables:',
            error
          );

        }

      });

    

    this.clientesService
      .getClientes()
      .subscribe({

        next: (clientes) => {

          this.accountingStats.update(stats => ({

            ...stats,

            customers: clientes.length

          }));

        },

        error: (error) => {

          console.error(
            'Error obteniendo los clientes:',
            error
          );

        }

      });

    this.facturasService
      .getFacturas()
      .subscribe({

        next: (facturas) => {

          this.operationStats.update(stats => ({

            ...stats,

            invoices: facturas.length

          }));

        },

        error: (error) => {

          console.error(
            'Error obteniendo las facturas:',
            error
          );

        }

      });

    this.cobrosService
      .getCobros()
      .subscribe({

        next: (cobros) => {

          this.operationStats.update(stats => ({

            ...stats,

            collections: cobros.length

          }));

        },

        error: (error) => {

          console.error(
            'Error obteniendo los cobros:',
            error
          );

        }

      });

  }


  // =========================================================
  // INFORMACIÓN DEL MÓDULO
  // =========================================================

  moduleName = 'Contalab';

  moduleDescription =
    'Administración contable y financiera de Grupo Chang Xing S.A.';

  moduleVersion = '1.0.0';

  moduleEnvironment = 'Producción';

  moduleStatus = 'Operativo';


  // =========================================================
  // RESUMEN CONTABLE
  // =========================================================

  readonly accountingStats = signal({
    accounts: 0,
    journalEntries: 0,
    customers: 0,
    suppliers: 0,
    invoices: 0,
    collections: 0,
    purchases: 0,
    payments: 0
  });


  // =========================================================
  // DOCUMENTOS Y OPERACIONES
  // =========================================================

  readonly operationStats = signal({
    invoices: 0,
    collections: 0,
    purchases: 0,
    supplierPayments: 0
  });


  // =========================================================
  // ACCIONES RÁPIDAS
  // =========================================================

  quickActions: QuickAction[] = [

    {

      label: 'Catálogo de cuentas',

      description:
        'Administrar las cuentas que conforman la estructura contable.',

      icon: 'lucide:book-open',

      route: '/admin/contalab/contabilidad/catalogo-cuentas'

    },

    {

      label: 'Asientos contables',

      description:
        'Consultar y administrar los movimientos registrados en contabilidad.',

      icon: 'lucide:receipt-text',

      route: '/admin/contalab/contabilidad/asientos-contables'

    },

    {

      label: 'Facturas',

      description:
        'Gestionar las facturas y documentos de venta registrados.',

      icon: 'lucide:file-text',

      route: '/admin/contalab/ventas/facturas'

    },

    {

      label: 'Clientes',

      description:
        'Administrar clientes y su información relacionada.',

      icon: 'lucide:users-round',

      route: '/admin/contalab/ventas/clientes'

    },

    {

      label: 'Proveedores',

      description:
        'Administrar proveedores y operaciones relacionadas.',

      icon: 'lucide:truck',

      route: '/admin/contalab/compras/proveedores'

    },

    {

      label: 'Usuarios',

      description:
        'Gestionar usuarios con acceso al módulo Contalab.',

      icon: 'lucide:users',

      route: '/admin/contalab/usuarios'

    }

  ];


  // =========================================================
  // ACTIVIDAD RECIENTE
  // =========================================================

  recentActivity: ActivityItem[] = [

    {

      action: 'Sistema iniciado',

      description:
        'El módulo Contalab se encuentra disponible.',

      date: 'Hoy',

      icon: 'lucide:power'

    },

    {

      action: 'Catálogo contable',

      description:
        'El catálogo de cuentas está disponible.',

      date: 'Hoy',

      icon: 'lucide:book-open'

    },

    {

      action: 'Contabilidad',

      description:
        'El servicio contable se encuentra operativo.',

      date: 'Hoy',

      icon: 'lucide:calculator'

    }

  ];


  // =========================================================
  // SERVICIOS
  // =========================================================

  services = [

    {

      name: 'API',

      description:
        'Servicio backend de Contalab',

      status: 'Operativo',

      icon: 'lucide:server'

    },

    {

      name: 'PostgreSQL',

      description:
        'Datos contables y relacionales',

      status: 'Operativo',

      icon: 'lucide:database'

    },

    {

      name: 'MongoDB',

      description:
        'Auditoría e historial de actividad',

      status: 'Operativo',

      icon: 'lucide:database-zap'

    },

    {

      name: 'Autenticación',

      description:
        'Control de acceso al módulo',

      status: 'Operativo',

      icon: 'lucide:shield-check'

    }

  ];


  // =========================================================
  // ESTADO DEL SISTEMA
  // =========================================================

  get systemOperational(): boolean {

    return this.services.every(
      service => service.status === 'Operativo'
    );

  }

}