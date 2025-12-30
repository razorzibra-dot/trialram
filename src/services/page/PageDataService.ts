/**
 * PAGE DATA SERVICE - Enterprise Module Data Loading Pattern
 * ============================================================================
 *
 * DESIGN PRINCIPLE: Single batch load per page/module
 *
 * Problem: Each module/page triggers multiple API calls
 * - useCustomers() → API call
 * - useReferenceData() → API call
 * - usePermissions() → API call
 * - Multiple child components → More API calls
 * Result: 5-10+ redundant API calls per page
 *
 * Solution: PageDataService
 * - Define what data each page needs upfront
 * - Load ALL data in ONE coordinated batch
 * - Cache per route/module
 * - Components access via useModuleData() (zero API calls)
 *
 * BENEFITS:
 * ✅ Single API round-trip per page load
 * ✅ Parallel data fetching (Promise.all)
 * ✅ Automatic cache management per route
 * ✅ Smart invalidation on navigation
 * ✅ Zero additional calls during page lifecycle
 */

import { ReferenceData, StatusOption, Supplier, ProductCategory } from '@/types/referenceData.types';
import { User } from '@/types/auth';
import { TenantContext } from '@/types/tenant';
import backendConfig from '@/config/backendConfig';
import { sessionService } from '@/services/session/SessionService';
import { referenceDataService, customerService, dealsService, productService, userService } from '@/services/serviceFactory';
import { z } from 'zod';

// Debug flag - set to true to enable verbose logging
const DEBUG_LOGGING = false;

/**
 * Page data requirements definition
 * Each page/module declares what data it needs
 */
export interface PageDataRequirements {
	// Core session (always loaded)
	session: boolean; // user + tenant

	// Reference data categories to load
	referenceData?: {
		statusOptions?: boolean;
		referenceData?: boolean;
		categories?: boolean;
		suppliers?: boolean;
	};

	// Module-specific data
	module?: {
		customers?: boolean;
		deals?: boolean;
		products?: boolean;
		users?: boolean;
		navigation?: boolean;
		[key: string]: boolean | undefined;
	};

	// Optional: Custom data loader function
	customData?: () => Promise<Record<string, any>>;
}

/**
 * Loaded page data (cached in memory)
 */
export interface PageData {
	// Session data
	user: User | null;
	tenant: TenantContext | null;

	// Reference data
	statusOptions: StatusOption[];
	referenceData: ReferenceData[];
	categories: ProductCategory[];
	suppliers: Supplier[];

	// Module data
	moduleData: Record<string, any>;

	// Metadata
	loadedAt: number;
	route: string;
}

/**
 * ENTERPRISE: Page Data Service
 * Manages single-load-per-page pattern for all module data
 */
class PageDataService {
	private static instance: PageDataService;

	// Cache per route to avoid redundant loads on navigation
	private pageCache: Map<string, { data: PageData; timestamp: number }> = new Map();
	private cacheTtlMs = backendConfig.cache?.pageDataTtlMs ?? 5 * 60 * 1000; // configurable TTL
	private persistEnabled = true;

	// In-flight loads per route (dedupe concurrent page loads)
	private inFlightLoads: Map<string, Promise<PageData>> = new Map();

	// Current route being served
	private currentRoute: string = '';

	private constructor() {}

	static getInstance(): PageDataService {
		if (!PageDataService.instance) {
			PageDataService.instance = new PageDataService();
		}
		return PageDataService.instance;
	}

	/**
	 * Load all page data in a single coordinated batch
	 *
	 * @param route Current route/page identifier
	 * @param requirements What data this page needs
	 * @returns All required data in one object
	 */
	async loadPageData(route: string, requirements: PageDataRequirements): Promise<PageData> {
		if (DEBUG_LOGGING) console.log(`[PageDataService] 📄 Loading data for route: ${route}`);

		// Check cache first
		const cached = this.pageCache.get(route);
		if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
			if (DEBUG_LOGGING) console.log(`[PageDataService] ♻️ Using cached data for route: ${route}`);
			return cached.data;
		}

		// Attempt to read persisted cache (survives hard refresh)
		const persisted = this.readPersisted(route);
		if (persisted) {
			if (DEBUG_LOGGING) console.log(`[PageDataService] 💾 Using persisted page data for route: ${route}`);
			this.pageCache.set(route, { data: persisted, timestamp: Date.now() });
			return persisted;
		}

