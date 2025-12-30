/**
 * Tickets Detail Panel
 * Read-only side drawer for viewing ticket details
 */

import React, { useState, useRef, useMemo } from 'react';
import { Drawer, Button, Row, Col, Tag, Empty, Spin, Input, Avatar, List, Card, Statistic } from 'antd';
import { EditOutlined, SendOutlined, PaperClipOutlined, ClockCircleOutlined, UploadOutlined, DownloadOutlined, DeleteOutlined, InfoCircleOutlined, UserOutlined, MessageOutlined, FileTextOutlined } from '@ant-design/icons';
import { Ticket, TicketComment, TicketAttachment } from '@/types/crm';
import { useAuth } from '@/contexts/AuthContext';
import { useTicketCommentsCrud, useCreateTicketCommentCrud, useAddCommentReply } from '../hooks/useTicketComments';
import { useTicketAttachmentsCrud, useCreateTicketAttachmentCrud, useDeleteTicketAttachmentCrud, useDownloadTicketAttachment } from '../hooks/useTicketAttachments';
import { useReferenceDataLookup } from '@/hooks/useReferenceDataLookup';
import dayjs from 'dayjs';

interface TicketsDetailPanelProps {
  ticket: Ticket | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onEdit: () => void;
}

/**
 * Descriptions component for formatted display
 */
const Descriptions: React.FC<{
  items: Array<{ label: string; value: React.ReactNode }>;
}> = ({ items }) => (
  <div style={{ fontSize: 14 }}>
    {items.map((item, index) => (
      <Row key={index} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: index < items.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
        <Col span={8} style={{ color: '#666', fontWeight: 500 }}>
          {item.label}
        </Col>
        <Col span={16} style={{ color: '#000' }}>
          {item.value || '-'}
        </Col>
      </Row>
    ))}
  </div>
);

/**
 * Simple Comment component replacement
 */
const Comment: React.FC<{
  author?: React.ReactNode;
  avatar?: React.ReactNode;
  content?: React.ReactNode;
  datetime?: React.ReactNode;
}> = ({ author, avatar, content, datetime }) => (
  <div style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      {avatar && <div>{avatar}</div>}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          {author && <div style={{ fontWeight: 500 }}>{author}</div>}
          {datetime && <div style={{ fontSize: 12, color: '#666' }}>{datetime}</div>}
        </div>
        {content && <div>{content}</div>}
      </div>
    </div>
  </div>
);

