'use client';

import React, { useState } from 'react';
import { joinCommunity, leaveCommunity } from '@/actions/communityActions';
import { Button } from '@/components/ui/button';
import { LoginDialog } from '../shared/LoginDialog';
import { toast } from 'sonner'; // Import Sonner toast

const JoinCommunityButton = ({
  communityId,
  isMemberOfCommunity,
  userId
}: {
  communityId: string;
  isMemberOfCommunity: boolean;
  userId: string | null;
}) => {
  const [isMember, setIsMember] = useState(isMemberOfCommunity);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleClick = async () => {
    if (!userId) {
      setIsLoginModalOpen(true);
      return;
    }

    const toastId = toast.loading(isMember ? 'Leaving community...' : 'Joining community...');
    setIsLoading(true);

    try {
      if (isMember) {
        await leaveCommunity(communityId);
        setIsMember(false);
        toast.success('You have left the community.', { id: toastId });
      } else {
        await joinCommunity(communityId);
        setIsMember(true);
        toast.success('You have joined the community!', { id: toastId });
      }
    } catch (error) {
      console.error('Action failed:', error);
      toast.error('Something went wrong. Please try again.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleClick} disabled={isLoading} className='w-fit cursor-pointer'>
        {isLoading ? 'Processing...' : isMember ? 'Leave' : 'Join'}
      </Button>
      <LoginDialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </>
  );
};

export default JoinCommunityButton;
