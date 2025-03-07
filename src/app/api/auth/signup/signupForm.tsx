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
import { createUser } from '@/actions/authActions';
import router from 'next/router';
import { useState } from 'react';

const FormSchema = z.object({
  username: z.string().min(2, {
    message: 'Username must be at least 2 characters.',
  }),
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

export default function SignUpForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsSubmitting(true);

    try {
      const result = await createUser({
        name: data.username,
        email: data.email,
        password: data.password,
      });

      if (!result.success) {
        toast.error('Failed to create account', {
          description: result.message,
        });
      }
      if (result.success) {
        router.push('/api/auth/signin');
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
          description: 'Could not create account. Please try again later.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-2/3 space-y-6'>
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder='shadcn' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
  );
}
