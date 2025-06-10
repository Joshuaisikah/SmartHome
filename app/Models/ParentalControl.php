<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParentalControl extends Model
{
    protected $fillable = [
        'device_name',
        'restricted_website',
        'restricted_app',
        'activity_log',
    ];
}
