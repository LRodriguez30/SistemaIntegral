import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../app';
import { Observable } from 'rxjs';

export interface Group {
  uuid: string;
  name: string;
  description: string;
  owner_id: string;
  max_members: number;
  location: string;
  status: string;
  members_count: MembersCount[];
  owner?: GroupOwner;
}

export interface MembersCount {
  count: number;
}

export interface GroupOwner {
  id: string;
  email: string;
  profile?: UserProfile[];
}

export interface UserProfile {
  display_name: string;
  avatar_url: string;
  career: string;
  semester: string | number;
}

@Injectable({ providedIn: 'root' })
export class GroupsService {

  private url = `${baseUrl}/groups`;

  constructor(private http: HttpClient) { }

  getAllGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.url}`, {
      withCredentials: true
    });
  }
}