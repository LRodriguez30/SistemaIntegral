# Sistema Integral de Gestión Empresarial — Frontend

Frontend del **Sistema Integral de Gestión Empresarial** desarrollado para **Grupo Chang Xing S.A.**, que integra el sistema comercial de la marca **Pasos** con funcionalidades de administración, monitoreo y contabilidad.

La aplicación proporciona la interfaz mediante la cual los usuarios interactúan con los diferentes módulos del sistema, gestionan información y consultan los procesos disponibles de acuerdo con sus permisos.

## Descripción

La plataforma integra diferentes áreas dentro de un mismo sistema. El **sistema comercial** constituye el núcleo principal y está orientado a la gestión de las operaciones comerciales de Pasos.

Sobre este núcleo se incorporan funcionalidades administrativas, de monitoreo y contabilidad, permitiendo centralizar diferentes procesos dentro de una única plataforma.

El frontend es responsable de proporcionar la interfaz de usuario, la navegación entre módulos, la interacción con los servicios del backend y la representación de la información obtenida desde las APIs.

Entre las funcionalidades contempladas se encuentran:

* Gestión del sistema comercial.
* Administración de usuarios, personas y roles.
* Control de acceso mediante autenticación y permisos.
* Monitoreo de procesos.
* Gestión de información contable.
* Gestión de pedidos.
* Consulta y filtrado de información.
* Importación y exportación de datos.
* Visualización de información mediante tablas, indicadores y gráficos.
* Seguimiento de procesos en tiempo real.

---

## Arquitectura

El frontend está desarrollado como una **Single Page Application (SPA)** utilizando Angular.

La aplicación se comunica con el backend mediante una **API REST**, siendo responsable de presentar la información y gestionar la interacción con el usuario, mientras que el backend se encarga de la lógica de negocio, validaciones, seguridad y acceso a las bases de datos.

```text
┌─────────────────────────────────────────────┐
│                  FRONTEND                   │
│                  Angular                    │
│                                             │
│  Comercial │ Administración │ Monitoreo    │
│                       │ Contabilidad        │
│                       │ Pedidos             │
└──────────────────────┬──────────────────────┘
                       │
                    API REST
                       │
┌──────────────────────▼──────────────────────┐
│                  BACKEND                    │
│                  NestJS                     │
│                                             │
│  API │ Servicios │ Lógica de negocio       │
│  Autenticación │ Validaciones │ Seguridad  │
└──────────────────────┬──────────────────────┘
                       │
              ┌────────┴────────┐
              │                 │
       ┌──────▼──────┐   ┌──────▼──────┐
       │ PostgreSQL  │   │   MariaDB   │
       │ Relacional  │   │ Relacional  │
       └─────────────┘   └─────────────┘
```

---

## Tecnologías

| Área                 | Tecnologías                   |
| -------------------- | ----------------------------- |
| Framework            | Angular                       |
| Lenguaje             | TypeScript                    |
| Estructura           | HTML5                         |
| Estilos              | CSS, Tailwind CSS             |
| Comunicación         | API REST                      |
| Arquitectura         | Single Page Application (SPA) |
| Gestión del proyecto | npm                           |
| Control de versiones | Git                           |

---

## Requisitos previos

Antes de instalar el proyecto es necesario disponer de las siguientes herramientas:

* **Node.js**
* **npm**
* **Git**

Se recomienda utilizar una versión de Node.js compatible con la versión de Angular utilizada por el proyecto.

Para comprobar que Node.js y npm se encuentran instalados:

```bash
node --version
npm --version
```

Para comprobar la instalación de Git:

```bash
git --version
```

También puede utilizarse **Angular CLI** para ejecutar y desarrollar la aplicación.

Para comprobar si se encuentra instalado:

```bash
ng version
```

Si Angular CLI no está instalado globalmente, puede instalarse mediante:

```bash
npm install -g @angular/cli
```

---

# Instalación

## 1. Clonar el repositorio

Clonar el repositorio utilizando Git:

```bash
git clone <URL_DEL_REPOSITORIO>
```

Ingresar al directorio del proyecto:

```bash
cd <NOMBRE_DEL_PROYECTO>
```

## 2. Instalar las dependencias

Una vez dentro del proyecto, ejecutar:

```bash
npm install
```

Este comando instalará las dependencias definidas en `package.json`.

---

# Configuración

Antes de ejecutar la aplicación es necesario configurar la dirección del backend al que se conectará el frontend.

La URL utilizada por la aplicación deberá definirse de acuerdo con la configuración del entorno correspondiente.

Por ejemplo:

```text
http://localhost:3000
```

La configuración puede encontrarse en los archivos de entorno o configuración utilizados por Angular, dependiendo de la estructura actual del proyecto.

Para un entorno de desarrollo puede utilizarse una configuración similar a:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

> La ubicación y nombre exacto de esta configuración dependerán de la estructura utilizada por el proyecto.

Si el backend utiliza variables, servicios o configuraciones adicionales, estos deberán encontrarse disponibles antes de ejecutar el frontend.

---

# Ejecución en entorno de desarrollo

Para iniciar la aplicación en modo de desarrollo:

```bash
ng serve
```

También puede utilizarse:

```bash
npm start
```

si el proyecto tiene configurado el script correspondiente dentro de `package.json`.

Por defecto, Angular ejecutará la aplicación en:

```text
http://localhost:4200
```

Una vez iniciado el servidor de desarrollo, la aplicación podrá abrirse desde un navegador web.

---

# Ejecución con una dirección específica

Si se requiere que la aplicación sea accesible desde otros dispositivos dentro de la misma red, puede utilizarse:

```bash
ng serve --host 0.0.0.0
```

También es posible especificar un puerto:

