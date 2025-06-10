<?php

namespace App\Http\Controllers;

use App\Models\ParentalControl;
use Illuminate\Http\Request;

class ParentalControlController extends Controller
{
    // Get all parental controls for the authenticated user
    public function index()
    {
        $parentalControls = ParentalControl::all();
        return response()->json($parentalControls);
    }

    // Add a new parental ccontrol
    public function store(Request $request)
    {
        $request->validate([
            'device_name' => 'required|string',
            'restricted_website' => 'nullable|string',
            'restricted_app' => 'nullable|string',
        ]);

        $parentalControl = ParentalControl::create([
            'device_name' => $request->device_name,
            'restricted_website' => $request->restricted_website,
            'restricted_app' => $request->restricted_app,
        ]);

        return response()->json($parentalControl, 201);
    }

    // Update a parental control
    public function update(Request $request, ParentalControl $parentalControl)
    {
        $request->validate([
            'device_name' => 'required|string',
            'restricted_website' => 'nullable|string',
            'restricted_app' => 'nullable|string',
        ]);

        $parentalControl->update($request->all());
        return response()->json($parentalControl);
    }

    // Delete a parental control
    public function destroy(ParentalControl $parentalControl)
    {
        $parentalControl->delete();
        return response()->json(null, 204);
    }

    // Add activity logs
    public function addActivityLog(Request $request, ParentalControl $parentalControl)
    {
        $request->validate([
            'activity_log' => 'required|string',
        ]);

        $parentalControl->update([
            'activity_log' => $request->activity_log,
        ]);

        return response()->json($parentalControl);
    }
}