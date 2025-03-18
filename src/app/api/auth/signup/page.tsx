import React from 'react';
import SignUpForm from '../../../components/shared/signupForm';
import Link from 'next/link';

const SignUpPage = async () => {
  return (
    <div>
      <div>SignUpPage</div>
      <SignUpForm />
      <p className='text-sm text-gray-500 text-center'>
        Already have an account?{' '}
        <Link href='/api/auth/signin' className='text-blue-500 underline'>
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default SignUpPage;
