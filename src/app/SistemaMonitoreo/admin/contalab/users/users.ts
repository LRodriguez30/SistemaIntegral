import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// Service and Type isolation
import { UsersService } from '../../../../services/users.service';
import { RolesType } from '../../../../services/users.service';
import type {
    CreateFullUser,
    CreateUser,
    UpdateUser,
    UsersResponse,
} from '../../../../services/users.service';

import type { UserFilter } from './users.filter';

// Combined Material Table imports
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

import { DynamicCreateModel } from '../../helpers/ActionsHelper';

import { InitializeTableSchema, HIDDEN_COLUMNS } from './users.schema';
import { InitializeFilterEngine } from './users.filter';
import {
    getRoleClass,
    getRoleIcon,
    getRoleLabel
} from './users.ui';

import { InitializeDefaultValues } from '../../helpers/FormInit';
import { AuthService } from '../../../../services/auth.service';
import { PHONE_COUNTRIES, PhoneCountry } from '../personas/personas';

import {
    PHONE_INPUT_PLACEHOLDER,
    PHONE_COUNTRY_SELECT_PLACEHOLDER,
    PHONE_COUNTRY_WIDTH,
    PHONE_NUMBER_MAX_LENGTH
} from '../personas/personas.ui';

type UpdateModalAction = 'close' | 'reset';
type UserFilterKey = keyof UserFilter;
type CreateMode = 'menu' | 'single' | 'multi' | 'import' | 'full';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatMenuModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatSelectModule,
        MatOptionModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './users.html',
    styleUrl: './users.css',
})
export class Users {

    // =========================================================
    // CONSTRUCTOR / INIT
    // =========================================================

    constructor(
        private readonly usersService: UsersService,
        private readonly authService: AuthService
    ) {
        this.loadData();
    }

    RolesType = RolesType;

    usernameAutofill = signal(true);

    // =========================================================
    // CSV
    // =========================================================

    uploadedCsvFiles = signal<{
        file: File;
        rowCount: number;
        uploadedAt: Date;
    }[]>([]);

    csvError = signal<string | null>(null);
    csvWarning = signal<string | null>(null);

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onFileDrop(event: DragEvent) {

        event.preventDefault();
        this.csvWarning.set('');

        const file = event.dataTransfer?.files?.[0];

        if (!file) return;

        this.csvError.set(null);
        this.multiRows.set([]);

        this.preprocessCsvFile(file);
    }

    onFileSelected(event: Event) {

        const input = event.target as HTMLInputElement;

        this.csvWarning.set('');

        if (!input.files?.length) return;

        const file = input.files[0];

        this.csvError.set(null);
        this.multiRows.set([]);

        this.preprocessCsvFile(file);

        input.value = '';
    }

    preprocessCsvFile(file: File) {

        this.csvError.set(null);

        if (!file.name.toLowerCase().endsWith('.csv')) {

            this.csvError.set(
                'El archivo debe ser formato CSV'
            );

            return;
        }

        const reader = new FileReader();

        reader.onload = () => {

            try {

                const text = String(reader.result);

                const lines = text
                    .split(/\r?\n/)
                    .filter(l => l.trim().length > 0);

                const rowCount = Math.max(lines.length - 1, 0);

                if (lines.length < 2) {

                    this.csvError.set(
                        'El archivo no contiene registros'
                    );

                    return;
                }

                const headers = lines[0]
                    .split(',')
                    .map(h => h.trim());

                const requiredColumns = [
                    'persona_id',
                    'correo_electronico',
                    'contraseña',
                    'rol_id',
                    'estado'
                ];

                const missing = requiredColumns.filter(
                    col => !headers.includes(col)
                );

                if (missing.length > 0) {

                    this.csvError.set(
                        `Faltan columnas: ${missing.join(', ')}`
                    );

                    return;
                }

                if (!this.isSameCsv(file)) {

                    this.uploadedCsvFiles.update(files => [
                        {
                            file,
                            uploadedAt: new Date(),
                            rowCount
                        },
                        ...files
                    ]);

                } else {

                    this.csvWarning.set(
                        'El archivo CSV ya fue cargado anteriormente'
                    );

                    return;
                }

            } catch {

                this.csvError.set(
                    'No se pudo analizar el archivo CSV'
                );
            }
        };

        reader.readAsText(file);
    }

    processCsvFile(file: File) {

        this.csvError.set(null);
        this.csvWarning.set(null);

        if (!file.name.toLowerCase().endsWith('.csv')) {

            this.csvError.set(
                'El archivo debe ser formato CSV'
            );

            return;
        }

        const reader = new FileReader();

        reader.onload = () => {

            try {

                const text = String(reader.result);

                const lines = text
                    .split(/\r?\n/)
                    .filter(l => l.trim().length > 0);

                if (lines.length < 2) {

                    this.csvError.set(
                        'El archivo no contiene registros'
                    );

                    return;
                }

                const headers = lines[0]
                    .split(',')
                    .map(h => h.trim());

                const requiredColumns = [
                    'persona_id',
                    'correo_electronico',
                    'contraseña',
                    'rol_id',
                    'estado'
                ];

                const missing = requiredColumns.filter(
                    col => !headers.includes(col)
                );

                if (missing.length > 0) {

                    this.csvError.set(
                        `Faltan columnas: ${missing.join(', ')}`
                    );

                    return;
                }

                const rows: Record<string, any>[] = [];

                for (let i = 1; i < lines.length; i++) {

                    const values = lines[i]
                        .split(',')
                        .map(v => v.trim());

                    const row: Record<string, any> = {};

                    headers.forEach((header, index) => {
                        row[header] = values[index] ?? '';
                    });

                    row['persona_id'] = Number(row['persona_id']);
                    row['estado'] =
                        String(row['estado']).toLowerCase() === 'true';

                    rows.push(row);
                }

                this.multiRows.set(rows);

                this.createState.set({
                    open: true,
                    mode: 'multi'
                });

            } catch {

                this.csvError.set(
                    'No se pudo procesar el archivo CSV'
                );
            }
        };

        reader.readAsText(file);
    }

