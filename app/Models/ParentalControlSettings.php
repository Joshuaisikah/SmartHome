<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParentalControlSettings extends Model
{   protected $table = 'parental_control_settings';
    protected $fillable = [
        'content_filtering',
        'time_limits',
        'screen_time_limit',
        'app_restrictions',
        'bedtime',
        'device_restrictions',
        'internet_access_schedule',
        'usage_reports',
        'app_restrictions',
        'custom_apps',
    ];
}
