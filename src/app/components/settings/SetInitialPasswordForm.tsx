// src/app/settings/SetInitialPasswordForm.tsx
'use client';

import React, { useTransition, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setPassword } from '@/actions/authActions';
import { useRouter } from 'next/navigation';
// Import YOUR action

type SetInitialPasswordFormProps = {
  userEmail: string | null; // Pass user's email
};

export default function SetInitialPasswordForm({
  userEmail,
}: SetInitialPasswordFormProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userEmail) {
      toast.error('User email not found. Cannot set password.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    startTransition(async () => {
      const result = await setPassword({
        email: userEmail,
        newPassword: newPassword,
      });

      if (!result?.success) {
        toast.error(result?.message || 'Failed to set password.');
      } else {
        toast.success(result.message);
        formRef.current?.reset();
        router.refresh();
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className='space-y-4'>
      <p className='text-sm text-muted-foreground'>
        You logged in using a provider (like Google). Set a password to enable
        logging in with email/username and password.
      </p>
      <div className='flex flex-col gap-4'>
        <Label htmlFor='initNewPassword'>New Password</Label>
        <Input
          id='initNewPassword'
          name='newPassword'
          type='password'
          required
          minLength={8}
          disabled={isPending}
        />
        <p className='text-xs text-muted-foreground mt-1'>
          Must be at least 8 characters long.
        </p>
      </div>
      <div className='flex flex-col gap-4'>
        <Label htmlFor='initConfirmPassword'>Confirm New Password</Label>
        <Input
          id='initConfirmPassword'
          name='confirmPassword'
          type='password'
          required
          minLength={8}
          disabled={isPending}
        />
      </div>
      <Button type='submit' disabled={isPending}>
        {isPending ? 'Setting...' : 'Set Password'}
      </Button>
    </form>
  );
}
