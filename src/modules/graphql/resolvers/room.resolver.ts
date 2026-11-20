import { Resolver, Query, Args } from '@nestjs/graphql';
import { RoomGqlType } from '../types/room.type.js';
import { RoomsService } from '../../rooms/rooms.service.js';

/**
 * Bài 13: GraphQL Resolver cho Homestay / Room
 */
@Resolver(() => RoomGqlType)
export class RoomResolver {
  constructor(private readonly roomsService: RoomsService) {}

  @Query(() => [RoomGqlType], { name: 'getRooms', description: 'Lấy tất cả các phòng homestay' })
  async getRooms(): Promise<RoomGqlType[]> {
    const result = await this.roomsService.findAll({});
    const rooms: any[] = Array.isArray(result) ? result : (result as any).items || [];
    return rooms.map((r) => this.mapToGql(r));
  }

  @Query(() => RoomGqlType, { name: 'getRoomById', description: 'Xem chi tiết phòng theo ID' })
  async getRoomById(@Args('id', { type: () => String }) id: string): Promise<RoomGqlType> {
    const room = await this.roomsService.findById(id);
    return this.mapToGql(room);
  }

  private mapToGql(r: any): RoomGqlType {
    return {
      id: r._id.toString(),
      name: r.name,
      description: r.description,
      roomType: r.roomType,
      pricePerNight: r.pricePerNight,
      capacity: r.capacity,
      amenities: r.amenities || [],
      images: r.images || [],
      address: {
        street: r.address?.street,
        district: r.address?.district,
        city: r.address?.city || '',
        country: r.address?.country,
      },
      status: r.status,
      rating: r.rating || 5,
      totalReviews: r.totalReviews || 0,
    };
  }
}
