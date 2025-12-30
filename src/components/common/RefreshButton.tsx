import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useQueryClient, QueryKey } from '@tanstack/react-query';

export interface RefreshButtonProps {
  label?: string;
  tooltip?: string;
  icon?: React.ReactNode;
  size?: 'small' | 'middle' | 'large';
  type?: 'default' | 'primary' | 'dashed' | 'link' | 'text';
  danger?: boolean;
  disabled?: boolean;
  queryKeys?: QueryKey[];
  onRefresh?: () => void | Promise<void>;
  onComplete?: () => void;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  label = 'Refresh',
  tooltip,
  icon,
  size = 'middle',
  type = 'default',
  danger = false,
  disabled = false,
  queryKeys = [],
  onRefresh,
  onComplete,
}) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || loading) return;
    setLoading(true);
    try {
      // Invalidate provided query keys (partial keys supported)
      for (const key of queryKeys) {
        await queryClient.invalidateQueries({ queryKey: key });
      }
      // Run optional refresh callback
      if (onRefresh) {
        await onRefresh();
      }
      onComplete?.();
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <Button
      icon={icon ?? <ReloadOutlined />}
      onClick={handleClick}
      loading={loading}
      size={size}
      type={type}
      danger={danger}
      disabled={disabled}
    >
      {label}
    </Button>
  );

  return tooltip ? (
    <Tooltip title={tooltip}>{content}</Tooltip>
  ) : (
    content
  );
};

export default RefreshButton;