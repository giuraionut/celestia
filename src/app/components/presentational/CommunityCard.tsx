import { cn } from '@/lib/utils';
import { Community } from '@prisma/client';
import React from 'react';
import Image from 'next/image';
import JoinCommunityButton from '../client/JoinCommunityButton';

const CommunityCard = ({
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
  return (
    <div className={cn(`flex gap-4 flex-col`, className)}>
      <div className='flex items-center gap-4'>
        <Image
          src={community.image}
          className='w-10 h-10 rounded-full object-contain'
          alt={community.name}
          width={100}
          height={100}
        />
        <div>{community.name}</div>
      </div>
      {content && <div>{community.description}</div>}
      {footer && isMemberOfCommunity != null && (
        <JoinCommunityButton
          communityId={community.id}
          isMemberOfCommunity={isMemberOfCommunity}
        />
      )}
    </div>
  );
};

export default CommunityCard;
