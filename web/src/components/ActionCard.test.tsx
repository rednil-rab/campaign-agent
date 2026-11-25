import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ActionCard } from './ActionCard';
import type { Action } from '../store/chat';

const render = (status: Action['status']) =>
  renderToStaticMarkup(
    <ActionCard
      action={{ id: 'a1', type: 'generate_npc', payload: {}, status }}
      campaignId="c1"
      onApply={async () => undefined}
      onReject={async () => undefined}
    />,
  );

describe('ActionCard', () => {
  it('shows the type tag, an amber status tag and both buttons while pending', () => {
    const html = render('pending');
    expect(html).toContain('<span class="tag tag--cyan">NPC</span>');
    expect(html).toContain('<span class="tag tag--amber">not added yet</span>');
    expect(html).toContain('>Add to campaign</button>');
    expect(html).toContain('button button--ghost');
    expect(html).toContain('>Dismiss</button>');
  });

  it('shows a cyan status tag and no buttons once applied', () => {
    const html = render('applied');
    expect(html).toContain('<span class="tag tag--cyan">added to campaign</span>');
    expect(html).not.toContain('<button');
  });

  it('shows a muted status tag and no buttons once dismissed', () => {
    const html = render('rejected');
    expect(html).toContain('<span class="tag tag--muted">dismissed</span>');
    expect(html).not.toContain('<button');
  });
});
