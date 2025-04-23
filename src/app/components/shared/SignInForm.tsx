'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ClientSafeProvider, getProviders, signIn } from 'next-auth/react';
import { startTransition, useEffect, useState } from 'react';
import ProviderIcon from './ProviderIcon';
import SolarSystemLoading from '../svgs/SolarSystemLoading';
import { useRouter } from 'next/navigation';

const FormSchema = z.object({
  email: z
    .string()
    .min(2, {
      message: 'Email must be at least 2 characters.',
    })
    .email(),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }),
});

export default function SignInForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const [providers, setProviders] = useState<Record<
    string,
    ClientSafeProvider
  > | null>(null);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProviders = async () => {
      setIsLoadingProviders(true);
      try {
        const res = await getProviders();
        if (res) setProviders(res);
      } catch (error) {
        console.error('Failed to load providers:', error);
      } finally {
        setIsLoadingProviders(false);
      }
    };

    fetchProviders();
  }, []);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsSubmitting(true);
    startTransition(async () => {
      try {
        const res = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        console.log('res', res);
        if (res?.error) {
          toast.error('Invalid email or password.', {
            description: 'Please check your credentials and try again.',
          });
          return;
        }
        if (res?.ok) {
          if (onSuccess) {
            toast.success('Login successful');
            onSuccess();
          } else {
            toast.success('Login successful');
            router.push('/');
            router.refresh();
          }
        }
      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            toast.error('Input error, verify the data', {
              description: err.message,
            });
          });
        } else {
          toast.error('Error', {
            description: 'Could not sign in. Please try again later.',
          });
          console.error(error);
        }
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  const socialProviders = providers
    ? Object.values(providers).filter(
        (provider) => provider.id !== 'credentials'
      )
    : [];

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='w-full space-y-4'
        >
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder='email@example.com' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type='password' placeholder='••••••••' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </Form>

      {/* Divider with or text when social providers are available or loading */}
      {(isLoadingProviders || socialProviders.length > 0) && (
        <div className='relative flex items-center my-4'>
          <div className='flex-grow border-t border-gray-300'></div>
          <span className='flex-shrink mx-4 text-gray-400'>or</span>
          <div className='flex-grow border-t border-gray-300'></div>
        </div>
      )}

      {isLoadingProviders && <SolarSystemLoading />}

      {!isLoadingProviders &&
        socialProviders.map((provider) => (
          <Button
            key={provider.name}
            onClick={() => signIn(provider.id)}
            variant='outline'
            className='w-full flex items-center justify-center gap-2'
          >
            {provider.id === 'google' && (
              <ProviderIcon provider='google' className='w-6 h-6' />
            )}
            Sign in with {provider.name}
          </Button>
        ))}
    </>
  );
}
