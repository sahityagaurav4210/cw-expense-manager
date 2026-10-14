import { promises as fs } from "node:fs";
import path from "node:path";

export class FileHelper {
  /**
   * Resolves a relative path to an absolute path based on the current working directory.
   *
   * @param relativePath - The relative path to resolve.
   * @returns The resolved absolute path.
   */
  public static getAbsolutePath(relativePath: string): string {
    return path.resolve(process.cwd(), relativePath);
  }
  /**
   * Creates a new file with the specified content.
   * Will overwrite the file if it already exists.
   *
   * @param filePath - The path where the file should be created.
   * @param content - The data to write into the file. Defaults to an empty string.
   */
  public static async createFile(
    filePath: string,
    content: string = "",
  ): Promise<void> {
    await fs.writeFile(filePath, content, "utf-8");
  }

  /**
   * Reads and returns the content of the specified file.
   *
   * @param filePath - The path of the file to read.
   * @returns The string content of the file.
   */
  public static async readFile(filePath: string): Promise<string> {
    return await fs.readFile(filePath, "utf-8");
  }

  /**
   * Writes content to an existing file or creates a new one if it doesn't exist.
   * This operates identically to createFile under the hood, but is provided to
   * represent the semantic intention of writing/updating vs. creating.
   *
   * @param filePath - The path of the file to write to.
   * @param content - The data to write into the file.
   */
  public static async writeFile(
    filePath: string,
    content: string,
  ): Promise<void> {
    await fs.writeFile(filePath, content, "utf-8");
  }

  /**
   * Helper method to append content to an existing file.
   *
   * @param filePath - The path of the file to append to.
   * @param content - The data to append into the file.
   */
  public static async appendFile(
    filePath: string,
    content: string,
  ): Promise<void> {
    await fs.appendFile(filePath, content, "utf-8");
  }

  /**
   * Checks whether a file exists at the given path.
   *
   * @param filePath - The path of the file to check.
   * @returns True if the file exists, false otherwise.
   */
  public static async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  public static async createDirectory(directoryPath: string): Promise<void> {
    if (await this.exists(directoryPath)) {
      return;
    }

    await fs.mkdir(directoryPath, { recursive: true });
  }
}
