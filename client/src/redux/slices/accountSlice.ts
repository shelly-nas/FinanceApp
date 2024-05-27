import { createSlice } from '@reduxjs/toolkit';

interface AccountState {
  cash: number;
  investment: number;
  credit: number;
  netWorth: number;
}

const initialState: AccountState = {
  cash: 21371.92,
  investment: 41211.80,
  credit: 0,
  netWorth: 62583.72,
};

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {},
});

export default accountSlice.reducer;
