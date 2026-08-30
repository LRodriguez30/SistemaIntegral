import {
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    signal
} from '@angular/core';

import {
    CommonModule,
    DatePipe
} from '@angular/common';

import {
    MatTableModule,
    MatTableDataSource
} from '@angular/material/table';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { RefreshTokensService } from '../../../../services/refresh_tokens.service';

import type {
    CreateRefreshToken,
    UpdateRefreshToken,
    RefreshTokensResponse
} from '../../../../services/refresh_tokens.service';


type ModalType =
    | 'create'
    | 'details'
    | 'update'
    | 'delete'
    | null;


@Component({
    selector: 'app-refresh-tokens',
    standalone: true,

    imports: [
        CommonModule,
        DatePipe,
        MatTableModule,
        MatIconModule,
        MatButtonModule
    ],

    schemas: [
        CUSTOM_ELEMENTS_SCHEMA
    ],

    templateUrl: './refresh_tokens.html',
    styleUrl: './refresh_tokens.css'
})
export class RefreshTokens {

    // =========================================================
    // TABLE
    // =========================================================

    dataSource =
        new MatTableDataSource<RefreshTokensResponse>();

    readonly displayedColumns = [
        'user_id',
        'device_info',
        'last_activity_at',
        'expires_at',
        'revoked',
        'actions'
    ];


    // =========================================================
    // STATE
    // =========================================================

    isLoaded =
        signal(false);

    isApiError =
        signal(false);

    isRefreshing =
        signal(false);

    searchText =
        signal('');


    // =========================================================
    // MODALS
    // =========================================================

    activeModal =
        signal<ModalType>(null);

    isOpening =
        signal(false);

    isClosing =
        signal(false);


    // =========================================================
    // CREATE
    // =========================================================

    isCreating =
        signal(false);

    createForm = {
        user_id: '',
        token_hash: '',
        device_info: '',
        expires_at: '',
        revoked: false
    };


    // =========================================================
    // DETAILS
    // =========================================================

    selectedToken:
        RefreshTokensResponse | null = null;


    // =========================================================
    // UPDATE
    // =========================================================

    updateTarget:
        RefreshTokensResponse | null = null;

    isUpdating =
        signal(false);

    updateForm = {
        expires_at: '',
        last_activity_at: '',
        revoked: false
    };

    originalUpdateForm = {
        expires_at: '',
        last_activity_at: '',
        revoked: false
    };


    // =========================================================
    // DELETE
    // =========================================================

    deleteTarget:
        RefreshTokensResponse | null = null;

    isDeleting =
        signal(false);


    // =========================================================
    // ERRORS
    // =========================================================

    createError =
        signal<string | null>(null);

    updateError =
        signal<string | null>(null);

    deleteError =
        signal<string | null>(null);


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    constructor(
        private readonly refreshTokensService:
            RefreshTokensService
    ) {
        this.loadData();
    }


    // =========================================================
    // DATA
    // =========================================================

    loadData(): void {

        this.isLoaded.set(false);
        this.isApiError.set(false);

        this.refreshTokensService
            .getRefreshTokens()
            .subscribe({

                next: data => {

                    this.dataSource.data = [
                        ...data
                    ];

                    this.isLoaded.set(true);

                    this.applySearchFilter();
                },

                error: err => {

                    console.error(
                        'Error cargando refresh tokens',
                        err
                    );

                    this.isApiError.set(true);
                    this.isLoaded.set(false);
                }
            });
    }


    refreshData(): void {

        if (this.isRefreshing()) {
            return;
        }

        this.isRefreshing.set(true);

        this.refreshTokensService
            .getRefreshTokens()
            .subscribe({

                next: data => {

                    this.dataSource.data = [
                        ...data
                    ];

                    this.isLoaded.set(true);
                    this.isApiError.set(false);
                    this.isRefreshing.set(false);

                    this.applySearchFilter();
                },

                error: err => {

                    console.error(
                        'Error actualizando refresh tokens',
                        err
                    );

                    this.isApiError.set(true);
                    this.isRefreshing.set(false);
                }
            });
    }


    // =========================================================
    // SEARCH
    // =========================================================

