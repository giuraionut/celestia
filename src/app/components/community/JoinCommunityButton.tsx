'use client';

import React, { useState, startTransition, useOptimistic } from 'react';
import { joinCommunity, leaveCommunity } from '@/actions/communityActions';
import { Button } from '@/components/ui/button';
import { LoginDialog } from '../shared/LoginDialog';
import { useAuth } from '@/app/hooks/useAuth';

interface MembershipState {
  isMember: boolean;
}

type MembershipAction = { type: 'TOGGLE_MEMBERSHIP' };

const membershipReducer = (
  state: MembershipState,
  action: MembershipAction
): MembershipState => {
  switch (action.type) {
    case 'TOGGLE_MEMBERSHIP':
      return { isMember: !state.isMember };
    default:
      return state;
  }
};

const JoinCommunityButton = ({
  communityId,
  isMemberOfCommunity,
}: {
  communityId: string;
  isMemberOfCommunity: boolean;
}) => {
  const [optimisticMembership, setOptimisticMembership] = useOptimistic(
    { isMember: isMemberOfCommunity },
    membershipReducer
  );

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isLoggedIn } = useAuth();
  const handleClick = async () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    try {
      startTransition(() => {
        setOptimisticMembership({ type: 'TOGGLE_MEMBERSHIP' });
      });

      if (optimisticMembership.isMember) {
        await leaveCommunity(communityId);
      } else {
        await joinCommunity(communityId);
      }
    } catch (error) {
      console.log('Action failed:', error);
    }
  };

  return (
    <>
      <Button onClick={handleClick} className='w-fit cursor-pointer'>
        {optimisticMembership.isMember ? 'Leave' : 'Join'}
      </Button>
      <LoginDialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </>
  );
};

export default JoinCommunityButton;
