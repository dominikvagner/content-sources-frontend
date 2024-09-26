import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';

export default function useIsEphemeralEnv(): boolean {
  const { getEnvironment } = useChrome();
  return getEnvironment() === 'qa';
}
