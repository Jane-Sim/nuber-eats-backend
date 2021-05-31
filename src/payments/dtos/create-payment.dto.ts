/**
 * payment 데이터를 생성하기 위한 CreatePaymentInput dto와
 * 생성 유무를 사용자에게 알려주기 위한 CreatePaymentOuput dto.
 */
import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Payment } from '../entities/payment.entity';

@InputType()
export class CreatePaymentInput extends PickType(Payment, [
  'transactionId',
  'restaurantId',
]) {}

@ObjectType()
export class CreatePaymentOuput extends CoreOutput {}
