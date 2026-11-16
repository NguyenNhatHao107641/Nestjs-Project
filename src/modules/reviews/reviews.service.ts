import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../../entities/review.entity.js';
import { RoomsService } from '../rooms/rooms.service.js';
import { UserRole } from '../../entities/user.entity.js';
import { CreateReviewDto } from './dto/create-review.dto.js';

/**
 * Bài 03: ReviewsService xử lý đánh giá và xếp hạng phòng
 */
@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    private readonly roomsService: RoomsService,
  ) {}

  async create(
    customerId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<ReviewDocument> {
    const room = await this.roomsService.findById(createReviewDto.roomId);
    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng để đánh giá');
    }

    const review = new this.reviewModel({
      customerId: new Types.ObjectId(customerId),
      roomId: room._id,
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
    });

    const savedReview = await review.save();

    // Tính toán lại điểm trung bình cho Homestay / Khách sạn
    const allReviews = await this.reviewModel
      .find({ roomId: room._id })
      .exec();

    const totalReviews = allReviews.length;
    const avgRating =
      totalReviews > 0
        ? Number(
            (
              allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            ).toFixed(1),
          )
        : 5;

    await this.roomsService.updateRating(room._id, avgRating, totalReviews);

    return savedReview;
  }

  async findByRoom(roomId: Types.ObjectId | string): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({ roomId: new Types.ObjectId(roomId) })
      .populate('customerId', 'fullName avatar')
      .sort({ createdAt: -1 })
      .exec();
  }

  async remove(
    id: Types.ObjectId | string,
    userId: string,
    userRole: string,
  ): Promise<{ message: string }> {
    const review = await this.reviewModel.findById(id).exec();
    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    if (
      userRole !== UserRole.ADMIN &&
      review.customerId.toString() !== userId.toString()
    ) {
      throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
    }

    await this.reviewModel.findByIdAndDelete(id).exec();
    return { message: 'Đã xóa đánh giá thành công' };
  }
}
