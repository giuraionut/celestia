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
import { useEffect, useState } from 'react';
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

    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false, // Stay on the same page to handle errors
      });

      if (res?.ok) {
        toast.success('Login successful');
        if (onSuccess) {
          onSuccess(); // Close the dialog after successful login
        } else {
          router.push('/'); // Only redirect if not in a dialog
        }
      } else if (res?.error) {
        toast.error('Invalid email or password.', {
          description: 'Please check your credentials and try again.',
        });
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
  };

  // Filter out credential provider
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

      {/* Provider loading state */}
      {isLoadingProviders && (
        <div className='flex justify-center py-4'>
          <div className='animate-spin h-6 w-6 border-2 border-gray-500 rounded-full border-t-transparent'></div>
        </div>
      )}

      {/* Social providers */}
      {!isLoadingProviders &&
        socialProviders.map((provider) => (
          <Button
            key={provider.name}
            onClick={() => signIn(provider.id)}
            variant='outline'
            className='w-full flex items-center justify-center gap-2'
          >
            {provider.id === 'google' && (
              <svg
                version='1.1'
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 48 48'
                xmlnsXlink='http://www.w3.org/1999/xlink'
                style={{ display: 'block' }}
              >
                <path
                  fill='#EA4335'
                  d='M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'
                ></path>
                <path
                  fill='#4285F4'
                  d='M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'
                ></path>
                <path
                  fill='#FBBC05'
                  d='M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'
                ></path>
                <path
                  fill='#34A853'
                  d='M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z'
                ></path>
                <path fill='none' d='M0 0h48v48H0z'></path>
              </svg>
            )}
            Sign in with {provider.name}
          </Button>
        ))}
    </>
  );
}
