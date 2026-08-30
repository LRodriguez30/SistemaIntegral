import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, switchMap, throwError } from 'rxjs';
import { baseUrl } from '../app';
import { PersonasResponse } from './personas.service';
import { UsersResponse } from './users.service';


// =========================================================
// USUARIO AUTENTICADO
// =========================================================

export interface AuthUser {
  persona: PersonasResponse;
  user: UsersResponse;
}


// =========================================================
// LOGIN
// =========================================================

export interface LoginUser {
  correo_electronico: string;
  contraseña: string;
  device_info: {
    deviceType: string;
    os: string;
    browser: string;
  };
}


// =========================================================
// REGISTER
// =========================================================

export interface RegisterUser {
  persona: {
    primer_nombre: string;
    segundo_nombre?: string;
    primer_apellido: string;
    segundo_apellido?: string;
    telefono: string;
  };

  user: {
    nombre_usuario: string;
    correo_electronico: string;
    contraseña: string;
    rol_id: number;
  };

  device_info: {
    deviceType: string;
    os: string;
    browser: string;
  };
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly url = `${baseUrl}/auth`;

  // =======================================================
  // ESTADO
  // =======================================================

  private readonly currentUserSubject =
    new BehaviorSubject<AuthUser | null>(null);

  readonly currentUser$ =
    this.currentUserSubject.asObservable();


  private readonly sessionReadySubject =
    new BehaviorSubject<boolean>(false);

  readonly sessionReady$ =
    this.sessionReadySubject.asObservable();


  constructor(
    private readonly http: HttpClient
  ) { }


  // =======================================================
  // LOGIN
  // =======================================================

  login(data: LoginUser): Observable<any> {

    return this.http.post(
      `${this.url}/login`,
      data,
      {
        withCredentials: true
      }
    );
  }


  // =======================================================
  // USUARIO ACTUAL
  // =======================================================

  getCurrentUser(): Observable<AuthUser> {

    return this.http.get<AuthUser>(
      `${this.url}/me`,
      {
        withCredentials: true
      }
    );
  }


  // =======================================================
  // CARGAR SESIÓN
  // =======================================================

  loadCurrentUser(): Observable<AuthUser | null> {

    return this.getCurrentUser().pipe(

      catchError(() => {

        this.currentUserSubject.next(null);
        this.sessionReadySubject.next(true);

        return of(null);

      })

    );

  }


  // =======================================================
  // ESTABLECER USUARIO
  // =======================================================

  setCurrentUser(response: AuthUser): void {

    this.currentUserSubject.next(response);

    this.sessionReadySubject.next(true);

  }


  // =======================================================
  // OBTENER USUARIO EN MEMORIA
  // =======================================================

  getCurrentUserSnapshot(): AuthUser | null {

    return this.currentUserSubject.value;

  }


  // =======================================================
  // REFRESH
  // =======================================================

  refresh(): Observable<any> {

    return this.http.post(
      `${this.url}/refresh`,
      {},
      {
        withCredentials: true
      }
    );

  }


  // =======================================================
  // LOGOUT
  // =======================================================

  logout(): Observable<any> {

    return this.http.post(
      `${this.url}/logout`,
      {},
      {
        withCredentials: true
      }
    ).pipe(

      catchError(error => {

        // Aunque el backend falle,
        // limpiamos la sesión local.

        this.currentUserSubject.next(null);
        this.sessionReadySubject.next(true);

        return throwError(() => error);

      })

    );

  }


  // =======================================================
  // INTERCEPTAR PETICIONES CON AUTENTICACIÓN
  // =======================================================

  withAuth<T>(request$: Observable<T>): Observable<T> {

    return request$.pipe(

      catchError(error => {

        // Backend caído / error de red
        if (!error.status || error.status === 0) {

          return throwError(() => ({
            ...error,
            code: 'NETWORK_ERROR'
          }));

        }


        // Access Token expirado
        if (error.status === 401) {

          return this.refresh().pipe(

            switchMap(() => {

              return request$;

            }),

            catchError(refreshError => {

              this.currentUserSubject.next(null);
              this.sessionReadySubject.next(true);

              return throwError(() => refreshError);

            })

          );

        }


        return throwError(() => error);

      })

    );

  }


  // =======================================================
  // REGISTRO
  // =======================================================

  register(data: RegisterUser): Observable<any> {

    return this.http.post(
      `${this.url}/register`,
      data,
      {
        withCredentials: true
      }
    );

  }

}