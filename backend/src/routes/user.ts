import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import {signupInput,signinInput} from "@rahuloverhere/wordcraft-common";

export const userRouter = new Hono<{
	Bindings: {
		DATABASE_URL: string,
		JWT_SECRET: string,
	}
}>();


userRouter.post('/signup', async (c) => {
  const body = await c.req.json();
  const success=signupInput.safeParse(body)
	const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  if(!success){
    c.status(411);
    return c.json({
      message:"Input not correct"
    })
  }

  const user = await prisma.user.create({
    data: {
      username: body.username,
      password: body.password,
    },
  });

  const token = await sign({ id: user.id }, c.env.JWT_SECRET)

  return c.json({
    jwt: token
  })
})


userRouter.post('/api/v1/signin', async (c) => {
  const body = await c.req.json();
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const user = await prisma.user.findUnique({
		where: {
			username: body.username,
      password: body.password
		}
	});

	if (!user) {
		c.status(403);
		return c.json({ error: "user not found" });
	}

	const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
	return c.json({ jwt });
})

