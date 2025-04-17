'use client';
import {
  addManager,
  banUser,
  removeManager,
  unbanUser,
} from '@/actions/communityActions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExtendedCommunity, User } from '@prisma/client';
import { MoreVertical } from 'lucide-react';
import React, { startTransition } from 'react';
import { toast } from 'sonner';

const CommunityMemberOptions = ({
  community,
  member,
  canManageRoles,
  isMemberAManager,
  isMemberBanned,
  canBanMember,
}: {
  community: ExtendedCommunity;
  member: User;
  canManageRoles: boolean;
  isMemberAManager: boolean;
  isMemberBanned: boolean;
  canBanMember: boolean;
}) => {
  const handlePromote = async () => {
    startTransition(async () => {
      try {
        await addManager(community.id, member.id);
        toast.success(`User ${member.name} promoted to manager`);
      } catch (error) {
        toast.error('Failed to promote user, try again later.', {
          description: (error as Error).message,
        });
      }
    });
  };

  const handleDemote = async () => {
    startTransition(async () => {
      try {
        await removeManager(community.id, member.id);
        toast.success(`User ${member.name} demoted to member`);
      } catch (error) {
        toast.error('Failed to demote user, try again later.', {
          description: (error as Error).message,
        });
      }
    });
  };

  const handleBan = async () => {
    startTransition(async () => {
      try {
        await banUser(community.id, member.id);
        toast.success(`User ${member.name} banned from community`);
      } catch (error) {
        toast.error('Failed to ban user, try again later.', {
          description: (error as Error).message,
        });
      }
    });
  };
  const handleUnban = async () => {
    startTransition(async () => {
      try {
        await unbanUser(community.id, member.id);
        toast.success(`User ${member.name} unbanned from community`);
      } catch (error) {
        toast.error('Failed to unban user, try again later.', {
          description: (error as Error).message,
        });
      }
    });
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='ml-auto h-8 w-8'>
          <MoreVertical className='h-4 w-4' />
          <span className='sr-only'>Manage User {member.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        {canManageRoles && (
          <>
            {isMemberAManager ? (
              <DropdownMenuItem
                onClick={handleDemote}
                className='text-orange-600 focus:text-orange-600 cursor-pointer'
              >
                Demote to Member
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={handlePromote}
                className='text-blue-600 focus:text-blue-600 cursor-pointer'
              >
                Promote to Manager
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}

        {canBanMember && (
          <>
            {isMemberBanned ? (
              <DropdownMenuItem
                onClick={handleUnban}
                className='text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer'
              >
                Unban User
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={handleBan}
                className='text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer'
              >
                Ban User
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CommunityMemberOptions;
