import React from 'react';
import { cn } from '@/lib/utils';
import { Community } from '@prisma/client';
import { getSessionUserId } from '@/actions/actionUtils';

import CommunityHeader from './CommunityHeader';
import JoinCommunityButton from './JoinCommunityButton';
import { Card } from '@/components/ui/card';

type CommunityCardProps = {
  community: Community;
  isMemberOfCommunity?: boolean;
  content?: boolean;
  footer?: boolean;
  className?: string;
};

const CommunityCard = async ({
  community,
  isMemberOfCommunity,
  content = true,
  footer = true,
  className,
}: CommunityCardProps) => {
  const userId =
    footer && isMemberOfCommunity != null ? await getSessionUserId() : null;

  return (
    <Card
      className={cn(
        'p-4 shadow-sm flex flex-col gap-3',
        className
      )}
    >
      <CommunityHeader
        name={community.name}
        image={community.image}
        textSize='text-base font-medium'
      />

      {content && community.description && (
        <p className='text-sm text-muted-foreground break-words mt-1'>
          {community.description}
        </p>
      )}

      {footer && isMemberOfCommunity != null && userId != null && (
        <div className='mt-3 pt-3 border-t'>
          <JoinCommunityButton
            communityId={community.id}
            isMemberOfCommunity={isMemberOfCommunity}
            userId={userId}
          />
        </div>
      )}
    </Card>
  );
};

export default CommunityCard;
