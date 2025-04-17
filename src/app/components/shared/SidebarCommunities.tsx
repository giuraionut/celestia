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
  communities: Community[];
  title: string;
}

export function SidebarCommunities({
  communities,
  title,
}: RecentlyVisitedCommunitiesProps) {
  const [isOpen, setIsOpen] = React.useState(true);
  const [isVisible, setIsVisible] = React.useState(true);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsVisible(false);
      setTimeout(() => {
        setIsOpen(false);
      }, 300); 
    } else {
      setIsOpen(true);
      setIsVisible(true);
    }
  };

  return (
    <Collapsible
      key={'communities'}
      title={title}
      defaultOpen
      className='group/collapsible'
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <SidebarGroup>
        <SidebarGroupLabel
          asChild
          className='group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg'
        >
          <CollapsibleTrigger className='cursor-pointer mb-2'>
            {title}
            <ChevronRight className='ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90' />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent forceMount>
          <SidebarMenu>
            <AnimatePresence mode='wait'>
              {isVisible && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className='flex flex-col gap-4'
                >
                  {communities.map((community: Community) => (
                    <motion.div
                      key={community.name}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={false}>
                          <Link
                            href={`/community/${community.name}`}
                            className='h-12 rounded-full'
                          >
                            <div className='flex items-center gap-2 p-2'>
                              {community.image && (
                                <Image
                                  src={community.image}
                                  alt={community.name}
                                  width={32}
                                  height={32}
                                  className='w-8 h-8 rounded-full object-cover ring-2 ring-accent-foreground flex-shrink-0'
                                />
                              )}
                              {community.name}
                            </div>
                          </Link>
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
