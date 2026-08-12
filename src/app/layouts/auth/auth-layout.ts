import { Component, signal } from '@angular/core';
import { AuthLoaderService } from '../../services/loaders/auth-loader.service';
import { RouterOutlet } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, NgOptimizedImage],
  templateUrl: './auth-layout.component.html'
})
export class AuthLayout {
  constructor(public loader: AuthLoaderService) {}

  loading = signal(false);
  navigating = false;
  private timer: any;

  show() {
    clearTimeout(this.timer);
    this.navigating = false;
    this.loading.set(true);
  }

  hide() {
    this.timer = setTimeout(() => {
      this.navigating = true;
      this.loading.set(false);
    }, 300);
  }
}