import {
    ChangeDetectionStrategy,
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    computed,
    inject,
    OnInit,
    signal
} from '@angular/core';

import {
    forkJoin
} from 'rxjs';

import {
    NominaService,
    NominaResponse
} from '../../../../../services/nomina.service';

import { MatSelectChange, MatSelectModule } from '@angular/material/select';

import {
    DetalleNominaService,
    DetalleNominaResponse,
    CreateDetalleNomina
} from '../../../../../services/detalle_nomina.service';

import {
    EmpleadosService,
    EmpleadosResponse
} from '../../../../../services/empleados.service';

import {
    PersonasService,
    PersonasResponse
} from '../../../../../services/personas.service';

import {
    AsientosContablesService,
    AsientosContablesResponse
} from '../../../../../services/asientos_contables.service';


/* =============================================================
   TIPOS
   ============================================================= */

type PestanaNomina =
    | 'planilla'
    | 'periodos'
    | 'empleados'
    | 'asientos';


interface CalculoNomina {

    salario_quincenal: number;

    ingreso_horas_extras: number;

    total_ingresos: number;

    inss_laboral: number;

    ir: number;

    total_deducciones: number;

    salario_neto: number;

    inatec: number;

    inss_patronal: number;

    vacaciones: number;

    treceavo_mes: number;

    indemnizacion: number;

}


interface FilaPlanilla {

    empleado_id: number;

    salario_base: number;

    horas_extras: number;

    detalle: DetalleNominaResponse | null;

}


interface FilaCalculada {

    fila: FilaPlanilla;

    calculo: CalculoNomina;

    dirty: boolean;

    valida: boolean;

}


interface NominaForm {

    periodo_inicio: string;

    periodo_fin: string;

    fecha_pago: string;

    estado: string;

}


interface ResumenNomina {

    empleados: number;

    neto: number;

}


/* =============================================================
   COMPONENTE
   ============================================================= */

