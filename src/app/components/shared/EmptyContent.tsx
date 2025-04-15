import React from 'react';
import Blackhole from '../svgs/Blackhole';
import { HolyGrail, Left, Middle, Right } from './HolyGrail';

const EmptyContent = ({ message }: { message: string }) => {
  return (
    <HolyGrail>
      <Left />
      <Middle>
        <Blackhole className='h-48 w-48 mx-auto' />
        <p>{message}</p>
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
};

export default EmptyContent;
