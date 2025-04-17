import { CreateCommunityForm } from '@/app/components/community/CreateCommunityForm';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/shared/HolyGrail';
import { Metadata } from 'next';
import React from 'react';
export const metadata: Metadata = {
  title: 'Create Community | Celestia',
  description: 'Create a new community.',
};
const CreateCommunity = () => {
  return (
    <HolyGrail>
      <Left />
      <Middle>
        <div>Create Community</div>
        <CreateCommunityForm />
      </Middle>

      <Right></Right>
    </HolyGrail>
  );
};

export default CreateCommunity;
