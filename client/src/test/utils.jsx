import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Custom render function that includes router context
export const renderWithRouter = (ui, options = {}) => {
  const { initialEntries = ['/'], ...renderOptions } = options;

  const Wrapper = ({ children }) => (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Helper to create mock components
export const createMockComponent = (name, testId) => {
  return ({ children, ...props }) => (
    <div data-testid={testId} data-component={name} {...props}>
      {children}
    </div>
  );
};

// Helper to test URL parameter extraction
export const testUrlParams = (url) => {
  const urlObj = new URL(url, 'http://localhost');
  return Object.fromEntries(urlObj.searchParams.entries());
};

export default {
  renderWithRouter,
  createMockComponent,
  testUrlParams,
};