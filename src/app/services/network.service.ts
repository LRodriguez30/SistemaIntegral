import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class NetworkService {

  private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  online$ = this.onlineSubject.asObservable();

  constructor() {
    window.addEventListener('online', () => {
      this.onlineSubject.next(true);
    });

    window.addEventListener('offline', () => {
      this.onlineSubject.next(false);
    });
  }
}