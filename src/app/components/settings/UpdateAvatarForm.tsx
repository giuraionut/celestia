// src/app/settings/UpdateAvatarForm.tsx
'use client';

import React, { useState, useTransition, useRef } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateUserProfile } from '@/actions/authActions';
import { useRouter } from 'next/navigation';

type UpdateAvatarFormProps = {
  currentImageUrl: string | null;
  username: string | null;
};

export default function UpdateAvatarForm({
  currentImageUrl,
  username,
}: UpdateAvatarFormProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newImage = formData.get('imageUrl') as string;
    startTransition(async () => {
      const result = await updateUserProfile({ image: newImage });
      if (!result?.success) {
        toast.error(result?.message || 'Failed to update avatar.');
      } else {
        toast.success(result.message);
        formRef.current?.reset();
        router.refresh();
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className='space-y-4'>
      <div className='flex items-center gap-4'>
        <Avatar className='h-16 w-16'>
          <AvatarImage
            src={currentImageUrl ?? undefined}
            alt={username ?? 'User'}
            key={currentImageUrl} /* Add key to force re-render on change */
          />
          <AvatarFallback>
            {username ? username[0].toUpperCase() : 'U'}
          </AvatarFallback>
        </Avatar>
        <p className='text-sm text-muted-foreground'>
          Current avatar. Enter a URL to change it.
          <br />
          <span className='text-xs'>(Direct image uploads coming soon!)</span>
        </p>
      </div>
      <div className='flex flex-col gap-4'>
        <Label htmlFor='imageUrl'>Avatar Image URL</Label>
        <Input
          id='imageUrl'
          name='imageUrl'
          type='url'
          defaultValue={currentImageUrl ?? ''}
          placeholder='https://example.com/avatar.png'
          disabled={isPending}
        />
      </div>
      <Button type='submit' disabled={isPending}>
        {isPending ? 'Saving...' : 'Save Avatar'}
      </Button>
    </form>
  );
}
