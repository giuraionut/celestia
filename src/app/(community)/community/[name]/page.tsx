import {
  findCommunityByName,
  isUserManagerOfCommunity,
  isUserMemberOfCommunity,
  logCommunityVisit,
} from '@/actions/communityActions';
import { readPosts } from '@/actions/postActions';
import React from 'react';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/shared/HolyGrail';
import LoadMore from '@/app/components/shared/LoadMore';
import PostList from '@/app/components/post/PostList';
import CommunityBanner from '@/app/components/community/CommunityBanner';
import { getSessionUserId } from '@/actions/actionUtils';
import { SortProvider } from '@/app/components/post/PostSortingContext';
import {
  Cake,
  GlobeIcon,
  LockKeyholeIcon,
  User2Icon,
  UserIcon,
} from 'lucide-react';
import { SortingControls } from '@/app/components/post/PostSortingControls';
import { getSortParams } from '@/lib/utils';
import { loadMorePosts } from '@/actions/loadMoreActions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import UserHoverCard from '@/app/components/shared/UserHoverCard';

type CommunityPageProps = {
  params: Promise<{ name: string }>;
  searchParams?: Promise<{
    sort?: string;
  }>;
};
const CommunityPage = async ({ params, searchParams }: CommunityPageProps) => {
  try {
    const { name } = await params;
    const resolvedSearchParams = await searchParams;
    const { sort } = resolvedSearchParams || {};
    const initialSort = sort || 'newest';
    const decodedName = decodeURIComponent(name);
    const sortParams = getSortParams(initialSort);

    const community = await findCommunityByName(decodedName);
    if (!community) {
      return <div>Community not found.</div>;
    }

    const userId = await getSessionUserId();
    const isPrivate = community.isPrivate;
    const isMemberOfCommunity = userId
      ? await isUserMemberOfCommunity(community.id, userId)
      : false;
    const isManagerOfCommunity = userId
      ? await isUserManagerOfCommunity(community.id, userId)
      : false;

    if (isPrivate && !isMemberOfCommunity && !isManagerOfCommunity) {
      return (
        <div>
          This community is private. You need to be a member or manager to view
          it.
        </div>
      );
    }

    if (userId) {
      await logCommunityVisit(community.id, userId);
    }

    const postData = await readPosts({
      communityId: community.id,
      limit: 5,
      sortBy: sortParams.sortBy,
      sortOrder: sortParams.sortOrder,
    });
    const { posts: initialPosts = [], nextCursor: initialCursor } =
      postData || {};

    const postListKey = `post-list-${initialSort}`;

    return (
      <HolyGrail>
        <Left />
        <Middle>
          <div className='w-full px-4'>
            <CommunityBanner
              community={community}
              isMemberOfCommunity={isMemberOfCommunity}
              isManagerOfCommunity={isManagerOfCommunity}
              userId={userId}
              className='mb-4'
            />
            {initialPosts.length > 0 && (
              <SortProvider initialSort={initialSort}>
                <div className='max-w-[700px] w-full items-center flex p-4'>
                  <SortingControls />
                </div>
                <LoadMore
                  loadMoreAction={loadMorePosts}
                  initialCursor={initialCursor}
                >
                  <PostList
                    key={postListKey}
                    posts={initialPosts}
                    userId={userId}
                  />
                </LoadMore>
              </SortProvider>
            )}
            {initialPosts.length === 0 && (
              <div className='text-center'>No posts found.</div>
            )}
          </div>
        </Middle>
        <Right>
          <div className='sticky top-0 w-full p-4'>
            <div className='flex flex-col gap-4 p-4 border rounded-sm'>
              <span className='inline-flex gap-2'>
                <Cake />
                Created at
                <span className='font-bold'>
                  {community.createdAt.toDateString()}
                </span>
              </span>
              {community.isPrivate && (
                <span className='inline-flex gap-2'>
                  <LockKeyholeIcon />
                  <span className='font-bold'>Private</span>
                </span>
              )}
              {!community.isPrivate && (
                <span className='inline-flex gap-2'>
                  <GlobeIcon />
                  <span className='font-bold'>Public</span>
                </span>
              )}
              <span className='inline-flex gap-2'>
                <UserIcon />
                Total Members
                <span className='font-bold'>{community.totalMembers}</span>
              </span>
              <span className='inline-flex gap-2'>
                <UserIcon />
                Total Managers
                <span className='font-bold'>{community.totalManagers}</span>
              </span>
              <Separator />
              <span className='inline-flex gap-2'>
                <User2Icon />
                Managers
              </span>
              <span className='ml-8 flex flex-col gap-2'>
                {community.managers?.map((manager) => (
                  <UserHoverCard key={manager.id} user={manager}>
                    <Avatar>
                      <AvatarImage
                        className='rounded-full '
                        src={manager.image || ''}
                        alt={manager.name || ''}
                      />
                      <AvatarFallback>
                        {(manager.name ?? '?')[0]}
                      </AvatarFallback>
                    </Avatar>
                  </UserHoverCard>
                ))}
              </span>
            </div>
          </div>
        </Right>
      </HolyGrail>
    );
  } catch (error) {
    console.error('Error loading community page:', error);
    return (
      <div className='text-center'>
        There was an error loading the community. Please try again later.
      </div>
    );
  }
};

export default CommunityPage;