    onSearch(event: Event): void {

        const input =
            event.target as HTMLInputElement;

        const value =
            input.value
                .trim()
                .toLowerCase();

        this.searchText.set(value);

        this.applySearchFilter();
    }


    clearSearch(): void {

        this.searchText.set('');

        this.applySearchFilter();
    }


    private applySearchFilter(): void {

        const value =
            this.searchText()
                .trim()
                .toLowerCase();

        this.dataSource.filterPredicate =
            (
                row: RefreshTokensResponse
            ) => {

                if (!value) {
                    return true;
                }

                return this.buildSearchText(row)
                    .includes(value);
            };

        this.dataSource.filter =
            value || ' ';
    }


    private buildSearchText(
        row: RefreshTokensResponse
    ): string {

        return [

            row.id,

            row.user_id,

            row.token_hash,

            JSON.stringify(
                row.device_info ?? {}
            ),

            row.last_activity_at ?? '',

            row.expires_at ?? '',

            row.last_extended_at ?? '',

            row.revoked
                ? 'revocado'
                : 'activo'

        ]
            .join(' ')
            .toLowerCase();
    }


    // =========================================================
    // STATISTICS
    // =========================================================

    get totalTokens(): number {

        return this.dataSource.data.length;
    }


    get activeTokens(): number {

        return this.dataSource.data
            .filter(
                token =>
                    !token.revoked
            )
            .length;
    }


    get revokedTokens(): number {

        return this.dataSource.data
            .filter(
                token =>
                    token.revoked
            )
            .length;
    }


    get expiredTokens(): number {

        const now =
            new Date();

        return this.dataSource.data
            .filter(token => {

                if (token.revoked) {
                    return false;
                }

                return new Date(
                    token.expires_at
                ) < now;

            })
            .length;
    }


    // =========================================================
    // CREATE
    // =========================================================

    openCreate(): void {

        this.resetCreateForm();

        this.createError.set(null);

        this.openModal('create');
    }


    resetCreateForm(): void {

        this.createForm = {

            user_id: '',

            token_hash: '',

            device_info:
                JSON.stringify(
                    {
                        browser: 'Chrome',
                        os: 'Windows',
                        device: 'Desktop'
                    },
                    null,
                    2
                ),

            expires_at: '',

            revoked: false
        };
    }


    setCreateField(
        field:
            keyof typeof this.createForm,
        value: any
    ): void {

        this.createForm = {

            ...this.createForm,

            [field]: value
        };
    }


    toggleCreateRevoked(): void {

        this.createForm = {

            ...this.createForm,

            revoked:
                !this.createForm.revoked
        };
    }


    submitCreate(): void {

        this.createError.set(null);

        if (
            !this.createForm.user_id.trim()
        ) {

            this.createError.set(
                'El ID del usuario es obligatorio.'
            );

            return;
        }

        if (
            !this.createForm.token_hash.trim()
        ) {

            this.createError.set(
                'El token hash es obligatorio.'
            );

            return;
        }

        if (
            !this.createForm.expires_at
        ) {

            this.createError.set(
                'La fecha de expiración es obligatoria.'
            );

            return;
        }

        const deviceInfo =
            this.parseDeviceInfo(
                this.createForm.device_info
            );

        if (!deviceInfo) {

            this.createError.set(
                'La información del dispositivo debe contener un JSON válido.'
            );

            return;
        }

        const payload:
            CreateRefreshToken = {

            user_id:
                this.createForm.user_id
                    .trim(),

            token_hash:
                this.createForm.token_hash
                    .trim(),

            device_info:
                deviceInfo,

            expires_at:
                this.toIsoDate(
                    this.createForm.expires_at
                ),

            revoked:
                this.createForm.revoked
        };

        this.isCreating.set(true);

        this.refreshTokensService
            .createRefreshToken(payload)
            .subscribe({

                next: () => {

                    this.isCreating.set(false);

                    this.closeModal();

                    this.loadData();
                },

                error: err => {

                    console.error(
                        'Error creando refresh token',
                        err
                    );

                    this.createError.set(
                        this.getErrorMessage(
                            err,
                            'No se pudo crear el refresh token.'
                        )
                    );

                    this.isCreating.set(false);
                }
            });
    }


    // =========================================================
    // DETAILS
    // =========================================================

