import { configureStore } from '@reduxjs/toolkit';
import accountReducer from './slices/accountSlice';
import spendingReducer from './slices/spendingSlice';

const store = configureStore({
  reducer: {
    account: accountReducer,
    spending: spendingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
