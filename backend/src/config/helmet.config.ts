import { HelmetOptions } from 'helmet';

class HelmetConfig {
  private constructor() {}

  public static getHelmetConfig(): Readonly<HelmetOptions> | undefined {
    return {
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    };
  }
}

export default HelmetConfig;
