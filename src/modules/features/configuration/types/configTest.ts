/**
 * Configuration Test Types
 * Type definitions for configuration testing
 */

export type TestType = 'email' | 'sms' | 'payment' | 'api';
export type TestStatus = 'idle' | 'testing' | 'success' | 'error';

export interface ConfigTestRequest {
  type: TestType;
  params: Record<string, unknown>;
}

export interface ConfigTestResult {
  status: TestStatus;
  message: string;
  details?: string;
  timestamp: string;
  duration?: number; // milliseconds
}

export interface EmailTestConfig {
  recipientEmail: string;
  testMessage?: string;
}

export interface SMSTestConfig {
  phoneNumber: string;
  testMessage?: string;
}

export interface PaymentTestConfig {
  gateway: 'stripe' | 'paypal' | 'razorpay';
}

export interface APITestConfig {
  endpoint: string;
  method?: 'GET' | 'POST';
  timeout?: number;
}

export interface ConfigTestHistory {
  id: string;
  type: TestType;
  status: 'success' | 'error';
  message: string;
  timestamp: string;
}

export interface ConfigTestResponse {
  result: ConfigTestResult;
  history?: ConfigTestHistory[];
}