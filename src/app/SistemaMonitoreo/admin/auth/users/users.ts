import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// Service and Type isolation
import { UsersService } from '../../../../services/users.service';
import type { CreateUser, GrantRole, UsersResponse, UsersRole } from '../../../../services/users.service';
import type { UserFilter } from './users.filter';

// Combined Material Table imports to fix static evaluation error
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

import { DynamicCreateModel } from '../../helpers/ActionsHelper';

import { InitializeTableSchema, GUID_COLUMNS } from './users.schema';
import { InitializeFilterEngine } from './users.filter';
import { getRoleClass, getRoleIcon, getRoleLabel } from './users.ui';
import { InitializeDefaultValues } from '../../helpers/FormInit';
import { isValidGuid } from '../../helpers/Validators';
import { AuthService } from '../../../../services/auth.service';

type UpdateModalAction = 'close' | 'reset';
type UserFilterKey = keyof UserFilter;
type CreateMode = 'menu' | 'single' | 'multi' | 'import';

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
                    'name',
                    'email',
                    'password',
                    'role'
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
                }
                else {
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
                    'name',
                    'email',
                    'password',
                    'role'
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

                    row["total"] = Number(row["total"]);
                    row["cantidadProductos"] = Number(row["cantidadProductos"]);

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
            'name',
            'email',
            'password',
            'role'
        ];

        const example = [
            'María López',
            'maria.lopez@empresa.com',
            'SecurePass@2026',
            'Organizador'
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

        if (this.uploadedCsvFiles().length > 0) {

            this.createState.set({
                open: true,
                mode: 'import'
            });

            return;
        }

        this.createState.set({
            open: true,
            mode: 'import'
        })
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

    multiRows = signal<any[]>([]);

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
    deleteTarget: UsersResponse | null = null;
    updateTarget: UsersResponse | null = null;

    updateModel: DynamicCreateModel | null = null;
    createModel: DynamicCreateModel = {
        title: 'Nuevo usuario',
        endpoint: `/users`,
        fields: [
            { key: 'name', label: 'Nombre', type: 'text', required: true },
            { key: 'email', label: 'Email', type: 'text', required: true },

            {
                key: 'password',
                label: 'Contraseña',
                type: 'password',
                required: true
            },

            {
                key: 'role',
                label: 'Rol',
                type: 'select',
                required: true,
                options: [
                    { label: 'Admin', value: 'Admin' },
                    { label: 'Organizador', value: 'Organizador' },
                    { label: 'Visitante', value: 'Visitante' }
                ]
            }
        ]
    } as DynamicCreateModel;

    formCreateState: Record<string, any> = {};
    formUpdateState: Record<string, any> = {};
    originalFormState: Record<string, any> = {};

    dataSource = new MatTableDataSource<UsersResponse>();

    // =========================================================
    // FILTER STATE
    // =========================================================
    filterEngine = InitializeFilterEngine();

    isFilterOpen = signal(false);
    activeFilterCount = signal(0);
    isFilterDiscardWarningOpen = signal(false);

    filterState = this.filterEngine.createState() as UserFilter;
    savedFilterState = structuredClone(this.filterState);
    readonly filterRules = this.filterEngine.rules;

    toggleMulti(field: UserFilterKey, valor: string) {
        const current = this.filterState[field] as string[];
        const idx = current.indexOf(valor);

        (this.filterState[field] as string[]) = idx === -1
            ? [...current, valor]
            : current.filter(v => v !== valor);
    }

    setRangeValue(field: UserFilterKey, key: 'min' | 'max' | 'from' | 'to', raw: string) {
        const current = { ...(this.filterState[field] as any) };

        if (key === 'min' || key === 'max') {
            current[key] = raw === '' ? null : Number(raw);
        } else {
            current[key] = raw;
        }

        this.filterState[field] = current;
    }

    asRange(value: any): { min: number | null; max: number | null } {
        return value as { min: number | null; max: number | null };
    }

    asDateRange(value: any): { from: string; to: string } {
        return value as { from: string; to: string };
    }

    getFilterValue(
        field: UserFilterKey
    ) {
        return this.filterState[field];
    }

    setFilterValue(
        field: UserFilterKey,
        value: any
    ) {
        this.filterState[field] = value;
    }

    openFilter() {
        this.isFilterOpen.set(true);
        this.isOpening.set(true);

        setTimeout(() => {
            this.isOpening.set(false);
        }, 16)
    }

    closeFilterDiscardWarning() {
        this.isFilterDiscardWarningOpen.set(false);
    }

    closeFilter(discardConfirmation: boolean = false) {
        const changes = JSON.stringify(this.filterState) != JSON.stringify(this.savedFilterState);
        console.log(this.filterState, this.savedFilterState, changes)

        if (changes) {

            if (this.confirmFilterDiscard(discardConfirmation)) return;
            this.isFilterDiscardWarningOpen.set(true);
            return;
        }

        if (this.confirmFilterDiscard(discardConfirmation)) return;

        this.closeModal("filter");
    }

    confirmFilterDiscard(discardConfirmation: boolean): boolean {
        if (discardConfirmation) {
            this.filterState = structuredClone(this.savedFilterState);
            this.closeFilterDiscardWarning();
            this.closeModal("filter");
            return true;
        }
        else return false;
    }

    applyFilter() {
        const f = this.filterState;

        this.loadFilters(f);

        let count = 0;

        if (f.role.length > 0) count += f.role.length;
        if (f.created_at.from || f.created_at.to) count++;
        if (f.updated_at.from || f.updated_at.to) count++;
        if (f.last_login.from || f.last_login.to) count++;
        if (f.name) count++;
        if (f.email) count++;

        this.activeFilterCount.set(count);

        this.savedFilterState = structuredClone(this.filterState);

        this.closeFilter();
    }

    searchText = signal('');
    loadFilters(f: UserFilter) {
        this.dataSource.filterPredicate = (row: UsersResponse, filter: string) => {

            // FILTRO GLOBAL
            if (
                filter &&
                !this.buildSearchText(row).includes(filter) &&
                this.searchText()
            ) {
                return false;
            }

            // ROLE (multi select)
            if (f.role.length > 0 && !f.role.includes(row.role as UsersRole)) {
                return false;
            }

            // CREATED_AT
            if (f.created_at.from) {
                const desde = new Date(f.created_at.from);
                if (new Date(row.created_at) < desde) return false;
            }

            if (f.created_at.to) {
                const hasta = new Date(f.created_at.to);
                hasta.setHours(23, 59, 59);
                if (new Date(row.created_at) > hasta) return false;
            }

            // UPDATED_AT
            if (f.updated_at.from) {
                const desde = new Date(f.updated_at.from);
                if (new Date(row.updated_at) < desde) return false;
            }

            if (f.updated_at.to) {
                const hasta = new Date(f.updated_at.to);
                hasta.setHours(23, 59, 59);
                if (new Date(row.updated_at) > hasta) return false;
            }

            // LAST_LOGIN
            if (f.last_login.from) {
                const desde = new Date(f.last_login.from);
                if (new Date(row.last_login) < desde) return false;
            }

            if (f.last_login.to) {
                const hasta = new Date(f.last_login.to);
                hasta.setHours(23, 59, 59);
                if (new Date(row.last_login) > hasta) return false;
            }

            // NAME (contains)
            if (f.name && !row.name.toLowerCase().includes(f.name.toLowerCase())) {
                return false;
            }

            // EMAIL (contains)
            if (f.email && !row.email.toLowerCase().includes(f.email.toLowerCase())) {
                return false;
            }

            return true;
        };

        this.dataSource.filter = 'active';
    }

    clearFilter() {
        this.filterState = {
            id: '',
            role: [],
            name: '',
            email: '',
            created_at: { from: '', to: '' },
            updated_at: { from: '', to: '' },
            last_login: { from: '', to: '' }
        };
        this.savedFilterState = structuredClone(this.filterState);

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

        this.dataSource.filter = value || 'active';
    }

    private globalFilterPredicate() {

        return (
            row: UsersResponse,
            filter: string
        ) => {
            console.log(this.buildSearchText(row).includes(filter))
            return this.buildSearchText(row).includes(filter);
        };
    }

    private buildSearchText(row: UsersResponse): string {
        return [
            row.id,
            row.name,
            row.email,
            row.role,
            row.created_at,
            row.updated_at,
            row.last_login
        ].join(' ').toLowerCase();
    }

    get visibleColumns(): string[] {

        if (!this.hideGuidColumns()) {
            return this.displayedColumns;
        }

        return this.displayedColumns.filter(
            col => !this.guidColumns.includes(col)
        );
    }

    // =========================================================
    // TABLE CONFIG
    // =========================================================
    ventasSchema = InitializeTableSchema();

    get displayedColumns(): string[] {
        return this.ventasSchema.fields
            .filter(f => f.type !== 'actions' || f.source === 'ui')
            .map(f => f.key as string);
    }

    get columnLabels(): Record<string, string> {
        return Object.fromEntries(
            this.ventasSchema.fields.map(f => [f.key, f.label])
        );
    }

    get columnConfig(): Record<string, { type: string }> {
        return Object.fromEntries(
            this.ventasSchema.fields.map(f => [
                f.key,
                { type: f.type }
            ])
        );
    }

    guidColumns = GUID_COLUMNS;


    // =========================================================
    // DATA LOADING
    // =========================================================
    loadData() {
        this.isLoaded.set(false);
        this.isApiError.set(false);

        this.authService.refresh().subscribe({
            next: () => { },
            error: () => { }
        });

        this.usersService.getUsers().subscribe({
            next: (data) => {
                this.dataSource.data = [...data];
                this.isLoaded.set(true);
            },

            error: (err) => {
                console.error('Error cargando usuarios', err);
                this.isApiError.set(true);
                this.isLoaded.set(false);
            }
        });
    }

    getRowIndex(row: UsersResponse): number {
        return this.dataSource.data.indexOf(row) + 1;
    }

    // =========================================================
    // CREATE FLOW
    // =========================================================

    createRandomRow(): Record<string, any> {
        return InitializeDefaultValues(this.createModel);
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

    updateCell(rowIndex: number, key: string, value: any) {
        const rows = this.multiRows();

        rows[rowIndex] = {
            ...rows[rowIndex],
            [key]: value
        };

        this.multiRows.set([...rows]);
    }

    submitMultiCreate() {

        const payload: CreateUser[] = this.multiRows().map(r => ({
            name: r.name,
            email: r.email,
            password: r.password,
            role: r.role
        }));

        this.isSubmitting.set(true);

        // this.usersService.createUser(payload).subscribe({
        //     next: () => {
        //         this.isSubmitting.set(false);
        //         this.isClosing.set(true);

        //         setTimeout(() => {
        //             this.createState.set({
        //                 open: false,
        //                 mode: "multi"
        //             });

        //             this.multiRows.set([]);
        //             this.isClosing.set(false);
        //             this.loadData();
        //         }, 200);
        //     },

        //     error: (err) => {
        //         console.error('Error creando usuarios', err);
        //         this.isSubmitting.set(false);
        //     }
        // });
    }


    openCreateMenu() {
        this.createMode.set('menu');
        this.isCreateModeOpen.set(true);
    }

    openCreate(mode: CreateMode = "single") {
        this.isCreateModeOpen.set(false);

        // ACC: Objeto en construcción, FIELD: Propiedad actual
        this.formCreateState = InitializeDefaultValues(this.createModel);

        setTimeout(() => {
            if (mode === 'multi') this.multiRows.set([]);

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

        const payload: CreateUser = {
            name: this.formCreateState['name'],
            email: this.formCreateState['email'],
            password: this.formCreateState['password'],
            role: this.formCreateState['role']
        };

        this.isSubmitting.set(true);

        this.usersService.createUser(payload).subscribe({
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

            error: (err) => {
                console.error('Error creando usuario', err);
                this.isSubmitting.set(false);
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
            endpoint: `/users`,
            fields: [
                {
                    key: 'role', label: 'Rol', type: 'select', required: true,
                    options: [
                        { label: 'Admin', value: 'Admin' },
                        { label: 'Organizador', value: 'Organizador' },
                        { label: 'Visitante', value: 'Visitante' }
                    ]
                }
            ]
        };

        this.formUpdateState = {
            role: row.role
        };

        this.originalFormState = structuredClone(this.formUpdateState);
        this.isUpdateOpen.set(true);
        this.updateFormValidity('update');
        this.isOpening.set(true);
        setTimeout(() => this.isOpening.set(false), 16);
    }

    submitUpdate() {

        if (!this.updateTarget) return;

        this.isUpdating.set(true);

        const payload: GrantRole = {
            id: this.updateTarget.id,
            role: this.formUpdateState['role']
        };

        this.usersService.grantRole(payload).subscribe({

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

            error: (err: any) => {
                console.error('Error otorgando permisos de usuario', err);
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

        this.usersService.deleteUser(
            this.deleteTarget.id
        ).subscribe({

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

            error: (err) => {
                console.error('Error eliminando usuario', err);
                this.isDeleting.set(false);
            }
        });
    }

    closeDeleteModal() {
        this.closeModal("delete");
    }

    // =========================================================
    // FORM CONTROL
    // =========================================================
    setFieldValue(key: string, value: any, action: 'create' | 'update') {
        if (action === 'create') {
            this.formCreateState[key] = value;
        } else {
            this.formUpdateState[key] = value;
        }
        this.isDirty.set(true);
        this.updateDirtyState();
        this.updateFormValidity(action);
    }

    onNumberChange(key: string, event: Event, action: 'create' | 'update') {

        const value = (event.target as HTMLInputElement).value;
        const state = action === 'create' ? this.formCreateState : this.formUpdateState;

        if (value === '') {
            state[key] = '';
            this.updateFormValidity(action);
            return;
        }

        const parsed = Number(value);
        state[key] = isNaN(parsed) ? 0 : parsed;

        this.updateFormValidity(action);
    }

    closeModal(action: string = "create", mode: string = "single") {
        this.isClosing.set(true);

        if (action != "delete") {
            this.isFormValid.set(false);
        }

        setTimeout(() => {
            if (action === "menu") this.isCreateModeOpen.set(false);
            if (action === "create") this.createState.set({
                open: false,
                mode: mode as CreateMode
            });
            if (action === "update") this.isUpdateOpen.set(false);
            if (action === "delete") this.isDeleteOpen.set(false);
            if (action === "filter") this.isFilterOpen.set(false);

            this.isClosing.set(false);

            if (action != "delete") this.isDirty.set(false);
        }, 200);
    }

    // =========================================================
    // VALIDATION
    // =========================================================
    private updateFormValidity(action: 'create' | 'update') {

        const model = action === 'create' ? this.createModel : this.updateModel;
        const state = action === 'create' ? this.formCreateState : this.formUpdateState;

        if (!model) {
            this.isFormValid.set(false);
            return;
        }

        for (const field of model.fields) {
            const value = state[field.key];

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

            if (field.type === 'guid' || field.type === 'guid-text') {
                if (!isValidGuid(value)) {
                    this.isFormValid.set(false);
                    return;
                }
            }

            if (field.type === 'number' || field.type === 'int') {

                const num = Number(value);

                if (!Number.isFinite(num) || num <= 0) {
                    this.isFormValid.set(false);
                    return;
                }
            }
        }

        this.isFormValid.set(true);
    }

    // =========================================================
    // UPDATE CONTROL HELPERS
    // =========================================================
    hasChanges(): boolean {
        return JSON.stringify(this.formUpdateState) !== JSON.stringify(this.originalFormState);
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

    closeUpdateModal(action: UpdateModalAction = 'close') {

        if (action === 'reset') {
            this.formUpdateState = structuredClone(this.originalFormState);
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
        this.closeModal("update");
    }

    // =========================================================
    // HELPERS
    // =========================================================
    private updateDirtyState() {
        this.isDirty.set(
            JSON.stringify(this.formUpdateState) !== JSON.stringify(this.originalFormState)
        );
    }


    // =========================================================
    // EVENT TYPE MAPPING
    // =========================================================
    getRoleClass = getRoleClass;
    getRoleIcon = getRoleIcon;
    getRoleLabel = getRoleLabel;

    activeMenuRow: UsersResponse | null = null;

    openMenuId: string | null = null;
    menuPosition = { top: 0, left: 0 };

    toggleMenu(id: string, event: MouseEvent, row?: UsersResponse) {
        if (this.openMenuId === id) {
            this.openMenuId = null;
            this.activeMenuRow = null;
            return;
        }

        const btn = event.currentTarget as HTMLElement;
        const rect = btn.getBoundingClientRect();

        this.menuPosition = {
            top: rect.bottom + 6,
            left: rect.right - 176
        };

        this.openMenuId = id;
        this.activeMenuRow = row ?? null;
    }

    closeMenu() {
        this.openMenuId = null;
    }
}