import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './not-found.component.html'
})
export class NotFoundComponent {

  private router = inject(Router);
  private location = inject(Location);

  goBack(): void {
    this.location.back();
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  goCatalog(): void {
    this.router.navigate(['/catalog']);
  }

}