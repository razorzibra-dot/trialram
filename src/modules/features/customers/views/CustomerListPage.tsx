/**
 * Customer List Page
 * Main page for displaying and managing customers
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Users, TrendingUp, DollarSign } from 'lucide-react';
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PageHeader, StatCard } from '@/components/common';
import { CustomerList } from '../components/CustomerList';
import { Customer } from '@/types/crm';
import { useCustomerStats } from '../hooks/useCustomers';

const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useCustomerStats();

  // Handle customer actions
  const handleCreateCustomer = () => {
    navigate('/tenant/customers/new');
  };

  const handleEditCustomer = (customer: Customer) => {
    navigate(`/tenant/customers/${customer.id}/edit`);
  };

  const handleViewCustomer = (customer: Customer) => {
    navigate(`/tenant/customers/${customer.id}`);
  };

  return (
    <EnterpriseLayout>
      <PageHeader
        title="Customers"
        description="Manage your customer relationships"
        breadcrumb={{
          items: [
            { title: 'Dashboard', path: '/tenant/dashboard' },
            { title: 'Customers' }
          ]
        }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateCustomer}>
            Add Customer
          </Button>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Stats Cards */}
        {stats && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Total Customers"
                value={stats.total}
                description={`+${stats.recentlyAdded} from last month`}
                icon={Users}
                color="primary"
                loading={statsLoading}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Active Customers"
                value={stats.active}
                description={`${((stats.active / stats.total) * 100).toFixed(1)}% of total`}
                icon={TrendingUp}
                color="success"
                loading={statsLoading}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Prospects"
                value={stats.prospects}
                description="Potential customers"
                icon={Users}
                color="info"
                loading={statsLoading}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Top Industry"
                value={Object.entries(stats.byIndustry).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                description="Most common industry"
                icon={DollarSign}
                color="warning"
                loading={statsLoading}
              />
            </Col>
          </Row>
        )}

        {/* Customer List */}
        <Card bordered={false}>
          <CustomerList
            onCreateCustomer={handleCreateCustomer}
            onEditCustomer={handleEditCustomer}
            onViewCustomer={handleViewCustomer}
          />
        </Card>
      </div>
    </EnterpriseLayout>
  );
};

export default CustomerListPage;
