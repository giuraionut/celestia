import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import React from 'react';

const buttons = [
  {
    name: 'Overview',
    href: '/',
  },
  {
    name: 'Posts',
    href: '/posts',
  },
  {
    name: 'Comments',
    href: '/comments',
  },
  {
    name: 'Saved',
    href: '/saved',
  },
];
const UserProfileContentButtons = ({
  userName,
  className,
  page,
}: {
  userName: string;
  className?: string;
  page?: string;
}) => {
  return (
    <div className={cn('', className)}>
      {buttons.map((button) => (
        <Button
          key={button.name}
          asChild
          variant={'outline'}
          className={cn('flex-1', {
            'bg-accent':
              button.href === '/'
                ? page === undefined || page === button.href
                : page === button.href.replace('/', ''),
          })}
        >
          <Link href={`/user/${userName}${button.href}`}>{button.name}</Link>
        </Button>
      ))}
    </div>
  );
};

export default UserProfileContentButtons;
