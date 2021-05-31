/**
 * Payment 리졸버.
 * Payment 엔티티와 서비스를 주입해서 사용한다.
 */
import { Resolver } from '@nestjs/graphql';
import { Payment } from './entities/payment.entity';
import { PaymentService } from './payments.service';

@Resolver((of) => Payment)
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}
}
