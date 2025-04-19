import * as React from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarRail,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  fetchUserCommunities,
  fetchVisitedCommunities,
} from '@/actions/communityActions';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { SidebarCommunities } from './SidebarCommunities';
import { Separator } from '@/components/ui/separator';
import UserProfileDropdown from './UserProfileDropdown';
import { cn } from '@/lib/utils';

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return null;

  const visitedCommunities = await fetchVisitedCommunities();
  const joinedCommunities = await fetchUserCommunities();
  return (
    <Sidebar {...props}>
      <SidebarHeader className='mt-10'></SidebarHeader>
      <SidebarContent className='flex flex-col gap-4'>
        <SidebarCommunities
          communities={visitedCommunities}
          title={'Recently visited communities'}
        />
        <div className='px-4'>
          <Separator />
        </div>
        <SidebarCommunities
          communities={joinedCommunities}
          title={'Joined communities'}
        />
      </SidebarContent>
      <SidebarFooter>
        <UserProfileDropdown
          side='right'
          className={cn(
            'w-full p-2 hover:bg-primary/10 rounded transition-colors cursor-pointer sm:hidden'
          )}
          position='sidebar'
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
