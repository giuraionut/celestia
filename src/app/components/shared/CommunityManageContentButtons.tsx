import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import React from 'react';

const buttons = [
  {
    name: 'Posts',
    href: '/posts',
  },
  {
    name: 'Users',
    href: '/users',
  },
];

const CommunityManageContentButtons = ({
  communityName,
  className,
  page,
}: {
  communityName: string;
  className?: string;
  page?: string;
}) => {
  return (
    <div className={cn('flex gap-2', className)}>
      {buttons.map((button) => {
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
            <Link href={`/community/${communityName}${button.href}/manage`}>
              {button.name}
            </Link>
          </Button>
        );
      })}
    </div>
  );
};

export default CommunityManageContentButtons;
