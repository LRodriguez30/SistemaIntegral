import { isPlatformBrowser, Location } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { AuthService, LoginUser } from '../services/auth.service';

interface StoredAccount {
  name: string;
  email: string;
  avatar: string;
  role?: string;
}

@Component({
  selector: 'app-unauthorized',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './unauthorized.html'
})
export class Unauthorized implements OnInit {
  private platformId = inject(PLATFORM_ID);

  private readonly ACCOUNTS_KEY = 'uni-colab-accounts';

  adminAccounts = signal<StoredAccount[]>([]);
  selectedAdminAccount = signal<StoredAccount | null>(null);

  adminAuthOpen = signal(false);
  adminPassword = signal('');
  authError = signal<string | null>(null);

  isAuthenticating = false;

  constructor(
    private location: Location,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadAdminAccounts();
  }

  goHome(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('redirectAfterLogin');
      this.router.navigate(['/']);
    }
  }

  authenticate(): void {
    this.loadAdminAccounts();

    if (this.adminAccounts().length === 0) {
      return;
    }

    this.selectedAdminAccount.set(this.adminAccounts()[0]);
    this.adminPassword.set('');
    this.authError.set(null);
    this.adminAuthOpen.set(true);
  }

  closeAdminAuth(): void {
    if (this.isAuthenticating) return;

    this.adminAuthOpen.set(false);
    this.selectedAdminAccount.set(null);
    this.adminPassword.set('');
    this.authError.set(null);
  }

  selectAdminAccount(account: StoredAccount): void {
    this.selectedAdminAccount.set(account);
    this.adminPassword.set('');
    this.authError.set(null);
  }

  onPasswordInput(value: string): void {
    this.adminPassword.set(value);
    this.authError.set(null);
  }

  loginSelectedAdmin(): void {
    const account = this.selectedAdminAccount();

    if (!account || this.isAuthenticating) return;

    const password = this.adminPassword().trim();

    if (!password) {
      this.authError.set('Ingresa la contraseña');
      return;
    }

    this.isAuthenticating = true;
    this.authError.set(null);

    const payload: LoginUser = {
      correo_electronico: account.email,
      contraseña: password,
      device_info: {
        deviceType: this.getDeviceType(),
        os: this.getOS(),
        browser: this.getBrowser()
      }
    };

    this.authService.login(payload).subscribe({
      next: () => {
        this.authService.getCurrentUser()
          .pipe(take(1))
          .subscribe({
            next: (me: any) => {
              const role = me.user?.role ?? '';

              if (!this.isAdminRole(role)) {
                this.authError.set('Esta cuenta no tiene permisos de administrador.');
                this.isAuthenticating = false;
                return;
              }

              // this.authService.setLoggedIn(true);

              this.updateStoredAccount({
                name: me.user?.name ?? account.name,
                email: me.user?.email ?? account.email,
                role: me.user?.role,
                avatar: this.buildAvatar(
                  me.user?.name ?? account.name,
                  me.profile?.avatar_url ?? account.avatar
                )
              });

              this.isAuthenticating = false;
              this.adminAuthOpen.set(false);

              if (isPlatformBrowser(this.platformId)) {
                const redirectUrl = localStorage.getItem('redirectAfterLogin');

                if (redirectUrl) {
                  localStorage.removeItem('redirectAfterLogin');
                  this.router.navigateByUrl(redirectUrl);
                } else {
                  this.router.navigate(['/dashboard']);
                }
              }
            },

            error: () => {
              this.authError.set('No se pudo verificar la cuenta.');
              this.isAuthenticating = false;
            }
          });
      },

      error: () => {
        this.authError.set('Credenciales inválidas.');
        this.isAuthenticating = false;
      }
    });
  }

  private loadAdminAccounts(): void {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(this.ACCOUNTS_KEY);

      if (!stored) {
        this.adminAccounts.set([]);
        return;
      }

      try {
        const accounts = JSON.parse(stored) as StoredAccount[];

        const admins = accounts
          .filter(account => this.isAdminRole(account.role))
          .map(account => ({
            ...account,
            avatar: this.buildAvatar(account.name, account.avatar)
          }));

        this.adminAccounts.set(admins);

        if (admins.length > 0 && !this.selectedAdminAccount()) {
          this.selectedAdminAccount.set(admins[0]);
        }
      } catch {
        this.adminAccounts.set([]);
      }
    }
  }

  private updateStoredAccount(updated: StoredAccount): void {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(this.ACCOUNTS_KEY);

      let accounts: StoredAccount[] = [];

      if (stored) {
        try {
          accounts = JSON.parse(stored) as StoredAccount[];
        } catch {
          accounts = [];
        }
      }

      const index = accounts.findIndex(account => account.email === updated.email);

      if (index >= 0) {
        accounts[index] = updated;
      } else {
        accounts.push(updated);
      }

      localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    this.loadAdminAccounts();
  }

  private isAdminRole(role?: string): boolean {
    const normalizedRole = (role ?? '')
      .toLowerCase()
      .trim();

    return (
      normalizedRole === 'admin' ||
      normalizedRole === 'administrador' ||
      normalizedRole === 'superadmin' ||
      normalizedRole === 'super administrador'
    );
  }

  private buildAvatar(name: string, avatarUrl?: string): string {
    if (avatarUrl?.trim()) {
      return avatarUrl;
    }

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || 'Admin'
    )}&background=27272a&color=f97316&size=128`;
  }

  private getBrowser(): string {
    const ua = navigator.userAgent;

    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('OPR') || ua.includes('Opera')) return 'Opera';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';

    return 'Unknown';
  }

  private getOS(): string {
    const ua = navigator.userAgent;

    if (ua.includes('Windows NT 10.0')) return 'Windows 10/11';
    if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
    if (ua.includes('Windows NT 6.2')) return 'Windows 8';
    if (ua.includes('Windows NT 6.1')) return 'Windows 7';

    if (ua.includes('Mac')) return 'MacOS';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    if (ua.includes('Linux')) return 'Linux';

    return 'Unknown';
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const ua = navigator.userAgent.toLowerCase();

    if (/tablet|ipad/.test(ua)) return 'tablet';
    if (/mobi|android|iphone/.test(ua)) return 'mobile';

    return 'desktop';
  }
}