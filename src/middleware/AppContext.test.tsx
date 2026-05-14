import { render, waitFor } from '@testing-library/react';
import { ContextProvider, useAppContext } from './AppContext';
import { useFetchFeaturesQuery } from 'services/Features/FeatureQueries';
import { useFetchSubscriptionsQuery } from 'services/Subscriptions/SubscriptionQueries';
import { useFlag } from '@unleash/proxy-client-react';
import { useKesselWorkspace, useKesselRbac, useTraditionalRbac } from './rbacHelpers';

jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => jest.fn(() => ({})));

jest.mock('services/Features/FeatureQueries', () => ({
  useFetchFeaturesQuery: jest.fn(),
}));

jest.mock('services/Subscriptions/SubscriptionQueries', () => ({
  useFetchSubscriptionsQuery: jest.fn(),
}));

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(),
}));

jest.mock('./rbacHelpers', () => ({
  useKesselWorkspace: jest.fn(),
  useKesselRbac: jest.fn(),
  useTraditionalRbac: jest.fn(),
}));

const Probe = () => {
  const { contentOrigin, isFetchingPermissions, isLightspeedEnabled, rbac } = useAppContext();
  return (
    <>
      <div data-testid='app-context-probe-origins'>{contentOrigin.join(',')}</div>
      <div data-testid='app-context-probe-loading'>{String(isFetchingPermissions)}</div>
      <div data-testid='app-context-probe-lightspeed'>{String(isLightspeedEnabled)}</div>
      <div data-testid='app-context-probe-rbac'>{JSON.stringify(rbac)}</div>
    </>
  );
};

describe('AppContext', () => {
  beforeEach(() => {
    (useFlag as jest.Mock).mockReturnValue(false);
    (useFetchSubscriptionsQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    (useKesselWorkspace as jest.Mock).mockReturnValue({ workspaceId: 'ws-id', loading: false });
    (useKesselRbac as jest.Mock).mockReturnValue({ rbac: { repoRead: true }, loading: false });
    (useTraditionalRbac as jest.Mock).mockReturnValue({
      rbac: { repoRead: true, repoWrite: true, templateWrite: true, templateRead: true },
      loading: false,
    });
  });

  it('keeps community origin and uses traditional rbac by default', async () => {
    (useFetchFeaturesQuery as jest.Mock).mockReturnValue({
      fetchFeatures: jest.fn().mockResolvedValue({}),
      isLoading: false,
    });

    const { container } = render(
      <ContextProvider>
        <Probe />
      </ContextProvider>,
    );

    await waitFor(() =>
      expect(
        container.querySelector('[data-testid="app-context-probe-origins"]')?.textContent,
      ).toContain('community'),
    );
    expect(
      container.querySelector('[data-testid="app-context-probe-lightspeed"]'),
    ).toHaveTextContent('false');
    expect(container.querySelector('[data-testid="app-context-probe-loading"]')).toHaveTextContent(
      'false',
    );
    expect(
      container.querySelector('[data-testid="app-context-probe-rbac"]')?.textContent,
    ).toContain('"repoWrite":true');
  });

  it('uses kessel rbac when kessel feature is enabled', async () => {
    (useFlag as jest.Mock).mockReturnValue(true);
    (useFetchFeaturesQuery as jest.Mock).mockReturnValue({
      fetchFeatures: jest.fn().mockResolvedValue({
        kessel: { enabled: true, accessible: true },
      }),
      isLoading: false,
    });
    (useKesselRbac as jest.Mock).mockReturnValue({
      rbac: { repoRead: true, repoWrite: false, templateWrite: false, templateRead: true },
      loading: false,
    });

    const { container } = render(
      <ContextProvider>
        <Probe />
      </ContextProvider>,
    );

    await waitFor(() =>
      expect(
        container.querySelector('[data-testid="app-context-probe-origins"]')?.textContent,
      ).toContain('community'),
    );
    expect(
      container.querySelector('[data-testid="app-context-probe-lightspeed"]'),
    ).toHaveTextContent('true');
    expect(
      container.querySelector('[data-testid="app-context-probe-rbac"]')?.textContent,
    ).toContain('"repoWrite":false');
  });
});
