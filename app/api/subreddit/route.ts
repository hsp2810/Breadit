import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { SubredditValidator } from "@/lib/validators/subreddit";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name } = SubredditValidator.parse(body);

    const subredditExist = await db.subreddit.findFirst({
      where: {
        name,
      },
    });
    if (subredditExist) {
      return new Response("Subreddit already exist", { status: 400 });
    }

    const newSubreddit = await db.subreddit.create({
      data: {
        name,
        creatorId: session.user.id,
      },
    });

    await db.subscription.create({
      data: {
        userId: session.user.id,
        subredditId: newSubreddit.id,
      },
    });

    return new Response(newSubreddit.name);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 402 });
    }

    return new Response("Not able to create the subreddit", { status: 500 });
  }
}
