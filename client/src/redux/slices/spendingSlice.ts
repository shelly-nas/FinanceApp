import { createSlice } from '@reduxjs/toolkit';

interface SpendingState {
  income: number;
  expenses: {
    homeAuto: number;
    food: number;
    shopping: number;
    alcohol: number;
    ridesharing: number;
  };
}

const initialState: SpendingState = {
  income: 4500.00,
  expenses: {
    homeAuto: 1013.99,
    food: 144.40,
    shopping: 138.36,
    alcohol: 11.64,
    ridesharing: 6.51,
  },
};

const spendingSlice = createSlice({
  name: 'spending',
  initialState,
  reducers: {},
});

export default spendingSlice.reducer;
