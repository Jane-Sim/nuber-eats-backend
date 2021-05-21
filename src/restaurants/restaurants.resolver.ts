/**
 * restaurant 리졸버.
 * restaurant 엔티티와 서비스를 주입해서 사용한다.
 */

import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { User } from 'src/users/entities/user.entity';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurants.service';

// Resolver 데코레이터. graphql이 스키마를 생성하는데 자동으로 resolver를 찾을 수 있도록 돕는다.
@Resolver((of) => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  // 데이터를 추가 Mutation 데코레이터.
  // InputType데코레이터를 사용하는 CreateRestaurantInput을 통해, 클라이언트에서 인자 값을 쉽게 받아옴.
  // createRestaurant 서비스의 비동기 함수를 받기 위해 async, await 사용.
  // Restaurant entity를 생성할 때, 로그인 한 유저의 정보를 owner로 지정.
  @Mutation((returns) => CreateRestaurantOutput)
  async createRestaurant(
    @AuthUser() authUser: User,
    @Args('input') createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    return await this.restaurantService.createRestaurant(
      authUser,
      createRestaurantInput,
    );
  }
}
