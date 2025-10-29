/**
 * Centralized DTO Exports
 * All Data Transfer Objects (DTOs) for service standardization
 * 
 * These DTOs ensure consistent field naming and data structures
 * across all backend implementations (mock, real, supabase)
 */

// Common DTOs
export type {
  PaginatedResponseDTO,
  StatsResponseDTO,
  ApiErrorDTO,
  BaseFiltersDTO,
  AuditMetadataDTO,
  EntityStatus,
  PriorityLevel,
  SuccessResponseDTO,
  ErrorResponseDTO,
  ApiResponseDTO,
  SelectOptionDTO,
  MetricDTO,
  ChartDataDTO,
  TimeSeriesDataDTO,
  DistributionDTO,
  UserBasicDTO,
  AttachmentDTO,
  ActivityLogDTO,
} from './commonDtos';

// Customer DTOs
export type {
  CustomerDTO,
  CustomerStatsDTO,
  CreateCustomerDTO,
  UpdateCustomerDTO,
  CustomerFiltersDTO,
  CustomerListResponseDTO,
  CustomerTagDTO,
  BulkCustomerUpdateDTO,
  BulkCustomerDeleteDTO,
  CustomerExportDTO,
  CustomerActivityDTO,
  CustomerSegmentDTO,
} from './customerDtos';

// Sales DTOs
export type {
  DealStatus,
  DealStage,
  DealDTO,
  SalesStatsDTO,
  CreateDealDTO,
  UpdateDealDTO,
  DealFiltersDTO,
  DealListResponseDTO,
  DealStageInfoDTO,
  DealConversionMetricsDTO,
  SalesForecastDTO,
  SalesRepPerformanceDTO,
  CustomerSalesSummaryDTO,
} from './salesDtos';

// Product Sales DTOs
export type {
  ProductSaleStatus,
  ProductSaleItemDTO,
  ProductSaleDTO,
  ProductSalesAnalyticsDTO,
  CreateProductSaleDTO,
  UpdateProductSaleDTO,
  ProductSaleFiltersDTO,
  ProductSaleListResponseDTO,
  BulkProductSaleUpdateDTO,
  BulkProductSaleDeleteDTO,
  GenerateInvoiceDTO,
  SalesReportDTO,
  TrendDataDTO,
  CustomerSalesSummaryDTO as ProductSaleCustomerSummaryDTO,
  PaymentReconciliationDTO,
} from './productSalesDtos';

// Ticket DTOs
export type {
  TicketStatus,
  TicketCategory,
  TicketCommentDTO,
  TicketDTO,
  TicketStatsDTO,
  CreateTicketDTO,
  UpdateTicketDTO,
  TicketFiltersDTO,
  TicketListResponseDTO,
  AddCommentDTO,
  AssignTicketDTO,
  BulkTicketUpdateDTO,
  SupportAgentPerformanceDTO,
  TicketReportDTO,
  SlaConfigDTO,
  SatisfactionSurveyDTO,
} from './ticketDtos';