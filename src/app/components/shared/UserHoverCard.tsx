import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { User } from '@prisma/client';
import { format } from 'date-fns';
import { CakeIcon } from 'lucide-react';
import Link from 'next/link';
import React, { PropsWithChildren } from 'react';
const UserHoverCard = ({
  user,
  children,
}: { user: User } & PropsWithChildren) => {
  return (
    <div>
      <HoverCard>
        <HoverCardTrigger asChild>
          <Link
            href={`/user/${user.name}`}
            className='text-primary/50 hover:text-primary transition-colors flex items-center gap-2'
          >
            {children}
            {user.name}
          </Link>
        </HoverCardTrigger>
        <HoverCardContent className='w-80'>
          <div className='flex gap-4 items-center'>
            <Avatar>
              <AvatarImage src={user.image || ''} />
              <AvatarFallback>{user.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className='flex flex-col'>
              <Link
                href={`/user/${user.name}`}
                className='text-primary/50 hover:text-primary transition-colors'
              >
                {user.name}
              </Link>
              <div className='flex items-center pt-2'>
                <CakeIcon className='mr-2 h-4 w-4 opacity-70' />{' '}
                <span className='text-xs text-muted-foreground'>
                  {format(new Date(user.createdAt), 'MMMM do, yyyy')}
                </span>
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
};

export default UserHoverCard;
