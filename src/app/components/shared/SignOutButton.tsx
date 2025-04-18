'use client';
import React, { PropsWithChildren } from 'react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

export default function SignOutButton({
  className,
  children,
}: { className?: string } & PropsWithChildren) {
  return (
    <div onClick={() => signOut()} className={cn(``, className)}>
      Logout {children && <span>{children}</span>}
    </div>
  );
}
