/**
 * Dish의 데이터를 수정할 때 사용하는 dto.
 */

import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Dish } from '../entities/dish.entity';

@InputType()
export class EditDishInput extends PickType(PartialType(Dish), [
  'name',
  'options',
  'price',
  'description',
]) {
  @Field((type) => Number)
  dishId: number;
}

@ObjectType()
export class EditDishOutput extends CoreOutput {}
