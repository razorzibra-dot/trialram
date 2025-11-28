import { Ticket, TicketFormData, TicketFilters } from '@/types/crm';
import { authService } from '../serviceFactory';

class MockTicketService {
  private baseUrl = '/api/tickets';

  // Mock data for demonstration
  private mockTickets: Ticket[] = [
    {
      id: '1',
      title: 'Login Issues with Enterprise Portal',
      description: 'Users are experiencing intermittent login failures on the enterprise portal. The issue seems to occur during peak hours.',
      customer_id: '1',
      status: 'in_progress',
      priority: 'high',
      category: 'technical',
      assigned_to: '3',
      tenant_id: 'tenant_1',
      created_at: '2024-01-28T09:15:00Z',
      updated_at: '2024-01-28T14:30:00Z'
    },
    {
      id: '2',
      title: 'Billing Discrepancy',
      description: 'Customer reports incorrect charges on their monthly invoice. Need to review billing calculations.',
      customer_id: '2',
      status: 'open',
      priority: 'medium',
      category: 'billing',
      assigned_to: '2',
      tenant_id: 'tenant_1',
      created_at: '2024-01-27T16:45:00Z',
      updated_at: '2024-01-27T16:45:00Z'
    },
    {
      id: '3',
      title: 'Feature Request: Advanced Analytics',
      description: 'Customer requesting advanced analytics dashboard with custom reporting capabilities.',
      customer_id: '3',
      status: 'pending',
      priority: 'low',
      category: 'feature_request',
      assigned_to: '1',
      tenant_id: 'tenant_1',
      created_at: '2024-01-26T11:20:00Z',
      updated_at: '2024-01-27T09:30:00Z'
    },
    {
      id: '4',
      title: 'Integration Setup Assistance',
      description: 'Customer needs help setting up API integration with their existing systems.',
      customer_id: '4',
      status: 'resolved',
      priority: 'medium',
      category: 'technical',
      assigned_to: '3',
      tenant_id: 'tenant_1',
      created_at: '2024-01-25T08:30:00Z',
      updated_at: '2024-01-26T17:00:00Z',
      resolved_at: '2024-01-26T17:00:00Z'
    },
    {
      id: '5',
      title: 'Account Access Request',
      description: 'New employee needs access to the customer portal with specific permissions.',
      customer_id: '1',
      status: 'closed',
      priority: 'low',
      category: 'general',
      assigned_to: '2',
      tenant_id: 'tenant_1',
      created_at: '2024-01-24T15:45:00Z',
      updated_at: '2024-01-25T10:15:00Z',
      resolved_at: '2024-01-25T10:15:00Z'
    },
    {
      id: '6',
      title: 'System Performance Issues',
      description: 'Customer reporting slow response times during data processing operations.',
      customer_id: '2',
      status: 'open',
      priority: 'urgent',
      category: 'technical',
      assigned_to: '1',
      tenant_id: 'tenant_1',
      created_at: '2024-01-29T07:20:00Z',
      updated_at: '2024-01-29T07:20:00Z'
    }
  ];

  async getTickets(filters?: TicketFilters): Promise<Ticket[]> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let tickets = this.mockTickets.filter(t => t.tenant_id === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      tickets = tickets.filter(t => t.assigned_to === user.id);
    }

    // Apply filters
    if (filters) {
      if (filters.status) {
        tickets = tickets.filter(t => t.status === filters.status);
      }
      if (filters.priority) {
        tickets = tickets.filter(t => t.priority === filters.priority);
      }
      if (filters.category) {
        tickets = tickets.filter(t => t.category === filters.category);
      }
      if (filters.assigned_to) {
        tickets = tickets.filter(t => t.assigned_to === filters.assigned_to);
      }
      if (filters.customer_id) {
        tickets = tickets.filter(t => t.customer_id === filters.customer_id);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        tickets = tickets.filter(t => 
          t.title.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.customer_name?.toLowerCase().includes(search)
        );
      }
    }

    return tickets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getTicket(id: string): Promise<Ticket> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const ticket = this.mockTickets.find(t => 
      t.id === id && t.tenant_id === user.tenant_id
    );

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Check permissions
    if (user.role === 'agent' && ticket.assigned_to !== user.id) {
      throw new Error('Access denied');
    }

