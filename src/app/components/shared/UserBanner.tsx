import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User } from '@prisma/client';
import { CakeIcon } from 'lucide-react';
import React from 'react';

const UserBanner = ({ user }: { user: User }) => {
  return (
    <div className='w-full p-4 flex items-center gap-4'>
      <Avatar className={cn('w-16 h-16')}>
        <AvatarImage
          className='rounded-full'
          src={user.image || undefined}
          alt={user.name || undefined}
        />
        <AvatarFallback>{user.name?.[0] || 'U'}</AvatarFallback>
      </Avatar>
      <div className='flex flex-col items-left gap-2'>
        <h1 className='text-2xl font-bold'>{user.name}</h1>
        <small className='flex flex-col'>
          <p className='text-sm text-muted-foreground'>
            {user.isDeleted && 'Deleted User'}
          </p>
          <p className='text-sm text-muted-foreground inline-flex gap-2 items-center'>
            <CakeIcon size={20} />{' '}
            {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </small>
      </div>
    </div>
  );
};

export default UserBanner;
