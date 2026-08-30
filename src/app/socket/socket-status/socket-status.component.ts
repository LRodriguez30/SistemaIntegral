import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { RealtimeService, RealtimeStatus } from '../../services/realtime.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-socket-status',
  imports: [CommonModule],
  templateUrl: './socket-status.component.html'
})
export class SocketStatusComponent implements OnInit, OnDestroy {

  status = signal<RealtimeStatus>('idle');
  failedMessage = signal<string | null>(null);
  isMinimized = signal(true);
  lastStatus = signal<RealtimeStatus | null>(null);

  hasServerError = signal(false);
  deactivated = signal(false);

  private sub?: Subscription;

  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;

  constructor(private realtime: RealtimeService) {}

  ngOnInit(): void {
    this.sub = this.realtime.status$.subscribe(s => {

      // Evitar renders duplicados reales
      if (s === this.lastStatus()) {
        return;
      }

      console.log('Socket status:', s);
      console.log('Last status:', this.lastStatus());

      this.lastStatus.set(s);
      this.status.set(s);

      // Estados fuertes
      if (s === 'server-not-available') {
        this.hasServerError.set(true);
        this.failedMessage.set('Servidor no disponible.');
        return;
      }

      if (s === 'unauthenticated') {
        this.hasServerError.set(true);
        this.failedMessage.set('Sesión no autenticada.');
        return;
      }

      this.hasServerError.set(false);

      // Estados exitosos
      if (s === 'connected' || s === 'reconnected') {
        this.reconnectAttempts = 0;
        this.deactivated.set(false);
        this.failedMessage.set(null);
        return;
      }

      // Reconectando
      if (s === 'connecting' || s === 'authenticating') {
        this.failedMessage.set(null);
        return;
      }

      // Desconexión real
      if (s === 'offline') {
        if (this.deactivated()) {
          this.failedMessage.set('Reconexión desactivada.');
          return;
        }

        this.reconnectAttempts++;

        this.failedMessage.set(
          `Desconectado (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`
        );

        if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
          this.disableAutoReconnect();
        }

        return;
      }

      if (s === 'blocked') {
        this.failedMessage.set('Acceso bloqueado.');
        return;
      }

      if (s === 'expired') {
        this.failedMessage.set('Sesión expirada.');
        return;
      }

      if (s === 'disconnected') {
        this.failedMessage.set('Desconectado.');
        return;
      }

      if (s === 'idle') {
        this.failedMessage.set('Inactividad.');
        return;
      }

    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggleMinimize(): void {
    this.isMinimized.set(!this.isMinimized());
  }

  retry(): void {
    this.deactivated.set(false);
    this.reconnectAttempts = 0;
    this.failedMessage.set(null);
    this.hasServerError.set(false);

    this.status.set('connecting');
    this.lastStatus.set('connecting');

    /**
     * Importante:
     * Si tu RealtimeService no limpia bien los timers al conectar,
     * este reconnect seguirá cayendo en idle.
     */
    this.realtime.connect();
  }

  cancel(): void {
    this.deactivated.set(true);
    this.realtime.disconnect('disconnected');

    this.status.set('disconnected');
    this.lastStatus.set('disconnected');
    this.failedMessage.set('Desconectado.');
  }

  disableAutoReconnect(): void {
    this.deactivated.set(true);
    this.reconnectAttempts = 0;
    this.failedMessage.set('Reconexión desactivada.');

    this.realtime.disconnect('offline');

    this.status.set('offline');
    this.lastStatus.set('offline');
  }
}