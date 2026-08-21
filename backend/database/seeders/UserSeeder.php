<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@pcms.com'],
            [
                'employee_id' => 'ADMIN',
                'first_name' => 'System',
                'middle_name' => null,
                'last_name' => 'Administrator',
                'password_hash' => Hash::make('Admin123!'),
                'role' => 'System Administrator',
                'status' => 'active'
            ]
        );

        User::updateOrCreate(
            ['email' => 'requester@pcms.test'],
            [
                'employee_id' => 'REQ-LOG-001',
                'first_name' => 'Logistics',
                'middle_name' => null,
                'last_name' => 'Requester',
                'password_hash' => Hash::make('Password123!'),
                'role' => 'Requester',
                'department' => 'Logistics',
                'status' => 'active',
            ]
        );

        User::updateOrCreate(
            ['email' => 'depthead@pcms.test'],
            [
                'employee_id' => 'HEAD-LOG-001',
                'first_name' => 'Logistics',
                'middle_name' => null,
                'last_name' => 'Department Head',
                'password_hash' => Hash::make('Password123!'),
                'role' => 'Department Head',
                'department' => 'Logistics',
                'status' => 'active',
            ]
        );

        User::updateOrCreate(
            ['email' => 'oic@pcms.test'],
            [
                'employee_id' => 'OIC-001',
                'first_name' => 'System',
                'middle_name' => null,
                'last_name' => 'OIC',
                'full_name' => 'System OIC',
                'password_hash' => Hash::make('Password123!'),
                'role' => 'OIC',
                'department' => null,
                'status' => 'active',
            ]
        );

        User::updateOrCreate(
            ['email' => 'president@pcms.test'],
            [
                'employee_id' => 'PRES-001',
                'first_name' => 'System',
                'middle_name' => null,
                'last_name' => 'President',
                'full_name' => 'System President',
                'password_hash' => Hash::make('Password123!'),
                'role' => 'President',
                'department' => null,
                'status' => 'active',
            ]
        );

        User::updateOrCreate(
            ['email' => 'ceo@pcms.test'],
            [
                'employee_id' => 'CEO-001',
                'first_name' => 'System',
                'middle_name' => null,
                'last_name' => 'CEO',
                'full_name' => 'System CEO',
                'password_hash' => Hash::make('Password123!'),
                'role' => 'CEO',
                'department' => null,
                'status' => 'active',
            ]
        );

        User::updateOrCreate(
            ['email' => 'recommender@pcms.test'],
            [
                'employee_id' => 'REC-001',
                'first_name' => 'Recommending',
                'middle_name' => null,
                'last_name' => 'Approver',
                'full_name' => 'Recommending Approver',
                'password_hash' => Hash::make('Recommend123!'),
                'role' => 'Recommending Approver',
                'department' => null,
                'status' => 'active',
            ]
        );

        User::updateOrCreate(
            ['email' => 'ppmostaff@pcms.test'],
            [
                'employee_id' => 'PPMO-001',
                'first_name' => 'PPMO',
                'middle_name' => null,
                'last_name' => 'Staff',
                'full_name' => 'PPMO Staff',
                'password_hash' => Hash::make('PPMOstaff123!'),
                'role' => 'PPMO Staff',
                'department' => null,
                'status' => 'active',
            ]
        );
    }
}
