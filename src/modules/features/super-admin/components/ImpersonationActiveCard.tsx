/**
 * Impersonation Active Card Component
 * Displays current active impersonation session information
 * 
 * Features:
 * - Shows impersonated user and tenant
 * - Displays elapsed time (updates every second)
 * - End session button with confirmation
 * - Color-coded status
 * - Real-time timer
 * 
 * @component
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Alert,
  Empty,
} from 'antd';
import {
  StopOutlined,
  UserOutlined,
  BuildOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useImpersonation } from '../hooks/useImpersonation';
import { toast } from 'sonner';

interface ImpersonationActiveCardProps {
  /** Callback when session is ended */
  onSessionEnded?: () => void;
  
  /** Whether to auto-refresh active sessions */
  autoRefresh?: boolean;
}

/**
 * ImpersonationActiveCard Component
 * 
 * Displays active impersonation session information and controls
 */
export const ImpersonationActiveCard: React.FC<ImpersonationActiveCardProps> = ({
  onSessionEnded,
  autoRefresh = true,
}) => {
  const { activeSession, endSession, isEndingSession } = useImpersonation();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Update elapsed time every second
  useEffect(() => {
    if (!activeSession?.loginAt) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const loginTime = new Date(activeSession.loginAt).getTime();
      const elapsed = Math.floor((now - loginTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession?.loginAt]);

  /**
   * Format elapsed time as HH:MM:SS
   */
  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Handle end impersonation session
   */
  const handleEndSession = async () => {
    try {
      if (activeSession?.id) {
        await endSession(activeSession.id, []);
        toast.success('Impersonation session ended');
        onSessionEnded?.();
      }
    } catch (error) {
      console.error('End session error:', error);
      toast.error('Failed to end impersonation session');
    }
  };

  // No active session
  if (!activeSession) {
    return (
      <Card className="bg-white rounded-lg shadow-sm border-l-4 border-l-green-500">
        <Empty
          description="No Active Impersonation Session"
          style={{ marginTop: 12, marginBottom: 12 }}
        />
        <p className="text-sm text-gray-600 text-center">
          Start a new impersonation session to begin
        </p>
      </Card>
    );
  }

  return (
    <Card
      className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg shadow-sm border-l-4 border-l-orange-500"
      bordered={false}
    >
      {/* Alert Banner */}
      <Alert
        message="Impersonation Session Active"
        description="You are currently logged in as another user. All actions will be recorded in the audit log."
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Session Details Grid */}
      <Row gutter={[16, 16]} className="mb-6">
        {/* Impersonated User */}
        <Col xs={24} sm={12}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UserOutlined className="text-orange-600" />
              <span className="font-medium text-sm">Impersonated User</span>
            </div>
            <div className="text-lg font-semibold">
              {activeSession.impersonatedUserId}
            </div>
          </div>
        </Col>

        {/* Tenant */}
        <Col xs={24} sm={12}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BuildOutlined className="text-orange-600" />
              <span className="font-medium text-sm">Tenant</span>
            </div>
            <div className="text-lg font-semibold">
              {activeSession.tenantId}
            </div>
          </div>
        </Col>

        {/* Start Time */}
        <Col xs={24} sm={12}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ClockCircleOutlined className="text-orange-600" />
              <span className="font-medium text-sm">Started</span>
            </div>
            <div className="text-sm">
              {new Date(activeSession.loginAt).toLocaleTimeString()}
            </div>
          </div>
        </Col>

        {/* Elapsed Time */}
        <Col xs={24} sm={12}>
          <Statistic
            title="Elapsed Time"
            value={formatElapsedTime(elapsedSeconds)}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#ff7a45', fontSize: '18px' }}
          />
        </Col>
      </Row>

      {/* Reason (if provided) */}
      {activeSession.reason && (
        <div className="mb-4 p-3 bg-white rounded border border-orange-200">
          <span className="text-xs font-medium text-gray-700">Reason:</span>
          <p className="text-sm mt-1">{activeSession.reason}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Popconfirm
          title="End Impersonation"
          description="Are you sure you want to end this impersonation session? You will be logged back in as the original user."
          okText="Yes, End Session"
          okType="danger"
          cancelText="Keep Session"
          onConfirm={handleEndSession}
        >
          <Button
            type="primary"
            danger
            icon={<StopOutlined />}
            loading={isEndingSession}
          >
            End Session
          </Button>
        </Popconfirm>
      </div>
    </Card>
  );
};

export default ImpersonationActiveCard;