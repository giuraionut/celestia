import { readCommunityByName } from '@/actions/communityActions';
import { CreatePostForm } from '@/app/components/forms/createPostForm';
import React from 'react';

const CreatePost = async ({ params }: { params: { name: string } }) => {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const community = await readCommunityByName(decodedName);
  return (
    <div>
      <div>CreatePost</div>
      {community && <CreatePostForm community={community} />}
    </div>
  );
};

export default CreatePost;
