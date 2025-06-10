import { Bar, Pie } from 'react-chartjs-2';
import Chart from 'chart.js/auto'; // Required for react-chartjs-2

interface DeviceGraphsProps {
    devices: Device[];
    setView: (view: 'graphs' | 'list' | 'form') => void;
}

export default function DeviceGraphs({ devices, setView }: DeviceGraphsProps) {
    // Data for Bar Chart (Devices per Location)
    const locationCounts = devices.reduce((acc, device) => {
        acc[device.location] = (acc[device.location] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const barData = {
        labels: Object.keys(locationCounts),
        datasets: [{
            label: 'Number of Devices',
            data: Object.values(locationCounts),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
        }],
    };

    // Data for Pie Chart (Device Status)
    const statusCounts = {
        on: devices.filter(device => device.status).length,
        off: devices.filter(device => !device.status).length,
    };

    const pieData = {
        labels: ['On', 'Off'],
        datasets: [{
            data: [statusCounts.on, statusCounts.off],
            backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
        }],
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Device Statistics</h3>
                <button
                    onClick={() => setView('list')}
                    className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                    View Device List
                </button>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <h4 className="text-md font-medium mb-2">Devices per Location</h4>
                    <Bar data={barData} options={{ responsive: true }} />
                </div>
                <div>
                    <h4 className="text-md font-medium mb-2">Device Statuses</h4>
                    <Pie data={pieData} options={{ responsive: true }} />
                </div>
            </div>
        </div>
    );
}