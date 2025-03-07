import { readCommunityByName } from '@/actions/communityActions';
import { CreatePostForm } from '@/app/components/forms/createPostForm';
import React from 'react';

const CreatePost = async ({ params }: { params: { name: string } }) => {
  const { name } = await params;
  const community = await readCommunityByName(name);
  return (
    <div>
      <div>CreatePost</div>
      {community && <CreatePostForm community={community} />}
    </div>
  );
};

export default CreatePost;
