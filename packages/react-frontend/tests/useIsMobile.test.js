import { renderHook, act } from "@testing-library/react";
import { jest } from "@jest/globals";
import useIsMobile from "../src/hooks/useIsMobile";
import { describe, test, expect, afterEach } from "@jest/globals";

describe("useIsMobile hook", () => {
  // Save original implementation
  const originalInnerWidth = window.innerWidth;
  const originalMatchMedia = window.matchMedia;

  // Helper function to set window width and trigger resize
  function setWindowWidth(width) {
    window.innerWidth = width;
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
  }

  // Mock matchMedia for different viewport sizes
  function mockMatchMedia(matches) {
    window.matchMedia = () => ({
      matches,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    });
  }

  // Reset window properties after each test
  afterEach(() => {
    window.innerWidth = originalInnerWidth;
    window.matchMedia = originalMatchMedia;
  });

  test("returns true when viewport width is less than 768px", () => {
    // Set viewport width to mobile size
    setWindowWidth(767);
    mockMatchMedia(true);

    // Render the hook
    const { result } = renderHook(() => useIsMobile());

    // Assert the hook returns true for mobile viewport
    expect(result.current).toBe(true);
  });

  test("returns false when viewport width is 768px or greater", () => {
    // Set viewport width to desktop size
    setWindowWidth(768);
    mockMatchMedia(false);

    // Render the hook
    const { result } = renderHook(() => useIsMobile());

    // Assert the hook returns false for desktop viewport
    expect(result.current).toBe(false);
  });

  test("updates when window is resized", () => {
    // Start with desktop viewport
    setWindowWidth(1024);
    mockMatchMedia(false);

    // Render the hook
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Resize to mobile viewport
    setWindowWidth(600);
    mockMatchMedia(true);

    // Assert the hook updates correctly
    expect(result.current).toBe(true);

    // Resize back to desktop
    setWindowWidth(1024);
    mockMatchMedia(false);

    // Assert it updates again
    expect(result.current).toBe(false);
  });
});
