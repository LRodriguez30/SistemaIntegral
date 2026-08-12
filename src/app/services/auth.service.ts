import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';
import { BehaviorSubject, catchError, map, Observable, of, switchMap, throwError } from 'rxjs';
import { Profile } from './profiles.service';

interface User {
  name: string;
  email: string;
  password_hash: string;
  role: string;
}

interface GetUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
}

interface DeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  deviceName: string;
  os: string;
  browser: string;
}

interface RegisterUser {
  user: User;
  device_info: object
}

export interface LoginUser {
  email: string,
  password_hash: string,
  device_info: DeviceInfo
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private url = `${baseUrl}/auth`;

  constructor(private http: HttpClient) { }

  private loggedIn = false;

  private sessionReady = new BehaviorSubject<boolean>(false);
  sessionReady$ = this.sessionReady.asObservable();


  withAuth<T>(request$: Observable<T>) {
    return request$.pipe(
      catchError(err => {

        // 🔴 ERROR DE RED / BACKEND CAÍDO
        if (!err.status || err.status === 0) {
          return throwError(() => ({
            ...err,
            code: 'NETWORK_ERROR'
          }));
        }

        // 🔐 TOKEN EXPIRADO
        if (err.status === 401) {
          return this.refresh().pipe(
            switchMap(() => request$),
            catchError(refreshErr => {
              this.logout();
              return throwError(() => refreshErr);
            })
          );
        }

        return throwError(() => err);
      })
    );
  }

  setLoggedIn(value: boolean) {
    this.loggedIn = value;
  }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }


  getCurrentUser(): Observable<{ user: GetUser; profile: Profile }> {
    return this.http.get<{ user: GetUser; profile: Profile }>(
      `${this.url}/me`,
      { withCredentials: true }
    );
  }

  login(data: LoginUser) {
    return this.http.post(
      `${this.url}/login`,
      data,
      { withCredentials: true }
    );
  }

  register(data: RegisterUser) {
    return this.http.post(
      `${this.url}/register`,
      data,
      { withCredentials: true }
    );
  }

  logout() {
    return this.http.post(
      `${this.url}/logout`,
      {},
      { withCredentials: true }
    );
  }

  refresh() {
    return this.http.post(
      `${this.url}/refresh`,
      {},
      { withCredentials: true }
    );
  }
}