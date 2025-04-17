import { findCommunityByName } from '@/actions/communityActions';
import { CreatePostForm } from '@/app/components/post/CreatePostForm';
import EmptyContent from '@/app/components/shared/EmptyContent';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/shared/HolyGrail';
import { Metadata } from 'next';
import React from 'react';
export const metadata: Metadata = {
  title: 'Create Post | Celestia',
  description: 'Create a new post.',
};
const CreatePost = async ({
  params,
}: {
  params: Promise<{ name: string }>;
}) => {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const community = await findCommunityByName(decodedName);
  if (!community)
    return (
      <EmptyContent message='Looks like the community you are looking for does not exist.' />
    );
  return (
    <HolyGrail>
      <Left />
      <Middle>
        <div>Create Post</div>
        <CreatePostForm community={community} />
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
};

export default CreatePost;
