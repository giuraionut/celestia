'use client';
import React from 'react';
import { Button } from '../../../components/ui/button';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

export default function SignOutButton({
  variant,
  className,
}: {
  variant?:
    | 'link'
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | null
    | undefined;
  className?: string;
}) {
  return (
    <Button
      variant={variant}
      onClick={() => signOut()}
      className={cn(``, className)}
    >
      Logout
    </Button>
  );
}
