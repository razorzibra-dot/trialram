/**
 * Super Admin Role Requests Page
 * 
 * Displays pending role elevation requests for super admin review.
 * Allows super admins to approve, reject, or view details of requests.
 * 
 * Layer 8: UI (React Components)
 * Uses: useRoleRequests hook (React Query)
 * 
 * Features:
 * - Table of role requests with all details
 * - Filter by status (pending, approved, rejected, cancelled)
 * - Search by user email, name, or reason
 * - Sort by created date, requested role, status
 * - Pagination with configurable page size
 * - Detail drawer with full request information
 * - Approve/Reject buttons with review comments
 * - Statistics cards showing request counts
 * - Loading and error states
 * - Toast notifications
 */

import React, { useState, useMemo } from 'react';
import {
    Table,
    Button,
    Tag,
    Space,
    Modal,
    Form,
    Input,
    Select,
    Drawer,
    Card,
    Row,
    Col,
    Empty,
    Spin,
    message,
    Tooltip,
    Statistic,
} from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
    FilterOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { useCanAccessModule } from '@/hooks/useCanAccessModule';
import {
    useRoleRequests,
    usePendingRoleRequests,
    useRoleRequestStats,
    useReviewRoleRequest,
} from '../hooks/useRoleRequests';
import { roleRequestService } from '../services/roleRequestService';
import { RoleRequestType, RoleRequestReviewInput } from '@/types/superUserModule';

/**
 * Status badge component
 */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
        pending: { color: 'processing', label: 'Pending' },
        approved: { color: 'success', label: 'Approved' },
        rejected: { color: 'error', label: 'Rejected' },
        cancelled: { color: 'default', label: 'Cancelled' },
    };

    const config = statusConfig[status] || { color: 'default', label: status };
    return <Tag color={config.color}>{config.label}</Tag>;
};

/**
 * Role request table component
 */
