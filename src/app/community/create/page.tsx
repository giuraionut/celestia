import { CreateCommunityForm } from '@/app/components/forms/createCommunityForm';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/presentational/HolyGrail';
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
