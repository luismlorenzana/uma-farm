import { BadRequestException, Body, ConflictException, Controller, Get, Inject, Logger, Put } from '@nestjs/common'
import { parseSavePut, SaveParseError, versionOf, type SaveEnvelope } from '@farm/domain'
import { CurrentUid } from '@luismlorenzana/uma-server/auth'
import { RevisionConflict, SAVE_REPOSITORY, type SaveRepository } from './save.repository'

// GET and PUT /api/save, behind the owner guard (copied from uma-rpg at 30a322a, F3). The server stores what the app sent
// and never edits a save (FM10). It takes v2 and v3 as sent (F17): the live app writes v3 from F24, carrying a stored v2
// over on the phone. An upload older than what's stored (an old cached Wilds build after the v3) is refused with a 409 and
// kept in `saveRescues`.
@Controller('save')
export class SaveController {
  private readonly logger = new Logger(SaveController.name)

  constructor(@Inject(SAVE_REPOSITORY) private readonly saves: SaveRepository) {}

  @Get()
  load(@CurrentUid() uid: string): Promise<SaveEnvelope> {
    return this.saves.load(uid)
  }

  /** 409 carries the stored envelope so the client can reconcile and retry (uma-rpg D32). */
  @Put()
  async put(@CurrentUid() uid: string, @Body() body: unknown): Promise<SaveEnvelope> {
    let request: ReturnType<typeof parseSavePut>
    try {
      request = parseSavePut(body)
    } catch (err) {
      await this.keepRefused(uid, body, err)
      if (err instanceof SaveParseError) throw new BadRequestException(err.message)
      throw err
    }
    if (request.save.account.uid !== uid) {
      await this.keepRefused(uid, body, new Error('save belongs to another account'))
      throw new BadRequestException('save belongs to another account')
    }
    try {
      return await this.saves.put(uid, request.baseRevision, request.save, request.sentVersion)
    } catch (err) {
      if (err instanceof RevisionConflict) {
        // A stale revision just syncs again; an older version may hold play that can never be uploaded, so it's kept.
        if (request.sentVersion < versionOf(err.current.save)) await this.keepRefused(uid, body, new Error(`save version ${request.sentVersion} is older than the stored ${versionOf(err.current.save)}`))
        throw new ConflictException({ message: 'revision conflict', current: err.current })
      }
      await this.keepRefused(uid, body, err)
      throw err
    }
  }

  /** A refused upload may be the only copy of days of play (uma-rpg D260), so it's kept, and failing to keep it never
   * hides why. */
  private async keepRefused(uid: string, body: unknown, err: unknown): Promise<void> {
    const reason = err instanceof Error ? err.message : String(err)
    this.logger.error(`Save upload refused: ${reason}`)
    try {
      await this.saves.rescue(uid, body, reason)
    } catch (failure) {
      this.logger.error(`Save rescue failed: ${failure instanceof Error ? failure.message : String(failure)}`)
    }
  }
}
