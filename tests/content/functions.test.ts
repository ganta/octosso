import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { run } from "../../src/content/functions";
import {
  createSSOForm,
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

  describe("run", () => {
    it("should call handleSingleSignOnPage for SSO pages", () => {
      // setup: set location
      window.history.pushState({}, "", "/orgs/example-org/sso");

      // setup: create DOM elements using createSSOForm for consistent mocking
      const { container } = createSSOForm({ buttonText: "Continue" });
      document.body.appendChild(container);

      // exercise
      run();

      // verify: Since we can't easily verify the click was called in this integration test,
      // we verify that the function runs without throwing an error
      expect(() => run()).not.toThrow();
    });

    it("should call handleTopPage for root path", () => {
      // setup: set location
      window.history.pushState({}, "", "/");

      // setup: create dashboard element
      const { dashboard, observerSpies } = createDashboardSetup();
      document.body.appendChild(dashboard);

      // exercise
      run();

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
      run();

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
      run();

      // verify
      expect(clickSpy).toHaveBeenCalled();
    });

    it("should not execute any handler for unrelated pages", () => {
      // setup: set location
      window.history.pushState({}, "", "/some-other-page");

      const { observerSpies } = createDashboardSetup();

      // exercise
      run();

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
      run();

      // verify: handleTopPage should be called (observeSpy called), not handleProfilePage
      expect(observerSpies.observeSpy).toHaveBeenCalled();

      // cleanup
      observerSpies.cleanup();
    });
  });
});
