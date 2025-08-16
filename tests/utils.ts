import { vi, type MockInstance } from "vitest";

//
// Types
//

/**
 * Common interface for clickable elements with spy
 */
type ClickableElement<T extends HTMLElement> = {
  element: T;
  clickSpy: MockInstance<() => void>;
};

//
// Basic Element Creation
//

/**
 * Creates a button element with click spy
 *
 * @param options - Configuration options
 * @param options.text - Button text
 * @returns Object with the button element and click spy
 */
function createButton({
  text,
}: {
  text: string;
}): ClickableElement<HTMLButtonElement> {
  const element = document.createElement("button");
  element.innerText = text;

  // Mock the click method directly to match actual usage in production code
  const clickSpy = vi.fn();
  element.click = clickSpy;

  return { element, clickSpy };
}

/**
 * Creates a container div element
 *
 * @param options - Configuration options
 * @param options.id - Optional ID for the container
 * @param options.className - Optional CSS class name for the container
 * @returns The container element
 */
function createContainer({
  id,
  className,
}: {
  id?: string;
  className?: string;
} = {}): HTMLDivElement {
  const container = document.createElement("div");
  if (id) {
    container.id = id;
  }
  if (className) {
    container.className = className;
  }
  return container;
}

//
// Structured Element Creation
//

/**
 * Creates an SSO form structure
 *
 * @param options - Configuration options
 * @param options.buttonText - Text for the button (default: "Continue")
 * @returns Object with container, form, button, and click spy
 */
export function createSSOForm({
  buttonText = "Continue",
}: { buttonText?: string } = {}): {
  container: HTMLDivElement;
  form: HTMLFormElement;
  button: HTMLButtonElement;
  clickSpy: MockInstance<() => void>;
} {
  const { element: button, clickSpy } = createButton({ text: buttonText });
  const form = document.createElement("form");
  const container = createContainer({ className: "org-sso-panel" });

  form.appendChild(button);
  container.appendChild(form);

  return { container, form, button, clickSpy };
}

/**
 * Creates an SSO banner element matching GitHub's new banner structure
 *
 * @param options - Configuration options
 * @param options.orgName - Organization name to display in the banner
 * @returns The banner section element
 */
export function createSSOBanner({
  orgName = "example-org",
}: { orgName?: string } = {}): HTMLElement {
  const section = document.createElement("section");
  section.className = "GlobalSSOBanner";

  const description = document.createElement("div");
  description.className = "BannerDescription";

  const strong = document.createElement("strong");
  strong.innerText = orgName;

  description.appendChild(strong);
  section.appendChild(description);

  return section;
}

//
// Test Helpers
//

/**
 * Waits for MutationObserver to process (microtask-based)
 *
 * @returns Promise that resolves after microtask queue is processed
 */
export function flushMutationObserver(): Promise<void> {
  return new Promise<void>((resolve) => queueMicrotask(resolve));
}
