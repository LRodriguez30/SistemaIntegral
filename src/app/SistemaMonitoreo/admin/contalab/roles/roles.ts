import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// Service and Type isolation
import type {
    CreateRol,
    UpdateRol,
    RolesResponse
} from '../../../../services/roles.service';

import { RolesService } from '../../../../services/roles.service';

import type { RolesFilter } from './roles.filter';

// Combined Material Table imports
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

import { DynamicCreateModel } from '../../helpers/ActionsHelper';

import { InitializeTableSchema, HIDDEN_COLUMNS } from './roles.schema';
import { InitializeFilterEngine } from './roles.filter';

import {
    getRoleClass,
    getRoleIcon,
    getRoleLabel
} from './roles.ui';

import { InitializeDefaultValues } from '../../helpers/FormInit';

type UpdateModalAction = 'close' | 'reset';
type RolesFilterKey = keyof RolesFilter;
type CreateMode = 'menu' | 'single' | 'multi' | 'import';

@Component({
    selector: 'app-roles',
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
    templateUrl: './roles.html',
    styleUrl: './roles.css',
})
export class Roles {

    // =========================================================
    // CONSTRUCTOR / INIT
    // =========================================================

    constructor(
        private readonly rolesService: RolesService
    ) {
        this.loadData();
    }

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

                const rowCount =
                    Math.max(lines.length - 1, 0);

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
                    'nombre_rol',
                    'descripcion',
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
                    'nombre_rol',
                    'descripcion',
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

                    const estado =
                        this.normalizeBoolean(
                            row['estado']
                        );

                    if (estado === null) {

                        this.csvError.set(
                            `El estado de la fila ${i + 1} no es válido. Use true o false`
                        );

                        return;
                    }

