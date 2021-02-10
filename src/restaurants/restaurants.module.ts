/**
 * Restaurant 모듈. Restaurant의 provider인 RestaurantResolver를 포함.
 */
import { Module } from '@nestjs/common';
import { RestaurantResolver } from './restaurants.resolver';

@Module({
  providers: [RestaurantResolver],
})
export class RestaurantsModule {}