    return ticket;
  }

  async createTicket(ticketData: Omit<Ticket, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<Ticket> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    // Apply ticket creation rules
    const validatedData = await this.applyTicketCreationRules(ticketData, user);

    const newTicket: Ticket = {
      ...validatedData,
      id: this.generateTicketNumber(),
      tenant_id: user.tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.mockTickets.push(newTicket);
    return newTicket;
  }

  // Ticket Creation Rules Implementation
  private async applyTicketCreationRules(
    ticketData: Omit<Ticket, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>,
    user: any
  ): Promise<Omit<Ticket, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>> {
    let processedData = { ...ticketData };

    // Rule 1: Validate required fields
    this.validateRequiredFields(processedData);

    // Rule 2: Auto-assign priority based on keywords and category
    processedData = this.applyPriorityRules(processedData);

    // Rule 3: Auto-assign category based on content analysis
    processedData = this.applyCategoryRules(processedData);

    // Rule 4: Auto-assign ticket to appropriate agent
    processedData = await this.applyAssignmentRules(processedData, user);

    // Rule 5: Set initial status
    processedData.status = processedData.status || 'open';

    // Rule 6: Set SLA tracking
    processedData = this.applySLARules(processedData);

    // Rule 7: Apply business rules based on customer history
    processedData = await this.applyCustomerHistoryRules(processedData);

    return processedData;
  }

  private validateRequiredFields(ticketData: Omit<Ticket, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): void {
    if (!ticketData.title?.trim()) {
      throw new Error('Ticket title is required');
    }
    if (!ticketData.description?.trim()) {
      throw new Error('Ticket description is required');
    }
    if (!ticketData.customer_id) {
      throw new Error('Customer ID is required');
    }

    // Validate title length
    if (ticketData.title.length < 5) {
      throw new Error('Ticket title must be at least 5 characters long');
    }
    if (ticketData.title.length > 200) {
      throw new Error('Ticket title must not exceed 200 characters');
    }

    // Validate description length
    if (ticketData.description.length < 10) {
      throw new Error('Ticket description must be at least 10 characters long');
    }
  }

  private applyPriorityRules(ticketData: Omit<Ticket, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Omit<Ticket, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> {
    const title = ticketData.title.toLowerCase();
    const description = ticketData.description.toLowerCase();

    // Urgent keywords
    const urgentKeywords = ['critical', 'emergency', 'down', 'unavailable', 'security', 'breach', 'attack'];
    // High priority keywords
    const highKeywords = ['error', 'bug', 'issue', 'problem', 'fail', 'broken', 'urgent', 'asap'];
    // Medium priority keywords
    const mediumKeywords = ['slow', 'performance', 'delay', 'question', 'help', 'support'];

    if (urgentKeywords.some(keyword => title.includes(keyword) || description.includes(keyword))) {
      return { ...ticketData, priority: 'urgent' };
    } else if (highKeywords.some(keyword => title.includes(keyword) || description.includes(keyword))) {
      return { ...ticketData, priority: ticketData.priority || 'high' };
    } else if (mediumKeywords.some(keyword => title.includes(keyword) || description.includes(keyword))) {
      return { ...ticketData, priority: ticketData.priority || 'medium' };
    }

    return { ...ticketData, priority: ticketData.priority || 'low' };
  }

  private applyCategoryRules(ticketData: Omit<Ticket, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Omit<Ticket, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> {
    const title = ticketData.title.toLowerCase();
    const description = ticketData.description.toLowerCase();

    // Category detection rules
    if (title.includes('billing') || title.includes('invoice') || title.includes('payment') ||
        description.includes('billing') || description.includes('invoice') || description.includes('payment')) {
      return { ...ticketData, category: 'billing' };
    } else if (title.includes('login') || title.includes('password') || title.includes('access') ||
               description.includes('login') || description.includes('password') || description.includes('access')) {
      return { ...ticketData, category: 'technical' };
    } else if (title.includes('feature') || title.includes('enhancement') || title.includes('request') ||
               description.includes('feature') || description.includes('enhancement') || description.includes('request')) {
      return { ...ticketData, category: 'feature_request' };
    }

    return { ...ticketData, category: ticketData.category || 'general' };
  }

  private async applyAssignmentRules(
    ticketData: Omit<Ticket, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>,
    user: any
  ): Promise<Omit<Ticket, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>> {
    // If already assigned, keep the assignment
    if (ticketData.assigned_to) {
      return ticketData;
    }

    // Auto-assignment logic based on category and priority
    let assignedTo: string | undefined;

    switch (ticketData.category) {
      case 'billing':
        // Assign to billing specialist (user 2 in mock data)
        assignedTo = '2';
        break;
      case 'technical':
        // Assign to technical specialist (user 3 in mock data)
        assignedTo = '3';
        break;
      case 'feature_request':
        // Assign to product manager (user 1 in mock data)
        assignedTo = '1';
        break;
      default: {
        // Round-robin assignment for general tickets
        const availableAgents = ['2', '3']; // Exclude admin user
        const recentTickets = this.mockTickets
          .filter(t => t.category === 'general')
          .slice(-2);
        const lastAssigned =
          recentTickets.length > 0 ? recentTickets[recentTickets.length - 1].assigned_to : null;
        assignedTo = availableAgents.find(agent => agent !== lastAssigned) || availableAgents[0];
        break;
      }
    }

    // For urgent tickets, assign to most experienced agent
    if (ticketData.priority === 'urgent') {
      assignedTo = '1'; // Admin user
    }

    return { ...ticketData, assigned_to: assignedTo };
  }

  private applySLARules(ticketData: Omit<Ticket, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Omit<Ticket, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> {
    // Set SLA based on priority
    const slaHours = {
      urgent: 2,    // 2 hours
      high: 8,      // 8 hours
      medium: 24,   // 24 hours
      low: 72       // 72 hours
    };

    const priority = ticketData.priority || 'medium';
    const slaDuration = slaHours[priority as keyof typeof slaHours] || 24;

    return {
      ...ticketData,
      sla_target: slaDuration,
      sla_start: new Date().toISOString()
    };
  }

  private async applyCustomerHistoryRules(ticketData: Omit<Ticket, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<Omit<Ticket, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>> {
    // Check customer history for patterns
    const customerTickets = this.mockTickets.filter(t => t.customer_id === ticketData.customer_id);

    if (customerTickets.length > 0) {
      // If customer has many open tickets, increase priority
      const openTickets = customerTickets.filter(t => ['open', 'in_progress', 'pending'].includes(t.status));
      if (openTickets.length >= 3) {
        return {
          ...ticketData,
          priority: ticketData.priority === 'urgent' ? 'urgent' : 'high',
          notes: `${ticketData.notes || ''}\n\nNote: Customer has ${openTickets.length} open tickets.`.trim()
        };
      }

      // If customer frequently reports similar issues, flag for review
      const similarTickets = customerTickets.filter(t =>
        t.category === ticketData.category &&
        t.title.toLowerCase().includes(ticketData.title.toLowerCase().split(' ')[0])
      );
      if (similarTickets.length >= 2) {
        return {
          ...ticketData,
          notes: `${ticketData.notes || ''}\n\nNote: Customer has reported similar issues ${similarTickets.length} times.`.trim()
        };
      }
    }

    return ticketData;
  }

  private generateTicketNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TICK-${timestamp}-${random}`;
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const ticketIndex = this.mockTickets.findIndex(t => 
      t.id === id && t.tenant_id === user.tenant_id
    );

    if (ticketIndex === -1) {
      throw new Error('Ticket not found');
    }

    // Check permissions
    if (user.role === 'agent' && this.mockTickets[ticketIndex].assigned_to !== user.id) {
      throw new Error('Access denied');
    }

    // Auto-set resolved_at when status changes to resolved
    if (updates.status === 'resolved' && this.mockTickets[ticketIndex].status !== 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }

    this.mockTickets[ticketIndex] = {
      ...this.mockTickets[ticketIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return this.mockTickets[ticketIndex];
  }

  async deleteTicket(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('delete')) {
      throw new Error('Insufficient permissions');
    }

    const ticketIndex = this.mockTickets.findIndex(t => 
      t.id === id && t.tenant_id === user.tenant_id
    );

    if (ticketIndex === -1) {
      throw new Error('Ticket not found');
    }

    this.mockTickets.splice(ticketIndex, 1);
  }

  async getStatuses(): Promise<string[]> {
    return ['open', 'in_progress', 'pending', 'resolved', 'closed'];
  }

  async getPriorities(): Promise<string[]> {
    return ['low', 'medium', 'high', 'urgent'];
  }

  async getCategories(): Promise<string[]> {
    return ['technical', 'billing', 'general', 'feature_request'];
  }

  async getTicketStats(): Promise<{
    status: string;
    count: number;
  }[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let tickets = this.mockTickets.filter(t => t.tenant_id === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      tickets = tickets.filter(t => t.assigned_to === user.id);
    }

    const statuses = ['open', 'in_progress', 'pending', 'resolved', 'closed'];

    return statuses.map(status => ({
      status,
      count: tickets.filter(t => t.status === status).length
    }));
  }

  // Escalation Procedures Implementation
  async escalateTicket(ticketId: string, escalationReason: string, targetLevel?: 'tier_2' | 'tier_3' | 'management'): Promise<Ticket> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const ticketIndex = this.mockTickets.findIndex(t =>
      t.id === ticketId && t.tenant_id === user.tenant_id
    );

    if (ticketIndex === -1) {
      throw new Error('Ticket not found');
    }

    const ticket = this.mockTickets[ticketIndex];
    const escalationLevel = targetLevel || this.determineEscalationLevel(ticket);

    // Update ticket with escalation information
    const updatedTicket = {
      ...ticket,
      priority: this.getEscalatedPriority(ticket.priority),
      assigned_to: await this.getEscalationAssignee(escalationLevel, ticket.category),
      status: 'in_progress' as const,
      notes: `${ticket.notes || ''}\n\n[ESCALATION ${new Date().toISOString()}] ${escalationReason} - Escalated to ${escalationLevel}`.trim(),
      updated_at: new Date().toISOString()
    };

    this.mockTickets[ticketIndex] = updatedTicket;

    // Trigger escalation notifications
    await this.notifyEscalation(updatedTicket, escalationReason, escalationLevel);

    return updatedTicket;
  }

  async checkAndEscalateSLABreaches(): Promise<Ticket[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const now = new Date();
    const escalatedTickets: Ticket[] = [];

    for (const ticket of this.mockTickets) {
      if (ticket.tenant_id !== user.tenant_id || ticket.status === 'resolved' || ticket.status === 'closed') {
        continue;
      }

      if (this.isSLABreached(ticket, now)) {
        const escalatedTicket = await this.escalateTicket(
          ticket.id,
          `Automatic escalation due to SLA breach (${ticket.sla_target}h SLA exceeded)`,
          'tier_2'
        );
        escalatedTickets.push(escalatedTicket);
      }
    }

    return escalatedTickets;
  }

  private determineEscalationLevel(ticket: Ticket): 'tier_2' | 'tier_3' | 'management' {
    // Determine escalation level based on ticket characteristics
    if (ticket.priority === 'urgent') {
      return 'tier_3';
    } else if (ticket.priority === 'high' || this.isSLABreached(ticket, new Date())) {
      return 'tier_2';
    } else {
      return 'tier_2';
    }
  }

  private getEscalatedPriority(currentPriority: string): 'low' | 'medium' | 'high' | 'urgent' {
    switch (currentPriority) {
      case 'low': return 'medium';
      case 'medium': return 'high';
      case 'high': return 'urgent';
      case 'urgent': return 'urgent';
      default: return 'high';
    }
  }

  private async getEscalationAssignee(level: 'tier_2' | 'tier_3' | 'management', category: string): Promise<string> {
    // Escalation assignee logic based on level and category
    switch (level) {
      case 'tier_2':
        // Senior specialists
        if (category === 'technical') return '3'; // Technical lead
        if (category === 'billing') return '2'; // Billing supervisor
        return '1'; // General supervisor
      case 'tier_3':
        return '1'; // Management
      case 'management':
        return '1'; // Executive management
      default:
        return '1';
    }
  }

  private isSLABreached(ticket: Ticket, currentTime: Date): boolean {
    if (!ticket.sla_start || !ticket.sla_target) return false;

    const slaStart = new Date(ticket.sla_start);
    const slaTargetMs = ticket.sla_target * 60 * 60 * 1000; // Convert hours to milliseconds
    const slaDeadline = new Date(slaStart.getTime() + slaTargetMs);

    return currentTime > slaDeadline;
  }

  private async notifyEscalation(ticket: Ticket, reason: string, level: string): Promise<void> {
    // This would integrate with notification service
    // For now, we'll just log the escalation
    console.log(`Ticket ${ticket.id} escalated to ${level}: ${reason}`);

    // In a real implementation, this would send notifications to:
    // - The new assignee
    // - Escalation supervisors
    // - Possibly the customer (for transparency)
  }

  async getEscalationHistory(ticketId: string): Promise<Array<{
    timestamp: string;
    from_level: string;
    to_level: string;
    reason: string;
    escalated_by: string;
  }>> {
    // Extract escalation history from ticket notes
    const ticket = this.mockTickets.find(t => t.id === ticketId);
    if (!ticket || !ticket.notes) return [];

    const escalationPattern = /\[ESCALATION ([^\]]+)\] ([^-]+) - Escalated to ([^\n]+)/g;
    const history: Array<{
      timestamp: string;
      from_level: string;
      to_level: string;
      reason: string;
      escalated_by: string;
    }> = [];

    let match;
    while ((match = escalationPattern.exec(ticket.notes)) !== null) {
      history.push({
        timestamp: match[1],
        from_level: 'tier_1', // Default assumption
        to_level: match[3],
        reason: match[2].trim(),
        escalated_by: 'system' // Would be populated from actual user
      });
    }

    return history;
  }

  // Interface compliance methods - aliases for existing methods
  async getTicketCategories(): Promise<Array<{ id: string; name: string }>> {
    const categories = await this.getCategories();
    return categories.map(category => ({ id: category, name: category }));
  }

  async getTicketPriorities(): Promise<Array<{ id: string; name: string }>> {
    const priorities = await this.getPriorities();
    return priorities.map(priority => ({ id: priority, name: priority }));
  }

  // Resolution Tracking Implementation
  async resolveTicket(
    ticketId: string,
    resolutionData: {
      resolution: string;
      resolution_category?: string;
      customer_satisfaction?: 1 | 2 | 3 | 4 | 5;
      follow_up_required?: boolean;
      follow_up_date?: string;
      knowledge_base_updated?: boolean;
    }
  ): Promise<Ticket> {
    await new Promise(resolve => setTimeout(resolve, 700));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const ticketIndex = this.mockTickets.findIndex(t =>
      t.id === ticketId && t.tenant_id === user.tenant_id
    );

    if (ticketIndex === -1) {
      throw new Error('Ticket not found');
    }

    const ticket = this.mockTickets[ticketIndex];

    // Validate resolution requirements
    this.validateResolutionData(resolutionData, ticket);

    // Calculate resolution metrics
    const resolutionMetrics = this.calculateResolutionMetrics(ticket);

    const resolvedTicket: Ticket = {
      ...ticket,
      status: 'resolved',
      resolution: resolutionData.resolution,
      resolved_at: new Date().toISOString(),
      resolution_time: resolutionMetrics.totalResolutionTime,
      first_response_time: resolutionMetrics.firstResponseTime,
      is_sla_breached: resolutionMetrics.isSLABreached,
      notes: `${ticket.notes || ''}\n\n[RESOLUTION ${new Date().toISOString()}] ${resolutionData.resolution}`.trim(),
      updated_at: new Date().toISOString()
    };

    this.mockTickets[ticketIndex] = resolvedTicket;

    // Handle post-resolution actions
    await this.handlePostResolutionActions(resolvedTicket, resolutionData);

    return resolvedTicket;
  }

  async closeTicket(ticketId: string, closureData: {
    closure_reason?: string;
    customer_feedback?: string;
    final_notes?: string;
  }): Promise<Ticket> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const ticketIndex = this.mockTickets.findIndex(t =>
      t.id === ticketId && t.tenant_id === user.tenant_id
    );

    if (ticketIndex === -1) {
      throw new Error('Ticket not found');
    }

    const ticket = this.mockTickets[ticketIndex];

    // Only resolved tickets can be closed
    if (ticket.status !== 'resolved') {
      throw new Error('Ticket must be resolved before closing');
    }

    const closedTicket: Ticket = {
      ...ticket,
      status: 'closed',
      closed_at: new Date().toISOString(),
      notes: `${ticket.notes || ''}\n\n[CLOSED ${new Date().toISOString()}] ${closureData.final_notes || 'Ticket closed'}`.trim(),
      updated_at: new Date().toISOString()
    };

    this.mockTickets[ticketIndex] = closedTicket;

    // Archive ticket for analytics
    await this.archiveTicketForAnalytics(closedTicket);

    return closedTicket;
  }

  async reopenTicket(ticketId: string, reopenReason: string): Promise<Ticket> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const ticketIndex = this.mockTickets.findIndex(t =>
      t.id === ticketId && t.tenant_id === user.tenant_id
    );

    if (ticketIndex === -1) {
      throw new Error('Ticket not found');
    }

    const ticket = this.mockTickets[ticketIndex];

    // Only closed tickets can be reopened
    if (ticket.status !== 'closed') {
      throw new Error('Only closed tickets can be reopened');
    }

    const reopenedTicket: Ticket = {
      ...ticket,
      status: 'open',
      resolved_at: undefined,
      closed_at: undefined,
      resolution_time: undefined,
      notes: `${ticket.notes || ''}\n\n[REOPENED ${new Date().toISOString()}] ${reopenReason}`.trim(),
      updated_at: new Date().toISOString()
    };

    this.mockTickets[ticketIndex] = reopenedTicket;

    // Reassign to appropriate agent
    const reassignedTicket = await this.applyAssignmentRules(reopenedTicket, user);
    this.mockTickets[ticketIndex] = {
      ...reassignedTicket,
      id: ticket.id,
      tenant_id: ticket.tenant_id,
      created_at: ticket.created_at,
      updated_at: new Date().toISOString()
    };

    return this.mockTickets[ticketIndex];
  }

  private validateResolutionData(resolutionData: any, ticket: Ticket): void {
    if (!resolutionData.resolution?.trim()) {
      throw new Error('Resolution description is required');
    }

    if (resolutionData.resolution.length < 10) {
      throw new Error('Resolution description must be at least 10 characters long');
    }

    // Check if ticket is in a resolvable state
    if (['closed'].includes(ticket.status)) {
      throw new Error('Cannot resolve a closed ticket');
    }
  }

  private calculateResolutionMetrics(ticket: Ticket): {
    totalResolutionTime: number;
    firstResponseTime: number;
    isSLABreached: boolean;
  } {
    const now = new Date();
    const createdAt = new Date(ticket.created_at);

    // Calculate total resolution time in minutes
    const totalResolutionTime = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));

    // Calculate first response time (simplified - would need actual first response tracking)
    const firstResponseTime = ticket.first_response_time || totalResolutionTime;

    // Check SLA breach
    const isSLABreached = this.isSLABreached(ticket, now);

    return {
      totalResolutionTime,
      firstResponseTime,
      isSLABreached
    };
  }

  private async handlePostResolutionActions(ticket: Ticket, resolutionData: any): Promise<void> {
    // Send resolution notification to customer
    await this.notifyResolution(ticket);

    // Schedule follow-up if required
    if (resolutionData.follow_up_required && resolutionData.follow_up_date) {
      await this.scheduleFollowUp(ticket.id, resolutionData.follow_up_date);
    }

    // Update knowledge base if requested
    if (resolutionData.knowledge_base_updated) {
      await this.updateKnowledgeBase(ticket, resolutionData.resolution);
    }

    // Log resolution analytics
    await this.logResolutionAnalytics(ticket, resolutionData);
  }

  private async notifyResolution(ticket: Ticket): Promise<void> {
    // This would integrate with notification service
    console.log(`Resolution notification sent for ticket ${ticket.id}`);
  }

  private async scheduleFollowUp(ticketId: string, followUpDate: string): Promise<void> {
    // This would integrate with task/scheduling service
    console.log(`Follow-up scheduled for ticket ${ticketId} on ${followUpDate}`);
  }

  private async updateKnowledgeBase(ticket: Ticket, resolution: string): Promise<void> {
    // This would integrate with knowledge base service
    console.log(`Knowledge base updated with resolution from ticket ${ticket.id}`);
  }

  private async logResolutionAnalytics(ticket: Ticket, resolutionData: any): Promise<void> {
    // Log analytics for reporting
    const analytics = {
      ticket_id: ticket.id,
      resolution_time: ticket.resolution_time,
      category: ticket.category,
      priority: ticket.priority,
      customer_satisfaction: resolutionData.customer_satisfaction,
      is_sla_breached: ticket.is_sla_breached,
      timestamp: new Date().toISOString()
    };

    console.log('Resolution analytics logged:', analytics);
  }

  private async archiveTicketForAnalytics(ticket: Ticket): Promise<void> {
    // Archive closed tickets for long-term analytics
    console.log(`Ticket ${ticket.id} archived for analytics`);
  }

  // SLA Management Implementation
  async defineSLAPolicies(): Promise<{
    policies: Array<{
      priority: string;
      response_time_hours: number;
      resolution_time_hours: number;
      escalation_levels: Array<{
        level: string;
        time_trigger_hours: number;
        notification_required: boolean;
      }>;
    }>;
  }> {
    // Define SLA policies based on priority levels
    const slaPolicies = {
      policies: [
        {
          priority: 'urgent',
          response_time_hours: 1,
          resolution_time_hours: 4,
          escalation_levels: [
            { level: 'tier_2', time_trigger_hours: 2, notification_required: true },
            { level: 'management', time_trigger_hours: 3, notification_required: true }
          ]
        },
        {
          priority: 'high',
          response_time_hours: 4,
          resolution_time_hours: 24,
          escalation_levels: [
            { level: 'tier_2', time_trigger_hours: 8, notification_required: true },
            { level: 'management', time_trigger_hours: 16, notification_required: true }
          ]
        },
        {
          priority: 'medium',
          response_time_hours: 8,
          resolution_time_hours: 72,
          escalation_levels: [
            { level: 'tier_2', time_trigger_hours: 24, notification_required: false },
            { level: 'management', time_trigger_hours: 48, notification_required: true }
          ]
        },
        {
          priority: 'low',
          response_time_hours: 24,
          resolution_time_hours: 168, // 1 week
          escalation_levels: [
            { level: 'tier_2', time_trigger_hours: 72, notification_required: false },
            { level: 'management', time_trigger_hours: 120, notification_required: false }
          ]
        }
      ]
    };

    return slaPolicies;
  }

  async createSLATemplate(templateData: {
    name: string;
    description?: string;
    priority: string;
    response_time_hours: number;
    resolution_time_hours: number;
    business_hours_only: boolean;
    exclude_weekends: boolean;
    exclude_holidays: boolean;
    custom_rules?: Record<string, any>;
  }): Promise<{
    id: string;
    name: string;
    created_at: string;
    policies: any;
  }> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const template = {
      id: `sla_template_${Date.now()}`,
      name: templateData.name,
      created_at: new Date().toISOString(),
      policies: templateData
    };

    // In a real implementation, this would be stored in a database
    console.log('SLA template created:', template);

    return template;
  }

  async applySLATemplate(ticketId: string, templateId: string): Promise<Ticket> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const ticketIndex = this.mockTickets.findIndex(t =>
      t.id === ticketId && t.tenant_id === user.tenant_id
    );

    if (ticketIndex === -1) {
      throw new Error('Ticket not found');
    }

    // Get SLA policies and apply to ticket
    const slaPolicies = await this.defineSLAPolicies();
    const policy = slaPolicies.policies.find(p => p.priority === this.mockTickets[ticketIndex].priority);

    if (!policy) {
      throw new Error('No SLA policy found for ticket priority');
    }

    const updatedTicket: Ticket = {
      ...this.mockTickets[ticketIndex],
      sla_target: policy.resolution_time_hours,
      sla_start: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.mockTickets[ticketIndex] = updatedTicket;

    return updatedTicket;
  }

  async monitorSLAAdherence(): Promise<{
    overall_compliance: number;
    compliance_by_priority: Record<string, number>;
    breached_tickets: Array<{
      ticket_id: string;
      priority: string;
      breach_time_hours: number;
      assigned_to?: string;
    }>;
    upcoming_breaches: Array<{
      ticket_id: string;
      priority: string;
      time_remaining_hours: number;
      assigned_to?: string;
    }>;
  }> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const now = new Date();
    let totalTickets = 0;
    let compliantTickets = 0;
    const complianceByPriority: Record<string, number> = {};
    const breachedTickets: Array<any> = [];
    const upcomingBreaches: Array<any> = [];

    for (const ticket of this.mockTickets) {
      if (ticket.tenant_id !== user.tenant_id ||
          ticket.status === 'resolved' ||
          ticket.status === 'closed' ||
          !ticket.sla_start ||
          !ticket.sla_target) {
        continue;
      }

      totalTickets++;
      const priority = ticket.priority;
      if (!complianceByPriority[priority]) {
        complianceByPriority[priority] = 0;
      }

      const slaStart = new Date(ticket.sla_start);
      const slaTargetMs = ticket.sla_target * 60 * 60 * 1000;
      const slaDeadline = new Date(slaStart.getTime() + slaTargetMs);
      const timeRemaining = (slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60); // hours

      if (now > slaDeadline) {
        // SLA breached
        const breachTime = (now.getTime() - slaDeadline.getTime()) / (1000 * 60 * 60);
        breachedTickets.push({
          ticket_id: ticket.id,
          priority: ticket.priority,
          breach_time_hours: Math.round(breachTime * 100) / 100,
          assigned_to: ticket.assigned_to
        });
      } else {
        compliantTickets++;
        complianceByPriority[priority]++;

        // Check for upcoming breaches (within 2 hours)
        if (timeRemaining <= 2) {
          upcomingBreaches.push({
            ticket_id: ticket.id,
            priority: ticket.priority,
            time_remaining_hours: Math.round(timeRemaining * 100) / 100,
            assigned_to: ticket.assigned_to
          });
        }
      }
    }

    const overallCompliance = totalTickets > 0 ? (compliantTickets / totalTickets) * 100 : 100;

    // Calculate compliance by priority
    Object.keys(complianceByPriority).forEach(priority => {
      const priorityTickets = this.mockTickets.filter(t =>
        t.tenant_id === user.tenant_id &&
        t.priority === priority &&
        (t.status === 'open' || t.status === 'in_progress' || t.status === 'pending')
      ).length;

      if (priorityTickets > 0) {
        complianceByPriority[priority] = (complianceByPriority[priority] / priorityTickets) * 100;
      }
    });

    return {
      overall_compliance: Math.round(overallCompliance * 100) / 100,
      compliance_by_priority: complianceByPriority,
      breached_tickets: breachedTickets,
      upcoming_breaches: upcomingBreaches
    };
  }

  async getResolutionAnalytics(filters?: {
    date_from?: string;
    date_to?: string;
    category?: string;
    priority?: string;
  }): Promise<{
    average_resolution_time: number;
    sla_compliance_rate: number;
    customer_satisfaction_avg: number;
    resolution_rate_by_category: Record<string, number>;
    resolution_trends: Array<{ date: string; resolved_count: number; avg_time: number }>;
  }> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let resolvedTickets = this.mockTickets.filter(t =>
      t.tenant_id === user.tenant_id &&
      (t.status === 'resolved' || t.status === 'closed') &&
      t.resolved_at
    );

    // Apply filters
    if (filters) {
      if (filters.date_from) {
        resolvedTickets = resolvedTickets.filter(t =>
          new Date(t.resolved_at!) >= new Date(filters.date_from!)
        );
      }
      if (filters.date_to) {
        resolvedTickets = resolvedTickets.filter(t =>
          new Date(t.resolved_at!) <= new Date(filters.date_to!)
        );
      }
      if (filters.category) {
        resolvedTickets = resolvedTickets.filter(t => t.category === filters.category);
      }
      if (filters.priority) {
        resolvedTickets = resolvedTickets.filter(t => t.priority === filters.priority);
      }
    }

    // Calculate metrics
    const totalTickets = resolvedTickets.length;
    const avgResolutionTime = totalTickets > 0
      ? resolvedTickets.reduce((sum, t) => sum + (t.resolution_time || 0), 0) / totalTickets
      : 0;

    const slaCompliantTickets = resolvedTickets.filter(t => !t.is_sla_breached).length;
    const slaComplianceRate = totalTickets > 0 ? (slaCompliantTickets / totalTickets) * 100 : 0;

    // Mock customer satisfaction (would come from actual feedback)
    const customerSatisfactionAvg = 4.2;

    // Category breakdown
    const categoryStats: Record<string, number> = {};
    resolvedTickets.forEach(ticket => {
      categoryStats[ticket.category] = (categoryStats[ticket.category] || 0) + 1;
    });

    // Mock trends data
    const resolutionTrends = [
      { date: '2024-01-01', resolved_count: 5, avg_time: 120 },
      { date: '2024-01-02', resolved_count: 8, avg_time: 95 },
      { date: '2024-01-03', resolved_count: 6, avg_time: 110 }
    ];

    return {
      average_resolution_time: Math.round(avgResolutionTime),
      sla_compliance_rate: Math.round(slaComplianceRate * 100) / 100,
      customer_satisfaction_avg: customerSatisfactionAvg,
      resolution_rate_by_category: categoryStats,
      resolution_trends: resolutionTrends
    };
  }
}

export const mockTicketService = new MockTicketService();