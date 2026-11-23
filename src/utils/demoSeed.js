import { createReport } from '../services/reportService.js';
import { DEMO_REPORTS } from './demoData.js';

export { DEMO_REPORTS };

export async function seedDemoReports(currentUser) {
  if (!currentUser?.uid) {
    throw new Error('Entre com uma conta verificada para carregar os relatos de demonstração.');
  }
  let createdCount = 0;
  for (const item of DEMO_REPORTS) {
    await createReport(item, currentUser, item.reportId);
    createdCount += 1;
  }
  return createdCount;
}
