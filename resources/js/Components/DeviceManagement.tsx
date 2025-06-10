import axios from 'axios';
import {
    FaBolt,
    FaCircle,
    FaEdit,
    FaHome,
    FaPowerOff,
    FaStar,
    FaTrash,
} from 'react-icons/fa';
import { FaBedPulse, FaKitchenSet } from 'react-icons/fa6';

interface Device {
    id: number;
    name: string;
    type: string;
    location: string;
    status: boolean;
    ip_address: string | null;
    created_at: string;
    updated_at: string;
}

interface DeviceListProps {
    devices: Device[] | undefined;
    setEditingDevice: (device: Device | null) => void;
    setDevices: (devices: Device[]) => void;
    handleAdd: () => void;
    setAddingDevice?: (adding: boolean) => void;
    setViewMode?: (mode: 'dashboard' | 'list') => void; // Added prop
}

export default function DeviceList({
    devices = [],
    setEditingDevice,
    setDevices,
    handleAdd,
    setAddingDevice,
    setViewMode,
}: DeviceListProps) {
    const handleToggle = async (id: number) => {
        const response = await axios.patch<Device>(`/devices/${id}/toggle`);
        setDevices(devices.map((d) => (d.id === id ? response.data : d)));
    };

    const handleEdit = (device: Device) => {
        console.log('Editing device in DeviceList:', device);
        setEditingDevice(device);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure?')) {
            await axios.delete(`/devices/${id}`);
            setDevices(devices.filter((d) => d.id !== id));
        }
    };

    const getDeviceIcon = (location: string) => {
        switch (location) {
            case 'Kitchen':
                return <FaKitchenSet className="h-12 w-12 text-white" />;
            case 'Living Room':
                return <FaCircle className="h-12 w-12 text-white" />;
            case 'Bedroom':
                return <FaBedPulse className="h-12 w-12 text-white" />;
            default:
                return <FaHome className="h-12 w-12 text-white" />;
        }
    };

    const triggerAdd = () => {
        console.log('Adding device in DeviceList');
        if (setAddingDevice) {
            setAddingDevice(true);
        }
        handleAdd();
    };

    console.log('Devices prop in DeviceList:', devices);

    return (
        <>
            <div className="mb-6 overflow-hidden shadow-sm sm:rounded-lg">
                <div className="p-6 text-gray-900 dark:text-gray-100">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-medium">Device Management</h3>
                        <div className="space-x-2">
                            <button
                                onClick={() => setViewMode && setViewMode('dashboard')}
                                className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                            >
                                Back to Dashboard
                            </button>
                            <button
                                onClick={triggerAdd}
                                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                            >
                                Add Device
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {devices && devices.length > 0 ? (
                            devices.map((device) => (
                                <div
                                    key={device.id}
                                    className="flex transform rounded-lg bg-white shadow-md transition-shadow duration-300 hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <div className="flex w-1/3 items-center justify-center rounded-l-lg bg-gray-800">
                                        {getDeviceIcon(device.location)}
                                    </div>
                                    <div className="flex w-2/3 flex-col justify-between p-4">
                                        <div>
                                            <h4 className="text-md font-semibold text-gray-800">
                                                {device.name}
                                            </h4>
                                            <p className="text-sm text-gray-500">
                                                {device.type}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {device.location}
                                            </p>
                                            <p
                                                className={`text-sm font-medium ${device.status ? 'text-green-500' : 'text-red-500'}`}
                                            >
                                                {device.status ? 'On' : 'Off'}
                                            </p>
                                        </div>
                                        <div className="mt-4 flex space-x-2">
                                            <button
                                                onClick={() => handleToggle(device.id)}
                                                className={`rounded-full p-2 transition duration-300 ${
                                                    device.status
                                                        ? 'bg-green-500 hover:bg-green-600'
                                                        : 'bg-red-500 hover:bg-red-600'
                                                } text-white`}
                                            >
                                                <FaPowerOff className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(device)}
                                                className="rounded-full bg-blue-500 p-2 text-white transition duration-300 hover:bg-blue-600"
                                            >
                                                <FaEdit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(device.id)}
                                                className="rounded-full bg-red-600 p-2 text-white transition duration-300 hover:bg-red-700"
                                            >
                                                <FaTrash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center text-gray-500">
                                No devices found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}