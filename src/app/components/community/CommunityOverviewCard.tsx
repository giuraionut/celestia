import {
  Cake,
  LockKeyholeIcon,
  GlobeIcon,
  UserIcon,
  User2Icon,
} from 'lucide-react';
import React from 'react';
import UserHoverCard from '../shared/UserHoverCard';
import { ExtendedCommunity } from '@prisma/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';

const CommunityOverviewCard = ({
  community,
}: {
  community: ExtendedCommunity;
}) => {
  return (
    <div className='p-4 w-full'>
      <Card className='flex flex-col gap-4 p-4 w-full h-fit'>
        <span className='inline-flex gap-2'>
          <Cake />
          Created at
          <span className='font-bold'>
            {community.createdAt.toDateString()}
          </span>
        </span>
        {community.isPrivate && (
          <span className='inline-flex gap-2'>
            <LockKeyholeIcon />
            <span className='font-bold'>Private</span>
          </span>
        )}
        {!community.isPrivate && (
          <span className='inline-flex gap-2'>
            <GlobeIcon />
            <span className='font-bold'>Public</span>
          </span>
        )}
        <span className='inline-flex gap-2'>
          <UserIcon />
          Total Members
          <span className='font-bold'>{community.totalMembers}</span>
        </span>
        <span className='inline-flex gap-2'>
          <UserIcon />
          Total Managers
          <span className='font-bold'>{community.totalManagers}</span>
        </span>
        <Separator />
        <span className='inline-flex gap-2'>
          <User2Icon />
          Managers
        </span>
        <span className='ml-8 flex flex-col gap-2'>
          {community.managers?.map((manager) => (
            <UserHoverCard key={manager.id} user={manager}>
              <Avatar>
                <AvatarImage src={manager.image || ''} />
                <AvatarFallback>{manager.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
            </UserHoverCard>
          ))}
        </span>
      </Card>
    </div>
  );
};

export default CommunityOverviewCard;
