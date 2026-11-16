import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return app info object', () => {
      const result = appController.getHello();
      expect(result).toHaveProperty('name', 'Homestay & Hotel Booking API');
      expect(result).toHaveProperty('status', 'online');
    });
  });
});
