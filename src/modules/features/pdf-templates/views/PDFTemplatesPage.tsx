/**
 * PDF Templates Page - Enterprise Design
 * Manage PDF templates for invoices, contracts, reports, etc.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Input, 
  Select, 
  Modal, 
  Tag, 
  Space, 
  Dropdown, 
  Tabs,
  message,
  Upload,
  Badge
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps, FormInstance } from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
  DownloadOutlined,
  UploadOutlined,
  StarOutlined,
  StarFilled,
  FileTextOutlined
} from '@ant-design/icons';
import { 
  FileText,
  FileCheck,
  FileSpreadsheet,
  Mail
} from 'lucide-react';
import { PageHeader, StatCard } from '@/components/common';
import { pdfTemplateService, PDFTemplate } from '@/services/pdfTemplateService';
import { useAuth } from '@/contexts/AuthContext';
import { PDFTemplateDetailPanel } from '../components/PDFTemplateDetailPanel';
import { PDFTemplateFormPanel } from '../components/PDFTemplateFormPanel';

const { TextArea } = Input;

// Form values interface for PDF templates
interface TemplateFormValues {
  name: string;
  category: string;
  description: string;
  content: string;
  variables: string;
  is_active?: boolean;
}

export const PDFTemplatesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  const fetchTemplates = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const filters: Record<string, string> = {};
      
      if (searchTerm) filters.search = searchTerm;
      if (categoryFilter !== 'all') filters.category = categoryFilter;

      const data = await pdfTemplateService.getTemplates(filters);
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      message.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categoryFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const closeDrawer = () => {
    setDrawerMode(null);
    setSelectedTemplate(null);
  };

  const handleOpenCreate = () => {
    setSelectedTemplate(null);
    setDrawerMode('create');
  };

  const handleOpenEdit = (template: PDFTemplate) => {
    setSelectedTemplate(template);
    setDrawerMode('edit');
  };

  const handleOpenView = (template: PDFTemplate) => {
    setSelectedTemplate(template);
    setDrawerMode('view');
  };

  const handleFormSave = async (values: TemplateFormValues): Promise<void> => {
    try {
      setIsSaving(true);
      
      if (drawerMode === 'create') {
        await pdfTemplateService.createTemplate({
          name: values.name,
          category: values.category,
          description: values.description,
          content: values.content,
          variables: values.variables?.split(',').map((v: string) => v.trim()) || [],
          is_default: false,
          is_active: true,
          created_by: 'current_user'
        });
        message.success('Template created successfully');
      } else if (drawerMode === 'edit' && selectedTemplate) {
        await pdfTemplateService.updateTemplate(selectedTemplate.id, {
          name: values.name,
          category: values.category,
          description: values.description,
          content: values.content,
          variables: values.variables?.split(',').map((v: string) => v.trim()) || [],
          is_active: values.is_active
        });
        message.success('Template updated successfully');
      }
      
      closeDrawer();
      fetchTemplates();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save template';
      message.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (template: PDFTemplate): Promise<void> => {
    Modal.confirm({
      title: 'Delete Template',
      content: `Are you sure you want to delete "${template.name}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await pdfTemplateService.deleteTemplate(template.id);
          message.success('Template deleted successfully');
          fetchTemplates();
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete template';
          message.error(errorMessage);
        }
      }
    });
  };

  const handleDuplicate = async (template: PDFTemplate): Promise<void> => {
    try {
      await pdfTemplateService.duplicateTemplate(template.id);
      message.success('Template duplicated successfully');
      fetchTemplates();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate template';
      message.error(errorMessage);
    }
  };

  const handleSetDefault = async (template: PDFTemplate): Promise<void> => {
    try {
      await pdfTemplateService.setDefaultTemplate(template.id, template.category);
      message.success('Default template updated');
      fetchTemplates();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set default template';
      message.error(errorMessage);
    }
  };

  const handlePreview = async (template: PDFTemplate): Promise<void> => {
    try {
      // Create sample data for preview
      const sampleData: Record<string, string> = {};
      template.variables.forEach((variable: string) => {
        sampleData[variable] = `[${variable}]`;
      });

      const html = await pdfTemplateService.previewTemplate(template.id, sampleData);
      setPreviewHtml(html);
      setSelectedTemplate(template);
      setShowPreviewModal(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to preview template';
      message.error(errorMessage);
    }
  };

  const handleExport = async (template: PDFTemplate): Promise<void> => {
    try {
      const blob = await pdfTemplateService.exportTemplate(template.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('Template exported successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export template';
      message.error(errorMessage);
    }
  };

  const handleImport = async (file: File): Promise<boolean> => {
    try {
      await pdfTemplateService.importTemplate(file);
      message.success('Template imported successfully');
      fetchTemplates();
      return false; // Prevent default upload behavior
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import template';
      message.error(errorMessage);
      return false;
    }
  };



  const getActionMenu = (template: PDFTemplate): MenuProps => ({
    items: [
      {
        key: 'view',
        label: 'View Details',
        icon: <EyeOutlined />,
        onClick: () => handleOpenView(template)
      },
      {
        key: 'preview',
        label: 'Preview',
        icon: <FileTextOutlined />,
        onClick: () => handlePreview(template)
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <EditOutlined />,
        onClick: () => handleOpenEdit(template),
        disabled: !hasPermission('manage_templates')
      },
      {
        key: 'duplicate',
        label: 'Duplicate',
        icon: <CopyOutlined />,
        onClick: () => handleDuplicate(template)
      },
      {
        key: 'default',
        label: template.is_default ? 'Default Template' : 'Set as Default',
        icon: template.is_default ? <StarFilled /> : <StarOutlined />,
        onClick: () => handleSetDefault(template),
        disabled: template.is_default || !hasPermission('manage_templates')
      },
      {
        key: 'export',
        label: 'Export',
        icon: <DownloadOutlined />,
        onClick: () => handleExport(template)
      },
      {
        type: 'divider'
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDelete(template),
        disabled: template.is_default || !hasPermission('manage_templates')
      }
    ]
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'invoice':
        return <FileText size={16} />;
      case 'contract':
        return <FileCheck size={16} />;
      case 'report':
        return <FileSpreadsheet size={16} />;
      case 'letter':
        return <Mail size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'invoice':
        return 'blue';
      case 'contract':
        return 'green';
      case 'report':
        return 'orange';
      case 'letter':
        return 'purple';
      default:
        return 'default';
    }
  };

  const columns: ColumnsType<PDFTemplate> = [
    {
      title: 'Template Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {getCategoryIcon(record.category)}
          <span style={{ fontWeight: 500 }}>{text}</span>
          {record.is_default && (
            <StarFilled style={{ color: '#faad14', fontSize: 14 }} />
          )}
        </Space>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color={getCategoryColor(category)}>
          {category.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Variables',
      dataIndex: 'variables',
      key: 'variables',
      render: (variables: string[]) => (
        <Badge count={variables.length} showZero color="#1890ff" />
      )
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (is_active) => (
        <Tag color={is_active ? 'success' : 'default'}>
          {is_active ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Dropdown menu={getActionMenu(record)} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      )
    }
  ];

  const stats = {
    total: templates.length,
    invoice: templates.filter(t => t.category === 'invoice').length,
    contract: templates.filter(t => t.category === 'contract').length,
    report: templates.filter(t => t.category === 'report').length
  };

  return (
    <>
      <PageHeader
        title="PDF Templates"
        description="Manage PDF templates for invoices, contracts, and reports"
        breadcrumb={{
          items: [
            { title: 'Home', path: '/dashboard' },
            { title: 'Configuration', path: '/tenant-configuration' },
            { title: 'PDF Templates' }
          ]
        }}
        extra={
          <Space>
            <Upload
              accept=".json"
              showUploadList={false}
              beforeUpload={handleImport}
            >
              <Button icon={<UploadOutlined />}>
                Import Template
              </Button>
            </Upload>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleOpenCreate}
              disabled={!hasPermission('manage_templates')}
            >
              New Template
            </Button>
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Templates"
              value={stats.total}
              description="All PDF templates"
              icon={FileText}
              color="primary"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Invoice Templates"
              value={stats.invoice}
              description="Invoice templates"
              icon={FileText}
              color="info"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Contract Templates"
              value={stats.contract}
              description="Contract templates"
              icon={FileCheck}
              color="success"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Report Templates"
              value={stats.report}
              description="Report templates"
              icon={FileSpreadsheet}
              color="warning"
              loading={loading}
            />
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Input
                placeholder="Search templates..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} md={12}>
              <Select
                placeholder="Filter by category"
                value={categoryFilter}
                onChange={setCategoryFilter}
                style={{ width: '100%' }}
              >
                <Select.Option value="all">All Categories</Select.Option>
                <Select.Option value="invoice">Invoice</Select.Option>
                <Select.Option value="contract">Contract</Select.Option>
                <Select.Option value="report">Report</Select.Option>
                <Select.Option value="letter">Letter</Select.Option>
                <Select.Option value="other">Other</Select.Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Templates Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={templates}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} templates`
            }}
          />
        </Card>
      </div>

      {/* PDF Template Detail Drawer */}
      {drawerMode === 'view' && selectedTemplate && (
        <PDFTemplateDetailPanel
          template={selectedTemplate}
          open={true}
          onClose={closeDrawer}
          onEdit={handleOpenEdit}
        />
      )}

      {/* PDF Template Form Drawer - Create/Edit */}
      {(drawerMode === 'create' || drawerMode === 'edit') && (
        <PDFTemplateFormPanel
          open={true}
          mode={drawerMode}
          template={selectedTemplate}
          onClose={closeDrawer}
          onSave={handleFormSave}
          loading={isSaving}
        />
      )}

      {/* Preview Modal - Keep for preview functionality */}
      <Modal
        title={`Preview: ${selectedTemplate?.name}`}
        open={previewHtml !== ''}
        onCancel={() => {
          setPreviewHtml('');
          setSelectedTemplate(null);
        }}
        footer={[
          <Button key="close" onClick={() => setPreviewHtml('')}>
            Close
          </Button>
        ]}
        width={900}
      >
        <div 
          style={{ 
            border: '1px solid #d9d9d9', 
            padding: 16, 
            borderRadius: 4,
            maxHeight: 600,
            overflow: 'auto'
          }}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </Modal>
    </>
  );
};

export default PDFTemplatesPage;