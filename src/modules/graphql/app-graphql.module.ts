import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { RoomResolver } from './resolvers/room.resolver.js';
import { RoomsModule } from '../rooms/rooms.module.js';

/**
 * Bài 13: Cấu hình GraphQL Module với Apollo Driver
 */
@Module({
  imports: [
    RoomsModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
      path: '/graphql',
      introspection: true,
    }),
  ],
  providers: [RoomResolver],
})
export class AppGraphQLModule {}