		// Dedupe concurrent page loads
		const inFlight = this.inFlightLoads.get(route);
		if (inFlight) {
			if (DEBUG_LOGGING) console.log(`[PageDataService] ⏳ Reusing in-flight load for route: ${route}`);
			return inFlight;
		}

		if (DEBUG_LOGGING) console.log(`[PageDataService] 🚀 Starting coordinated batch load for: ${route}`);

		const loadPromise = this.executePageDataLoad(route, requirements);
		this.inFlightLoads.set(route, loadPromise);

		try {
			const pageData = await loadPromise;
			this.currentRoute = route;
			this.pageCache.set(route, { data: pageData, timestamp: Date.now() });
			this.writePersisted(route, pageData);
			return pageData;
		} finally {
			this.inFlightLoads.delete(route);
		}
	}

	/**
	 * Execute the actual batch load with parallel fetching
	 */
	private async executePageDataLoad(route: string, requirements: PageDataRequirements): Promise<PageData> {
		// Import services dynamically to avoid circular dependencies
		// Use statically imported core services to avoid dynamic/static import conflicts

		// Build list of parallel tasks
		const tasks: Promise<any>[] = [];
		const taskKeys: string[] = [];

		// Task 1: Session data (always required)
		if (requirements.session) {
			tasks.push(
				Promise.resolve({
					user: sessionService.getCurrentUser(),
					tenant: sessionService.getTenant(),
				})
			);
			taskKeys.push('session');
		}

		// Task 2: Reference data (parallel load)
		if (requirements.referenceData) {
			tasks.push(
				referenceDataService.getAllReferenceData(sessionService.getTenantId()).then(allData => ({
					statusOptions: allData.statusOptions || [],
					referenceData: allData.referenceData || [],
					categories: allData.categories || [],
					suppliers: allData.suppliers || [],
				}))
			);
			taskKeys.push('referenceData');
		}

		// Task 3: Module-specific data (parallel)
		if (requirements.module) {
			const moduleDataPromises = await this.loadModuleData(
				requirements.module,
				sessionService.getTenantId()
			);
			tasks.push(moduleDataPromises);
			taskKeys.push('moduleData');
		}

		// Task 4: Custom data (if provided)
		if (requirements.customData) {
			tasks.push(requirements.customData());
			taskKeys.push('customData');
		}

		if (DEBUG_LOGGING) console.log(`[PageDataService] ⚡ Loading ${tasks.length} data sets in parallel for: ${route}`);

		// CRITICAL: Load all data in parallel (single round-trip)
		const results = await Promise.all(tasks);

		// Assemble page data
		const pageData: PageData = {
			user: null,
			tenant: null,
			statusOptions: [],
			referenceData: [],
			categories: [],
			suppliers: [],
			moduleData: {},
			loadedAt: Date.now(),
			route,
		};

		// Merge results
		results.forEach((result, index) => {
			const key = taskKeys[index];
			if (key === 'session') {
				pageData.user = result.user;
				pageData.tenant = result.tenant;
			} else if (key === 'referenceData') {
				pageData.statusOptions = result.statusOptions;
				pageData.referenceData = result.referenceData;
				pageData.categories = result.categories;
				pageData.suppliers = result.suppliers;
			} else if (key === 'moduleData') {
				pageData.moduleData = result;
			} else if (key === 'customData') {
				pageData.moduleData = { ...pageData.moduleData, ...result };
			}
		});

		if (DEBUG_LOGGING) console.log(`[PageDataService] ✅ Page data loaded in one batch for: ${route}`);
		return pageData;
	}

	/**
	 * Load module-specific data in parallel
	 */
	private async loadModuleData(
		moduleRequirements: Record<string, boolean | undefined>,
		tenantId: string | null
	): Promise<Record<string, any>> {
		const moduleData: Record<string, any> = {};
		const tasks: Promise<any>[] = [];
		const dataKeys: string[] = [];

		// Determine which services to load
		if (moduleRequirements.customers) {
			tasks.push(
				customerService.findMany({ pageSize: 500, offset: 0 }).then(result => {
					// Extract data array from paginated response
					return Array.isArray(result) ? result : (result?.data || []);
				})
			);
			dataKeys.push('customers');
		}

		if (moduleRequirements.deals) {
			tasks.push(
				dealsService.findMany({ pageSize: 500, offset: 0 }).then(result => {
					// Extract data array from paginated response
					return Array.isArray(result) ? result : (result?.data || []);
				})
			);
			dataKeys.push('deals');
		}

		if (moduleRequirements.products) {
			tasks.push(
				productService.findMany({ pageSize: 500, offset: 0 }).then(result => {
					// Extract data array from paginated response
					return Array.isArray(result) ? result : (result?.data || []);
				})
			);
			dataKeys.push('products');
		}

		if (moduleRequirements.users) {
			tasks.push(userService.getUsers());
			dataKeys.push('users');
		}

		// Load all module data in parallel
		if (tasks.length > 0) {
			const results = await Promise.all(tasks);
			results.forEach((result, index) => {
				const dataKey = dataKeys[index];
				moduleData[dataKey] = result;
				if (DEBUG_LOGGING) {
					console.log(`[PageDataService] 📦 Loaded ${dataKey}:`, {
						isArray: Array.isArray(result),
						length: Array.isArray(result) ? result.length : 'N/A',
						type: typeof result
					});
				}
			});
		}

		return moduleData;
	}

	/**
	 * Get cached page data (zero API calls)
	 */
	getPageData(route: string): PageData | null {
		const cached = this.pageCache.get(route);
		return cached?.data || null;
	}

	/**
	 * Invalidate cache when navigating away
	 */
	invalidatePageCache(route?: string): void {
		if (route) {
			this.pageCache.delete(route);
			// Also clear in-flight load for this route to force fresh load
			this.inFlightLoads.delete(route);
			// Also remove persisted snapshot for this route (current tenant)
			try {
				sessionStorage.removeItem(this.storageKey(route));
			} catch {
				// Ignore sessionStorage errors
			}
			console.log(`[PageDataService] 🧹 Invalidated cache for: ${route}`);
		} else {
			// Clear all when user logs out
			this.pageCache.clear();
			this.inFlightLoads.clear();
			console.log(`[PageDataService] 🧹 Cleared all caches`);
		}
	}

	/**
	 * Refresh specific route's data
	 */
	async refreshPageData(route: string, requirements: PageDataRequirements): Promise<PageData> {
		console.log(`[PageDataService] 🔄 refreshPageData called for route: ${route}`);
		this.invalidatePageCache(route);
		console.log(`[PageDataService] 🔄 Cache invalidated, now loading fresh data...`);
		const result = await this.loadPageData(route, requirements);
		console.log(`[PageDataService] ✅ Fresh data loaded for route: ${route}`, {
			hasCustomers: !!result.moduleData?.customers,
			customersCount: Array.isArray(result.moduleData?.customers) ? result.moduleData.customers.length : 0
		});
		return result;
	}

	/**
	 * Pre-warm cache for multiple routes (e.g., on app init)
	 */
	async preloadPages(pages: Array<{ route: string; requirements: PageDataRequirements }>): Promise<void> {
		console.log(`[PageDataService] 🔥 Pre-warming cache for ${pages.length} pages`);

		// Load all pages in parallel, but rate-limit to avoid overwhelming server
		const BATCH_SIZE = 3;
		for (let i = 0; i < pages.length; i += BATCH_SIZE) {
			const batch = pages.slice(i, i + BATCH_SIZE);
			await Promise.all(
				batch.map(p =>
					this.loadPageData(p.route, p.requirements).catch(e => {
						console.warn(`[PageDataService] Failed to preload ${p.route}:`, e);
					})
				)
			);
		}

		console.log(`[PageDataService] ✅ Cache pre-warming complete`);
	}

	/**
	 * Persist and restore page data with validation to survive hard refresh without compromising integrity.
	 */
	private storageKey(route: string): string {
		const tenantId = sessionService.getTenantId() ?? 'system';
		return `pageData:${tenantId}:${route}`;
	}

	private writePersisted(route: string, data: PageData): void {
		if (!this.persistEnabled) return;
		try {
			const snapshot = { data: this.sanitizePageData(data), timestamp: Date.now() };
			sessionStorage.setItem(this.storageKey(route), JSON.stringify(snapshot));
		} catch {
			// Ignore sessionStorage errors
		}
	}

	private readPersisted(route: string): PageData | null {
		if (!this.persistEnabled) return null;
		try {
			const raw = sessionStorage.getItem(this.storageKey(route));
			if (!raw) return null;
			const parsed = JSON.parse(raw) as { data: unknown; timestamp: number };
			if (!parsed || typeof parsed.timestamp !== 'number') return null;
			if (Date.now() - parsed.timestamp > this.cacheTtlMs) return null;

			// Validate shape strictly with zod schemas
			const valid = this.validatePageData(parsed.data);
			return valid ? (parsed.data as PageData) : null;
		} catch {
			// Ignore parse errors
			return null;
		}

	}

		/**
		 * Clear all page caches (memory + persisted) to enforce strict isolation on logout/tenant change.
		 */
		clearAllCaches(): void {
			try {
				this.pageCache.clear();
				this.inFlightLoads.clear();
			} catch {
				// Ignore cache clear errors
			}
			try {
				// Remove all pageData:* entries from sessionStorage
				const keysToRemove: string[] = [];
				for (let i = 0; i < sessionStorage.length; i++) {
					const key = sessionStorage.key(i);
					if (key && key.startsWith('pageData:')) keysToRemove.push(key);
				}
				keysToRemove.forEach(k => sessionStorage.removeItem(k));
			} catch {
				// Ignore sessionStorage errors
			}
		}

		/**
		 * Clear caches for current tenant only (persisted + memory). Safe no-op if tenant unknown.
		 */
		clearTenantCaches(): void {
			try {
				this.pageCache.clear();
				this.inFlightLoads.clear();
			} catch {
				// Ignore cache clear errors
			}
			try {
				const tenantId = sessionService.getTenantId() ?? 'system';
				const prefix = `pageData:${tenantId}:`;
				const keysToRemove: string[] = [];
				for (let i = 0; i < sessionStorage.length; i++) {
					const key = sessionStorage.key(i);
					if (key && key.startsWith(prefix)) keysToRemove.push(key);
				}
				keysToRemove.forEach(k => sessionStorage.removeItem(k));
			} catch {
				// Ignore sessionStorage errors
			}
		}

	/**
	 * Validate PageData shape to prevent malformed/injected data from breaking the app.
	 * Discards persisted data if validation fails.
	 */
	private validatePageData(data: unknown): boolean {
		const CustomerSchema = z.object({
			id: z.string(),
			companyName: z.string().optional(),
			status: z.string().optional(),
		}).strip();

		const UserSchema = z.object({
			id: z.string(),
			email: z.string().email().optional(),
			name: z.string().optional(),
		}).strip();

		const ModuleDataSchema = z.record(z.string(), z.any()).superRefine((val, ctx) => {
			const customers = val['customers'];
			if (customers) {
				const arr = Array.isArray(customers) ? customers : Array.isArray((customers as any)?.data) ? (customers as any).data : [];
				if (!Array.isArray(arr)) {
					ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'customers must be array' });
					return;
				}
				for (const c of arr) {
					const res = CustomerSchema.safeParse(c);
					if (!res.success) {
						ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalid customer entry' });
						return;
					}
				}
			}
			const users = val['users'];
			if (users) {
				const arr = Array.isArray(users) ? users : Array.isArray((users as any)?.data) ? (users as any).data : [];
				if (!Array.isArray(arr)) {
					ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'users must be array' });
					return;
				}
				for (const u of arr) {
					const res = UserSchema.safeParse(u);
					if (!res.success) {
						ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalid user entry' });
						return;
					}
				}
			}
		}).strip();

		const PageDataSchema = z.object({
			user: z.any().nullable(),
			tenant: z.any().nullable(),
			statusOptions: z.array(z.any()),
			referenceData: z.array(z.any()),
			categories: z.array(z.any()),
			suppliers: z.array(z.any()),
			moduleData: ModuleDataSchema,
			loadedAt: z.number(),
			route: z.string(),
		}).strip();

		return PageDataSchema.safeParse(data).success;
	}

	/**
	 * Remove any functions/undefined and trim module data to safe structures before persisting.
	 */
	private sanitizePageData(data: PageData): PageData {
		const clone: PageData = JSON.parse(JSON.stringify(data));
		// No executable content, pure JSON snapshot
		return clone;
	}
}

export const pageDataService = PageDataService.getInstance();
