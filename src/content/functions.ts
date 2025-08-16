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

function clickSingleSignOnPrompt(promptListEl: HTMLUListElement | null): void {
  if (promptListEl === null) return;

  const singleSignOnAnchorEl = promptListEl.querySelector<HTMLAnchorElement>(
    "a[href^='/orgs/'][href$='/sso']",
  );

  if (singleSignOnAnchorEl !== null) {
    singleSignOnAnchorEl.click();
  }
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
  // The single sign-on prompts are lazy-loaded at the top page,
  // so they need to be detected by MutationObserver before they can be retrieved.
  const dashboardEl = document.querySelector<HTMLElement>("#dashboard");
  const dashboardObserver = new MutationObserver((_records, observer) => {
    const singleSignOnPromptListEl = document.querySelector<HTMLUListElement>(
      "#dashboard .js-recent-activity-container",
    );
    if (singleSignOnPromptListEl === null) return;

    clickSingleSignOnPrompt(singleSignOnPromptListEl);

    observer.disconnect();
  });

  if (dashboardEl) {
    const config = { childList: true, subtree: true };
    dashboardObserver.observe(dashboardEl, config);
  }
}

function handleNotificationPage(): void {
  const singleSignOnPromptListEl = document.querySelector<HTMLUListElement>(
    "#js-repo-pjax-container .js-check-all-container",
  );
  clickSingleSignOnPrompt(singleSignOnPromptListEl);
}

function handleProfilePage(): void {
  const singleSignOnPromptListEl = document.querySelector<HTMLUListElement>(
    "body.page-profile .js-yearly-contributions",
  );
  clickSingleSignOnPrompt(singleSignOnPromptListEl);
}
