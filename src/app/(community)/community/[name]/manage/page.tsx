import { requireSessionUserId } from '@/actions/actionUtils';
import { findCommunityByName } from '@/actions/communityActions';
import CommunityBanner from '@/app/components/community/CommunityBanner';
import CommunityMemberOptions from '@/app/components/community/CommunityMemberOptions';
import CommunityOverviewCard from '@/app/components/community/CommunityOverviewCard';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/shared/HolyGrail';
import UserHoverCard from '@/app/components/shared/UserHoverCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

import { ExtendedCommunity, User } from '@prisma/client';
import { notFound } from 'next/navigation';
import React from 'react';

type ManageCommunityPageProps = {
  params: Promise<{ name: string }>;
};

type CommunityMemberRowProps = {
  member: User;
  community: ExtendedCommunity;
  isAuthor: boolean;
  isManager: boolean;
  isMemberTheAuthor: boolean;
  isMemberAManager: boolean;
  isSelf: boolean;
};

const CommunityMemberRow = ({
  member,
  community,
  isAuthor,
  isManager,
  isMemberTheAuthor,
  isMemberAManager,
  isSelf,
}: CommunityMemberRowProps) => {
  const canManageRoles = isAuthor && !isSelf;

  const canBanMember =
    !isSelf &&
    !isMemberTheAuthor &&
    (isAuthor || (isManager && !isMemberAManager));

  const isMemberBanned =
    community.bannedUsers?.some(
      (bannedMember) => bannedMember.userId === member.id
    ) || false;

  const showManageButton = canManageRoles || canBanMember;

  return (
    <div className='flex items-center justify-between gap-4 p-4 hover:bg-muted/50 rounded-sm'>
      <div className='flex items-center gap-3 flex-grow'>
        <Avatar className='h-9 w-9'>
          <AvatarImage src={member.image || ''} alt={member.name || 'User'} />
          <AvatarFallback>
            {member.name ? member.name.charAt(0).toUpperCase() : '?'}
          </AvatarFallback>
        </Avatar>
        <UserHoverCard user={member} />
        {isMemberTheAuthor && (
          <span className='text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full'>
            Author
          </span>
        )}
        {isMemberAManager && !isMemberTheAuthor && (
          <span className='text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full'>
            Manager
          </span>
        )}
      </div>

      {showManageButton && (
        <CommunityMemberOptions
          community={community}
          member={member}
          canBanMember={canBanMember}
          canManageRoles={canManageRoles}
          isMemberAManager={isMemberAManager}
          isMemberBanned={isMemberBanned}
        />
      )}
      {isSelf && (
        <span className='text-xs text-muted-foreground italic mr-2'>You</span>
      )}
    </div>
  );
};

const ManageCommunityPage = async ({ params }: ManageCommunityPageProps) => {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const [community, currentUserId] = await Promise.all([
    findCommunityByName(decodedName),
    requireSessionUserId('manage community'),
  ]);

  if (!community) {
    notFound();
  }

  if (!currentUserId) {
    return (
      <HolyGrail>
        <Left />
        <Middle>
          <Card className='w-full max-w-2xl mx-auto rounded-sm'>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You must be logged in to manage a community.</p>
            </CardContent>
          </Card>
        </Middle>
        <Right />
      </HolyGrail>
    );
  }

  const communityMembers = community.members || [];
  const managerIds = new Set(community.managers?.map((m) => m.id) || []);

  const isCurrentUserAuthor = community.authorId === currentUserId;
  const isCurrentUserAManager = managerIds.has(currentUserId);

  if (!isCurrentUserAuthor && !isCurrentUserAManager) {
    return (
      <div>Access Denied: You are not authorized to manage this community.</div>
    );
  }

  return (
    <HolyGrail>
      <Left></Left>
      <Middle>
        <div className='p-4 w-full'>
          <CommunityBanner
            showButtons={false}
            community={community}
            className='mb-4'
          />
          <Card className='w-full max-w-3xl mx-auto rounded-sm'>
            <CardHeader>
              <CardTitle className='text-2xl'>Manage Community</CardTitle>
              <CardDescription>
                Manage members and roles for <span className='font-bold'>{community.name}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <h3 className='text-lg font-semibold mb-4'>
                Members ({communityMembers.length})
              </h3>
              {communityMembers.length > 0 ? (
                <div className='flex flex-col gap-1'>
                  {communityMembers.map((member) => {
                    const isMemberTheAuthor = community.authorId === member.id;
                    const isMemberAManager = managerIds.has(member.id);
                    const isSelf = member.id === currentUserId;

                    return (
                      <CommunityMemberRow
                        key={member.id}
                        member={member}
                        community={community}
                        isAuthor={isCurrentUserAuthor}
                        isManager={isCurrentUserAManager}
                        isMemberTheAuthor={isMemberTheAuthor}
                        isMemberAManager={isMemberAManager}
                        isSelf={isSelf}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className='text-center text-muted-foreground py-6'>
                  No members found in this community yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Middle>
      <Right>
        <CommunityOverviewCard community={community} />
      </Right>
    </HolyGrail>
  );
};

export default ManageCommunityPage;
