import "@testing-library/jest-dom";
import { jest } from "@jest/globals";
import { TextEncoder, TextDecoder } from "util";

if (typeof window.TextEncoder === "undefined") {
  window.TextEncoder = TextEncoder;
}
if (typeof window.TextDecoder === "undefined") {
  window.TextDecoder = TextDecoder;
}

// Mock window.matchMedia for responsive tests
window.matchMedia = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
});

// Mock getComputedStyle since JSDOM doesn't compute styles
Object.defineProperty(window, "getComputedStyle", {
  value: () => ({
    display: "block",
    margin: "0",
    padding: "0",
    maxWidth: "1200px"
  })
});
