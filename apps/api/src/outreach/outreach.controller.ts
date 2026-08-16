import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { OutreachDraft } from '@job-agent/shared';
import { OutreachService } from './outreach.service';
import type { CreateOutreachDraftDto } from './dto/create-outreach-draft.dto';

@Controller('outreach')
export class OutreachController {
  constructor(private readonly outreachService: OutreachService) {}

  @Post()
  createDraft(@Body() dto: CreateOutreachDraftDto): Promise<OutreachDraft> {
    return this.outreachService.createDraft(dto);
  }

  @Get()
  list(): Promise<OutreachDraft[]> {
    return this.outreachService.list();
  }

  /**
   * There is deliberately no send endpoint anywhere in this codebase — the
   * dashboard hands the human a mailto: link and they send it themselves.
   * This only records that status change after the fact.
   */
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'sent',
  ): Promise<OutreachDraft> {
    return this.outreachService.updateStatus(id, status);
  }
}
