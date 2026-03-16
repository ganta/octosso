/**
 * Runs OctoSSO based on the current page type
 */
export function run(): void {
  if (isSingleSignOnPromptPage()) {
    handleSingleSignOnPage();
  } else if (location.pathname === "/") {
    // https://github.com/
    handleTopPage();
  } else if (location.pathname === "/notifications") {
    // https://github.com/notifications
    handleNotificationPage();
  } else if (document.body.classList.contains("page-profile")) {
    // https://github.com/<username>
    handleProfilePage();
  }
}

/**
 * Returns true if the current page is a GitHub SSO prompt page.
 */
function isSingleSignOnPromptPage(): boolean {
  // /orgs/*/saml/consume is the page being processed
  if (
    location.pathname.startsWith("/orgs/") &&
    location.pathname.endsWith("/saml/consume")
  ) {
    return false;
  }

  // When a user opens the single sign-on page.
  // https://github.com/orgs/<organization name>/sso?return_to=<return to page URL>
  if (
    location.pathname.startsWith("/orgs/") &&
    location.pathname.endsWith("/sso")
  ) {
    return true;
  }

  // When a user opens a page that requires single sign-on.
  if (
    document.body.classList.contains("session-authentication") &&
    document.querySelector(".org-sso") !== null
  ) {
    return true;
  }

  return false;
}

/**
 * Clicks the SSO continue button on the single sign-on prompt page.
 */
function handleSingleSignOnPage(): void {
  const singleSignOnContinueButtonEl =
    document.querySelector<HTMLButtonElement>(
      "div.org-sso-panel > form > button",
    );

  if (singleSignOnContinueButtonEl === null) return;

  if (singleSignOnContinueButtonEl.innerText !== "Continue") return;

  singleSignOnContinueButtonEl.click();
}

/**
 * Handles SSO banner processing on the GitHub top page (/).
 */
function handleTopPage(): void {
  singleSignOnWithBanner();
}

/**
 * Handles SSO banner processing on the GitHub notifications page.
 */
function handleNotificationPage(): void {
  singleSignOnWithBanner();
}

/**
 * Handles SSO banner processing on a GitHub user profile page.
 */
function handleProfilePage(): void {
  singleSignOnWithBanner();
}

/**
 * Watches for an SSO banner to appear in the DOM and either redirects to the
 * SSO page when an org link is found, or opens the "Single sign-on" dropdown.
 */
function singleSignOnWithBanner(): void {
  // Wait for the banner to be added to the DOM using MutationObserver.
  const bodyObserver = new MutationObserver((_records, observer) => {
    const organizationName = getOrganizationNameFromSingleSignOnBanner();
    if (organizationName !== undefined) {
      observer.disconnect();
      redirectToSingleSignOnPage(organizationName);
      return;
    }
    openSingleSignOnDropdown();
  });

  const config = { childList: true, subtree: true };
  bodyObserver.observe(document.body, config);

  openSingleSignOnDropdown();
}

/**
 * Finds and clicks the "Single sign-on" dropdown button if it is not already open.
 */
function openSingleSignOnDropdown(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    'button[aria-haspopup="true"][aria-expanded="false"]',
  );
  for (const button of buttons) {
    if (
      button.querySelector('span[data-component="text"]')?.textContent ===
      "Single sign-on"
    ) {
      button.click();
      break;
    }
  }
}

/**
 * Extracts the organization slug from an SSO anchor link in the current DOM.
 * Returns the slug string, or undefined if no matching link is found.
 */
function getOrganizationNameFromSingleSignOnBanner(): string | undefined {
  const ssoLink = document.querySelector<HTMLAnchorElement>(
    'a[href*="/orgs/"][href*="/sso"]',
  );

  if (ssoLink) {
    const match = ssoLink.pathname.match(/^\/orgs\/([^/]+)\/sso/);
    if (match) return match[1];
  }

  return undefined;
}

/**
 * Redirects the browser to the SSO page for the given organization,
 * preserving the current path as the return_to parameter.
 */
function redirectToSingleSignOnPage(organizationName: string): void {
  const currentPath = window.location.pathname;
  const encodedOrganizationName = encodeURIComponent(organizationName);
  const encodedCurrentPath = encodeURIComponent(currentPath);
  const ssoPath = `/orgs/${encodedOrganizationName}/sso?return_to=${encodedCurrentPath}`;

  window.location.assign(ssoPath);
}
