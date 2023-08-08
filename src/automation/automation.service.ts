import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Query,
} from '@nestjs/common';
import { Automation, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAutomationDto } from './dto/CreateAutomation.dto';
import { PaginationService } from 'src/pagination/pagination.service';
import { Logger } from '@nestjs/common';
import { AutomationlogService } from 'src/automationlog/automationlog.service';

interface Rule {
  id: number;
  days?: string;
  type: string;
  param: string;
  daysAgo: string;
  operand: string;
  averageRPC: string;
  parameters: string;
  categoryRPC: string;
  display_text: string;
  dollarValue: string;
  percentValue: string;
  daysCompareTo: string;
  valuesAdclicks: string;
  daysOfTimeFrame: string;
  budgetAdjustment: string;
  percentageOfTimeFrame: string;
}

interface JoinList {
  [alias: string]: string;
}

interface WithList {
  [alias: string]: string;
}

interface QueryResponse {
  adset_id: string;
  daily_budget: number;
  status: string;
}

@Injectable()
export class AutomationService {
  constructor(
    private prisma: PrismaService,
    private readonly paginationService: PaginationService<Automation>,
    @Inject(AutomationlogService)
    private readonly automationLogService: AutomationlogService,
    private readonly logger: Logger,
  ) {}

  async storeAutomation(createAutomationDto: CreateAutomationDto) {
    const formattedRowsPromises = createAutomationDto.data.map((data) => {
      return this.formatData(data);
    });
    const formattedRows = await Promise.all(formattedRowsPromises);

    // Create a new Date object representing the current date and time
    const currentDate = new Date();

    // Add 10 minutes to the current date
    currentDate.setMinutes(
      currentDate.getMinutes() +
        parseInt(createAutomationDto.automationInMinutes),
    );
    // Retrieve the updated date and time
    const updatedDate = currentDate;
    const displayTextOverall = this.createAutomationDisplayText(formattedRows);
    const automationData = await this.prisma.automation.create({
      data: {
        rules: formattedRows,
        name: createAutomationDto.name,
        automationInMinutes: createAutomationDto.automationInMinutes,
        budgetType: createAutomationDto.budgetType,
        options: createAutomationDto.options,
        status: createAutomationDto.status,
        actionStatus: createAutomationDto.actionStatus,
        budgetAmount: createAutomationDto.budgetAmount,
        budgetPercent: createAutomationDto.budgetPercent,
        displayText: displayTextOverall,
        postToDatabase: createAutomationDto.postToDatabase,
        lastRun: createAutomationDto.lastRun,
        nextRun: updatedDate,
      },
    });
    return automationData;
  }

  // Create display_text
  createAutomationDisplayText(jsonRules: any): string {
    let displayTextOverall = '';
    jsonRules.forEach((rule) => {
      displayTextOverall = displayTextOverall + rule.displayText + '\n';
    });

    return displayTextOverall;
  }

  async formatData(data) {
    let display_text = '';
    if ('param' in data && data['param']) {
      display_text += data.param + ' ';
    }
    if ('daysAgo' in data && data['daysAgo']) {
      display_text += data.daysAgo + ' days ';
    }
    if ('operand' in data && data['operand']) {
      display_text += data.operand + ' ';
    }
    if ('daysValue' in data && data['daysValue']) {
      display_text += data.daysValue + ' days ';
    }

    if ('dollarValue' in data && data['dollarValue']) {
      display_text += data.dollarValue + ' ';
    }
    if ('daysCompareTo' in data && data['daysCompareTo']) {
      display_text += data.daysCompareTo + ' days ago ';
    }
    if ('percentValue' in data && data['percentValue']) {
      display_text += data.percentValue + '%';
    }
    if ('valuesAdclicks' in data && data['valuesAdclicks']) {
      display_text += data.valuesAdclicks + ' ';
    }
    if ('budgetAdjustment' in data && data['budgetAdjustment']) {
      display_text += data.budgetAdjustment + ' ';
    }
    if ('averageRPC' in data && data['averageRPC']) {
      display_text += data.averageRPC + ' ';
    }
    if ('categoryRPC' in data && data['categoryRPC']) {
      display_text += data.categoryRPC + ' ';
    }
    if ('parameters' in data && data['parameters']) {
      display_text += data.parameters + ' ';
    }
    if ('percentageOfTimeFrame' in data && data['percentageOfTimeFrame']) {
      display_text += data.percentageOfTimeFrame + '% of ';
    }
    if ('daysOfTimeFrame' in data && data['daysOfTimeFrame']) {
      display_text += data.daysOfTimeFrame + ' days ago ';
    }
    return { ...data, displayText: display_text };
  }

