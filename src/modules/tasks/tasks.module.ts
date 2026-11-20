import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { BookingsModule } from '../bookings/bookings.module.js';

@Module({
  imports: [BookingsModule],
  providers: [TasksService],
})
export class TasksModule {}
