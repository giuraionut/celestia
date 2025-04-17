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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Community } from '@prisma/client';
import { createCommunity } from '@/actions/communityActions';
import { startTransition } from 'react';

const FormSchema = z.object({
  name: z.string().min(2, {
    message: 'Community name must be at least 2 characters.',
  }),
  description: z.string().min(2, {
    message: 'Description must be at least 2 characters.',
  }),
  image: z
    .string()
    .url({ message: 'Please provide a valid URL for the image.' })
    .optional()
    .or(z.literal('')),
  isPrivate: z.boolean().default(false),
});

export function CreateCommunityForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      description: '',
      image: '',
      isPrivate: false,
    },
    mode: 'onChange', // Trigger validation on change
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const community: Community = {
      image: data.image || '', // Handle optional image
      name: data.name,
      id: '',
      description: data.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId: '',
      isDeleted: false,
      totalMembers: 0,
      totalManagers: 0,
      isPrivate: data.isPrivate,
      totalPosts: 0,
    };

    startTransition(async () => {
      try {
        const newCommunity = await createCommunity(community);

        if (newCommunity && newCommunity.name) {
          toast.success(`Community created successfully: ${newCommunity.name}`);
        } else {
          toast.error(
            'Error: Community creation failed or returned invalid data.'
          );
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          toast.error(`Error creating community: ${error.message}`);
        }
        toast.error('Error creating community. Please try again.');
      }
    });
  }

  const isFormValid = form.formState.isValid && !form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-2/3 space-y-6'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='Enter community name' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder='Enter community description' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='image'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL (optional)</FormLabel>
              <FormControl>
                <Input placeholder='Enter community image URL' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='isPrivate'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center space-x-2'>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked === true);
                }}
              />
              <FormLabel className='cursor-pointer'>Private</FormLabel>
            </FormItem>
          )}
        />
        <Button type='submit' disabled={!isFormValid}>
          Submit
        </Button>
      </form>
    </Form>
  );
}
