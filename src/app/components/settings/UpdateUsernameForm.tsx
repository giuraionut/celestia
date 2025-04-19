// src/app/settings/UpdateUsernameForm.tsx
'use client';

import React, { useTransition, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateUserProfile } from '@/actions/authActions';
import { useSession } from 'next-auth/react';
import { User } from '@prisma/client';
import { useRouter } from 'next/navigation';
// Import YOUR action

type UpdateUsernameFormProps = {
  userId: string; // Pass userId from page
  currentUsername: string | null;
};

export default function UpdateUsernameForm({
  currentUsername,
}: UpdateUsernameFormProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const { update: sessionUpdate } = useSession();
  const router = useRouter();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newName = formData.get('name') as string; // Get the name from form

    if (newName === currentUsername) {
      toast.info('Username is the same.');
      return;
    }

    startTransition(async () => {
      const result = await updateUserProfile({ name: newName });

      if (!result?.success) {
        toast.error(result?.message || 'Failed to update username.');
      } else {
        toast.success(result.message);
        console.log("NEW NAME",newName)
        sessionUpdate((data: { user: User }) => ({
          ...data,
          user: { ...data.user, name: newName },
        }));
        router.refresh();
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className='space-y-4'>
      <div className='flex flex-col gap-4'>
        <Label htmlFor='name'>Username</Label>
        <Input
          id='name'
          name='name' // Name matches form data key
          type='text'
          defaultValue={currentUsername ?? ''}
          placeholder='Your unique username'
          required
          minLength={3}
          maxLength={30}
          pattern='^[a-zA-Z0-9_]+$'
          title='Username can only contain letters, numbers, and underscores'
          disabled={isPending}
        />
        <p className='text-xs text-muted-foreground mt-1'>
          Must be 3-30 characters. Letters, numbers, and underscores only.
        </p>
      </div>
      <Button type='submit' disabled={isPending}>
        {isPending ? 'Saving...' : 'Save Username'}
      </Button>
    </form>
  );
}
