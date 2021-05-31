/**
 * Payment 서비스.
 */
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { LessThan, Repository } from 'typeorm';
import {
  CreatePaymentInput,
  CreatePaymentOuput,
} from './dtos/create-payment.dto';
import { GetPaymentsOutput } from './dtos/get-payments.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  // owner가 홍보할 레스토랑의 payment를 생성하는 함수
  async createPayment(
    owner: User,
    { transactionId, restaurantId }: CreatePaymentInput,
  ): Promise<CreatePaymentOuput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      /** defensive programming 시작. */
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found.',
        };
      }
      if (restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'You are not allowed to do this.',
        };
      }
      /** defensive programming 종료. */
      // paddle의 id와 owner, 홍보할 restaurant을 payment에 저장한다.
      await this.payments.save(
        this.payments.create({
          transactionId,
          user: owner,
          restaurant,
        }),
      );
      // 해당 레스토랑의 프로모션 체크 후,
      restaurant.isPromoted = true;
      //현재 시간으로부터 7일간 프로모션 기간을 설정한다.
      const date = new Date();
      date.setDate(date.getDate() + 7);
      restaurant.promotedUntil = date;
      // 설정한 내용으로 해당 레스토랑을 업데이트한다.
      this.restaurants.save(restaurant);
      return {
        ok: true,
      };
    } catch {
      return { ok: false, error: 'Could not create payment.' };
    }
  }

  // 특정 유저의 payments를 반환하는 함수
  async getPayments(user: User): Promise<GetPaymentsOutput> {
    try {
      const payments = await this.payments.find({ user: user });
      return {
        ok: true,
        payments,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load payments.',
      };
    }
  }

  // 매일 정각 12시에, 오늘 날짜보다 지난 날짜의 프로모션 레스토랑이 있다면,
  // 해당 프로모션을 지워주는 Cron 데코레이터를 추가한다.
  // typeOrm의 LessThan을 통해, 적은 값의 데이터만 DB에서 가져오도록한다.
  // @Cron(second/minute/hour/day of month/month/day of week)
  // @Cron('0 0 0 * * *')
  // CronExpression을 이용해 편리하게 사용할 수 있다.
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkPromotedRestaurants(): Promise<void> {
    const restaurants = await this.restaurants.find({
      isPromoted: true,
      promotedUntil: LessThan(new Date()),
    });
    // 날짜가 지난 프로모션 수만큼 for문을 돌아, 프로모션을 삭제해준다.
    restaurants.forEach(async (restaurant) => {
      restaurant.isPromoted = false;
      restaurant.promotedUntil = null;
      await this.restaurants.save(restaurant);
    });
  }
}
