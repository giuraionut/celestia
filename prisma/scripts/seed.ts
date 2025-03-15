import { PrismaClient } from '@prisma/client';
import { 
  randCompanyName, 
  randUuid, 
  randNumber, 
  randSentence, 
  randParagraph,
  randFullName,
  randEmail
} from '@ngneat/falso';

const prisma = new PrismaClient();

// --- Configuration Constants ---
const NUM_USERS = 10;
const NUM_COMMUNITIES = 5;
const POSTS_PER_COMMUNITY = 10;
const COMMENTS_PER_POST = 5; // Top-level comments per post
const REPLY_PROBABILITY = 0.3; // 30% chance that a comment gets a reply

// Global array to store seeded user IDs
let seededUserIds: string[] = [];

// --- Seed Users ---
async function createUsers(): Promise<void> {
  console.log('Creating users...');
  for (let i = 0; i < NUM_USERS; i++) {
    const name = randFullName();
    const email = randEmail();
    // Use pravatar for a random avatar image
    const image = `https://i.pravatar.cc/150?u=${randUuid()}`;
    const user = await prisma.user.create({
      data: {
        name,
        email,
        image,
        password: null,
        isDeleted: false,
      },
    });
    seededUserIds.push(user.id);
    console.log(`Created user: ${user.name} (${user.email})`);
  }
}

// --- Helper: Get a Random User ID ---
function getRandomUserId(): string {
  if (seededUserIds.length === 0) {
    throw new Error('No seeded user IDs available.');
  }
  const randomIndex = Math.floor(Math.random() * seededUserIds.length);
  return seededUserIds[randomIndex];
}

// --- Seed Functions ---
async function createCommunity(): Promise<string> {
  const authorId = getRandomUserId();
  // Generate a unique community name using a company name plus a short UUID suffix.
  const name = `${randCompanyName()} ${randUuid().slice(0, 4)}`;
  const community = await prisma.community.create({
    data: {
      name,
      description: Array.from({ length: 2 }, () => randParagraph()).join(' '),
      // Use Picsum for a random 300x300 image.
      image: `https://picsum.photos/300/300?random=${randNumber({ min: 1, max: 1000 })}`,
      authorId,
    },
  });
  console.log(`Created community: ${community.name}`);
  return community.id;
}

async function createPost(communityId: string): Promise<string> {
  const authorId = getRandomUserId();
  const title = randSentence();
  const content = Array.from({ length: 3 }, () => randParagraph()).join("\n\n");
  const plainTextContent = content; // For simplicity, use the same content.
  const post = await prisma.post.create({
    data: {
      title,
      content,
      plainTextContent,
      // Use Picsum for a random 600x400 image.
      cover: `https://picsum.photos/600/400?random=${randNumber({ min: 1, max: 1000 })}`,
      communityId,
      authorId,
    },
  });
  console.log(`  Created post: ${post.title}`);
  return post.id;
}

async function createComment(postId: string, parentId: string | null = null): Promise<void> {
  const authorId = getRandomUserId();
  const content = Array.from({ length: 2 }, () => randSentence()).join(" ");
  await prisma.comment.create({
    data: {
      content,
      postId,
      parentId,
      authorId,
    },
  });
  // Update the post's totalComments counter.
  await prisma.post.update({
    where: { id: postId },
    data: { totalComments: { increment: 1 } },
  });
}

// --- Main Seed Function ---
async function seed() {
  console.log('Starting seed...');
  
  // Create users first.
  await createUsers();

  // Create communities.
  const communityIds: string[] = [];
  for (let i = 0; i < NUM_COMMUNITIES; i++) {
    const communityId = await createCommunity();
    communityIds.push(communityId);
  }

  // For each community, create posts.
  for (const communityId of communityIds) {
    for (let i = 0; i < POSTS_PER_COMMUNITY; i++) {
      const postId = await createPost(communityId);

      // For each post, create top-level comments.
      for (let j = 0; j < COMMENTS_PER_POST; j++) {
        await createComment(postId);
        // With some probability, add a reply to the most recent comment.
        if (Math.random() < REPLY_PROBABILITY) {
          const recentComment = await prisma.comment.findFirst({
            where: { postId },
            orderBy: { createdAt: 'desc' },
            select: { id: true },
          });
          if (recentComment) {
            await createComment(postId, recentComment.id);
          }
        }
      }
    }
  }
  console.log('Seed completed.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
