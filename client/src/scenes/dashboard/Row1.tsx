import DashboardBox from "@/components/DashboardBox";
import { useGetUsersQuery } from "@/api";
import React from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Props = {};

const Row1 = (props: Props) => {
	// const { data } = useGetUsersQuery();

	// const { data: users, error, isLoading } = useGetUsersQuery();
  	// if (isLoading) return <div>Loading...</div>;
  	// if (error) return <div>Error: {error.message}</div>;
	const data = [{ name: 'pv', category: 12 }, {name: 'uv', category: 30 }]
	// console.log('data:', data)
	return (
		<>
			<DashboardBox gridArea="a">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={data} margin={{top: 20, right: 20, bottom: 20, left: 20}} >
						{/* <CartesianGrid strokeDasharray="3 3" /> */}
						<XAxis dataKey="name" />
						<YAxis />
						<Tooltip />
						{/* <Legend /> */}
						<Bar dataKey="category" fill="#8884d8" />
						{/* <Bar dataKey="value" fill="#82ca9d" /> */}
					</BarChart>
				</ResponsiveContainer>
			</DashboardBox>
				
			<DashboardBox gridArea="b"></DashboardBox>
			<DashboardBox gridArea="c"></DashboardBox>
		</>
	);
}

export default Row1;
