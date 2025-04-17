import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/shared/HolyGrail';
import React from 'react';

const CreatePostLoading = () => {
  return (
    <HolyGrail>
      <Left></Left>
      <Middle>Loading</Middle>
      <Right></Right>
    </HolyGrail>
  );
};

export default CreatePostLoading;
