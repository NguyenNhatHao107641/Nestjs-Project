import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingsService } from '../bookings/bookings.service.js';

/**
 * TasksService — các job định kỳ (cron) của hệ thống.
 * - Mỗi ngày 00:05: tự động chuyển các đơn đã hết hạn checkout (confirmed) → completed.
 */
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly bookingsService: BookingsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { name: 'auto-complete-bookings' })
  async autoCompleteExpiredBookings() {
    try {
      const count = await this.bookingsService.autoCompleteExpired();
      if (count > 0) {
        this.logger.log(`Đã tự động hoàn thành ${count} đơn đặt phòng quá hạn checkout.`);
      }
    } catch (err) {
      this.logger.error('Lỗi khi tự động hoàn thành booking quá hạn', err as Error);
    }
  }
}