                    row['estado'] = estado;

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
            'nombre_rol',
            'descripcion',
            'estado'
        ];

        const example = [
            'Administrador',
            'Rol de administrador del sistema',
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
        link.download = 'plantilla_roles.csv';

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

    isDiscardWarningOpen = signal(false);

    isCreateOpen = signal(false);
    isSubmitting = signal(false);

    hideGuidColumns = signal(true);

    // =========================================================
    // DATA MODELS
    // =========================================================

    deleteTarget: RolesResponse | null = null;
    updateTarget: RolesResponse | null = null;

    updateModel: DynamicCreateModel | null = null;

    createModel: DynamicCreateModel = {

        title: 'Nuevo rol',

        endpoint: `/roles`,

        fields: [

            {
                key: 'nombre_rol',
                label: 'Nombre del Rol',
                type: 'text',
                required: true
            },

            {
                key: 'descripcion',
                label: 'Descripción',
                type: 'text',
                required: true
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
    formUpdateState: Record<string, any> = {};
    originalFormState: Record<string, any> = {};

    dataSource =
        new MatTableDataSource<RolesResponse>();

    // =========================================================
    // FILTER STATE
    // =========================================================

    filterEngine = InitializeFilterEngine();

    isFilterOpen = signal(false);
    activeFilterCount = signal(0);
    isFilterDiscardWarningOpen = signal(false);

    filterState =
        this.filterEngine.createState() as RolesFilter;

    savedFilterState =
        structuredClone(this.filterState);

    readonly filterRules =
        this.filterEngine.rules;

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

    getFilterValue(field: RolesFilterKey) {
        return this.filterState[field];
    }

    setFilterValue(
        field: RolesFilterKey,
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

        if (f.rol_id !== '') count++;
        if (f.nombre_rol !== '') count++;
        if (f.descripcion !== '') count++;
        if (f.estado !== null) count++;

        this.activeFilterCount.set(count);

        this.savedFilterState =
            structuredClone(this.filterState);

        this.closeFilter();
    }

    // =========================================================
    // FILTERING
    // =========================================================

    searchText = signal('');

    loadFilters(f: RolesFilter) {

        this.dataSource.filterPredicate =
            (row: RolesResponse) => {

                if (
                    f.rol_id &&
                    !row.rol_id
                        .toString()
                        .toLowerCase()
                        .includes(
                            f.rol_id
                                .toString()
                                .toLowerCase()
                        )
                ) {
                    return false;
                }

                if (
                    f.nombre_rol &&
                    !row.nombre_rol
                        .toLowerCase()
                        .includes(
                            f.nombre_rol.toLowerCase()
                        )
                ) {
                    return false;
                }

                if (
                    f.descripcion &&
                    !row.descripcion
                        .toLowerCase()
                        .includes(
                            f.descripcion.toLowerCase()
                        )
                ) {
                    return false;
                }

                if (
                    f.estado !== null &&
                    row.estado !== f.estado
                ) {
                    return false;
                }

                if (
                    this.searchText() &&
                    !this.buildSearchText(row)
                        .includes(this.searchText())
                ) {
                    return false;
                }

                return true;
            };

        this.dataSource.filter =
            this.searchText() || 'active';
    }

    clearFilter() {

        this.filterState = {
            rol_id: '',
            nombre_rol: '',
            descripcion: '',
            estado: null
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
        row: RolesResponse
    ): string {

        return [
            row.rol_id,
            row.nombre_rol,
            row.descripcion,
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

        this.rolesService.getRoles().subscribe({

            next: data => {

                this.dataSource.data = [...data];

                this.loadFilters(
                    this.filterState
                );

                this.isLoaded.set(true);
            },

            error: err => {

                console.error(
                    'Error cargando roles',
                    err
                );

                this.isApiError.set(true);
                this.isLoaded.set(false);
            }
        });
    }

    getRowIndex(
        row: RolesResponse
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

        if (rows.length === 0) {
            return;
        }

        this.isSubmitting.set(true);

        let completed = 0;

        const finish = () => {

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
        };

        rows.forEach(row => {

            const payload: CreateRol = {

                nombre_rol:
                    row['nombre_rol'],

                descripcion:
                    row['descripcion'],

                estado:
                    Boolean(row['estado'])
            };

            this.rolesService
                .createRol(payload)
                .subscribe({

                    next: () => {
                        finish();
                    },

                    error: err => {

                        console.error(
                            'Error creando rol',
                            err
                        );

                        finish();
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

        setTimeout(() => {

            if (mode === 'multi') {
                this.multiRows.set([]);
            }

            this.createState.set({
                open: true,
                mode
            });

            this.isCreateOpen.set(true);

            this.updateFormValidity('create');

            this.isOpening.set(true);

            setTimeout(() => {
                this.isOpening.set(false);
            }, 16);

        }, 60);
    }

    submitCreate() {

        this.isSubmitting.set(true);

        const payload: CreateRol = {

            nombre_rol:
                this.formCreateState[
                    'nombre_rol'
                ],

            descripcion:
                this.formCreateState[
                    'descripcion'
                ],

            estado:
                Boolean(
                    this.formCreateState['estado']
                )
        };

        this.rolesService
            .createRol(payload)
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
                        'Error creando rol',
                        err
                    );

                    this.isSubmitting.set(false);
                }
            });
    }

    // =========================================================
    // UPDATE FLOW
    // =========================================================

    updateRol(row: RolesResponse) {

        this.updateTarget = row;

        this.updateModel = {

            title: 'Actualizar rol',

            endpoint: `/roles`,

            fields: [

                {
                    key: 'nombre_rol',
                    label: 'Nombre del Rol',
                    type: 'text',
                    required: true
                },

                {
                    key: 'descripcion',
                    label: 'Descripción',
                    type: 'text',
                    required: true
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

            nombre_rol:
                row.nombre_rol,

            descripcion:
                row.descripcion,

            estado:
                row.estado
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

        const payload: UpdateRol = {

            nombre_rol:
                this.formUpdateState[
                    'nombre_rol'
                ],

            descripcion:
                this.formUpdateState[
                    'descripcion'
                ],

            estado:
                Boolean(
                    this.formUpdateState[
                        'estado'
                    ]
                )
        };

        this.rolesService
            .updateRol(
                payload,
                this.updateTarget.rol_id
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
                        'Error actualizando rol',
                        err
                    );

                    this.isUpdating.set(false);
                }
            });
    }

    // =========================================================
    // DELETE FLOW
    // =========================================================

    deleteRol(row: RolesResponse) {

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

        this.rolesService
            .deleteRol(
                this.deleteTarget.rol_id
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
                        'Error eliminando rol',
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

    private normalizeBoolean(
        value: any
    ): boolean | null {

        if (
            value === true ||
            value === 1 ||
            value === '1'
        ) {
            return true;
        }

        if (
            value === false ||
            value === 0 ||
            value === '0'
        ) {
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

    activeMenuRow: RolesResponse | null = null;

    openMenuId: string | null = null;

    menuPosition = {
        top: 0,
        left: 0
    };

    toggleMenu(
        id: string,
        event: MouseEvent,
        row?: RolesResponse
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
}