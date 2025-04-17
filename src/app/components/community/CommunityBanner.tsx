import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getSessionUserId } from '@/actions/actionUtils';
import { ExtendedCommunity } from '@prisma/client';

import JoinCommunityButton from './JoinCommunityButton';
import ManageCommunityButton from './ManageCommunityButton';
import UserHoverCard from '../shared/UserHoverCard';
import { Card } from '@/components/ui/card';

type CommunityBannerBaseProps = {
  community: ExtendedCommunity;
  className?: string;
};

type CommunityBannerConditionalProps =
  | {
      showButtons: true;
      isMemberOfCommunity: boolean;
      isManagerOfCommunity: boolean;
    }
  | {
      showButtons: false;
      isMemberOfCommunity?: never;
      isManagerOfCommunity?: never;
    };

type CommunityBannerProps = CommunityBannerBaseProps &
  CommunityBannerConditionalProps;


const CommunityBanner = async (props: CommunityBannerProps) => {
  const { community, className, showButtons } = props;

  const userId = showButtons ? await getSessionUserId() : null;

  if (!community) {
    return (
      <Card className={cn('p-4', className)}>
        Community data not found.
      </Card>
    );
  }

  return (
    <div
      className={cn(
        'border rounded-lg flex flex-col w-full overflow-hidden',
        className
      )}
    >
      <div className='relative p-4 w-full bg-accent'>
        <div className='flex flex-col sm:flex-row sm:items-start gap-4'>
          <Image
            src={community.image || '/defaultCommunityImage.png'}
            className='w-20 h-20 rounded-full object-cover ring-2 ring-accent-foreground flex-shrink-0 mx-auto sm:mx-0'
            alt={`${community.name} community image`}
            width={80}
            height={80}
            priority
          />
          <div className='flex flex-col flex-grow gap-1 text-center sm:text-left'>
            <h1 className='text-xl sm:text-2xl md:text-3xl font-bold break-words'>
              {community.name}
            </h1>
            <div className='text-xs md:text-sm flex gap-1 items-center justify-center sm:justify-start'>
              Created by
              {community.author ? (
                <UserHoverCard user={community.author} />
              ) : (
                <span className='italic ml-1'>Unknown</span>
              )}
            </div>
          </div>

          {props.showButtons === true && userId && (
            <div className='flex flex-row items-center sm:items-end gap-2 mt-2 sm:mt-0 sm:ml-auto flex-shrink-0'>
              <JoinCommunityButton
                communityId={community.id}
                isMemberOfCommunity={props.isMemberOfCommunity}
                userId={userId}
              />
              {props.isManagerOfCommunity && (
                <ManageCommunityButton communityName={community.name} />
              )}
            </div>
          )}
        </div>
      </div>
      {community.description && (
        <div className='p-4 border-t'>
          <p className='text-sm break-words'>{community.description}</p>
        </div>
      )}
    </div>
  );
};

export default CommunityBanner;
