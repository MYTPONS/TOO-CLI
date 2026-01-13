import fs from 'node:fs/promises';
import path from 'node:path';
import { isBinaryFile } from 'isbinaryfile';

// 文件读取工具
export async function readFile(filePath: string): Promise<{ content: string; isBinary: boolean }> {
  try {
    const absolutePath = path.resolve(filePath);
    const isBinary = await isBinaryFile(absolutePath);

    if (isBinary) {
      return {
        content: '[二进制文件，无法显示内容]',
        isBinary: true,
      };
    }

    const content = await fs.readFile(absolutePath, 'utf-8');
    return {
      content,
      isBinary: false,
    };
  } catch (error) {
    throw new Error(`读取文件失败: ${(error as Error).message}`);
  }
}

// 文件写入工具
export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    const absolutePath = path.resolve(filePath);
    const dir = path.dirname(absolutePath);

    // 确保目录存在
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(absolutePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`写入文件失败: ${(error as Error).message}`);
  }
}

// 文件列表工具
export async function listFiles(dirPath: string, recursive: boolean = false): Promise<string[]> {
  try {
    const absolutePath = path.resolve(dirPath);
    const files: string[] = [];

    if (recursive) {
      const walk = async (currentPath: string) => {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);

          if (entry.isDirectory()) {
            // 跳过 node_modules 和 .git
            if (entry.name !== 'node_modules' && entry.name !== '.git') {
              await walk(fullPath);
            }
          } else {
            files.push(fullPath);
          }
        }
      };

      await walk(absolutePath);
    } else {
      const entries = await fs.readdir(absolutePath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile()) {
          files.push(path.join(absolutePath, entry.name));
        }
      }
    }

    return files;
  } catch (error) {
    throw new Error(`列出文件失败: ${(error as Error).message}`);
  }
}

// 文件是否存在
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(path.resolve(filePath));
    return true;
  } catch {
    return false;
  }
}

// 删除文件
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(path.resolve(filePath));
  } catch (error) {
    throw new Error(`删除文件失败: ${(error as Error).message}`);
  }
}

// 创建目录
export async function createDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(path.resolve(dirPath), { recursive: true });
  } catch (error) {
    throw new Error(`创建目录失败: ${(error as Error).message}`);
  }
}