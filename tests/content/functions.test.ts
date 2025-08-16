import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { run } from "../../src/content/functions";
import {
  createSSOForm,
  flushMutationObserver,
  createSSOBanner,
} from "../utils";

describe("run", () => {
  let locationAssignSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // setup: reset DOM
    document.body.innerHTML = "";
    document.body.className = "";

    // setup: mock window.location.assign
    locationAssignSpy = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      pathname: "/",
      assign: locationAssignSpy,
    });
  });

  afterEach(() => {
    // cleanup: restore mocks
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function setupMutationObserverSpies() {
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

  describe("SSO prompt pages", () => {
    it("should handle organization SSO page", () => {
      // setup
      window.location.pathname = "/orgs/example-org/sso";
      const { container } = createSSOForm({ buttonText: "Continue" });
      document.body.appendChild(container);

      // exercise
      run();

      // verify: function runs without throwing
      expect(() => run()).not.toThrow();
    });

    it("should not handle SAML consume page", () => {
      // setup
      window.location.pathname = "/orgs/example-org/saml/consume";

      // exercise
      run();

      // verify: no button should be clicked
      expect(locationAssignSpy).not.toHaveBeenCalled();
    });

    it("should handle pages requiring SSO authentication", () => {
      // setup
      document.body.classList.add("session-authentication");
      const orgSsoDiv = document.createElement("div");
      orgSsoDiv.className = "org-sso";
      document.body.appendChild(orgSsoDiv);

      const { container, clickSpy } = createSSOForm({ buttonText: "Continue" });
      document.body.appendChild(container);

      // exercise
      run();

      // verify: Continue button should be clicked
      expect(clickSpy).toHaveBeenCalled();
    });

    it("should not execute when no SSO indicators are present", () => {
      // setup
      window.location.pathname = "/some-other-page";

      // exercise
      run();

      // verify
      expect(locationAssignSpy).not.toHaveBeenCalled();
    });
  });

  describe("SSO authentication pages", () => {
    it("should click the Continue button when found", () => {
      // setup
      window.location.pathname = "/orgs/example-org/sso";
      const { container, clickSpy } = createSSOForm({ buttonText: "Continue" });
      document.body.appendChild(container);

      // exercise
      run();

      // verify
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should not click if button text is not "Continue"', () => {
      // setup
      window.location.pathname = "/orgs/example-org/sso";
      const { container, clickSpy } = createSSOForm({ buttonText: "Cancel" });
      document.body.appendChild(container);

      // exercise
      run();

      // verify
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it("should handle missing button gracefully", () => {
      // setup
      window.location.pathname = "/orgs/example-org/sso";
      // No button added

      // exercise & verify
      expect(() => run()).not.toThrow();
    });
  });

  describe("top page", () => {
    it("should set up MutationObserver for document.body", () => {
      // setup
      window.location.pathname = "/";
      const observerSpies = setupMutationObserverSpies();

      // exercise
      run();

      // verify
      expect(observerSpies.observeSpy).toHaveBeenCalledWith(document.body, {
        childList: true,
        subtree: true,
      });

      // cleanup
      observerSpies.cleanup();
    });

    it("should redirect to SSO page when banner is detected", async () => {
      // setup
      window.location.pathname = "/";
      const observerSpies = setupMutationObserverSpies();
      const orgName = "test-org";

      // exercise: start observing
      run();

      // setup: simulate SSO banner being added
      const banner = createSSOBanner({ orgName });
      document.body.appendChild(banner);

      // wait for MutationObserver to process
      await flushMutationObserver();

      // verify
      expect(locationAssignSpy).toHaveBeenCalledWith(
        `/orgs/${orgName}/sso?return_to=%2F`,
      );
      expect(observerSpies.disconnectSpy).toHaveBeenCalled();

      // cleanup
      observerSpies.cleanup();
    });

    it("should handle missing banner gracefully", () => {
      // setup
      window.location.pathname = "/";

      // exercise & verify
      expect(() => run()).not.toThrow();
    });

    it("should not disconnect observer when banner is not found", async () => {
      // setup
      window.location.pathname = "/";
      const observerSpies = setupMutationObserverSpies();

      // exercise: start observing
      run();

      // setup: simulate other content being added (not SSO banner)
      const otherContent = document.createElement("div");
      otherContent.className = "some-other-content";
      document.body.appendChild(otherContent);

      // wait for MutationObserver to process (microtask-based)
      await flushMutationObserver();

      // verify: disconnect should not be called since the banner was never found
      expect(observerSpies.disconnectSpy).not.toHaveBeenCalled();
      expect(locationAssignSpy).not.toHaveBeenCalled();

      // cleanup
      observerSpies.cleanup();
    });
  });

  describe("notification page", () => {
    it("should redirect to SSO page when banner is detected", async () => {
      // setup
      window.location.pathname = "/notifications";
      const observerSpies = setupMutationObserverSpies();
      const orgName = "test-org";

      // exercise: start observing
      run();

      // setup: simulate SSO banner being added
      const banner = createSSOBanner({ orgName });
      document.body.appendChild(banner);

      // wait for MutationObserver to process
      await flushMutationObserver();

      // verify
      expect(locationAssignSpy).toHaveBeenCalledWith(
        `/orgs/${orgName}/sso?return_to=%2Fnotifications`,
      );
      expect(observerSpies.disconnectSpy).toHaveBeenCalled();

      // cleanup
      observerSpies.cleanup();
    });

    it("should handle missing elements gracefully", () => {
      // setup
      window.location.pathname = "/notifications";

      // exercise & verify
      expect(() => run()).not.toThrow();
    });
  });

  describe("profile page", () => {
    it("should redirect to SSO page when banner is detected", async () => {
      // setup
      window.location.pathname = "/username";
      document.body.classList.add("page-profile");
      const observerSpies = setupMutationObserverSpies();
      const orgName = "test-org";

      // exercise: start observing
      run();

      // setup: simulate SSO banner being added
      const banner = createSSOBanner({ orgName });
      document.body.appendChild(banner);

      // wait for MutationObserver to process
      await flushMutationObserver();

      // verify
      expect(locationAssignSpy).toHaveBeenCalledWith(
        `/orgs/${orgName}/sso?return_to=%2Fusername`,
      );
      expect(observerSpies.disconnectSpy).toHaveBeenCalled();

      // cleanup
      observerSpies.cleanup();
    });

    it("should handle missing elements gracefully", () => {
      // setup
      window.location.pathname = "/username";
      document.body.classList.add("page-profile");

      // exercise & verify
      expect(() => run()).not.toThrow();
    });
  });
});
