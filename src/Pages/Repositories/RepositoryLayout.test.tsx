import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RepositoryLayout from './RepositoryLayout';
import { useAppContext } from 'middleware/AppContext';
import { useFlag } from '@unleash/proxy-client-react';

jest.mock('middleware/AppContext', () => ({
  useAppContext: jest.fn(),
}));

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(),
}));

jest.mock('components/Header/Header', () => {
  function MockHeader() {
    return <div>header</div>;
  }
  return MockHeader;
});

jest.mock('components/QuickStart/RepositoryQuickStart', () => {
  function MockQuickStart() {
    return <div>quickstart</div>;
  }
  return MockQuickStart;
});

jest.mock('components/ServiceUnavailableAlert/ServiceUnavailableAlert', () => {
  function MockServiceUnavailableAlert() {
    return <div>service unavailable alert</div>;
  }
  return MockServiceUnavailableAlert;
});

const setupContext = (features: Record<string, unknown>) => {
  (useAppContext as jest.Mock).mockReturnValue({ features });
};

describe('RepositoryLayout', () => {
  beforeEach(() => {
    (useFlag as jest.Mock).mockReturnValue(false);
  });

  it('hides tabs when only default tab is available', () => {
    setupContext({
      admintasks: { enabled: false, accessible: false },
    });

    render(
      <MemoryRouter initialEntries={['/repositories']}>
        <RepositoryLayout />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: 'Your repositories' })).not.toBeInTheDocument();
  });

  it('shows admin tabs and service alert when enabled', () => {
    (useFlag as jest.Mock).mockReturnValue(true);
    setupContext({
      admintasks: { enabled: true, accessible: true },
    });

    render(
      <MemoryRouter initialEntries={['/repositories/admin-tasks']}>
        <RepositoryLayout />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Admin tasks' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Admin features' })).toBeInTheDocument();
    expect(screen.getByText('service unavailable alert')).toBeInTheDocument();
  });
});
