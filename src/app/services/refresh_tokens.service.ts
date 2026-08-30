import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';

export interface RefreshTokensResponse {
    id: string;
    user_id: string;
    token_hash: string;
    device_info: object;
    expires_at: string;
    revoked: boolean;
    last_activity_at: string | null;
    last_extended_at: string;
}

export interface CreateRefreshToken {
    user_id: string;
    token_hash: string;
    device_info: object;
    expires_at: string;
    revoked: boolean;
}

export interface UpdateRefreshToken {
    expires_at?: string;
    last_activity_at?: string | null;
    revoked?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class RefreshTokensService {

    private url = `${baseUrl}/auth/refresh-tokens`;

    constructor(
        private http: HttpClient
    ) {}

    // =========================================================
    // GET ALL
    // =========================================================

    getRefreshTokens() {
        return this.http.get<RefreshTokensResponse[]>(
            this.url,
            {
                withCredentials: true
            }
        );
    }

    // =========================================================
    // GET BY ID
    // =========================================================

    getRefreshToken(id: string) {
        return this.http.get<RefreshTokensResponse>(
            `${this.url}/${id}`,
            {
                withCredentials: true
            }
        );
    }

    // =========================================================
    // CREATE
    // =========================================================

    createRefreshToken(
        dto: CreateRefreshToken
    ) {
        return this.http.post<RefreshTokensResponse>(
            this.url,
            dto,
            {
                withCredentials: true
            }
        );
    }

    // =========================================================
    // PATCH
    // =========================================================

    updateRefreshToken(
        dto: UpdateRefreshToken,
        id: string
    ) {
        return this.http.patch<RefreshTokensResponse>(
            `${this.url}/${id}`,
            dto,
            {
                withCredentials: true
            }
        );
    }

    // =========================================================
    // DELETE
    // =========================================================

    deleteRefreshToken(
        id: string
    ) {
        return this.http.delete(
            `${this.url}/${id}`,
            {
                withCredentials: true
            }
        );
    }
}