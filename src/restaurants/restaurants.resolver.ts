/**
 * restaurant 리졸버.
 * restaurant 엔티티와 서비스를 주입해서 사용한다.
 */

import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Roles } from 'src/auth/role.decorator';
import { User } from 'src/users/entities/user.entity';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurants.service';

// Resolver 데코레이터. graphql이 스키마를 생성하는데 자동으로 resolver를 찾을 수 있도록 돕는다.
@Resolver((of) => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  // 레스토랑을 생성하는 Mutation. Owner role을 가진 유저만 실행가능.
  // @SetMetadata를 통해, Resolver를 실행시킬 수 있는 권한을 부여할 수 있다.
  // InputType데코레이터를 사용하는 CreateRestaurantInput을 통해, 클라이언트에서 인자 값을 쉽게 받아옴.
  // createRestaurant 서비스의 비동기 함수를 받기 위해 async, await 사용.
  // Restaurant entity를 생성할 때, 로그인 한 유저의 정보를 owner로 지정.
  @Mutation((returns) => CreateRestaurantOutput)
  @Roles('Owner')
  async createRestaurant(
    @AuthUser() authUser: User,
    @Args('input') createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    return await this.restaurantService.createRestaurant(
      authUser,
      createRestaurantInput,
    );
  }

  // 레스토랑 정보를 수정하는 Mutation. Owner role을 가진 유저만 실행가능.
  @Mutation((returns) => EditRestaurantOutput)
  @Roles('Owner')
  async EditRestaurant(
    @AuthUser() owner: User,
    @Args('input') editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    return await this.restaurantService.editRestaurant(
      owner,
      editRestaurantInput,
    );
  }

  // 레스토랑을 삭제하는 Mutation. Owner role을 가진 유저만 실행가능.
  @Mutation((returns) => DeleteRestaurantOutput)
  @Roles('Owner')
  deleteRestaurant(
    @AuthUser() owner: User,
    @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    return this.restaurantService.deleteRestaurant(
      owner,
      deleteRestaurantInput,
    );
  }
}
