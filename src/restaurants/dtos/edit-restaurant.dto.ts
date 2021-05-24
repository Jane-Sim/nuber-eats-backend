/**
 * restaurant의 데이터를 수정할 때 사용하는 dto.
 *  CreateRestaurantInput의 속성 값을 optional하게 상속받은 후, 업데이트에 필요한 restaurant Id 속성 값을 만든다.
 */

import { Field, InputType, ObjectType, PartialType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { CreateRestaurantInput } from './create-restaurant.dto';

@InputType()
export class EditRestaurantInput extends PartialType(CreateRestaurantInput) {
  @Field((type) => Number)
  restaurantId: number;
}

@ObjectType()
export class EditRestaurantOutput extends CoreOutput {}