  async getAllAutomations(
    page = 1,
    pageSize = 10,
  ): Promise<PaginationResponse<Automation>> {
    const skip = (page - 1) * pageSize;
    const take = Number(pageSize);
    const automations = await this.prisma.automation.findMany({
      skip,
      take,
    });
    const formattedAutomations = automations.map((automation) => {
      return {
        id: automation.id,
        rules: JSON.parse(JSON.stringify(automation.rules)),
        name: automation.name,
        options: automation.options,
        budgetType: automation.budgetType,
        status: automation.status,
        actionStatus: automation.actionStatus,
        lastRun: automation.lastRun,
        nextRun: automation.nextRun,
        budgetPercent: automation.budgetPercent,
        budgetAmount: automation.budgetAmount,
        displayText: automation.displayText,
        postToDatabase: automation.postToDatabase,
        automationInMinutes: automation.automationInMinutes,
        createdAt: automation.createdAt,
        updatedAt: automation.updatedAt,
      };
    });
    const totalItems = await this.prisma.user.count(); // Count total number of items
    return this.paginationService.getPaginationData(
      page,
      pageSize,
      formattedAutomations,
      totalItems,
    );
  }

  async updateData(
    id: number,
    createAutomationDto: CreateAutomationDto,
  ): Promise<{ message: string; data: Automation }> {
    const entityToUpdate = await this.prisma.automation.findUnique({
      where: { id },
    });
    if (!entityToUpdate) {
      throw new HttpException(
        {
          message: 'Automation not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
    const formattedRowsPromises = createAutomationDto.data.map((data) => {
      return this.formatData(data);
    });

    // Create a new Date object representing the current date and time
    const currentDate = new Date();

    // Add 10 minutes to the current date
    currentDate.setMinutes(
      currentDate.getMinutes() +
        parseInt(createAutomationDto.automationInMinutes),
    );

    // Retrieve the updated date and time
    const updatedDate = currentDate;
    const formattedRows = await Promise.all(formattedRowsPromises);
    const jsonRules = JSON.parse(JSON.stringify(formattedRows));
    const displayTextOverall = this.createAutomationDisplayText(formattedRows);
    const automation = await this.prisma.automation.update({
      where: { id },
      data: {
        rules: jsonRules,
        name: createAutomationDto.name,
        automationInMinutes: createAutomationDto.automationInMinutes,
        budgetType: createAutomationDto.budgetType,
        options: createAutomationDto.options,
        status: createAutomationDto.status,
        actionStatus: createAutomationDto.actionStatus,
        budgetAmount: createAutomationDto.budgetAmount,
        budgetPercent: createAutomationDto.budgetPercent,
        displayText: displayTextOverall,
        postToDatabase: createAutomationDto.postToDatabase,
        lastRun: createAutomationDto.lastRun,
        nextRun: updatedDate,
      },
    });
    return {
      message: 'Automation updated successfully',
      data: automation,
    };
  }

  async deleteData(id: number): Promise<{ message: string }> {
    const entityToDelete = await this.prisma.automation.findUnique({
      where: { id },
    });
    if (!entityToDelete) {
      throw new HttpException(
        {
          message: 'Input Request',
          errors: { email: 'Automation not found' },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.prisma.automation.delete({ where: { id } });
    return {
      message: 'Automation deleted successfully',
    };
  }

  async findAutomation(id: number): Promise<Automation | null> {
    return await this.prisma.automation.findUnique({ where: { id } });
  }

  //Run Automation
  async runAutomation(): Promise<boolean> {
    this.logger.log('Started Cron Job for RunAutomation');
    try {
      const automations = await this.prisma.automation.findMany({
        where: {
          OR: [{ nextRun: { lte: new Date() } }],
          status: 'active',
        },
      });

      const results: boolean[] = [];
      if (automations.length <= 0) {
        this.logger.log('No Rules Matched. Automation will not run..');
      }

      automations.map(async (automation) => {
        const { automationInMinutes } = automation;
        const rules = JSON.parse(JSON.stringify(automation.rules));

        const adsetTable = 'AdSets';
        const reportView = 'v_spendreport';
        // For each row, generateQuery.
        const query = await this.generateQuery(rules, adsetTable, reportView);
        this.logger.log('Query', query);
        if (query) {
          // Execute the Query.
          const res: QueryResponse[] = await this.prisma.$queryRaw(
            Prisma.sql([query]),
          );

          if (Array.isArray(res) && res.length > 0) {
            res.map((row) => {
              // Execute API Call
              if (automation.postToDatabase) {
                this.logger.log('Execute API CAll, Postint to database..');
                let apiCallAction = '';
                if (automation.options === 'Status') {
                  apiCallAction =
                    automation.options + ' =>  ' + automation.actionStatus;
                } else if (automation.budgetType === 'percentage') {
                  apiCallAction =
                    automation.options +
                    ' =>  ' +
                    automation.budgetPercent +
                    ' %';
                } else if (automation.budgetType === 'amount') {
                  apiCallAction =
                    automation.options +
                    ' =>  ' +
                    automation.budgetAmount +
                    ' %';
                }

                const data = {
                  automationId: automation.id,
                  apiCallAction: apiCallAction,
                  rulesDisplay: automation.displayText,
                  adSetId: row.adset_id,
                };
                this.automationLogService.createAutomationLog(data);
              } else {
                // TODO API Call Implementation
                this.logger.log('Actual API CALL');
              }
            });
          }
        }

        // Create a new Date object representing the current date and time
        const currentDate = new Date();

        // Add automation Minutes to the current date
        currentDate.setMinutes(
          currentDate.getMinutes() + parseInt(automationInMinutes),
        );

        const updatedDate = currentDate;
        // 4. Update NextRun, Update LastRun
        const updateAutomation = await this.prisma.automation.update({
          where: { id: automation.id },
          data: {
            lastRun: new Date(),
            nextRun: updatedDate,
          },
        });
      });

      this.logger.log('End Cron Job for Run Automation');
      return results.includes(false) ? false : true;
    } catch (error) {
      this.logger.error(error);
    }
  }

  // Service for Query Builder based on automation rules
  async generateQuery(
    rules: Rule[],
    adsetTable: string,
    reportView: string,
  ): Promise<string> {
    const [whereList, joinList, withList] = this.buildQueryPartials(
      rules,
      reportView,
    );

    let query = 'WITH\n';

    const withEntries = Object.values(withList);
    for (let i = 0; i < withEntries.length; i++) {
      query += withEntries[i];
      if (i !== withEntries.length - 1) {
        query += ',';
      }
      query += '\n';
    }

    const select = `SELECT t1.adset_id, t1.daily_budget, t1.status FROM ${adsetTable} t1\n`;
    query += select;

    const joinEntries = Object.values(joinList);
    for (const entry of joinEntries) {
      query += entry;
    }

    let whereClause = 'WHERE\n';
    for (let i = 0; i < whereList.length; i++) {
      if (i === 0) {
        whereClause += whereList[i] + '\n';
      } else {
        whereClause += 'AND ' + whereList[i] + '\n';
      }
    }

    query += whereClause + ';';
    this.logger.log(query.toString());
    return query.toString();
  }

  buildQueryPartials(
    rules: Rule[],
    reportView: string,
  ): [string[], JoinList, WithList] {
    const whereList: string[] = [];
    const joinList: JoinList = {};
    const withList: WithList = {};

    for (const rule of rules) {
      const param = rule.param;

      if (param === 'current_budget') {
        const operand = rule.operand;
        const value = rule.dollarValue;
        const condition = `t1.daily_budget`;
        whereList.push(this.generateWhere(condition, operand, value));
      } else if (param === 'adset_age') {
        const operand = rule.operand;
        const value = rule.daysCompareTo;
        const condition = '(TO_DAYS(NOW()) - TO_DAYS(t1.start_time))';
        whereList.push(this.generateWhere(condition, operand, value));
      } else if (param === 'ad_clicks') {
        // generateWith
        const [alias, withQuery] = this.generateWith(param, reportView);
        withList[alias] = withQuery;

        // generateJoin
        joinList[alias] = this.generateJoin(alias);

        // generateWhere
        const operand = rule.operand;
        const value = rule.valuesAdclicks;
        const condition = `${alias}.total_clicks`;

        whereList.push(this.generateWhere(condition, operand, value));
      } else if (param === 'average_rpc') {
        // generateWith
        const [alias, withQuery] = this.generateWith(param, reportView);
        withList[alias] = withQuery;

        // generateJoin
        joinList[alias] = this.generateJoin(alias);

        // generateWhere
        const operand = rule.operand;
        const condition = `${alias}.average_rpc`;
        const value = rule.parameters;
        whereList.push(this.generateWhere(condition, operand, value));
      } else if (param === 'category_rpc') {
        // generateWith
        const [alias, withQuery] = this.generateWith(param, reportView);
        withList[alias] = withQuery;

        // generateJoin
        joinList[alias] = this.generateJoin(alias);

        // generateWhere
        const operand = rule.operand;
        const condition = `${alias}.average_rpc`;
        const value = rule.parameters;
        whereList.push(this.generateWhere(condition, operand, value));
      } else if (param === 'margin' || param === 'profit') {
        const operand = rule.operand;
        const types = rule.type;
        const daysAgo = rule.daysAgo;
        const daysCompareTo = rule.daysCompareTo;
        const percentValue = rule.percentValue;
        const dollarValue = rule.dollarValue;
        const daysOfTimeFrame = rule.daysOfTimeFrame;
        const percentageOfTimeFrame = rule.percentageOfTimeFrame;

        const days: string[] = [];
        if (types === 'timeframe') {
          if (daysAgo) days.push(daysAgo);
          if (daysCompareTo) days.push(daysCompareTo);
        } else {
          if (daysAgo) days.push(daysAgo);
        }

        const conditions: string[] = [];
        for (const day of days) {
          const [alias, withQuery] = this.generateWith(param, reportView, day);
          withList[alias] = withQuery;
          joinList[alias] = this.generateJoin(alias);
          if (types === 'number') {
            const condition = `${alias}.${param}`;
            let value = '';
            if (param === 'profit') {
              value = dollarValue;
            } else {
              value = percentValue;
            }
            whereList.push(this.generateWhere(condition, operand, value));
          } else {
            const condition = `${alias}.${param}`;
            conditions.push(condition);
          }
        }

        if (types === 'percentageOfTimeFrame') {
          const day1 =  rule.daysAgo;
          const day2 = rule.daysOfTimeFrame;
          const percentageVal = +percentageOfTimeFrame / 100;
          const [alias1, withQuery1] = this.generateWith(param, reportView, day1);
          const [alias2, withQuery2] = this.generateWith(param, reportView, day2);

          withList[alias1] = withQuery1;
          withList[alias2] = withQuery2;
          joinList[alias1] = this.generateJoin(alias1);
          joinList[alias2] = this.generateJoin(alias2);

          const condition = `${alias1}.${param}`;
          const value = `${percentageVal} * ${alias2}.${param}`;
          const operator = operand;

          whereList.push(this.generateWhere(condition,operator,value));
        }

        if (types === 'timeframe') {
          whereList.push(
            this.generateWhere(conditions[0], operand, conditions[1]),
          );
        }
      }
    }

    return [whereList, joinList, withList];
  }

  generateWhere(condition: string, operand: string, value: string): string {
    const query = `${condition} ${operand} ${value}`;
    return query;
  }

  generateWith(
    param: string,
    reportView?: string,
    day?: string,
  ): [string, string] {
    let alias = '';
    let withQuery = '';
    if (param === 'ad_clicks') {
      alias = param;
      withQuery = `\t${alias} AS (SELECT adset_id,sum(clicks) as total_clicks FROM ${reportView} GROUP BY adset_id`;
      withQuery += ')';
    } else if (param === 'average_rpc' || param === 'category_rpc') {
      alias = 'vSpend';
      withQuery = `\t${alias} AS (SELECT adset_id, categoryRPC as category_rpc, averageRPC as average_rpc FROM ${reportView}`;
      withQuery += ')';
    } else {
      alias = param + day;
      withQuery = `\t${alias} AS (SELECT * FROM ${reportView} WHERE reportDate = DATE_SUB(CURDATE(), INTERVAL ${day} DAY)`;
      withQuery += ')';
    }

    return [alias, withQuery];
  }

  generateJoin(alias: string): string {
    const joinQuery = `\tJOIN ${alias} ON t1.adset_id = ${alias}.adset_id\n`;
    return joinQuery;
  }
}
