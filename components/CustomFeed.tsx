import { INFINITE_SCROLLING_PAGINATION_RESULTS } from "@/config";
import { db } from "@/lib/prisma";
import PostFeed from "./PostFeed";
import { getAuthSession } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export default async function CustomFeed() {
  const session = await getAuthSession();

  //Get the subscribed communities
  const followedCommunities = await db.subscription.findMany({
    where: {
      userId: session?.user.id,
    },
    include: {
      subreddit: true,
    },
  });

  const posts = await db.post.findMany({
    where: {
      subreddit: {
        name: {
          in: followedCommunities.map((comm) => comm.subreddit.id),
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },

    include: {
      votes: true,
      author: true,
      comments: true,
      subreddit: true,
    },

    take: INFINITE_SCROLLING_PAGINATION_RESULTS,
  });

  if (!posts) {
    return (
      <li className='flex justify-center'>
        <Loader2 className='w-6 h-6 text-zinc-500 animate-spin' />
      </li>
    );
  }

  return <PostFeed initialPosts={posts} />;
}
