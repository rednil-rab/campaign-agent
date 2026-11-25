import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(__dirname, 'chat.css'), 'utf8');

describe('chat.css', () => {
  it('has no hex colors, rgb values, border-radius or font stacks', () => {
    expect(css.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|border-radius|font-family/g)).toBeNull();
  });

  it('makes message text wrap', () => {
    expect(css).toContain('overflow-wrap: anywhere');
  });
});
