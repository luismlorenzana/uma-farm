import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { googleVerifier } from '../post/ping.controller'
import { PushController } from './push.controller'
import { FirestorePushRepository, MemoryPushRepository, PUSH_REPOSITORY, type PushRepository } from './push.repository'
import { PushSender } from './push.sender'
import { PushService } from './push.service'
import { SchedulerGuard, TICK_VERIFIER } from './scheduler.guard'

// Copied from uma-rpg's push module at 30a322a, without its save repository: the farm's push never reads a save.
@Module({
  controllers: [PushController],
  providers: [
    { provide: TICK_VERIFIER, useFactory: googleVerifier },
    SchedulerGuard,
    PushSender,
    PushService,
    {
      provide: PUSH_REPOSITORY,
      inject: [ConfigService],
      useFactory: (config: ConfigService): PushRepository =>
        (config.get<string>('PERSISTENCE') ?? 'local') === 'firestore'
          ? new FirestorePushRepository(config.get<string>('FIRESTORE_DATABASE') ?? 'farm')
          : new MemoryPushRepository(),
    },
  ],
})
export class PushModule {}
