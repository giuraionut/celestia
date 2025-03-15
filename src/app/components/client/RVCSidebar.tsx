'use client';

import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import Image from 'next/image';
import Link from 'next/link';
import { Community } from '@prisma/client';

interface RecentlyVisitedCommunitiesProps {
  visitedCommunities: Community[];
}

export function RVCSidebar({
  visitedCommunities,
}: RecentlyVisitedCommunitiesProps) {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <Collapsible
      key={'communities'}
      title={'Recently visited communities'}
      defaultOpen
      className='group/collapsible'
      onOpenChange={setIsOpen} // Track open/close state
    >
      <SidebarGroup>
        <SidebarGroupLabel
          asChild
          className='group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        >
          <CollapsibleTrigger className='cursor-pointer'>
            {'Recently visited communities'}
            <ChevronRight className='ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90' />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarMenu>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className='space-y-1'
                >
                  {visitedCommunities.map((community: Community) => (
                    <motion.div
                      key={community.name}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={false}>
                          <div className='flex items-center gap-2'>
                            <Image
                              src={community.image}
                              alt={community.name}
                              width={100}
                              height={100}
                              className='w-8 h-8 rounded-full object-contain'
                            />
                            <Link href={`/community/${community.name}`}>
                              {community.name}
                            </Link>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </SidebarMenu>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
