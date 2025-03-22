'use client';

import { PlusCircleIcon } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { LoginDialog } from '../shared/LoginDialog';

/**
 * A button that either navigates to the create post page for logged in users,
 * or opens a login modal for unauthenticated users.
 */
const CreatePostButton = () => {
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
        href="/post/create"
        onClick={handleClick}
        className="flex flex-row gap-1 items-center hover:bg-primary/30 p-2 rounded transition-colors"
      >
        <PlusCircleIcon className="h-4 w-4" />
        <span className="text-xs font-bold">Post</span>
      </Link>
      <LoginDialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </>
  );
};

export default CreatePostButton;
