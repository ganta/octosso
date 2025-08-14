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

/**
 * MutationObserver spies setup
 */
type ObserverSpies = {
  observeSpy: MockInstance<
    (target: Node, options?: MutationObserverInit) => void
  >;
  disconnectSpy: MockInstance<() => void>;
  cleanup: () => void;
};

//
// Basic Element Creation
//

/**
 * Creates a link element with click spy
 * @param options - Configuration options
 * @param options.href - The href attribute value
 * @returns Object with the link element and click spy
 */
export function createLink({
  href,
}: {
  href: string;
}): ClickableElement<HTMLAnchorElement> {
  const element = document.createElement("a");
  element.href = href;

  const clickSpy = vi.fn((event: Event) => {
    event.preventDefault();
  });
  element.addEventListener("click", clickSpy);

  return { element, clickSpy };
}

/**
 * Creates a button element with click spy
 * @param options - Configuration options
 * @param options.text - Button text
 * @returns Object with the button element and click spy
 */
export function createButton({
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
 * @param options - Configuration options
 * @param options.id - Optional ID for the container
 * @param options.className - Optional CSS class name for the container
 * @returns The container element
 */
export function createContainer({
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
// Structure Creation
//

/**
 * Creates a list with a single link item
 * @param options - Configuration options
 * @param options.href - The href for the link
 * @returns Object with list, link element, and click spy
 */
export function createListWithLink({ href }: { href: string }): {
  list: HTMLUListElement;
  link: HTMLAnchorElement;
  clickSpy: MockInstance<() => void>;
} {
  const list = document.createElement("ul");
  const item = document.createElement("li");
  const { element: link, clickSpy } = createLink({ href });

  item.appendChild(link);
  list.appendChild(item);

  return { list, link, clickSpy };
}

/**
 * Creates an SSO form structure
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

//
// Test-specific Helpers
//

/**
 * Creates multiple organization links in a list
 * @param options - Configuration options
 * @param options.orgName - Organization name (default: "example-org")
 * @returns Object with list and click spies for each link type
 */
export function createMultipleOrgLinks({
  orgName = "example-org",
}: { orgName?: string } = {}): {
  list: HTMLUListElement;
  clickSpies: {
    org: MockInstance<() => void>;
    repo: MockInstance<() => void>;
    members: MockInstance<() => void>;
  };
} {
  const list = document.createElement("ul");

  const paths = [
    { path: "", key: "org" as const },
    { path: "/repositories", key: "repo" as const },
    { path: "/people", key: "members" as const },
  ];

  const clickSpies = {} as any;

  paths.forEach(({ path, key }) => {
    const item = document.createElement("li");
    const { element: link, clickSpy } = createLink({
      href: `/orgs/${orgName}${path}`,
    });
    item.appendChild(link);
    list.appendChild(item);
    clickSpies[key] = clickSpy;
  });

  return { list, clickSpies };
}

//
// Test Setup Helpers
//

/**
 * Sets up MutationObserver spies
 * @returns Object with spy instances and cleanup function
 */
export function setupMutationObserverSpies(): ObserverSpies {
  const observeSpy = vi.spyOn(MutationObserver.prototype, "observe");
  const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");

  return {
    observeSpy,
    disconnectSpy,
    cleanup: () => {
      observeSpy.mockRestore();
      disconnectSpy.mockRestore();
    },
  };
}

/**
 * Waits for MutationObserver to process (microtask-based)
 * @returns Promise that resolves after microtask queue is processed
 */
export function flushMutationObserver(): Promise<void> {
  return new Promise<void>((resolve) => queueMicrotask(resolve));
}

//
// Integrated Test Setup Helpers
//

/**
 * Creates a complete notification page setup
 * @param options - Configuration options
 * @param options.orgName - Organization name for SSO link (default: "example-org")
 * @returns Object with container, link, and click spy
 */
export function createNotificationPageSetup({
  orgName = "example-org",
}: { orgName?: string } = {}): {
  container: HTMLDivElement;
  checkAllContainer: HTMLUListElement;
  link: HTMLAnchorElement;
  clickSpy: MockInstance<() => void>;
} {
  const container = createContainer({ id: "js-repo-pjax-container" });
  const checkAllContainer = document.createElement("ul");
  checkAllContainer.className = "js-check-all-container";

  const { element: link, clickSpy } = createLink({
    href: `/orgs/${orgName}/sso`,
  });

  checkAllContainer.appendChild(link);
  container.appendChild(checkAllContainer);

  return { container, checkAllContainer, link, clickSpy };
}

/**
 * Creates a complete profile page setup
 * @param options - Configuration options
 * @param options.orgName - Organization name for SSO link (default: "example-org")
 * @returns Object with container, link, and click spy
 */
export function createProfilePageSetup({
  orgName = "example-org",
}: { orgName?: string } = {}): {
  contributionsContainer: HTMLUListElement;
  link: HTMLAnchorElement;
  clickSpy: MockInstance<() => void>;
} {
  const contributionsContainer = document.createElement("ul");
  contributionsContainer.className = "js-yearly-contributions";

  const { element: link, clickSpy } = createLink({
    href: `/orgs/${orgName}/sso`,
  });

  contributionsContainer.appendChild(link);

  return { contributionsContainer, link, clickSpy };
}

/**
 * Creates a complete dashboard setup with MutationObserver spies
 * @param options - Configuration options
 * @param options.orgName - Organization name for SSO link (default: "example-org")
 * @returns Object with dashboard, observer spies, and setup for lazy-loaded content
 */
export function createDashboardSetup({
  orgName = "example-org",
}: { orgName?: string } = {}): {
  dashboard: HTMLDivElement;
  observerSpies: ObserverSpies;
  addLazyContent: () => {
    container: HTMLDivElement;
    link: HTMLAnchorElement;
    clickSpy: MockInstance<() => void>;
  };
} {
  const dashboard = createContainer({ id: "dashboard" });
  const observerSpies = setupMutationObserverSpies();

  const addLazyContent = () => {
    const container = createContainer({
      className: "js-recent-activity-container",
    });
    const {
      list: ul,
      link,
      clickSpy,
    } = createListWithLink({
      href: `/orgs/${orgName}/sso`,
    });
    container.appendChild(ul);
    return { container, link, clickSpy };
  };

  return { dashboard, observerSpies, addLazyContent };
}
