import React from 'react';
import { Row, Col } from 'antd';
import { StatCard, StatCardProps } from './StatCard';

export interface StatsGridItem extends Omit<StatCardProps, 'value'> {
  value: string | number;
}

export interface StatsGridProps {
  items: StatsGridItem[];
  colProps?: Partial<{ xs: number; sm: number; md: number; lg: number; xl: number }>;
  gutter?: [number, number];
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  items,
  colProps = { xs: 24, sm: 12, lg: 6 },
  gutter = [16, 16],
}) => {
  return (
    <Row gutter={gutter} style={{ marginBottom: 24 }}>
      {items.map((item, idx) => (
        <Col key={idx} {...colProps}>
          <StatCard
            title={item.title}
            value={item.value}
            description={item.description}
            icon={item.icon}
            trend={item.trend}
            loading={item.loading}
            color={item.color}
            onClick={item.onClick}
          />
        </Col>
      ))}
    </Row>
  );
};

export default StatsGrid;