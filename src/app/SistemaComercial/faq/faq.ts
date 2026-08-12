import { CommonModule, isPlatformBrowser, NgOptimizedImage } from "@angular/common";
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, HostListener, inject, Injectable, PLATFORM_ID, signal } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
    selector: 'app-faq',
    imports: [CommonModule],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './faq.html',
})
export class FAQ implements AfterViewInit {
    private platformId = inject(PLATFORM_ID);

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

    faqSearch: string = '';

onFaqSearch(event: Event): void {
  const input = event.target as HTMLInputElement;
  this.faqSearch = input.value;
}

get searchTerms(): string[] {
  return this.normalizeText(this.faqSearch)
    .split(' ')
    .filter(term => term.length >= 2);
}

get filteredFaqCategories() {
  const terms = this.searchTerms;

  if (terms.length === 0) {
    return this.faqCategories;
  }

  return this.faqCategories
    .map(category => {
      const filteredQuestions = category.questions.filter(faq => {
        const searchableText = this.normalizeText(`
          ${category.label}
          ${category.title}
          ${faq.question}
          ${faq.answer}
        `);

        return terms.every(term => searchableText.includes(term));
      });

      return {
        ...category,
        questions: filteredQuestions
      };
    })
    .filter(category => category.questions.length > 0);
}

normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

highlightText(text: string): string {
  const terms = this.searchTerms;

  if (terms.length === 0) {
    return text;
  }

  let highlighted = this.escapeHtml(text);

  terms.forEach(term => {
    const regex = new RegExp(`(${this.escapeRegExp(term)})`, 'gi');

    highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 px-0.1 rounded">$1</mark>');
  });

  return highlighted;
}

escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

scrollToFaq(id: string): void {
  document.getElementById(id)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

faqCategories = [
  {
    id: 'faq-pagos',
    label: 'Pagos',
    title: 'Métodos de pago',
    questions: [
      {
        question: '¿Qué métodos de pago aceptan?',
        answer: 'Aceptamos pagos en efectivo y con tarjeta, según la disponibilidad del punto de venta.'
      },
      {
        question: '¿Puedo pagar en efectivo?',
        answer: 'Sí. El pago en efectivo está disponible en los puntos de venta habilitados.'
      },
      {
        question: '¿Aceptan tarjetas?',
        answer: 'Sí. El pago con tarjeta puede estar disponible, aunque puede variar según el punto de venta.'
      },
      {
        question: '¿Debo confirmar antes de pagar con tarjeta?',
        answer: 'Sí. Recomendamos confirmar por WhatsApp o Facebook antes de llegar.'
      },
      {
        question: '¿Aceptan transferencias?',
        answer: 'Por el momento, se recomienda consultar directamente por WhatsApp o Facebook.'
      },
      {
        question: '¿El precio cambia según el método de pago?',
        answer: 'Los precios pueden depender del producto o punto de venta. Es mejor confirmarlo antes de comprar.'
      },
      {
        question: '¿Puedo reservar y pagar después?',
        answer: 'La posibilidad de reserva depende de la disponibilidad y del punto de venta.'
      },
      {
        question: '¿Entregan comprobante de compra?',
        answer: 'Puedes solicitar información sobre comprobantes directamente en el punto de venta.'
      },
      {
        question: '¿Puedo pagar al retirar el producto?',
        answer: 'Sí. En los puntos de venta puedes pagar al momento de realizar tu compra.'
      },
      {
        question: '¿Cómo confirmo el método de pago disponible?',
        answer: 'Puedes escribirnos por WhatsApp o Facebook antes de visitar el punto de venta.'
      }
    ]
  },
  {
    id: 'faq-ubicacion',
    label: 'Ubicación',
    title: 'Puntos de venta',
    questions: [
      {
        question: '¿Dónde puedo comprar productos PASOS?',
        answer: 'Puedes adquirirlos en los puntos de venta disponibles dentro del apartado de ubicación.'
      },
      {
        question: '¿Cómo veo la ubicación exacta?',
        answer: 'Puedes entrar al apartado de puntos de venta para revisar la ubicación correspondiente.'
      },
      {
        question: '¿Tienen varias sucursales?',
        answer: 'La disponibilidad de puntos de venta puede variar. Consulta la sección de ubicaciones actualizada.'
      },
      {
        question: '¿Puedo consultar una ubicación por WhatsApp?',
        answer: 'Sí. Puedes escribirnos para confirmar la ubicación antes de llegar.'
      },
      {
        question: '¿Los puntos de venta tienen horarios fijos?',
        answer: 'Los horarios pueden variar según el lugar. Recomendamos confirmarlos antes de visitar.'
      },
      {
        question: '¿Puedo pedir indicaciones por Facebook?',
        answer: 'Sí. También puedes escribirnos por Facebook para resolver dudas de ubicación.'
      },
      {
        question: '¿Hay puntos de venta cerca de mí?',
        answer: 'Puedes revisar la sección de puntos de venta o consultar directamente por WhatsApp.'
      },
      {
        question: '¿Actualizan los puntos de venta?',
        answer: 'Sí. La página puede actualizarse cuando haya nuevos puntos disponibles.'
      },
      {
        question: '¿Puedo comprar directamente en cualquier punto indicado?',
        answer: 'Sí, siempre que el punto de venta tenga disponibilidad del producto.'
      },
      {
        question: '¿Qué hago si no encuentro una ubicación?',
        answer: 'Escríbenos por WhatsApp o Facebook para ayudarte con la dirección.'
      }
    ]
  },
  {
    id: 'faq-disponibilidad',
    label: 'Disponibilidad',
    title: 'Modelos, tallas y colores',
    questions: [
      {
        question: '¿Cómo sé si hay disponibilidad?',
        answer: 'La disponibilidad depende del modelo, color, talla y punto de venta.'
      },
      {
        question: '¿Puedo confirmar existencia antes de llegar?',
        answer: 'Sí. Recomendamos consultar por WhatsApp o Facebook.'
      },
      {
        question: '¿Todos los modelos están siempre disponibles?',
        answer: 'No necesariamente. Algunos modelos pueden agotarse temporalmente.'
      },
      {
        question: '¿Tienen todas las tallas?',
        answer: 'Las tallas pueden variar según el modelo y el punto de venta.'
      },
      {
        question: '¿Los colores cambian según el punto de venta?',
        answer: 'Sí. Algunos colores pueden estar disponibles solo en ciertos puntos.'
      },
      {
        question: '¿Puedo preguntar por un color específico?',
        answer: 'Sí. Puedes consultar por WhatsApp o Facebook indicando el modelo y color.'
      },
      {
        question: '¿Reponen productos agotados?',
        answer: 'La reposición puede variar. Puedes consultar para saber si volverá a estar disponible.'
      },
      {
        question: '¿Puedo apartar una talla?',
        answer: 'Depende de la disponibilidad y del punto de venta.'
      },
      {
        question: '¿El catálogo refleja toda la disponibilidad?',
        answer: 'El catálogo muestra modelos destacados, pero la disponibilidad final debe confirmarse.'
      },
      {
        question: '¿Dónde consulto productos nuevos?',
        answer: 'Puedes revisar el catálogo o escribirnos por WhatsApp o Facebook.'
      }
    ]
  },
  {
    id: 'faq-seguridad',
    label: 'Seguridad',
    title: 'Compra segura',
    questions: [
      {
        question: '¿Es seguro comprar en los puntos de venta?',
        answer: 'Sí. Los puntos indicados son lugares donde puedes adquirir productos PASOS de forma directa.'
      },
      {
        question: '¿Cómo verifico un punto de venta?',
        answer: 'Puedes confirmar la ubicación por WhatsApp o Facebook antes de visitarla.'
      },
      {
        question: '¿PASOS recomienda confirmar antes de comprar?',
        answer: 'Sí. Confirmar disponibilidad y ubicación ayuda a evitar inconvenientes.'
      },
      {
        question: '¿Qué hago si tengo dudas sobre una ubicación?',
        answer: 'Escríbenos antes de llegar para validar la información.'
      },
      {
        question: '¿Puedo consultar antes de pagar?',
        answer: 'Sí. Puedes preguntar por métodos de pago, precio y disponibilidad.'
      },
      {
        question: '¿Los productos son de la marca PASOS?',
        answer: 'Sí. Consulta siempre en los puntos oficiales o canales de atención indicados.'
      },
      {
        question: '¿Debo comprar solo en puntos indicados?',
        answer: 'Se recomienda comprar en puntos confirmados para evitar confusiones.'
      },
      {
        question: '¿Qué hago si veo información diferente en redes?',
        answer: 'Puedes escribirnos por WhatsApp o Facebook para confirmar la información actual.'
      },
      {
        question: '¿La atención confirma datos de compra?',
        answer: 'Sí. La atención puede ayudarte con dudas antes de comprar.'
      },
      {
        question: '¿Puedo pedir confirmación del producto?',
        answer: 'Sí. Puedes solicitar detalles del modelo, color o talla disponible.'
      }
    ]
  },
  {
    id: 'faq-atencion',
    label: 'Atención',
    title: 'WhatsApp y Facebook',
    questions: [
      {
        question: '¿Cuentan con atención al cliente?',
        answer: 'Sí. Brindamos atención para dudas sobre productos, pagos, disponibilidad y puntos de venta.'
      },
      {
        question: '¿Cuál es el número de atención?',
        answer: 'Puedes comunicarte por WhatsApp al +505 XXXX XXXX.'
      },
      {
        question: '¿También atienden por Facebook?',
        answer: 'Sí. Puedes escribirnos por Facebook para consultas generales.'
      },
      {
        question: '¿Qué dudas puedo resolver por WhatsApp?',
        answer: 'Puedes consultar tallas, colores, precios, disponibilidad, puntos de venta y métodos de pago.'
      },
      {
        question: '¿Qué hago si mi pregunta no aparece en el FAQ?',
        answer: 'Escríbenos por WhatsApp o Facebook y te ayudaremos directamente.'
      },
      {
        question: '¿Atienden dudas sobre modelos?',
        answer: 'Sí. Puedes preguntar por características, colores y tallas disponibles.'
      },
      {
        question: '¿Puedo pedir fotos por WhatsApp?',
        answer: 'Puedes consultar si hay imágenes disponibles del modelo que te interesa.'
      },
      {
        question: '¿Puedo confirmar precios por mensaje?',
        answer: 'Sí. Puedes solicitar información actualizada antes de comprar.'
      },
      {
        question: '¿Puedo preguntar por horarios?',
        answer: 'Sí. Puedes consultar los horarios del punto de venta que deseas visitar.'
      },
      {
        question: '¿Atienden consultas sobre ubicación?',
        answer: 'Sí. Puedes pedir ayuda para encontrar el punto de venta más conveniente.'
      }
    ]
  }
];
}