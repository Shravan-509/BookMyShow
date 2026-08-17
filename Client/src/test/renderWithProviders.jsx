import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import rootReducer from "../redux/reducers/rootReducer";

export function setupStore(preloadedState) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: false,
        serializableCheck: false,
      }),
  });
}

export function renderWithProviders(
  ui,
  {
    preloadedState,
    store = setupStore(preloadedState),
    route = "/",
    router = true,
    ...renderOptions
  } = {},
) {
  function Wrapper({ children }) {
    const content = <Provider store={store}>{children}</Provider>;
    return router ? <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter> : content;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
