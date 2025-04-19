import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { HolyGrail, Left, Middle, Right } from '../components/shared/HolyGrail';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  checkExistingPassword,
  fetchAuthenticatedUser,
  getConnectedProviders,
} from '@/actions/authActions';
import SetInitialPasswordForm from '../components/settings/SetInitialPasswordForm';
import UpdatePasswordForm from '../components/settings/UpdatePasswordForm';
import UpdateUsernameForm from '../components/settings/UpdateUsernameForm';
import UpdateAvatarForm from '../components/settings/UpdateAvatarForm';
import ProviderIcon from '../components/shared/ProviderIcon';
import { format } from 'date-fns';

type ProviderInfo = {
  provider: string;
  createdAt: Date;
};

async function getUserSettingsData() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.email) {
    return null;
  }

  const [providerDataResult, user] = await Promise.all([
    getConnectedProviders({ userId: session.user.id }),
    fetchAuthenticatedUser(),
  ]);

  let providers: ProviderInfo[] = [];
  let hasPassword = false;
  if (providerDataResult.success && providerDataResult.providers) {
    providers = providerDataResult.providers;
    hasPassword = providerDataResult.hasPassword ?? false;
  } else {
    console.error('Failed to get provider data:', providerDataResult.message);
    hasPassword = await checkExistingPassword();
  }

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    hasPassword: hasPassword,
    providers: providers,
  };
}

export default async function SettingsPage() {
  const userData = await getUserSettingsData();

  if (!userData) {
    redirect('/api/auth/signin?callbackUrl=/settings');
  }

  return (
    <HolyGrail>
      <Left />
      <Middle>
        <main className='container mx-auto max-w-3xl py-8 px-4 md:px-2 space-y-8'>
          <header>
            <h1 className='text-3xl font-bold tracking-tight'>
              Account Settings
            </h1>
            <p className='text-muted-foreground mt-1'>
              Manage your profile, security, and connected services.
            </p>
          </header>

          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update your public username and avatar.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div>
                <h3 className='text-sm font-medium mb-3'>Avatar</h3>
                <UpdateAvatarForm
                  currentImageUrl={userData.image}
                  username={userData.name}
                />
              </div>
              <Separator />
              <div>
                <h3 className='text-sm font-medium mb-3'>Username</h3>
                <UpdateUsernameForm
                  userId={userData.id}
                  currentUsername={userData.name}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your account password settings.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <h3 className='text-sm font-medium'>Password</h3>
              {userData.hasPassword ? (
                <UpdatePasswordForm userEmail={userData.email} />
              ) : (
                <SetInitialPasswordForm userEmail={userData.email} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                View and manage your third-party logins.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className='space-y-4'>
                {userData.hasPassword && (
                  <li className='flex items-center justify-between gap-3 p-3 border rounded-md'>
                    <div className='flex items-center gap-3'>
                      <ProviderIcon
                        provider='credentials'
                        className='w-6 h-6'
                      />
                      <div>
                        <p className='text-sm font-medium'>Email & Password</p>
                        <p className='text-xs text-muted-foreground'>Enabled</p>
                      </div>
                    </div>
                  </li>
                )}

                {userData.providers &&
                  userData.providers.length > 0 &&
                  userData.providers.map((account) => (
                    <li
                      key={account.provider}
                      className='flex items-center justify-between gap-3 p-3 border rounded-md'
                    >
                      <div className='flex items-center gap-3'>
                        <ProviderIcon
                          provider={account.provider}
                          className='w-6 h-6'
                        />
                        <div>
                          <p className='text-sm font-medium capitalize'>
                            {account.provider}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            Connected on{' '}
                            {format(new Date(account.createdAt), 'PPP')}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}

                {!userData.hasPassword &&
                  (!userData.providers || userData.providers.length === 0) && (
                    <li className='text-sm text-muted-foreground text-center py-4 px-3 border rounded-md'>
                      No third-party accounts connected.
                    </li>
                  )}
              </ul>
            </CardContent>
          </Card>
        </main>
      </Middle>
      <Right />
    </HolyGrail>
  );
}
