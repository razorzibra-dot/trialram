/**
 * Sales Page
 * Main sales dashboard with statistics and deal management
 */

import React, { useState } from 'react';
import { Row, Col, Card, Badge, Typography } from 'antd';
import { 
  TrendingUp,
  DollarSign,
  Target,
  BarChart3
} from 'lucide-react';
import { Deal } from '@/types/crm';
import { PageHeader, StatCard } from '@/components/common';
import { SalesList } from '../components/SalesList';
import { useSalesStats, useDeals } from '../hooks/useSales';
import { useSalesStore } from '../store/salesStore';

const { Title } = Typography;

export const SalesPage: React.FC = () => {
  const { filters } = useSalesStore();
  const { data: stats, isLoading: statsLoading } = useSalesStats();
  const { isLoading: dealsLoading } = useDeals(filters);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const handleCreateDeal = () => {
    setShowCreateModal(true);
  };

  const handleEditDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setShowEditModal(true);
  };

  const handleViewDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setShowViewModal(true);
  };

  const StageCard = ({ 
    stage, 
    count, 
    value, 
    loading = false 
  }: {
    stage: string;
    count: number;
    value: number;
    loading?: boolean;
  }) => {
    const stageColors: Record<string, string> = {
      lead: 'default',
      qualified: 'processing',
      proposal: 'warning',
      negotiation: 'warning',
      closed_won: 'success',
      closed_lost: 'error'
    };

    const color = stageColors[stage] || 'default';

    return (
      <Card variant="borderless" loading={loading}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Badge status={color as 'default' | 'processing' | 'warning' | 'success' | 'error'} text={stage.replace('_', ' ').toUpperCase()} />
          <span style={{ fontWeight: 500 }}>{count}</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{formatCurrency(value)}</div>
      </Card>
    );
  };

  return (
    <>
      <PageHeader
        title="Sales Dashboard"
        description="Track your sales performance and manage your pipeline"
        breadcrumb={{
          items: [
            { title: 'Dashboard', path: '/tenant/dashboard' },
            { title: 'Sales' }
          ]
        }}
      />

      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Deals"
              value={stats?.total || 0}
              description="Active deals in pipeline"
              icon={Target}
              color="primary"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Value"
              value={formatCurrency(stats?.totalValue || 0)}
              description="Combined deal value"
              icon={DollarSign}
              color="success"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Conversion Rate"
              value={formatPercentage(stats?.conversionRate || 0)}
              description="Deals closed won"
              icon={TrendingUp}
              color={stats?.conversionRate && stats.conversionRate > 20 ? 'success' : 'warning'}
              trend={stats?.conversionRate ? { 
                value: stats.conversionRate, 
                isPositive: stats.conversionRate > 20 
              } : undefined}
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Avg Deal Size"
              value={formatCurrency(stats?.averageDealSize || 0)}
              description="Average deal value"
              icon={BarChart3}
              color="info"
              loading={statsLoading}
            />
          </Col>
        </Row>

        {/* Stage Breakdown */}
        {stats && (
          <div style={{ marginBottom: 24 }}>
            <Title level={4} style={{ marginBottom: 16 }}>Pipeline by Stage</Title>
            <Row gutter={[16, 16]}>
              {Object.entries(stats.byStage).map(([stage, count]) => (
                <Col xs={24} sm={12} md={8} lg={4} key={stage}>
                  <StageCard
                    stage={stage}
                    count={count}
                    value={stats.byStageValue[stage] || 0}
                    loading={statsLoading}
                  />
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* Deals List */}
        <Card variant="borderless">
          <SalesList
            onCreateDeal={handleCreateDeal}
            onEditDeal={handleEditDeal}
            onViewDeal={handleViewDeal}
          />
        </Card>

        {/* Modals would go here */}
        {/* TODO: Add CreateDealModal, EditDealModal, ViewDealModal */}
      </div>
    </>
  );
};
