import path from 'node:path';
import fs from 'node:fs';

class FileUtility {
  public static readFile(path: string): string {
    return fs.readFileSync(path, { encoding: 'utf-8' }).toString();
  }

  public static writeToFile(path: string, content: string): void {
    fs.writeFileSync(path, content);
  }

  public static getCWD(): string {
    return process.cwd();
  }

  public static getAbsolutePath(relativePath: string): string {
    return path.resolve(__dirname, relativePath);
  }
}

export default FileUtility;
