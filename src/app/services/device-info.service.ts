// device-info.service.ts
import { Injectable } from '@angular/core';

export interface DeviceInfoDTO {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  deviceName: string;
  os: string;
  browser?: string;
}

@Injectable({ providedIn: 'root' })
export class DeviceInfoService {

  getDeviceInfo(): DeviceInfoDTO {
    const ua = navigator.userAgent;

    return {
      deviceType: this.getDeviceType(ua),
      deviceName: this.getDeviceName(ua),
      os: this.getOS(ua),
      browser: this.getBrowser(ua),
    };
  }

  private getDeviceType(ua: string): 'desktop' | 'mobile' | 'tablet' {
    if (/ipad|tablet/i.test(ua)) return 'tablet';
    if (/android|iphone|mobile/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  private getOS(ua: string): string {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private getBrowser(ua: string): string {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getDeviceName(ua: string): string {
    return `${this.getOS(ua)} - ${this.getBrowser(ua)}`;
  }
}