'use client'

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onBack: () => void;
}

export function OTPModal({ isOpen, onClose, email, onBack }: OTPModalProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { verifyOTP, signIn } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0 && isOpen) {
      interval = setInterval(() => {
        setResendTimer((prev) => Math.max(prev - 1, 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer, isOpen]);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current.forEach((ref, index) => {
        if (ref) ref.value = newOtp[index];
      });
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value !== '' && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      if (index === 5 && value !== '') {
        handleVerifyOTP(newOtp.join(''));
      }
    }
  };

  const handleVerifyOTP = async (otpString: string) => {
    if (isVerifying) return;
    setIsVerifying(true);

    try {
      const data = await verifyOTP(email, otpString);
      if (data.user) {
        toast({
          title: 'Success',
          description: "You've successfully signed in!",
        });
        onClose();
        router.push('/dashboard');
      } else {
        throw new Error('Verification failed: No user data returned.');
      }
    } catch (error: any) {
      console.error('OTP Verification Error:', error);
      const errorMessage = error.message || 'OTP verification failed. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      if (error.message?.includes('expired')) {
        setResendTimer(0);
      }

      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await signIn(email);
      setResendTimer(60);
      toast({
        title: 'Passcode Resent',
        description: 'A new passcode has been sent to your email.',
      });
      setOtp(['', '', '', '', '', '']);
    } catch (error) {
      console.error('Resend OTP Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend passcode. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter One-Time Passcode</DialogTitle>
        </DialogHeader>
        <p className="mb-2">Passcode sent to {email}</p>
        <p className="mb-4">Enter the passcode we sent to your email.</p>
        <div className="flex justify-between mb-4">
          {otp.map((digit, index) => (
            <Input
              key={index}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onPaste={handlePaste}
              ref={(el) => (inputRefs.current[index] = el)}
              className="w-12 h-12 text-center text-2xl"
            />
          ))}
        </div>
        <div className="flex justify-between items-center mt-4">
          <div>
            <Button variant="link" onClick={onBack} className="p-0">
              Back
            </Button>
            <Button
              variant="link"
              onClick={handleResendOTP}
              disabled={resendTimer > 0}
              className="p-0 ml-4"
            >
              Resend passcode {resendTimer > 0 ? `(${resendTimer}s)` : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
