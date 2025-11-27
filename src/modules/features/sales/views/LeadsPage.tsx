/**
 * Leads Page - Enterprise Design
 * Main leads dashboard with lead management and conversion tracking
 */

import React, { useState } from 'react';
import { Row, Col, Card, Button, Space, Typography } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { BarChart3, Target, TrendingUp, Users } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/common';
import { LeadList } from '../components/LeadList';
import { LeadFormPanel } from '../components/LeadFormPanel';
import { LeadDetailPanel } from '../components/LeadDetailPanel';
import { useLeadConversionMetrics } from '../hooks/useLeads';
import { LeadDTO } from '@/types/dtos';

const { Title } = Typography;

export const LeadsPage: React.FC = () => {
  const [selectedLead, setSelectedLead] = useState<LeadDTO | null>(null);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view' | null>(null);

  // Analytics data
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useLeadConversionMetrics();

  const handleRefresh = () => {
    refetchMetrics();
  };

  const handleCreate = () => {
    setSelectedLead(null);
    setDrawerMode('create');
  };

  const handleEdit = (lead: LeadDTO) => {
    setSelectedLead(lead);
    setDrawerMode('edit');
  };

  const handleView = (lead: LeadDTO) => {
    setSelectedLead(lead);
    setDrawerMode('view');
  };

  const handleConvert = (lead: LeadDTO) => {
    // This would typically open a customer creation/conversion modal
    console.log('Convert lead to customer:', lead);
  };

  const handleDrawerClose = () => {
    setDrawerMode(null);
    setSelectedLead(null);
  };

  const handleSuccess = () => {
    refetchMetrics();
  };

  return (
    <>
      <PageHeader
        title="Lead Management"
        description="Track and manage sales leads from capture to conversion"
        breadcrumb={{
          items: [
            { title: 'Dashboard', path: '/tenant/dashboard' },
            { title: 'Sales', path: '/tenant/sales' },
            { title: 'Leads' }
          ]
        }}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              New Lead
            </Button>
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Leads"
              value={metrics?.totalLeads || 0}
              description="All leads in system"
              icon={Users}
              color="primary"
              loading={metricsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Qualified Leads"
              value={metrics?.qualifiedLeads || 0}
              description="Ready for sales"
              icon={Target}
              color="success"
              loading={metricsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Conversion Rate"
              value={`${metrics?.conversionRate?.toFixed(1) || 0}%`}
              description="Leads to customers"
              icon={TrendingUp}
              color={metrics?.conversionRate && metrics.conversionRate > 10 ? 'success' : 'warning'}
              loading={metricsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Converted"
              value={metrics?.convertedLeads || 0}
              description="Successfully converted"
              icon={BarChart3}
              color="info"
              loading={metricsLoading}
            />
          </Col>
        </Row>

        {/* Conversion Funnel */}
        {metrics?.byStage && Object.keys(metrics.byStage).length > 0 && (
          <Card style={{ marginBottom: 24 }}>
            <Title level={4} style={{ marginBottom: 16 }}>Lead Stage Distribution</Title>
            <Row gutter={[16, 16]}>
              {Object.entries(metrics.byStage).map(([stage, count]) => (
                <Col xs={24} sm={12} md={8} lg={4} key={stage}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                      {count}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', textTransform: 'capitalize' }}>
                      {stage.replace('_', ' ')}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        )}

        {/* Leads List */}
        <LeadList
          onViewLead={handleView}
          onEditLead={handleEdit}
          onCreateLead={handleCreate}
        />
      </div>

      {/* Lead Form Panel (Create/Edit) */}
      <LeadFormPanel
        visible={drawerMode === 'create' || drawerMode === 'edit'}
        lead={drawerMode === 'edit' ? selectedLead : null}
        onClose={handleDrawerClose}
        onSuccess={handleSuccess}
      />

      {/* Lead Detail Panel (View) */}
      <LeadDetailPanel
        visible={drawerMode === 'view'}
        lead={selectedLead}
        onClose={handleDrawerClose}
        onEdit={handleEdit}
        onConvert={handleConvert}
      />
    </>
  );
};