    openDetails(
        row: RefreshTokensResponse
    ): void {

        this.selectedToken = row;

        this.openModal('details');
    }


    closeDetails(): void {

        this.closeModal();
    }


    // =========================================================
    // UPDATE
    // =========================================================

    openUpdate(
        row: RefreshTokensResponse
    ): void {

        this.updateTarget = row;

        this.updateForm = {

            expires_at:
                this.toDatetimeLocal(
                    row.expires_at
                ),

            last_activity_at:
                this.toDatetimeLocal(
                    row.last_activity_at
                ),

            revoked:
                row.revoked
        };

        this.originalUpdateForm = {
            ...this.updateForm
        };

        this.updateError.set(null);

        this.openModal('update');
    }


    setUpdateField(
        field:
            keyof typeof this.updateForm,
        value: any
    ): void {

        this.updateForm = {

            ...this.updateForm,

            [field]: value
        };
    }


    toggleUpdateRevoked(): void {

        this.updateForm = {

            ...this.updateForm,

            revoked:
                !this.updateForm.revoked
        };
    }


    hasUpdateChanges(): boolean {

        return JSON.stringify(
            this.updateForm
        ) !== JSON.stringify(
            this.originalUpdateForm
        );
    }


    resetUpdate(): void {

        this.updateForm = {
            ...this.originalUpdateForm
        };
    }


    submitUpdate(): void {

        if (!this.updateTarget) {
            return;
        }

        this.updateError.set(null);

        if (
            !this.updateForm.expires_at
        ) {

            this.updateError.set(
                'La fecha de expiración es obligatoria.'
            );

            return;
        }

        const payload:
            UpdateRefreshToken = {

            expires_at:
                this.toIsoDate(
                    this.updateForm.expires_at
                ),

            last_activity_at:
                this.updateForm.last_activity_at
                    ? this.toIsoDate(
                        this.updateForm.last_activity_at
                    )
                    : null,

            revoked:
                this.updateForm.revoked
        };

        this.isUpdating.set(true);

        this.refreshTokensService
            .updateRefreshToken(
                payload,
                this.updateTarget.id
            )
            .subscribe({

                next: () => {

                    this.isUpdating.set(false);

                    this.closeModal();

                    this.updateTarget = null;

                    this.loadData();
                },

                error: err => {

                    console.error(
                        'Error actualizando refresh token',
                        err
                    );

                    this.updateError.set(
                        this.getErrorMessage(
                            err,
                            'No se pudo actualizar el refresh token.'
                        )
                    );

                    this.isUpdating.set(false);
                }
            });
    }


    // =========================================================
    // REVOKE
    // =========================================================

    revokeToken(
        row: RefreshTokensResponse
    ): void {

        if (row.revoked) {
            return;
        }

        const payload:
            UpdateRefreshToken = {

            expires_at:
                row.expires_at,

            last_activity_at:
                row.last_activity_at,

            revoked: true
        };

        this.refreshTokensService
            .updateRefreshToken(
                payload,
                row.id
            )
            .subscribe({

                next: () => {

                    this.loadData();
                },

                error: err => {

                    console.error(
                        'Error revocando refresh token',
                        err
                    );
                }
            });
    }


    // =========================================================
    // DELETE
    // =========================================================

    openDelete(
        row: RefreshTokensResponse
    ): void {

        this.deleteTarget = row;

        this.deleteError.set(null);

        this.openModal('delete');
    }


    confirmDelete(): void {

        if (!this.deleteTarget) {
            return;
        }

        this.deleteError.set(null);

        this.isDeleting.set(true);

        this.refreshTokensService
            .deleteRefreshToken(
                this.deleteTarget.id
            )
            .subscribe({

                next: () => {

                    this.isDeleting.set(false);

                    this.deleteTarget = null;

                    this.closeModal();

                    this.loadData();
                },

                error: err => {

                    console.error(
                        'Error eliminando refresh token',
                        err
                    );

                    this.deleteError.set(
                        this.getErrorMessage(
                            err,
                            'No se pudo eliminar el refresh token.'
                        )
                    );

                    this.isDeleting.set(false);
                }
            });
    }


    // =========================================================
    // MODAL CONTROL
    // =========================================================

