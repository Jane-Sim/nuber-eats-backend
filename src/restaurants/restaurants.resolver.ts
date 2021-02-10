import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';

// Resolver 데코레이터. graphql이 스키마를 생성하는데 자동으로 resolver를 찾을 수 있도록 돕는다.
@Resolver((of) => Restaurant)
export class RestaurantResolver {
  // Query 데코레이터는 typeFunc 값을 받기에, 반환 type을 function 형식으로 지정해야 한다.
  // Query에서 인자값 "() => [Restaurant]"는 해당 graphql은 타입 Restaurant를 배열로 반환한다는 뜻.
  // restaurants에서 veganOnly 인자를 boolean 값으로 받을 때, 인자 값을 바로 사용가능하다. restaurants은 Restaurant를 배열로 반환
  @Query((returns) => [Restaurant])
  restaurants(@Args('veganOnly') veganOnly: boolean): Restaurant[] {
    return [];
  }

  // 데이터를 추가&수정하는 Mutation 데코레이터.
  // ArgsType데코레이터를 사용하는 Dto를 통해, 클라이언트에서 인자 값을 쉽게 받아옴.
  @Mutation((returns) => Boolean)
  createRestaurant(@Args() createRestaurantDto: CreateRestaurantDto): boolean {
    return true;
  }
}
