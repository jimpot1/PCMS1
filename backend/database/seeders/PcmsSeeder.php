<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PcmsSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('departments')->insertOrIgnore([
            ['code' => 'IT', 'name' => 'Information Technology', 'location' => 'Main Building 3F'],
            ['code' => 'LIB', 'name' => 'Library', 'location' => 'Academic Center 1F'],
            ['code' => 'CLN', 'name' => 'Clinic', 'location' => 'Student Services Wing'],
            ['code' => 'LOG', 'name' => 'Logistics', 'location' => 'Operations Office'],
            ['code' => 'PPMO', 'name' => 'Procurement and Property Management Office', 'location' => 'Admin Building'],
        ]);

        DB::table('asset_categories')->insertOrIgnore([
            ['code' => 'COMP', 'name' => 'Computers and Peripherals', 'depreciation_rate' => 20, 'useful_life_years' => 5],
            ['code' => 'OFF', 'name' => 'Office Equipment', 'depreciation_rate' => 15, 'useful_life_years' => 7],
            ['code' => 'LAB', 'name' => 'Laboratory Equipment', 'depreciation_rate' => 10, 'useful_life_years' => 10],
        ]);
    }
}
