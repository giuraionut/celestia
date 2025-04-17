import { requireSessionUserId } from '@/actions/actionUtils';
import { findCommunityByName } from '@/actions/communityActions';
import CommunityBanner from '@/app/components/community/CommunityBanner';
import CommunityMemberRow from '@/app/components/community/CommunityMemberRow';
import CommunityOverviewCard from '@/app/components/community/CommunityOverviewCard';
import CommunityPostRow from '@/app/components/community/CommunityPostRow';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/shared/HolyGrail';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

import { notFound } from 'next/navigation';
import React from 'react';

type ManageCommunityPageProps = {
  params: Promise<{ name: string }>;
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
          <Card className='w-full max-w-2xl mx-auto rounded-lg'>
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
          <Card className='w-full max-w-3xl mx-auto rounded-lg'>
            <CardHeader>
              <CardTitle className='text-2xl'>Manage Community</CardTitle>
              <CardDescription>
                Manage members and roles for{' '}
                <span className='font-bold'>{community.name}</span>.
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
          <Card className='w-full max-w-3xl mx-auto rounded-lg mt-4'>
            <CardHeader>
              <CardTitle className='text-2xl'>Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className='text-lg font-semibold mb-4'>
                Posts ({community.posts?.length || 0})
              </h3>
              {community.posts?.length === 0 && (
                <div className='text-center text-muted-foreground py-6'>
                  No posts found in this community yet.
                </div>
              )}
              {community &&
                community.posts &&
                community.posts?.length > 0 &&
                community.posts.map((post) => (
                  <CommunityPostRow
                    key={post.id}
                    community={community}
                    post={post}
                    canManagePosts={
                      isCurrentUserAuthor || isCurrentUserAManager
                    }
                  />
                ))}
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
