import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';
import { Observable } from 'rxjs';

export interface Profile {
  id: string;
  user_id: string;

  display_name: string;
  bio: string;
  avatar_url: string;

  career: string;
  semester: number;

  public_profile: boolean;

  interests: any;
  tags: any;
  links: any;

  status: string;
  phone_number: string;

  created_at?: string;
  updated_at?: string;
}

export interface UpdateProfile {
  display_name?: string;
  bio?: string;
  avatar_url?: string;

  career?: string;
  semester?: number;

  public_profile?: boolean;

  interests?: string[];
  tags?: string[];

  links?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };

  status?: string;
  phone_number?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfilesService {

  private url = `${baseUrl}/profiles`;

  constructor(private http: HttpClient) { }

  getProfileByUserId(userId: string): Observable<Profile> {
    return this.http.get<Profile>(`${this.url}/${userId}`, {
      withCredentials: true
    });
  }

  updateProfile(userId: string, payload: UpdateProfile): Observable<Profile> {
    return this.http.patch<Profile>(`${this.url}/${userId}`, payload, {
      withCredentials: true
    });
  }
}