import Image from 'next/image';
import Link from 'next/link';

export default function CommunityHeader({
  name,
  image,
}: {
  name: string;
  image?: string;
}) {
  console.log('community header');

  return (
    <Link
      href={`/community/${name}`}
      className='flex gap-2 items-center hover:text-primary text-primary/50'
    >
      <Image
        src={image || '/fallback-community.png'}
        alt={name}
        width={100}
        height={100}
        className='w-8 h-8 rounded-full object-contain'
      />
      <span className='text-xs font-bold'>{name}</span>
    </Link>
  );
}
