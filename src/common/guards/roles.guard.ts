import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { UserRole } from '../../entities/user.entity.js';

/**
 * Bài 09: Guard kiểm tra quyền (RBAC: Admin, Host, Customer)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    let req: any;
    if (context.getType<string>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      req = gqlContext.getContext().req;
    } else {
      req = context.switchToHttp().getRequest();
    }

    const user = req?.user;
    if (!user || !user.role) {
      throw new ForbiddenException('Bạn không có quyền truy cập chức năng này');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Quyền '${user.role}' không được phép thực hiện hành động này. Yêu cầu: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
