/**
 * database에서 사용되는 entity.
 * ObjectType 데코레이터가 Restaurant 엔티티 값을 지정해준다.
 * Field 데코레이터로 Type 지정. nullable도 지정가능.
 */
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Restaurant {
  @Field((type) => String)
  name: string;

  @Field((type) => Boolean)
  isVegan: boolean;

  @Field((type) => String)
  address: string;

  @Field((type) => String)
  ownersName: string;
}
