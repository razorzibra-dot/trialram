/**
 * useConfigurationTests Hook
 * Custom hook for managing configuration test operations
 */

import { useState, useCallback } from 'react';
import { configTestService } from '../services/configTestService';
import {
  EmailTestConfig,
  SMSTestConfig,
  PaymentTestConfig,
  APITestConfig,
  ConfigTestResult,
  ConfigTestHistory,
} from '../types/configTest';

export const useConfigurationTests = (options: Record<string, never> = {}) => {
  const [result, setResult] = useState<ConfigTestResult | null>(null);
  const [history, setHistory] = useState<ConfigTestHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const testEmail = useCallback(async (config: EmailTestConfig) => {
    try {
      setIsLoading(true);
      setActiveTest('email');
      setError(null);
      const testResult = await configTestService.testEmail(config);
      setResult(testResult);
      setHistory(configTestService.getTestHistory());
      return testResult;
    } catch (err: any) {
      const testResult = err as ConfigTestResult;
      const error = new Error(testResult.message);
      setError(error);
      setResult(testResult);
      setHistory(configTestService.getTestHistory());
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testSMS = useCallback(async (config: SMSTestConfig) => {
    try {
      setIsLoading(true);
      setActiveTest('sms');
      setError(null);
      const testResult = await configTestService.testSMS(config);
      setResult(testResult);
      setHistory(configTestService.getTestHistory());
      return testResult;
    } catch (err: any) {
      const testResult = err as ConfigTestResult;
      const error = new Error(testResult.message);
      setError(error);
      setResult(testResult);
      setHistory(configTestService.getTestHistory());
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testPaymentGateway = useCallback(async (config: PaymentTestConfig) => {
    try {
      setIsLoading(true);
      setActiveTest('payment');
      setError(null);
      const testResult = await configTestService.testPaymentGateway(config);
      setResult(testResult);
      setHistory(configTestService.getTestHistory());
      return testResult;
    } catch (err: any) {
      const testResult = err as ConfigTestResult;
      const error = new Error(testResult.message);
      setError(error);
      setResult(testResult);
      setHistory(configTestService.getTestHistory());
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testAPI = useCallback(async (config: APITestConfig) => {
    try {
      setIsLoading(true);
      setActiveTest('api');
      setError(null);
      const testResult = await configTestService.testAPI(config);
      setResult(testResult);
      setHistory(configTestService.getTestHistory());
      return testResult;
    } catch (err: any) {
      const testResult = err as ConfigTestResult;
      const error = new Error(testResult.message);
      setError(error);
      setResult(testResult);
      setHistory(configTestService.getTestHistory());
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    configTestService.clearTestHistory();
    setHistory([]);
  }, []);

  return {
    result,
    history,
    isLoading,
    activeTest,
    error,
    testEmail,
    testSMS,
    testPaymentGateway,
    testAPI,
    clearHistory,
  };
};