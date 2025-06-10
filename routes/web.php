<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\ParentalControlController;
use App\Http\Controllers\ParentalControlSettingsController;

Route::get('/', function () {
    return redirect()->route('login'); // Redirect to the login route
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/devices', [DeviceController::class, 'index']);
    Route::get('/devices/{location}', [DeviceController::class, 'show']);
    Route::post('/devices', [DeviceController::class, 'store']);
    Route::put('/devices/{device}', [DeviceController::class, 'update']);
    Route::delete('/devices/{device}', [DeviceController::class, 'destroy']);
    Route::patch('/devices/{device}/toggle', [DeviceController::class, 'toggle']);

    Route::prefix('api')->group(function () {
        Route::get('/parental-control/status', [ParentalControlSettingsController::class, 'status']);
        Route::post('/restrict-app/{app}', [ParentalControlSettingsController::class, 'restrictApp']);
        Route::post('/allow-app/{app}', [ParentalControlSettingsController::class, 'allowApp']);
        Route::post('/restrict-internet', [ParentalControlSettingsController::class, 'restrictInternet']);
        Route::post('/allow-internet', [ParentalControlSettingsController::class, 'allowInternet']);
        Route::get('/parental-control/settings', [ParentalControlSettingsController::class, 'index']);
        Route::post('/parental-control/settings', [ParentalControlSettingsController::class, 'store']);
        Route::post('/parental-control/add-app', [ParentalControlSettingsController::class, 'addApp']); // Add this route
    });
});

require __DIR__.'/auth.php';