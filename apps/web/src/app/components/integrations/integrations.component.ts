import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div class="header-title">
          <h1>Integrations</h1>
          <p class="subtitle">Cross-service connections for agent creation</p>
        </div>
        <button class="btn btn-ghost" (click)="refresh()" [disabled]="loading()">
          <span [class.animate-spin]="loading()">↻</span>
        </button>
      </header>

      <!-- Integration Cards -->
      <div class="integrations-grid">
        <!-- Ollama -->
        <section class="integration-card card">
          <div class="card-header">
            <div class="int-icon-large">🐳</div>
            <div class="int-title">
              <h2 class="card-title">Ollama</h2>
              <span class="badge" [class.badge-success]="ollamaConnected()" [class.badge-danger]="!ollamaConnected()">
                {{ ollamaConnected() ? 'Connected' : 'Offline' }}
              </span>
            </div>
          </div>
          <div class="card-body">
            <p class="int-description">
              Local LLM inference engine. Provides models for agent execution.
            </p>
            
            @if (ollamaHealth()) {
              <div class="stats-row">
                <div class="stat">
                  <span class="stat-value">{{ ollamaModelCount() }}</span>
                  <span class="stat-label">Models</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ ollamaConnected() ? 'Active' : 'Down' }}</span>
                  <span class="stat-label">Status</span>
                </div>
              </div>
            }

            @if (ollamaModels().length > 0) {
              <div class="models-section">
                <h4>Available Models</h4>
                <div class="models-list">
                  @for (model of ollamaModels().slice(0, 5); track model.name) {
                    <span class="model-tag">{{ model.name }}</span>
                  }
                  @if (ollamaModels().length > 5) {
                    <span class="model-tag more">+{{ ollamaModels().length - 5 }}</span>
                  }
                </div>
              </div>
            }
          </div>
          <div class="card-footer">
            <small class="text-muted">Endpoint: localhost:11434</small>
          </div>
        </section>

        <!-- Siriscloud Auth -->
        <section class="integration-card card">
          <div class="card-header">
            <div class="int-icon-large">🔐</div>
            <div class="int-title">
              <h2 class="card-title">Siriscloud Auth</h2>
              <span class="badge" [class.badge-success]="sirisAuthOk()" [class.badge-danger]="!sirisAuthOk()">
                {{ sirisAuthOk() ? 'Healthy' : 'Down' }}
              </span>
            </div>
          </div>
          <div class="card-body">
            <p class="int-description">
              Authentication service. Validates credentials and manages sessions.
            </p>
            <div class="status-row">
              <span class="status-label">Service Status</span>
              <span class="status-value" [class.text-success]="sirisAuthOk()" [class.text-danger]="!sirisAuthOk()">
                {{ sirisAuthOk() ? 'Running' : 'Unavailable' }}
              </span>
            </div>
          </div>
          <div class="card-footer">
            <small class="text-muted">Required for secure agent operations</small>
          </div>
        </section>

        <!-- Siriscloud Integrations -->
        <section class="integration-card card">
          <div class="card-header">
            <div class="int-icon-large">🔌</div>
            <div class="int-title">
              <h2 class="card-title">Siriscloud Integrations</h2>
              <span class="badge" [class.badge-success]="sirisIntOk()" [class.badge-danger]="!sirisIntOk()">
                {{ sirisIntOk() ? 'Healthy' : 'Down' }}
              </span>
            </div>
          </div>
          <div class="card-body">
            <p class="int-description">
              External service integrations. Enables agents to interact with third-party APIs.
            </p>
            <div class="status-row">
              <span class="status-label">Service Status</span>
              <span class="status-value" [class.text-success]="sirisIntOk()" [class.text-danger]="!sirisIntOk()">
                {{ sirisIntOk() ? 'Running' : 'Unavailable' }}
              </span>
            </div>
          </div>
          <div class="card-footer">
            <small class="text-muted">Enables Discord, Telegram, and other channels</small>
          </div>
        </section>
      </div>

      <!-- Status Summary -->
      <section class="summary-card card">
        <div class="card-header">
          <h2 class="card-title">Integration Health Summary</h2>
        </div>
        <div class="card-body">
          <div class="health-grid">
            <div class="health-item" [class.healthy]="ollamaConnected()">
              <span class="health-icon">{{ ollamaConnected() ? '✓' : '✗' }}</span>
              <span class="health-label">Ollama</span>
            </div>
            <div class="health-item" [class.healthy]="sirisAuthOk()">
              <span class="health-icon">{{ sirisAuthOk() ? '✓' : '✗' }}</span>
              <span class="health-label">Siriscloud Auth</span>
            </div>
            <div class="health-item" [class.healthy]="sirisIntOk()">
              <span class="health-icon">{{ sirisIntOk() ? '✓' : '✗' }}</span>
              <span class="health-label">Siriscloud Integrations</span>
            </div>
          </div>

          @if (allHealthy()) {
            <div class="status-message success">
              <span class="status-icon">✓</span>
              All integrations healthy. Agent creation is fully operational.
            </div>
          } @else {
            <div class="status-message warning">
              <span class="status-icon">⚠</span>
              Some integrations are unavailable. Agent functionality may be limited.
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page {
      padding: 32px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-title h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .subtitle {
      color: var(--text-secondary);
      font-size: 0.85rem;
      margin-top: 4px;
    }

    .integrations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .integration-card {
      display: flex;
      flex-direction: column;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .int-icon-large {
      font-size: 2rem;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-elevated);
      border-radius: var(--radius-md);
    }

    .int-title {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    .card-title {
      margin: 0;
      font-size: 1rem;
    }

    .card-body {
      flex: 1;
      padding: 20px;
    }

    .int-description {
      color: var(--text-secondary);
      font-size: 0.85rem;
      margin: 0 0 16px;
      line-height: 1.5;
    }

    .stats-row {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-value {
      font-size: 1.2rem;
      font-weight: 600;
    }

    .stat-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .status-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .status-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .status-value {
      font-weight: 500;
    }

    .models-section {
      margin-top: 16px;
    }

    .models-section h4 {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 8px;
    }

    .models-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .model-tag {
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 12px;
      background: var(--bg-elevated);
      color: var(--text-secondary);
      font-family: 'JetBrains Mono', monospace;
    }

    .model-tag.more {
      color: var(--text-muted);
    }

    .card-footer {
      padding: 12px 20px;
      border-top: 1px solid var(--border-subtle);
      background: var(--bg-secondary);
    }

    /* Summary */
    .summary-card {
      margin-top: 0;
    }

    .health-grid {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
    }

    .health-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: var(--radius-md);
      background: var(--danger-soft);
      color: var(--danger);
      font-size: 0.85rem;
    }

    .health-item.healthy {
      background: var(--success-soft);
      color: var(--success);
    }

    .health-icon {
      font-weight: 700;
    }

    .status-message {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: 0.9rem;
    }

    .status-message.success {
      background: var(--success-soft);
      color: var(--success);
    }

    .status-message.warning {
      background: var(--warning-soft);
      color: var(--warning);
    }

    .status-icon {
      font-weight: 700;
    }

    .text-success { color: var(--success); }
    .text-danger { color: var(--danger); }
    .text-muted { color: var(--text-muted); }

    @media (max-width: 768px) {
      .page { padding: 16px; }
      .integrations-grid { grid-template-columns: 1fr; }
      .health-grid { flex-direction: column; }
    }
  `]
})
export class IntegrationsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private pollSub?: Subscription;

  ollamaHealth = signal<any>(null);
  ollamaModels = signal<any[]>([]);
  sirisHealth = signal<any>(null);
  loading = signal(false);

  ollamaConnected = computed(() => this.ollamaHealth()?.status === 'connected');
  ollamaModelCount = computed(() => this.ollamaHealth()?.models || 0);
  sirisAuthOk = computed(() => this.sirisHealth()?.services?.auth === 'ok');
  sirisIntOk = computed(() => this.sirisHealth()?.services?.integrations === 'ok');
  allHealthy = computed(() => 
    this.ollamaConnected() && this.sirisAuthOk() && this.sirisIntOk()
  );

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
      this.api.getOllamaHealth().toPromise(),
      this.api.getSiriscloudHealth().toPromise(),
      this.api.getOllamaModels().toPromise()
    ]).then(([ollama, siris, models]) => {
      this.ollamaHealth.set(ollama);
      this.sirisHealth.set(siris);
      this.ollamaModels.set(models?.models || []);
      this.loading.set(false);
    });
  }
}