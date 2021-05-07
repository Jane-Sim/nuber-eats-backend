/**
 * restaurant 리졸버.
 * restaurant 엔티티와 서비스를 주입해서 사용한다.
 */

import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurants.service';

// Resolver 데코레이터. graphql이 스키마를 생성하는데 자동으로 resolver를 찾을 수 있도록 돕는다.
@Resolver((of) => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  // Query 데코레이터는 typeFunc 값을 받기에, 반환 type을 function 형식으로 지정해야 한다.
  // Query에서 인자값 "() => [Restaurant]"는 해당 graphql은 타입 Restaurant를 배열로 반환한다는 뜻.
  // restaurants에서 veganOnly 인자를 boolean 값으로 받을 때, 인자 값을 바로 사용가능하다. restaurants은 Restaurant를 배열로 반환
  @Query((returns) => [Restaurant])
  restaurants(): Promise<Restaurant[]> {
    return this.restaurantService.getAll();
  }

  // 데이터를 추가 Mutation 데코레이터.
  // InputType데코레이터를 사용하는 Dto를 통해, 클라이언트에서 인자 값을 쉽게 받아옴.
  // createRestaurant 서비스의 비동기 함수를 받기 위해 async, await 사용.
  @Mutation((returns) => Boolean)
  async createRestaurant(
    @Args('input') createRestaurantDto: CreateRestaurantDto,
  ): Promise<boolean> {
    try {
      await this.restaurantService.createRestaurant(createRestaurantDto);
      return true;
    } catch (e) {
      return false;
    }
  }

  // restaurant 데이터를 수정하는 Mutation.
  // {id, data} 로 보내는 inputType의 DTO를 updateRestaurant 서비스로 전달.
  // 만약 typeORM에서 해당 restaurant 데이터를 못 찾으면, catch 문에 걸리고
  // 데이터를 잘 찾아서 업데이트 했다면 try 문에 걸린다.
  @Mutation((returns) => Boolean)
  async updateRestaurant(
    @Args('input') updateRestaurantDto: UpdateRestaurantDto,
  ): Promise<boolean> {
    try {
      await this.restaurantService.updateRestaurant(updateRestaurantDto);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
