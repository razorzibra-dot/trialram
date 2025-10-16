/**
 * Contracts Page - Enterprise Design
 * Main page for contract management and lifecycle tracking
 * Redesigned with Ant Design and EnterpriseLayout
 */

import React, { useState } from 'react';
import { Row, Col, Button, Card, Alert, Tabs } from 'antd';
import { PlusOutlined, WarningOutlined, CalendarOutlined } from '@ant-design/icons';
import { 
  FileText, 
  Clock, 
  AlertTriangle,
  DollarSign,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PageHeader, StatCard } from '@/components/common';
import { ContractsList } from '../components/ContractsList';
import { useContractStats, useExpiringContracts, useContractsDueForRenewal } from '../hooks/useContracts';
import { useServiceContracts, useServiceContractStats } from '../hooks/useServiceContracts';
import { useAuth } from '@/contexts/AuthContext';
import { Contract, ContractFilters } from '@/types/contracts';
import { ServiceContractFilters } from '@/types/productSales';

export const ContractsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [contractFilters, setContractFilters] = useState<ContractFilters>({
    page: 1,
    pageSize: 20,
  });
  const [serviceContractFilters, setServiceContractFilters] = useState<ServiceContractFilters>({
    page: 1,
    pageSize: 20,
  });
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Queries
  const { data: contractStats, isLoading: contractStatsLoading } = useContractStats();
  const { data: serviceContractStats, isLoading: serviceStatsLoading } = useServiceContractStats();
  const { data: expiringContracts } = useExpiringContracts(30);
  const { data: renewalsDue } = useContractsDueForRenewal(30);
  const { data: serviceContractsData } = useServiceContracts(serviceContractFilters);

  const handleEdit = (contract: Contract) => {
    setSelectedContract(contract);
    // TODO: Open edit modal
  };

  const handleView = (contract: Contract) => {
    setSelectedContract(contract);
    // TODO: Open view modal
  };

  const handleCreate = () => {
    setSelectedContract(null);
    // TODO: Open create modal
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <EnterpriseLayout>
      <PageHeader
        title="Contracts"
        description="Manage contracts, track renewals, and monitor compliance"
        breadcrumb={{
          items: [
            { title: 'Home', path: '/tenant/dashboard' },
            { title: 'Contracts' }
          ]
        }}
        extra={
          hasPermission('contracts:create') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              New Contract
            </Button>
          )
        }
      />

      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Contracts"
              value={contractStats?.total || 0}
              description="Active agreements"
              icon={FileText}
              color="primary"
              loading={contractStatsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Contracts"
              value={contractStats?.activeContracts || 0}
              description="Currently in effect"
              icon={CheckCircle}
              color="success"
              loading={contractStatsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Pending Approval"
              value={contractStats?.pendingApproval || 0}
              description="Awaiting approval"
              icon={Clock}
              color="warning"
              loading={contractStatsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Value"
              value={formatCurrency(contractStats?.totalValue || 0)}
              description="Contract portfolio value"
              icon={DollarSign}
              color="info"
              loading={contractStatsLoading}
            />
          </Col>
        </Row>

        {/* Alerts Section */}
        {((expiringContracts?.length || 0) > 0 || (renewalsDue?.length || 0) > 0) && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {(expiringContracts?.length || 0) > 0 && (
              <Col xs={24} lg={12}>
                <Alert
                  message={
                    <span style={{ fontWeight: 600, fontSize: 15 }}>
                      <WarningOutlined style={{ marginRight: 8 }} />
                      Expiring Soon
                    </span>
                  }
                  description={
                    <div>
                      <p style={{ marginBottom: 8 }}>Contracts expiring within 30 days</p>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>
                        {expiringContracts?.length || 0}
                      </div>
                      <p style={{ fontSize: 12, marginTop: 4 }}>Require immediate attention</p>
                    </div>
                  }
                  type="error"
                  showIcon
                  style={{ borderRadius: 8 }}
                />
              </Col>
            )}

            {(renewalsDue?.length || 0) > 0 && (
              <Col xs={24} lg={12}>
                <Alert
                  message={
                    <span style={{ fontWeight: 600, fontSize: 15 }}>
                      <CalendarOutlined style={{ marginRight: 8 }} />
                      Renewals Due
                    </span>
                  }
                  description={
                    <div>
                      <p style={{ marginBottom: 8 }}>Contracts due for renewal within 30 days</p>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>
                        {renewalsDue?.length || 0}
                      </div>
                      <p style={{ fontSize: 12, marginTop: 4 }}>Need renewal processing</p>
                    </div>
                  }
                  type="warning"
                  showIcon
                  style={{ borderRadius: 8 }}
                />
              </Col>
            )}
          </Row>
        )}

        {/* Contract Types Breakdown */}
        {contractStats?.byType && Object.keys(contractStats.byType).length > 0 && (
          <Card
            title="Contract Types"
            bordered={false}
            style={{
              marginBottom: 24,
              borderRadius: 8,
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Row gutter={[16, 16]}>
              {Object.entries(contractStats.byType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const displayType = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                  return (
                    <Col xs={24} sm={12} lg={8} key={type}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 16,
                          background: '#F9FAFB',
                          borderRadius: 8,
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{displayType}</span>
                        <span style={{ fontSize: 13, color: '#6B7280' }}>{count} contracts</span>
                      </div>
                    </Col>
                  );
                })}
            </Row>
          </Card>
        )}

        {/* Contracts Tabs */}
        <Card
          title="Contract Management"
          bordered={false}
          style={{
            borderRadius: 8,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Tabs
            defaultActiveKey="contracts"
            items={[
              {
                key: 'contracts',
                label: 'General Contracts',
                children: (
                  <ContractsList
                    filters={contractFilters}
                    onFiltersChange={setContractFilters}
                    onEdit={handleEdit}
                    onView={handleView}
                  />
                ),
              },
              {
                key: 'service-contracts',
                label: 'Service Contracts',
                children: (
                  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <FileText size={48} style={{ color: '#9CA3AF', margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: 18, fontWeight: 500, color: '#111827', marginBottom: 8 }}>
                      Service Contracts
                    </h3>
                    <p style={{ color: '#6B7280', marginBottom: 16 }}>
                      Service contracts component will be implemented here.
                    </p>
                    <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                      Total Service Contracts: {serviceStatsLoading ? '...' : formatNumber(serviceContractStats?.total || 0)}
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </EnterpriseLayout>
  );
};
