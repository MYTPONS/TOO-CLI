// 网络请求工具

/**
 * HTTP 请求选项
 */
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

/**
 * HTTP 响应
 */
export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}

/**
 * 发送 HTTP 请求
 */
export async function httpRequest(
  url: string,
  options: RequestOptions = {}
): Promise<{ success: boolean; response?: HttpResponse; error?: string }> {
  try {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 30000,
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const responseBody = await response.text();

    return {
      success: true,
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * GET 请求
 */
export async function get(
  url: string,
  headers?: Record<string, string>
): Promise<{ success: boolean; response?: HttpResponse; error?: string }> {
  return httpRequest(url, { method: 'GET', headers });
}

/**
 * POST 请求
 */
export async function post(
  url: string,
  body: any,
  headers?: Record<string, string>
): Promise<{ success: boolean; response?: HttpResponse; error?: string }> {
  return httpRequest(url, { method: 'POST', body, headers });
}

/**
 * PUT 请求
 */
export async function put(
  url: string,
  body: any,
  headers?: Record<string, string>
): Promise<{ success: boolean; response?: HttpResponse; error?: string }> {
  return httpRequest(url, { method: 'PUT', body, headers });
}

/**
 * DELETE 请求
 */
export async function del(
  url: string,
  headers?: Record<string, string>
): Promise<{ success: boolean; response?: HttpResponse; error?: string }> {
  return httpRequest(url, { method: 'DELETE', headers });
}