import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div class="header-title">
          <h1>Logs</h1>
          <p class="subtitle">OpenClaw gateway logs</p>
        </div>
        <div class="header-actions">
          <select class="input select" [ngModel]="tailCount()" (ngModelChange)="tailCount.set($event); refresh()">
            <option value="50">Last 50 lines</option>
            <option value="100">Last 100 lines</option>
            <option value="200">Last 200 lines</option>
            <option value="500">Last 500 lines</option>
          </select>
          <button class="btn btn-ghost" (click)="refresh()" [disabled]="loading()">
            <span [class.animate-spin]="loading()">↻</span>
          </button>
        </div>
      </header>

      <div class="log-container card">
        <div class="log-header">
          <span class="log-title">Gateway Output</span>
          <button class="btn btn-sm btn-ghost" (click)="copyToClipboard()">Copy</button>
        </div>
        <div class="log-body">
          @if (logs()) {
            <pre class="log-content">{{ logs() }}</pre>
          } @else {
            <div class="empty-state">
              <div class="empty-icon">📜</div>
              <h3>No logs available</h3>
              <p>Start the gateway to see logs here.</p>
            </div>
          }
        </div>
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

    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .select {
      width: auto;
      min-width: 140px;
    }

    .log-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 200px);
      min-height: 400px;
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .log-title {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .log-body {
      flex: 1;
      overflow: auto;
      padding: 16px;
    }

    .log-content {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      line-height: 1.6;
      color: var(--text-secondary);
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
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

    @media (max-width: 768px) {
      .page { padding: 16px; }
      .header-actions { flex-direction: column; }
    }
  `]
})
export class LogsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private pollSub?: Subscription;

  logs = signal<string>('');
  tailCount = signal(100);
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
    this.api.getLogs(this.tailCount()).subscribe({
      next: (data) => {
        this.logs.set(data.logs || '');
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  copyToClipboard() {
    if (this.logs()) {
      navigator.clipboard.writeText(this.logs());
    }
  }
}