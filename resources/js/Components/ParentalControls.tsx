import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    TextField,
    Typography,
    Grid,
    Card,
    CardContent,
} from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactApexChart from 'react-apexcharts';

interface Status {
    app_restrictions: string[];
    internet_restricted: boolean;
    available_apps: string[];
}

export default function ParentalControls() {
    const [status, setStatus] = useState<Status>({
        app_restrictions: [],
        internet_restricted: false,
        available_apps: [],
    });
    const [newAppName, setNewAppName] = useState('');
    const [newAppDomains, setNewAppDomains] = useState('');

    // State for the Radial Bar Chart (Pie Chart)
    const [radialChartState, setRadialChartState] = useState({
        series: [] as number[],
        options: {
            chart: {
                height: 200,
                type: 'radialBar',
            },
            plotOptions: {
                radialBar: {
                    offsetY: 0,
                    startAngle: 0,
                    endAngle: 270,
                    hollow: {
                        margin: 5,
                        size: '30%',
                        background: 'transparent',
                        image: undefined,
                    },
                    dataLabels: {
                        name: {
                            show: false,
                        },
                        value: {
                            show: false,
                        },
                    },
                    barLabels: {
                        enabled: true,
                        useSeriesColors: true,
                        offsetX: -8,
                        fontSize: '14px',
                        formatter: function (seriesName: string, opts: any) {
                            return seriesName + ': ' + opts.w.globals.series[opts.seriesIndex] + '%';
                        },
                    },
                },
            },
            colors: ['#1ab7ea', '#0084ff', '#39539E', '#0077B5', '#00C4B4', '#F4A261'],
            labels: [] as string[],
            responsive: [
                {
                    breakpoint: 480,
                    options: {
                        legend: {
                            show: false,
                        },
                    },
                },
            ],
        },
    });

    // State for the Mixed Chart (Graph)
    const [mixedChartState, setMixedChartState] = useState({
        series: [] as { name: string; type: string; data: number[] }[],
        options: {
            chart: {
                height: 300,
                type: 'line',
                stacked: false,
            },
            stroke: {
                width: [0, 2],
                curve: 'smooth',
            },
            plotOptions: {
                bar: {
                    columnWidth: '50%',
                },
            },
            fill: {
                opacity: [0.85, 0.25],
                gradient: {
                    inverseColors: false,
                    shade: 'light',
                    type: 'vertical',
                    opacityFrom: 0.85,
                    opacityTo: 0.55,
                    stops: [0, 100, 100, 100],
                },
            },
            labels: [
                '01/01/2025',
                '02/01/2025',
                '03/01/2025',
                '04/01/2025',
                '05/01/2025',
                '06/01/2025',
                '07/01/2025',
                '08/01/2025',
                '09/01/2025',
                '10/01/2025',
                '11/01/2025',
            ],
            markers: {
                size: 0,
            },
            xaxis: {
                type: 'datetime',
            },
            yaxis: {
                title: {
                    text: 'Restriction Status',
                },
                max: 100,
            },
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: function (y: number) {
                        if (typeof y !== 'undefined') {
                            return y.toFixed(0) + '% restricted';
                        }
                        return y;
                    },
                },
            },
        },
    });

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await axios.get('/api/parental-control/status');
                console.log('API Response:', response.data); // Log the response to debug

                // Normalize the response data
                const normalizedData: Status = {
                    app_restrictions: Array.isArray(response.data.app_restrictions)
                        ? response.data.app_restrictions
                        : [], // Fallback to empty array if not an array
                    internet_restricted: response.data.internet_restricted ?? false, // Fallback to false if undefined
                    available_apps: Array.isArray(response.data.available_apps)
                        ? response.data.available_apps
                        : [], // Fallback to empty array if not an array
                };

                setStatus(normalizedData);

                // Update Radial Chart data
                const radialSeries = normalizedData.available_apps.map((app: string) =>
                    normalizedData.app_restrictions.includes(app) ? 100 : 0
                );
                setRadialChartState((prev) => ({
                    ...prev,
                    series: radialSeries,
                    options: {
                        ...prev.options,
                        labels: normalizedData.available_apps,
                    },
                }));

                // Update Mixed Chart data
                const mixedSeries = normalizedData.available_apps.map((app: string, index: number) => {
                    const type = index % 2 === 0 ? 'column' : 'area';
                    const data = Array.from({ length: 11 }, (_, dayIndex) => {
                        const isRestricted = normalizedData.app_restrictions.includes(app);
                        if (isRestricted) {
                            return dayIndex >= 6 ? 100 : Math.min(20 * (dayIndex + 1), 100);
                        } else {
                            return dayIndex >= 6 ? 0 : Math.max(100 - 20 * (dayIndex + 1), 0);
                        }
                    });
                    return {
                        name: app,
                        type: type,
                        data: data,
                    };
                });
                setMixedChartState((prev) => ({
                    ...prev,
                    series: mixedSeries,
                }));
            } catch (error) {
                console.error('Error fetching status:', error);
                toast.error('Failed to fetch status: ' + (error.message || 'Unknown error'));
                // Set a fallback state to prevent further errors
                setStatus({
                    app_restrictions: [],
                    internet_restricted: false,
                    available_apps: [],
                });
            }
        };
        fetchStatus();
    }, []);

    const handleAppToggle = async (app: string, restrict: boolean) => {
        try {
            const endpoint = restrict ? `/api/restrict-app/${app}` : `/api/allow-app/${app}`;
            await axios.post(endpoint);
            setStatus((prev) => {
                const newAppRestrictions = restrict
                    ? [...prev.app_restrictions, app]
                    : prev.app_restrictions.filter((a) => a !== app);

                // Update Radial Chart series
                const newRadialSeries = status.available_apps.map((availableApp: string) =>
                    newAppRestrictions.includes(availableApp) ? 100 : 0
                );
                setRadialChartState((prevChart) => ({
                    ...prevChart,
                    series: newRadialSeries,
                }));

                // Update Mixed Chart series
                const newMixedSeries = status.available_apps.map((availableApp: string, index: number) => {
                    const type = index % 2 === 0 ? 'column' : 'area';
                    const data = Array.from({ length: 11 }, (_, dayIndex) => {
                        const isRestricted = newAppRestrictions.includes(availableApp);
                        if (isRestricted) {
                            return dayIndex >= 6 ? 100 : Math.min(20 * (dayIndex + 1), 100);
                        } else {
                            return dayIndex >= 6 ? 0 : Math.max(100 - 20 * (dayIndex + 1), 0);
                        }
                    });
                    return {
                        name: availableApp,
                        type: type,
                        data: data,
                    };
                });
                setMixedChartState((prev) => ({
                    ...prev,
                    series: newMixedSeries,
                }));

                return {
                    ...prev,
                    app_restrictions: newAppRestrictions,
                };
            });
            toast.success(`${restrict ? 'Restricted' : 'Allowed'} ${app} successfully!`);
        } catch (error) {
            console.error(`Error ${restrict ? 'restricting' : 'allowing'} app:`, error);
            toast.error(`Failed to ${restrict ? 'restrict' : 'allow'} ${app}: ${error.message || 'Unknown error'}`);
        }
    };

    const handleInternetToggle = async (restrict: boolean) => {
        try {
            const endpoint = restrict ? '/api/restrict-internet' : '/api/allow-internet';
            const response = await axios.post(endpoint);
            if (response.data.error) {
                toast.error(response.data.error);
                return;
            }
            setStatus((prev) => ({ ...prev, internet_restricted: restrict }));
            toast.success(`Internet ${restrict ? 'restricted' : 'allowed'} successfully!`);
        } catch (error) {
            console.error(`Error ${restrict ? 'restricting' : 'allowing'} internet:`, error);
            toast.error(`Failed to ${restrict ? 'restrict' : 'allow'} internet: ${error.message || 'Unknown error'}`);
        }
    };

    const handleAddApp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAppName || !newAppDomains) {
            toast.warn('Please enter both an app name and at least one domain.');
            return;
        }

        const domains = newAppDomains
            .split(',')
            .map((domain) => domain.trim())
            .filter((domain) => domain);
        if (domains.length === 0) {
            toast.warn('Please enter at least one valid domain.');
            return;
        }

        try {
            const response = await axios.post('/api/parental-control/add-app', {
                name: newAppName,
                domains: domains,
            });
            if (response.data.success) {
                const statusResponse = await axios.get('/api/parental-control/status');
                // Normalize the response data
                const normalizedData: Status = {
                    app_restrictions: Array.isArray(statusResponse.data.app_restrictions)
                        ? statusResponse.data.app_restrictions
                        : [],
                    internet_restricted: statusResponse.data.internet_restricted ?? false,
                    available_apps: Array.isArray(statusResponse.data.available_apps)
                        ? statusResponse.data.available_apps
                        : [],
                };
                setStatus(normalizedData);

                // Update Radial Chart
                const newRadialSeries = normalizedData.available_apps.map((app: string) =>
                    normalizedData.app_restrictions.includes(app) ? 100 : 0
                );
                setRadialChartState((prev) => ({
                    ...prev,
                    series: newRadialSeries,
                    options: {
                        ...prev.options,
                        labels: normalizedData.available_apps,
                    },
                }));

                // Update Mixed Chart
                const newMixedSeries = normalizedData.available_apps.map((app: string, index: number) => {
                    const type = index % 2 === 0 ? 'column' : 'area';
                    const data = Array.from({ length: 11 }, (_, dayIndex) => {
                        const isRestricted = normalizedData.app_restrictions.includes(app);
                        if (isRestricted) {
                            return dayIndex >= 6 ? 100 : Math.min(20 * (dayIndex + 1), 100);
                        } else {
                            return dayIndex >= 6 ? 0 : Math.max(100 - 20 * (dayIndex + 1), 0);
                        }
                    });
                    return {
                        name: app,
                        type: type,
                        data: data,
                    };
                });
                setMixedChartState((prev) => ({
                    ...prev,
                    series: newMixedSeries,
                }));

                setNewAppName('');
                setNewAppDomains('');
                toast.success(response.data.message);
            } else {
                toast.error(response.data.error || 'Failed to add app.');
            }
        } catch (error) {
            console.error('Error adding app:', error);
            toast.error('Failed to add app: ' + (error.message || 'Unknown error'));
        }
    };

    return (
        <div className="mt-8 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <Typography variant="h4" gutterBottom>
                Parental Controls
            </Typography>

            {/* Current Restrictions as a Raised Card with Hover Effect */}
            <Card
                elevation={3}
                sx={{
                    mb: 2,
                    borderRadius: '8px',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                        elevation: 6,
                        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                        transform: 'translateY(-2px)',
                    },
                    bgcolor: 'background.paper', // Matches bg-white/dark:bg-gray-800
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Current Restrictions
                    </Typography>
                    <Typography>
                        Restricted Apps:{' '}
                        {Array.isArray(status.app_restrictions)
                            ? status.app_restrictions.join(', ') || 'None'
                            : 'None'}
                    </Typography>
                    <Typography>
                        Internet: {status.internet_restricted ? 'Restricted' : 'Allowed'}
                    </Typography>
                </CardContent>
            </Card>

            {/* Charts Row */}
            {status.available_apps.length > 0 ? (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        App Restriction Overview
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                        {/* Mixed Chart (Graph) */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom>
                                Restriction Trends
                            </Typography>
                            <ReactApexChart
                                options={mixedChartState.options}
                                series={mixedChartState.series}
                                type="line"
                                height={300}
                            />
                        </Grid>
                        {/* Radial Bar Chart (Pie Chart) */}
                        <Grid
                            item
                            xs={12}
                            md={6}
                            sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                            }}
                        >
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    Restriction Status
                                </Typography>
                                <ReactApexChart
                                    options={radialChartState.options}
                                    series={radialChartState.series}
                                    type="radialBar"
                                    height={200}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            ) : (
                <Typography sx={{ mt: 4 }}>
                    No apps available to display in the charts.
                </Typography>
            )}

            <Typography gutterBottom sx={{ mt: 2 }}>
                Restrict Apps
            </Typography>
            {status.available_apps.map((app) => (
                <FormControlLabel
                    key={app}
                    control={
                        <Checkbox
                            checked={
                                Array.isArray(status.app_restrictions) &&
                                status.app_restrictions.includes(app)
                            }
                            onChange={(e) => handleAppToggle(app, e.target.checked)}
                        />
                    }
                    label={`Restrict ${app}`}
                />
            ))}

            <Typography gutterBottom sx={{ mt: 2 }}>
                Add New App/Site to Restrict
            </Typography>
            <Box component="form" onSubmit={handleAddApp} sx={{ mb: 2 }}>
                <TextField
                    label="App/Site Name"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    sx={{ mr: 1, mb: 1 }}
                    size="small"
                />
                <TextField
                    label="Domains (comma-separated)"
                    value={newAppDomains}
                    onChange={(e) => setNewAppDomains(e.target.value)}
                    sx={{ mr: 1, mb: 1 }}
                    size="small"
                    helperText="e.g., whatsapp.com, whatsapp.net"
                />
                <Button type="submit" variant="contained" color="primary">
                    Add App/Site
                </Button>
            </Box>

            <Typography gutterBottom sx={{ mt: 2 }}>
                Internet Access
            </Typography>
            <Button
                variant="contained"
                color="secondary"
                onClick={() => handleInternetToggle(true)}
                disabled={status.internet_restricted}
                sx={{ mr: 1 }}
            >
                Restrict Internet
            </Button>
            <Button
                variant="contained"
                color="primary"
                onClick={() => handleInternetToggle(false)}
                disabled={!status.internet_restricted}
            >
                Allow Internet
            </Button>

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />
        </div>
    );
}