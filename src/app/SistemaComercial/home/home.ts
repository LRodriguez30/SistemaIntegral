import { CommonModule, isPlatformBrowser, NgOptimizedImage } from "@angular/common";
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, HostListener, inject, Injectable, PLATFORM_ID, signal } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-home',
  imports: [CommonModule, NgOptimizedImage, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements AfterViewInit {

  private platformId = inject(PLATFORM_ID);

  constructor(private el: ElementRef) { }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const reveals = document.querySelectorAll('.reveal, .reveal-card');

      const observer = new IntersectionObserver(
        (entries, obs) => {

          entries.forEach((entry) => {

            if (!entry.isIntersecting) return;

            entry.target.classList.add('active');

          });

        },
        {
          threshold: 0.15,
          rootMargin: "0px 0px -10% 0px"
        }
      );

      reveals.forEach(el => observer.observe(el));
    }
  }

  scrollTo(id: string): void {

    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

  }

  @HostListener('window:scroll')
  onScroll() {

    const scrolled = window.scrollY;

    if (isPlatformBrowser(this.platformId)) {
      document
        .querySelectorAll('.parallax')
        .forEach((el: any) => {

          el.style.transform =
            `translateY(${scrolled * 0.05}px)`;

        });
    }
  }

  branches = [
    {
      name: "Mercado Oriental",
      description: "Managua — Stock disponible y punto principal de distribución.",
      tags: ["Principal", "Disponible"],
      lat: 12.147928,
      lng: -86.256003
    },
    // {
    //   name: "Mercado Roberto Huembes",
    //   description: "Managua — Buena disponibilidad de productos, ideal para compras rápidas.",
    //   tags: ["Intermedio", "En Demanda"],
    //   lat: 12.1241,
    //   lng: -86.2418
    // },
    // {
    //   name: "Mercado Iván Montenegro",
    //   description: "Managua — Punto con stock variable, depende del día.",
    //   tags: ["Secundario", "En Poca Demanda"],
    //   lat: 12.1299,
    //   lng: -86.2173
    // }
  ];

  products = [
    {
      name: "Chinela Urban 23 Pasos",
      description: "Pasos Urban 23 ofrece un diseño fresco y juvenil, pensado para quienes valoran tanto la comodidad como la personalidad en su calzado.",
      price: 250,
      image: "Catalogo/Modelos/Urban 23-Negro con Azul.png",
      tags: ["Juvenil", "Comodidad"]
    },
    {
      name: "Chinelas Clásicas Pasos",
      description: "Pasos mantiene el encanto de las chinelas clásicas, añadiendo detalles y acabados que le dan un aspecto más distintivo y elegante.",
      price: 250,
      image: "Catalogo/Modelos/Clásica-Negro.png",
      tags: ["Clásica", "Uso diario"]
    },
    {
      name: "Zapatos Sport Pasos",
      description: "Pasos estilo Sport combina un diseño inspirado en el calzado deportivo con una estructura ligera y ventilada para brindar mayor comodidad durante el día.",
      price: 250,
      image: "Catalogo/Modelos/Sport-Negro con Botón Blanco.png",
      tags: ["Deportivo", "Resistente"]
    }
  ];

  reviewPhotos = [
    {
      image: 'Reviews/entrega-1.jpg',
      alt: 'Entrega de producto PASOS'
    },
    {
      image: 'Reviews/entrega-2.jpg',
      alt: 'Cliente con producto PASOS'
    },
    {
      image: 'Reviews/entrega-3.jpg',
      alt: 'Experiencia de compra PASOS'
    },
    {
      image: 'Reviews/entrega-4.jpg',
      alt: 'Producto PASOS entregado'
    }
  ];

  currentReviewIndex = 0;

  reviews = [
    {
      name: 'Cliente PASOS',
      role: 'Cliente PASOS',
      rating: 4.5,
      comment: 'Las chinelas me salieron cómodas y ligeras. Me atendieron bien y pude revisar el modelo antes de comprar.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Ama de casa',
      rating: 4,
      comment: 'Me gustaron para usar en casa. Son suaves, aunque me hubiera gustado encontrar más colores disponibles.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Comerciante',
      rating: 4.5,
      comment: 'Las compré en el Mercado Oriental. Me parecieron resistentes y cómodas para caminar bastante.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Estudiante',
      rating: 3.5,
      comment: 'La atención fue buena y confirmaron el color antes de llegar. Solo no encontré exactamente la talla que buscaba.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Trabajador independiente',
      rating: 4,
      comment: 'El producto se ve sencillo, cómodo y práctico para el uso diario. Buena opción por el precio.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Cliente PASOS',
      rating: 3.5,
      comment: 'Pude pagar sin complicaciones. Había modelos bonitos, aunque algunos colores ya estaban agotados.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Vendedor',
      rating: 5,
      comment: 'Son cómodas para pasar el día moviéndose. No se sienten pesadas y me gustó la suela.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Cliente frecuente',
      rating: 4,
      comment: 'Ya he comprado más de una vez. La atención ha sido buena y los modelos son prácticos.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Docente',
      rating: 4.5,
      comment: 'Las uso después del trabajo y se sienten bastante cómodas. Me gustó que fueran livianas.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Madre de familia',
      rating: 4,
      comment: 'Compré un par para uso diario. Me parecieron prácticas y fáciles de limpiar.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Motorizado',
      rating: 3.5,
      comment: 'Me gustó el diseño, aunque hubiera preferido más opciones de talla en el momento.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Oficinista',
      rating: 4,
      comment: 'Son cómodas para descansar al llegar a casa. La atención fue clara y rápida.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Emprendedora',
      rating: 4.5,
      comment: 'Consulté por WhatsApp antes de ir y me confirmaron disponibilidad. Eso me ahorró tiempo.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Cliente PASOS',
      rating: 3,
      comment: 'El producto está bien por el precio. Me hubiera gustado encontrar más variedad ese día.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Estilista',
      rating: 4,
      comment: 'Las uso para estar en casa. Son ligeras y no cansan tanto como otras que he comprado.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Universitario',
      rating: 4.5,
      comment: 'Me atendieron bien y pude ver varios modelos. El par que compré salió cómodo.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Comerciante',
      rating: 5,
      comment: 'Me gustaron bastante. Camino mucho durante el día y se sienten suaves.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Cliente PASOS',
      rating: 4,
      comment: 'La compra fue sencilla. Pregunté por Facebook y luego pasé al punto de venta.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Padre de familia',
      rating: 3.5,
      comment: 'Compré un par para la casa. Están bien, aunque el color que quería ya no estaba disponible.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Asistente de tienda',
      rating: 4.5,
      comment: 'Me parecieron cómodas y resistentes. El material se siente ligero.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Cliente PASOS',
      rating: 4,
      comment: 'Buena atención en el Mercado Oriental. Me explicaron qué modelos tenían.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Cliente PASOS',
      rating: 3.5,
      comment: 'La compra fue rápida. Me gustó el producto, aunque esperaba más colores disponibles.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Repartidor',
      rating: 4,
      comment: 'Son cómodas para usarlas después del trabajo. No pesan y se sienten flexibles.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Cliente frecuente',
      rating: 4.5,
      comment: 'Ya había comprado antes. Esta vez encontré otro modelo y me gustó la comodidad.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Ama de casa',
      rating: 5,
      comment: 'Me encantaron para estar en casa. Son suaves y fáciles de poner.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Trabajador',
      rating: 4,
      comment: 'Compré porque buscaba algo cómodo y económico. Cumplieron bastante bien.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Estudiante',
      rating: 3.5,
      comment: 'El diseño me gustó. La atención fue buena, pero tuve que preguntar por otro color.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Cliente PASOS',
      rating: 4.5,
      comment: 'Me ayudaron a confirmar la talla antes de llegar. La compra fue sin problema.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Comerciante',
      rating: 4,
      comment: 'Buena opción para uso diario. Se sienten resistentes para el precio.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Cliente PASOS',
      rating: 3.5,
      comment: 'El producto está cómodo, pero había poca variedad cuando llegué.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Oficinista',
      rating: 4.5,
      comment: 'Me gustó el acabado y la comodidad. Las uso principalmente dentro de casa.'
    },
    {
      name: 'Cliente PASOS',
      role: 'Vendedora',
      rating: 4,
      comment: 'Las compré en el Mercado Oriental. La atención fue amable y el producto me salió bueno.'
    }
  ];

  get sortedReviews() {
    return [...this.reviews].sort((a, b) => {
      // Primero por calificación
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }

      // Si tienen la misma calificación, los comentarios más largos primero
      return b.comment.length - a.comment.length;
    });
  }

  get averageRating(): number {
    const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    return Number((total / this.reviews.length).toFixed(1));
  }

  getStarIcon(rating: number, star: number): string {
    if (rating >= star) {
      return 'material-symbols:star-rounded';
    }

    if (rating >= star - 0.5) {
      return 'material-symbols:star-half-rounded';
    }

    return 'material-symbols:star-outline-rounded';
  }

  get reviewGroups() {
    const sorted = [...this.sortedReviews];
    const groups = [];
    const size = 4;

    for (let i = 0; i < sorted.length; i += size) {
      groups.push(sorted.slice(i, i + size));
    }

    return groups;
  }

  nextReview(): void {
    this.currentReviewIndex =
      this.currentReviewIndex === this.reviewGroups.length - 1
        ? 0
        : this.currentReviewIndex + 1;
  }

  previousReview(): void {
    this.currentReviewIndex =
      this.currentReviewIndex === 0
        ? this.reviewGroups.length - 1
        : this.currentReviewIndex - 1;
  }
}