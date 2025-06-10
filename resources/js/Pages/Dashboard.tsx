import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, PageProps } from '@inertiajs/react';
import DeviceManagement from '../Components/DeviceManagement';
import DeviceGraphs from '../Components/DeviceGraphs';
import { useState, useEffect } from 'react';

// Define props type using PageProps from Inertia
interface DashboardProps extends PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
}

export default function Dashboard({ auth }: DashboardProps) {
    const [devices, setDevices] = useState<any[]>([]);
    const [editingDevice, setEditingDevice] = useState<any | null>(null);
    const [addingDevice, setAddingDevice] = useState<boolean>(false);
    const [view, setView] = useState<'graphs' | 'management'>('graphs'); // Default to 'graphs'

    const handleAdd = () => {
        setEditingDevice(null); // Reset editing device
        setAddingDevice(true); // Trigger adding state
    };

    // Callback to handle sidebar link clicks
    const handleViewChange = (newView: 'graphs' | 'management') => {
        setView(newView);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Dashboard
                </h2>
            }
            devices={devices}
            setDevices={setDevices}
            setEditingDevice={setEditingDevice}
            handleAdd={handleAdd}
            setAddingDevice={setAddingDevice}
            onViewChange={handleViewChange} // Pass the callback to AuthenticatedLayout
        >
            <Head title="Dashboard" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {view === 'graphs' ? (
                        <DeviceGraphs devices={devices} setView={setView} />
                    ) : (
                        <DeviceManagement
                            devices={devices}
                            setEditingDevice={setEditingDevice}
                            setDevices={setDevices}
                            handleAdd={handleAdd}
                            setAddingDevice={setAddingDevice}
                        />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}