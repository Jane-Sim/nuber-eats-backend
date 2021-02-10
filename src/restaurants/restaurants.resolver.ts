import { Query, Resolver } from '@nestjs/graphql';

// Resolver 데코레이터. graphql이 스키마를 생성하는데 자동으로 resolver를 찾을 수 있도록 돕는다.
@Resolver()
export class RestaurantResolver {
  // Query에서 인자값 "() => Boolean"는 해당 graphql은 Boolean값을 반환한다는 뜻.
  // Query 데코레이터는 typeFunc 값을 받기에, 반환 type을 function으로 지정해야 한다.
  @Query(() => Boolean)
  // isPizzaGood에서 boolean값을 반환하는 TypeScript 타입지정.
  isPizzaGood(): boolean {
    return true;
  }
}
