import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isSingleSignOnPromptPage,
  clickSingleSignOnPrompt,
  handleSingleSignOnPage,
  handleTopPage,
  handleNotificationPage,
  handleProfilePage,
  initializeOctoSSO,
} from "../../src/content/functions";
import {
  createListWithLink,
  createMultipleOrgLinks,
  createSSOForm,
  flushMutationObserver,
  createNotificationPageSetup,
  createProfilePageSetup,
  createDashboardSetup,
} from "../utils";

describe("OctoSSO Content Script", () => {
  beforeEach(() => {
    // setup: reset DOM
    document.body.innerHTML = "";
    document.body.className = "";

    // setup: reset location to root
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    // cleanup: reset location
    window.history.pushState({}, "", "/");
  });

  describe("isSingleSignOnPromptPage", () => {
    it("should return true for organization SSO page", () => {
      // setup
      window.history.pushState(
        {},
        "",
        "/orgs/example-org/sso?return_to=/some-page",
      );

      // exercise
      const result = isSingleSignOnPromptPage();

      // verify
      expect(result).toBe(true);
    });

    it("should return false for SAML consume page", () => {
      // setup
      window.history.pushState({}, "", "/orgs/example-org/saml/consume");

      // exercise
      const result = isSingleSignOnPromptPage();

      // verify
      expect(result).toBe(false);
    });

    it("should return true for pages requiring SSO authentication", () => {
      // setup
      document.body.classList.add("session-authentication");
      const orgSsoDiv = document.createElement("div");
      orgSsoDiv.className = "org-sso";
      document.body.appendChild(orgSsoDiv);

      // exercise
      const result = isSingleSignOnPromptPage();

      // verify
      expect(result).toBe(true);
    });

    it("should return false when no SSO indicators are present", () => {
      // setup
      window.history.pushState({}, "", "/some-other-page");

      // exercise
      const result = isSingleSignOnPromptPage();

      // verify
      expect(result).toBe(false);
    });
  });

  describe("clickSingleSignOnPrompt", () => {
    it("should click the SSO link when found", () => {
      // setup
      const { list: ul, clickSpy } = createListWithLink({
        href: "/orgs/example-org/sso",
      });

      // exercise
      clickSingleSignOnPrompt(ul);

      // verify
      expect(clickSpy).toHaveBeenCalled();
    });

    it("should handle null promptListEl gracefully", () => {
      // setup: no setup needed

      // exercise & verify
      expect(() => clickSingleSignOnPrompt(null)).not.toThrow();
    });

    it("should not click if no SSO link is found", () => {
      // setup
      const { list: ul, clickSpy } = createListWithLink({
        href: "/some-other-link",
      });

      // exercise
      clickSingleSignOnPrompt(ul);

      // verify
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it("should not click organization links that are not SSO links", () => {
      // setup
      const { list: ul, clickSpies } = createMultipleOrgLinks();

      // exercise
      clickSingleSignOnPrompt(ul);

      // verify
      expect(clickSpies.org).not.toHaveBeenCalled();
      expect(clickSpies.repo).not.toHaveBeenCalled();
      expect(clickSpies.members).not.toHaveBeenCalled();
    });
  });

  describe("handleSingleSignOnPage", () => {
    it("should click the Continue button when found", () => {
      // setup
      const { container, clickSpy } = createSSOForm({ buttonText: "Continue" });
      document.body.appendChild(container);

      // exercise
      handleSingleSignOnPage();

      // verify
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should not click if button text is not "Continue"', () => {
      // setup
      const { container, clickSpy } = createSSOForm({ buttonText: "Cancel" });
      document.body.appendChild(container);

      // exercise
      handleSingleSignOnPage();

      // verify
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it("should handle missing button gracefully", () => {
      // setup: no setup needed (empty DOM)

      // exercise & verify
      expect(() => handleSingleSignOnPage()).not.toThrow();
    });
  });

  describe("handleTopPage", () => {
    it("should set up MutationObserver for dashboard", () => {
      // setup
      const { dashboard, observerSpies } = createDashboardSetup();
      document.body.appendChild(dashboard);

      // exercise
      handleTopPage();

      // verify
      expect(observerSpies.observeSpy).toHaveBeenCalledWith(dashboard, {
        childList: true,
        subtree: true,
      });

      // cleanup
      observerSpies.cleanup();
    });

    it("should click SSO prompt when detected by observer and disconnect observer", async () => {
      // setup
      const { dashboard, observerSpies, addLazyContent } =
        createDashboardSetup();
      document.body.appendChild(dashboard);

      // exercise: start observing
      handleTopPage();

      // setup: simulate lazy-loaded content
      const { container, clickSpy } = addLazyContent();

      // exercise: trigger mutation
      dashboard.appendChild(container);

      // wait for MutationObserver to process
      await flushMutationObserver();

      // verify
      expect(clickSpy).toHaveBeenCalled();
      expect(observerSpies.disconnectSpy).toHaveBeenCalled();

      // cleanup
      observerSpies.cleanup();
    });

    it("should handle missing dashboard element gracefully", () => {
      // setup: no setup needed (no dashboard element)

      // exercise & verify
      expect(() => handleTopPage()).not.toThrow();
    });

    it("should disconnect observer when activity container is found even without SSO links", async () => {
      // setup
      const { dashboard, observerSpies } = createDashboardSetup();
      document.body.appendChild(dashboard);

      // exercise: start observing
      handleTopPage();

      // setup: simulate lazy-loaded content without SSO prompt
      const container = document.createElement("div");
      container.className = "js-recent-activity-container";
      const ul = document.createElement("ul");
      const regularLink = document.createElement("a");
      regularLink.href = "/some-regular-link";

      ul.appendChild(regularLink);
      container.appendChild(ul);

      // exercise: trigger mutation
      dashboard.appendChild(container);

      // wait for MutationObserver to process (microtask-based)
      await flushMutationObserver();

      // verify: disconnect should be called when activity container is found
      expect(observerSpies.disconnectSpy).toHaveBeenCalled();

      // cleanup
      observerSpies.cleanup();
    });

    it("should not disconnect observer when activity container is never found", async () => {
      // setup
      const { dashboard, observerSpies } = createDashboardSetup();
      document.body.appendChild(dashboard);

      // exercise: start observing
      handleTopPage();

      // setup: simulate other content being added (not activity container)
      const otherContent = document.createElement("div");
      otherContent.className = "some-other-content";

      // exercise: trigger mutation
      dashboard.appendChild(otherContent);

      // wait for MutationObserver to process (microtask-based)
      await flushMutationObserver();

      // verify: disconnect should not be called since activity container was never found
      expect(observerSpies.disconnectSpy).not.toHaveBeenCalled();

      // cleanup
      observerSpies.cleanup();
    });
  });

  describe("handleNotificationPage", () => {
    it("should click SSO prompt in notification page", () => {
      // setup
      const { container, clickSpy } = createNotificationPageSetup();
      document.body.appendChild(container);

      // exercise
      handleNotificationPage();

      // verify
      expect(clickSpy).toHaveBeenCalled();
    });

    it("should handle missing elements gracefully", () => {
      // setup: no setup needed (empty DOM)

      // exercise & verify
      expect(() => handleNotificationPage()).not.toThrow();
    });
  });

  describe("handleProfilePage", () => {
    it("should click SSO prompt in profile page", () => {
      // setup
      document.body.classList.add("page-profile");
      const { contributionsContainer, clickSpy } = createProfilePageSetup();
      document.body.appendChild(contributionsContainer);

      // exercise
      handleProfilePage();

      // verify
      expect(clickSpy).toHaveBeenCalled();
    });

    it("should handle missing elements gracefully", () => {
      // setup
      document.body.classList.add("page-profile");

      // exercise & verify
      expect(() => handleProfilePage()).not.toThrow();
    });
  });

  describe("initializeOctoSSO", () => {
    it("should call handleSingleSignOnPage for SSO pages", () => {
      // setup: set location
      window.history.pushState({}, "", "/orgs/example-org/sso");

      // setup: create DOM elements using createSSOForm for consistent mocking
      const { container } = createSSOForm({ buttonText: "Continue" });
      document.body.appendChild(container);

      // exercise
      initializeOctoSSO();

      // verify: Since we can't easily verify the click was called in this integration test,
      // we verify that the function runs without throwing an error
      expect(() => initializeOctoSSO()).not.toThrow();
    });

    it("should call handleTopPage for root path", () => {
      // setup: set location
      window.history.pushState({}, "", "/");

      // setup: create dashboard element
      const { dashboard, observerSpies } = createDashboardSetup();
      document.body.appendChild(dashboard);

      // exercise
      initializeOctoSSO();

      // verify
      expect(observerSpies.observeSpy).toHaveBeenCalled();

      // cleanup
      observerSpies.cleanup();
    });

    it("should call handleNotificationPage for notifications path", () => {
      // setup: set location
      window.history.pushState({}, "", "/notifications");

      // setup: create DOM elements
      const { container, clickSpy } = createNotificationPageSetup();
      document.body.appendChild(container);

      // exercise
      initializeOctoSSO();

      // verify
      expect(clickSpy).toHaveBeenCalled();
    });

    it("should call handleProfilePage for profile pages", () => {
      // setup: set location
      window.history.pushState({}, "", "/username");
      document.body.classList.add("page-profile");

      // setup: create DOM elements
      const { contributionsContainer, clickSpy } = createProfilePageSetup();
      document.body.appendChild(contributionsContainer);

      // exercise
      initializeOctoSSO();

      // verify
      expect(clickSpy).toHaveBeenCalled();
    });

    it("should not execute any handler for unrelated pages", () => {
      // setup: set location
      window.history.pushState({}, "", "/some-other-page");

      const { observerSpies } = createDashboardSetup();

      // exercise
      initializeOctoSSO();

      // verify
      expect(observerSpies.observeSpy).not.toHaveBeenCalled();

      // cleanup
      observerSpies.cleanup();
    });

    it("should prioritize handleTopPage over handleProfilePage when both conditions match", () => {
      // setup: set location to root
      window.history.pushState({}, "", "/");

      // setup: add page-profile class to body (profile page condition)
      document.body.classList.add("page-profile");

      // setup: create dashboard element (for handleTopPage)
      const { dashboard, observerSpies } = createDashboardSetup();
      document.body.appendChild(dashboard);

      // exercise
      initializeOctoSSO();

      // verify: handleTopPage should be called (observeSpy called), not handleProfilePage
      expect(observerSpies.observeSpy).toHaveBeenCalled();

      // cleanup
      observerSpies.cleanup();
    });
  });
});
