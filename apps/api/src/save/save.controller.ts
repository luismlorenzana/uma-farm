import { BadRequestException, Body, ConflictException, Controller, Get, Inject, Logger, Put } from '@nestjs/common'
import { parseSavePut, SaveParseError, versionOf, type SaveEnvelope } from '@farm/domain'
import { CurrentUid } from '@luismlorenzana/uma-server/auth'
import { RevisionConflict, SAVE_REPOSITORY, type SaveRepository } from './save.repository'

// GET and PUT /api/save, behind the owner guard (copied from uma-rpg at 30a322a).
// GET reads v5 and v6 in full and v1–v4 as version and account. PUT accepts v6.
// Refused uploads go to saveRescues. On upgrade the repository backs up the original document.
@Controller('save')
export class SaveController {
  private readonly logger = new Logger(SaveController.name)

  constructor(@Inject(SAVE_REPOSITORY) private readonly saves: SaveRepository) {}

  @Get()
  load(@CurrentUid() uid: string): Promise<SaveEnvelope> {
    return this.saves.load(uid)
  }

  /** 409 carries the stored envelope so the client can reconcile and retry. */
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
      return await this.saves.put(uid, request.baseRevision, request.save)
    } catch (err) {
      if (err instanceof RevisionConflict) {
        // A stale revision just syncs again; an older version may hold play that can never be uploaded, so it's kept.
        if (request.save.version < versionOf(err.current.save)) await this.keepRefused(uid, body, new Error(`save version ${request.save.version} is older than the stored ${versionOf(err.current.save)}`))
        throw new ConflictException({ message: 'revision conflict', current: err.current })
      }
      await this.keepRefused(uid, body, err)
      throw err
    }
  }

  /** A refused upload may be the only copy of days of play, so it's kept, and failing to keep it never
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
