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
import { ClientSafeProvider, signIn } from 'next-auth/react';
import { useState } from 'react';
import router from 'next/router';

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

export default function SignInForm({
  providers,
}: {
  providers: Record<string, ClientSafeProvider> | null;
}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsSubmitting(true);

    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false, // Stay on the same page to handle errors
      });

      if (res?.ok) {
        router.push('/');
      } else if (res?.error) {
        // Show a toast for wrong email/password
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
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='w-2/3 space-y-6'
        >
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder='shadcn' {...field} />
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
                  <Input placeholder='shadcn' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit'>Submit</Button>
        </form>
      </Form>
      {providers &&
        Object.values(providers)
          .filter((provider) => provider.id !== 'credentials')
          .map((provider) => (
            <button
              key={provider.name}
              onClick={() => signIn(provider.id)}
              className='py-2 w-full flex items-center justify-center gap-2 border bg-foreground/60 rounded hover:bg-foreground/70  focus:outline-none'
            >
              {provider.id === 'google' && 'Google'} Sign in with{' '}
              {provider.name}
            </button>
          ))}
    </>
  );
}
