import React from 'react';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/shared/HolyGrail';
import Link from 'next/link';

const SignInPage = async () => {
  return (
    <HolyGrail>
      <Left />
      <Middle>
        <div className='w-full p-4 m-4 max-w-[400px] flex flex-col gap-4'>
          <h1 className='text-2xl font-bold'>Sign In</h1>
          {/* <SignInForm /> */}
          <p className='text-sm text-gray-500 text-center'>
            Don&apos;t have an account yet?{' '}
            <Link href='/api/auth/signup' className='text-blue-500 underline'>
              Sign up
            </Link>
          </p>
        </div>
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
};

export default SignInPage;
