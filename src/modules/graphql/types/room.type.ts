import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class AddressGqlType {
  @Field({ nullable: true })
  street?: string;

  @Field({ nullable: true })
  district?: string;

  @Field()
  city!: string;

  @Field({ nullable: true })
  country?: string;
}

@ObjectType()
export class RoomGqlType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  description!: string;

  @Field()
  roomType!: string;

  @Field(() => Float)
  pricePerNight!: number;

  @Field(() => Int)
  capacity!: number;

  @Field(() => [String])
  amenities!: string[];

  @Field(() => [String])
  images!: string[];

  @Field(() => AddressGqlType)
  address!: AddressGqlType;

  @Field()
  status!: string;

  @Field(() => Float)
  rating!: number;

  @Field(() => Int)
  totalReviews!: number;
}
