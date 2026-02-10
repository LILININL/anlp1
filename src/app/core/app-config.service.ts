import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

interface AppConfig {
  apiUrl: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  constructor(private http: HttpClient) { }

  load(): Promise<void> {
    return this.http.get<AppConfig>(`assets/${environment.appConfig}`)
      .toPromise()
      .then(cfg => {
        globalThis.apiUrl = cfg.apiUrl;
      })
      .catch(err => {
        console.error('Failed to load app config', err);
      });
  }
}
