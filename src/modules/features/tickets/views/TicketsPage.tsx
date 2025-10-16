/**
 * Tickets Page - Enterprise Design
 * Main tickets dashboard with statistics and ticket management
 * Redesigned with Ant Design and EnterpriseLayout
 */

import React, { useState } from 'react';
import { Row, Col, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { 
  Activity,
  AlertCircle,
  Clock,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { Ticket } from '@/types/crm';
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PageHeader, StatCard } from '@/components/common';
import { TicketsList } from '../components/TicketsList';
import { useTicketStats, useTickets } from '../hooks/useTickets';
import { useTicketStore } from '../store/ticketStore';

export const TicketsPage: React.FC = () => {
  const { filters } = useTicketStore();
  const { data: stats, isLoading: statsLoading } = useTicketStats();
  const { isLoading: ticketsLoading } = useTickets(filters);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const handleCreateTicket = () => {
    setShowCreateModal(true);
  };

  const handleEditTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowEditModal(true);
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowViewModal(true);
  };

  return (
    <EnterpriseLayout>
      <PageHeader
        title="Support Tickets"
        description="Manage customer support requests and track resolution progress"
        breadcrumb={{
          items: [
            { title: 'Home', path: '/tenant/dashboard' },
            { title: 'Support Tickets' }
          ]
        }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateTicket}>
            New Ticket
          </Button>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Tickets"
              value={stats?.total || 0}
              description="All support tickets"
              icon={Activity}
              color="primary"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Open Tickets"
              value={stats?.openTickets || 0}
              description="Awaiting resolution"
              icon={AlertCircle}
              color="warning"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Resolved Today"
              value={stats?.resolvedToday || 0}
              description="Tickets resolved today"
              icon={CheckCircle}
              color="success"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Overdue Tickets"
              value={stats?.overdueTickets || 0}
              description="Past due date"
              icon={Calendar}
              color="error"
              loading={statsLoading}
            />
          </Col>
        </Row>

        {/* Status Breakdown */}
        {stats && stats.byStatus && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#111827' }}>
                Tickets by Status
              </h2>
            </Col>
            {Object.entries(stats.byStatus).map(([status, count]) => {
              const statusConfig: Record<string, { icon: any; color: 'primary' | 'warning' | 'success' | 'info' }> = {
                open: { icon: AlertCircle, color: 'primary' },
                in_progress: { icon: Clock, color: 'warning' },
                resolved: { icon: CheckCircle, color: 'success' },
                closed: { icon: CheckCircle, color: 'info' }
              };
              const config = statusConfig[status] || statusConfig.open;
              
              return (
                <Col xs={24} sm={12} lg={6} key={status}>
                  <StatCard
                    title={status.replace('_', ' ').toUpperCase()}
                    value={count}
                    description={`${status.replace('_', ' ')} tickets`}
                    icon={config.icon}
                    color={config.color}
                    loading={statsLoading}
                  />
                </Col>
              );
            })}
          </Row>
        )}

        {/* Tickets List */}
        <TicketsList
          onCreateTicket={handleCreateTicket}
          onEditTicket={handleEditTicket}
          onViewTicket={handleViewTicket}
        />
      </div>

      {/* Modals would go here */}
      {/* TODO: Add CreateTicketModal, EditTicketModal, ViewTicketModal */}
    </EnterpriseLayout>
  );
};
