import { CommonModule, isPlatformBrowser, NgOptimizedImage } from "@angular/common";
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, HostListener, inject, Injectable, PLATFORM_ID, signal } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
    selector: 'app-contact',
    imports: [CommonModule],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './contact.html',
})
export class Contact implements AfterViewInit {
    private platformId = inject(PLATFORM_ID);

    ngAfterViewInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            const reveals = document.querySelectorAll('.reveal, .reveal-card');

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return;
                        entry.target.classList.add('active');
                    });
                },
                {
                    threshold: 0.15,
                    rootMargin: '0px 0px -10% 0px'
                }
            );

            reveals.forEach(el => observer.observe(el));
        }
    }
}