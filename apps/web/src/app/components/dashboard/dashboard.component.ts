import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Agent } from '../../services/api.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-title">
          <h1>Dashboard</h1>
          <p class="subtitle">OpenClaw Agent Administration Panel</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-ghost" (click)="refresh()" [disabled]="loading()">
            <span class="icon" [class.animate-spin]="loading()">↻</span>
            Refresh
          </button>
        </div>
      </header>

      <!-- Status Overview Cards -->
      <section class="status-grid">
        <div class="status-card gateway">
          <div class="status-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m7.5 4.27 9 5.15"/>
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
              <path d="m3.3 7 8.7 5 8.7-5"/>
              <path d="M12 22V12"/>
            </svg>
          </div>
          <div class="status-content">
            <span class="status-label">Gateway</span>
            <span class="status-value" [class.online]="gatewayOnline()" [class.offline]="!gatewayOnline()">
              {{ gatewayOnline() ? 'Running' : 'Stopped' }}
            </span>
          </div>
          <span class="status-indicator" [class.active]="gatewayOnline()"></span>
        </div>

        <div class="status-card agents" [routerLink]="['/agents']">
          <div class="status-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 8V4H8"/>
              <rect width="16" height="12" x="4" y="8" rx="2"/>
              <path d="M2 14h2"/>
              <path d="M20 14h2"/>
              <path d="M15 13v2"/>
              <path d="M9 13v2"/>
            </svg>
          </div>
          <div class="status-content">
            <span class="status-label">Active Agents</span>
            <span class="status-value num">{{ activeAgentCount() }}</span>
          </div>
          <span class="status-detail">{{ totalAgents() }} total</span>
        </div>

        <div class="status-card sessions" [routerLink]="['/sessions']">
          <div class="status-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
              <rect width="10" height="8" x="7" y="8" rx="1"/>
            </svg>
          </div>
          <div class="status-content">
            <span class="status-label">Sessions</span>
            <span class="status-value num">{{ sessionCount() }}</span>
          </div>
        </div>

        <div class="status-card model">
          <div class="status-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <div class="status-content">
            <span class="status-label">Default Model</span>
            <span class="status-value mono truncate">{{ defaultModel() || '—' }}</span>
          </div>
        </div>
      </section>

      <!-- Gateway Controls -->
      <section class="card controls-card">
        <div class="card-header">
          <h2 class="card-title">Gateway Controls</h2>
        </div>
        <div class="controls-body">
          <div class="control-group">
            <button class="btn btn-success" (click)="launch()" [disabled]="gatewayOnline() || actionLoading()">
              <span class="icon">▶</span> Launch
            </button>
            <button class="btn btn-warning" (click)="restart()" [disabled]="!gatewayOnline() || actionLoading()">
              <span class="icon">↻</span> Restart
            </button>
            <button class="btn btn-danger" (click)="stop()" [disabled]="!gatewayOnline() || actionLoading()">
              <span class="icon">⏹</span> Stop
            </button>
          </div>
          @if (actionLoading()) {
            <span class="action-status animate-pulse">Processing...</span>
          }
        </div>
      </section>

      <!-- Two Column Layout -->
      <div class="grid grid-2">
        <!-- Agents Preview -->
        <section class="card">
          <div class="card-header">
            <h2 class="card-title">Recent Agents</h2>
            <a routerLink="/agents" class="link">View all →</a>
          </div>
          <div class="card-body p-0">
            @if (agents().length > 0) {
              @for (agent of agents().slice(0, 5); track agent.name || agent.key || $index) {
                <div class="agent-row" [routerLink]="['/agents']">
                  <div class="agent-avatar">{{ (agent.name || agent.key || '?')[0].toUpperCase() }}</div>
                  <div class="agent-info">
                    <span class="agent-name">{{ agent.name || agent.key || 'Unknown' }}</span>
                    <span class="agent-meta mono">{{ agent.model || 'default' }}</span>
                  </div>
                  <span class="badge" [class.badge-success]="agent.status === 'active'" [class.badge-muted]="agent.status !== 'active'">
                    {{ agent.status || 'idle' }}
                  </span>
                </div>
              }
            } @else {
              <div class="empty-state">
                <span class="empty-icon">🤖</span>
                <p>No agents detected</p>
                <small class="text-muted">Launch the gateway to start</small>
              </div>
            }
          </div>
        </section>

        <!-- Integrations Health -->
        <section class="card">
          <div class="card-header">
            <h2 class="card-title">Integrations</h2>
            <a routerLink="/integrations" class="link">Manage →</a>
          </div>
          <div class="card-body p-0">
            <div class="integration-row">
              <span class="int-icon">🐳</span>
              <span class="int-name">Ollama</span>
              <span class="badge" [class.badge-success]="ollamaConnected()" [class.badge-danger]="!ollamaConnected()">
                {{ ollamaConnected() ? 'Connected' : 'Offline' }}
              </span>
              @if (ollamaModelCount() > 0) {
                <span class="int-detail mono">{{ ollamaModelCount() }} models</span>
              }
            </div>
            <div class="integration-row">
              <span class="int-icon">🔐</span>
              <span class="int-name">Siriscloud Auth</span>
              <span class="badge" [class.badge-success]="sirisAuthOk()" [class.badge-danger]="!sirisAuthOk()">
                {{ sirisAuthOk() ? 'Healthy' : 'Down' }}
              </span>
            </div>
            <div class="integration-row">
              <span class="int-icon">🔌</span>
              <span class="int-name">Siriscloud Integrations</span>
              <span class="badge" [class.badge-success]="sirisIntOk()" [class.badge-danger]="!sirisIntOk()">
                {{ sirisIntOk() ? 'Healthy' : 'Down' }}
              </span>
            </div>
          </div>
        </section>
      </div>

      <!-- Runtime Info -->
      @if (status()) {
        <section class="card runtime-card">
          <div class="card-header">
            <h2 class="card-title">Runtime Information</h2>
          </div>
          <div class="runtime-grid">
            <div class="runtime-item">
              <span class="runtime-label">Version</span>
              <span class="runtime-value mono">{{ status()?.runtimeVersion || '—' }}</span>
            </div>
            <div class="runtime-item">
              <span class="runtime-label">Host</span>
              <span class="runtime-value mono">{{ status()?.host || '—' }}</span>
            </div>
            <div class="runtime-item">
              <span class="runtime-label">Uptime</span>
              <span class="runtime-value mono">{{ status()?.uptime || '—' }}</span>
            </div>
            <div class="runtime-item">
              <span class="runtime-label">Node</span>
              <span class="runtime-value mono">{{ status()?.nodeVersion || '—' }}</span>
            </div>
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .page {
      padding: 32px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
    }

    .header-title h1 {
      font-size: 1.6rem;
      font-weight: 600;
      margin: 0;
    }

    .subtitle {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-top: 4px;
    }

    .header-actions { display: flex; gap: 8px; }
    .icon { margin-right: 6px; }

    /* Status Grid */
    .status-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .status-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      position: relative;
      transition: all var(--transition-base);
    }

    .status-card:hover {
      border-color: var(--border-default);
      background: var(--bg-card-hover);
    }

    .status-card.agents,
    .status-card.sessions {
      cursor: pointer;
    }

    .status-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      flex-shrink: 0;
    }

    .status-card.gateway .status-icon { color: var(--accent); }
    .status-card.agents .status-icon { color: var(--agent-color); }

    .status-content {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }

    .status-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .status-value {
      font-size: 1.2rem;
      font-weight: 600;
    }

    .status-value.num { font-size: 1.6rem; }
    .status-value.online { color: var(--success); }
    .status-value.offline { color: var(--danger); }

    .status-indicator {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--danger);
    }

    .status-indicator.active {
      background: var(--success);
      box-shadow: 0 0 12px var(--success);
    }

    .status-detail {
      position: absolute;
      bottom: 12px;
      right: 16px;
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    /* Controls */
    .controls-card {
      margin-bottom: 24px;
    }

    .controls-body {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .control-group {
      display: flex;
      gap: 10px;
    }

    .action-status {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    /* Agent Row */
    .agent-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--border-subtle);
      cursor: pointer;
      transition: background var(--transition-fast);
    }

    .agent-row:last-child { border-bottom: none; }
    .agent-row:hover { background: var(--bg-card-hover); }

    .agent-avatar {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: var(--agent-soft);
      color: var(--agent-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      flex-shrink: 0;
    }

    .agent-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }

    .agent-name {
      font-weight: 500;
      font-size: 0.9rem;
    }

    .agent-meta {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Integration Row */
    .integration-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .integration-row:last-child { border-bottom: none; }

    .int-icon { font-size: 1.2rem; flex-shrink: 0; }
    .int-name { font-weight: 500; font-size: 0.9rem; flex: 1; }
    .int-detail { font-size: 0.75rem; color: var(--text-muted); }

    /* Runtime */
    .runtime-card { margin-top: 24px; }

    .runtime-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      background: var(--border-subtle);
    }

    .runtime-item {
      padding: 16px 20px;
      background: var(--bg-card);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .runtime-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .runtime-value {
      font-size: 0.9rem;
      font-weight: 500;
    }

    /* Empty State */
    .empty-state {
      padding: 40px 20px;
      text-align: center;
      color: var(--text-muted);
    }

    .empty-icon { font-size: 2.5rem; display: block; margin-bottom: 8px; }
    .empty-state p { margin-bottom: 4px; }

    .link {
      font-size: 0.8rem;
      color: var(--accent);
      text-decoration: none;
    }

    .link:hover { text-decoration: underline; }

    /* Responsive */
    @media (max-width: 1200px) {
      .status-grid { grid-template-columns: repeat(2, 1fr); }
      .runtime-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 768px) {
      .page { padding: 16px; }
      .status-grid { grid-template-columns: 1fr; }
      .grid-2 { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: 12px; }
      .runtime-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private pollSub?: Subscription;

  status = signal<any>(null);
  agents = signal<Agent[]>([]);
  ollamaHealth = signal<any>(null);
  sirisHealth = signal<any>(null);
  loading = signal(false);
  actionLoading = signal(false);

  // Computed values
  gatewayOnline = computed(() => !!this.status()?.gateway);
  totalAgents = computed(() => this.agents().length || this.status()?.agents || 0);
  activeAgentCount = computed(() => {
    const list = this.agents();
    if (list.length > 0) return list.filter(a => a.status === 'active').length;
    return this.status()?.activeAgents || 0;
  });
  sessionCount = computed(() => this.status()?.sessions || 0);
  defaultModel = computed(() => this.status()?.defaultModel || this.status()?.model);
  ollamaConnected = computed(() => this.ollamaHealth()?.status === 'connected');
  ollamaModelCount = computed(() => this.ollamaHealth()?.models || 0);
  sirisAuthOk = computed(() => this.sirisHealth()?.services?.auth === 'ok');
  sirisIntOk = computed(() => this.sirisHealth()?.services?.integrations === 'ok');

  ngOnInit() {
    this.refresh();
    this.pollSub = interval(15000).subscribe(() => this.refresh());
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  refresh() {
    this.loading.set(true);
    
    Promise.all([
      this.api.getStatus().toPromise(),
      this.api.getAgents().toPromise(),
      this.api.getOllamaHealth().toPromise(),
      this.api.getSiriscloudHealth().toPromise()
    ]).then(([status, agents, ollama, siris]) => {
      this.status.set(status);
      this.agents.set(Array.isArray(agents) ? agents : []);
      this.ollamaHealth.set(ollama);
      this.sirisHealth.set(siris);
      this.loading.set(false);
    });
  }

  launch() {
    this.actionLoading.set(true);
    this.api.launchOpenclaw().subscribe({
      complete: () => setTimeout(() => { this.refresh(); this.actionLoading.set(false); }, 2000),
      error: () => this.actionLoading.set(false)
    });
  }

  restart() {
    this.actionLoading.set(true);
    this.api.restartOpenclaw().subscribe({
      complete: () => setTimeout(() => { this.refresh(); this.actionLoading.set(false); }, 3000),
      error: () => this.actionLoading.set(false)
    });
  }

  stop() {
    this.actionLoading.set(true);
    this.api.stopOpenclaw().subscribe({
      complete: () => setTimeout(() => { this.refresh(); this.actionLoading.set(false); }, 1000),
      error: () => this.actionLoading.set(false)
    });
  }
}