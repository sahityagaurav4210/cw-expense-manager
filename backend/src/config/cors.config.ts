class CORSConfig {
  public static getAllowedOrigins() {
    const allowedOrigins = process.env?.ALLOWED_ORIGINS?.trim()?.split(',') ?? [
      'http://localhost:9123',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:4000',
    ];

    return allowedOrigins;
  }

  public static getCORS() {
    return {
      origin: CORSConfig.getAllowedOrigins(),
      credentials: true,
    };
  }
}

export default CORSConfig;
