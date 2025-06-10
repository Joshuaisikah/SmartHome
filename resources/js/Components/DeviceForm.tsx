import { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

interface DeviceFormProps {
    device?: Device | null;
    setDevices: (devices: Device[]) => void;
    closeForm: () => void; // New prop to handle form closing
}

export default function DeviceForm({ device = null, setDevices, closeForm }: DeviceFormProps) {
    const [formData, setFormData] = useState({
        name: device?.name || '',
        type: device?.type || '',
        location: device?.location || 'Kitchen',
        status: device?.status ? '1' : '0',
        ip_address: device?.ip_address || '',
    });
    const [ipError, setIpError] = useState<string | null>(null);

    const isValidIpAddress = (ip: string): boolean => {
        if (!ip) return true; // Allow empty since it's optional
        const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ip);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValidIpAddress(formData.ip_address)) {
            setIpError('Please enter a valid IP address (e.g., 192.168.1.1)');
            return;
        }

        try {
            if (device) {
                const response = await axios.put<Device>(`devices/${device.id}`, {
                    ...formData,
                    status: formData.status === '1',
                });
                setDevices(prev => prev.map(d => (d.id === device.id ? response.data : d)));
                toast.success('Device updated successfully!');
            } else {
                const response = await axios.post<Device>('/devices', {
                    ...formData,
                    status: formData.status === '1',
                });
                setDevices(prev => [...prev, response.data]);
                toast.success('Device added successfully!');
            }
            closeForm(); // Close the form after successful submission
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Failed to submit the form. Please try again.');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'ip_address') {
            setIpError(isValidIpAddress(value) ? null : 'Please enter a valid IP address (e.g., 192.168.1.1)');
        }
    };

    const handleClose = () => {
        console.log('Handle close called'); // Debug log
        closeForm(); // Use the new closeForm function
    };

    return (
        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
            <div className="p-6 text-gray-900 dark:text-gray-100">
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Device Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            id="name"
                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Device Type
                        </label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            id="type"
                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                            required
                        >
                            <option value="">Select Type</option>
                            <option value="light">Light</option>
                            <option value="thermostat">Thermostat</option>
                            <option value="camera">Camera</option>
                            <option value="tablet">Tablet</option>
                            <option value="pc">PC</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Location
                        </label>
                        <select
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            id="location"
                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                            required
                        >
                            <option value="Kitchen">Kitchen</option>
                            <option value="Living Room">Living Room</option>
                            <option value="Bedroom">Bedroom</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Status
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            id="status"
                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                        >
                            <option value="1">On</option>
                            <option value="0">Off</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="ip_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            IP Address (Optional)
                        </label>
                        <input
                            type="text"
                            name="ip_address"
                            value={formData.ip_address}
                            onChange={handleChange}
                            id="ip_address"
                            className={`mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm ${ipError ? 'border-red-500' : ''}`}
                            placeholder="e.g., 192.168.1.1"
                        />
                        {ipError && <p className="mt-1 text-sm text-red-500">{ipError}</p>}
                    </div>
                    <div className="flex items-center">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                            {device ? 'Update Device' : 'Add Device'}
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="ml-4 text-gray-600 dark:text-gray-400 hover:underline"
                        >
                            Close
                        </button>
                    </div>
                </form>
            </div>
            <ToastContainer />
        </div>
    );
}