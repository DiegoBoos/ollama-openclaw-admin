import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div class="header-title">
          <h1>Settings</h1>
          <p class="subtitle">Configure OpenClaw admin preferences</p>
        </div>
      </header>

      <div class="settings-grid">
        <!-- Gateway Settings -->
        <section class="card">
          <div class="card-header">
            <h2 class="card-title">Gateway Settings</h2>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Default Model</label>
              <input 
                type="text" 
                class="input" 
                placeholder="e.g., llama2, mistral, codellama"
                [ngModel]="defaultModel()"
                (ngModelChange)="defaultModel.set($event)"
              />
              <small class="form-hint">The default model to use when launching new agents</small>
            </div>

            <div class="form-group">
              <label class="form-label">Gateway URL</label>
              <input 
                type="text" 
                class="input mono" 
                placeholder="http://127.0.0.1:18789"
                [ngModel]="gatewayUrl()"
                (ngModelChange)="gatewayUrl.set($event)"
              />
              <small class="form-hint">OpenClaw gateway endpoint</small>
            </div>

            <div class="form-group">
              <label class="form-label">Auto-refresh Interval</label>
              <select class="input select" [ngModel]="refreshInterval()" (ngModelChange)="refreshInterval.set($event)">
                <option value="5000">5 seconds</option>
                <option value="10000">10 seconds</option>
                <option value="15000">15 seconds</option>
                <option value="30000">30 seconds</option>
                <option value="60000">1 minute</option>
              </select>
              <small class="form-hint">How often to refresh dashboard data</small>
            </div>
          </div>
        </section>

        <!-- API Configuration -->
        <section class="card">
          <div class="card-header">
            <h2 class="card-title">API Configuration</h2>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Backend URL</label>
              <input 
                type="text" 
                class="input mono" 
                placeholder="http://localhost:3000"
                [ngModel]="apiUrl()"
                (ngModelChange)="apiUrl.set($event)"
              />
              <small class="form-hint">Admin API backend endpoint</small>
            </div>

            <div class="form-group">
              <label class="form-label">Request Timeout</label>
              <select class="input select" [ngModel]="timeout()" (ngModelChange)="timeout.set($event)">
                <option value="5000">5 seconds</option>
                <option value="10000">10 seconds</option>
                <option value="30000">30 seconds</option>
              </select>
              <small class="form-hint">Timeout for API requests</small>
            </div>
          </div>
        </section>

        <!-- Display Settings -->
        <section class="card">
          <div class="card-header">
            <h2 class="card-title">Display Settings</h2>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Agents per page</label>
              <select class="input select" [ngModel]="agentsPerPage()" (ngModelChange)="agentsPerPage.set($event)">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" [ngModel]="showNotifications()" (ngModelChange)="showNotifications.set($event)" />
                <span>Show desktop notifications</span>
              </label>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" [ngModel]="compactMode()" (ngModelChange)="compactMode.set($event)" />
                <span>Compact mode</span>
              </label>
            </div>
          </div>
        </section>

        <!-- About -->
        <section class="card">
          <div class="card-header">
            <h2 class="card-title">About</h2>
          </div>
          <div class="card-body">
            <div class="about-info">
              <div class="about-row">
                <span class="about-label">Version</span>
                <span class="about-value">1.0.0</span>
              </div>
              <div class="about-row">
                <span class="about-label">Framework</span>
                <span class="about-value">Angular 21</span>
              </div>
              <div class="about-row">
                <span class="about-label">License</span>
                <span class="about-value">MIT</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Save Button -->
      <div class="actions-bar">
        <button class="btn btn-primary" (click)="saveSettings()">
          Save Settings
        </button>
        <button class="btn btn-ghost" (click)="resetSettings()">
          Reset to Defaults
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page {
      padding: 32px;
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header {
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

    .settings-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--text-primary);
    }

    .form-hint {
      display: block;
      margin-top: 6px;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .checkbox-label input {
      width: 18px;
      height: 18px;
      accent-color: var(--accent);
    }

    .select {
      appearance: none;
      padding-right: 36px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
    }

    .about-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .about-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--border-subtle);
    }

    .about-row:last-child {
      border-bottom: none;
    }

    .about-label {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .about-value {
      font-weight: 500;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
    }

    .actions-bar {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--border-subtle);
    }

    .mono { font-family: 'JetBrains Mono', monospace; }

    @media (max-width: 768px) {
      .page { padding: 16px; }
    }
  `]
})
export class SettingsComponent {
  private api = inject(ApiService);

  // Gateway settings
  defaultModel = signal('llama2');
  gatewayUrl = signal('http://127.0.0.1:18789');
  refreshInterval = signal('10000');

  // API settings
  apiUrl = signal('http://localhost:3000');
  timeout = signal('10000');

  // Display settings
  agentsPerPage = signal('25');
  showNotifications = signal(true);
  compactMode = signal(false);

  saveSettings() {
    // In a real app, this would persist to localStorage or backend
    const settings = {
      defaultModel: this.defaultModel(),
      gatewayUrl: this.gatewayUrl(),
      refreshInterval: this.refreshInterval(),
      apiUrl: this.apiUrl(),
      timeout: this.timeout(),
      agentsPerPage: this.agentsPerPage(),
      showNotifications: this.showNotifications(),
      compactMode: this.compactMode()
    };
    
    localStorage.setItem('openclaw-admin-settings', JSON.stringify(settings));
    console.log('Settings saved:', settings);
  }

  resetSettings() {
    this.defaultModel.set('llama2');
    this.gatewayUrl.set('http://127.0.0.1:18789');
    this.refreshInterval.set('10000');
    this.apiUrl.set('http://localhost:3000');
    this.timeout.set('10000');
    this.agentsPerPage.set('25');
    this.showNotifications.set(true);
    this.compactMode.set(false);
  }
}