import { isPlatformBrowser } from '@angular/common';
import { Component, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA, PLATFORM_ID, inject } from '@angular/core';

declare let L: any;

@Component({
  selector: 'app-branch',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './branch.html'
})
export class Branch implements AfterViewInit {

  private platformId = inject(PLATFORM_ID);

  private userMarker: any;
  private branchMarkers: any[] = [];

  activeBranch: any = null;

  setActiveBranch(branch: any) {
    this.activeBranch = branch;

    if (this.map) {
      this.map.setView([branch.lat, branch.lng], 15);
    }
  }

  private map: any;

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

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 0);

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

  private initMap(): void {

    this.map = L.map('map', {
      zoomControl: false
    }).setView([12.1364, -86.2514], 12);


    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    /* ---------------- ICONOS ---------------- */

    const userIcon = L.divIcon({
      className: '',
      html: `
        <div style="
          background:#3b82f6;
          width:14px;
          height:14px;
          border-radius:50%;
          border:3px solid white;
          box-shadow:0 0 10px rgba(59,130,246,0.6);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const storeIcon = L.divIcon({
      className: '',
      html: `
        <div style="
          background:#ef4444;
          width:16px;
          height:16px;
          transform: rotate(45deg);
          border-radius:3px;
          border:2px solid white;
          box-shadow:0 0 10px rgba(239,68,68,0.5);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    /* ---------------- BRANCHES ---------------- */

    this.branches.forEach(b => {

      const marker = L.marker([b.lat, b.lng], { icon: storeIcon })
        .addTo(this.map);

      marker.bindPopup(`
        <b>${b.name}</b><br/>
        ${b.description}
        <br/><br/>
        <button style="cursor:pointer;" onclick="window.open('https://www.google.com/maps?q=${b.lat},${b.lng}', '_blank')">
          Abrir en Google Maps
        </button>
      `);
    });

    /* ---------------- USER LOCATION ---------------- */

    const locateUser = () => {
      this.map.locate({
        setView: true,
        maxZoom: 15,
        enableHighAccuracy: true
      });
    };

    locateUser();

    this.map.on('locationfound', (e: any) => {
      if (this.userMarker) {
        this.userMarker.setLatLng(e.latlng);
        this.userMarker.openPopup();
        return;
      }

      this.userMarker = L.marker(e.latlng, { icon: userIcon })
        .addTo(this.map)
        .bindPopup('📍 Tu ubicación');

      this.userMarker.openPopup();
    });

    this.map.on('locationerror', () => {
      console.log('No se pudo obtener ubicación');
    });
    

    const zoomControl = L.control({ position: 'topleft' });

    zoomControl.onAdd = () => {
      const div = L.DomUtil.create('div');

      div.innerHTML = `
        <div style="
          display:flex;
          flex-direction:column;
          gap:10px;
        ">

          <button id="zoom-in-btn"
            style="
              width:46px;
              height:46px;
              background:white;
              border-radius:16px;
              border:1px solid #e5e7eb;
              box-shadow:0 12px 30px rgba(0,0,0,.18);
              cursor:pointer;
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:20px;
              transition:all .2s ease;
            ">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
              <path d="M11 8v6"></path>
              <path d="M8 11h6"></path>
            </svg>
          </button>

          <button id="zoom-out-btn"
            style="
              width:46px;
              height:46px;
              background:white;
              border-radius:16px;
              border:1px solid #e5e7eb;
              box-shadow:0 12px 30px rgba(0,0,0,.18);
              cursor:pointer;
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:20px;
              transition:all .2s ease;
            ">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
              <path d="M8 11h6"></path>
            </svg>
          </button>

        </div>
      `;

      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);

      setTimeout(() => {
        const zoomInBtn = div.querySelector('#zoom-in-btn') as HTMLElement | null;
        const zoomOutBtn = div.querySelector('#zoom-out-btn') as HTMLElement | null;

        zoomInBtn?.addEventListener('click', () => {
          this.map.zoomIn();
        });

        zoomOutBtn?.addEventListener('click', () => {
          this.map.zoomOut();
        });

        [zoomInBtn, zoomOutBtn].forEach(btn => {
          if (!btn) return;

          btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 16px 35px rgba(0,0,0,0.22)';
          });

          btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = '0 12px 30px rgba(0,0,0,0.18)';
          });
        });
      });

      return div;
    };

    zoomControl.addTo(this.map);


    /* ---------------- LEGEND ---------------- */

    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = () => {

      const div = L.DomUtil.create('div');

      div.innerHTML = `
        <div style="
          background:white;
          padding:10px 12px;
          border-radius:12px;
          font-size:12px;
          box-shadow:0 5px 20px rgba(0,0,0,0.15);
          line-height:18px;
        ">
          <div>🔵 Tu ubicación</div>
          <div>🔴 Tiendas</div>
        </div>
      `;

      return div;
    };

    legend.addTo(this.map);

    /* ---------------- COMPASS ---------------- */

    const compass = L.control({ position: 'topright' });

    compass.onAdd = () => {
      const div = L.DomUtil.create('div');

      div.innerHTML = `
        <div id="compass-btn"
          style="
            cursor:pointer;
            width:46px;
            height:46px;
            background:white;
            border-radius:16px;
            display:flex;
            align-items:center;
            justify-content:center;
            box-shadow:0 12px 30px rgba(0,0,0,0.18);
            border:1px solid #e5e7eb;
            transition:all .2s ease;
          ">
          <iconify-icon icon="lucide:locate-fixed" style="font-size:21px;"></iconify-icon>
        </div>
      `;

      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);

      setTimeout(() => {
        const btn = div.querySelector('#compass-btn') as HTMLElement | null;

        btn?.addEventListener('click', () => {
          locateUser();
        });

        btn?.addEventListener('mouseenter', () => {
          btn.style.transform = 'translateY(-2px)';
          btn.style.boxShadow = '0 16px 35px rgba(0,0,0,0.22)';
        });

        btn?.addEventListener('mouseleave', () => {
          btn.style.transform = 'translateY(0)';
          btn.style.boxShadow = '0 12px 30px rgba(0,0,0,0.18)';
        });
      });

      return div;
    };

    compass.addTo(this.map);
  }

  /* ---------------- UX EXTRA ---------------- */

  focusBranch(branch: any) {
    if (!this.map) return;

    const storeIcon = L.divIcon({
      className: '',
      html: `
      <div style="
        background:#ef4444;
        width:16px;
        height:16px;
        transform: rotate(45deg);
        border-radius:3px;
        border:2px solid white;
        box-shadow:0 0 10px rgba(239,68,68,0.5);
      "></div>
    `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    this.map.setView([branch.lat, branch.lng], 15);

    const marker = L.marker([branch.lat, branch.lng], { icon: storeIcon })
      .addTo(this.map)
      .bindPopup(`
      <b>${branch.name}</b><br/>
      ${branch.description}
      <br/><br/>
      <button style="cursor:pointer;" onclick="window.open('https://www.google.com/maps?q=${branch.lat},${branch.lng}', '_blank')">
        Abrir en Google Maps
      </button>
    `);

    marker.bindPopup(`
  <div style="min-width:180px;">
    <b style="font-size:14px;">${branch.name}</b>
    <p style="margin:6px 0 10px; color:#52525b; font-size:12px; line-height:1.4;">
      ${branch.description}
    </p>
    <button
      style="
        cursor:pointer;
        width:100%;
        border:none;
        background:#000;
        color:white;
        border-radius:999px;
        padding:8px 12px;
        font-size:12px;
        font-weight:700;
      "
      onclick="window.open('https://www.google.com/maps?q=${branch.lat},${branch.lng}', '_blank')">
      Abrir en Google Maps
    </button>
  </div>
`);

    marker.openPopup();
  }

  openRoute(branch: any) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`;
    window.open(url, '_blank');
  }
}