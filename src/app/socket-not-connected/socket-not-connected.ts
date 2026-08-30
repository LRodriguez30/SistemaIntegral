// import { Component, OnInit, OnDestroy, NgZone, signal } from '@angular/core';
// import { Location } from '@angular/common';
// import { Router } from '@angular/router';
// import { RealtimeService } from '../features/realtime/realtime';

// interface FailedAttempt {
//   msg: string;
// }

// @Component({
//   selector: 'app-socket-not-connected',
//   templateUrl: './socket-not-connected.html'
// })
// export class SocketNotConnected implements OnInit, OnDestroy {
//   loading = signal(false);
//   isReconnecting = signal(false);
//   failedAttempt = signal<FailedAttempt | null>(null);
//   attemptsLeft = 0;

//   private maxAttempts = 10;
//   private reconnectInterval?: any;

//   constructor(
//     private location: Location,
//     private router: Router,
//     private zone: NgZone,
//     private realtime: RealtimeService,
//   ) {}

//   ngOnInit() {
//     this.attemptsLeft = this.maxAttempts;
//     this.startReconnectLoop();
//   }

//   ngOnDestroy() {
//     this.stopReconnectLoop();
//   }

//   goBack() {
//     this.stopReconnectLoop();
//     this.location.back();
//   }

//   toggleReconnect() {
//     if (this.isReconnecting()) {
//       // Cancelar reconexión
//       this.stopReconnectLoop();
//     } else {
//       // Reiniciar reconexión
//       this.failedAttempt.set(null);
//       this.attemptsLeft = this.maxAttempts;
//       this.startReconnectLoop();
//     }
//   }

//   private startReconnectLoop() {
//   this.stopReconnectLoop();
//   this.isReconnecting.set(true);
//   this.loading.set(true);

//   this.reconnectInterval = setInterval(() => {
//     if (this.attemptsLeft <= 0) {
//       this.zone.run(() => {
//         this.failedAttempt.set({ msg: `No se pudo reconectar después de ${this.maxAttempts} intentos` });
//         this.stopReconnectLoop();
//       });
//       return;
//     }

//     this.attemptsLeft--;

//     // Intento real usando RealtimeService
//     this.realtime.connect(this.realtime.userName);

//     // Chequear si conectó
//     const sub = this.realtime.connected$.subscribe(connected => {
//       if (connected) {
//         this.zone.run(() => {
//           console.log('Conectado al backend!');
//           this.stopReconnectLoop();
//           this.router.navigate(['/chat']);
//         });
//         sub.unsubscribe();
//       } else {
//         this.zone.run(() => {
//           this.failedAttempt.set({
//             msg: `Intento fallido (${this.maxAttempts - this.attemptsLeft}/${this.maxAttempts}) - ${new Date().toLocaleTimeString()}`
//           });
//         });
//       }
//     });

//   }, 3000);
// }

//   private stopReconnectLoop() {
//     if (this.reconnectInterval) clearInterval(this.reconnectInterval);
//     this.reconnectInterval = undefined;
//     this.loading.set(false);
//     this.isReconnecting.set(false);
//   }
// }