import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ZeroState } from './ZeroState';
import { useAppContext } from 'middleware/AppContext';
import { useHref, useNavigate } from 'react-router-dom';
import { ReactNode } from 'react';

jest.mock('middleware/AppContext', () => ({
  useAppContext: jest.fn(),
}));

const navigateMock = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useHref: jest.fn(),
}));

jest.mock('@redhat-cloud-services/frontend-components/AsyncComponent', () => {
  function MockAsyncComponent({
    customText,
    customSection,
    customButton,
  }: {
    customText: ReactNode;
    customSection: ReactNode;
    customButton: ReactNode;
  }) {
    return (
      <div>
        <div>{customText}</div>
        <div>{customSection}</div>
        <div>{customButton}</div>
      </div>
    );
  }
  return MockAsyncComponent;
});

describe('ZeroState', () => {
  beforeEach(() => {
    (useNavigate as jest.Mock).mockReturnValue(navigateMock);
    (useHref as jest.Mock).mockReturnValue('/insights/content/repositories');
    navigateMock.mockReset();
  });

  it('shows the Red Hat repository card and navigates from buttons', async () => {
    const setZeroState = jest.fn();
    const user = userEvent.setup();
    (useAppContext as jest.Mock).mockReturnValue({
      setZeroState,
      isLightspeedEnabled: false,
    });

    render(<ZeroState />);

    expect(screen.getByText(/Get started with Insights/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Browse Red Hat repositories' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Browse Red Hat repositories' }));
    await user.click(screen.getByRole('button', { name: 'Add repositories now' }));

    expect(setZeroState).toHaveBeenCalledWith(false);
    expect(navigateMock).toHaveBeenCalledWith('/insights/content/repositories?origin=red_hat');
  });

  it('uses lightspeed copy when enabled', () => {
    const setZeroState = jest.fn();
    (useAppContext as jest.Mock).mockReturnValue({
      setZeroState,
      isLightspeedEnabled: true,
    });

    render(<ZeroState />);

    expect(screen.getByText(/Get started with Red Hat Lightspeed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Browse Red Hat repositories' })).toBeInTheDocument();
  });
});
