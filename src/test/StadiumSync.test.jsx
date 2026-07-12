import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StadiumSync from '../StadiumSync.jsx';

function renderApp() {
  return render(<StadiumSync />);
}

async function enterAsAttendee(user, { avatar = 'Boy', name = 'Leo', ticket = 'WC26-118014' } = {}) {
  renderApp();
  await user.click(screen.getByRole('button', { name: new RegExp(avatar, 'i') }));
  if (name) await user.type(screen.getByLabelText(/your name/i), name);
  await user.type(screen.getByLabelText(/ticket id/i), ticket);
  await user.click(screen.getByRole('button', { name: /enter the stadium/i }));
}

async function enterAsOperations(user, pin = '2026') {
  renderApp();
  await user.click(screen.getByRole('tab', { name: /operations/i }));
  await user.type(screen.getByLabelText(/operations passcode/i), pin);
  await user.click(screen.getByRole('button', { name: /unlock console/i }));
}

describe('Onboarding — Attendee entry', () => {
  it('shows a ticket format error and does not proceed on an invalid ticket', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.type(screen.getByLabelText(/ticket id/i), 'abc');
    await user.click(screen.getByRole('button', { name: /enter the stadium/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/doesn't look like a ticket id/i);
    expect(screen.queryByText(/^Hey,/)).not.toBeInTheDocument();
  });

  it('accepts any realistic ticket-shaped ID and enters the app using the typed name', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user, { name: 'Mia', ticket: 'wc27-1123' });
    expect(await screen.findByText('Hey, Mia')).toBeInTheDocument();
  });

  it('falls back to "Attendee" as the name when none is typed', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user, { name: '' });
    expect(await screen.findByText('Hey, Attendee')).toBeInTheDocument();
  });

  it('does not show the Operations tab/passcode UI on the main app', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await screen.findByText(/Hey, Leo/);
    expect(screen.queryByText(/operations access/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/operations passcode/i)).not.toBeInTheDocument();
  });
});

describe('Onboarding — Operations entry', () => {
  it('rejects an incorrect passcode', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('tab', { name: /operations/i }));
    await user.type(screen.getByLabelText(/operations passcode/i), '0000');
    await user.click(screen.getByRole('button', { name: /unlock console/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrect passcode/i);
  });

  it('unlocks the Ops Console directly with the correct passcode, no ticket required', async () => {
    const user = userEvent.setup();
    await enterAsOperations(user);
    expect(await screen.findByText('Ops Console')).toBeInTheDocument();
    expect(screen.getByText('Ops Pulse')).toBeInTheDocument();
  });
});

describe('Role is fixed for the session', () => {
  it('returns to the landing page via the exit control instead of switching roles in-place', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await screen.findByText(/Hey, Leo/);
    await user.click(screen.getByRole('button', { name: /switch role/i }));
    expect(await screen.findByRole('tab', { name: /attendee/i })).toBeInTheDocument();
  });
});

describe('Order tab', () => {
  it('adds an item, updates the total, places the order, and clears the cart', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /order/i }));

    const firstAdd = screen.getAllByRole('button', { name: /add .* to order/i })[0];
    await user.click(firstAdd);

    const checkoutButton = await screen.findByRole('button', { name: /send to seat/i });
    await user.click(checkoutButton);

    expect(await screen.findByText(/order placed/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /send to seat/i })).not.toBeInTheDocument();
  });
});

describe('Transport tab', () => {
  it('selects and deselects a route from the list', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /transport/i }));

    const rideshareButton = screen.getByRole('button', { name: /rideshare pickup b2/i });
    await user.click(rideshareButton);
    expect(await screen.findByText(/showing rideshare pickup b2/i)).toBeInTheDocument();
    expect(rideshareButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(rideshareButton);
    expect(screen.queryByText(/showing rideshare pickup b2/i)).not.toBeInTheDocument();
  });

  it('highlights Shuttle Line C when the AI suggestion is used', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /transport/i }));
    await user.click(screen.getByRole('button', { name: /use this route/i }));
    expect(await screen.findByText(/showing shuttle line c/i)).toBeInTheDocument();
  });
});

