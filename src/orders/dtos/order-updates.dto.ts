/**
 * 특정 order를 실시간 구독할 때, 사용하는 dto.
 */
import { InputType, PickType } from '@nestjs/graphql';
import { Order } from '../entities/order.entity';

@InputType()
export class OrderUpdatesInput extends PickType(Order, ['id']) {}
