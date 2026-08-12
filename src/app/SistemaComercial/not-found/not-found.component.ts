import { Component, inject } from '@angular/core';
import { Router, } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  templateUrl: './not-found.component.html'
})
export class NotFoundComponent {

  private router = inject(Router);

  goHome() {
    console.log('Navegando a home...');
    this.router.navigate(['/home']);
  }

  goCatalog() {
    console.log('Navegando a catalog...');
    this.router.navigate(['/catalog']);
  }
}