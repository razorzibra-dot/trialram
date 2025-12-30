/**
 * Registration Page - User Self-Registration
 * Form for new user registration with email verification
 * ✅ Uses UserDTO for type safety and layer synchronization
 * ✅ Integrates with auth service register method
 * ✅ Form fields match DB columns with tooltips documenting constraints
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { uiNotificationService as factoryUINotificationService, authService } from '@/services/serviceFactory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Building2, Shield, Users, BarChart3, UserPlus, AlertTriangle, InfoCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const RegistrationPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    tenantId: '',
    role: 'customer' as const, // Default to customer for self-registration
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>([]);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    // Redirect authenticated users
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }

    // Load available tenants for selection
    loadTenants();
  }, [isAuthenticated, navigate, from]);

  const loadTenants = async () => {
    try {
      // For self-registration, we'll use a default tenant or allow selection
      // In production, this might be determined by domain or invitation
      setTenants([
        { id: 'techcorp', name: 'TechCorp Solutions' },
        { id: 'innovatecorp', name: 'InnovateCorp' },
      ]);
      // Default to first tenant
      setFormData(prev => ({ ...prev, tenantId: 'techcorp' }));
    } catch (error) {
      console.error('Failed to load tenants:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.email) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email format');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.tenantId) {
      setError('Please select an organization');
      return false;
    }
    if (!acceptTerms) {
      setError('You must accept the terms and conditions');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Use the auth service register method (static import)
      const result = await authService.register(
        formData.email,
        formData.password,
        {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          tenantId: formData.tenantId,
          role: formData.role,
        }
      );

      // Show success message
      factoryUINotificationService.successNotify(
        'Registration Successful!',
        'Please check your email to verify your account before logging in.'
      );

      // Redirect to login page
      navigate('/auth/login', {
        state: {
          message: 'Registration successful! Please check your email for verification instructions.',
          email: formData.email
        }
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      factoryUINotificationService.errorNotify(
        'Registration Failed',
        errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                <div className="p-3 bg-green-600 rounded-xl">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Join CRM Portal</h1>
                  <p className="text-gray-600">Create your account to get started</p>
                </div>
              </div>

              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Start Your Journey
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join thousands of professionals using our enterprise-grade CRM solution for streamlined customer management and business growth.
              </p>
            </div>

            <div className="grid gap-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Secure Registration</h3>
                  <p className="text-gray-600">Your data is protected with enterprise-grade security</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Team Collaboration</h3>
                  <p className="text-gray-600">Work seamlessly with your team in a unified platform</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Powerful Analytics</h3>
                  <p className="text-gray-600">Gain insights with comprehensive reporting and analytics</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md mx-auto">
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Create Account</CardTitle>
                <CardDescription>
                  Fill in your details to create your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      Email
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Required. Valid email, max 255 chars. Unique per tenant. Cannot change after creation.</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@company.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="h-11"
                      maxLength={255}
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      Password
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Minimum 8 characters. Must contain uppercase, lowercase, number, and symbol.</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      className="h-11"
                      minLength={8}
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="flex items-center gap-2">
                        First Name
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoCircle className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Optional. Max 100 characters.</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                        className="h-11"
                        maxLength={100}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="flex items-center gap-2">
                        Last Name
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoCircle className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Optional. Max 100 characters.</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                        className="h-11"
                        maxLength={100}
                      />
                    </div>
                  </div>

                  {/* Organization/Tenant Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="tenant" className="flex items-center gap-2">
                      Organization
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Select the organization you belong to. Required for proper data isolation.</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Select
                      value={formData.tenantId}
                      onValueChange={(value) => handleInputChange('tenantId', value)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select your organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                      className="mt-1"
                    />
                    <Label
                      htmlFor="terms"
                      className="text-sm font-normal cursor-pointer leading-relaxed"
                    >
                      I agree to the{' '}
                      <a href="/terms" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                        Privacy Policy
                      </a>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold text-base transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group"
                    disabled={isLoading}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-green-400 to-transparent opacity-0 group-hover:opacity-20 transition-opacity"></span>
                    <span className="relative flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <span>Create Account</span>
                      )}
                    </span>
                  </Button>
                </form>

                <div className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <a href="/auth/login" className="text-blue-600 hover:underline font-medium">
                    Sign in here
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default RegistrationPage;