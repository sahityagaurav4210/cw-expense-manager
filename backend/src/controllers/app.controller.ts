import { Request, Response } from 'express';
import ApiUtility from '../utils/api';
import FileUtility from '../utils/file';

export class AppController {
  public static health(req: Request, res: Response) {
    const appVersion = process.env.APP_VERSION ?? '0.0.0';

    return res.status(ApiUtility.HTTP_STATUS_OK).json({
      status: 'healthy',
      service: 'cw-expense-tracker-backend',
      timestamp: new Date().toISOString(),
      message: 'Expense backend service is healthy.',
      version: appVersion,
    });
  }

  public static home(request: Request, response: Response) {
    return response.status(ApiUtility.HTTP_STATUS_OK).sendFile(FileUtility.getAbsolutePath('../../assets/banner.txt'));
  }
}
