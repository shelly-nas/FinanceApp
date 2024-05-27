import React from 'react';
import { Bar } from 'react-chartjs-2';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

const Charts: React.FC = () => {
  const spending = useSelector((state: RootState) => state.spending);

  const data = {
    labels: ['Home, Auto', 'Food', 'Shopping', 'Alcohol', 'Ridesharing'],
    datasets: [
      {
        label: 'Expenses',
        data: [
          spending.expenses.homeAuto,
          spending.expenses.food,
          spending.expenses.shopping,
          spending.expenses.alcohol,
          spending.expenses.ridesharing,
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  return <Bar data={data} />;
};

export default Charts;
