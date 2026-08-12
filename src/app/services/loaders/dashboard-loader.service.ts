import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DashboardLoaderService {

  private _loading = signal(false);
  private _message = signal<string | null>(null);

  loading = this._loading.asReadonly();
  message = this._message.asReadonly();

  show(message?: string): void {
    this._loading.set(true);
    this._message.set(message ?? null);
  }

  hide(): void {
    this._loading.set(false);
    this._message.set(null);
  }

  setMessage(message: string): void {
    this._message.set(message);
  }

  clearMessage(): void {
    this._message.set(null);
  }
}