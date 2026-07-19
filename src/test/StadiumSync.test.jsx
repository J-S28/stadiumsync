import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent, act } from '@testing-library/react';
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

  it('enters the stadium by pressing Enter in the Ticket ID field, not just clicking the button', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.type(screen.getByLabelText(/your name/i), 'Leo');
    await user.type(screen.getByLabelText(/ticket id/i), 'WC26-118014{Enter}');
    expect(await screen.findByText('Hey, Leo')).toBeInTheDocument();
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

  it('unlocks the Ops Console by pressing Enter in the passcode field, not just clicking the button', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('tab', { name: /operations/i }));
    await user.type(screen.getByLabelText(/operations passcode/i), '2026{Enter}');
    expect(await screen.findByText('Ops Console')).toBeInTheDocument();
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

    // OrderTab is lazy-loaded — wait for it to resolve.
    const firstAdd = (await screen.findAllByRole('button', { name: /add .* to order/i }))[0];
    await user.click(firstAdd);

    const checkoutButton = await screen.findByRole('button', { name: /send to seat/i });
    await user.click(checkoutButton);

    expect(await screen.findByText(/order placed/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /send to seat/i })).not.toBeInTheDocument();
  });

  it('dismisses the order confirmation on request', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /order/i }));

    await user.click((await screen.findAllByRole('button', { name: /add .* to order/i }))[0]);
    await user.click(await screen.findByRole('button', { name: /send to seat/i }));
    await screen.findByText(/order placed/i);

    await user.click(screen.getByRole('button', { name: /dismiss order confirmation/i }));
    expect(screen.queryByText(/order placed/i)).not.toBeInTheDocument();
  });
});

describe('Transport tab', () => {
  it('selects and deselects a route from the list', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /transport/i }));

    // TransportTab is lazy-loaded — wait for it to resolve.
    const rideshareButton = await screen.findByRole('button', { name: /rideshare pickup b2/i });
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
    await user.click(await screen.findByRole('button', { name: /use this route/i }));
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

  it('omits the step-free mention from the spoken route once step-free routing is turned off', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('button', { name: /step-free route/i }));

    await user.click(await screen.findByRole('button', { name: /audio wayfinding/i }));
    const utterance = window.speechSynthesis.speak.mock.calls[0][0];
    expect(utterance.text).not.toMatch(/step-free route active/i);
    expect(utterance.text).toMatch(/gate 4 is near capacity/i);
  });

  it('speaks directions via the browser speech synthesis API, and stops on a second tap', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    const audioButton = await screen.findByRole('button', { name: /audio wayfinding/i });
    await user.click(audioButton);
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
    expect(audioButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(audioButton);
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    expect(audioButton).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('Assistant tab', () => {
  it('falls back to the scripted reply when the API is unreachable', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /assistant/i }));

    // AssistantTab is lazy-loaded — wait for it to resolve.
    const input = await screen.findByLabelText(/message the assistant/i);
    await user.type(input, 'where is the nearest exit');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText(/Gate 4/)).toBeInTheDocument();
  });

  it('auto-detects Spanish from the typed message and highlights the ES pill', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /assistant/i }));

    const input = await screen.findByLabelText(/message the assistant/i);
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

    await user.click(await screen.findByRole('button', { name: 'French' }));
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
      const input = await screen.findByLabelText(/message the assistant/i);
      await user.type(input, 'any food nearby?');
      await user.click(screen.getByRole('button', { name: /send message/i }));
      expect(await screen.findByText(/Churro \+ Dip has the shortest wait/i)).toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('does nothing when Send is pressed with empty input', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn();
    try {
      const user = userEvent.setup();
      await enterAsAttendee(user);
      await user.click(await screen.findByRole('tab', { name: /assistant/i }));
      await user.click(await screen.findByRole('button', { name: /send message/i }));
      expect(global.fetch).not.toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('sends a message by pressing Enter, not just clicking Send', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /assistant/i }));

    const input = await screen.findByLabelText(/message the assistant/i);
    await user.type(input, 'where is the nearest exit{Enter}');
    expect(await screen.findByText(/Gate 4/)).toBeInTheDocument();
  });

  it('falls back to the scripted reply when the API resolves without a usable reply', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ reply: '' }) });
    try {
      const user = userEvent.setup();
      await enterAsAttendee(user);
      await user.click(await screen.findByRole('tab', { name: /assistant/i }));
      const input = await screen.findByLabelText(/message the assistant/i);
      // No language-marker words in any bank, so this also exercises the
      // "no language detected, stay on the current pill" path.
      await user.type(input, 'can you help me please');
      await user.click(screen.getByRole('button', { name: /send message/i }));
      expect(await screen.findByText(/routing that to the right place/i)).toBeInTheDocument();
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

    const addButton = (await screen.findAllByRole('button', { name: /add .* to order/i }))[0];
    await user.click(addButton);

    const increment = screen.getByRole('button', { name: /add one more/i });
    await user.click(increment);
    expect(screen.getByText('2')).toBeInTheDocument();

    const decrement = screen.getByRole('button', { name: /remove one/i });
    await user.click(decrement);
    await user.click(decrement);

    expect(screen.getAllByRole('button', { name: /add .* to order/i }).length).toBeGreaterThan(0);
  });

  it('adds the AI pick directly from the banner', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /order/i }));

    await user.click(await screen.findByRole('button', { name: /add ai pick, churro \+ dip, to order/i }));
    expect(await screen.findByRole('button', { name: /remove one churro \+ dip/i })).toBeInTheDocument();
  });

  it('adds an item from its own row button, not just the AI-pick banner', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /order/i }));

    await user.click(await screen.findByRole('button', { name: /^add loaded nachos to order$/i }));
    expect(await screen.findByRole('button', { name: /remove one loaded nachos/i })).toBeInTheDocument();
  });
});

