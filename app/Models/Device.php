<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    protected $fillable = [
        'name',
        'type',
        'location',
        'status',
        'ip_address',
    ];      
    protected $casts = [
        'status' => 'boolean',
    ];

    protected $table = 'devices';
}