@Component({

    selector: 'app-nomina',

    standalone: true,

    imports: [MatSelectModule],

    schemas: [
        CUSTOM_ELEMENTS_SCHEMA
    ],

    templateUrl: './nomina.html',

    changeDetection: ChangeDetectionStrategy.OnPush,

    styles: [`

    :host {
      display: block;
      min-height: 100%;
    }

    /* =========================================================
       ENTRADA DE PANTALLA
       ========================================================= */

    .accounting-page-enter {
      animation: accounting-page-enter 360ms ease-out both;
    }

    @keyframes accounting-page-enter {
      from {
        opacity: 0;
        transform: translateY(8px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }


    /* =========================================================
       BACKDROP DE MODALES
       ========================================================= */

    .modal-backdrop-enter {
      animation: modal-backdrop-enter 180ms ease-out both;
    }

    @keyframes modal-backdrop-enter {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }


    /* =========================================================
       PANEL DE MODAL
       ========================================================= */

    .modal-panel-enter {
      animation: modal-panel-enter 220ms cubic-bezier(.22, 1, .36, 1) both;
    }

    @keyframes modal-panel-enter {
      from {
        opacity: 0;
        transform: translateY(14px) scale(.985);
      }

      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }


    /* =========================================================
       FILAS
       ========================================================= */

    .table-row-enter {
      animation: table-row-enter 260ms ease-out both;
    }

    @keyframes table-row-enter {
      from {
        opacity: 0;
        transform: translateY(4px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }


    /* =========================================================
       RESUMEN
       ========================================================= */

    .summary-card-enter {
      animation: summary-card-enter 320ms ease-out both;
    }

    @keyframes summary-card-enter {
      from {
        opacity: 0;
        transform: translateY(6px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }


    /* =========================================================
       SKELETON
       ========================================================= */

    .skeleton {
      position: relative;
      overflow: hidden;
      background: #e9ebee;
    }

    .skeleton::after {
      content: '';
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, .65),
        transparent
      );
      animation: skeleton-shimmer 1.35s infinite;
    }

    @keyframes skeleton-shimmer {
      100% {
        transform: translateX(100%);
      }
    }


    /* =========================================================
       PULSO DE ESTADO
       ========================================================= */

    .status-pulse {
      animation: status-pulse 240ms ease-out;
    }

    @keyframes status-pulse {
      0% {
        transform: scale(.96);
        opacity: .5;
      }

      100% {
        transform: scale(1);
        opacity: 1;
      }
    }


    /* =========================================================
       SCROLLBAR
       ========================================================= */

    .accounting-scroll::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    .accounting-scroll::-webkit-scrollbar-track {
      background: transparent;
    }

    .accounting-scroll::-webkit-scrollbar-thumb {
      background: #d5d8dc;
      border-radius: 999px;
    }

    .accounting-scroll::-webkit-scrollbar-thumb:hover {
      background: #bfc3c8;
    }


    /* =========================================================
       REDUCE MOTION
       ========================================================= */

    @media (prefers-reduced-motion: reduce) {

      .accounting-page-enter,
      .modal-backdrop-enter,
      .modal-panel-enter,
      .table-row-enter,
      .summary-card-enter,
      .status-pulse,
      .skeleton::after {
        animation: none !important;
      }

      * {
        scroll-behavior: auto !important;
      }

    }

  `]

})
export class NominaComponent
    implements OnInit {


    /* =============================================================
       SERVICIOS
       ============================================================= */

    private readonly nominaService =
        inject(NominaService);

    private readonly detalleNominaService =
        inject(DetalleNominaService);

    private readonly empleadosService =
        inject(EmpleadosService);

    private readonly personasService =
        inject(PersonasService);

    private readonly asientosContablesService =
        inject(AsientosContablesService);


    /* =============================================================
       CONSTANTES DE VISTA
       ============================================================= */

    readonly pestanas: {
        id: PestanaNomina;
        label: string;
        icon: string;
    }[] = [

            {
                id: 'planilla',
                label: 'Planilla',
                icon: 'lucide:table-2'
            },

            {
                id: 'periodos',
                label: 'Períodos',
                icon: 'lucide:calendar-range'
            },

            {
                id: 'empleados',
                label: 'Empleados',
                icon: 'lucide:users'
            },

            {
                id: 'asientos',
                label: 'Asientos',
                icon: 'lucide:notebook-tabs'
            }

        ];


    readonly camposCalculados: {
        key: keyof CalculoNomina;
        label: string;
        strong?: boolean;
    }[] = [

            {
                key: 'salario_quincenal',
                label: 'Salario quincenal'
            },

            {
                key: 'ingreso_horas_extras',
                label: 'Ingreso h. extras'
            },

            {
                key: 'total_ingresos',
                label: 'Total ingresos'
            },

            {
                key: 'inss_laboral',
                label: 'INSS laboral'
            },

            {
                key: 'ir',
                label: 'IR'
            },

            {
                key: 'total_deducciones',
                label: 'Total deducciones'
            },

            {
                key: 'salario_neto',
                label: 'Salario neto',
                strong: true
            },

            {
                key: 'inatec',
                label: 'INATEC'
            },

            {
                key: 'inss_patronal',
                label: 'INSS patronal'
            },

            {
                key: 'vacaciones',
                label: 'Vacaciones'
            },

            {
                key: 'treceavo_mes',
                label: 'Treceavo mes'
            },

            {
                key: 'indemnizacion',
                label: 'Indemnización'
            }

        ];


    readonly estadosNomina: string[] = [
        'BORRADOR',
        'GENERADA',
        'CONTABILIZADA',
        'ANULADA'
    ];

    readonly estadosEditables: string[] = [
        'BORRADOR'
    ];


    readonly letras =
        'ABCDEFGHIJKLMNO'.split('');

    readonly columnasSkeleton =
        Array.from(
            { length: 15 },
            (_, index) => index
        );


    /* =============================================================
       ESTADO PRINCIPAL
       ============================================================= */

    readonly activeTab =
        signal<PestanaNomina>('planilla');

    readonly searchTerm =
        signal('');


    /* =============================================================
       CARGA
       ============================================================= */

    readonly loading =
        signal(false);

    readonly saving =
        signal(false);

    readonly loadingNomina =
        computed(() =>
            this.loading() ||
            this.saving()
        );


    /* =============================================================
       ERROR
       ============================================================= */

    readonly errorMessage =
        signal<string | null>(null);


    /* =============================================================
       DATOS
       ============================================================= */

    readonly nominas =
        signal<NominaResponse[]>([]);

    readonly detalles =
        signal<DetalleNominaResponse[]>([]);

    readonly empleados =
        signal<EmpleadosResponse[]>([]);

    readonly personas =
        signal<PersonasResponse[]>([]);

    readonly asientos =
        signal<AsientosContablesResponse[]>([]);


    /* =============================================================
       PLANILLA
       ============================================================= */

    readonly selectedNominaId =
        signal<number | null>(null);

    readonly rows =
        signal<FilaPlanilla[]>([]);


    /* =============================================================
       MODALES
       ============================================================= */

    readonly nominaModalMode =
        signal<'create' | 'edit' | null>(null);

    readonly editingNomina =
        signal<NominaResponse | null>(null);

    readonly deleteNominaTarget =
        signal<NominaResponse | null>(null);

    readonly nominaForm =
        signal<NominaForm>({

            periodo_inicio: '',

            periodo_fin: '',

            fecha_pago: '',

            estado: 'BORRADOR'

        });


    /* =============================================================
       NÓMINAS
       ============================================================= */

    readonly nominasOrdenadas =
        computed(() =>
            [...this.nominas()].sort(
                (a, b) =>
                    b.nomina_id -
                    a.nomina_id
            )
        );


    readonly nominaSeleccionada =
        computed(() =>
            this.nominas().find(
                nomina =>
                    nomina.nomina_id ===
                    this.selectedNominaId()
            ) ?? null
        );


    readonly planillaEditable =
        computed(() => {

            const nomina =
                this.nominaSeleccionada();

            return (
                !!nomina &&
                this.estadosEditables.includes(
                    this.normalizeEstado(
                        nomina.estado
                    )
                )
            );

        });


    readonly estadosDisponibles =
        computed(() => {

            const actual =
                this.normalizeEstado(
                    this.nominaForm().estado
                );

            return actual &&
                !this.estadosNomina.includes(actual)
                ? [...this.estadosNomina, actual]
                : this.estadosNomina;

        });


    readonly resumenPorNomina =
        computed(() => {

            const resumen =
                new Map<number, ResumenNomina>();

            for (const detalle of this.detalles()) {

                const actual =
                    resumen.get(
                        detalle.nomina_id
                    ) ?? {
                        empleados: 0,
                        neto: 0
                    };

                resumen.set(
                    detalle.nomina_id,
                    {
                        empleados:
                            actual.empleados + 1,

                        neto:
                            actual.neto +
                            this.toNumber(
                                detalle.salario_neto
                            )
                    }
                );

            }

            return resumen;

        });


    /* =============================================================
       FILAS CALCULADAS
       ============================================================= */

    readonly filasCalculadas =
        computed<FilaCalculada[]>(() =>
            this.rows().map(
                fila => {

                    const dirty =
                        this.isDirty(fila);

                    const calculo =
                        !dirty && fila.detalle
                            ? this.calculoDesdeDetalle(
                                fila.detalle
                            )
                            : this.calcular(fila);

                    const valida =
                        !!this.getEmpleado(
                            fila.empleado_id
                        ) &&
                        fila.salario_base > 0 &&
                        fila.horas_extras >= 0;

                    return {
                        fila,
                        calculo,
                        dirty,
                        valida
                    };

                }
            )
        );


    readonly filasModificadas =
        computed(() =>
            this.filasCalculadas().filter(
                item =>
                    item.dirty
            )
        );


    readonly hasChanges =
        computed(() =>
            this.filasModificadas().length > 0
        );


    readonly canSave =
        computed(() =>
            !!this.nominaSeleccionada() &&
            this.planillaEditable() &&
            !this.loadingNomina() &&
            this.hasChanges() &&
            this.filasModificadas().every(
                item =>
                    item.valida
            )
        );


    readonly empleadosDisponibles =
        computed(() => {

            const enPlanilla =
                new Set(
                    this.rows().map(
                        fila =>
                            fila.empleado_id
                    )
                );

            return this.empleados().filter(
                empleado =>
                    empleado.estado &&
                    !enPlanilla.has(
                        empleado.empleado_id
                    )
            );

        });


    readonly totales =
        computed(() => {

            const totales =
                this.emptyCalculo();

            for (const item of this.filasCalculadas()) {

                for (const campo of this.camposCalculados) {

                    totales[campo.key] +=
                        item.calculo[campo.key];

                }

            }

            return totales;

        });


    /* =============================================================
       EMPLEADOS (CONSULTA)
       ============================================================= */

    readonly empleadosFiltrados =
        computed(() => {

            const search =
                this.searchTerm()
                    .trim()
                    .toLowerCase();

            return this.empleados().filter(
                empleado => {

                    if (!search) {
                        return true;
                    }

                    return (
                        this.getEmpleadoNombre(
                            empleado.empleado_id
                        )
                            .toLowerCase()
                            .includes(search) ||

                        (empleado.cargo ?? '')
                            .toLowerCase()
                            .includes(search) ||

                        empleado.empleado_id
                            .toString()
                            .includes(search)
                    );

                }
            );

        });


    /* =============================================================
       ASIENTOS (CONSULTA)
       ============================================================= */

    readonly asientosNomina =
        computed(() =>
            this.asientos()
                .filter(
                    asiento =>
                        asiento.tipo_origen === 'NOMINA'
                )
                .sort(
                    (a, b) =>
                        b.asiento_id -
                        a.asiento_id
                )
        );


    /* =============================================================
       FORMULARIO DE PERÍODO
       ============================================================= */

    readonly isNominaFormValid =
        computed(() => {

            const form =
                this.nominaForm();

            if (
                !form.periodo_inicio ||
                !form.periodo_fin ||
                !form.fecha_pago ||
                !form.estado
            ) {
                return false;
            }

            return (
                form.periodo_inicio <=
                form.periodo_fin
            );

        });


    /* =============================================================
       INICIALIZACIÓN
       ============================================================= */

    ngOnInit(): void {

        this.loadData(true);

    }


    /* =============================================================
       CARGAR DATOS
       ============================================================= */

    private loadData(
        rebuild: boolean
    ): void {

        this.loading.set(true);

        this.errorMessage.set(null);

        forkJoin({

            nominas:
                this.nominaService
                    .getNominas(),

            detalles:
                this.detalleNominaService
                    .getDetallesNomina(),

            empleados:
                this.empleadosService
                    .getEmpleados(),

            personas:
                this.personasService
                    .getPersonas(),

            asientos:
                this.asientosContablesService
                    .getAsientosContables()

        }).subscribe({

            next: ({
                nominas,
                detalles,
                empleados,
                personas,
                asientos
            }) => {

                this.nominas.set(nominas);

                this.detalles.set(detalles);

                this.empleados.set(empleados);

                this.personas.set(personas);

                this.asientos.set(asientos);

                const selected =
                    this.selectedNominaId();

                const exists =
                    nominas.some(
                        nomina =>
                            nomina.nomina_id ===
                            selected
                    );

                let mustRebuild =
                    rebuild;

                if (!exists) {

                    const latest =
                        [...nominas].sort(
                            (a, b) =>
                                b.nomina_id -
                                a.nomina_id
                        )[0];

                    this.selectedNominaId.set(
                        latest?.nomina_id ?? null
                    );

                    mustRebuild = true;

                }

                if (mustRebuild) {

                    this.rebuildRows();

                }

                this.loading.set(false);

            },

            error: (error) => {

                console.error(
                    'Error cargando los datos de nómina:',
                    error
                );

                this.errorMessage.set(
                    'No se pudieron cargar los datos de nómina.'
                );

                this.loading.set(false);

            }

        });

    }


    /* =============================================================
       ACTUALIZAR
       ============================================================= */

    refreshData(): void {

        if (this.loadingNomina()) {
            return;
        }

        if (!this.confirmDiscard()) {
            return;
        }

        this.loadData(true);

    }


    /* =============================================================
       PESTAÑAS
       ============================================================= */

    setTab(
        tab: PestanaNomina
    ): void {

        this.activeTab.set(tab);

    }


    /* =============================================================
       DESCARTAR CAMBIOS
       ============================================================= */

    private confirmDiscard(): boolean {

        if (!this.hasChanges()) {
            return true;
        }

        return window.confirm(
            'Hay cambios sin guardar en la planilla. ¿Deseas descartarlos?'
        );

    }


    discardChanges(): void {

        if (
            this.saving() ||
            !this.hasChanges()
        ) {
            return;
        }

        this.rebuildRows();

    }


    /* =============================================================
       SELECCIONAR NÓMINA
       ============================================================= */

    selectNomina(
        select: HTMLSelectElement
    ): void {

        const nominaId =
            select.value
                ? Number(select.value)
                : null;

        if (
            nominaId ===
            this.selectedNominaId()
        ) {
            return;
        }

        if (!this.confirmDiscard()) {

            select.value =
                String(
                    this.selectedNominaId() ?? ''
                );

            return;

        }

        this.selectedNominaId.set(
            nominaId
        );

        this.rebuildRows();

    }


    abrirPlanilla(
        nomina: NominaResponse
    ): void {

        if (
            nomina.nomina_id !==
            this.selectedNominaId()
        ) {

            if (!this.confirmDiscard()) {
                return;
            }

            this.selectedNominaId.set(
                nomina.nomina_id
            );

            this.rebuildRows();

        }

        this.activeTab.set('planilla');

    }


    /* =============================================================
       CONSTRUIR FILAS
       ============================================================= */

    private rebuildRows(): void {

        const nominaId =
            this.selectedNominaId();

        if (nominaId === null) {

            this.rows.set([]);

            return;

        }

        this.rows.set(
            this.detalles()
                .filter(
                    detalle =>
                        detalle.nomina_id ===
                        nominaId
                )
                .sort(
                    (a, b) =>
                        a.empleado_id -
                        b.empleado_id
                )
                .map(
                    detalle => ({

                        empleado_id:
                            detalle.empleado_id,

                        salario_base:
                            this.toNumber(
                                detalle.salario_base
                            ),

                        horas_extras:
                            this.toNumber(
                                detalle.horas_extras
                            ),

                        detalle

                    })
                )
        );

    }


    /* =============================================================
       AGREGAR EMPLEADOS
       ============================================================= */

    addEmpleado(
        select: HTMLSelectElement
    ): void {

        const empleadoId =
            Number(select.value);

        select.value = '';

        const empleado =
            this.empleadosDisponibles().find(
                item =>
                    item.empleado_id ===
                    empleadoId
            );

        if (empleado) {

            this.addEmpleadoToPlanilla(
                empleado
            );

        }

    }


    addEmpleadoToPlanilla(
        empleado: EmpleadosResponse
    ): void {

        if (
            !this.planillaEditable() ||
            this.saving() ||
            !empleado.estado
        ) {
            return;
        }

        if (
            this.isInPlanilla(
                empleado.empleado_id
            )
        ) {
            return;
        }

        this.rows.update(
            rows => [

                ...rows,

                {

                    empleado_id:
                        empleado.empleado_id,

                    salario_base:
                        this.toNumber(
                            empleado.salario_base
                        ),

                    horas_extras: 0,

                    detalle: null

                }

            ]
        );

    }


    addAllActiveEmpleados(): void {

        if (
            !this.planillaEditable() ||
            this.saving()
        ) {
            return;
        }

        const nuevos =
            this.empleadosDisponibles();

        if (!nuevos.length) {
            return;
        }

        this.rows.update(
            rows => [

                ...rows,

                ...nuevos.map(
                    empleado => ({

                        empleado_id:
                            empleado.empleado_id,

                        salario_base:
                            this.toNumber(
                                empleado.salario_base
                            ),

                        horas_extras: 0,

                        detalle: null

                    })
                )

            ]
        );

    }


    isInPlanilla(
        empleadoId: number
    ): boolean {

        return this.rows().some(
            fila =>
                fila.empleado_id ===
                empleadoId
        );

    }


    removeRow(
        empleadoId: number
    ): void {

        if (this.saving()) {
            return;
        }

        this.rows.update(
            rows =>
                rows.filter(
                    fila =>
                        fila.empleado_id !==
                        empleadoId ||
                        fila.detalle !== null
                )
        );

    }


    /* =============================================================
       EDITAR CELDAS
       ============================================================= */

    updateBase(
        empleadoId: number,
        value: string
    ): void {

        if (
            !this.planillaEditable() ||
            this.saving()
        ) {
            return;
        }

        const salarioBase =
            this.parseAmount(value);

        this.rows.update(
            rows =>
                rows.map(
                    fila =>
                        fila.empleado_id ===
                            empleadoId
                            ? {
                                ...fila,
                                salario_base:
                                    salarioBase
                            }
                            : fila
                )
        );

    }


    updateHorasExtras(
        empleadoId: number,
        value: string
    ): void {

        if (
            !this.planillaEditable() ||
            this.saving()
        ) {
            return;
        }

        const horasExtras =
            this.parseAmount(value);

        this.rows.update(
            rows =>
                rows.map(
                    fila =>
                        fila.empleado_id ===
                            empleadoId
                            ? {
                                ...fila,
                                horas_extras:
                                    horasExtras
                            }
                            : fila
                )
        );

    }


    /* =============================================================
       GUARDAR PLANILLA
       ============================================================= */

    savePlanilla(): void {

        const nomina =
            this.nominaSeleccionada();

        if (
            !nomina ||
            !this.canSave()
        ) {
            return;
        }

        const dto:
            CreateDetalleNomina[] =
            this.filasModificadas().map(
                item => ({

                    nomina_id:
                        nomina.nomina_id,

                    empleado_id:
                        item.fila.empleado_id,

                    salario_base:
                        this.roundAmount(
                            item.fila.salario_base
                        ),

                    horas_extras:
                        this.roundAmount(
                            item.fila.horas_extras
                        )

                })
            );

        this.saving.set(true);

        this.errorMessage.set(null);

        this.detalleNominaService
            .createDetallesNomina(dto)
            .subscribe({

                next: () => {

                    this.saving.set(false);

                    this.loadData(true);

                },

                error: (error) => {

                    console.error(
                        'Error guardando la planilla de nómina:',
                        error
                    );

                    this.errorMessage.set(
                        'No se pudo guardar la planilla de nómina.'
                    );

                    this.saving.set(false);

                }

            });

    }


    /* =============================================================
       PERÍODOS — CREAR / EDITAR
       ============================================================= */

    openCreateNomina(): void {

        if (this.loadingNomina()) {
            return;
        }

        const periodo =
            this.getDefaultPeriod();

        this.editingNomina.set(null);

        this.nominaForm.set({

            periodo_inicio:
                periodo.inicio,

            periodo_fin:
                periodo.fin,

            fecha_pago:
                periodo.fin,

            estado: 'BORRADOR'

        });

        this.nominaModalMode.set('create');

    }


    openEditNomina(
        nomina: NominaResponse
    ): void {

        if (this.loadingNomina()) {
            return;
        }

        this.editingNomina.set(nomina);

        this.nominaForm.set({

            periodo_inicio:
                this.normalizeDate(
                    nomina.periodo_inicio
                ),

            periodo_fin:
                this.normalizeDate(
                    nomina.periodo_fin
                ),

            fecha_pago:
                this.normalizeDate(
                    nomina.fecha_pago
                ),

            estado:
                this.normalizeEstado(
                    nomina.estado
                )

        });

        this.nominaModalMode.set('edit');

    }


    closeNominaModal(): void {

        if (this.saving()) {
            return;
        }

        this.nominaModalMode.set(null);

        this.editingNomina.set(null);

    }


    updateNominaForm<K extends keyof NominaForm>(
        field: K,
        value: NominaForm[K]
    ): void {

        this.nominaForm.update(
            form => ({

                ...form,

                [field]: value

            })
        );

    }

    onEstadoChange(
        event: MatSelectChange
    ): void {

        this.updateNominaForm(
            'estado',
            event.value
        );

    }


    saveNomina(): void {

        if (
            !this.isNominaFormValid() ||
            this.saving()
        ) {
            return;
        }

        const form =
            this.nominaForm();

        const mode =
            this.nominaModalMode();

        this.saving.set(true);

        this.errorMessage.set(null);

        if (mode === 'create') {

            this.nominaService
                .createNomina(form)
                .subscribe({

                    next: (nominaCreada) => {

                        this.saving.set(false);

                        this.closeNominaModal();

                        this.selectedNominaId.set(
                            nominaCreada.nomina_id
                        );

                        this.activeTab.set('planilla');

                        this.loadData(true);

                    },

                    error: (error) => {

                        console.error(
                            'Error creando la nómina:',
                            error
                        );

                        this.errorMessage.set(
                            'No se pudo crear el período de nómina.'
                        );

                        this.saving.set(false);

                    }

                });

            return;

        }

        const nomina =
            this.editingNomina();

        if (!nomina) {

            this.saving.set(false);

            return;

        }

        this.nominaService
            .updateNomina(
                nomina.nomina_id,
                form
            )
            .subscribe({

                next: () => {

                    this.saving.set(false);

                    this.closeNominaModal();

                    this.loadData(
                        !this.hasChanges()
                    );

                },

                error: (error) => {

                    console.error(
                        'Error actualizando la nómina:',
                        error
                    );

                    this.errorMessage.set(
                        'No se pudo actualizar el período de nómina.'
                    );

                    this.saving.set(false);

                }

            });

    }


    /* =============================================================
       PERÍODOS — ELIMINAR
       ============================================================= */

    openDeleteNomina(
        nomina: NominaResponse
    ): void {

        if (this.loadingNomina()) {
            return;
        }

        this.deleteNominaTarget.set(
            nomina
        );

    }


    closeDeleteNomina(): void {

        if (this.saving()) {
            return;
        }

        this.deleteNominaTarget.set(null);

    }


    confirmDeleteNomina(): void {

        const nomina =
            this.deleteNominaTarget();

        if (
            !nomina ||
            this.saving()
        ) {
            return;
        }

        this.saving.set(true);

        this.errorMessage.set(null);

        this.nominaService
            .deleteNomina(
                nomina.nomina_id
            )
            .subscribe({

                next: () => {

                    const eraSeleccionada =
                        nomina.nomina_id ===
                        this.selectedNominaId();

                    this.saving.set(false);

                    this.deleteNominaTarget.set(null);

                    this.loadData(
                        eraSeleccionada ||
                        !this.hasChanges()
                    );

                },

                error: (error) => {

                    console.error(
                        'Error eliminando la nómina:',
                        error
                    );

                    this.errorMessage.set(
                        'No se pudo eliminar el período de nómina.'
                    );

                    this.saving.set(false);

                    this.deleteNominaTarget.set(null);

                }

            });

    }


    /* =============================================================
       CÁLCULOS
       ============================================================= */

    private isDirty(
        fila: FilaPlanilla
    ): boolean {

        if (!fila.detalle) {
            return true;
        }

        return (

            this.roundAmount(
                fila.salario_base
            ) !==
            this.roundAmount(
                this.toNumber(
                    fila.detalle.salario_base
                )
            ) ||

            this.roundAmount(
                fila.horas_extras
            ) !==
            this.roundAmount(
                this.toNumber(
                    fila.detalle.horas_extras
                )
            )

        );

    }


    private calculoDesdeDetalle(
        detalle: DetalleNominaResponse
    ): CalculoNomina {

        return {

            salario_quincenal:
                this.toNumber(
                    detalle.salario_quincenal
                ),

            ingreso_horas_extras:
                this.toNumber(
                    detalle.ingreso_horas_extras
                ),

            total_ingresos:
                this.toNumber(
                    detalle.total_ingresos
                ),

            inss_laboral:
                this.toNumber(
                    detalle.inss_laboral
                ),

            ir:
                this.toNumber(
                    detalle.ir
                ),

            total_deducciones:
                this.toNumber(
                    detalle.total_deducciones
                ),

            salario_neto:
                this.toNumber(
                    detalle.salario_neto
                ),

            inatec:
                this.toNumber(
                    detalle.inatec
                ),

            inss_patronal:
                this.toNumber(
                    detalle.inss_patronal
                ),

            vacaciones:
                this.toNumber(
                    detalle.vacaciones
                ),

            treceavo_mes:
                this.toNumber(
                    detalle.treceavo_mes
                ),

            indemnizacion:
                this.toNumber(
                    detalle.indemnización
                )

        };

    }


    private calcular(
        fila: FilaPlanilla
    ): CalculoNomina {

        const salarioBase =
            fila.salario_base;

        const empleado =
            this.getEmpleado(
                fila.empleado_id
            );

        const cantidadEmpleados =
            this.empleados().length;

        const anos =
            this.anosTrabajados(
                empleado?.fecha_ingreso
            );

        const salarioQuincenal =
            salarioBase / 2;

        const salarioHora =
            salarioBase / 30 / 8;

        const ingresoHorasExtras =
            salarioHora *
            2 *
            fila.horas_extras;

        const totalIngresos =
            salarioQuincenal +
            ingresoHorasExtras;

        const inssLaboral =
            salarioBase * 0.07;

        const ir =
            this.irMensual(
                salarioBase,
                inssLaboral
            );

        const totalDeducciones =
            inssLaboral +
            ir;

        const porcentajePatronal =
            cantidadEmpleados < 50
                ? 0.215
                : 0.225;

        return {

            salario_quincenal:
                salarioQuincenal,

            ingreso_horas_extras:
                ingresoHorasExtras,

            total_ingresos:
                totalIngresos,

            inss_laboral:
                inssLaboral,

            ir,

            total_deducciones:
                totalDeducciones,

            salario_neto:
                totalIngresos -
                totalDeducciones,

            inatec:
                salarioBase * 0.02,

            inss_patronal:
                salarioBase *
                porcentajePatronal,

            vacaciones:
                (salarioBase / 30) * 2.5,

            treceavo_mes:
                salarioBase / 12,

            indemnizacion:
                this.indemnizacion(
                    salarioBase,
                    anos
                )

        };

    }


    private irMensual(
        salarioBase: number,
        inssLaboral: number
    ): number {

        const rentaNetaAnual =
            salarioBase * 12 -
            inssLaboral * 12;

        return (
            this.irAnual(
                rentaNetaAnual
            ) / 12
        );

    }


    private irAnual(
        rentaNetaAnual: number
    ): number {

        if (rentaNetaAnual <= 100_000) {
            return 0;
        }

        if (rentaNetaAnual <= 200_000) {
            return (
                (rentaNetaAnual - 100_000) *
                0.15
            );
        }

        if (rentaNetaAnual <= 350_000) {
            return (
                15_000 +
                (rentaNetaAnual - 200_000) *
                0.20
            );
        }

        if (rentaNetaAnual <= 500_000) {
            return (
                45_000 +
                (rentaNetaAnual - 350_000) *
                0.25
            );
        }

        return (
            82_500 +
            (rentaNetaAnual - 500_000) *
            0.30
        );

    }


    private indemnizacion(
        salarioBase: number,
        anos: number
    ): number {

        if (anos <= 0) {
            return 0;
        }

        let meses =
            Math.min(anos, 3);

        if (anos > 3) {

            meses +=
                (anos - 3) *
                (20 / 30);

        }

        meses =
            Math.min(meses, 5);

        return salarioBase * meses;

    }


    private anosTrabajados(
        fechaIngreso:
            Date |
            string |
            undefined
    ): number {

        if (!fechaIngreso) {
            return 0;
        }

        const ingreso =
            new Date(fechaIngreso);

        if (
            Number.isNaN(
                ingreso.getTime()
            )
        ) {
            return 0;
        }

        const actual =
            new Date();

        let anos =
            actual.getFullYear() -
            ingreso.getFullYear();

        const anoCompleto =
            actual.getMonth() >
            ingreso.getMonth() ||
            (
                actual.getMonth() ===
                ingreso.getMonth() &&
                actual.getDate() >=
                ingreso.getDate()
            );

        if (!anoCompleto) {
            anos--;
        }

        return anos;

    }


    private emptyCalculo():
        CalculoNomina {

        return {

            salario_quincenal: 0,

            ingreso_horas_extras: 0,

            total_ingresos: 0,

            inss_laboral: 0,

            ir: 0,

            total_deducciones: 0,

            salario_neto: 0,

            inatec: 0,

            inss_patronal: 0,

            vacaciones: 0,

            treceavo_mes: 0,

            indemnizacion: 0

        };

    }


    /* =============================================================
       EMPLEADOS Y PERSONAS
       ============================================================= */

    getEmpleado(
        empleadoId: number
    ): EmpleadosResponse | null {

        return (
            this.empleados().find(
                empleado =>
                    empleado.empleado_id ===
                    empleadoId
            ) ?? null
        );

    }


    private getPersonaDeEmpleado(
        empleadoId: number
    ): PersonasResponse | null {

        const empleado =
            this.getEmpleado(
                empleadoId
            );

        if (!empleado) {
            return null;
        }

        return (
            this.personas().find(
                persona =>
                    persona.persona_id ===
                    empleado.persona_id
            ) ?? null
        );

    }


    getEmpleadoNombre(
        empleadoId: number
    ): string {

        const empleado =
            this.getEmpleado(
                empleadoId
            );

        const persona =
            empleado?.persona ??
            this.getPersonaDeEmpleado(
                empleadoId
            );

        if (!persona) {

            return `Empleado #${empleadoId}`;

        }

        return [
            persona.primer_nombre,
            persona.segundo_nombre,
            persona.primer_apellido,
            persona.segundo_apellido
        ]
            .filter(Boolean)
            .join(' ');

    }


    getEmpleadoIniciales(
        empleadoId: number
    ): string {

        const empleado =
            this.getEmpleado(
                empleadoId
            );

        const persona =
            empleado?.persona ??
            this.getPersonaDeEmpleado(
                empleadoId
            );

        if (!persona) {
            return 'EM';
        }

        const first =
            persona.primer_nombre
                ?.trim()
                .charAt(0) ?? '';

        const last =
            persona.primer_apellido
                ?.trim()
                .charAt(0) ?? '';

        return (
            first + last
        ).toUpperCase();

    }


    getEmpleadoCargo(
        empleadoId: number
    ): string {

        return (
            this.getEmpleado(
                empleadoId
            )?.cargo ?? '—'
        );

    }


    /* =============================================================
       FORMATO
       ============================================================= */

    formatAmount(
        amount: number
    ): string {

        return new Intl.NumberFormat(
            'es-NI',
            {

                minimumFractionDigits: 2,

                maximumFractionDigits: 2

            }
        ).format(amount);

    }


    formatDate(
        value:
            Date |
            string |
            null |
            undefined
    ): string {

        const text =
            this.normalizeDate(value);

        if (!text) {
            return '—';
        }

        const [year, month, day] =
            text
                .split('-')
                .map(Number);

        const parsed =
            new Date(
                year,
                month - 1,
                day
            );

        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {
            return '—';
        }

        return new Intl.DateTimeFormat(
            'es-NI',
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }
        ).format(parsed);

    }


    formatPeriodo(
        nomina: NominaResponse
    ): string {

        return `${this.formatDate(nomina.periodo_inicio)} – ${this.formatDate(nomina.periodo_fin)}`;

    }


    normalizeEstado(
        estado:
            string |
            null |
            undefined
    ): string {

        return (estado ?? '')
            .trim()
            .toUpperCase();

    }


    formatEstado(
        estado:
            string |
            null |
            undefined
    ): string {

        const text =
            (estado ?? '')
                .trim()
                .toLowerCase();

        if (!text) {
            return '—';
        }

        return (
            text.charAt(0).toUpperCase() +
            text.slice(1)
        );

    }


    estadoBadgeClass(
        estado:
            string |
            null |
            undefined
    ): string {

        switch (
        this.normalizeEstado(estado)
        ) {

            case 'BORRADOR':
                return 'bg-[#edf6ef] text-[#477553]';

            case 'PAGADA':
                return 'bg-[#eaf1f8] text-[#3b6288]';

            default:
                return 'bg-[#f1f2f3] text-[#737b83]';

        }

    }


    private normalizeDate(
        value:
            Date |
            string |
            null |
            undefined
    ): string {

        if (!value) {
            return '';
        }

        if (
            typeof value === 'string'
        ) {

            return value.slice(0, 10);

        }

        return value
            .toISOString()
            .slice(0, 10);

    }


    /* =============================================================
       FECHAS
       ============================================================= */

    private getDefaultPeriod(): {
        inicio: string;
        fin: string;
    } {

        const now =
            new Date();

        const year =
            now.getFullYear();

        const month =
            now.getMonth();

        const primeraQuincena =
            now.getDate() <= 15;

        const inicio =
            new Date(
                year,
                month,
                primeraQuincena ? 1 : 16
            );

        const fin =
            primeraQuincena
                ? new Date(year, month, 15)
                : new Date(year, month + 1, 0);

        return {

            inicio:
                this.toInputDate(inicio),

            fin:
                this.toInputDate(fin)

        };

    }


    private toInputDate(
        date: Date
    ): string {

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, '0');

        const day =
            String(
                date.getDate()
            ).padStart(2, '0');

        return `${year}-${month}-${day}`;

    }


    /* =============================================================
       NÚMEROS
       ============================================================= */

    private toNumber(
        value:
            number |
            string |
            null |
            undefined
    ): number {

        const number =
            Number(value);

        return Number.isFinite(
            number
        )
            ? number
            : 0;

    }


    private parseAmount(
        value: string
    ): number {

        const amount =
            Number(value);

        if (
            !Number.isFinite(
                amount
            ) ||
            amount < 0
        ) {

            return 0;

        }

        return this.roundAmount(
            amount
        );

    }


    private roundAmount(
        amount: number
    ): number {

        return Math.round(
            amount * 100
        ) / 100;

    }

}