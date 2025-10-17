/**
 * JobWorks Page - Enterprise Design
 * Main job works dashboard with statistics and management
 * Redesigned with Ant Design and EnterpriseLayout
 */

import React, { useState } from 'react';
import { Row, Col, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { 
  Briefcase,
  Clock,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { PageHeader, StatCard } from '@/components/common';
import { JobWorksList } from '../components/JobWorksList';
import { useJobWorkStats, useJobWorks } from '../hooks/useJobWorks';
import { JobWork } from '../services/jobWorksService';

export const JobWorksPage: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useJobWorkStats();
  const { isLoading: jobWorksLoading } = useJobWorks();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedJobWork, setSelectedJobWork] = useState<JobWork | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCreateJobWork = () => {
    setShowCreateModal(true);
  };

  const handleEditJobWork = (jobWork: JobWork) => {
    setSelectedJobWork(jobWork);
    setShowEditModal(true);
  };

  const handleViewJobWork = (jobWork: JobWork) => {
    setSelectedJobWork(jobWork);
    setShowViewModal(true);
  };

  return (
    <>
      <PageHeader
        title="Job Works"
        description="Manage and track job work assignments and progress"
        breadcrumb={{
          items: [
            { title: 'Home', path: '/tenant/dashboard' },
            { title: 'Job Works' }
          ]
        }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateJobWork}>
            New Job Work
          </Button>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Job Works"
              value={stats?.total || 0}
              description="All job work assignments"
              icon={Briefcase}
              color="primary"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="In Progress"
              value={stats?.byStatus?.in_progress || 0}
              description="Currently active jobs"
              icon={Clock}
              color="warning"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Completed This Month"
              value={stats?.completedThisMonth || 0}
              description="Jobs completed this month"
              icon={CheckCircle}
              color="success"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Value"
              value={formatCurrency(stats?.totalCost || 0)}
              description="Combined job work value"
              icon={DollarSign}
              color="info"
              loading={statsLoading}
            />
          </Col>
        </Row>

        {/* Status Breakdown */}
        {stats && stats.byStatus && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#111827' }}>
                Job Works by Status
              </h2>
            </Col>
            {Object.entries(stats.byStatus).map(([status, count]) => {
              const statusConfig: Record<string, { icon: any; color: 'primary' | 'warning' | 'success' | 'info' }> = {
                pending: { icon: Clock, color: 'warning' },
                in_progress: { icon: Briefcase, color: 'primary' },
                completed: { icon: CheckCircle, color: 'success' },
                cancelled: { icon: Clock, color: 'info' }
              };
              const config = statusConfig[status] || { icon: Briefcase, color: 'primary' };
              
              return (
                <Col xs={24} sm={12} lg={6} key={status}>
                  <StatCard
                    title={status.replace('_', ' ').toUpperCase()}
                    value={count}
                    description={`${status.replace('_', ' ')} job works`}
                    icon={config.icon}
                    color={config.color}
                    loading={statsLoading}
                  />
                </Col>
              );
            })}
          </Row>
        )}

        {/* Job Works List */}
        <JobWorksList
          onCreateJobWork={handleCreateJobWork}
          onEditJobWork={handleEditJobWork}
          onViewJobWork={handleViewJobWork}
        />
      </div>

      {/* Modals would go here */}
      {/* TODO: Add CreateJobWorkModal, EditJobWorkModal, ViewJobWorkModal */}
    </>
  );
};
