import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, timeout } from 'rxjs';

// ───────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────

export interface GatewayStatus {
  gateway?: boolean;
  agents?: number;
  sessions?: number;
  defaultModel?: string;
  model?: string;
  runtimeVersion?: string;
  host?: string;
  uptime?: string;
  nodeVersion?: string;
  error?: boolean;
}

export interface Agent {
  name?: string;
  key?: string;
  sessionKey?: string;
  model?: string;
  status?: string;
  channel?: string;
  workspace?: string;
  skills?: string[];
  lastActivity?: string;
  createdAt?: string;
}

export interface OllamaHealth {
  status: string;
  models: number;
}

export interface OllamaModel {
  name: string;
  size?: string;
  modified_at?: string;
}

export interface SiriscloudHealth {
  overall: string;
  services: Record<string, string | undefined>;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000';

  // ─────────────────────────────────────────────────────────────
  // OpenClaw Core — Agent Management
  // ─────────────────────────────────────────────────────────────

  /** Get gateway status and runtime info */
  getStatus(): Observable<GatewayStatus> {
    return this.http.get<GatewayStatus>(`${this.baseUrl}/openclaw/status`).pipe(
      timeout(5000),
      catchError(() => of({ error: true, gateway: false }))
    );
  }

  /** List all active agents */
  getAgents(): Observable<Agent[]> {
    return this.http.get<Agent[]>(`${this.baseUrl}/openclaw/agents`).pipe(
      timeout(5000),
      catchError(() => of([]))
    );
  }

  /** Get recent gateway logs */
  getLogs(tail = 100): Observable<{ logs: string }> {
    return this.http.get<{ logs: string }>(`${this.baseUrl}/openclaw/logs?tail=${tail}`).pipe(
      timeout(5000),
      catchError(() => of({ logs: '' }))
    );
  }

  /** Launch OpenClaw gateway with optional model */
  launchOpenclaw(model?: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/openclaw/launch`, 
      { model }
    ).pipe(timeout(10000));
  }

  /** Stop OpenClaw gateway */
  stopOpenclaw(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/openclaw/stop`, 
      {}
    ).pipe(timeout(10000));
  }

  /** Restart OpenClaw gateway */
  restartOpenclaw(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/openclaw/restart`, 
      {}
    ).pipe(timeout(15000));
  }

  // ─────────────────────────────────────────────────────────────
  // Ollama Integration — Model Management
  // ─────────────────────────────────────────────────────────────

  /** Check Ollama health and model availability */
  getOllamaHealth(): Observable<OllamaHealth> {
    return this.http.get<OllamaHealth>(`${this.baseUrl}/ollama/health`).pipe(
      timeout(5000),
      catchError(() => of({ status: 'disconnected', models: 0 }))
    );
  }

  /** List available Ollama models */
  getOllamaModels(): Observable<{ models: OllamaModel[] }> {
    return this.http.get<{ models: OllamaModel[] }>(`${this.baseUrl}/ollama/models`).pipe(
      timeout(5000),
      catchError(() => of({ models: [] }))
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Siriscloud Integration — Cross-Service Auth
  // ─────────────────────────────────────────────────────────────

  /** Overall Siriscloud health */
  getSiriscloudHealth(): Observable<SiriscloudHealth> {
    return this.http.get<SiriscloudHealth>(`${this.baseUrl}/siriscloud/health`).pipe(
      timeout(5000),
      catchError(() => of({ overall: 'unavailable', services: {} }))
    );
  }

  /** Auth service health */
  getSiriscloudAuthHealth(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.baseUrl}/siriscloud/auth/health`).pipe(
      timeout(5000),
      catchError(() => of({ status: 'unavailable' }))
    );
  }

  /** Integrations service health */
  getSiriscloudIntegrationsHealth(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.baseUrl}/siriscloud/integrations/health`).pipe(
      timeout(5000),
      catchError(() => of({ status: 'unavailable' }))
    );
  }
}