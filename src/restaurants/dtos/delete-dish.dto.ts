/**
 * dish 데이터를 삭제할 때 사용하는 dto.
 */

import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class DeleteDishInput {
  @Field((type) => Number)
  dishId: number;
}

@ObjectType()
export class DeleteDishOutput extends CoreOutput {}
