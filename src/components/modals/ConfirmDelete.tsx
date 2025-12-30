import React from 'react';
import { Popconfirm } from 'antd';

export interface ConfirmDeleteProps {
  title?: string;
  description?: string;
  okText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  children: React.ReactNode;
}

export const ConfirmDelete: React.FC<ConfirmDeleteProps> = ({
  title = 'Delete',
  description = 'Are you sure you want to delete this item?',
  okText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  disabled,
  children,
}) => {
  return (
    <Popconfirm
      title={title}
      description={description}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{ danger: true }}
      onConfirm={onConfirm}
      disabled={disabled}
    >
      {children}
    </Popconfirm>
  );
};

export default ConfirmDelete;