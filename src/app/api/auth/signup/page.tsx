import React from 'react';
import SignUpForm from '../../../components/shared/signupForm';
import Link from 'next/link';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/shared/HolyGrail';

const SignUpPage = async () => {
  return (
    <HolyGrail>
      <Left />
      <Middle>
        <div className='w-full p-4 m-4 max-w-[400px] flex flex-col gap-4'>
          <h1 className='text-2xl font-bold'>Sign Up</h1>

          <SignUpForm />
          <p className='text-sm text-gray-500 text-center'>
            Already have an account?{' '}
            <Link href='/api/auth/signin' className='text-blue-500 underline'>
              Sign in
            </Link>
          </p>
        </div>
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
};

export default SignUpPage;
