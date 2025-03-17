import { CreateCommunityForm } from '@/app/components/community/createCommunityForm';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/shared/HolyGrail';
import React from 'react';

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
