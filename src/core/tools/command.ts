import { execa } from 'execa';

// 命令执行结果
export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

// 执行命令
export async function executeCommand(
  command: string,
  args: string[] = [],
  options: {
    cwd?: string;
    timeout?: number;
    env?: Record<string, string>;
  } = {}
): Promise<CommandResult> {
  try {
    const result = await execa(command, args, {
      cwd: options.cwd || process.cwd(),
      timeout: options.timeout || 30000,
      env: { ...process.env, ...options.env },
    });

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.exitCode || 0,
      success: true,
    };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || '',
      exitCode: error.exitCode || 1,
      success: false,
    };
  }
}

// 执行命令（流式）
export async function executeCommandStream(
  command: string,
  args: string[] = [],
  options: {
    cwd?: string;
    timeout?: number;
    env?: Record<string, string>;
    onStdout?: (data: string) => void;
    onStderr?: (data: string) => void;
  } = {}
): Promise<CommandResult> {
  try {
    const subprocess = execa(command, args, {
      cwd: options.cwd || process.cwd(),
      timeout: options.timeout || 30000,
      env: { ...process.env, ...options.env },
    });

    let stdout = '';
    let stderr = '';

    if (subprocess.stdout && options.onStdout) {
      subprocess.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        stdout += text;
        options.onStdout!(text);
      });
    }

    if (subprocess.stderr && options.onStderr) {
      subprocess.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        stderr += text;
        options.onStderr!(text);
      });
    }

    const result = await subprocess;

    return {
      stdout: stdout || result.stdout || '',
      stderr: stderr || result.stderr || '',
      exitCode: result.exitCode || 0,
      success: true,
    };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || '',
      exitCode: error.exitCode || 1,
      success: false,
    };
  }
}