import React from 'react';
import Blackhole from '../svgs/Blackhole';
import { HolyGrail, Left, Middle, Right } from './HolyGrail';
import Stars from '../svgs/Stars';

const ErrorContent = ({ message }: { message: string }) => {
  return (
    <HolyGrail>
      <Left />
      <Middle>
        <Stars className='h-48 w-48 mx-auto rotate-20' />
        <p>{message}</p>
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
};

export default ErrorContent;
