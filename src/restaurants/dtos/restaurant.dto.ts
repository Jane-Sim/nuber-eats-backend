/**
 * 하나의 레스토랑 데이터를 반환하는 dto.
 */
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { PaginationOutput } from 'src/common/dtos/pagination.dto';
import { Restaurant } from '../entities/restaurant.entity';

@InputType()
export class RestaurantInput {
  @Field((type) => Int)
  restaurantId: number;
}

@ObjectType()
export class RestaurantOutput extends PaginationOutput {
  @Field((type) => Restaurant, { nullable: true })
  restaurant?: Restaurant;
}
