import { cn } from '@/lib/utils';
import { Community } from '@prisma/client';
import React from 'react';
import Image from 'next/image';
import JoinCommunityButton from './JoinCommunityButton';
import Link from 'next/link';
import { getSessionUserId } from '@/actions/actionUtils';
import CommunityHeader from './CommunityHeader';

const CommunityCard = async ({
  community,
  isMemberOfCommunity,
  content = true,
  footer = true,
  className,
}: {
  community: Community;
  isMemberOfCommunity?: boolean;
  content?: boolean;
  footer?: boolean;
  className?: string;
}) => {
  const userId = await getSessionUserId();
  return (
    <div className={cn(`flex gap-4 flex-col`, className)}>
      <CommunityHeader name={community.name} image={community.image} textSize='text-lg'/>
      {content && <div>{community.description}</div>}
      {footer && isMemberOfCommunity != null && (
        <JoinCommunityButton
          communityId={community.id}
          isMemberOfCommunity={isMemberOfCommunity}
          userId={userId}
        />
      )}
    </div>
  );
};

export default CommunityCard;
