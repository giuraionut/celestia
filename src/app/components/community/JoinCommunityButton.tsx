'use client';
import { joinCommunity, leaveCommunity } from '@/actions/communityActions';
import { Button } from '@/components/ui/button';
import React, { startTransition, useOptimistic } from 'react';

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
  // Initialize optimistic membership state with the value passed from the server.
  const [optimisticMembership, setOptimisticMembership] = useOptimistic(
    { isMember: isMemberOfCommunity },
    membershipReducer
  );

  const handleClick = async () => {
    // Optimistically toggle membership state.
    startTransition(() => {
      setOptimisticMembership({ type: 'TOGGLE_MEMBERSHIP' });
    });
    
    // Based on the optimistic state, call the appropriate server action.
    if (optimisticMembership.isMember) {
      // If the user was a member, they are leaving.
      await leaveCommunity(communityId);
    } else {
      // If the user was not a member, they are joining.
      await joinCommunity(communityId);
    }
  };

  return (
    <Button onClick={handleClick} className="w-fit cursor-pointer">
      {optimisticMembership.isMember ? 'Leave' : 'Join'}
    </Button>
  );
};

export default JoinCommunityButton;
