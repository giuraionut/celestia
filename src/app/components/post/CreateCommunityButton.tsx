'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { LoginDialog } from '../shared/LoginDialog';
import { PlusCircleIcon } from 'lucide-react';

/**
 * A button that either navigates to the create community page for logged in users,
 * or opens a login modal for unauthenticated users.
 */
const CreateCommunityButton = () => {
  const { data: session } = useSession();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!session) {
      e.preventDefault();
      setIsLoginModalOpen(true);
    }
  };

  return (
    <>
      <Link
        href='/community/create'
        onClick={handleClick}
        className='flex flex-row gap-1 items-center hover:bg-primary/30 p-2 rounded-lg transition-colors'
      >
        <PlusCircleIcon className='h-4 w-4' />

        <span className='text-xs font-bold'>Community</span>
      </Link>
      <LoginDialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </>
  );
};

export default CreateCommunityButton;