const RoleRequestTable: React.FC<{
    requests: RoleRequestType[];
    loading: boolean;
    onViewDetails: (request: RoleRequestType) => void;
    onReview: (request: RoleRequestType) => void;
}> = ({ requests, loading, onViewDetails, onReview }) => {
    const [sortedInfo, setSortedInfo] = useState<any>({});
    const [filteredInfo, setFilteredInfo] = useState<any>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const columns = [
        {
            title: 'User',
            dataIndex: 'userId',
            key: 'userId',
            render: (userId: string) => (
                <Tooltip title={`User ID: ${userId}`}>
                    {userId.substring(0, 8)}...
                </Tooltip>
            ),
            sorter: (a: RoleRequestType, b: RoleRequestType) =>
                a.userId.localeCompare(b.userId),
            sortOrder: sortedInfo.columnKey === 'userId' ? sortedInfo.order : null,
        },
        {
            title: 'Requested Role',
            dataIndex: 'requestedRole',
            key: 'requestedRole',
            render: (role: string) => (
                <Tag color="blue">{role.replace('_', ' ').toUpperCase()}</Tag>
            ),
            filters: [
                { text: 'Admin', value: 'admin' },
                { text: 'Manager', value: 'manager' },
                { text: 'Super Admin', value: 'super_admin' },
            ],
            filteredValue: filteredInfo.requestedRole || null,
            onFilter: (value: any, record: RoleRequestType) =>
                record.requestedRole === value,
        },
        {
            title: 'Reason',
            dataIndex: 'reason',
            key: 'reason',
            render: (reason: string) => (
                <Tooltip title={reason}>
                    {reason.substring(0, 50)}
                    {reason.length > 50 ? '...' : ''}
                </Tooltip>
            ),
            width: 200,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => <StatusBadge status={status} />,
            filters: [
                { text: 'Pending', value: 'pending' },
                { text: 'Approved', value: 'approved' },
                { text: 'Rejected', value: 'rejected' },
                { text: 'Cancelled', value: 'cancelled' },
            ],
            filteredValue: filteredInfo.status || null,
            onFilter: (value: any, record: RoleRequestType) => record.status === value,
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
            sorter: (a: RoleRequestType, b: RoleRequestType) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            sortOrder: sortedInfo.columnKey === 'createdAt' ? sortedInfo.order : null,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (text: any, record: RoleRequestType) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => onViewDetails(record)}
                    >
                        View
                    </Button>
                    {record.status === 'pending' && (
                        <Button
                            type="default"
                            size="small"
                            onClick={() => onReview(record)}
                        >
                            Review
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={requests}
            loading={loading}
            rowKey="id"
            pagination={{
                current: currentPage,
                pageSize,
                total: requests.length,
                onChange: (page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                },
                pageSizeOptions: ['5', '10', '20', '50'],
            }}
            onChange={(_, filters, sorter: any) => {
                setFilteredInfo(filters);
                setSortedInfo(sorter);
            }}
        />
    );
};

/**
 * Detail drawer component
 */
const DetailDrawer: React.FC<{
    visible: boolean;
    request: RoleRequestType | null;
    onClose: () => void;
}> = ({ visible, request, onClose }) => {
    if (!request) return null;

    return (
        <Drawer
            title="Role Request Details"
            placement="right"
            onClose={onClose}
            open={visible}
            width={600}
        >
            <Form layout="vertical">
                <Form.Item label="Request ID">
                    <Input value={request.id} disabled />
                </Form.Item>
                <Form.Item label="User ID">
                    <Input value={request.userId} disabled />
                </Form.Item>
                <Form.Item label="Requested Role">
                    <Input
                        value={request.requestedRole.replace('_', ' ').toUpperCase()}
                        disabled
                    />
                </Form.Item>
                <Form.Item label="Status">
                    <StatusBadge status={request.status} />
                </Form.Item>
                <Form.Item label="Reason">
                    <Input.TextArea value={request.reason} disabled rows={4} />
                </Form.Item>
                {request.tenantId && (
                    <Form.Item label="Tenant">
                        <Input value={request.tenantId} disabled />
                    </Form.Item>
                )}
                <Form.Item label="Created">
                    <Input
                        value={new Date(request.createdAt).toLocaleString()}
                        disabled
                    />
                </Form.Item>
                {request.reviewedAt && (
                    <>
                        <Form.Item label="Reviewed">
                            <Input
                                value={new Date(request.reviewedAt).toLocaleString()}
                                disabled
                            />
                        </Form.Item>
                        {request.reviewedBy && (
                            <Form.Item label="Reviewed By">
                                <Input value={request.reviewedBy} disabled />
                            </Form.Item>
                        )}
                        {request.reviewComments && (
                            <Form.Item label="Review Comments">
                                <Input.TextArea
                                    value={request.reviewComments}
                                    disabled
                                    rows={3}
                                />
                            </Form.Item>
                        )}
                    </>
                )}
            </Form>
        </Drawer>
    );
};

/**
 * Review modal component
 */
const ReviewModal: React.FC<{
    visible: boolean;
    request: RoleRequestType | null;
    loading: boolean;
    onApprove: (comments: string, expiresAt?: string) => void;
    onReject: (comments: string) => void;
    onCancel: () => void;
}> = ({ visible, request, loading, onApprove, onReject, onCancel }) => {
    const [form] = Form.useForm();
    const [reviewType, setReviewType] = useState<'approve' | 'reject'>('approve');

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (reviewType === 'approve') {
                onApprove(values.comments || '', values.expiresAt);
            } else {
                onReject(values.comments || '');
            }
            form.resetFields();
        } catch (error) {
            console.error('Form validation error:', error);
        }
    };

    return (
        <Modal
            title={`Review: ${request?.requestedRole.toUpperCase()}`}
            open={visible}
            onCancel={onCancel}
            confirmLoading={loading}
            okText="Submit"
            onOk={handleSubmit}
            width={600}
        >
            <Form form={form} layout="vertical">
                <Form.Item label="Decision">
                    <Select
                        value={reviewType}
                        onChange={setReviewType}
                        options={[
                            { label: 'Approve', value: 'approve' },
                            { label: 'Reject', value: 'reject' },
                        ]}
                    />
                </Form.Item>
                {reviewType === 'approve' && (
                    <Form.Item label="Expiration Date (Optional)">
                        <Input
                            type="datetime-local"
                            placeholder="Leave empty for permanent role"
                        />
                    </Form.Item>
                )}
                <Form.Item label="Comments (Optional)">
                    <Input.TextArea
                        name="comments"
                        placeholder="Add any comments about this decision"
                        rows={4}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

/**
 * Super Admin Role Requests Page Component
 */
const SuperAdminRoleRequestsPage: React.FC = () => {
    const { user } = useAuth();
    const canAccess = useCanAccessModule('super-admin');
    const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<RoleRequestType | null>(null);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    // Queries
    const { data: roleRequests = [], isLoading, refetch } = useRoleRequests(
        statusFilter || undefined
    );
    const { data: stats = { pending: 0, approved: 0, rejected: 0, cancelled: 0, total: 0 } } =
        useRoleRequestStats();

    // Mutations
    const reviewMutation = useReviewRoleRequest(selectedRequest?.id || '');

    // Filter and search
    const filteredRequests = useMemo(() => {
        if (!searchText) return roleRequests;
        const text = searchText.toLowerCase();
        return roleRequests.filter(
            (req: RoleRequestType) =>
                req.userId.toLowerCase().includes(text) ||
                req.reason.toLowerCase().includes(text) ||
                req.requestedRole.toLowerCase().includes(text)
        );
    }, [roleRequests, searchText]);

    // Handlers
    const handleViewDetails = (request: RoleRequestType) => {
        setSelectedRequest(request);
        setDetailDrawerVisible(true);
    };

    const handleReview = (request: RoleRequestType) => {
        setSelectedRequest(request);
        setReviewModalVisible(true);
    };

    const handleApprove = async (comments: string, expiresAt?: string) => {
        if (!selectedRequest || !user) return;

        try {
            await reviewMutation.mutateAsync({
                reviewData: {
                    status: 'approved',
                    reviewComments: comments,
                    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
                },
                reviewerId: user.id,
            });
            message.success('Role request approved');
            setReviewModalVisible(false);
            setSelectedRequest(null);
            refetch();
        } catch (error: any) {
            message.error(error.message || 'Failed to approve request');
        }
    };

    const handleReject = async (comments: string) => {
        if (!selectedRequest || !user) return;

        try {
            await reviewMutation.mutateAsync({
                reviewData: {
                    status: 'rejected',
                    reviewComments: comments,
                },
                reviewerId: user.id,
            });
            message.success('Role request rejected');
            setReviewModalVisible(false);
            setSelectedRequest(null);
            refetch();
        } catch (error: any) {
            message.error(error.message || 'Failed to reject request');
        }
    };

    if (!canAccess) {
        return (
            <Empty description="Access Denied" style={{ marginTop: 50 }}>
                <Button type="primary" onClick={() => window.history.back()}>
                    Go Back
                </Button>
            </Empty>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Role Requests</h1>
                <p className="text-gray-600">Review and manage user role elevation requests</p>
            </div>

            {/* Statistics Cards */}
            <Row gutter={16} className="mb-6">
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Pending"
                            value={stats.pending}
                            prefix={<FilterOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Approved"
                            value={stats.approved}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Rejected"
                            value={stats.rejected}
                            prefix={<CloseCircleOutlined />}
                            valueStyle={{ color: '#f5222d' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Total"
                            value={stats.total}
                            prefix={<SyncOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filters and Actions */}
            <Card className="mb-6">
                <Space>
                    <Input.Search
                        placeholder="Search by user, role, or reason..."
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                    />
                    <Select
                        placeholder="Filter by status"
                        style={{ width: 150 }}
                        onChange={setStatusFilter}
                        allowClear
                        options={[
                            { label: 'Pending', value: 'pending' },
                            { label: 'Approved', value: 'approved' },
                            { label: 'Rejected', value: 'rejected' },
                            { label: 'Cancelled', value: 'cancelled' },
                        ]}
                    />
                    <Button
                        icon={<SyncOutlined />}
                        onClick={() => refetch()}
                        loading={isLoading}
                    >
                        Refresh
                    </Button>
                </Space>
            </Card>

            {/* Table */}
            <Card>
                {isLoading ? (
                    <Spin />
                ) : filteredRequests.length === 0 ? (
                    <Empty description="No role requests found" />
                ) : (
                    <RoleRequestTable
                        requests={filteredRequests}
                        loading={isLoading}
                        onViewDetails={handleViewDetails}
                        onReview={handleReview}
                    />
                )}
            </Card>

            {/* Modals and Drawers */}
            <DetailDrawer
                visible={detailDrawerVisible}
                request={selectedRequest}
                onClose={() => {
                    setDetailDrawerVisible(false);
                    setSelectedRequest(null);
                }}
            />

            <ReviewModal
                visible={reviewModalVisible}
                request={selectedRequest}
                loading={reviewMutation.isPending}
                onApprove={handleApprove}
                onReject={handleReject}
                onCancel={() => {
                    setReviewModalVisible(false);
                    setSelectedRequest(null);
                }}
            />
        </div>
    );
};

export default SuperAdminRoleRequestsPage;