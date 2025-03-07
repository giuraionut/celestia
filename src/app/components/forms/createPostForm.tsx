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
import { createPost } from '@/actions/postActions';
import { Community, Post } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FormSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  content: z.string().min(2, {
    message: 'Content must be at least 2 characters.',
  }),
  image: z
    .string()
    .min(2, {
      message: 'Image url must be at least 2 characters.',
    })
    .url(),
  community: z.string().cuid(),
});

type CreatePostFormProps =
  | {
      community: Community;
      communities?: Community[] | null;
    }
  | {
      community?: Community | null;
      communities: Community[];
    };

export function CreatePostForm(props: CreatePostFormProps) {
  const { community, communities } = props;
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: '',
      content: '',
      image: '',
      community: community ? community.id : '',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const post: Post = {
      title: data.title,
      content: data.content,
      id: '',
      plainTextContent: data.content,
      createdAt: new Date(),
      updatedAt: new Date(),
      communityId: community ? community.id : data.community,
      authorId: '',
      cover: '',
      isDeleted: false,
      totalComments: 0,
      totalUpvotes: 0,
      totalDownvotes: 0,
    };
    const newPost = await createPost(post);
    toast(JSON.stringify(newPost));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-2/3 space-y-6'>
        <FormField
          control={form.control}
          name='community'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Community</FormLabel>
              <Select
                disabled={!!community || !communities}
                onValueChange={field.onChange}
                defaultValue={community ? community.id : field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a community' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {communities &&
                    communities.map((comm) => (
                      <SelectItem key={comm.id} value={comm.id}>
                        {comm.name}
                      </SelectItem>
                    ))}
                  {community && (
                    <SelectItem value={community.id}>
                      {community.name}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder='Post title' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='content'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Input placeholder='Post content' {...field} />
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
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder='Image URL' {...field} />
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
