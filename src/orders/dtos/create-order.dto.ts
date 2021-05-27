/**
 * order 생성시 사용하는 dto
 */
import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { OrderItemOption } from '../entities/order-item.entity';

// 어떤 dish의 OrderItem인지 찾기 필요한 dishId 속성 값과, 해당 dish에 필요한 options 속성 값을 추가한다.
@InputType()
class CreateOrderItemInput {
  @Field((type) => Number)
  dishId: number;

  @Field((type) => [OrderItemOption], { nullable: true })
  options?: OrderItemOption[];
}

// 해당 order가 어떤 레스토랑의 오더인지, restaurantId 속성 값과 dish의 정보를 담는 items 속성 값을 추가한다.
@InputType()
export class CreateOrderInput {
  @Field((type) => Number)
  restaurantId: number;

  @Field((type) => [CreateOrderItemInput])
  items: CreateOrderItemInput[];
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {}
