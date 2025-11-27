/**
 * Tickets Detail Panel
 * Read-only side drawer for viewing ticket details
 */

import React, { useState, useRef } from 'react';
import { Drawer, Button, Row, Col, Tag, Empty, Spin, Input, Avatar, Divider, List, Upload, message } from 'antd';
import { EditOutlined, SendOutlined, PaperClipOutlined, ClockCircleOutlined, UploadOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { Ticket, TicketComment, TicketAttachment } from '@/types/crm';
import { useAuth } from '@/contexts/AuthContext';
import { useTicketComments, useCreateTicketComment, useAddCommentReply } from '../hooks/useTicketComments';
import { useTicketAttachments, useUploadTicketAttachment, useDeleteTicketAttachment, useDownloadTicketAttachment } from '../hooks/useTicketAttachments';
import dayjs from 'dayjs';

interface TicketsDetailPanelProps {
  ticket: Ticket | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onEdit: () => void;
}

/**
 * Status color mapping
 */
const statusColors: Record<string, string> = {
  open: 'warning',
  in_progress: 'processing',
  resolved: 'success',
  closed: 'default',
  pending: 'warning',
};

/**
 * Priority color mapping
 */
const priorityColors: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

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
  const { hasPermission, user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comments hooks
  const { data: comments = [], isLoading: commentsLoading } = useTicketComments(ticket?.id || '');
  const createComment = useCreateTicketComment();
  const addReply = useAddCommentReply();

  // Attachments hooks
  const { data: attachments = [], isLoading: attachmentsLoading } = useTicketAttachments(ticket?.id || '');
  const uploadAttachment = useUploadTicketAttachment();
  const deleteAttachment = useDeleteTicketAttachment();
  const downloadAttachment = useDownloadTicketAttachment();

  // Comment handlers
  const handleAddComment = async () => {
    if (!newComment.trim() || !ticket) return;

    try {
      await createComment.mutateAsync({
        ticketId: ticket.id,
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
      await uploadAttachment.mutateAsync({ ticketId: ticket.id, file });
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span>Ticket Details</span>
          {hasPermission('tickets:update') && (
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={onEdit}
              style={{ marginRight: 16 }}
            >
              Edit
            </Button>
          )}
        </div>
      }
      placement="right"
      onClose={onClose}
      open={isOpen}
      width={500}
      styles={{ body: { padding: '24px' } }}
    >
      <Spin spinning={isLoading}>
        {/* Title Section */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 12px 0', color: '#111827', fontSize: 20, fontWeight: 600 }}>
            {ticket.title}
          </h2>
          {ticket.description && (
            <p style={{ margin: 0, color: '#666', fontSize: 14, lineHeight: 1.6 }}>
              {ticket.description}
            </p>
          )}
        </div>

        {/* Status & Priority */}
        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>Status</span>
            <div style={{ marginTop: 6 }}>
              <Tag color={statusColors[ticket.status || 'open']} style={{ fontSize: 13, padding: '4px 12px' }}>
                {(ticket.status || 'open').replace('_', ' ').toUpperCase()}
              </Tag>
            </div>
          </div>
          <div>
            <span style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>Priority</span>
            <div style={{ marginTop: 6 }}>
              <Tag color={priorityColors[ticket.priority || 'medium']} style={{ fontSize: 13, padding: '4px 12px' }}>
                {(ticket.priority || 'medium').toUpperCase()}
              </Tag>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#111827' }}>
            Basic Information
          </h3>
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
        </div>

        {/* Assignment & Timeline */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#111827' }}>
            Assignment & Timeline
          </h3>
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
        </div>

        {/* Additional Tags */}
        {ticket.tags && ticket.tags.length > 0 && (
          <div style={{ paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#111827' }}>
              Tags
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ticket.tags.map((tag, index) => (
                <Tag key={index} color="blue">
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
        )}

        {/* Time Tracking */}
        {(ticket.estimated_hours || ticket.actual_hours) && (
          <div style={{ paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#111827' }}>
              <ClockCircleOutlined style={{ marginRight: 8 }} />
              Time Tracking
            </h3>
            <Row gutter={16}>
              {ticket.estimated_hours && (
                <Col span={12}>
                  <div style={{ textAlign: 'center', padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#1890ff' }}>
                      {ticket.estimated_hours}h
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>Estimated</div>
                  </div>
                </Col>
              )}
              {ticket.actual_hours && (
                <Col span={12}>
                  <div style={{ textAlign: 'center', padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }}>
                      {ticket.actual_hours}h
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>Actual</div>
                  </div>
                </Col>
              )}
            </Row>
          </div>
        )}

        {/* Comments Section */}
        <div style={{ paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#111827' }}>
            💬 Comments ({comments.length})
          </h3>

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
          {hasPermission('tickets:create') && (
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
        </div>

        {/* Attachments Section */}
        <div style={{ paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#111827' }}>
              <PaperClipOutlined style={{ marginRight: 8 }} />
              Attachments ({attachments.length})
            </h3>
            {hasPermission('tickets:create') && (
              <div>
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
                  loading={uploadAttachment.isPending}
                >
                  Upload File
                </Button>
              </div>
            )}
          </div>

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
                        {hasPermission('tickets:delete') && (
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
        </div>
      </Spin>
    </Drawer>
  );
};