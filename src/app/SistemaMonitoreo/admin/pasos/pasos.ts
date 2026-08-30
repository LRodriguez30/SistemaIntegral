import { CommonModule } from '@angular/common';

import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';


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
  selector: 'app-pasos',

  imports: [
    CommonModule,
    RouterLink
  ],

  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],

  templateUrl: './pasos.html'
})
export class Pasos {


  // =========================================================
  // INFORMACIÓN DEL MÓDULO
  // =========================================================

  moduleName = 'PASOS';

  moduleDescription =
    'Administración y supervisión general del sistema comercial PASOS.';

  moduleVersion = '1.0.0';

  moduleEnvironment = 'Producción';

  moduleStatus = 'Operativo';


  // =========================================================
  // RESUMEN
  // =========================================================

  moduleStats = {

    users: 0,

    administrators: 0,

    activeSessions: 0,

    eventsToday: 0

  };


  // =========================================================
  // SERVICIOS
  // =========================================================

  services = [

    {
      name: 'API',

      description: 'Servicio backend',

      status: 'Operativo',

      icon: 'lucide:server'
    },

    {
      name: 'PostgreSQL',

      description: 'Base de datos principal',

      status: 'Operativo',

      icon: 'lucide:database'
    },

    {
      name: 'MongoDB',

      description: 'Registro de actividad',

      status: 'Operativo',

      icon: 'lucide:database-zap'
    },

    {
      name: 'Autenticación',

      description: 'Control de acceso',

      status: 'Operativo',

      icon: 'lucide:shield-check'
    }

  ];


  // =========================================================
  // ACCIONES RÁPIDAS
  // =========================================================

  quickActions: QuickAction[] = [

    {
      label: 'Usuarios',

      description:
        'Administrar las cuentas y accesos de los usuarios de PASOS.',

      icon: 'lucide:users',

      route: '/admin/pasos/usuarios'
    },

    {
      label: 'Configuración',

      description:
        'Configurar los parámetros generales del módulo PASOS.',

      icon: 'lucide:settings',

      route: '/admin/pasos/configuracion'
    },

    {
      label: 'Actividad',

      description:
        'Consultar los eventos y acciones registradas en el sistema.',

      icon: 'lucide:activity',

      route: '/admin/pasos/actividad'
    }

  ];


  // =========================================================
  // ACTIVIDAD RECIENTE
  // =========================================================

  recentActivity: ActivityItem[] = [

    {
      action: 'Sistema iniciado',

      description:
        'El módulo PASOS se encuentra disponible.',

      date: 'Hoy',

      icon: 'lucide:power'
    },

    {
      action: 'Base de datos',

      description:
        'Conexión con PostgreSQL establecida.',

      date: 'Hoy',

      icon: 'lucide:database'
    },

    {
      action: 'Registro de actividad',

      description:
        'Servicio MongoDB disponible para auditoría.',

      date: 'Hoy',

      icon: 'lucide:database-zap'
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