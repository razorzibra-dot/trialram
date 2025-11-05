/**
 * Login Page - Modular Version
 * Enhanced authentication page with modern UI and session management
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { uiNotificationService as factoryUINotificationService } from '@/services/serviceFactory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, Shield, Users, BarChart3, Clock, AlertTriangle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const expired = urlParams.get('expired');
    const reason = urlParams.get('reason');
    
    if (expired === 'true') {
      setSessionExpired(true);
      if (reason === 'timeout') {
        setError('Your session has expired due to inactivity. Please log in again.');
      } else if (reason === 'unauthorized') {
        setError('Your session is no longer valid. Please log in again.');
      } else {
        setError('Your session has expired. Please log in again.');
      }
    }
  }, [location.search]);

  // Redirect authenticated users ONLY if:
  // 1. User is authenticated (isAuthenticated = true)
  // 2. Auth system is NOT loading (isLoading = false) - to avoid race conditions
  // 3. We haven't already started redirecting (to prevent double redirects)
  useEffect(() => {
    if (isAuthenticated && !authLoading && !isRedirecting) {
      console.log('[LoginPage] User already authenticated, redirecting to:', from);
      setIsRedirecting(true);
      // Use a small delay to ensure all state is settled
      const redirectTimer = setTimeout(() => {
        navigate(from, { replace: true });
      }, 50);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, authLoading, isRedirecting, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSessionExpired(false);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      // Show error as toast notification instead of in form
      factoryUINotificationService.errorNotify(
        'Login Failed',
        errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'admin@company.com', role: 'Admin', description: 'Full access to all modules' },
    { email: 'manager@company.com', role: 'Manager', description: 'Manage customers, deals, and tickets' },
    { email: 'agent@company.com', role: 'Agent', description: 'Handle assigned customers and tickets' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">CRM Portal</h1>
                <p className="text-gray-600">Multi-tenant Customer Management</p>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Enterprise-Grade CRM
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Streamline your customer relationships with our comprehensive CRM solution featuring JWT authentication, role-based access control, and modular API architecture.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Secure Authentication</h3>
                <p className="text-gray-600">JWT-based authentication with role-based access control</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Multi-tenant Architecture</h3>
                <p className="text-gray-600">Isolated data and customizable workflows per organization</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Advanced Analytics</h3>
                <p className="text-gray-600">Real-time insights and comprehensive reporting</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {sessionExpired ? 'Session Expired' : 'Welcome Back'}
              </CardTitle>
              <CardDescription>
                {sessionExpired 
                  ? 'Please log in again to continue' 
                  : 'Sign in to access your CRM dashboard'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sessionExpired && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Your session has expired for security reasons
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                {sessionExpired && error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group"
                  disabled={isLoading}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-transparent opacity-0 group-hover:opacity-20 transition-opacity"></span>
                  <span className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </span>
                </Button>
              </form>

              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Demo Accounts
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => {
                        setEmail(account.email);
                        setPassword('password123');
                        setError('');
                        setSessionExpired(false);
                      }}
                      className="w-full p-4 text-left border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group cursor-pointer"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-gray-900 group-hover:text-blue-700">{account.role}</div>
                          <div className="text-xs text-gray-600">{account.email}</div>
                        </div>
                        <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded group-hover:bg-blue-200 whitespace-nowrap">
                          Use Demo
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2 group-hover:text-gray-700">{account.description}</div>
                    </button>
                  ))}
                </div>

                <div className="text-center text-sm text-gray-500">
                  Password for all demo accounts: <code className="bg-gray-100 px-1 rounded">password123</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
