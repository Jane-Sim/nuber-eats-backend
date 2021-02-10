/**
 * 주고 받는 데이터의 타입을 지정하는 dto.
 * restaurant의 데이터를 생성할 때 사용한다.
 * ArgsType 데코레이터를 통해, 클라이언트가 전달하는 인자 값으로 데이터를 생성.
 */
import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class CreateRestaurantDto {
  @Field((type) => String)
  name: string;
  @Field((type) => Boolean)
  isVegan: boolean;
  @Field((type) => String)
  adddress: string;
  @Field((type) => String)
  ownersName: string;
}
