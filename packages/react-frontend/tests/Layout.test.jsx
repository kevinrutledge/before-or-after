import { render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";
import Layout from "../src/components/Layout";
import { describe, test, expect } from "@jest/globals";
import { MockAuthProvider } from "./mocks/AuthContext";
import { MemoryRouter } from "react-router-dom";

// Mock the components used by Layout
jest.mock("../src/components/Header", () => {
  return function MockHeader() {
    return <div data-testid="header">Header Component</div>;
  };
});

jest.mock("../src/components/BottomNav", () => {
  return function MockBottomNav() {
    return <div data-testid="bottom-nav">Bottom Nav Component</div>;
  };
});

jest.mock("../src/components/PageContainer", () => {
  return function MockPageContainer({ children }) {
    return <div data-testid="page-container">{children}</div>;
  };
});

// Mock the useIsMobile hook correctly
jest.mock("../src/hooks/useIsMobile", () => {
  return jest.fn();
});

// Mock the AuthContext
jest.mock("../src/context/AuthContext", () => {
  const mockModule = jest.requireActual("./mocks/AuthContext");
  return {
    useAuth: mockModule.useAuth
  };
});

import useIsMobile from "../src/hooks/useIsMobile";

describe("Layout component", () => {
  test("Layout renders children correctly", () => {
    useIsMobile.mockReturnValue(false);

    render(
      <MemoryRouter>
        <MockAuthProvider>
          <Layout>
            <div data-testid="test-content">Test content</div>
          </Layout>
        </MockAuthProvider>
      </MemoryRouter>
    );

    // Test that the layout wrapper exists with correct testid
    expect(screen.getByTestId("layout")).toBeInTheDocument();

    // Test that the children are rendered correctly
    expect(screen.getByTestId("test-content")).toBeInTheDocument();

    // Test that the content is wrapped in a page container
    expect(screen.getByTestId("page-container")).toBeInTheDocument();

    // Test that Header is rendered when not mobile
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  test("Layout renders mobile navigation when on mobile", () => {
    useIsMobile.mockReturnValue(true);

    render(
      <MemoryRouter>
        <MockAuthProvider>
          <Layout>
            <div data-testid="test-content">Test content</div>
          </Layout>
        </MockAuthProvider>
      </MemoryRouter>
    );

    // Test that the layout wrapper exists
    expect(screen.getByTestId("layout")).toBeInTheDocument();

    // Test that BottomNav is rendered when mobile
    expect(screen.getByTestId("bottom-nav")).toBeInTheDocument();

    // Test that Header is not rendered when mobile
    expect(screen.queryByTestId("header")).not.toBeInTheDocument();
  });
});
