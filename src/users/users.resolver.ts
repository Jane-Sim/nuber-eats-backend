/**
 * user 리졸버.
 * user 엔티티와 서비스를 주입해서 사용한다.
 */

import { Query, Resolver } from '@nestjs/graphql';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver((of) => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query((returns) => Boolean)
  hi(): boolean {
    return true;
  }
}
