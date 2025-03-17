import * as React from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarRail,
} from '@/components/ui/sidebar';
import { fetchVisitedCommunities } from '@/actions/communityActions';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { SearchBox } from './SearchBox';
import { RVCSidebar } from './RVCSidebar';

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return null;

  const visitedCommunities = await fetchVisitedCommunities(session.user.id);
  console.log('sideabbr');
  return (
    <Sidebar {...props}>
      <SidebarHeader className='mt-10'>
        <div className='flex-1 flex justify-center items-center h-10'>
          <SearchBox className='h-8 px-4 max-w-[600px]'/>
        </div>
      </SidebarHeader>
      <SidebarContent className='gap-0'>
        <RVCSidebar visitedCommunities={visitedCommunities} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