    downloadCsvTemplate() {

        const headers = [
            'persona_id',
            'correo_electronico',
            'contraseña',
            'rol_id',
            'estado'
        ];

        const example = [
            '1',
            'usuario@empresa.com',
            'SecurePass@2026',
            RolesType.USUARIOESTANDAR,
            'true'
        ];

        const csvContent = [
            headers.join(','),
            example.join(',')
        ].join('\n');

        const blob = new Blob(
            [csvContent],
            { type: 'text/csv;charset=utf-8;' }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = url;
        link.download = 'plantilla_users.csv';

        link.click();

        URL.revokeObjectURL(url);
    }

    removeUploadedCsv(index: number) {

        const current = this.uploadedCsvFiles();

        current.splice(index, 1);

        this.uploadedCsvFiles.set([...current]);
    }

    handleCsvLoad(input: HTMLInputElement) {

        this.createState.set({
            open: true,
            mode: 'import'
        });
    }

    isSameCsv(file: File): boolean {

        return this.uploadedCsvFiles().some(csv =>
            csv.file.name === file.name &&
            csv.file.size === file.size &&
            csv.file.lastModified === file.lastModified
        );
    }

    // =========================================================
    // STATE
    // =========================================================

    createMode = signal<CreateMode>('menu');

    isCreateModeOpen = signal(false);

    createState = signal<{
        open: boolean;
        mode: CreateMode;
    }>({
        open: false,
        mode: 'menu'
    });

    multiRows = signal<Record<string, any>[]>([]);

    isLoaded = signal(false);
    isApiError = signal(false);

    isOpening = signal(false);
    isClosing = signal(false);
    isDeleting = signal(false);

    isOpeningDialog = signal(false);
    isClosingDialog = signal(false);

    isDeleteOpen = signal(false);
    isDeleteClosing = signal(false);

    isUpdateOpen = signal(false);
    isUpdateClosing = signal(false);
    isUpdating = signal(false);

    isDirty = signal(false);
    isFormValid = signal(false);
    isFullFormValid = signal(false);

    isDiscardWarningOpen = signal(false);

    isCreateOpen = signal(false);
    isSubmitting = signal(false);

    hideGuidColumns = signal(true);

    // =========================================================
    // DATA MODELS
    // =========================================================

    deleteTarget: UsersResponse | null = null;
    updateTarget: UsersResponse | null = null;

    updateModel: DynamicCreateModel | null = null;

    createModel: DynamicCreateModel = {

        title: 'Nuevo usuario',

        endpoint: `/users`,

        fields: [

            {
                key: 'nombre_usuario',
                label: 'Nombre de usuario',
                type: 'text',
                required: true
            },
            
            {
                key: 'persona_id',
                label: 'Persona',
                type: 'int',
                required: true
            },

            {
                key: 'correo_electronico',
                label: 'Correo electrónico',
                type: 'text',
                required: true
            },

            {
                key: 'contraseña',
                label: 'Contraseña',
                type: 'password',
                required: true
            },

            {
                key: 'rol_id',
                label: 'Rol',
                type: 'select',
                required: true,

                options: [
                    {
                        label: 'Superadministrador',
                        value: RolesType.SUPERADMINISTRADOR
                    },
                    {
                        label: 'Administrador Gerencial',
                        value: RolesType.ADMINISTRADORGERENCIAL
                    },
                    {
                        label: 'Administrador Contable',
                        value: RolesType.ADMINISTRADORCONTABLE
                    },
                    {
                        label: 'Administrador Operativo',
                        value: RolesType.ADMINISTRADOROPERATIVO
                    },
                    {
                        label: 'Usuario Estándar',
                        value: RolesType.USUARIOESTANDAR
                    }
                ]
            },

            {
                key: 'estado',
                label: 'Estado',
                type: 'boolean',
                required: true
            }
        ]

    } as DynamicCreateModel;

    fullCreateModel: DynamicCreateModel = {
        title: 'Nuevo usuario completo',
        endpoint: `/users/full-user`,
        fields: [
            // =============================================================
            // PERSONA
            // =============================================================

            {
            key: 'primer_nombre',
            label: 'Primer nombre',
            type: 'text',
            required: true
            },
            {
            key: 'segundo_nombre',
            label: 'Segundo nombre',
            type: 'text',
            required: false
            },
            {
            key: 'primer_apellido',
            label: 'Primer apellido',
            type: 'text',
            required: true
            },
            {
            key: 'segundo_apellido',
            label: 'Segundo apellido',
            type: 'text',
            required: false
            },
            {
            key: 'telefono',
            label: 'Teléfono',
            type: 'text',
            required: false
            },

            // =============================================================
            // USUARIO
            // =============================================================

            {
            key: 'correo_electronico',
            label: 'Correo electrónico',
            type: 'text',
            required: true
            },
            {
            key: 'contraseña',
            label: 'Contraseña',
            type: 'password',
            required: true
            },
            {
            key: 'rol_id',
            label: 'Rol',
            type: 'select',
            required: true,
            options: [
                {
                label: 'Superadministrador',
                value: RolesType.SUPERADMINISTRADOR
                },
                {
                label: 'Administrador Gerencial',
                value: RolesType.ADMINISTRADORGERENCIAL
                },
                {
                label: 'Administrador Contable',
                value: RolesType.ADMINISTRADORCONTABLE
                },
                {
                label: 'Administrador de Producción',
                value: RolesType.ADMINISTRADORDEPRODUCCION
                },
                {
                label: 'Administrador Operativo',
                value: RolesType.ADMINISTRADOROPERATIVO
                },
                {
                label: 'Usuario Estándar',
                value: RolesType.USUARIOESTANDAR
                }
            ]
            },
            {
            key: 'estado',
            label: 'Estado',
            type: 'boolean',
            required: true
            }
        ]
    } as DynamicCreateModel;

    formCreateState: Record<string, any> = {};
    formFullCreateState: Record<string, any> = {};
    formUpdateState: Record<string, any> = {};
    originalFormState: Record<string, any> = {};

    dataSource =
        new MatTableDataSource<UsersResponse>();

    // =========================================================
    // FILTER STATE
    // =========================================================

    filterEngine = InitializeFilterEngine();

    isFilterOpen = signal(false);
    activeFilterCount = signal(0);
    isFilterDiscardWarningOpen = signal(false);

    filterState =
        this.filterEngine.createState() as UserFilter;

    savedFilterState =
        structuredClone(this.filterState);

    readonly filterRules =
        this.filterEngine.rules;

    toggleMulti(field: UserFilterKey, valor: RolesType) {
        const current = this.filterState[field] as RolesType[];
        const idx = current.indexOf(valor);

        (this.filterState[field] as RolesType[]) = idx === -1
            ? [...current, valor]
            : current.filter(v => v !== valor);
    }

    setRangeValue(
        field: UserFilterKey,
        key: 'min' | 'max' | 'from' | 'to',
        raw: string
    ) {

        const current = {
            ...(this.filterState[field] as any)
        };

        if (key === 'min' || key === 'max') {

            current[key] =
                raw === ''
                    ? null
                    : Number(raw);

        } else {

            current[key] = raw;
        }

        this.filterState = {
            ...this.filterState,
            [field]: current
        };
    }

    asRange(value: any): {
        min: number | null;
        max: number | null;
    } {

        return value as {
            min: number | null;
            max: number | null;
        };
    }

    asDateRange(value: any): {
        from: string;
        to: string;
    } {

        return value as {
            from: string;
            to: string;
        };
    }

    getFilterValue(field: UserFilterKey) {
        return this.filterState[field];
    }

    setFilterValue(
        field: UserFilterKey,
        value: any
    ) {

        if (field === 'estado') {

            value = this.normalizeBoolean(value);
        }

        this.filterState = {
            ...this.filterState,
            [field]: value
        };
    }

    openFilter() {

        this.isFilterOpen.set(true);
        this.isOpening.set(true);

        setTimeout(() => {
            this.isOpening.set(false);
        }, 16);
    }

    closeFilterDiscardWarning() {
        this.isFilterDiscardWarningOpen.set(false);
    }

    closeFilter(discardConfirmation = false) {

        const changes =
            JSON.stringify(this.filterState) !==
            JSON.stringify(this.savedFilterState);

        if (changes) {

            if (
                this.confirmFilterDiscard(
                    discardConfirmation
                )
            ) {
                return;
            }

            this.isFilterDiscardWarningOpen.set(true);

            return;
        }

        if (
            this.confirmFilterDiscard(
                discardConfirmation
            )
        ) {
            return;
        }

        this.closeModal('filter');
    }

    confirmFilterDiscard(
        discardConfirmation: boolean
    ): boolean {

        if (!discardConfirmation) {
            return false;
        }

        this.filterState =
            structuredClone(this.savedFilterState);

        this.closeFilterDiscardWarning();
        this.closeModal('filter');

        return true;
    }

    applyFilter() {
        const f = this.filterState;

        this.loadFilters(f);

        let count = 0;

        if (f.rol_id.length > 0) count += f.rol_id.length;
        if (f.correo_electronico.length > 0) count++;
        if (f.usuario_id != "") count++;
        if (f.persona_id != "") count++;

        this.activeFilterCount.set(count);

        this.savedFilterState = structuredClone(this.filterState);

        this.closeFilter();
    }

    // =========================================================
    // FILTERING
    // =========================================================

    searchText = signal('');

    loadFilters(f: UserFilter) {

        this.dataSource.filterPredicate = (
            row: UsersResponse
        ) => {

            // =====================================================
            // BÚSQUEDA GLOBAL
            // =====================================================

            const search = this.searchText()
                .trim()
                .toLowerCase();

            if (search) {

                const searchableText =
                    this.buildSearchText(row);

                if (!searchableText.includes(search)) {
                    return false;
                }
            }


            // =====================================================
            // FILTRO POR ROL
            // =====================================================

            if (
                f.rol_id.length > 0 &&
                !f.rol_id.includes(row.rol_id)
            ) {
                return false;
            }


            // =====================================================
            // FILTRO POR ESTADO
            // =====================================================

            if (
                f.estado !== null &&
                row.estado !== f.estado
            ) {
                return false;
            }


            // =====================================================
            // FILTRO POR CORREO
            // =====================================================

            if (
                f.correo_electronico &&
                !row.correo_electronico
                    .toLowerCase()
                    .includes(
                        f.correo_electronico
                            .toLowerCase()
                    )
            ) {
                return false;
            }


            // =====================================================
            // FILTRO POR USUARIO ID
            // =====================================================

            if (
                f.usuario_id &&
                !row.usuario_id
                    .toString()
                    .toLowerCase()
                    .includes(
                        f.usuario_id
                            .toLowerCase()
                    )
            ) {
                return false;
            }


            // =====================================================
            // FILTRO POR PERSONA ID
            // =====================================================

            if (
                f.persona_id &&
                !row.persona_id
                    .toString()
                    .toLowerCase()
                    .includes(
                        f.persona_id
                            .toLowerCase()
                    )
            ) {
                return false;
            }

            return true;
        };


        // Cualquier valor distinto de '' hace que
        // MatTableDataSource ejecute el filterPredicate.
        this.dataSource.filter = 'active';
    }

    clearFilter() {

        this.filterState = {
            rol_id: [],
            correo_electronico: '',
            usuario_id: '',
            persona_id: '',
            estado: false
        };

        this.savedFilterState =
            structuredClone(this.filterState);

        this.searchText.set('');

        this.dataSource.filter = '';

        this.activeFilterCount.set(0);
    }

    applyGlobalFilter(event: Event) {

        const value =
            (event.target as HTMLInputElement)
                .value
                .trim()
                .toLowerCase();

        this.searchText.set(value);

        this.loadFilters(this.filterState);

        this.dataSource.filter =
            value || 'active';
    }

    private buildSearchText(
        row: UsersResponse
    ): string {

        return [
            row.usuario_id,
            row.persona_id,
            row.correo_electronico,
            row.rol_id,
            row.estado
        ]
            .join(' ')
            .toLowerCase();
    }

    // =========================================================
    // TABLE
    // =========================================================

    get visibleColumns(): string[] {

        if (!this.hideGuidColumns()) {
            return this.displayedColumns;
        }

        return this.displayedColumns.filter(
            col => !this.hiddenColumns.includes(col)
        );
    }

    ventasSchema = InitializeTableSchema();

    get displayedColumns(): string[] {

        return this.ventasSchema.fields
            .filter(
                f =>
                    f.type !== 'actions' ||
                    f.source === 'ui'
            )
            .map(f => f.key as string);
    }

    get columnLabels(): Record<string, string> {

        return Object.fromEntries(
            this.ventasSchema.fields.map(
                f => [f.key, f.label]
            )
        );
    }

    get columnConfig(): Record<
        string,
        { type: string }
    > {

        return Object.fromEntries(
            this.ventasSchema.fields.map(
                f => [
                    f.key,
                    { type: f.type }
                ]
            )
        );
    }

    hiddenColumns = HIDDEN_COLUMNS;

    // =========================================================
    // DATA LOADING
    // =========================================================

    loadData() {

        this.isLoaded.set(false);
        this.isApiError.set(false);

        // this.authService.refresh().subscribe({
        //     next: () => {},
        //     error: () => {}
        // });

        this.usersService.getUsers().subscribe({

            next: data => {

                this.dataSource.data = [...data];

                this.isLoaded.set(true);

                if (this.searchText()) {
                    this.loadFilters(
                        this.filterState
                    );
                }
            },

            error: err => {

                console.error(
                    'Error cargando usuarios',
                    err
                );

                this.isApiError.set(true);
                this.isLoaded.set(false);
            }
        });
    }

    getRowIndex(
        row: UsersResponse
    ): number {

        return this.dataSource.data
            .indexOf(row) + 1;
    }

    // =========================================================
    // CREATE FLOW
    // =========================================================

    createRandomRow(): Record<string, any> {

        return InitializeDefaultValues(
            this.createModel
        );
    }

    addRow() {

        const current = this.multiRows();

        this.multiRows.set([
            ...current,
            this.createRandomRow()
        ]);
    }

    removeRow(index: number) {

        const current = this.multiRows();

        current.splice(index, 1);

        this.multiRows.set([...current]);
    }

    clearAllRows() {
        this.multiRows.set([]);
    }

    updateCell(
        rowIndex: number,
        key: string,
        value: any
    ) {

        const rows = this.multiRows();

        rows[rowIndex] = {
            ...rows[rowIndex],
            [key]: value
        };

        this.multiRows.set([...rows]);
    }

    submitMultiCreate() {

        const rows = this.multiRows();

        this.isSubmitting.set(true);

        let completed = 0;

        if (rows.length === 0) {

            this.isSubmitting.set(false);

            return;
        }

        rows.forEach(row => {

            const payload: CreateUser = {

                nombre_usuario:
                    row['nombre_usuario'],

                persona_id:
                    Number(row['persona_id']),

                correo_electronico:
                    row['correo_electronico'],

                contraseña:
                    row['contraseña'],

                rol_id:
                    row['rol_id'],

                estado:
                    Boolean(row['estado'])
            };

            this.usersService
                .createUser(payload)
                .subscribe({

                    next: () => {

                        completed++;

                        if (completed === rows.length) {

                            this.isSubmitting.set(false);
                            this.isClosing.set(true);

                            setTimeout(() => {

                                this.createState.set({
                                    open: false,
                                    mode: 'multi'
                                });

                                this.multiRows.set([]);

                                this.isClosing.set(false);

                                this.loadData();

                            }, 200);
                        }
                    },

                    error: err => {

                        console.error(
                            'Error creando usuarios',
                            err
                        );

                        this.isSubmitting.set(false);
                    }
                });
        });
    }

    openCreateMenu() {

        this.createMode.set('menu');
        this.isCreateModeOpen.set(true);
    }

    openCreate(
        mode: CreateMode = 'single'
    ) {

        this.isCreateModeOpen.set(false);

        this.formCreateState =
            InitializeDefaultValues(
                this.createModel
            );

        if (mode === 'full') {

            this.usernameAutofill.set(true);

            this.formFullCreateState = {
                rol_id: RolesType.USUARIOESTANDAR,
                estado: true
            };

            this.createPhoneCountry =
                this.getPhoneCountry(
                    this.defaultPhoneCountryCode
                );
        }

        setTimeout(() => {

            if (mode === 'multi') {
                this.multiRows.set([]);
            }

            this.createState.set({
                open: true,
                mode
            });

            this.isCreateOpen.set(true);

            if (mode === 'full') {
                this.updateFullFormValidity();
            } else {
                this.updateFormValidity('create');
            }

            this.isOpening.set(true);

            setTimeout(() => {
                this.isOpening.set(false);
            }, 16);

        }, 60);
    }

    submitCreate() {

        this.isSubmitting.set(true);

        const payload: CreateUser = {

            nombre_usuario:
                this.formCreateState['nombre_usuario'],

            persona_id:
                Number(
                    this.formCreateState['persona_id']
                ),

            correo_electronico:
                this.formCreateState[
                'correo_electronico'
                ],

            contraseña:
                this.formCreateState[
                'contraseña'
                ],

            rol_id:
                this.formCreateState['rol_id'],

            estado:
                Boolean(
                    this.formCreateState['estado']
                )
        };

        this.usersService
            .createUser(payload)
            .subscribe({

                next: () => {

                    this.isSubmitting.set(false);
                    this.isClosing.set(true);

                    setTimeout(() => {

                        this.createState.set({
                            open: false,
                            mode: 'menu'
                        });

                        this.isClosing.set(false);

                        this.formCreateState = {};

                        this.loadData();

                    }, 200);
                },

                error: err => {

                    console.error(
                        'Error creando usuario',
                        err
                    );

                    this.isSubmitting.set(false);
                }
            });
    }

    submitFullCreate() {
        this.isSubmitting.set(true);

        const payload: CreateFullUser = {
            persona: {
                primer_nombre:
                    this.formFullCreateState['primer_nombre'],

                segundo_nombre:
                    this.formFullCreateState['segundo_nombre'] || '',

                primer_apellido:
                    this.formFullCreateState['primer_apellido'],

                segundo_apellido:
                    this.formFullCreateState['segundo_apellido'] || '',

                telefono:
                    this.formFullCreateState['telefono'] || ''
            },

            usuario: {

                nombre_usuario:
                    this.formFullCreateState['nombre_usuario'],

                correo_electronico:
                    this.formFullCreateState['correo_electronico'],

                contraseña:
                    this.formFullCreateState['contraseña'],

                rol_id:
                    Number(
                        this.formFullCreateState['rol_id']
                    )
            }
        };

        this.usersService.createFullUser(payload).subscribe({
            next: () => {
            this.isSubmitting.set(false);

            this.isCreateOpen.set(false);
            this.createState.set({
                open: false,
                mode: 'full'
            });

            this.loadData();
            },

            error: () => {
            this.isSubmitting.set(false);
            this.isApiError.set(true);
            }
        });
    }

    // =========================================================
    // UPDATE FLOW
    // =========================================================

    updateUser(row: UsersResponse) {

        this.updateTarget = row;

        this.updateModel = {

            title: 'Actualizar usuario',

            endpoint: `/users/sqlServer`,

            fields: [

                {
                    key: 'rol_id',
                    label: 'Rol',
                    type: 'select',
                    required: true,

                    options: [
                        {
                            label: 'Superadministrador',
                            value:
                                RolesType.SUPERADMINISTRADOR
                        },
                        {
                            label: 'Administrador Gerencial',
                            value:
                                RolesType.ADMINISTRADORGERENCIAL
                        },
                        {
                            label: 'Administrador Contable',
                            value:
                                RolesType.ADMINISTRADORCONTABLE
                        },
                        {
                            label: 'Administrador Operativo',
                            value:
                                RolesType.ADMINISTRADOROPERATIVO
                        },
                        {
                            label: 'Usuario Estándar',
                            value:
                                RolesType.USUARIOESTANDAR
                        }
                    ]
                },

                {
                    key: 'estado',
                    label: 'Estado',
                    type: 'boolean',
                    required: true
                }
            ]
        };

        this.formUpdateState = {

            rol_id: row.rol_id,

            estado: row.estado

        };

        this.originalFormState =
            structuredClone(
                this.formUpdateState
            );

        this.isUpdateOpen.set(true);

        this.updateFormValidity('update');

        this.isOpening.set(true);

        setTimeout(() => {
            this.isOpening.set(false);
        }, 16);
    }

    submitUpdate() {

        if (!this.updateTarget) return;

        this.isUpdating.set(true);

        const payload: UpdateUser = {

            rol_id:
                this.formUpdateState['rol_id'],

            estado:
                Boolean(
                    this.formUpdateState['estado']
                )
        };

        this.usersService
            .grantRole(
                payload,
                this.updateTarget.usuario_id
            )
            .subscribe({

                next: () => {

                    this.isUpdateClosing.set(true);

                    setTimeout(() => {

                        this.isUpdateOpen.set(false);

                        this.isUpdateClosing.set(false);

                        this.isUpdating.set(false);

                        this.updateTarget = null;

                        this.loadData();

                    }, 200);
                },

                error: err => {

                    console.error(
                        'Error actualizando usuario',
                        err
                    );

                    this.isUpdating.set(false);
                }
            });
    }

    // =========================================================
    // DELETE FLOW
    // =========================================================

    deleteUser(row: UsersResponse) {

        this.deleteTarget = row;

        this.isDeleteOpen.set(true);

        this.isOpening.set(true);

        setTimeout(() => {
            this.isOpening.set(false);
        }, 16);
    }

    confirmDelete() {

        if (!this.deleteTarget) return;

        this.isDeleting.set(true);

        this.usersService
            .deleteUser(
                this.deleteTarget.usuario_id
            )
            .subscribe({

                next: () => {

                    this.isDeleteClosing.set(true);

                    setTimeout(() => {

                        this.isDeleteOpen.set(false);

                        this.isDeleteClosing.set(false);

                        this.isDeleting.set(false);

                        this.deleteTarget = null;

                        this.loadData();

                    }, 200);
                },

                error: err => {

                    console.error(
                        'Error eliminando usuario',
                        err
                    );

                    this.isDeleting.set(false);
                }
            });
    }

    closeDeleteModal() {
        this.closeModal('delete');
    }

    // =========================================================
    // FORM CONTROL
    // =========================================================

    setFieldValue(
        key: string,
        value: any,
        action: 'create' | 'update'
    ) {

        if (action === 'create') {

            this.formCreateState = {
                ...this.formCreateState,
                [key]: value
            };

        } else {

            this.formUpdateState = {
                ...this.formUpdateState,
                [key]: value
            };
        }

        this.isDirty.set(true);

        this.updateDirtyState();

        this.updateFormValidity(action);
    }

    setFullFieldValue(key: string, value: any) {
        this.formFullCreateState = {
            ...this.formFullCreateState,
            [key]: value
        };

        if (
            this.usernameAutofill() &&
            (
                key === 'primer_nombre' ||
                key === 'segundo_nombre' ||
                key === 'primer_apellido' ||
                key === 'segundo_apellido'
            )
        ) {
            this.generateUsername();
        }

        this.updateFullFormValidity();
    }

    generateUsername() {

        const primerNombre =
            this.formFullCreateState['primer_nombre'] ?? '';

        const segundoNombre =
            this.formFullCreateState['segundo_nombre'] ?? '';

        const primerApellido =
            this.formFullCreateState['primer_apellido'] ?? '';

        const segundoApellido =
            this.formFullCreateState['segundo_apellido'] ?? '';

        const nombreUsuario = [
            primerNombre,
            segundoNombre,
            primerApellido,
            segundoApellido
        ]
            .map(value => String(value).trim())
            .filter(value => value !== '')
            .join(' ');

        this.formFullCreateState = {
            ...this.formFullCreateState,
            nombre_usuario: nombreUsuario
        };
    }

    toggleUsernameAutofill() {
        const newValue = !this.usernameAutofill();

        this.usernameAutofill.set(newValue);

        if (newValue) {
            this.generateUsername();
        }

        this.updateFullFormValidity();
    }

    updateFullFormValidity() {
        const valid = this.fullCreateModel.fields.every(field => {
            if (!field.required) {
            return true;
            }

            const value = this.formFullCreateState[field.key];

            if (field.type === 'boolean') {
            return value !== null && value !== undefined;
            }

            return value !== null &&
                value !== undefined &&
                String(value).trim() !== '';
        });

        this.isFullFormValid.set(valid);
    }

    onNumberChange(
        key: string,
        event: Event,
        action: 'create' | 'update'
    ) {

        const value =
            (event.target as HTMLInputElement).value;

        const state =
            action === 'create'
                ? this.formCreateState
                : this.formUpdateState;

        if (value === '') {

            state[key] = '';

            this.updateFormValidity(action);

            return;
        }

        const parsed = Number(value);

        state[key] =
            Number.isNaN(parsed)
                ? 0
                : parsed;

        this.updateFormValidity(action);
    }

    closeModal(
        action: string = 'create',
        mode: string = 'single'
    ) {

        this.isClosing.set(true);

        if (action !== 'delete') {
            this.isFormValid.set(false);
        }

        if (action === 'create' && mode === 'full') {
            this.isFullFormValid.set(false);
        }

        setTimeout(() => {

            if (action === 'menu') {
                this.isCreateModeOpen.set(false);
            }

            if (action === 'create') {

                this.createState.set({
                    open: false,
                    mode: mode as CreateMode
                });

                this.isCreateOpen.set(false);
            }

            if (action === 'update') {
                this.isUpdateOpen.set(false);
            }

            if (action === 'delete') {
                this.isDeleteOpen.set(false);
            }

            if (action === 'filter') {
                this.isFilterOpen.set(false);
            }

            this.isClosing.set(false);

            if (action !== 'delete') {
                this.isDirty.set(false);
            }

        }, 200);
    }

    // =========================================================
    // VALIDATION
    // =========================================================

    private updateFormValidity(
        action: 'create' | 'update'
    ) {

        const model =
            action === 'create'
                ? this.createModel
                : this.updateModel;

        const state =
            action === 'create'
                ? this.formCreateState
                : this.formUpdateState;

        if (!model) {

            this.isFormValid.set(false);

            return;
        }

        for (const field of model.fields) {

            const value =
                state[field.key];

            const isEmpty =
                value === null ||
                value === undefined ||
                value === '';

            if (field.required && isEmpty) {

                this.isFormValid.set(false);

                return;
            }

            if (!field.required && isEmpty) {
                continue;
            }

            if (
                field.type === 'number' ||
                field.type === 'int'
            ) {

                const num =
                    Number(value);

                if (
                    !Number.isFinite(num) ||
                    num <= 0
                ) {

                    this.isFormValid.set(false);

                    return;
                }
            }
        }

        this.isFormValid.set(true);
    }

    // =========================================================
    // UPDATE CONTROL
    // =========================================================

    hasChanges(): boolean {

        return JSON.stringify(
            this.formUpdateState
        ) !== JSON.stringify(
            this.originalFormState
        );
    }

    discardChanges() {

        this.closeDiscardWarning();

        this.forceCloseUpdate();
    }

    closeDiscardWarning() {

        this.isClosingDialog.set(true);

        setTimeout(() => {

            this.isClosingDialog.set(false);

            this.isDiscardWarningOpen.set(false);

        }, 200);
    }

    closeUpdateModal(
        action: UpdateModalAction = 'close'
    ) {

        if (action === 'reset') {

            this.formUpdateState =
                structuredClone(
                    this.originalFormState
                );

            this.updateFormValidity('update');

            return;
        }

        if (this.hasChanges()) {

            this.isDiscardWarningOpen.set(true);

            this.isOpeningDialog.set(true);

            setTimeout(() => {
                this.isOpeningDialog.set(false);
            }, 16);

            return;
        }

        this.forceCloseUpdate();
    }

    forceCloseUpdate() {
        this.closeModal('update');
    }

    // =========================================================
    // HELPERS
    // =========================================================

    private updateDirtyState() {

        this.isDirty.set(
            JSON.stringify(
                this.formUpdateState
            ) !== JSON.stringify(
                this.originalFormState
            )
        );
    }

    private normalizeBoolean(value: any): boolean | null {

        if (value === true || value === 1 || value === '1') {
            return true;
        }

        if (value === false || value === 0 || value === '0') {
            return false;
        }

        if (typeof value === 'string') {

            const normalized = value
                .trim()
                .toLowerCase();

            if (normalized === 'true') {
                return true;
            }

            if (normalized === 'false') {
                return false;
            }
        }

        return null;
    }

    // =========================================================
    // ROLE MAPPING
    // =========================================================

    getRoleClass = getRoleClass;
    getRoleIcon = getRoleIcon;
    getRoleLabel = getRoleLabel;

    // =========================================================
    // MENU
    // =========================================================

    activeMenuRow: UsersResponse | null = null;

    openMenuId: string | null = null;

    menuPosition = {
        top: 0,
        left: 0
    };

    toggleMenu(
        id: string,
        event: MouseEvent,
        row?: UsersResponse
    ) {

        if (this.openMenuId === id) {

            this.openMenuId = null;
            this.activeMenuRow = null;

            return;
        }

        const btn =
            event.currentTarget as HTMLElement;

        const rect =
            btn.getBoundingClientRect();

        this.menuPosition = {

            top: rect.bottom + 6,

            left: rect.right - 176

        };

        this.openMenuId = id;

        this.activeMenuRow =
            row ?? null;
    }

    closeMenu() {
        this.openMenuId = null;
    }



    // =========================================================
    // PHONE — FULL USER CREATE
    // =========================================================

    /**
     * País predeterminado para el formulario de usuario completo.
     */
    readonly defaultPhoneCountryCode = '+505';

    /**
     * Países disponibles para el selector telefónico.
     */
    readonly phoneCountries = PHONE_COUNTRIES;

    /**
     * País seleccionado actualmente en el formulario
     * de creación de usuario completo.
     */
    createPhoneCountry =
        this.getPhoneCountry(
            this.defaultPhoneCountryCode
        );

    /**
     * Obtiene un país a partir de su código telefónico.
     */
    getPhoneCountry(
        code: string | null | undefined
    ): PhoneCountry {

        if (!code) {

            return PHONE_COUNTRIES.find(
                country =>
                    country.code ===
                    this.defaultPhoneCountryCode
            ) ?? PHONE_COUNTRIES[0];

        }

        return PHONE_COUNTRIES.find(
            country =>
                country.code === code
        ) ?? (
            PHONE_COUNTRIES.find(
                country =>
                    country.code ===
                    this.defaultPhoneCountryCode
            ) ?? PHONE_COUNTRIES[0]
        );
    }

    /**
     * Convierte un código ISO en emoji de bandera.
     */
    isoToFlagEmoji(
        iso: string | null | undefined
    ): string {

        if (!iso || iso.length !== 2) {
            return '🏳️';
        }

        return [...iso.toUpperCase()]
            .map(char =>
                String.fromCodePoint(
                    127397 +
                    char.charCodeAt(0)
                )
            )
            .join('');
    }

    /**
     * Cambia el país telefónico del formulario
     * de creación de usuario completo.
     */
    onCreatePhoneCountryChange(
        countryCode: string
    ) {

        this.createPhoneCountry =
            this.getPhoneCountry(countryCode);

        const current =
            this.formFullCreateState['telefono'] ?? '';

        const national =
            this.extractNationalPhone(current);

        this.formFullCreateState = {
            ...this.formFullCreateState,
            telefono:
                this.formatPhoneNumber(
                    countryCode,
                    national
                )
        };

        this.updateFullFormValidity();
    }

    /**
     * Maneja la escritura del teléfono.
     *
     * El usuario solamente introduce el número nacional.
     * El código internacional se agrega automáticamente.
     */
    onCreatePhoneInput(
    event: Event
) {

    const input =
        event.target as HTMLInputElement;

    const country =
        this.createPhoneCountry;

    const digits =
        this.extractNationalPhone(
            input.value
        );

    const limited =
        digits.slice(
            0,
            country.digits
        );

    const formatted =
        this.formatPhoneNumber(
            country.code,
            limited
        );

    this.formFullCreateState = {
        ...this.formFullCreateState,
        telefono: formatted
    };

    this.updateFullFormValidity();
}

    /**
     * Obtiene únicamente la parte nacional
     * del teléfono para mostrarla en el input.
     *
     * Ejemplo:
     *
     * +505 8269 2155
     *       ↓
     * 8269 2155
     */
    getCreatePhoneNumber(): string {

        const phone =
            this.formFullCreateState['telefono'];

        if (!phone) {
            return '';
        }

        const dialCode =
            this.createPhoneCountry.code;

        if (phone.startsWith(dialCode)) {

            return phone
                .slice(dialCode.length)
                .trim();

        }

        return phone;
    }

    /**
     * Extrae solamente los dígitos nacionales.
     */
    extractNationalPhone(
        value: string | null | undefined
    ): string {

        if (!value) {
            return '';
        }

        const digits =
            this.onlyDigits(value);

        if (!digits) {
            return '';
        }

        const country =
            this.findPhoneCountryFromNumber(
                value
            );

        if (!country) {
            return digits;
        }

        const prefix =
            this.onlyDigits(
                country.code
            );

        if (digits.startsWith(prefix)) {
            return digits.slice(
                prefix.length
            );
        }

        return digits;
    }

    /**
     * Conserva únicamente números.
     */
    onlyDigits(
        value: string | null | undefined
    ): string {

        return String(value ?? '')
            .replace(/\D/g, '');
    }

    /**
     * Busca el país correspondiente al teléfono.
     */
    private findPhoneCountryFromNumber(
        value: string
    ): PhoneCountry | undefined {

        const digits =
            this.onlyDigits(value);

        return [...PHONE_COUNTRIES]
            .sort(
                (a, b) =>
                    b.code.length -
                    a.code.length
            )
            .find(country =>
                digits.startsWith(
                    this.onlyDigits(
                        country.code
                    )
                )
            );
    }

    /**
     * Formatea el teléfono según el país.
     */
    formatPhoneNumber(
        countryCode: string,
        nationalNumber: string
    ): string {

        const country =
            this.getPhoneCountry(
                countryCode
            );

        let digits =
            this.onlyDigits(
                nationalNumber
            );

        digits =
            digits.slice(
                0,
                country.digits
            );

        if (!digits) {
            return '';
        }

        const groups =
            this.getPhoneGroups(
                country,
                digits
            );

        return [
            country.code,
            ...groups
        ].join(' ');
    }

    /**
     * Define la agrupación visual de los dígitos.
     */
    private getPhoneGroups(
        country: PhoneCountry,
        digits: string
    ): string[] {

        if (country.code === '+505') {

            return this.groupDigits(
                digits,
                [4, 4]
            );

        }

        if (
            country.code === '+502' ||
            country.code === '+503' ||
            country.code === '+504' ||
            country.code === '+506' ||
            country.code === '+509'
        ) {

            return this.groupDigits(
                digits,
                [4, 4]
            );

        }

        if (
            country.code === '+507' ||
            country.code === '+591' ||
            country.code === '+592' ||
            country.code === '+595' ||
            country.code === '+598'
        ) {

            return this.groupDigits(
                digits,
                [3, 4]
            );

        }

        if (
            country.code === '+52' ||
            country.code === '+54' ||
            country.code === '+55' ||
            country.code === '+57'
        ) {

            return this.groupDigits(
                digits,
                [3, 3, 4]
            );

        }

        if (country.code === '+1') {

            return this.groupDigits(
                digits,
                [3, 3, 4]
            );

        }

        if (country.digits === 8) {

            return this.groupDigits(
                digits,
                [4, 4]
            );

        }

        if (country.digits === 9) {

            return this.groupDigits(
                digits,
                [3, 3, 3]
            );

        }

        if (country.digits === 10) {

            return this.groupDigits(
                digits,
                [3, 3, 4]
            );

        }

        if (country.digits === 11) {

            return this.groupDigits(
                digits,
                [3, 4, 4]
            );

        }

        return this.groupDigits(
            digits,
            [3, 4, 4]
        );
    }

    /**
     * Divide los dígitos en grupos visuales.
     */
    private groupDigits(
        digits: string,
        groups: number[]
    ): string[] {

        const result: string[] = [];

        let position = 0;

        for (const size of groups) {

            if (position >= digits.length) {
                break;
            }

            result.push(
                digits.slice(
                    position,
                    position + size
                )
            );

            position += size;
        }

        if (position < digits.length) {

            result.push(
                digits.slice(position)
            );

        }

        return result;
    }

    /**
     * Valida que el teléfono tenga la cantidad
     * correcta de dígitos para el país seleccionado.
     */
    isValidCreatePhoneNumber(
        value: string | null | undefined
    ): boolean {

        if (!value) {
            return false;
        }

        const country =
            this.createPhoneCountry;

        const national =
            this.extractNationalPhone(
                value
            );

        return national.length ===
            country.digits;
    }

    PHONE_COUNTRY_WIDTH = PHONE_COUNTRY_WIDTH;
    PHONE_INPUT_PLACEHOLDER = PHONE_INPUT_PLACEHOLDER;
    PHONE_COUNTRY_SELECT_PLACEHOLDER = PHONE_COUNTRY_SELECT_PLACEHOLDER;
    PHONE_NUMBER_MAX_LENGTH = PHONE_NUMBER_MAX_LENGTH;
}