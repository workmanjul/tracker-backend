import { Get, Controller, Query } from '@nestjs/common';
import { AutomationlogService } from './automationlog.service';

@Controller('automationlog')
export class AutomationlogController {
  constructor(private readonly automationlog: AutomationlogService) {}
  @Get()
  async getAutomationLog(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
  ) {
    return await this.automationlog.findAllAutomationLog(page, pageSize);
  }
}
