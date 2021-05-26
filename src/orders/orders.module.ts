/**
 * Order 모듈.
 */

import { Module } from '@nestjs/common';
import { OrderService } from './orders.service';
import { OrderResolver } from './orders.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  providers: [OrderService, OrderResolver],
})
export class OrdersModule {}
