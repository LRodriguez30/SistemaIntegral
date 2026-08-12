import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { DashboardLoaderService } from '../../services/loaders/dashboard-loader.service';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet],
  templateUrl: './dashboard-layout.component.html'
})
export class DashboardLayout implements OnInit {

  booting = signal(true);
  loaderVisible = signal(true);
  transitioning = signal(false);

  private timer: any;

  constructor(public loader: DashboardLoaderService) {}

  ngOnInit() {
    this.start();
  }

  start() {
    this.booting.set(true);

    this.loader.show();
    
    this.timer = setTimeout(() => {

      // 1. inicia fade-out del loader
      this.transitioning.set(true);
      this.loader.hide();

      // 2. espera animación
      setTimeout(() => {
        this.loaderVisible.set(false);
        this.booting.set(false);
        this.transitioning.set(false);
      }, 300);

    }, 1200);
  }
}
