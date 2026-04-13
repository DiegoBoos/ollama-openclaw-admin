import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Agent } from '../../services/api.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-title">
          <h1>🤖 Agents</h1>
          <p class="subtitle">Manage OpenClaw agents running under this instance</p>
        </div>
        <div class="header-actions">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search agents..."
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
            />
          </div>
          <button class="btn btn-ghost" (click)="refresh()" [disabled]="loading()">
            <span [class.animate-spin]="loading()">↻</span>
          </button>
        </div>
      </header>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="count">
          <span class="count-num">{{ filteredAgents().length }}</span>
          <span class="count-label">agent{{ filteredAgents().length !== 1 ? 's' : '' }}</span>
        </div>
        <div class="filter-chips">
          @for (filter of statusFilters; track filter.value) {
            <button
              class="chip"
              [class.active]="statusFilter() === filter.value"
              (click)="statusFilter.set(filter.value)"
            >
              {{ filter.label }}
            </button>
          }
        </div>
      </div>

      <!-- Agents Grid -->
      @if (filteredAgents().length > 0) {
        <div class="agents-grid">
          @for (agent of filteredAgents(); track agent.name || agent.key || $index) {
            <article class="agent-card" (click)="selectAgent(agent)" [class.selected]="selectedAgent() === agent">
              <header class="agent-header">
                <div class="agent-avatar">{{ (agent.name || agent.key || '?')[0].toUpperCase() }}</div>
                <div class="agent-identity">
                  <h3 class="agent-name">{{ agent.name || agent.key || 'Unknown Agent' }}</h3>
                  <span class="agent-model mono">{{ agent.model || 'default model' }}</span>
                </div>
                <span class="badge" [class.badge-success]="agent.status === 'active'" [class.badge-muted]="agent.status !== 'active'">
                  {{ agent.status || 'idle' }}
                </span>
              </header>

              <div class="agent-body">
                <dl class="agent-meta">
                  @if (agent.sessionKey || agent.key) {
                    <div class="meta-row">
                      <dt>Session</dt>
                      <dd class="mono">{{ agent.sessionKey || agent.key }}</dd>
                    </div>
                  }
                  @if (agent.channel) {
                    <div class="meta-row">
                      <dt>Channel</dt>
                      <dd>{{ agent.channel }}</dd>
                    </div>
                  }
                  @if (agent.lastActivity) {
                    <div class="meta-row">
                      <dt>Last Active</dt>
                      <dd>{{ agent.lastActivity }}</dd>
                    </div>
                  }
                  @if (agent.workspace) {
                    <div class="meta-row full">
                      <dt>Workspace</dt>
                      <dd class="mono truncate">{{ agent.workspace }}</dd>
                    </div>
                  }
                </dl>
              </div>

              @if (agent.skills && agent.skills.length > 0) {
                <footer class="agent-footer">
                  @for (skill of agent.skills.slice(0, 4); track skill) {
                    <span class="skill-tag">{{ skill }}</span>
                  }
                  @if (agent.skills.length > 4) {
                    <span class="skill-tag more">+{{ agent.skills.length - 4 }}</span>
                  }
                </footer>
              }
            </article>
          }
        </div>
      } @else {
        <div class="empty-state">
          <div class="empty-icon">🤖</div>
          <h3>No agents found</h3>
          <p>@if (searchQuery()) {
            No agents match your search criteria.
          } @else {
            No agents are running on this OpenClaw instance.
          }</p>
          <button class="btn btn-primary" (click)="refresh()">Check Again</button>
        </div>
      }

      <!-- Agent Detail Drawer -->
      @if (selectedAgent()) {
        <div class="drawer-overlay" (click)="selectedAgent.set(null)">
          <aside class="drawer" (click)="$event.stopPropagation()">
            <header class="drawer-header">
              <div class="drawer-title">
                <div class="agent-avatar-lg">{{ (selectedAgent()!.name || '?')[0].toUpperCase() }}</div>
                <div>
                  <h2>{{ selectedAgent()!.name || 'Unknown' }}</h2>
                  <span class="mono">{{ selectedAgent()!.model || 'default model' }}</span>
                </div>
              </div>
              <button class="btn btn-ghost btn-icon" (click)="selectedAgent.set(null)">✕</button>
            </header>

            <div class="drawer-body">
              <section class="detail-section">
                <h4>Status</h4>
                <div class="detail-row">
                  <span class="badge" [class.badge-success]="selectedAgent()!.status === 'active'" [class.badge-muted]="selectedAgent()!.status !== 'active'">
                    {{ selectedAgent()!.status || 'idle' }}
                  </span>
                </div>
              </section>

              @if (selectedAgent()!.sessionKey || selectedAgent()!.key) {
                <section class="detail-section">
                  <h4>Session Key</h4>
                  <code class="detail-code">{{ selectedAgent()!.sessionKey || selectedAgent()!.key }}</code>
                </section>
              }

              @if (selectedAgent()!.workspace) {
                <section class="detail-section">
                  <h4>Workspace</h4>
                  <code class="detail-code">{{ selectedAgent()!.workspace }}</code>
                </section>
              }

              @if (selectedAgent()!.skills?.length) {
                <section class="detail-section">
                  <h4>Skills ({{ selectedAgent()!.skills!.length }})</h4>
                  <div class="skill-list">
                    @for (skill of selectedAgent()!.skills; track skill) {
                      <span class="skill-tag">{{ skill }}</span>
                    }
                  </div>
                </section>
              }

              <section class="detail-section">
                <h4>Raw Data</h4>
                <pre class="detail-json">{{ selectedAgent() | json }}</pre>
              </section>
            </div>
          </aside>
        </div>
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
      margin-bottom: 20px;
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

    .search-box {
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .search-box input {
      background: var(--bg-input);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: 8px 14px 8px 36px;
      color: var(--text-primary);
      font-size: 0.85rem;
      width: 240px;
      outline: none;
    }

    .search-box input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-soft);
    }

    .search-box input::placeholder {
      color: var(--text-muted);
    }

    /* Filter Bar */
    .filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 12px 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
    }

    .count {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .count-num {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .count-label {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .filter-chips {
      display: flex;
      gap: 6px;
    }

    .chip {
      padding: 5px 14px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 500;
      border: 1px solid var(--border-default);
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
    }

    .chip:hover {
      background: var(--bg-elevated);
    }

    .chip.active {
      background: var(--accent-soft);
      color: var(--accent);
      border-color: var(--border-active);
    }

    /* Agents Grid */
    .agents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 16px;
    }

    .agent-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition-base);
    }

    .agent-card:hover {
      border-color: var(--border-default);
      background: var(--bg-card-hover);
    }

    .agent-card.selected {
      border-color: var(--agent-color);
      box-shadow: var(--shadow-agent-glow);
    }

    .agent-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 18px 20px 14px;
    }

    .agent-avatar {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: var(--agent-soft);
      color: var(--agent-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .agent-identity {
      flex: 1;
      min-width: 0;
    }

    .agent-name {
      font-size: 0.95rem;
      font-weight: 600;
      margin: 0;
    }

    .agent-model {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .agent-body {
      padding: 0 20px 14px;
    }

    .agent-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin: 0;
    }

    .meta-row {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .meta-row.full {
      grid-column: 1 / -1;
    }

    .meta-row dt {
      font-size: 0.68rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .meta-row dd {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .agent-footer {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 12px 20px;
      border-top: 1px solid var(--border-subtle);
    }

    .skill-tag {
      font-size: 0.68rem;
      padding: 3px 9px;
      border-radius: 12px;
      background: var(--info-soft);
      color: var(--info);
      font-weight: 500;
    }

    .skill-tag.more {
      background: var(--bg-elevated);
      color: var(--text-muted);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: var(--text-secondary);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px;
      font-size: 1.2rem;
    }

    .empty-state p {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-bottom: 20px;
    }

    /* Drawer */
    .drawer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: flex-end;
      z-index: 100;
      animation: fadeIn 0.15s ease;
    }

    .drawer {
      width: 480px;
      max-width: 90vw;
      background: var(--bg-secondary);
      height: 100%;
      overflow-y: auto;
      border-left: 1px solid var(--border-subtle);
      animation: slideInRight 0.2s ease;
    }

    .drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .drawer-title {
      display: flex;
      gap: 14px;
      align-items: center;
    }

    .agent-avatar-lg {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: var(--agent-soft);
      color: var(--agent-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.2rem;
    }

    .drawer-header h2 {
      margin: 0;
      font-size: 1.2rem;
    }

    .drawer-body {
      padding: 24px;
    }

    .detail-section {
      margin-bottom: 20px;
    }

    .detail-section h4 {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 10px;
    }

    .detail-row {
      display: flex;
      align-items: center;
    }

    .detail-code {
      background: var(--bg-primary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 8px 12px;
      font-size: 0.8rem;
      display: block;
      width: 100%;
      overflow-x: auto;
    }

    .skill-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .detail-json {
      background: var(--bg-primary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 16px;
      font-size: 0.75rem;
      color: var(--text-secondary);
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .mono { font-family: 'JetBrains Mono', monospace; }

    @media (max-width: 900px) {
      .page { padding: 16px; }
      .agents-grid { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: 12px; }
      .filter-bar { flex-direction: column; gap: 12px; }
    }
  `]
})
export class AgentsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private pollSub?: Subscription;

  agents = signal<Agent[]>([]);
  searchQuery = signal('');
  statusFilter = signal('all');
  selectedAgent = signal<Agent | null>(null);
  loading = signal(false);

  statusFilters = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'idle', label: 'Idle' }
  ];

  filteredAgents = computed(() => {
    let list = this.agents();
    const query = this.searchQuery().toLowerCase();
    const filter = this.statusFilter();

    if (query) {
      list = list.filter(a =>
        (a.name || '').toLowerCase().includes(query) ||
        (a.key || '').toLowerCase().includes(query) ||
        (a.model || '').toLowerCase().includes(query) ||
        (a.skills || []).some(s => s.toLowerCase().includes(query))
      );
    }

    if (filter !== 'all') {
      list = list.filter(a => (a.status || 'idle') === filter);
    }

    return list;
  });

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
        this.agents.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  selectAgent(agent: Agent) {
    this.selectedAgent.set(this.selectedAgent() === agent ? null : agent);
  }
}