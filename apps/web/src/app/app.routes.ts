import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'agents',
    loadComponent: () => import('./components/agents/agents.component').then(m => m.AgentsComponent)
  },
  {
    path: 'sessions',
    loadComponent: () => import('./components/sessions/sessions.component').then(m => m.SessionsComponent)
  },
  {
    path: 'logs',
    loadComponent: () => import('./components/logs/logs.component').then(m => m.LogsComponent)
  },
  {
    path: 'integrations',
    loadComponent: () => import('./components/integrations/integrations.component').then(m => m.IntegrationsComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent)
  },
  { path: '**', redirectTo: '' }
];