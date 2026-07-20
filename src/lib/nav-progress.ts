// Tiny global store for the top navigation progress bar. Pending links and
// submitting buttons increment/decrement a counter; the <TopProgress> bar shows
// whenever the counter is above zero. Kept framework-free so any client
// component can drive it without prop-drilling a context.
let count = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export const navProgress = {
  start() {
    count += 1;
    emit();
  },
  done() {
    count = Math.max(0, count - 1);
    emit();
  },
  isActive() {
    return count > 0;
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
