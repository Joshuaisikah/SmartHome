<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('parental_control_settings', function (Blueprint $table) {
            $table->id();
            $table->json('app_restrictions')->nullable();
            $table->boolean('internet_restricted')->default(false);
            $table->json('custom_apps')->nullable(); // Add custom_apps column
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parental_control_settings');
    }
};