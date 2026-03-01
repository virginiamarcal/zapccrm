/**
 * Bridge Logging Service — Story 2.1
 *
 * Centralized logging for all sync operations with detailed tracking.
 */

import type { UUID, Timestamp } from '../db/schema';
import type { LogLevel, LogEntry } from './types';

class BridgeLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 10000; // Keep last 10k logs in memory

  /**
   * Log a sync operation
   */
  log(
    level: LogLevel,
    component: string,
    action: string,
    orgId: UUID | undefined,
    status: 'success' | 'failure' | 'pending',
    details?: Record<string, any>,
    error?: Error
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      action,
      org_id: orgId,
      status,
      details,
      error: error?.message,
    };

    this.logs.push(entry);

    // Keep memory bounded
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also output to console in dev
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[${entry.timestamp}] ${level.toUpperCase()} [${component}] ${action}`,
        {
          org_id: orgId,
          status,
          details,
          error: error?.message,
        }
      );
    }
  }

  /**
   * Log sync start
   */
  logSyncStart(component: string, orgId: UUID, action: string): void {
    this.log(
      'info',
      component,
      action,
      orgId,
      'pending',
      { stage: 'started' }
    );
  }

  /**
   * Log sync success
   */
  logSyncSuccess(
    component: string,
    orgId: UUID,
    action: string,
    details?: Record<string, any>
  ): void {
    this.log('info', component, action, orgId, 'success', details);
  }

  /**
   * Log sync failure
   */
  logSyncFailure(
    component: string,
    orgId: UUID,
    action: string,
    error: Error,
    details?: Record<string, any>
  ): void {
    this.log('error', component, action, orgId, 'failure', details, error);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Filter logs by criteria
   */
  filterLogs(criteria: {
    component?: string;
    action?: string;
    org_id?: UUID;
    level?: LogLevel;
    status?: 'success' | 'failure' | 'pending';
  }): LogEntry[] {
    return this.logs.filter((log) => {
      if (criteria.component && log.component !== criteria.component) return false;
      if (criteria.action && log.action !== criteria.action) return false;
      if (criteria.org_id && log.org_id !== criteria.org_id) return false;
      if (criteria.level && log.level !== criteria.level) return false;
      if (criteria.status && log.status !== criteria.status) return false;
      return true;
    });
  }

  /**
   * Clear logs
   */
  clear(): void {
    this.logs = [];
  }
}

// Export singleton instance
export const bridgeLogger = new BridgeLogger();
export default bridgeLogger;
