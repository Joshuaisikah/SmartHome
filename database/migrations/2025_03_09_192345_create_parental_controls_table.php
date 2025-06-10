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
        Schema::create('parental_controls', function (Blueprint $table) {
            $table->id();
            $table->string('device_name'); // Name of the device being monitored
            $table->string('restricted_website')->nullable(); // Website to block
            $table->string('restricted_app')->nullable(); // App to block
            $table->text('activity_log')->nullable(); // JSON or text field for activity logs
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parental_controls');
    }
};
