import React from 'react';
import { readCommunities } from '@/actions/communityActions';
import { CreatePostForm } from '@/app/components/post/CreatePostForm';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/shared/HolyGrail';
import { Metadata } from 'next';
import EmptyContent from '@/app/components/shared/EmptyContent';
export const metadata: Metadata = {
  title: 'Create Post | Celestia',
  description: 'Create a new post.',
};
const CreatePost = async () => {
  const communities = await readCommunities();
  if (!communities || communities.length === 0)
    return (
      <EmptyContent message='Looks like there are no communities which means you cannot create posts. Please create a community first.' />
    );
  return (
    <HolyGrail>
      <Left />
      <Middle>
        <h1 className='text-2xl font-bold'>Create Post</h1>
        <CreatePostForm communities={communities} />
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
};

export default CreatePost;
