// src/app/settings/UpdatePasswordForm.tsx
'use client';

import React, { useTransition, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setPassword } from '@/actions/authActions';
import { useRouter } from 'next/navigation';
// Import YOUR action

type UpdatePasswordFormProps = {
  userEmail: string | null; // Pass user's email
};

export default function UpdatePasswordForm({
  userEmail,
}: UpdatePasswordFormProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userEmail) {
      toast.error('User email not found. Cannot update password.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Client-side basic validation
    if (!currentPassword) {
      toast.error('Current password is required.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    startTransition(async () => {
      const result = await setPassword({
        email: userEmail,
        currentPassword: currentPassword,
        newPassword: newPassword,
      });

      if (!result?.success) {
        toast.error(result?.message || 'Failed to update password.');
      } else {
        toast.success(result.message);
        formRef.current?.reset();
        router.refresh();
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className='space-y-4'>
      <div className='flex flex-col gap-4'>
        <Label htmlFor='currentPassword'>Current Password</Label>
        <Input
          id='currentPassword'
          name='currentPassword'
          type='password'
          required
          disabled={isPending}
        />
      </div>
      <div className='flex flex-col gap-4'>
        <Label htmlFor='newPassword'>New Password</Label>
        <Input
          id='newPassword'
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
        <Label htmlFor='confirmPassword'>Confirm New Password</Label>
        <Input
          id='confirmPassword'
          name='confirmPassword'
          type='password'
          required
          minLength={8}
          disabled={isPending}
        />
      </div>
      <Button type='submit' disabled={isPending}>
        {isPending ? 'Updating...' : 'Update Password'}
      </Button>
    </form>
  );
}