```bash
ng serve --host 0.0.0.0 --port 4200
```

---

# Compilación para producción

Para generar una versión optimizada de la aplicación:

```bash
ng build
```

Los archivos generados serán almacenados en el directorio de salida configurado por Angular, normalmente dentro de:

```text
dist/
```

La aplicación compilada puede posteriormente ser desplegada en un servidor web o plataforma compatible con aplicaciones frontend estáticas.

---

# Estructura general del proyecto

La estructura puede variar conforme avance el desarrollo, pero actualmente se organiza conceptualmente de la siguiente manera:

```text
/
├── src/
│   ├── app/
│   │   ├── components/
│   │   ├── services/
│   │   ├── guards/
│   │   ├── models/
│   │   ├── layouts/
│   │   └── ...
│   │
│   ├── assets/
│   ├── environments/
│   ├── index.html
│   └── styles.css
│
├── public/
├── angular.json
├── package.json
├── tsconfig.json
├── README.md
└── ...
```

La estructura exacta puede evolucionar conforme se incorporen nuevos módulos y funcionalidades.

---

# Módulos

| Módulo                | Descripción                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| **Sistema Comercial** | Núcleo principal encargado de gestionar las operaciones comerciales de Pasos.                   |
| **Monitoreo**         | Seguimiento del estado y comportamiento de diferentes procesos mediante indicadores y métricas. |
| **Contabilidad**      | Gestión de información financiera y registros relacionados con las operaciones contables.       |
| **Administración**    | Gestión general de la plataforma, usuarios, roles, permisos y configuración.                    |
| **Pedidos**           | Gestión y seguimiento de los pedidos correspondientes al sistema comercial.                     |

---

## Sistema Comercial

El sistema comercial representa el núcleo funcional del proyecto y está orientado a las operaciones principales de la marca Pasos.

Entre las operaciones contempladas se encuentran:

* Gestión de productos.
* Gestión de clientes.
* Gestión de proveedores.
* Gestión de ventas.
* Gestión de compras.
* Gestión de inventario.
* Gestión de pedidos.

---

## Monitoreo

El módulo de monitoreo funciona como complemento del sistema comercial.

Su propósito es proporcionar información sobre el estado y comportamiento de diferentes procesos, facilitando el seguimiento de la actividad del sistema.

Puede incorporar:

* Indicadores.
* Métricas.
* Estados de procesos.
* Seguimiento de actividades.
* Alertas.
* Información resumida.
* Gráficos y visualizaciones.

---

## Contabilidad

El módulo de contabilidad incorpora funcionalidades relacionadas con la gestión financiera de las operaciones realizadas dentro del sistema.

Entre las funcionalidades contempladas se encuentran:

* Gestión de ingresos.
* Gestión de gastos.
* Movimientos financieros.
* Cuentas.
* Registros contables.
* Reportes.

---

## Administración

El apartado de administración concentra las funciones destinadas al control y gestión general de la plataforma.

Dentro de esta área se encuentran las funcionalidades relacionadas con:

* Usuarios.
* Personas.
* Roles.
* Permisos.
* Autenticación.
* Configuración.
* Monitoreo.
* Contabilidad.

Esta separación permite diferenciar las operaciones comerciales de las funciones administrativas, manteniendo al mismo tiempo la integración entre las diferentes áreas.

---

# Autenticación y autorización

El frontend incorpora el módulo de autenticación encargado de gestionar el acceso de los usuarios al sistema.

El proceso general consiste en:

```text
Usuario
   │
   │ Correo + contraseña
   ▼
Frontend Angular
   │
   │ API REST
   ▼
Backend NestJS
   │
   │ Validación
   ▼
Base de datos
   │
   ▼
Tokens de autenticación
   │
   ▼
Frontend
```

El acceso a las diferentes secciones de la aplicación se encuentra condicionado por la autenticación y los permisos correspondientes al usuario.

Las rutas protegidas utilizan mecanismos de autorización para evitar que usuarios sin los permisos necesarios puedan acceder directamente a determinados módulos.

---

# Comunicación con el backend

El frontend se comunica con el backend mediante solicitudes HTTP utilizando la API REST proporcionada por NestJS.

Las operaciones principales incluyen:

```text
GET     → Consulta de información
POST    → Creación de información
PUT     → Actualización de información
PATCH   → Actualización parcial
DELETE  → Eliminación de información
```

La aplicación utiliza servicios de Angular para centralizar la comunicación con los diferentes endpoints del backend.

---

# Desarrollo

Durante el desarrollo se recomienda trabajar sobre una rama independiente antes de integrar cambios importantes al código principal.

El flujo general puede representarse como:

```text
Desarrollo
    │
    ▼
Implementación
    │
    ▼
Pruebas
    │
    ▼
Correcciones
    │
    ▼
Integración
    │
    ▼
Nueva versión
```

Las versiones estables del proyecto serán identificadas mediante **versionado semántico**.

El formato utilizado será:

```text
vMAJOR.MINOR.PATCH
```

Ejemplo:

```text
v1.0.0
```

Los cambios menores y nuevas funcionalidades podrán incrementar el número `MINOR`, mientras que las correcciones pequeñas podrán incrementar `PATCH`. Los cambios mayores que introduzcan modificaciones incompatibles podrán incrementar `MAJOR`.

Las versiones publicadas serán identificadas mediante **tags de Git**.

Ejemplo:

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

# Estado del proyecto

**En desarrollo.**

El proyecto se encuentra en evolución y sus módulos, funcionalidades, estructura y tecnologías pueden ampliarse conforme avance su implementación.

Las funcionalidades descritas en este documento representan el estado y alcance actual del proyecto y podrán modificarse durante su desarrollo.
