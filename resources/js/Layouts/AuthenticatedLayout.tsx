import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useEffect } from 'react';
import axios from 'axios';
import { FaHome, FaBolt, FaCircle, FaStar } from 'react-icons/fa';
import ParentalControls from '@/Components/ParentalControls';

export default function Authenticated({
    header,
    children,
    devices: initialDevices = [],
    setDevices,
    setEditingDevice,
    handleAdd,
    fetchDevices: parentFetchDevices,
    onViewChange, // Add this prop
}: PropsWithChildren<{
    header?: ReactNode;
    devices?: any[];
    setDevices: (devices: any[]) => void;
    setEditingDevice: (device: any | null) => void;
    handleAdd: () => void;
    fetchDevices?: (location: string | null) => void;
    onViewChange?: (view: 'graphs' | 'management') => void; // Define the prop type
}>) {
    const user = usePage().props.auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const [devices, setLocalDevices] = useState<any[]>(initialDevices);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchDevices(selectedLocation);
    }, [selectedLocation]);

    const fetchDevices = async (location: string | null = null) => {
        setLoading(true);
        // Adjust URL based on location, but skip fetching devices for Parental Controls
        if (location === 'Parental Controls') {
            setLocalDevices([]); // Clear devices when showing Parental Controls
            setLoading(false);
            return;
        }

        const url = location ? `/devices/${location}` : '/devices';
        try {
            const response = await axios.get<any[]>(url);
            setLocalDevices(response.data);
            if (setDevices) setDevices(response.data);
        } catch (error) {
            console.error('Error fetching devices:', error);
            setLocalDevices([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
            {/* Fixed Navigation */}
            <nav className="fixed top-0 left-0 w-full border-b border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 z-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <div className="flex items-center">
                            <Link href="/">
                                <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800 dark:text-gray-200" />
                            </Link>
                            <div className="hidden ml-10 space-x-8 sm:-my-px sm:flex">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                >
                                    Dashboard
                                </NavLink>
                            </div>
                        </div>

                        <div className="hidden sm:ml-6 sm:flex sm:items-center">
                            <div className="relative ml-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                                            >
                                                {user.name}
                                                <svg
                                                    className="-mr-0.5 ml-2 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link href={route('profile.edit')}>
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-mr-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none dark:text-gray-500 dark:hover:bg-gray-900 dark:hover:text-gray-400 dark:focus:bg-gray-900 dark:focus:text-gray-400"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        (showingNavigationDropdown ? 'block' : 'hidden') +
                        ' sm:hidden'
                    }
                >
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                        >
                            Dashboard
                        </ResponsiveNavLink>
                    </div>

                    <div className="border-t border-gray-200 pb-1 pt-4 dark:border-gray-600">
                        <div className="px-4">
                            <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                                {user.name}
                            </div>
                            <div className="text-sm font-medium text-gray-500">
                                {user.email}
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>
                                Profile
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                            >
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Fixed Header */}
            {header && (
                <header className="fixed top-16 left-0 w-full bg-white shadow dark:bg-gray-800 z-20">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            {/* Fixed Sidebar */}
            <div className="fixed top-16 left-0 h-screen w-64 bg-gray-800 text-white p-4 z-20">
                <div className="p-4">
                    <h3 className="text-lg font-semibold">Locations</h3>
                    <ul className="mt-4 space-y-2">
                        <li>
                            <button
                                onClick={() => {
                                    setSelectedLocation(null);
                                    fetchDevices();
                                    onViewChange?.('management'); // Switch to DeviceManagement
                                }}
                                className="flex items-center p-2 hover:bg-gray-700 rounded w-full text-left"
                            >
                                <FaHome className="w-6 h-6 mr-2" />
                                All Devices
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => {
                                    setSelectedLocation('Kitchen');
                                    fetchDevices('Kitchen');
                                    onViewChange?.('management'); // Switch to DeviceManagement
                                }}
                                className="flex items-center p-2 hover:bg-gray-700 rounded w-full text-left"
                            >
                                <FaBolt className="w-6 h-6 mr-2" />
                                Kitchen
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => {
                                    setSelectedLocation('Living Room');
                                    fetchDevices('Living Room');
                                    onViewChange?.('management'); // Switch to DeviceManagement
                                }}
                                className="flex items-center p-2 hover:bg-gray-700 rounded w-full text-left"
                            >
                                <FaCircle className="w-6 h-6 mr-2" />
                                Living Room
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => {
                                    setSelectedLocation('Bedroom');
                                    fetchDevices('Bedroom');
                                    onViewChange?.('management'); // Switch to DeviceManagement
                                }}
                                className="flex items-center p-2 hover:bg-gray-700 rounded w-full text-left"
                            >
                                <FaStar className="w-6 h-6 mr-2" />
                                Bedroom
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => {
                                    setSelectedLocation('Parental Controls');
                                    fetchDevices('Parental Controls');
                                    onViewChange?.('management'); // Optional: You might not need this for Parental Controls
                                }}
                                className="flex items-center p-2 hover:bg-gray-700 rounded w-full text-left"
                            >
                                <FaCircle className="w-6 h-6 mr-2" />
                                Parental Controls
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Main Content with Padding for Fixed Elements */}
            <main className="flex-1 ml-64 mt-32">
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <>
                        {selectedLocation === 'Parental Controls' ? (
                            <ParentalControls />
                        ) : (
                            children // Render DeviceManagement or DeviceGraphs based on view
                        )}
                    </>
                )}
            </main>
        </div>
    );
}