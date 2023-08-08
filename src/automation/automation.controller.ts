import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { Req } from '@nestjs/common';
import { Request, Response } from 'express';
import { CreateAutomationDto } from './dto/CreateAutomation.dto';
import { AutomationService } from './automation.service';

@Controller('automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}
  @Post()
  async storeAutomation(@Body() createAutomationDto: CreateAutomationDto) {
    const createdAutomation = await this.automationService.storeAutomation(
      createAutomationDto,
    );
    return createdAutomation;
  }
  @Get()
  async getAllAutomations(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
  ) {
    const data = await this.automationService.getAllAutomations(page, pageSize);
    return data;
  }

  @Put(':id')
  async updateData(
    @Body() createAutomationDto: CreateAutomationDto,
    @Param('id') id: string,
  ) {
    const data = await this.automationService.updateData(
      +id,
      createAutomationDto,
    );
    return data;
  }
  @Delete(':id')
  async deleteData(@Param('id') id: string) {
    return this.automationService.deleteData(+id);
  }

  @Get('/test')
  async runAutomation() {
    return this.automationService.runAutomation();
  }

  @Get(':id')
  async findAutomation(@Param('id') id: string) {
    return this.automationService.findAutomation(+id);
  }

  @Get('/test')
  async test() {
    await this.automationService.runAutomation();
  }
}
