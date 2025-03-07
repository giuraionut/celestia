import React from 'react';
import SignInForm from './signinForm';
import { getProviders } from 'next-auth/react';

const SignInPage = async () => {
  const providers = await getProviders();
  return (
    <div>
      <div>SignInPage</div>
      <SignInForm providers={providers} />
    </div>
  );
};

export default SignInPage;
