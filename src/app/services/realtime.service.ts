import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../environment';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

export type RealtimeStatus =
  | 'idle'
  | 'active'
  | 'connecting'
  | 'authenticating'
  | 'authenticated'
  | 'connected'
  | 'reconnecting'
  | 'reconnected'
  | 'disconnected'
  | 'blocked'
  | 'expired'
  | 'offline'
  | 'unauthenticated'
  | 'server-not-available';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private socket?: Socket;

  private readonly MAX_RECONNECT_ATTEMPTS = 5;

  private statusSubject = new BehaviorSubject<RealtimeStatus>('idle');
  readonly status$ = this.statusSubject.asObservable();

  private connectedSubject = new BehaviorSubject<boolean>(false);
  readonly connected$ = this.connectedSubject.asObservable();

  private serverOnlineSubject = new BehaviorSubject<boolean>(false);
  readonly serverOnline$ = this.serverOnlineSubject.asObservable();

  private appReadySubject = new BehaviorSubject<boolean>(false);
  appReady$ = this.appReadySubject.asObservable();

  private lastConnectedAt = 0;
private readonly IDLE_GRACE_TIME = 5000;

private shouldIgnoreIdle(): boolean {
  const status = this.statusSubject.value;

  const protectedStatuses: RealtimeStatus[] = [
    'connecting',
    'authenticating',
    'authenticated',
    'connected',
    'reconnecting',
    'reconnected'
  ];

  const recentlyConnected =
    Date.now() - this.lastConnectedAt < this.IDLE_GRACE_TIME;

  return protectedStatuses.includes(status) || recentlyConnected;
}

  connect(): void {
    if (!navigator.onLine) {
      this.serverOnlineSubject.next(false);
      this.statusSubject.next('offline');
      return;
    }

    this.statusSubject.next('connecting');

    if (this.socket) {
      this.socket.removeAllListeners();

      this.socket.disconnect();
      this.socket = undefined;
    }

    this.socket = io(environment.BACKEND_URI, {
      withCredentials: true,
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 3000
    });

    this.registerCoreEvents();
    this.socket.connect();
  }


  disconnect(status?: RealtimeStatus): void {
    this.hardDisconnect();

    if (status) {
      this.statusSubject.next(status);
    }
  }

  private hardDisconnect(): void {
    if (!this.socket) return;

    this.socket.io.opts.reconnection = false;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = undefined;

    this.connectedSubject.next(false);
    this.serverOnlineSubject.next(false);
  }

  private registerCoreEvents(): void {
    if (!this.socket) return;

    this.socket.on('activity', () => {
      console.log("Usuario conectado")
    });

    this.socket.on('connect', () => {
  this.lastConnectedAt = Date.now();

  this.connectedSubject.next(true);
  this.statusSubject.next('connected');
  this.serverOnlineSubject.next(true);
  this.appReadySubject.next(true);

  this.socket?.emit('activity');
});

    this.socket.on('disconnect', () => {
      this.connectedSubject.next(false);
      this.statusSubject.next('disconnected');
      this.serverOnlineSubject.next(false);
      console.log("user disconnected")
    });

    this.socket.on('connect_error', () => {
      this.connectedSubject.next(false);
      this.statusSubject.next('server-not-available');
      this.serverOnlineSubject.next(false);
      console.log("realtime connect");
    });

    this.socket.on('authenticating', () => {
      this.statusSubject.next('authenticating');
    });

    this.socket.on('auth-failed', async () => {
      console.log('auth-failed');
      this.connectedSubject.next(false);
      this.statusSubject.next('unauthenticated');
      // }
    });


    this.socket.on('session-expired', () => {
      this.connectedSubject.next(false);
      this.statusSubject.next('expired');
      console.log("session-expired")
    });

    this.socket.io.on('reconnect_attempt', () => {
      this.statusSubject.next('reconnecting');
      this.serverOnlineSubject.next(false);
      console.log("realtime reconnnect");
    });

    this.socket.io.on('reconnect', () => {
  this.lastConnectedAt = Date.now();

  this.connectedSubject.next(true);
  this.statusSubject.next('reconnected');
  this.serverOnlineSubject.next(true);

  this.socket?.emit('activity');
});

    this.socket.io.on('reconnect_failed', () => {
      this.connectedSubject.next(false);
      this.statusSubject.next('disconnected');
      this.serverOnlineSubject.next(false);
      console.log("reconnect failed")
    });

    this.socket.on('user-idle', () => {
  if (this.shouldIgnoreIdle()) {
    console.log('idle ignorado por reconexión reciente');
    return;
  }

  this.statusSubject.next('idle');
});

    this.socket.on('user-offline', () => {
      this.statusSubject.next('offline');
      console.log("user offline")
    })
  }

  updateActivity() {
    this.socket?.emit('activity');
    console.log("Actividad detectada")
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  setStatus(status: RealtimeStatus): void {
    this.statusSubject.next(status);
  }
}