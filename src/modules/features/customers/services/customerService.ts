import { customerService as factoryCustomerService } from '@/services/serviceFactory';
import { Customer } from '@/types/crm';
import {
  CreateCustomerDTO,
  UpdateCustomerDTO,
  CustomerFiltersDTO,
  CustomerStatsDTO,
  CustomerListResponseDTO,
  CustomerTagDTO,
} from '@/types/dtos/customerDtos';

export type CreateCustomerData = CreateCustomerDTO;
export type UpdateCustomerData = UpdateCustomerDTO;
export type CustomerFilters = CustomerFiltersDTO;
export type CustomerStats = CustomerStatsDTO;
export type ICustomerService = {
  getCustomers: (filters?: CustomerFilters) => Promise<CustomerListResponseDTO | Customer[]>;
  getCustomer: (id: string) => Promise<Customer | null>;
  createCustomer: (data: CreateCustomerData) => Promise<Customer>;
  updateCustomer: (id: string, data: Partial<CreateCustomerData>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  bulkDeleteCustomers?: (ids: string[]) => Promise<void>;
  bulkUpdateCustomers?: (ids: string[], updates: Partial<CreateCustomerData>) => Promise<Customer[]>;
  getTags?: () => Promise<CustomerTagDTO[]>;
  createTag?: (name: string, color: string) => Promise<CustomerTagDTO>;
  getIndustries?: () => Promise<string[]>;
  getSizes?: () => Promise<string[]>;
  getCustomerStats?: () => Promise<CustomerStats>;
};

// Thin adapter around serviceFactory to keep legacy consumers working while using the centralized customer service
export class CustomerService implements ICustomerService {
  private svc: any;

  constructor() {
    this.svc = factoryCustomerService as any;
  }

  async getCustomers(filters?: CustomerFilters): Promise<CustomerListResponseDTO | Customer[]> {
    if (typeof this.svc.findMany === 'function') {
      return this.svc.findMany(filters);
    }
    if (typeof this.svc.getCustomers === 'function') {
      return this.svc.getCustomers(filters);
    }
    throw new Error('customer service missing getCustomers/findMany');
  }

  async getCustomer(id: string): Promise<Customer | null> {
    if (typeof this.svc.findOne === 'function') {
      return this.svc.findOne(id);
    }
    if (typeof this.svc.getCustomer === 'function') {
      return this.svc.getCustomer(id);
    }
    return null;
  }

  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    if (typeof this.svc.create === 'function') {
      return this.svc.create(data);
    }
    if (typeof this.svc.createCustomer === 'function') {
      return this.svc.createCustomer(data);
    }
    throw new Error('customer service missing create/createCustomer');
  }

  async updateCustomer(id: string, data: Partial<CreateCustomerData>): Promise<Customer> {
    if (typeof this.svc.update === 'function') {
      return this.svc.update(id, data);
    }
    if (typeof this.svc.updateCustomer === 'function') {
      return this.svc.updateCustomer(id, data);
    }
    throw new Error('customer service missing update/updateCustomer');
  }

  async deleteCustomer(id: string): Promise<void> {
    if (typeof this.svc.delete === 'function') {
      await this.svc.delete(id);
      return;
    }
    if (typeof this.svc.deleteCustomer === 'function') {
      await this.svc.deleteCustomer(id);
      return;
    }
    throw new Error('customer service missing delete/deleteCustomer');
  }

  async bulkDeleteCustomers(ids: string[]): Promise<void> {
    if (typeof this.svc.bulkDeleteCustomers === 'function') {
      await this.svc.bulkDeleteCustomers(ids);
    }
  }

  async bulkUpdateCustomers(ids: string[], updates: Partial<CreateCustomerData>): Promise<Customer[]> {
    if (typeof this.svc.bulkUpdateCustomers === 'function') {
      return this.svc.bulkUpdateCustomers(ids, updates);
    }
    return [];
  }

  async getTags(): Promise<CustomerTagDTO[]> {
    if (typeof this.svc.getTags === 'function') {
      return this.svc.getTags();
    }
    return [];
  }

  async createTag(name: string, color: string): Promise<CustomerTagDTO> {
    if (typeof this.svc.createTag === 'function') {
      return this.svc.createTag(name, color);
    }
    throw new Error('customer service missing createTag');
  }

  async getIndustries(): Promise<string[]> {
    if (typeof this.svc.getIndustries === 'function') {
      return this.svc.getIndustries();
    }
    return [];
  }

  async getSizes(): Promise<string[]> {
    if (typeof this.svc.getSizes === 'function') {
      return this.svc.getSizes();
    }
    return [];
  }

  async getCustomerStats(): Promise<CustomerStats> {
    if (typeof this.svc.getCustomerStats === 'function') {
      return this.svc.getCustomerStats();
    }
    throw new Error('customer service missing getCustomerStats');
  }
}
