import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { configureStore } from '@reduxjs/toolkit';
import { api } from '@/api';
import { Provider } from 'react-redux';
import { setupListeners } from '@reduxjs/toolkit/query';

export const store = configureStore({
  reducer: { [api.reducerPath]: api.reducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

// Optional: Setup listeners for cache invalidation, refetching, etc.
setupListeners(store.dispatch);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
