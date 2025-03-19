import { cn } from '@/lib/utils';
import { Community } from '@prisma/client';
import React from 'react';
import Image from 'next/image';
import JoinCommunityButton from './JoinCommunityButton';
import Link from 'next/link';
import { getSessionUserId } from '@/actions/actionUtils';

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
      <Link
        href={`/community/${community.name}`}
        className='flex items-center gap-4 text-primary/50 hover:text-primary'
      >
        <Image
          src={community.image}
          className='w-10 h-10 rounded-full object-contain'
          alt={community.name}
          width={100}
          height={100}
        />
        <div className=''>{community.name}</div>
      </Link>
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
