import React from 'react';
import { ACTION_COLORS, STATUS_COLORS } from '@/types/logs';
import type { AuditLog } from '@/types/audit';

interface AuditLogsListProps {
  logs: AuditLog[];
  loading?: boolean;
}

export const AuditLogsList: React.FC<AuditLogsListProps> = ({ logs, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No audit logs found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}`}>
                  {log.action}
                </span>
                <span className="text-sm text-gray-500">{log.resource}</span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-500">{log.user.name}</span>
              </div>
              <p className="text-gray-900 mb-2">{log.resourceId}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{new Date(log.createdAt).toLocaleString()}</span>
                <span>{log.ipAddress}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};