export const TicketsDetailPanel: React.FC<TicketsDetailPanelProps> = ({
  ticket,
  isOpen,
  isLoading = false,
  onClose,
  onEdit,
}) => {
  const { hasPermission } = useAuth();
  const [newComment, setNewComment] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ticketId = ticket?.id;
  const commentFilters = useMemo(
    () => ({ customFilters: { ticketId } }),
    [ticketId]
  );
  const attachmentFilters = useMemo(
    () => ({ customFilters: { ticketId } }),
    [ticketId]
  );

  // Database-driven color lookups
  const { getColor: getStatusColor, getLabel: getStatusLabel } = useReferenceDataLookup('ticket_status');
  const { getColor: getPriorityColor, getLabel: getPriorityLabel } = useReferenceDataLookup('ticket_priority');

  // Section styles configuration
  const sectionStyles = {
    card: {
      marginBottom: 20,
      borderRadius: 8,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 12,
      borderBottom: '2px solid #e5e7eb',
    },
    headerIcon: {
      fontSize: 18,
      color: '#0ea5e9',
      marginRight: 10,
    },
    headerTitle: {
      fontSize: 15,
      fontWeight: 600,
      color: '#1f2937',
      margin: 0,
    },
  };

  // Comments hooks
  const { data: commentsResponse, isLoading: commentsLoading } = useTicketCommentsCrud(commentFilters);
  const comments = commentsResponse?.data || [];
  const createComment = useCreateTicketCommentCrud();
  const addReply = useAddCommentReply();

  // Attachments hooks
  const { data: attachmentsResponse, isLoading: attachmentsLoading } = useTicketAttachmentsCrud(attachmentFilters);
  const attachments = attachmentsResponse?.data || [];
  const createAttachment = useCreateTicketAttachmentCrud();
  const deleteAttachment = useDeleteTicketAttachmentCrud();
  const downloadAttachment = useDownloadTicketAttachment();

  // Comment handlers
  const handleAddComment = async () => {
    if (!newComment.trim() || !ticket) return;

    try {
      await createComment.mutateAsync({
        ticket_id: ticket.id,
        content: newComment.trim(),
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleAddReply = async (parentCommentId: string, content: string) => {
    try {
      await addReply.mutateAsync({
        parentCommentId,
        content: content.trim(),
      });
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  // Attachment handlers
  const handleFileUpload = async (file: File) => {
    if (!ticket) return;

    try {
      await createAttachment.mutateAsync({ ticket_id: ticket.id, file });
    } catch (error) {
      console.error('Error uploading attachment:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadAttachment = async (attachment: TicketAttachment) => {
    try {
      await downloadAttachment.mutateAsync(attachment.id);
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  const handleDeleteAttachment = async (attachment: TicketAttachment) => {
    if (confirm(`Are you sure you want to delete "${attachment.filename}"?`)) {
      try {
        await deleteAttachment.mutateAsync(attachment.id);
      } catch (error) {
        console.error('Error deleting attachment:', error);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!ticket) {
    return (
      <Drawer
        title="Ticket Details"
        placement="right"
        onClose={onClose}
        open={isOpen}
        width={500}
        styles={{ body: { padding: 0 } }}
      >
        <Empty description="No ticket selected" />
      </Drawer>
    );
  }

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileTextOutlined style={{ fontSize: 20, color: '#0ea5e9' }} />
          <span>Ticket Details</span>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={isOpen}
      width={650}
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button size="large" onClick={onClose}>
            Close
          </Button>
          {hasPermission('crm:support:ticket:update') && (
            <Button
              type="primary"
              size="large"
              icon={<EditOutlined />}
              onClick={onEdit}
            >
              Edit Ticket
            </Button>
          )}
        </div>
      }
    >
      <div style={{ padding: '0 24px 24px 24px' }}>
        <Spin spinning={isLoading}>
          {/* Title & Status Card */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <InfoCircleOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Ticket Overview</h3>
            </div>
            <h2 style={{ margin: '0 0 12px 0', color: '#111827', fontSize: 20, fontWeight: 600 }}>
              {ticket.title}
            </h2>
            {ticket.description && (
              <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: 14, lineHeight: 1.6 }}>
                {ticket.description}
              </p>
            )}
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>Status</span>
                  <div style={{ marginTop: 6 }}>
                    <Tag color={getStatusColor(ticket.status || 'open')} style={{ fontSize: 13, padding: '4px 12px' }}>
                      {getStatusLabel(ticket.status || 'open')}
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <span style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>Priority</span>
                  <div style={{ marginTop: 6 }}>
                    <Tag color={getPriorityColor(ticket.priority || 'medium')} style={{ fontSize: 13, padding: '4px 12px' }}>
                      {getPriorityLabel(ticket.priority || 'medium')}
                    </Tag>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Basic Information Card */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <InfoCircleOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Basic Information</h3>
            </div>
            <Descriptions
              items={[
                {
                  label: 'Ticket ID',
                  value: ticket.id,
                },
                {
                  label: 'Customer',
                  value: ticket.customer_name || ticket.customer_id || '-',
                },
                {
                  label: 'Category',
                  value: ticket.category ? ticket.category.replace('_', ' ').toUpperCase() : '-',
                },
              ]}
            />
          </Card>

          {/* Assignment & Timeline Card */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <UserOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Assignment & Timeline</h3>
            </div>
            <Descriptions
              items={[
                {
                  label: 'Assigned To',
                  value: ticket.assigned_to_name || 'Unassigned',
                },
                {
                  label: 'Created',
                  value: ticket.created_at ? dayjs(ticket.created_at).format('MMM DD, YYYY HH:mm') : '-',
                },
                {
                  label: 'Updated',
                  value: ticket.updated_at ? dayjs(ticket.updated_at).format('MMM DD, YYYY HH:mm') : '-',
                },
                {
                  label: 'Due Date',
                  value:
                    ticket.due_date && new Date(ticket.due_date) < new Date() && ticket.status !== 'resolved' && ticket.status !== 'closed' ? (
                      <span style={{ color: '#dc2626', fontWeight: 500 }}>
                        {dayjs(ticket.due_date).format('MMM DD, YYYY')}
                      </span>
                    ) : ticket.due_date ? (
                      dayjs(ticket.due_date).format('MMM DD, YYYY')
                    ) : (
                      '-'
                    ),
                },
                {
                  label: 'Resolved',
                  value: ticket.resolved_at ? dayjs(ticket.resolved_at).format('MMM DD, YYYY HH:mm') : 'Not resolved',
                },
              ]}
            />
          </Card>

          {/* Tags Card */}
          {ticket.tags && ticket.tags.length > 0 && (
            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <InfoCircleOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Tags</h3>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ticket.tags.map((tag, index) => (
                  <Tag key={index} color="blue">
                    {tag}
                  </Tag>
                ))}
              </div>
            </Card>
          )}

          {/* Time Tracking Card */}
          {(ticket.estimated_hours || ticket.actual_hours) && (
            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <ClockCircleOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Time Tracking</h3>
              </div>
              <Row gutter={16}>
                {ticket.estimated_hours && (
                  <Col span={12}>
                    <Statistic
                      title="Estimated Hours"
                      value={ticket.estimated_hours}
                      suffix="h"
                      valueStyle={{ color: '#0ea5e9' }}
                    />
                  </Col>
                )}
                {ticket.actual_hours && (
                  <Col span={12}>
                    <Statistic
                      title="Actual Hours"
                      value={ticket.actual_hours}
                      suffix="h"
                      valueStyle={{ color: '#10b981' }}
                    />
                  </Col>
                )}
              </Row>
            </Card>
          )}

          {/* Comments Card */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <MessageOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Comments ({comments.length})</h3>
            </div>

            {/* Comments List */}
            <div style={{ marginBottom: 16 }}>
              {commentsLoading ? (
                <Spin size="small" />
              ) : comments.length > 0 ? (
                <List
                  dataSource={comments}
                  renderItem={(comment: TicketComment) => (
                    <Comment
                      author={
                        <span style={{ fontWeight: 500 }}>
                          {comment.author_name}
                          {comment.author_role && (
                            <Tag style={{ marginLeft: 8, fontSize: 10 }}>
                              {comment.author_role}
                            </Tag>
                          )}
                        </span>
                      }
                      avatar={
                        <Avatar size="small">
                          {comment.author_name.charAt(0).toUpperCase()}
                        </Avatar>
                      }
                      content={<p style={{ margin: 0 }}>{comment.content}</p>}
                      datetime={
                        <span style={{ fontSize: 12, color: '#666' }}>
                          {dayjs(comment.created_at).format('MMM DD, YYYY HH:mm')}
                        </span>
                      }
                    />
                  )}
                  locale={{ emptyText: 'No comments yet' }}
                />
              ) : (
                <Empty
                  description="No comments yet"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ margin: '16px 0' }}
                />
              )}
            </div>

            {/* Add Comment */}
            {hasPermission('crm:support:ticket:create') && (
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Input.TextArea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                    style={{ flex: 1 }}
                    onPressEnter={(e) => {
                      if (e.shiftKey) return; // Allow shift+enter for new lines
                      e.preventDefault();
                      handleAddComment();
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleAddComment}
                    loading={createComment.isPending}
                    disabled={!newComment.trim()}
                    style={{ alignSelf: 'flex-end' }}
                  >
                    Comment
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Attachments Card */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <PaperClipOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Attachments ({attachments.length})</h3>
            </div>

            {hasPermission('crm:support:ticket:create') && (
              <div style={{ marginBottom: 16 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
                />
                <Button
                  type="primary"
                  size="small"
                  icon={<UploadOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                  loading={createAttachment.isPending}
                >
                  Upload File
                </Button>
              </div>
            )}

            {/* Attachments List */}
            {attachmentsLoading ? (
              <Spin size="small" />
            ) : attachments.length > 0 ? (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                <List
                  dataSource={attachments}
                  renderItem={(attachment: TicketAttachment) => (
                    <List.Item
                      style={{
                        padding: '12px',
                        border: '1px solid #f0f0f0',
                        borderRadius: 4,
                        marginBottom: 8
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                          <PaperClipOutlined style={{ marginRight: 12, color: '#666' }} />
                          <div>
                            <div style={{ fontWeight: 500, marginBottom: 2 }}>
                              {attachment.filename}
                            </div>
                            <div style={{ fontSize: 12, color: '#666' }}>
                              {formatFileSize(attachment.file_size)} •
                              Uploaded {dayjs(attachment.created_at).format('MMM DD, YYYY')}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button
                            type="text"
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() => handleDownloadAttachment(attachment)}
                            loading={downloadAttachment.isPending}
                            title="Download"
                          />
                          {hasPermission('crm:support:ticket:delete') && (
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteAttachment(attachment)}
                              loading={deleteAttachment.isPending}
                              title="Delete"
                            />
                          )}
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            ) : (
              <Empty
                description="No attachments yet"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ margin: '16px 0' }}
              />
            )}
          </Card>
        </Spin>
      </div>
    </Drawer>
  );
};