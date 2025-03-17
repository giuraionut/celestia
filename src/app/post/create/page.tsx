import React from 'react';
import { readCommunities } from '@/actions/communityActions';
import { CreatePostForm } from '@/app/components/post/createPostForm';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/shared/HolyGrail';

const CreatePost = async () => {
  const communities = await readCommunities();
  if (!communities) return <div>Communities not found</div>;
  return (
    <HolyGrail>
      <Left />
      <Middle>
        <div>Create Post</div>
        <CreatePostForm communities={communities} />
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
};

export default CreatePost;
