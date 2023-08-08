import { Automation } from '@prisma/client';
import { Row } from 'src/automation/Row';

export interface AutomationData {
  automationId: number;
  apiCallAction: string;
  rulesDisplay: string;
  adSetId: string;
}