describe('Volunteer Copilot tab (Ops Console)', () => {
  it('answers a protocol question with the offline fallback', async () => {
    const user = userEvent.setup();
    await enterAsOperations(user);
    await screen.findByText('Ops Console');
    await user.click(screen.getByRole('tab', { name: /copilot/i }));

    const input = await screen.findByLabelText(/ask the protocol assistant/i);
    await user.type(input, 'a child is lost near Gate 3');
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    expect(await screen.findByText(/Guest Services/i)).toBeInTheDocument();
  });

  it('sends a protocol question by pressing Enter, not just clicking Send', async () => {
    const user = userEvent.setup();
    await enterAsOperations(user);
    await screen.findByText('Ops Console');
    await user.click(screen.getByRole('tab', { name: /copilot/i }));

    const input = await screen.findByLabelText(/ask the protocol assistant/i);
    await user.type(input, 'a spill near section 12{Enter}');

    expect(await screen.findByText(/Custodial/i)).toBeInTheDocument();
  });

  it('uses the real API reply when the network call succeeds', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reply: 'Radio Guest Services on channel 3 right away.' }),
    });
    try {
      const user = userEvent.setup();
      await enterAsOperations(user);
      await screen.findByText('Ops Console');
      await user.click(screen.getByRole('tab', { name: /copilot/i }));

      const input = await screen.findByLabelText(/ask the protocol assistant/i);
      await user.type(input, 'a child is lost');
      await user.click(screen.getByRole('button', { name: /^send$/i }));

      expect(await screen.findByText(/radio guest services on channel 3 right away/i)).toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('flags the most congested zone from live data and sends a re-routing brief with the offline fallback', async () => {
    const user = userEvent.setup();
    await enterAsOperations(user);
    await screen.findByText('Ops Console');
    await user.click(screen.getByRole('tab', { name: /copilot/i }));

    // Gate 4 (97%) is the most congested zone in ZONES — the card derives
    // this rather than hardcoding a zone name.
    expect(await screen.findByText(/crowd spike at Gate 4 \(97% capacity\)/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /ping nearby volunteers/i }));
    expect(await screen.findByText(/brief sent: "Redirect to Gate 4/i)).toBeInTheDocument();
  });

  it('uses the real AI-generated brief when the network call succeeds', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reply: 'All units: divert to Gate 4, crowd building fast.' }),
    });
    try {
      const user = userEvent.setup();
      await enterAsOperations(user);
      await screen.findByText('Ops Console');
      await user.click(screen.getByRole('tab', { name: /copilot/i }));

      await user.click(await screen.findByRole('button', { name: /ping nearby volunteers/i }));
      expect(await screen.findByText(/all units: divert to gate 4, crowd building fast/i)).toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('does nothing when Send is pressed with empty input', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn();
    try {
      const user = userEvent.setup();
      await enterAsOperations(user);
      await screen.findByText('Ops Console');
      await user.click(screen.getByRole('tab', { name: /copilot/i }));
      await user.click(await screen.findByRole('button', { name: /^send$/i }));
      expect(global.fetch).not.toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('falls back to the offline protocol reply when the API resolves without a usable reply', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ reply: '' }) });
    try {
      const user = userEvent.setup();
      await enterAsOperations(user);
      await screen.findByText('Ops Console');
      await user.click(screen.getByRole('tab', { name: /copilot/i }));
      const input = await screen.findByLabelText(/ask the protocol assistant/i);
      await user.type(input, 'a child is lost near Gate 3');
      await user.click(screen.getByRole('button', { name: /^send$/i }));
      expect(await screen.findByText(/Guest Services/i)).toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('falls back to the offline dispatch brief when the API resolves without a usable reply', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ reply: '' }) });
    try {
      const user = userEvent.setup();
      await enterAsOperations(user);
      await screen.findByText('Ops Console');
      await user.click(screen.getByRole('tab', { name: /copilot/i }));
      await user.click(await screen.findByRole('button', { name: /ping nearby volunteers/i }));
      expect(await screen.findByText(/brief sent: "Redirect to Gate 4/i)).toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe('Incident Command tab (Ops Console)', () => {
  it('summarizes multi-source reports with the offline fallback', async () => {
    const user = userEvent.setup();
    await enterAsOperations(user);
    await screen.findByText('Ops Console');
    await user.click(screen.getByRole('tab', { name: /incident command/i }));

    await user.click(await screen.findByRole('button', { name: /summarize with ai/i }));
    expect(await screen.findByText(/consistent across security, volunteer/i)).toBeInTheDocument();
  });

  it('generates automated comms with the offline fallback', async () => {
    const user = userEvent.setup();
    await enterAsOperations(user);
    await screen.findByText('Ops Console');
    await user.click(screen.getByRole('tab', { name: /incident command/i }));

    await user.click(await screen.findByRole('button', { name: /generate announcement/i }));
    expect(await screen.findByText(/for a faster exit, please use concourse s/i)).toBeInTheDocument();
  });

  it('lets staff edit the incident description and pick a target language before generating', async () => {
    const user = userEvent.setup();
    await enterAsOperations(user);
    await screen.findByText('Ops Console');
    await user.click(screen.getByRole('tab', { name: /incident command/i }));

    const description = await screen.findByLabelText(/incident description/i);
    await user.clear(description);
    await user.type(description, 'Spill near the concession stand at Concourse N.');
    await user.click(screen.getByRole('button', { name: /generate in es/i }));
    expect(screen.getByRole('button', { name: /generate in es/i })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: /generate announcement/i }));
    expect(await screen.findByText(/for a faster exit, please use concourse s/i)).toBeInTheDocument();
  });

  it('uses the real AI summary when the network call succeeds', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reply: 'Alert: Confirmed spill at Section 104.\nRecommended deployment: 1 custodial cart to Section 104.' }),
    });
    try {
      const user = userEvent.setup();
      await enterAsOperations(user);
      await screen.findByText('Ops Console');
      await user.click(screen.getByRole('tab', { name: /incident command/i }));
      await user.click(await screen.findByRole('button', { name: /summarize with ai/i }));
      expect(await screen.findByText(/confirmed spill at section 104/i)).toBeInTheDocument();
      expect(screen.getByText(/1 custodial cart to section 104/i)).toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('uses the real AI comms when the network call succeeds', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reply: 'PA: Please proceed to Concourse N for assistance.\nPUSH: Head to Concourse N.' }),
    });
    try {
      const user = userEvent.setup();
      await enterAsOperations(user);
      await screen.findByText('Ops Console');
      await user.click(screen.getByRole('tab', { name: /incident command/i }));
      await user.click(await screen.findByRole('button', { name: /generate announcement/i }));
      expect(await screen.findByText(/please proceed to concourse n for assistance/i)).toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('shows the fallback summary when the API resolves without a usable reply', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ reply: '' }) });
    try {
      const user = userEvent.setup();
      await enterAsOperations(user);
      await screen.findByText('Ops Console');
      await user.click(screen.getByRole('tab', { name: /incident command/i }));
      await user.click(await screen.findByRole('button', { name: /summarize with ai/i }));
      expect(await screen.findByText(/consistent across security, volunteer/i)).toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('shows the fallback announcement when the API resolves without a usable reply', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ reply: '' }) });
    try {
      const user = userEvent.setup();
      await enterAsOperations(user);
      await screen.findByText('Ops Console');
      await user.click(screen.getByRole('tab', { name: /incident command/i }));
      await user.click(await screen.findByRole('button', { name: /generate announcement/i }));
      expect(await screen.findByText(/for a faster exit, please use concourse s/i)).toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe('Egress tab (Ops Console)', () => {
  it('simulates a transit delay and automatically generates AI wayfinding + signage guidance', async () => {
    const user = userEvent.setup();
    await enterAsOperations(user);
    await screen.findByText('Ops Console');
    await user.click(screen.getByRole('tab', { name: /egress/i }));

    const toggle = await screen.findByRole('button', { name: /simulate transit delay/i });
    await user.click(toggle);
    // No separate "generate" step — the AI call fires automatically off the toggle.
    expect(await screen.findByText(/wayfinding updated to pace attendees toward zócalo fan fest/i)).toBeInTheDocument();
    expect(screen.getByText('12 min delay')).toBeInTheDocument();
    expect(screen.getByText(/metro delayed — wait at zócalo fan fest/i)).toBeInTheDocument();
  });

  it('uses the real AI-generated update when the network call succeeds', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reply: 'WAYFINDING: Head to Zócalo Fan Fest, Metro is backed up.\nSIGNAGE: USE ZÓCALO FAN FEST' }),
    });
    try {
      const user = userEvent.setup();
      await enterAsOperations(user);
      await screen.findByText('Ops Console');
      await user.click(screen.getByRole('tab', { name: /egress/i }));
      await user.click(await screen.findByRole('button', { name: /simulate transit delay/i }));

      expect(await screen.findByText(/head to zócalo fan fest, metro is backed up/i)).toBeInTheDocument();
      expect(screen.getByText('USE ZÓCALO FAN FEST')).toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('feeds the simulated delay into the attendee Transport tab live, in the same session', async () => {
    // enterAsOperations/enterAsAttendee each call renderApp(), which would
    // mount a fresh, independent StadiumSync instance — the opposite of what
    // this test needs to prove. Render once and drive both roles by hand so
    // `transitDelayed` genuinely persists across the role switch.
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('tab', { name: /operations/i }));
    await user.type(screen.getByLabelText(/operations passcode/i), '2026');
    await user.click(screen.getByRole('button', { name: /unlock console/i }));
    await screen.findByText('Ops Console');

    await user.click(screen.getByRole('tab', { name: /egress/i }));
    await user.click(await screen.findByRole('button', { name: /simulate transit delay/i }));
    await screen.findByText(/digital signage preview/i);

    await user.click(screen.getByRole('button', { name: /switch role/i }));
    await user.click(await screen.findByRole('button', { name: /boy avatar/i }));
    await user.type(screen.getByLabelText(/your name/i), 'Leo');
    await user.type(screen.getByLabelText(/ticket id/i), 'WC26-118014');
    await user.click(screen.getByRole('button', { name: /enter the stadium/i }));
    await screen.findByText('Hey, Leo');

    await user.click(await screen.findByRole('tab', { name: /transport/i }));
    expect(await screen.findByText(/egress optimizer:/i)).toBeInTheDocument();
    expect(screen.getByText(/metro — blue line/i).closest('button')).toHaveTextContent(/delayed 12 min/i);
  });

  it('ignores a stale AI response after the delay is cleared before the request resolves', async () => {
    const originalFetch = global.fetch;
    let resolveFetch;
    global.fetch = vi.fn(() => new Promise((resolve) => { resolveFetch = resolve; }));
    try {
      const user = userEvent.setup();
      await enterAsOperations(user);
      await screen.findByText('Ops Console');
      await user.click(screen.getByRole('tab', { name: /egress/i }));

      await user.click(await screen.findByRole('button', { name: /simulate transit delay/i }));
      expect(await screen.findByText(/generating AI wayfinding update/i)).toBeInTheDocument();

      // Clear the delay while the request is still in flight — the effect's
      // cleanup should mark it cancelled so the late reply never lands.
      await user.click(screen.getByRole('button', { name: /clear simulated delay/i }));

      await act(async () => {
        resolveFetch({ ok: true, json: () => Promise.resolve({ reply: 'WAYFINDING: stale update.\nSIGNAGE: STALE' }) });
        await Promise.resolve();
      });

      expect(screen.queryByText(/stale update/i)).not.toBeInTheDocument();
      expect(screen.getByText(/egress pacing normal/i)).toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe('Tournament Intel tab (Ops Console)', () => {
  it('generates an organizer briefing automatically, with the offline fallback, from live zone/vendor/sustainability data', async () => {
    const user = userEvent.setup();
    await enterAsOperations(user);
    await screen.findByText('Ops Console');
    await user.click(screen.getByRole('tab', { name: /tournament intel/i }));

    // The three stat tiles are derived from the same shared data other
    // tabs read (ZONES, VENDOR_LOAD, SUSTAIN_PIE) — Gate 4/Ice Cream Co. are
    // the busiest zone/lowest-stock vendor across the whole app.
    expect(await screen.findByText('Gate 4')).toBeInTheDocument();
    expect(screen.getByText('Ice Cream Co.')).toBeInTheDocument();
    expect(await screen.findByText(/pre-position an extra marshal at gate 4/i)).toBeInTheDocument();
  });

  it('uses the real AI-generated briefing when the network call succeeds', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reply: 'Crowd flow is holding steady across every gate. Vendor stock is the one thing to watch. Recommend a routine restock sweep before the second half.' }),
    });
    try {
      const user = userEvent.setup();
      await enterAsOperations(user);
      await screen.findByText('Ops Console');
      await user.click(screen.getByRole('tab', { name: /tournament intel/i }));
      expect(await screen.findByText(/recommend a routine restock sweep/i)).toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('falls back to the offline briefing when the API resolves without a usable reply', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ reply: '' }) });
    try {
      const user = userEvent.setup();
      await enterAsOperations(user);
      await screen.findByText('Ops Console');
      await user.click(screen.getByRole('tab', { name: /tournament intel/i }));
      expect(await screen.findByText(/pre-position an extra marshal at gate 4/i)).toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('ignores a stale briefing reply after navigating away before the request resolves', async () => {
    const originalFetch = global.fetch;
    let resolveFetch;
    global.fetch = vi.fn(() => new Promise((resolve) => { resolveFetch = resolve; }));
    try {
      const user = userEvent.setup();
      await enterAsOperations(user);
      await screen.findByText('Ops Console');
      await user.click(screen.getByRole('tab', { name: /tournament intel/i }));
      expect(await screen.findByText(/generating tournament briefing/i)).toBeInTheDocument();

      // Navigate away — unmounting while the request is still in flight —
      // the effect's cleanup should mark it cancelled so the late reply
      // never lands on a tab that isn't even showing anymore.
      await user.click(screen.getByRole('tab', { name: /^ops pulse$/i }));

      await act(async () => {
        resolveFetch({ ok: true, json: () => Promise.resolve({ reply: 'stale briefing text' }) });
        await Promise.resolve();
      });

      expect(screen.queryByText(/stale briefing text/i)).not.toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe('Match Hub tab', () => {
  it('generates commentary automatically when a moment is tapped and speaks it aloud', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /match hub/i }));

    // Tapping the moment is the trigger — no separate generate/play steps.
    await user.click(await screen.findByRole('button', { name: /corner kick won/i }));
    expect(await screen.findByText(/tactical shift/i)).toBeInTheDocument();
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);

    const stopButton = await screen.findByRole('button', { name: /stop commentary playback/i });
    await user.click(stopButton);
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();

    // Tapping again while stopped replays the same commentary.
    const replayButton = await screen.findByRole('button', { name: /play commentary aloud/i });
    await user.click(replayButton);
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(2);
  });

  it('generates team-biased commentary for a chosen team and moment', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /match hub/i }));

    await user.click(await screen.findByRole('tab', { name: /team-biased/i }));
    const teamInput = screen.getByLabelText('Team');
    await user.clear(teamInput);
    await user.type(teamInput, 'Mexico');
    await user.click(screen.getByRole('button', { name: /^goal!$/i }));

    expect(await screen.findByText(/what a moment/i)).toBeInTheDocument();
  });

  it('uses the real AI commentary when the network call succeeds', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reply: 'The keeper reads the angle perfectly and smothers it.' }),
    });
    try {
      const user = userEvent.setup();
      await enterAsAttendee(user);
      await user.click(await screen.findByRole('tab', { name: /match hub/i }));
      await user.click(await screen.findByRole('button', { name: /near miss on goal/i }));
      expect(await screen.findByText(/the keeper reads the angle perfectly/i)).toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('falls back to the scripted commentary when the API resolves without a usable reply', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ reply: '' }) });
    try {
      const user = userEvent.setup();
      await enterAsAttendee(user);
      await user.click(await screen.findByRole('tab', { name: /match hub/i }));
      await user.click(await screen.findByRole('button', { name: /corner kick won/i }));
      expect(await screen.findByText(/tactical shift/i)).toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe('Access+ tab', () => {
  it('shows a loud-moment warning by default and toggles live captions', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /access\+/i }));

    expect(await screen.findByText(/pyrotechnics expected at halftime/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^off$/i }));
    expect(await screen.findByText(/kickoff in 5 minutes/i)).toBeInTheDocument();
  });

  it('turns off loud-moment warnings on request', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /access\+/i }));

    const toggle = await screen.findByRole('button', { name: /loud-moment warnings/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText(/pyrotechnics expected at halftime/i)).not.toBeInTheDocument();
  });

  it('uses the real AI-generated warning when the network call succeeds', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reply: 'Fireworks start in 12 minutes — head to the Concourse S quiet room if you need a break.' }),
    });
    try {
      const user = userEvent.setup();
      await enterAsAttendee(user);
      await user.click(await screen.findByRole('tab', { name: /access\+/i }));
      expect(await screen.findByText(/fireworks start in 12 minutes/i)).toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('ignores a stale AI warning after loud-moment warnings are turned off before the request resolves', async () => {
    const originalFetch = global.fetch;
    let resolveFetch;
    global.fetch = vi.fn(() => new Promise((resolve) => { resolveFetch = resolve; }));
    try {
      const user = userEvent.setup();
      await enterAsAttendee(user);
      await user.click(await screen.findByRole('tab', { name: /access\+/i }));
      expect(await screen.findByText(/checking upcoming moments/i)).toBeInTheDocument();

      // Turn warnings off while the request is still in flight — the
      // effect's cleanup should mark it cancelled so the late reply is dropped.
      await user.click(screen.getByRole('button', { name: /loud-moment warnings/i }));

      await act(async () => {
        resolveFetch({ ok: true, json: () => Promise.resolve({ reply: 'stale warning text' }) });
        await Promise.resolve();
      });

      expect(screen.queryByText(/stale warning text/i)).not.toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('rotates through the caption feed on a timer while captions are on', async () => {
    // Everything that needs real-timer-backed polling (findBy*, navigating
    // tabs) happens before fake timers go on — only the interval itself
    // needs faking, and only fireEvent/sync queries touch the DOM while it's
    // active, since findBy*'s polling would otherwise hang against a clock
    // that never advances on its own.
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /access\+/i }));
    const captionsToggle = await screen.findByRole('button', { name: /^off$/i });

    vi.useFakeTimers();
    try {
      fireEvent.click(captionsToggle);
      expect(screen.getByText(/kickoff in 5 minutes/i)).toBeInTheDocument();

      await act(async () => { await vi.advanceTimersByTimeAsync(6000); });
      expect(screen.getByText(/step-free routes are available/i)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('Fan Zone tab', () => {
  it('routes to the nearest Fan Zone on request and shows a live route', async () => {
    const user = userEvent.setup();
    await enterAsAttendee(user);
    await user.click(await screen.findByRole('tab', { name: /fan zone/i }));

    await user.click(await screen.findByRole('button', { name: /route me there/i }));
    expect(await screen.findByText(/showing route to zócalo fan fest/i)).toBeInTheDocument();
    expect(screen.getByText(/live route — updating as you walk/i)).toBeInTheDocument();
  });
});
