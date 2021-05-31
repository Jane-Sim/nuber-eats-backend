/**
 * Payment 리졸버.
 * Payment 엔티티와 서비스를 주입해서 사용한다.
 */
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Roles } from 'src/auth/role.decorator';
import { User } from 'src/users/entities/user.entity';
import {
  CreatePaymentInput,
  CreatePaymentOuput,
} from './dtos/create-payment.dto';
import { GetPaymentsOutput } from './dtos/get-payments.dto';
import { Payment } from './entities/payment.entity';
import { PaymentService } from './payments.service';

@Resolver((of) => Payment)
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}

  // owner가 홍보할 레스토랑의 payment를 생성하는 Mutation
  @Mutation((returns) => CreatePaymentOuput)
  @Roles('Owner')
  createPayment(
    @AuthUser() owner: User,
    @Args('input') createPaymentInput: CreatePaymentInput,
  ): Promise<CreatePaymentOuput> {
    return this.paymentService.createPayment(owner, createPaymentInput);
  }

  // 현재 Owner 유저의 payments 를 가져오는 Query
  @Query((returns) => GetPaymentsOutput)
  @Roles('Owner')
  getPayments(@AuthUser() user: User): Promise<GetPaymentsOutput> {
    return this.paymentService.getPayments(user);
  }
}
