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
    href: '/posts/saved',
  },
  {
    name: 'Hidden',
    href: '/posts/hidden',
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
    <div className={cn('flex gap-2', className)}>
      {buttons.map((button) => {
        // get the last part of the href to compare with `page`
        const hrefSegments = button.href.split('/').filter(Boolean);
        const hrefPage = hrefSegments[hrefSegments.length - 1] ?? undefined;

        const isActive =
          (button.href === '/' && (page === undefined || page === '')) ||
          page === hrefPage;

        return (
          <Button
            key={button.name}
            asChild
            variant={'outline'}
            className={cn('flex-1', {
              'bg-accent': isActive,
            })}
          >
            <Link href={`/user/${userName}${button.href}`}>{button.name}</Link>
          </Button>
        );
      })}
    </div>
  );
};

export default UserProfileContentButtons;
