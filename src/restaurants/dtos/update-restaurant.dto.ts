// Restaurant 데이터를 수정하는 DTO.
// CreateRestaurantDto를 UpdateRestaurantInputType에 상속받고,
// 필요한 id 값을 UpdateRestaurantDto에 추가해준다.

import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateRestaurantDto } from './create-restaurant.dto';

@InputType()
class UpdateRestaurantInputType extends PartialType(CreateRestaurantDto) {}

@InputType()
export class UpdateRestaurantDto {
  @Field((type) => Number)
  id: number;

  @Field((type) => UpdateRestaurantInputType)
  data: UpdateRestaurantInputType;
}
