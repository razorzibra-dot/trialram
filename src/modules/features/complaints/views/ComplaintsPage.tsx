/**
 * Complaints Page - Enterprise Design
 * Main page for managing customer complaints with statistics and data table
 */

import React, { useState } from 'react';
import { Row, Col, Card, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { PageHeader, StatCard } from '@/components/common';
import { ComplaintsList } from '../components/ComplaintsList';
import { ComplaintsDetailPanel } from '../components/ComplaintsDetailPanel';
import { ComplaintsFormPanel } from '../components/ComplaintsFormPanel';
import { useComplaintStats } from '../hooks/useComplaints';
import { Complaint } from '@/types/complaints';
import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';

export const ComplaintsPage: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useComplaintStats();

  // Drawer states
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view' | null>(null);

  const handleCreate = () => {
    setSelectedComplaint(null);
    setDrawerMode('create');
  };

  const handleEdit = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setDrawerMode('edit');
  };

  const handleView = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setDrawerMode('view');
  };

  const handleDrawerClose = () => {
    setDrawerMode(null);
    setSelectedComplaint(null);
  };

  const handleEditFromDetail = () => {
    setDrawerMode('edit');
  };

  return (
    <>
      <PageHeader
        title="Complaints Management"
        description="Track and manage customer complaints and service requests"
        breadcrumb={{
          items: [
            { title: 'Dashboard', path: '/tenant/dashboard' },
            { title: 'Complaints' }
          ]
        }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            New Complaint
          </Button>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Complaints"
              value={stats?.total || 0}
              description="All complaints"
              icon={AlertCircle}
              color="primary"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="New Complaints"
              value={stats?.new || 0}
              description="Awaiting review"
              icon={Clock}
              color="warning"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="In Progress"
              value={stats?.in_progress || 0}
              description="Being addressed"
              icon={Clock}
              color="info"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Resolved"
              value={stats?.closed || 0}
              description="Completed"
              icon={CheckCircle}
              color="success"
              loading={statsLoading}
            />
          </Col>
        </Row>

        {/* Complaints List */}
        <ComplaintsList
          onCreateComplaint={handleCreate}
          onEditComplaint={handleEdit}
          onViewComplaint={handleView}
        />
      </div>

      {/* Detail Panel (View) */}
      <ComplaintsDetailPanel
        visible={drawerMode === 'view'}
        complaint={selectedComplaint}
        onClose={handleDrawerClose}
        onEdit={handleEditFromDetail}
      />

      {/* Form Panel (Create/Edit) */}
      <ComplaintsFormPanel
        visible={drawerMode === 'create' || drawerMode === 'edit'}
        complaint={drawerMode === 'edit' ? selectedComplaint : null}
        onClose={handleDrawerClose}
        onSuccess={() => {
          setDrawerMode(null);
          // Refetch data - TODO: implement refetch
        }}
      />
    </>
  );
};