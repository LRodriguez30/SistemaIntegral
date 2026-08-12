import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthLoaderService {
  loading = signal(false);
  message = signal('');

  show(message = '') {
    this.message.set(message);
    this.loading.set(true);
  }

  hide(delay = 300) {
    setTimeout(() => {
      this.loading.set(false);
      this.message.set('');
    }, delay);
  }
}