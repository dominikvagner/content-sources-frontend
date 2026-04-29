import { fireEvent, render, screen } from '@testing-library/react';
import ManualConfigView from './ManualConfigView';

const mockUseAppContext = jest.fn();

jest.mock('../../../../../middleware/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
}));

describe('ManualConfigView', () => {
  beforeEach(() => {
    mockUseAppContext.mockReset();
  });

  it('renders manual configuration instructions with Insights warning', () => {
    mockUseAppContext.mockReturnValue({ isLightspeedEnabled: false });
    render(<ManualConfigView template={{ uuid: 'template-uuid' }} />);

    expect(screen.getByText('Manual configuration (cURL)')).toBeInTheDocument();
    expect(screen.getByText(/within Insights\./)).toBeInTheDocument();
    expect(screen.getByText('Register for subscription')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Show content')).toHaveLength(2);
    fireEvent.click(screen.getAllByLabelText('Show content')[0]);
    expect(screen.getByText('subscription-manager register')).toBeInTheDocument();
    fireEvent.click(screen.getAllByLabelText('Show content')[1]);
    expect(screen.getByText(/templates\/template-uuid\/config\.repo/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Systems.' })).toHaveAttribute(
      'href',
      'insights/patch/systems/',
    );
  });

  it('renders warning text for Red Hat Lightspeed', () => {
    mockUseAppContext.mockReturnValue({ isLightspeedEnabled: true });
    render(<ManualConfigView template={{ uuid: 'template-uuid' }} />);

    expect(screen.getByText(/within Red Hat Lightspeed\./)).toBeInTheDocument();
  });
});
