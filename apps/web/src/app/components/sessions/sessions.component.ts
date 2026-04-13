import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div class="header-title">
          <h1>Sessions</h1>
          <p class="subtitle">Active OpenClaw agent sessions</p>
        </div>
        <button class="btn btn-ghost" (click)="refresh()" [disabled]="loading()">
          <span [class.animate-spin]="loading()">↻</span>
        </button>
      </header>

      <div class="sessions-card card">
        <div class="card-header">
          <h2 class="card-title">Session List</h2>
          <span class="badge badge-muted">{{ sessions().length }} total</span>
        </div>

        @if (sessions().length > 0) {
          <div class="session-list">
            @for (session of sessions(); track session.key || $index) {
              <div class="session-row">
                <div class="session-info">
                  <span class="session-name">{{ session.name || session.key || 'Unknown' }}</span>
                  <span class="session-key mono">{{ session.key || '—' }}</span>
                </div>
                <div class="session-meta">
                  @if (session.model) {
                    <span class="meta-tag">{{ session.model }}</span>
                  }
                  <span class="badge" [class.badge-success]="session.status === 'active'" [class.badge-muted]="session.status !== 'active'">
                    {{ session.status || 'idle' }}
                  </span>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>No active sessions</h3>
            <p>Launch the gateway and create agents to see sessions here.</p>
          </div>
        }
      </div>
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

    .sessions-card {
      margin-top: 0;
    }

    .session-list {
      padding: 0;
    }

    .session-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-bottom: 1px solid var(--border-subtle);
      transition: background var(--transition-fast);
    }

    .session-row:last-child {
      border-bottom: none;
    }

    .session-row:hover {
      background: var(--bg-card-hover);
    }

    .session-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .session-name {
      font-weight: 500;
      font-size: 0.9rem;
    }

    .session-key {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .session-meta {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .meta-tag {
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 12px;
      background: var(--bg-elevated);
      color: var(--text-secondary);
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 12px;
    }

    .empty-state h3 {
      margin: 0 0 8px;
      font-size: 1.1rem;
    }

    .empty-state p {
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .mono { font-family: 'JetBrains Mono', monospace; }

    @media (max-width: 768px) {
      .page { padding: 16px; }
    }
  `]
})
export class SessionsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private pollSub?: Subscription;

  sessions = signal<any[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.refresh();
    this.pollSub = interval(10000).subscribe(() => this.refresh());
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  refresh() {
    this.loading.set(true);
    this.api.getAgents().subscribe({
      next: (data) => {
        this.sessions.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}