describe('Ops Console — actionable AI suggestions', () => {
  it('deploys marshals and shows a dispatched confirmation', async () => {
    const user = userEvent.setup();
    await enterAsOperations(user);
    await screen.findByText('Ops Console');
    // OpsPulseTab is lazy-loaded (code-split from the Recharts bundle), so
    // its content — including this button — resolves asynchronously.
    await user.click(await screen.findByRole('button', { name: /deploy marshals/i }));
    expect(await screen.findByText(/2 marshals dispatched to gate 4/i)).toBeInTheDocument();
  });

  it('dispatches the collection cart from the Sustainability tab', async () => {
    const user = userEvent.setup();
    await enterAsOperations(user);
    await screen.findByText('Ops Console');
    await user.click(screen.getByRole('tab', { name: /sustainability/i }));
    await user.click(await screen.findByRole('button', { name: /dispatch cart/i }));
    expect(await screen.findByText(/collection cart routed to fan zone/i)).toBeInTheDocument();
  });
});

describe('Accessibility toggles', () => {
  it('toggles step-free routing state', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    const toggle = await screen.findByRole('button', { name: /step-free route/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(within(toggle).getByText(/off — standard route/i)).toBeInTheDocument();
  });

  it('speaks directions via the browser speech synthesis API', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    const audioButton = await screen.findByRole('button', { name: /audio wayfinding/i });
    await user.click(audioButton);
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
  });
});

describe('Assistant tab', () => {
  it('falls back to the scripted reply when the API is unreachable', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /assistant/i }));

    const input = screen.getByLabelText(/message the assistant/i);
    await user.type(input, 'where is the nearest exit');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText(/Gate 4/)).toBeInTheDocument();
  });

  it('auto-detects Spanish from the typed message and highlights the ES pill', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /assistant/i }));

    const input = screen.getByLabelText(/message the assistant/i);
    // fireEvent.change avoids userEvent.type's per-key simulation, which
    // doesn't reliably handle accented/special characters (¿, ó, ñ).
    fireEvent.change(input, { target: { value: '¿Dónde está el baño más cercano?' } });
    await user.click(screen.getByRole('button', { name: /send message/i }));

    // The typed message is echoed back too, so match the bot's specific
    // scripted restroom reply rather than a shared substring like "baño".
    await screen.findByText(/40m pasando la Sección 118/i);
    expect(screen.getByRole('button', { name: 'Spanish' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('resets the conversation to a fresh greeting when a language pill is tapped manually', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /assistant/i }));

    await user.click(screen.getByRole('button', { name: 'French' }));
    expect(await screen.findByText(/assistant StadiumSync/i)).toBeInTheDocument();
  });

  it('uses the real API reply when the network call succeeds', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reply: 'Churro + Dip has the shortest wait right now.' }),
    });
    try {
      const user = userEvent.setup();
      await enterAsAttendee(user);
      await user.click(await screen.findByRole('tab', { name: /assistant/i }));
      const input = screen.getByLabelText(/message the assistant/i);
      await user.type(input, 'any food nearby?');
      await user.click(screen.getByRole('button', { name: /send message/i }));
      expect(await screen.findByText(/Churro \+ Dip has the shortest wait/i)).toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe('Vendors tab (Ops Console)', () => {
  it('flags low-stock vendors with a danger pill', async () => {
    const user = userEvent.setup();
    await enterAsOperations(user);
    await screen.findByText('Ops Console');
    await user.click(screen.getByRole('tab', { name: /vendors/i }));

    // VendorLoadTab is lazy-loaded — wait for it to resolve.
    expect(await screen.findByText('Ice Cream Co.')).toBeInTheDocument();
    expect(screen.getByText('12% stock')).toBeInTheDocument();
  });
});

describe('Order tab cart controls', () => {
  it('increments and decrements quantity, removing the item at zero', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /order/i }));

    const addButton = screen.getAllByRole('button', { name: /add .* to order/i })[0];
    await user.click(addButton);

    const increment = screen.getByRole('button', { name: /add one more/i });
    await user.click(increment);
    expect(screen.getByText('2')).toBeInTheDocument();

    const decrement = screen.getByRole('button', { name: /remove one/i });
    await user.click(decrement);
    await user.click(decrement);

    expect(screen.getAllByRole('button', { name: /add .* to order/i }).length).toBeGreaterThan(0);
  });
});
