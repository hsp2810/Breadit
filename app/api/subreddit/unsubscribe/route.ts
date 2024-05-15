import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { SubredditSubscriptionValidator } from "@/lib/validators/subreddit";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    const { subredditId } = SubredditSubscriptionValidator.parse(body);

    const subscriptionExist = await db.subscription.findFirst({
      where: {
        subredditId,
        userId: session.user.id,
      },
    });
    if (!subscriptionExist) {
      return new Response("You are not subscribed to this subreddit", {
        status: 400,
      });
    }

    // if the user is the creator of the subreddit they cannot leave the subreddit
    const subreddit = await db.subreddit.findFirst({
      where: {
        id: subredditId,
        creatorId: session.user.id,
      },
    });

    if (subreddit) {
      return new Response("Creators cannot leave their own subreddits", {
        status: 400,
      });
    }

    await db.subscription.delete({
      where: {
        userId_subredditId: {
          subredditId,
          userId: session.user.id,
        },
      },
    });

    return new Response(subredditId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response("Invalid request data passed", { status: 402 });
    }

    return new Response("Not able to unsubscribe to the subreddit", {
      status: 500,
    });
  }
}
