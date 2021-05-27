/**
 * 하나의 주문 데이터를 수정할 때 사용하는 dto.
 * 변경하고자 하는 주문 id와 status가 필요하다
 */
import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Order } from '../entities/order.entity';

@InputType()
export class EditOrderInput extends PickType(Order, ['id', 'status']) {}

@ObjectType()
export class EditOrderOutput extends CoreOutput {}
