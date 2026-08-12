# Sistema Integral de Gestión Empresarial

Sistema web integral que combina el **sistema comercial de la marca Pasos** con funcionalidades de **monitoreo, contabilidad y administración**, centralizando la gestión operativa y el análisis de información en una sola plataforma.

El proyecto busca evolucionar el sistema comercial existente de Pasos mediante la incorporación de herramientas administrativas y de seguimiento que permitan obtener una visión más completa del funcionamiento del negocio.

## Descripción

La plataforma integra diferentes áreas dentro de un mismo sistema. El **sistema comercial** constituye el núcleo principal y está orientado a la gestión de las operaciones comerciales de Pasos. Sobre este se incorporan funcionalidades de **monitoreo** como complemento para supervisar el estado y comportamiento de los procesos, además de **funciones contables** destinadas a la gestión de información financiera.

Estas funcionalidades se agrupan dentro de un apartado de **administración**, donde también se concentran las herramientas relacionadas con la gestión del sistema, usuarios, permisos y configuración.

De esta manera, el proyecto funciona como una **fusión entre el sistema comercial y un conjunto de herramientas administrativas, contables y de monitoreo**, evitando mantener estas funcionalidades como sistemas independientes.

## Arquitectura

La aplicación utiliza una arquitectura separada entre frontend y backend. El frontend está desarrollado con **Angular**, mientras que el backend utiliza **NestJS** para proporcionar la API, gestionar la lógica de negocio, aplicar validaciones y establecer la comunicación con las bases de datos.

La comunicación entre ambas capas se realiza mediante una **API REST**.

```text
┌─────────────────────────────────────────────┐
│                  FRONTEND                   │
│                  Angular                    │
│                                             │
│   Comercial │ Administración │ Monitoreo   │
│                         │ Contabilidad      │
└──────────────────────┬──────────────────────┘
                       │
                    API REST
                       │
┌──────────────────────▼──────────────────────┐
│                   BACKEND                   │
│                  NestJS                     │
│                                             │
│   API │ Servicios │ Lógica de negocio      │
│   Autenticación │ Validaciones │ Seguridad  │
└──────────────────────┬──────────────────────┘
                       │
              ┌────────┴────────┐
              │                 │
       ┌──────▼──────┐   ┌──────▼──────┐
       │ PostgreSQL  │   │   MariaDB   │
       │ Relacional  │   │ Relacional  │
       └─────────────┘   └─────────────┘
```

## Tecnologías

| Área          | Tecnologías                                   |
| ------------- | --------------------------------------------- |
| Frontend      | Angular, TypeScript, HTML5, CSS, Tailwind CSS |
| Backend       | NestJS, Node.js, TypeScript                   |
| Comunicación  | API REST                                      |
| Base de datos | PostgreSQL, MariaDB                           |
| Arquitectura  | Frontend + Backend                            |

### Bases de datos

El sistema utiliza bases de datos según las necesidades de cada componente de la aplicación. Actualmente se contemplan **PostgreSQL** y **MariaDB** como sistemas de gestión de bases de datos relacionales.

La arquitectura también permite incorporar bases de datos **no relacionales** cuando una funcionalidad requiera un modelo de datos más flexible, por ejemplo para determinados registros, eventos, información de monitoreo o datos que no se adapten naturalmente a una estructura relacional.

| Base de datos | Tipo          | Uso                                     |
| ------------- | ------------- | --------------------------------------- |
| PostgreSQL    | Relacional    | Información estructurada del sistema    |
| MariaDB       | Relacional    | Información estructurada del sistema    |
| NoSQL         | No relacional | Disponible para necesidades específicas |

## Módulos

| Módulo                | Descripción                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Sistema Comercial** | Núcleo principal encargado de gestionar las operaciones comerciales de Pasos.                                 |
| **Monitoreo**         | Complemento destinado al seguimiento del estado y comportamiento de procesos mediante indicadores y métricas. |
| **Contabilidad**      | Gestión de información financiera y registros relacionados con las operaciones contables.                     |
| **Administración**    | Área destinada al control y configuración del sistema, incluyendo las funciones de monitoreo y contabilidad.  |

### Sistema Comercial

El sistema comercial representa el núcleo funcional del proyecto y está orientado a las operaciones principales de la marca Pasos. Su finalidad es centralizar la información relacionada con las actividades comerciales y permitir su gestión desde una única plataforma.

Entre las operaciones contempladas se encuentran la gestión de productos, clientes, proveedores, ventas, compras e inventario.

### Monitoreo

El sistema de monitoreo funciona como un complemento del sistema comercial. Su propósito es proporcionar información sobre el estado y comportamiento de diferentes procesos, facilitando el seguimiento de la actividad del sistema y la identificación de situaciones relevantes.

Puede incluir indicadores, métricas, estados, seguimiento de procesos, alertas e información resumida para facilitar la supervisión.

### Contabilidad

El módulo contable incorpora funcionalidades relacionadas con la gestión financiera de las operaciones realizadas dentro del sistema.

Su objetivo es complementar la información generada por el área comercial y proporcionar una perspectiva contable de las actividades realizadas. Entre sus funciones pueden encontrarse la gestión de ingresos, gastos, movimientos financieros, cuentas, registros contables y reportes.

### Administración

El apartado de administración concentra las funciones destinadas al control y gestión general de la plataforma. Dentro de esta área se encuentran principalmente los módulos de **monitoreo y contabilidad**, además de las funciones relacionadas con usuarios, permisos, configuración e información general del sistema.

Esta separación permite mantener diferenciadas las operaciones comerciales de las funciones administrativas, manteniendo al mismo tiempo la integración entre todas las áreas.

## Objetivo

El objetivo principal del proyecto es construir una plataforma capaz de **centralizar la gestión comercial, administrativa, contable y operativa de Pasos**.

En lugar de mantener diferentes herramientas para cada necesidad, el sistema busca proporcionar un entorno unificado en el que la información generada por las operaciones comerciales pueda ser utilizada posteriormente para tareas administrativas, contables, de monitoreo y análisis.

La integración de estas áreas permite que la información pueda mantenerse conectada a lo largo de los diferentes procesos del negocio, proporcionando una visión más completa de su funcionamiento.

## Estructura general

El proyecto se organiza separando las responsabilidades principales de la aplicación:

```text
/
├── frontend/
│   └── angular/
│
├── backend/
│   └── nestjs/
│
├── database/
│   ├── postgresql/
│   └── mariadb/
│
└── README.md
```

Esta estructura puede evolucionar conforme se incorporen nuevos módulos, servicios y tecnologías al sistema.

## Estado del proyecto

**En desarrollo.**

El proyecto se encuentra en evolución y sus módulos, funcionalidades y tecnologías pueden ampliarse conforme avance su implementación.

## Licencia

Este proyecto es de uso privado y pertenece al ecosistema de **Pasos**.