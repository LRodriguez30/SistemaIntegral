import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-base',
  imports: [CommonModule, RouterOutlet, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './base.html',
  styleUrl: './base.css'
})
export class BaseComercial {
  protected readonly title = signal('SistemaComercial');

  private router = inject(Router);

  isMenuOpen = signal(false);

  showDevelopers = signal(false);

  @ViewChild('developersSection')
  developersSection!: ElementRef<HTMLElement>;

  private adminClicks = 0;
  private adminClickTimer: ReturnType<typeof setTimeout> | null = null;

  handleAdminAccess(): void {

    this.adminClicks++;

    // Reiniciar el contador después del intervalo
    if (this.adminClickTimer) {
      clearTimeout(this.adminClickTimer);
    }

    if (this.adminClicks >= 3) {

      this.adminClicks = 0;

      this.router.navigate(['/admin']);

      return;
    }

    this.adminClickTimer = setTimeout(() => {

      this.adminClicks = 0;

      this.adminClickTimer = null;

    }, 1500);
  }

  toggleDevelopers(): void {
    this.showDevelopers.update(value => !value);

    if (this.showDevelopers()) {
      setTimeout(() => {
        this.developersSection.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 150);
    }
  }

  toggleMenu() {
    this.isMenuOpen.update(v => !v);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }
}

export const baseUrl = "https://localhost:7137";