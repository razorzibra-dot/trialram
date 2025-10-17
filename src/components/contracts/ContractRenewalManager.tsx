import React, { useState, useEffect } from 'react';
import { Contract, RenewalReminder } from '@/types/contracts';
import { contractService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  RefreshCw,
  Calendar,
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Send,
  Settings
} from 'lucide-react';

interface ContractRenewalManagerProps {
  contract: Contract;
  onRenewalUpdate?: () => void;
}

const ContractRenewalManager: React.FC<ContractRenewalManagerProps> = ({
  contract,
  onRenewalUpdate
}) => {
  const { user, hasPermission } = useAuth();
  const [renewalData, setRenewalData] = useState({
    autoRenew: contract.autoRenew || false,
    renewalPeriodMonths: contract.renewal_period_months || 12,
    renewalTerms: contract.renewalTerms || '',
    nextRenewalDate: contract.next_renewal_date || '',
    reminderDays: contract.reminderDays || [30, 7, 1]
  });
  const [reminders, setReminders] = useState<RenewalReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [renewalForm, setRenewalForm] = useState({
    newEndDate: '',
    newValue: contract.value,
    terms: '',
    notes: ''
  });
  const [reminderForm, setReminderForm] = useState({
    daysBeforeExpiry: 30,
    message: '',
    recipients: [] as string[]
  });

  useEffect(() => {
    loadRenewalReminders();
  }, [contract.id]);

  const loadRenewalReminders = async () => {
    try {
      setLoading(true);
      const data = await contractService.getRenewalReminders(contract.id);
      setReminders(data);
    } catch (error) {
      console.error('Failed to load renewal reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRenewalSettings = async () => {
    try {
      await contractService.updateContract(contract.id, {
        autoRenew: renewalData.autoRenew,
        renewal_period_months: renewalData.renewalPeriodMonths,
        renewalTerms: renewalData.renewalTerms,
        next_renewal_date: renewalData.nextRenewalDate,
        reminderDays: renewalData.reminderDays
      });
      toast.success('Renewal settings updated successfully');
      onRenewalUpdate?.();
    } catch (error) {
      toast.error('Failed to update renewal settings');
    }
  };

  const handleRenewContract = async () => {
    try {
      await contractService.renewContract(contract.id, {
        newEndDate: renewalForm.newEndDate,
        newValue: renewalForm.newValue,
        terms: renewalForm.terms,
        notes: renewalForm.notes
      });
      toast.success('Contract renewed successfully');
      setShowRenewalModal(false);
      setRenewalForm({ newEndDate: '', newValue: contract.value, terms: '', notes: '' });
      onRenewalUpdate?.();
    } catch (error) {
      toast.error('Failed to renew contract');
    }
  };

  const handleCreateReminder = async () => {
    try {
      await contractService.createRenewalReminder(contract.id, {
        daysBeforeExpiry: reminderForm.daysBeforeExpiry,
        message: reminderForm.message,
        recipients: reminderForm.recipients
      });
      toast.success('Renewal reminder created successfully');
      setShowReminderModal(false);
      setReminderForm({ daysBeforeExpiry: 30, message: '', recipients: [] });
      loadRenewalReminders();
    } catch (error) {
      toast.error('Failed to create renewal reminder');
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      await contractService.deleteRenewalReminder(reminderId);
      toast.success('Reminder deleted successfully');
      loadRenewalReminders();
    } catch (error) {
      toast.error('Failed to delete reminder');
    }
  };

  const getDaysUntilExpiry = () => {
    const endDate = new Date(contract.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getRenewalStatus = () => {
    const daysUntilExpiry = getDaysUntilExpiry();
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'destructive', message: 'Contract has expired' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'urgent', color: 'destructive', message: 'Renewal required soon' };
    } else if (daysUntilExpiry <= 90) {
      return { status: 'upcoming', color: 'secondary', message: 'Renewal approaching' };
    } else {
      return { status: 'active', color: 'default', message: 'Contract active' };
    }
  };

  const calculateNextRenewalDate = () => {
    if (!renewalData.renewalPeriodMonths) return '';
    
    const currentEndDate = new Date(contract.end_date);
    const nextRenewalDate = new Date(currentEndDate);
    nextRenewalDate.setMonth(nextRenewalDate.getMonth() + renewalData.renewalPeriodMonths);
    
    return nextRenewalDate.toISOString().split('T')[0];
  };

  const canManageRenewal = hasPermission('manage_contracts');
  const renewalStatus = getRenewalStatus();
  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Contract Renewal Management
          </CardTitle>
          <CardDescription>
            Manage contract renewal settings and reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Renewal Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Days Until Expiry</p>
                  <p className={`text-2xl font-bold ${daysUntilExpiry <= 30 ? 'text-red-600' : 'text-green-600'}`}>
                    {daysUntilExpiry > 0 ? daysUntilExpiry : 'Expired'}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Auto Renewal</p>
                  <p className="text-2xl font-bold">
                    {renewalData.autoRenew ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <RefreshCw className={`h-8 w-8 ${renewalData.autoRenew ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Reminders</p>
                  <p className="text-2xl font-bold">{reminders.length}</p>
                </div>
                <Bell className="h-8 w-8 text-yellow-600" />
              </div>
            </Card>
          </div>

          {/* Renewal Status Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  <Badge variant={renewalStatus.color as 'default' | 'secondary' | 'destructive' | 'outline'} className="mr-2">
                    {renewalStatus.status.toUpperCase()}
                  </Badge>
                  {renewalStatus.message}
                </span>
                {canManageRenewal && daysUntilExpiry <= 90 && (
                  <Button size="sm" onClick={() => setShowRenewalModal(true)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Renew Now
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Renewal Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Renewal Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Auto Renewal</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={renewalData.autoRenew}
                    onCheckedChange={(checked) => setRenewalData(prev => ({ ...prev, autoRenew: checked }))}
                    disabled={!canManageRenewal}
                  />
                  <span className="text-sm text-muted-foreground">
                    {renewalData.autoRenew ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="renewalPeriod">Renewal Period (Months)</Label>
                <Input
                  id="renewalPeriod"
                  type="number"
                  value={renewalData.renewalPeriodMonths}
                  onChange={(e) => setRenewalData(prev => ({ ...prev, renewalPeriodMonths: parseInt(e.target.value) || 12 }))}
                  disabled={!canManageRenewal}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="renewalTerms">Renewal Terms</Label>
              <Textarea
                id="renewalTerms"
                value={renewalData.renewalTerms}
                onChange={(e) => setRenewalData(prev => ({ ...prev, renewalTerms: e.target.value }))}
                placeholder="Enter renewal terms and conditions"
                rows={3}
                disabled={!canManageRenewal}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextRenewalDate">Next Renewal Date</Label>
              <Input
                id="nextRenewalDate"
                type="date"
                value={renewalData.nextRenewalDate || calculateNextRenewalDate()}
                onChange={(e) => setRenewalData(prev => ({ ...prev, nextRenewalDate: e.target.value }))}
                disabled={!canManageRenewal}
              />
            </div>

            {canManageRenewal && (
              <Button onClick={handleUpdateRenewalSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Update Settings
              </Button>
            )}
          </div>

          {/* Renewal Reminders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Renewal Reminders</h4>
              {canManageRenewal && (
                <Button size="sm" onClick={() => setShowReminderModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reminder
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : reminders.length === 0 ? (
              <Alert>
                <Bell className="h-4 w-4" />
                <AlertDescription>
                  No renewal reminders have been set up for this contract.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Days Before Expiry</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reminders.map((reminder) => (
                      <TableRow key={reminder.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {reminder.daysBeforeExpiry} days
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {reminder.message || 'Default renewal reminder'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {reminder.recipients?.length || 0} recipients
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={reminder.sent ? 'default' : 'secondary'}>
                            {reminder.sent ? 'Sent' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {canManageRenewal && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteReminder(reminder.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Renew Contract Modal */}
      <Dialog open={showRenewalModal} onOpenChange={setShowRenewalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew Contract</DialogTitle>
            <DialogDescription>
              Create a renewal for this contract with updated terms.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newEndDate">New End Date</Label>
                <Input
                  id="newEndDate"
                  type="date"
                  value={renewalForm.newEndDate}
                  onChange={(e) => setRenewalForm(prev => ({ ...prev, newEndDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newValue">New Contract Value</Label>
                <Input
                  id="newValue"
                  type="number"
                  value={renewalForm.newValue}
                  onChange={(e) => setRenewalForm(prev => ({ ...prev, newValue: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms">Updated Terms</Label>
              <Textarea
                id="terms"
                value={renewalForm.terms}
                onChange={(e) => setRenewalForm(prev => ({ ...prev, terms: e.target.value }))}
                placeholder="Enter any updated terms for the renewal"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Renewal Notes</Label>
              <Textarea
                id="notes"
                value={renewalForm.notes}
                onChange={(e) => setRenewalForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add notes about this renewal"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenewalModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenewContract} disabled={!renewalForm.newEndDate}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Renew Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Reminder Modal */}
      <Dialog open={showReminderModal} onOpenChange={setShowReminderModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Renewal Reminder</DialogTitle>
            <DialogDescription>
              Set up a reminder to be sent before the contract expires.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="daysBeforeExpiry">Days Before Expiry</Label>
              <Input
                id="daysBeforeExpiry"
                type="number"
                value={reminderForm.daysBeforeExpiry}
                onChange={(e) => setReminderForm(prev => ({ ...prev, daysBeforeExpiry: parseInt(e.target.value) || 30 }))}
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Custom Message (Optional)</Label>
              <Textarea
                id="message"
                value={reminderForm.message}
                onChange={(e) => setReminderForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter a custom reminder message"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReminderModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReminder}>
              <Bell className="h-4 w-4 mr-2" />
              Create Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractRenewalManager;
