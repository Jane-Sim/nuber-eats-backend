/**
 * SetMetadata 데코레이터를 커스텀하여 사용하는 Setting roles per handler Guard 파일.
 * User entity에서 지정한 UserRole의 역할 Client, Owner, Delivery / Any 역할에서만, 해당 유저가 접근 가능하도록 설정한다.
 * 설정한 SetMetadata에서 지정한 role들은, AuthGuard class에서 reflector를 통해 불러올 수 있다.
 * @Roles 데코레이터를 원하는 resolver나 controller에서 사용하면 된다.
 */

import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/entities/user.entity';

export type AllowedRoles = keyof typeof UserRole | 'Any';

export const Roles = (...roles: AllowedRoles[]) => SetMetadata('roles', roles);
