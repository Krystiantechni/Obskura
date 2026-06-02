import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Vitest 2.1.9 + Node.js 24 compatibility fix:
// Synchronous beforeEach() with spy.mockReset() triggers spurious
// uncaughtException via window error events when followed by mockRejectedValue.
// The bug requires TWO microtask-yield boundaries after mockReset to flush
// Node 24's unhandledRejection detection window. Making mockReset return an
// async-then-resolved promise achieves this without changing test behavior.
const _origFn = vi.fn.bind(vi);
vi.fn = function (impl) {
  const spy = _origFn(impl);
  const _origReset = spy.mockReset.bind(spy);
  spy.mockReset = async function asyncAwareMockReset() {
    _origReset();
    await Promise.resolve();
  };
  return spy;
};
