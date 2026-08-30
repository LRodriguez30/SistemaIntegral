import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  RealtimeService
} from '../../services/realtime.service';

import {
  AuthService
} from '../../services/auth.service';

import { take } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-socket-notifier',
  imports: [CommonModule],
  templateUrl: './socket-notifier.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SocketNotifierComponent {

  private realtimeService = inject(RealtimeService);
  private authService = inject(AuthService);

  // =========================
  // UI STATE
  // =========================
  notificationShow = signal(false);

  notificationType = signal<
    | 'unauthenticated'
    | 'refreshing'
    | 'idle'
    | null
  >(null);

  notificationMinimized = signal(true);

  isRefreshingSession = signal(false);

  // =========================
  // PUBLIC API
  // =========================
  showIdle(): void {

    this.notificationType.set('idle');

    this.notificationShow.set(true);

  }

//   showUnauthenticated(): void {

//     this.notificationType.set(
//       'unauthenticated'
//     );

//     this.notificationShow.set(true);

//   }

  hide(): void {

    this.notificationShow.set(false);

    this.notificationType.set(null);

  }

  minimize(): void {

    this.notificationMinimized.set(true);

  }

  expand(): void {

    this.notificationMinimized.set(false);

  }

  // =========================
  // REFRESH SESSION
  // =========================
  refreshSession(): void {

    if (this.isRefreshingSession()) {
      return;
    }

    this.isRefreshingSession.set(true);

    this.notificationType.set('refreshing');

    this.authService.refresh()
      .pipe(take(1))
      .subscribe({

        next: () => {

          this.isRefreshingSession.set(false);

          this.hide();

          this.realtimeService.connect();

        },

        error: () => {

          this.isRefreshingSession.set(false);

          this.notificationType.set(
            'unauthenticated'
          );

          this.notificationShow.set(true);

        }

      });

  }

}