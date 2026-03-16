import { Configuration } from 'test-utils';

/**
 * Creates an API Configuration with an Authorization header that is read from process.env
 * on each request. Use this for polling in long-running tests where the JWT might expire mid-test.
 *
 * @param tokenEnvVar - Environment variable name (e.g. 'LAYERED_REPO_TOKEN', 'ADMIN_TOKEN')
 * @param basePath - API base path (e.g. from process.env.BASE_URL + '/api/content-sources/v1')
 * @returns Configuration suitable for API clients
 */
export function createApiConfigWithDynamicToken(
  tokenEnvVar: string,
  basePath: string,
): Configuration {
  const headers: Record<string, string> = {};
  Object.defineProperty(headers, 'Authorization', {
    get: () => {
      const token = process.env[tokenEnvVar];
      if (!token) {
        throw new Error(
          `Token environment variable "${tokenEnvVar}" is not set. Check authentication setup.`,
        );
      }
      return token;
    },
    enumerable: true,
  });

  return new Configuration({
    basePath,
    headers,
  });
}
