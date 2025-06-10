<?php

namespace Database\Seeders;

use App\Models\Device;
use Illuminate\Database\Seeder;

class DeviceSeeder extends Seeder
{
    public function run(): void
    {
        Device::create([
            'name' => 'Kitchen Light',
            'type' => 'light',
            'location' => 'Kitchen',
            'ip_address' => '192.168.1.10',
            'status' => 1,
        ]);

        Device::create([
            'name' => 'Living Room Thermostat',
            'type' => 'thermostat',
            'location' => 'Living Room',
            'ip_address' => '192.168.1.11',
            'status' => 0,
        ]);

        Device::create([
            'name' => 'Bedroom Camera',
            'type' => 'camera',
            'location' => 'Bedroom',
            'ip_address' => '192.168.1.12',
            'status' => 1,
        ]);

        Device::create([
            'name' => 'Tablet',
            'type' => 'tablet',
            'location' => 'Living Room',
            'ip_address' => null,
            'status' => 0,
        ]);

        Device::create([
            'name' => 'Gaming PC',
            'type' => 'pc',
            'location' => 'Bedroom',
            'ip_address' => '192.168.1.13',
            'status' => 1,
        ]);
    }
}