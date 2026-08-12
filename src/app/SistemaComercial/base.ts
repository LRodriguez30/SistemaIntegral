import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, signal, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-base',
  imports: [CommonModule, RouterOutlet, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './base.html',
  styleUrl: './base.css'
})
export class BaseComercial {
  protected readonly title = signal('SistemaComercial');

  isMenuOpen = signal(false);

  showDevelopers = signal(false);

  @ViewChild('developersSection')
  developersSection!: ElementRef<HTMLElement>;

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