    openModal(
        modal: ModalType
    ): void {

        this.activeModal.set(modal);

        this.isOpening.set(true);

        setTimeout(() => {

            this.isOpening.set(false);

        }, 16);
    }


    closeModal(): void {

        this.isClosing.set(true);

        setTimeout(() => {

            this.activeModal.set(null);

            this.isClosing.set(false);

            this.selectedToken = null;

            this.deleteTarget = null;

        }, 180);
    }


    // =========================================================
    // DEVICE INFO
    // =========================================================

    getDeviceValue(
        row: RefreshTokensResponse,
        key: string
    ): string {

        const device =
            this.parseDeviceInfo(
                row.device_info
            );

        if (!device) {
            return '—';
        }

        const value =
            (device as Record<string, any>)[key];

        if (
            value === null ||
            value === undefined ||
            value === ''
        ) {
            return '—';
        }

        return String(value);
    }


    getDeviceLabel(
        row: RefreshTokensResponse
    ): string {

        const device =
            this.parseDeviceInfo(
                row.device_info
            );

        if (!device) {
            return 'Dispositivo desconocido';
        }

        const deviceType =
            device['deviceType'];

        const browser =
            device['browser'];

        let deviceLabel = '';

        switch (deviceType) {

            case 'desktop':
                deviceLabel = 'Escritorio';
                break;

            case 'mobile':
                deviceLabel = 'Móvil';
                break;

            case 'tablet':
                deviceLabel = 'Tablet';
                break;

            default:
                deviceLabel = 'Dispositivo';
        }

        if (browser) {
            return `${deviceLabel} · ${browser}`;
        }

        return deviceLabel;
    }


    private parseDeviceInfo(
        value: any
    ): Record<string, any> | null {

        if (
            value === null ||
            value === undefined ||
            value === ''
        ) {
            return null;
        }

        if (
            typeof value === 'object'
        ) {

            return value as Record<
                string,
                any
            >;
        }

        try {

            const parsed =
                JSON.parse(
                    String(value)
                );

            if (
                parsed !== null &&
                typeof parsed === 'object'
            ) {

                return parsed;
            }

        } catch {

            return null;
        }

        return null;
    }


    // =========================================================
    // DATE HELPERS
    // =========================================================

    toDatetimeLocal(
        value: string | null
    ): string {

        if (!value) {
            return '';
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return '';
        }

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

        const hours =
            String(
                date.getHours()
            ).padStart(2, '0');

        const minutes =
            String(
                date.getMinutes()
            ).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }


    private toIsoDate(
        value: string
    ): string {

        if (!value) {
            return value;
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return value;
        }

        return date.toISOString();
    }


    // =========================================================
    // DATE DISPLAY
    // =========================================================

    formatDate(
        value: string | null | undefined
    ): string {

        if (!value) {
            return 'Sin Fecha';
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return 'Sin Fecha';
        }

        return new Intl.DateTimeFormat(
            'es-NI',
            {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }
        ).format(date);
    }


    // =========================================================
    // STATUS
    // =========================================================

    isExpired(
        row: RefreshTokensResponse
    ): boolean {

        if (row.revoked) {
            return false;
        }

        const expiration =
            new Date(
                row.expires_at
            );

        return expiration < new Date();
    }


    getStatus(
        row: RefreshTokensResponse
    ): 'active' | 'revoked' | 'expired' {

        if (row.revoked) {
            return 'revoked';
        }

        if (this.isExpired(row)) {
            return 'expired';
        }

        return 'active';
    }


    // =========================================================
    // TOKEN HASH
    // =========================================================

    getMaskedHash(
        row: RefreshTokensResponse
    ): string {

        if (!row.token_hash) {
            return '—';
        }

        if (row.token_hash.length <= 16) {
            return row.token_hash;
        }

        return (
            row.token_hash.slice(0, 8) +
            '••••••••' +
            row.token_hash.slice(-8)
        );
    }


    // =========================================================
    // ERROR
    // =========================================================

    private getErrorMessage(
        error: any,
        fallback: string
    ): string {

        if (
            error?.error?.message
        ) {
            return String(
                error.error.message
            );
        }

        if (
            error?.message
        ) {
            return String(
                error.message
            );
        }

        return fallback;
    }
}