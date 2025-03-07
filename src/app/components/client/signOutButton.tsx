'use client';
import React from 'react';
import { Button } from '../../../components/ui/button';
import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return <Button onClick={() => signOut()}>Logout</Button>;
}
