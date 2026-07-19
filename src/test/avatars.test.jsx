import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BoyAvatar, GirlAvatar, StaffAvatar, BotAvatar } from '../shared/avatars.jsx';

describe('Avatar components', () => {
  it('renders every avatar as an svg', () => {
    for (const Avatar of [BoyAvatar, GirlAvatar, StaffAvatar, BotAvatar]) {
      const { container } = render(<Avatar />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    }
  });

  // Boy/Girl/Staff support the `ring` prop that highlights the selected
  // avatar during onboarding — BotAvatar (chat-only) doesn't take it.
  it('draws the selection ring when ring is set', () => {
    for (const Avatar of [BoyAvatar, GirlAvatar, StaffAvatar]) {
      const { container: withoutRing } = render(<Avatar />);
      const { container: withRing } = render(<Avatar ring />);
      expect(withRing.querySelectorAll('circle').length).toBeGreaterThan(withoutRing.querySelectorAll('circle').length);
    }
  });
});
