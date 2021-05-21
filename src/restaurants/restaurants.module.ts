/**
 * Restaurant 모듈. imports와 providers로 restaurant에 필요한
 * 데이터베이스, 서비스, 리졸버를 추가한다.
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurants.service';
import { RestaurantResolver } from './restaurants.resolver';
import { Category } from './entities/category.entity';

// Restaurant의 데이터베이스 역할인 entity를 가져와서 (import)
// service에 주입한다. (Inject)
// resolver에서 service가 가져온 데이터를 클라이언트에 반환한다.
@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category])],
  providers: [RestaurantResolver, RestaurantService],
})
export class RestaurantsModule {}
