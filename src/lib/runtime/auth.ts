/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthScheme, AuthState } from '../../types';

export interface AuthAdapter {
  scheme: AuthScheme;
  state: AuthState;
  
  /**
   * Apply authentication to request options (headers or query params)
   */
  authenticate(options: RequestInit): RequestInit;
  
  /**
   * Refresh the token if applicable
   */
  refresh(): Promise<void>;
  
  /**
   * Execute initial login flow (e.g. redirect URL construction)
   */
  getLoginUrl(): string;
}

export class ApiKeyAdapter implements AuthAdapter {
  constructor(public scheme: AuthScheme, public state: AuthState) {}

  authenticate(options: RequestInit): RequestInit {
    const config = this.scheme.config?.apiKey;
    if (!config || !this.state.credentials?.apiKey) return options;

    const { location, name } = config;
    const value = this.state.credentials.apiKey;

    if (location === 'header') {
      const headers = new Headers(options.headers || {});
      headers.set(name, value);
      return { ...options, headers };
    } else {
      // Logic for query parameter injection usually happens at the URL construction level
      // but we can return it as updated headers if the server handles it or let the caller handle URL
      return options; 
    }
  }

  async refresh(): Promise<void> {
    // API Keys usually don't expire/refresh automatically via standard flows
    return;
  }

  getLoginUrl(): string {
    return '#'; // Simple input field usually
  }
}

export class OAuth2Adapter implements AuthAdapter {
  constructor(public scheme: AuthScheme, public state: AuthState) {}

  authenticate(options: RequestInit): RequestInit {
    if (!this.state.credentials?.accessToken) return options;

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${this.state.credentials.accessToken}`);
    return { ...options, headers };
  }

  async refresh(): Promise<void> {
    const config = this.scheme.config?.oauth2;
    const refresh = this.state.credentials?.refreshToken;
    if (!config || !refresh || !config.refreshUrl) return;

    // Standard OAuth2 refresh flow
    const response = await fetch(config.refreshUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh,
        client_id: config.clientId,
      }),
    });

    if (!response.ok) throw new Error('Token refresh failed');
    const data = await response.json();
    
    // Update state (caller should persist this)
    this.state.credentials = {
      ...this.state.credentials,
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };
  }

  getLoginUrl(): string {
    const config = this.scheme.config?.oauth2;
    if (!config) return '#';

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      scope: config.scopes.join(' '),
      redirect_uri: `${window.location.origin}/auth/callback`,
    });

    return `${config.authUrl}?${params}`;
  }
}
