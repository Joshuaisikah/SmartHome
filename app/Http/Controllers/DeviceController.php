<?php
namespace App\Http\Controllers;

use App\Models\Device;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    public function index()
    {
        return Device::all();
    }

    public function show($location)
    {
        return Device::where('location', $location)->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:light,thermostat,camera,tablet,pc',
            'location' => 'required|string|max:255',
            'ip_address' => 'nullable|ip',
            'status' => 'nullable|boolean',
        ]);

        $device = Device::create($data);
        return response()->json($device, 201);
    }

    public function update(Request $request, Device $device)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:light,thermostat,camera,tablet,pc',
            'location' => 'required|string|max:255',
            'ip_address' => 'nullable|ip',
            'status' => 'nullable|boolean',
        ]);

        $device->update($data);
        return response()->json($device);
    }

    public function destroy(Device $device)
    {
        $device->delete();
        return response()->json(null, 204);
    }

    public function toggle(Device $device)
    {
        $device->update(['status' => !$device->status]);
        return response()->json($device);
    }
}