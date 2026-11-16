import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    let req: any;
    if (ctx.getType<string>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(ctx);
      req = gqlContext.getContext().req;
    } else {
      req = ctx.switchToHttp().getRequest();
    }

    const user = req?.user;
    return data && user ? user[data] : user;
  },
);
