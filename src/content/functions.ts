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

function handleSingleSignOnPage(): void {
  const singleSignOnContinueButtonEl =
    document.querySelector<HTMLButtonElement>(
      "div.org-sso-panel > form > button",
    );

  if (singleSignOnContinueButtonEl === null) return;

  if (singleSignOnContinueButtonEl.innerText !== "Continue") return;

  singleSignOnContinueButtonEl.click();
}

function handleTopPage(): void {
  singleSignOnWithBanner();
}

function handleNotificationPage(): void {
  singleSignOnWithBanner();
}

function handleProfilePage(): void {
  singleSignOnWithBanner();
}

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

function redirectToSingleSignOnPage(organizationName: string): void {
  const currentPath = window.location.pathname;
  const encodedOrganizationName = encodeURIComponent(organizationName);
  const encodedCurrentPath = encodeURIComponent(currentPath);
  const ssoPath = `/orgs/${encodedOrganizationName}/sso?return_to=${encodedCurrentPath}`;

  window.location.assign(ssoPath);
}
