import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { sessionManager } from '@/utils/sessionManager';

interface SessionExpiryWarningModalProps {
  isOpen: boolean;
  timeRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
}

/**
 * SessionExpiryWarningModal
 * 
 * Enterprise-level session expiry warning modal that displays:
 * - Idle timeout warning with countdown timer
 * - Time remaining before auto-logout
 * - Options to extend session or logout
 * - Prevents accidental session loss
 */
export const SessionExpiryWarningModal: React.FC<SessionExpiryWarningModalProps> = ({
  isOpen,
  timeRemaining: initialTimeRemaining,
  onExtend,
  onLogout,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);

  // Update timer every second
  useEffect(() => {
    if (!isOpen || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(timer);
          onLogout();
        }
        return Math.max(0, newTime);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeRemaining, onLogout]);

  // Update time when prop changes
  useEffect(() => {
    setTimeRemaining(initialTimeRemaining);
  }, [initialTimeRemaining]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExtend = () => {
    sessionManager.extendSession();
    onExtend();
  };

  const handleLogout = () => {
    onLogout();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <DialogTitle className="text-yellow-700">Session Timeout Warning</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600">
            Your session is about to expire due to inactivity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Message */}
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
            <p className="text-sm text-yellow-800">
              You have been inactive for a while. Your session will expire in:
            </p>
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-red-500 animate-pulse" />
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600 font-mono">
                  {formatTime(timeRemaining)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {timeRemaining > 60 
                    ? `${Math.floor(timeRemaining / 60)} minute${Math.floor(timeRemaining / 60) !== 1 ? 's' : ''}`
                    : `${timeRemaining} second${timeRemaining !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Info Message */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs text-blue-800">
              Click &quot;Continue Working&quot; to extend your session and stay logged in. 
              Otherwise, you will be automatically logged out.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex-1"
          >
            Logout Now
          </Button>
          <Button
            onClick={handleExtend}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Continue Working
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionExpiryWarningModal;