<?php

use Illuminate\Support\Facades\Schedule;

// Sweep for quantity anomalies, repeat repairs, etc. every hour.
Schedule::command('anomalies:analyze')->hourly();