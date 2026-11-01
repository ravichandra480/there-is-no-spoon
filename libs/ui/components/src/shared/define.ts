/**
 * Registers a custom element once. Importing a component module twice (or two copies of the
 * library) must not throw `NotSupportedError: ... has already been used with this registry`.
 */
export function define<T extends CustomElementConstructor>(
  tag: string,
  ctor: T,
  registry: CustomElementRegistry = customElements,
): T {
  const existing = registry.get(tag);
  if (existing) return existing as T;
  registry.define(tag, ctor);
  return ctor;
}
