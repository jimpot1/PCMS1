-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 26, 2026 at 06:29 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pcms`
--

-- --------------------------------------------------------

--
-- Table structure for table `accountability_forms`
--

CREATE TABLE `accountability_forms` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `assignment_id` bigint(20) UNSIGNED NOT NULL,
  `form_number` varchar(50) NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `generated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `accountability_forms`
--

INSERT INTO `accountability_forms` (`id`, `assignment_id`, `form_number`, `payload`, `generated_at`, `created_at`, `updated_at`) VALUES
(4, 23, 'PAR-2026-000023', '{\"par_number\":\"PAR-2026-000023\",\"employee\":{\"id\":\"d2313059-00af-458d-af1c-412da9de90ac\",\"employee_id\":\"REQ-LOG-001\",\"name\":\"Requester Account\",\"department\":\"Logistics\",\"role\":\"Requester\"},\"asset\":{\"id\":43,\"property_number\":\"BCP - IT - 2026-000145\",\"serial_number\":\"DELL7H4K92X1\",\"name\":\"Dell OptiPlex 7010 Desktop Computer\",\"brand\":\"Dell\",\"model\":\"OptiPlex 7010 MT\",\"acquisition_cost\":42500,\"qr_code_path\":\"assets\\/qr-43.png\",\"location\":\"IT Office - Room 204\",\"warranty_until\":\"2028-03-15\"},\"assignment\":{\"type\":\"permanent\",\"quantity\":1,\"assigned_at\":\"2026-08-24T00:00:00.000000Z\",\"due_date\":\"2026-10-20T00:00:00.000000Z\",\"purpose\":\"qwe\"},\"accountability_statement\":\"I, Requester Account, acknowledge receipt of Dell OptiPlex 7010 Desktop Computer with property number BCP - IT - 2026-000145 and serial number DELL7H4K92X1. I understand that I am accountable for its safekeeping, proper use, and return or clearance upon request.\",\"custodian_accountability_statement\":\"Custodian acknowledges the assignment and the employee\'s responsibility for the proper care and return of the asset.\"}', '2026-08-24 08:32:46', '2026-08-24 08:32:46', '2026-08-24 08:32:46');

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `action` varchar(80) DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `status` varchar(40) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `action`, `payload`, `status`, `created_at`, `updated_at`) VALUES
(2, 'gate_pass_created', '{\"ip\": \"127.0.0.1\", \"user\": \"requester@pcms.test\", \"action\": \"gate_pass_created\", \"gate_pass_id\": 5, \"gate_pass_number\": \"GP-2026-000005\"}', 'active', '2026-07-20 18:38:07', '2026-07-20 18:38:07'),
(3, 'gate_pass_created', '{\"ip\": \"127.0.0.1\", \"user\": \"requester@pcms.test\", \"action\": \"gate_pass_created\", \"gate_pass_id\": 6, \"gate_pass_number\": \"GP-2026-000006\"}', 'active', '2026-07-20 18:38:54', '2026-07-20 18:38:54'),
(4, 'gate_pass_approved', '{\"ip\": \"127.0.0.1\", \"user\": \"depthead@pcms.test\", \"action\": \"gate_pass_approved\", \"gate_pass_id\": 6, \"gate_pass_number\": \"GP-2026-000006\"}', 'active', '2026-07-20 18:39:02', '2026-07-20 18:39:02'),
(5, 'gate_pass_returned', '{\"ip\": \"127.0.0.1\", \"user\": \"requester@pcms.test\", \"action\": \"gate_pass_returned\", \"gate_pass_id\": 6, \"gate_pass_number\": \"GP-2026-000006\"}', 'active', '2026-07-20 18:39:10', '2026-07-20 18:39:10'),
(6, 'gate_pass_created', '{\"ip\": \"127.0.0.1\", \"user\": \"requester@pcms.test\", \"action\": \"gate_pass_created\", \"gate_pass_id\": 7, \"gate_pass_number\": \"GP-2026-000007\"}', 'active', '2026-07-20 19:15:46', '2026-07-20 19:15:46'),
(7, 'gate_pass_approved', '{\"ip\": \"127.0.0.1\", \"user\": \"depthead@pcms.test\", \"action\": \"gate_pass_approved\", \"gate_pass_id\": 7, \"gate_pass_number\": \"GP-2026-000007\"}', 'active', '2026-07-20 19:16:27', '2026-07-20 19:16:27'),
(8, 'transfer_approved', '{\"ip\": \"127.0.0.1\", \"user\": \"system\", \"action\": \"transfer_approved\", \"transfer_id\": 2, \"transfer_number\": \"TEST-TR-000002\"}', 'active', '2026-07-23 06:01:16', '2026-07-23 06:01:16'),
(9, 'gate_pass_released', '{\"ip\": \"127.0.0.1\", \"user\": \"system\", \"action\": \"gate_pass_released\", \"gate_pass_id\": 8, \"gate_pass_number\": \"TEST-GP-000001\"}', 'active', '2026-07-23 06:03:09', '2026-07-23 06:03:09'),
(10, 'gate_pass_returned', '{\"ip\": \"127.0.0.1\", \"user\": \"system\", \"action\": \"gate_pass_returned\", \"gate_pass_id\": 8, \"gate_pass_number\": \"TEST-GP-000001\"}', 'active', '2026-07-23 06:03:11', '2026-07-23 06:03:11'),
(11, 'gate_pass_scanned', '{\"ip\": \"127.0.0.1\", \"user\": \"system\", \"action\": \"gate_pass_scanned\", \"new_status\": \"returned\", \"gate_pass_id\": 8, \"gate_pass_number\": \"TEST-GP-000001\"}', 'active', '2026-07-23 06:03:13', '2026-07-23 06:03:13'),
(12, 'gate_pass_scanned', '{\"ip\": \"127.0.0.1\", \"user\": \"system\", \"action\": \"gate_pass_scanned\", \"new_status\": \"approved\", \"gate_pass_id\": 8, \"gate_pass_number\": \"TEST-GP-000001\"}', 'active', '2026-07-23 06:03:14', '2026-07-23 06:03:14'),
(14, 'audit_completed', '{\"ip\": \"127.0.0.1\", \"user\": \"system\", \"action\": \"audit_completed\", \"audit_id\": 4}', 'active', '2026-07-23 06:15:55', '2026-07-23 06:15:55'),
(15, 'anomaly_resolved', '{\"ip\": \"127.0.0.1\", \"user\": \"system\", \"action\": \"anomaly_resolved\", \"anomaly_id\": 2, \"correction_applied\": false}', 'active', '2026-07-23 06:20:20', '2026-07-23 06:20:20'),
(16, 'anomaly_resolved', '{\"ip\": \"127.0.0.1\", \"user\": \"system\", \"action\": \"anomaly_resolved\", \"anomaly_id\": 4, \"correction_applied\": true}', 'active', '2026-07-23 06:21:43', '2026-07-23 06:21:43'),
(17, 'anomaly_resolved', '{\"ip\": \"127.0.0.1\", \"user\": \"system\", \"action\": \"anomaly_resolved\", \"anomaly_id\": 5, \"correction_applied\": false}', 'active', '2026-07-23 06:22:00', '2026-07-23 06:22:00'),
(18, 'purchase_request_released', '{\"ip\": \"127.0.0.1\", \"user\": \"system\", \"action\": \"purchase_request_released\", \"request_number\": \"TEST-PR-000001\", \"purchase_request_id\": 1}', 'active', '2026-07-23 06:25:06', '2026-07-23 06:25:06'),
(19, 'purchase_request_released', '{\"ip\": \"127.0.0.1\", \"user\": \"system\", \"action\": \"purchase_request_released\", \"request_number\": \"TEST-PR-000002\", \"purchase_request_id\": 2}', 'active', '2026-07-23 06:25:30', '2026-07-23 06:25:30'),
(21, 'asset_registered', '{\"ip\": \"127.0.0.1\", \"user\": \"system\", \"action\": \"asset_registered\", \"asset_id\": 28, \"property_number\": \"BCP-PPMO-2026-000002\"}', 'active', '2026-07-23 06:43:25', '2026-07-23 06:43:25'),
(22, 'asset_updated', '{\"ip\": \"127.0.0.1\", \"user\": \"system\", \"action\": \"asset_updated\", \"asset_id\": 20, \"property_number\": \"BCP-IT-2026-000145-R\"}', 'active', '2026-07-23 06:44:14', '2026-07-23 06:44:14'),
(23, 'audit_scan_recorded', '{\"ip\": \"127.0.0.1\", \"user\": \"system\", \"action\": \"audit_scan_recorded\", \"asset_id\": 20, \"audit_id\": 5}', 'active', '2026-07-23 07:18:03', '2026-07-23 07:18:03'),
(25, 'supply_created', '{\"ip\": \"127.0.0.1\", \"sku\": \"TEST-BONDPAPER-01\", \"user\": \"system\", \"action\": \"supply_created\", \"supply_id\": 6}', 'active', '2026-07-23 08:53:56', '2026-07-23 08:53:56'),
(26, 'supply_created', '{\"ip\": \"127.0.0.1\", \"sku\": \"SSP-10024396\", \"user\": \"admin@pcms.com\", \"action\": \"supply_created\", \"supply_id\": 7}', 'active', '2026-07-23 08:56:02', '2026-07-23 08:56:02'),
(27, 'anomaly_resolved', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"anomaly_resolved\", \"anomaly_id\": \"9\", \"correction_applied\": false}', 'active', '2026-07-23 09:36:06', '2026-07-23 09:36:06'),
(28, 'anomaly_analysis_run', '{\"ip\": \"127.0.0.1\", \"user\": \"system\", \"action\": \"anomaly_analysis_run\", \"new_alerts\": 0, \"departments_checked\": 0}', 'active', '2026-07-23 09:57:49', '2026-07-23 09:57:49'),
(29, 'anomaly_analysis_run', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"anomaly_analysis_run\", \"new_alerts\": 0, \"departments_checked\": 0}', 'active', '2026-07-23 15:01:20', '2026-07-23 15:01:20'),
(30, 'anomaly_analysis_run', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"anomaly_analysis_run\", \"new_alerts\": 0, \"departments_checked\": 0}', 'active', '2026-07-23 15:01:23', '2026-07-23 15:01:23'),
(31, 'anomaly_analysis_run', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"anomaly_analysis_run\", \"new_alerts\": 0, \"departments_checked\": 0}', 'active', '2026-07-23 15:01:25', '2026-07-23 15:01:25'),
(32, 'anomaly_analysis_run', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"anomaly_analysis_run\", \"new_alerts\": 0, \"departments_checked\": 0}', 'active', '2026-07-23 16:45:10', '2026-07-23 16:45:10'),
(33, 'anomaly_analysis_run', '{\"ip\": \"112.203.58.205\", \"user\": \"admin@pcms.com\", \"action\": \"anomaly_analysis_run\", \"new_alerts\": 0, \"departments_checked\": 0}', 'active', '2026-07-24 04:07:06', '2026-07-24 04:07:06'),
(34, 'asset_updated', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"asset_updated\", \"asset_id\": 20, \"property_number\": \"BCP-IT-2026-000145\"}', 'active', '2026-07-30 05:25:49', '2026-07-30 05:25:49'),
(35, 'asset_updated', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"asset_updated\", \"asset_id\": 20, \"property_number\": \"BCP-IT-2026-000145\"}', 'active', '2026-07-30 08:10:14', '2026-07-30 08:10:14'),
(36, 'assignment_pending_acceptance', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"assignment_pending_acceptance\", \"asset_id\": 20, \"quantity\": 1, \"assigned_to\": \"d2313059-00af-458d-af1c-412da9de90ac\", \"assignment_id\": 4}', 'active', '2026-07-30 08:45:58', '2026-07-30 08:45:58'),
(37, 'assignment_accepted', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"assignment_accepted\", \"asset_id\": 20, \"quantity\": 1, \"assigned_to\": \"d2313059-00af-458d-af1c-412da9de90ac\", \"assignment_id\": 4}', 'active', '2026-07-30 08:46:20', '2026-07-30 08:46:20'),
(38, 'assignment_cancelled', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"assignment_cancelled\", \"asset_id\": 20, \"quantity\": 1, \"assigned_to\": \"d2313059-00af-458d-af1c-412da9de90ac\", \"assignment_id\": 4}', 'active', '2026-07-30 09:40:23', '2026-07-30 09:40:23'),
(39, 'asset_archived', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"asset_archived\", \"asset_id\": 20, \"property_number\": \"BCP-IT-2026-000145\"}', 'active', '2026-08-03 07:03:05', '2026-08-03 07:03:05'),
(40, 'asset_registered', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"asset_registered\", \"asset_id\": 29, \"property_number\": \"BCP-IT-2026-000145\"}', 'active', '2026-08-03 09:35:26', '2026-08-03 09:35:26'),
(41, 'asset_archived', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"asset_archived\", \"asset_id\": 29, \"property_number\": \"BCP-IT-2026-000145\"}', 'active', '2026-08-03 09:35:42', '2026-08-03 09:35:42'),
(42, 'asset_registered', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"asset_registered\", \"asset_id\": 30, \"property_number\": \"BCP-IT-2026-000145\"}', 'active', '2026-08-03 21:14:22', '2026-08-03 21:14:22'),
(43, 'asset_archived', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"asset_archived\", \"asset_id\": 30, \"property_number\": \"BCP-IT-2026-000145\"}', 'active', '2026-08-03 21:15:12', '2026-08-03 21:15:12'),
(44, 'anomaly_analysis_run', '{\"ip\": \"180.190.85.6\", \"user\": \"admin@pcms.com\", \"action\": \"anomaly_analysis_run\", \"new_alerts\": 0, \"departments_checked\": 0}', 'active', '2026-08-07 06:10:05', '2026-08-07 06:10:05'),
(45, 'anomaly_analysis_run', '{\"ip\": \"180.190.85.6\", \"user\": \"admin@pcms.com\", \"action\": \"anomaly_analysis_run\", \"new_alerts\": 0, \"departments_checked\": 0}', 'active', '2026-08-07 06:10:07', '2026-08-07 06:10:07'),
(46, 'purchase_request_created', '{\"ip\": \"127.0.0.1\", \"user\": \"requester@pcms.test\", \"action\": \"purchase_request_created\", \"request_number\": \"PR-2026-000001\", \"purchase_request_id\": 3}', 'active', '2026-08-09 23:16:25', '2026-08-09 23:16:25'),
(47, 'supply_updated', '{\"ip\": \"127.0.0.1\", \"sku\": \"SSP-10024396\", \"user\": \"admin@pcms.com\", \"action\": \"supply_updated\", \"supply_id\": 7}', 'active', '2026-08-10 00:42:57', '2026-08-10 00:42:57'),
(50, 'purchase_request_created', '{\"ip\": \"127.0.0.1\", \"user\": \"requester@pcms.test\", \"action\": \"purchase_request_created\", \"request_number\": \"PR-2026-000002\", \"purchase_request_id\": 6}', 'active', '2026-08-10 02:40:29', '2026-08-10 02:40:29'),
(51, 'purchase_request_advanced', '{\"ip\": \"127.0.0.1\", \"user\": \"depthead@pcms.test\", \"action\": \"purchase_request_advanced\", \"to_stage\": \"recommending_approver\", \"from_stage\": \"department_head\", \"request_number\": \"PR-2026-000001\", \"purchase_request_id\": 3}', 'active', '2026-08-10 02:52:46', '2026-08-10 02:52:46'),
(52, 'purchase_request_created', '{\"ip\": \"127.0.0.1\", \"user\": \"requester@pcms.test\", \"action\": \"purchase_request_created\", \"request_number\": \"REQ-2026-000002\", \"purchase_request_id\": 7}', 'active', '2026-08-10 15:38:29', '2026-08-10 15:38:29'),
(53, 'purchase_request_advanced', '{\"ip\": \"127.0.0.1\", \"user\": \"depthead@pcms.test\", \"action\": \"purchase_request_advanced\", \"to_stage\": \"recommending_approver\", \"from_stage\": \"department_head\", \"request_number\": \"REQ-2026-000002\", \"purchase_request_id\": 7}', 'active', '2026-08-10 15:46:15', '2026-08-10 15:46:15'),
(54, 'purchase_request_advanced', '{\"ip\": \"127.0.0.1\", \"user\": \"recommender@pcms.test\", \"action\": \"purchase_request_advanced\", \"to_stage\": \"president\", \"from_stage\": \"recommending_approver\", \"request_number\": \"PR-2026-000001\", \"purchase_request_id\": 3}', 'active', '2026-08-10 16:38:21', '2026-08-10 16:38:21'),
(55, 'purchase_request_advanced', '{\"ip\": \"127.0.0.1\", \"user\": \"recommender@pcms.test\", \"action\": \"purchase_request_advanced\", \"to_stage\": \"president\", \"from_stage\": \"recommending_approver\", \"request_number\": \"REQ-2026-000002\", \"purchase_request_id\": 7}', 'active', '2026-08-10 16:38:27', '2026-08-10 16:38:27'),
(56, 'purchase_request_advanced', '{\"ip\": \"127.0.0.1\", \"user\": \"ceo@pcms.test\", \"action\": \"purchase_request_advanced\", \"to_stage\": \"property_custodian\", \"from_stage\": \"president\", \"request_number\": \"REQ-2026-000002\", \"purchase_request_id\": 7}', 'active', '2026-08-11 00:39:23', '2026-08-11 00:39:23'),
(57, 'purchase_request_advanced', '{\"ip\": \"127.0.0.1\", \"user\": \"ceo@pcms.test\", \"action\": \"purchase_request_advanced\", \"to_stage\": \"property_custodian\", \"from_stage\": \"president\", \"request_number\": \"PR-2026-000001\", \"purchase_request_id\": 3}', 'active', '2026-08-11 00:39:27', '2026-08-11 00:39:27'),
(58, 'anomaly_analysis_run', '{\"user\": \"system (scheduled)\", \"action\": \"anomaly_analysis_run\", \"new_alerts\": 0, \"pairs_checked\": 0}', 'active', '2026-08-11 21:21:08', '2026-08-11 21:21:08'),
(59, 'anomaly_analysis_run', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"anomaly_analysis_run\", \"new_alerts\": 0, \"pairs_checked\": 0}', 'active', '2026-08-17 05:43:39', '2026-08-17 05:43:39'),
(60, 'anomaly_analysis_run', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"anomaly_analysis_run\", \"new_alerts\": 0, \"pairs_checked\": 0}', 'active', '2026-08-17 05:43:44', '2026-08-17 05:43:44'),
(62, 'anomaly_analysis_run', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"anomaly_analysis_run\", \"new_alerts\": 0, \"pairs_checked\": 0}', 'active', '2026-08-17 07:02:27', '2026-08-17 07:02:27'),
(63, 'anomaly_analysis_run', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"anomaly_analysis_run\", \"new_alerts\": 0, \"pairs_checked\": 0}', 'active', '2026-08-17 07:02:42', '2026-08-17 07:02:42'),
(95, 'purchase_request_walk_in_created', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_walk_in_created\", \"request_number\": \"REQ-2026-000003\", \"purchase_request_id\": 52}', 'active', '2026-08-17 14:49:40', '2026-08-17 14:49:40'),
(96, 'purchase_request_walk_in_approval_verified', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_walk_in_approval_verified\", \"verified_by\": \"6892099d-1a17-4ed7-b21c-012eb78d70f9\", \"request_number\": \"REQ-2026-000003\", \"approval_status\": \"verified\", \"purchase_request_id\": 52}', 'active', '2026-08-17 14:54:57', '2026-08-17 14:54:57'),
(97, 'purchase_request_released', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_released\", \"request_number\": \"REQ-2026-000003\", \"purchase_request_id\": 52}', 'active', '2026-08-17 15:29:13', '2026-08-17 15:29:13'),
(98, 'purchase_request_released', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_released\", \"request_number\": \"REQ-2026-000002\", \"purchase_request_id\": 7}', 'active', '2026-08-17 15:40:52', '2026-08-17 15:40:52'),
(99, 'purchase_request_walk_in_created', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_walk_in_created\", \"request_number\": \"REQ-2026-000004\", \"purchase_request_id\": 53}', 'active', '2026-08-17 16:17:36', '2026-08-17 16:17:36'),
(100, 'purchase_request_walk_in_approval_verified', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_walk_in_approval_verified\", \"verified_by\": \"6892099d-1a17-4ed7-b21c-012eb78d70f9\", \"request_number\": \"REQ-2026-000004\", \"approval_status\": \"verified\", \"purchase_request_id\": 53}', 'active', '2026-08-17 16:22:08', '2026-08-17 16:22:08'),
(101, 'purchase_request_released', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_released\", \"request_number\": \"REQ-2026-000004\", \"purchase_request_id\": 53}', 'active', '2026-08-17 16:22:22', '2026-08-17 16:22:22'),
(102, 'purchase_request_released', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_released\", \"request_number\": \"PR-2026-000001\", \"purchase_request_id\": 3}', 'active', '2026-08-17 18:17:21', '2026-08-17 18:17:21'),
(103, 'purchase_request_walk_in_created', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_walk_in_created\", \"request_number\": \"REQ-2026-000005\", \"purchase_request_id\": 55}', 'active', '2026-08-19 00:49:35', '2026-08-19 00:49:35'),
(104, 'purchase_request_walk_in_approval_verified', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_walk_in_approval_verified\", \"verified_by\": \"6892099d-1a17-4ed7-b21c-012eb78d70f9\", \"request_number\": \"REQ-2026-000005\", \"approval_status\": \"verified\", \"purchase_request_id\": 55}', 'active', '2026-08-19 00:53:00', '2026-08-19 00:53:00'),
(105, 'purchase_request_walk_in_created', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_walk_in_created\", \"request_number\": \"REQ-2026-000006\", \"purchase_request_id\": 56}', 'active', '2026-08-19 01:15:51', '2026-08-19 01:15:51'),
(106, 'purchase_request_walk_in_created', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_walk_in_created\", \"request_number\": \"REQ-2026-000007\", \"purchase_request_id\": 57}', 'active', '2026-08-19 01:34:52', '2026-08-19 01:34:52'),
(107, 'purchase_request_walk_in_approval_verified', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_walk_in_approval_verified\", \"verified_by\": \"6892099d-1a17-4ed7-b21c-012eb78d70f9\", \"request_number\": \"REQ-2026-000006\", \"approval_status\": \"verified\", \"purchase_request_id\": 56}', 'active', '2026-08-19 02:15:13', '2026-08-19 02:15:13'),
(108, 'purchase_request_released', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_released\", \"request_number\": \"REQ-2026-000006\", \"purchase_request_id\": 56}', 'active', '2026-08-19 02:20:10', '2026-08-19 02:20:10'),
(109, 'purchase_request_released', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_released\", \"request_number\": \"REQ-2026-000005\", \"purchase_request_id\": 55}', 'active', '2026-08-19 02:20:27', '2026-08-19 02:20:27'),
(110, 'walk_in_request_details_updated', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"walk_in_request_details_updated\", \"request_number\": \"REQ-2026-000007\", \"purchase_request_id\": 57}', 'active', '2026-08-19 02:39:22', '2026-08-19 02:39:22'),
(111, 'walk_in_approval_document_uploaded', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"walk_in_approval_document_uploaded\", \"request_number\": \"REQ-2026-000007\", \"purchase_request_id\": 57}', 'active', '2026-08-19 02:39:33', '2026-08-19 02:39:33'),
(112, 'purchase_request_walk_in_approval_verified', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_walk_in_approval_verified\", \"verified_by\": \"6892099d-1a17-4ed7-b21c-012eb78d70f9\", \"request_number\": \"REQ-2026-000007\", \"approval_status\": \"verified\", \"purchase_request_id\": 57}', 'active', '2026-08-19 03:27:30', '2026-08-19 03:27:30'),
(113, 'walk_in_request_details_updated', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"walk_in_request_details_updated\", \"request_number\": \"REQ-2026-000007\", \"purchase_request_id\": 57}', 'active', '2026-08-19 18:28:43', '2026-08-19 18:28:43'),
(114, 'purchase_request_released', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_released\", \"request_number\": \"REQ-2026-000007\", \"purchase_request_id\": 57}', 'active', '2026-08-19 18:29:39', '2026-08-19 18:29:39'),
(115, 'purchase_request_walk_in_created', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_walk_in_created\", \"request_number\": \"REQ-2026-000008\", \"purchase_request_id\": 58}', 'active', '2026-08-19 23:34:32', '2026-08-19 23:34:32'),
(116, 'purchase_request_walk_in_approval_verified', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_walk_in_approval_verified\", \"verified_by\": \"6892099d-1a17-4ed7-b21c-012eb78d70f9\", \"request_number\": \"REQ-2026-000008\", \"approval_status\": \"verified\", \"purchase_request_id\": 58}', 'active', '2026-08-19 23:35:26', '2026-08-19 23:35:26'),
(117, 'purchase_request_released', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_released\", \"request_number\": \"REQ-2026-000008\", \"purchase_request_id\": 58}', 'active', '2026-08-19 23:35:52', '2026-08-19 23:35:52'),
(118, 'purchase_request_created', '{\"ip\": \"127.0.0.1\", \"user\": \"requester@pcms.test\", \"action\": \"purchase_request_created\", \"request_number\": \"REQ-2026-000009\", \"purchase_request_id\": 59}', 'active', '2026-08-19 23:45:53', '2026-08-19 23:45:53'),
(119, 'purchase_request_advanced', '{\"ip\": \"127.0.0.1\", \"user\": \"depthead@pcms.test\", \"action\": \"purchase_request_advanced\", \"to_stage\": \"recommending_approver\", \"from_stage\": \"department_head\", \"request_number\": \"REQ-2026-000009\", \"purchase_request_id\": 59}', 'active', '2026-08-19 23:50:25', '2026-08-19 23:50:25'),
(120, 'purchase_request_advanced', '{\"ip\": \"127.0.0.1\", \"user\": \"recommender@pcms.test\", \"action\": \"purchase_request_advanced\", \"to_stage\": \"president\", \"from_stage\": \"recommending_approver\", \"request_number\": \"REQ-2026-000009\", \"purchase_request_id\": 59}', 'active', '2026-08-19 23:52:30', '2026-08-19 23:52:30'),
(121, 'purchase_request_advanced', '{\"ip\": \"127.0.0.1\", \"user\": \"ceo@pcms.test\", \"action\": \"purchase_request_advanced\", \"to_stage\": \"property_custodian\", \"from_stage\": \"president\", \"request_number\": \"REQ-2026-000009\", \"purchase_request_id\": 59}', 'active', '2026-08-20 00:01:44', '2026-08-20 00:01:44'),
(122, 'purchase_request_released', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_released\", \"request_number\": \"REQ-2026-000009\", \"purchase_request_id\": 59}', 'active', '2026-08-20 00:03:54', '2026-08-20 00:03:54'),
(123, 'anomaly_ai_explanation_requested', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"anomaly_ai_explanation_requested\", \"anomaly_id\": \"27\"}', 'active', '2026-08-20 00:43:33', '2026-08-20 00:43:33'),
(124, 'anomaly_ai_explanation_requested', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"anomaly_ai_explanation_requested\", \"anomaly_id\": \"27\"}', 'active', '2026-08-20 00:43:51', '2026-08-20 00:43:51'),
(125, 'anomaly_ai_explanation_requested', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"anomaly_ai_explanation_requested\", \"anomaly_id\": \"27\"}', 'active', '2026-08-20 01:35:11', '2026-08-20 01:35:11'),
(126, 'anomaly_resolved', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"anomaly_resolved\", \"anomaly_id\": \"27\", \"correction_applied\": false}', 'active', '2026-08-20 01:35:20', '2026-08-20 01:35:20'),
(127, 'supply_created', '{\"ip\": \"127.0.0.1\", \"sku\": \"SSP-10024395\", \"user\": \"admin@pcms.com\", \"action\": \"supply_created\", \"supply_id\": 39}', 'active', '2026-08-20 01:38:21', '2026-08-20 01:38:21'),
(128, 'asset_registered', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"asset_registered\", \"asset_id\": 41, \"property_number\": \"BCP-IT-2026-000146\"}', 'active', '2026-08-20 01:57:03', '2026-08-20 01:57:03'),
(129, 'asset_updated', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"asset_updated\", \"asset_id\": 41, \"property_number\": \"BCP-IT-2026-000146\"}', 'active', '2026-08-20 01:59:48', '2026-08-20 01:59:48'),
(130, 'purchase_request_walk_in_created', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_walk_in_created\", \"request_number\": \"REQ-2026-000010\", \"purchase_request_id\": 60}', 'active', '2026-08-20 02:07:14', '2026-08-20 02:07:14'),
(131, 'purchase_request_walk_in_approval_verified', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_walk_in_approval_verified\", \"verified_by\": \"6892099d-1a17-4ed7-b21c-012eb78d70f9\", \"request_number\": \"REQ-2026-000010\", \"approval_status\": \"verified\", \"purchase_request_id\": 60}', 'active', '2026-08-20 02:07:34', '2026-08-20 02:07:34'),
(132, 'purchase_request_released', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_released\", \"request_number\": \"REQ-2026-000010\", \"purchase_request_id\": 60}', 'active', '2026-08-20 02:07:55', '2026-08-20 02:07:55'),
(133, 'assignment_accepted', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"assignment_accepted\", \"asset_id\": 41, \"quantity\": 1, \"assigned_to\": \"d2313059-00af-458d-af1c-412da9de90ac\", \"assignment_id\": 15}', 'active', '2026-08-20 02:53:20', '2026-08-20 02:53:20'),
(134, 'assignment_cancelled', '{\"ip\": \"127.0.0.1\", \"user\": \"admin@pcms.com\", \"action\": \"assignment_cancelled\", \"asset_id\": 41, \"quantity\": 1, \"assigned_to\": \"d2313059-00af-458d-af1c-412da9de90ac\", \"assignment_id\": 15}', 'active', '2026-08-20 03:15:43', '2026-08-20 03:15:43'),
(135, 'purchase_request_walk_in_created', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_walk_in_created\", \"request_number\": \"REQ-2026-000011\", \"purchase_request_id\": 61}', 'active', '2026-08-20 03:17:11', '2026-08-20 03:17:11'),
(136, 'purchase_request_walk_in_approval_verified', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_walk_in_approval_verified\", \"verified_by\": \"6892099d-1a17-4ed7-b21c-012eb78d70f9\", \"request_number\": \"REQ-2026-000011\", \"approval_status\": \"verified\", \"purchase_request_id\": 61}', 'active', '2026-08-20 03:17:52', '2026-08-20 03:17:52'),
(137, 'purchase_request_released', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_released\", \"request_number\": \"REQ-2026-000011\", \"purchase_request_id\": 61}', 'active', '2026-08-20 03:18:11', '2026-08-20 03:18:11'),
(138, 'purchase_request_created', '{\"ip\": \"127.0.0.1\", \"user\": \"requester@pcms.test\", \"action\": \"purchase_request_created\", \"request_number\": \"REQ-2026-000012\", \"purchase_request_id\": 62}', 'active', '2026-08-20 15:10:21', '2026-08-20 15:10:21'),
(139, 'purchase_request_advanced', '{\"ip\": \"127.0.0.1\", \"user\": \"depthead@pcms.test\", \"action\": \"purchase_request_advanced\", \"to_stage\": \"recommending_approver\", \"from_stage\": \"department_head\", \"request_number\": \"REQ-2026-000012\", \"purchase_request_id\": 62}', 'active', '2026-08-20 15:17:58', '2026-08-20 15:17:58'),
(140, 'purchase_request_advanced', '{\"ip\": \"127.0.0.1\", \"user\": \"recommender@pcms.test\", \"action\": \"purchase_request_advanced\", \"to_stage\": \"property_custodian\", \"from_stage\": \"recommending_approver\", \"request_number\": \"REQ-2026-000012\", \"purchase_request_id\": 62}', 'active', '2026-08-20 15:32:00', '2026-08-20 15:32:00'),
(141, 'purchase_request_advanced', '{\"ip\": \"127.0.0.1\", \"user\": \"oic@pcms.test\", \"action\": \"purchase_request_advanced\", \"to_stage\": \"ppmo_staff\", \"from_stage\": \"property_custodian\", \"request_number\": \"REQ-2026-000012\", \"purchase_request_id\": 62}', 'active', '2026-08-20 15:57:41', '2026-08-20 15:57:41'),
(142, 'purchase_request_released', '{\"ip\": \"127.0.0.1\", \"user\": \"ppmostaff@pcms.test\", \"action\": \"purchase_request_released\", \"request_number\": \"REQ-2026-000012\", \"purchase_request_id\": 62}', 'active', '2026-08-20 20:30:38', '2026-08-20 20:30:38'),
(143, 'asset_returned', '{\"action\":\"asset_returned\",\"assignment_id\":16,\"asset_id\":41,\"assigned_to\":\"d2313059-00af-458d-af1c-412da9de90ac\",\"quantity\":1,\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-21 06:50:02', '2026-08-21 06:50:02'),
(144, 'purchase_request_walk_in_created', '{\"action\":\"purchase_request_walk_in_created\",\"purchase_request_id\":63,\"request_number\":\"REQ-2026-000013\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-21 06:55:02', '2026-08-21 06:55:02'),
(145, 'purchase_request_walk_in_approval_verified', '{\"action\":\"purchase_request_walk_in_approval_verified\",\"purchase_request_id\":63,\"request_number\":\"REQ-2026-000013\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\",\"approval_status\":\"verified\",\"verified_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\"}', 'active', '2026-08-21 06:55:49', '2026-08-21 06:55:49'),
(146, 'asset_assigned', '{\"action\":\"asset_assigned\",\"purchase_request_id\":63,\"request_number\":\"REQ-2026-000013\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\",\"asset_assignment_id\":19,\"asset_id\":41,\"assigned_to\":\"d2313059-00af-458d-af1c-412da9de90ac\",\"quantity\":1}', 'active', '2026-08-21 07:04:03', '2026-08-21 07:04:03'),
(147, 'purchase_request_released', '{\"action\":\"purchase_request_released\",\"purchase_request_id\":63,\"request_number\":\"REQ-2026-000013\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-21 07:04:05', '2026-08-21 07:04:05'),
(148, 'audit_scheduled', '{\"action\":\"audit_scheduled\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\",\"audit_id\":1}', 'active', '2026-08-23 06:51:50', '2026-08-23 06:51:50'),
(149, 'audit_scan_recorded', '{\"action\":\"audit_scan_recorded\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\",\"audit_id\":1,\"asset_id\":41}', 'active', '2026-08-23 06:53:25', '2026-08-23 06:53:25'),
(150, 'audit_completed', '{\"action\":\"audit_completed\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\",\"audit_id\":1}', 'active', '2026-08-23 06:54:05', '2026-08-23 06:54:05'),
(151, 'audit_scheduled', '{\"action\":\"audit_scheduled\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\",\"audit_id\":2}', 'active', '2026-08-23 06:54:59', '2026-08-23 06:54:59'),
(152, 'audit_scan_recorded', '{\"action\":\"audit_scan_recorded\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\",\"audit_id\":2,\"asset_id\":41}', 'active', '2026-08-23 07:01:31', '2026-08-23 07:01:31'),
(153, 'audit_scan_recorded', '{\"action\":\"audit_scan_recorded\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\",\"audit_id\":2,\"asset_id\":41}', 'active', '2026-08-23 07:06:01', '2026-08-23 07:06:01'),
(154, 'anomaly_resolved', '{\"action\":\"anomaly_resolved\",\"anomaly_id\":\"30\",\"correction_applied\":false,\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-23 07:07:50', '2026-08-23 07:07:50'),
(155, 'audit_scan_recorded', '{\"action\":\"audit_scan_recorded\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\",\"audit_id\":2,\"asset_id\":41}', 'active', '2026-08-23 07:14:33', '2026-08-23 07:14:33'),
(156, 'transfer_department_approved', '{\"action\":\"transfer_department_approved\",\"transfer_id\":2,\"transfer_number\":\"TR-2026-000002\",\"asset_id\":41,\"previous_department_id\":1,\"new_department_id\":3,\"previous_custodian_id\":null,\"new_custodian_id\":null,\"old_quantity\":null,\"new_quantity\":5,\"reason\":\"Physical audit found asset in department 3.\",\"user\":\"ppmostaff@pcms.test\",\"role\":\"PPMO Staff\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-23 07:17:16', '2026-08-23 07:17:16'),
(157, 'transfer_department_approved', '{\"action\":\"transfer_department_approved\",\"transfer_id\":1,\"transfer_number\":\"TR-2026-000001\",\"asset_id\":41,\"previous_department_id\":1,\"new_department_id\":12,\"previous_custodian_id\":null,\"new_custodian_id\":null,\"old_quantity\":null,\"new_quantity\":5,\"reason\":\"Physical audit found asset in department 12.\",\"user\":\"ppmostaff@pcms.test\",\"role\":\"PPMO Staff\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-23 07:17:35', '2026-08-23 07:17:35'),
(158, 'anomaly_resolved', '{\"action\":\"anomaly_resolved\",\"anomaly_id\":\"31\",\"correction_applied\":false,\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-23 07:18:00', '2026-08-23 07:18:00'),
(159, 'anomaly_resolved', '{\"action\":\"anomaly_resolved\",\"anomaly_id\":\"29\",\"correction_applied\":false,\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-23 07:18:04', '2026-08-23 07:18:04'),
(160, 'anomaly_resolved', '{\"action\":\"anomaly_resolved\",\"anomaly_id\":\"28\",\"correction_applied\":false,\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-23 07:18:07', '2026-08-23 07:18:07'),
(161, 'audit_scan_recorded', '{\"action\":\"audit_scan_recorded\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\",\"audit_id\":2,\"asset_id\":41}', 'active', '2026-08-23 07:18:27', '2026-08-23 07:18:27'),
(162, 'audit_scheduled', '{\"action\":\"audit_scheduled\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\",\"audit_id\":3}', 'active', '2026-08-23 07:31:44', '2026-08-23 07:31:44'),
(163, 'audit_scan_recorded', '{\"action\":\"audit_scan_recorded\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\",\"audit_id\":3,\"asset_id\":41}', 'active', '2026-08-23 07:31:57', '2026-08-23 07:31:57'),
(164, 'transfer_department_approved', '{\"action\":\"transfer_department_approved\",\"transfer_id\":3,\"transfer_number\":\"TR-2026-000003\",\"asset_id\":41,\"previous_department_id\":12,\"new_department_id\":3,\"previous_custodian_id\":null,\"new_custodian_id\":null,\"old_quantity\":null,\"new_quantity\":5,\"reason\":\"Physical audit found asset in department 3.\",\"user\":\"ppmostaff@pcms.test\",\"role\":\"PPMO Staff\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-23 07:32:17', '2026-08-23 07:32:17'),
(165, 'audit_scan_recorded', '{\"action\":\"audit_scan_recorded\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\",\"audit_id\":3,\"asset_id\":41}', 'active', '2026-08-23 07:33:28', '2026-08-23 07:33:28'),
(166, 'audit_completed', '{\"action\":\"audit_completed\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\",\"audit_id\":3}', 'active', '2026-08-23 07:39:56', '2026-08-23 07:39:56'),
(167, 'purchase_request_created', '{\"action\":\"purchase_request_created\",\"purchase_request_id\":64,\"request_number\":\"REQ-2026-000014\",\"user\":\"requester@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-23 07:56:04', '2026-08-23 07:56:04'),
(168, 'audit_scheduled', '{\"action\":\"audit_scheduled\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\",\"audit_id\":4}', 'active', '2026-08-23 08:11:54', '2026-08-23 08:11:54'),
(169, 'audit_scan_recorded', '{\"action\":\"audit_scan_recorded\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\",\"audit_id\":4,\"asset_id\":41}', 'active', '2026-08-23 08:12:09', '2026-08-23 08:12:09'),
(170, 'audit_cancelled', '{\"action\":\"audit_cancelled\",\"user\":\"admin@pcms.com\",\"ip\":\"127.0.0.1\",\"audit_id\":4}', 'active', '2026-08-23 08:25:53', '2026-08-23 08:25:53'),
(171, 'audit_cancelled', '{\"action\":\"audit_cancelled\",\"user\":\"admin@pcms.com\",\"ip\":\"127.0.0.1\",\"audit_id\":2}', 'active', '2026-08-23 08:25:56', '2026-08-23 08:25:56'),
(172, 'asset_archived', '{\"action\":\"asset_archived\",\"asset_id\":41,\"property_number\":\"BCP-IT-2026-000146\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-24 07:25:20', '2026-08-24 07:25:20'),
(173, 'asset_registered', '{\"action\":\"asset_registered\",\"asset_id\":42,\"property_number\":\"BCP-PPMO-2026-000003\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-24 07:54:47', '2026-08-24 07:54:47'),
(174, 'asset_updated', '{\"action\":\"asset_updated\",\"asset_id\":42,\"property_number\":\"BCP-PPMO-2026-000003\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-24 07:55:09', '2026-08-24 07:55:09'),
(175, 'asset_assigned', '{\"action\":\"asset_assigned\",\"assignment_id\":20,\"asset_id\":42,\"assigned_to\":\"d2313059-00af-458d-af1c-412da9de90ac\",\"quantity\":1,\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-24 08:05:53', '2026-08-24 08:05:53'),
(176, 'assignment_cancelled', '{\"action\":\"assignment_cancelled\",\"assignment_id\":20,\"asset_id\":42,\"assigned_to\":\"d2313059-00af-458d-af1c-412da9de90ac\",\"quantity\":1,\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-24 08:10:27', '2026-08-24 08:10:27'),
(177, 'asset_assigned', '{\"action\":\"asset_assigned\",\"assignment_id\":21,\"asset_id\":42,\"assigned_to\":\"d2313059-00af-458d-af1c-412da9de90ac\",\"quantity\":1,\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-24 08:11:53', '2026-08-24 08:11:53'),
(178, 'asset_returned', '{\"action\":\"asset_returned\",\"assignment_id\":21,\"asset_id\":42,\"assigned_to\":\"d2313059-00af-458d-af1c-412da9de90ac\",\"quantity\":1,\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-24 08:12:53', '2026-08-24 08:12:53'),
(179, 'asset_assigned', '{\"action\":\"asset_assigned\",\"assignment_id\":22,\"asset_id\":42,\"assigned_to\":\"d2313059-00af-458d-af1c-412da9de90ac\",\"quantity\":1,\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-24 08:20:18', '2026-08-24 08:20:18'),
(180, 'asset_registered', '{\"action\":\"asset_registered\",\"asset_id\":43,\"property_number\":\"BCP - IT - 2026-000145\",\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-24 08:32:15', '2026-08-24 08:32:15'),
(181, 'asset_assigned', '{\"action\":\"asset_assigned\",\"assignment_id\":23,\"asset_id\":43,\"assigned_to\":\"d2313059-00af-458d-af1c-412da9de90ac\",\"quantity\":1,\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-24 08:32:46', '2026-08-24 08:32:46'),
(182, 'asset_returned', '{\"action\":\"asset_returned\",\"assignment_id\":23,\"asset_id\":43,\"assigned_to\":\"d2313059-00af-458d-af1c-412da9de90ac\",\"quantity\":1,\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-24 08:39:43', '2026-08-24 08:39:43'),
(183, 'anomaly_resolved', '{\"action\":\"anomaly_resolved\",\"anomaly_id\":\"35\",\"correction_applied\":false,\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-24 08:47:02', '2026-08-24 08:47:02'),
(184, 'anomaly_resolved', '{\"action\":\"anomaly_resolved\",\"anomaly_id\":\"34\",\"correction_applied\":false,\"user\":\"ppmostaff@pcms.test\",\"ip\":\"127.0.0.1\"}', 'active', '2026-08-24 08:48:37', '2026-08-24 08:48:37');

-- --------------------------------------------------------

--
-- Table structure for table `anomaly_alerts`
--

CREATE TABLE `anomaly_alerts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `source_type` varchar(40) DEFAULT NULL,
  `source_id` varchar(255) DEFAULT NULL,
  `risk_score` decimal(5,2) DEFAULT NULL,
  `priority` varchar(30) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `recommended_action` text DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `status` varchar(40) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `found_department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `analysis_context` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`analysis_context`)),
  `ai_explanation` text DEFAULT NULL,
  `ai_explanation_status` varchar(30) DEFAULT NULL,
  `ai_explanation_error` varchar(500) DEFAULT NULL,
  `ai_explanation_generated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assets`
--

CREATE TABLE `assets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `asset_id` varchar(40) NOT NULL,
  `property_number` varchar(80) NOT NULL,
  `serial_number` varchar(120) DEFAULT NULL,
  `name` varchar(180) NOT NULL,
  `brand` varchar(120) DEFAULT NULL,
  `model` varchar(120) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `category_id` bigint(20) UNSIGNED DEFAULT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `custodian_id` char(36) DEFAULT NULL,
  `current_holder_id` char(36) DEFAULT NULL,
  `last_assigned_at` timestamp NULL DEFAULT NULL,
  `last_transfer_at` timestamp NULL DEFAULT NULL,
  `location` varchar(180) DEFAULT NULL,
  `condition` varchar(40) NOT NULL DEFAULT 'good',
  `status` varchar(40) NOT NULL DEFAULT 'available',
  `purchase_date` date DEFAULT NULL,
  `purchase_cost` decimal(14,2) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `available_quantity` int(11) DEFAULT NULL,
  `supplier_id` bigint(20) UNSIGNED DEFAULT NULL,
  `purchase_request_id` bigint(20) UNSIGNED DEFAULT NULL,
  `warranty_until` date DEFAULT NULL,
  `depreciation_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `qr_code_path` text DEFAULT NULL,
  `image_path` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `assets`
--

INSERT INTO `assets` (`id`, `asset_id`, `property_number`, `serial_number`, `name`, `brand`, `model`, `description`, `category_id`, `department_id`, `custodian_id`, `current_holder_id`, `last_assigned_at`, `last_transfer_at`, `location`, `condition`, `status`, `purchase_date`, `purchase_cost`, `quantity`, `available_quantity`, `supplier_id`, `purchase_request_id`, `warranty_until`, `depreciation_rate`, `qr_code_path`, `image_path`, `remarks`, `created_at`, `updated_at`, `deleted_at`) VALUES
(30, 'BCP-PPMO-2026-000001', 'BCP-IT-2026-000145', ': DELL7H4K92X1', ': Dell OptiPlex 7010 Desktop Computer', 'Dell', 'OptiPlex 7010 MT', 'Desktop computer assigned to the Information', 1, 1, NULL, NULL, NULL, NULL, 'processor, 16GB RAM, and 512GB SSD', 'good', 'available', '2026-07-04', 42500.00, 1, 1, NULL, NULL, '2028-03-15', 0.00, 'assets/qr-30.png', NULL, NULL, '2026-08-03 21:14:21', '2026-08-24 07:58:50', '2026-08-03 21:15:12'),
(43, 'BCP-PPMO-2026-000002', 'BCP - IT - 2026-000145', 'DELL7H4K92X1', 'Dell OptiPlex 7010 Desktop Computer', 'Dell', 'OptiPlex 7010 MT', 'Desktop computer assigned to the Information Technology Department for office and administrative tasks . Includes Intel Core i5 processor , 16GB RAM , and 512GB SSD .', 1, 1, NULL, NULL, NULL, NULL, 'IT Office - Room 204', 'good', 'available', '2025-03-15', 42500.00, 5, 5, NULL, NULL, '2028-03-15', 0.00, 'assets/qr-43.png', NULL, NULL, '2026-08-24 08:32:14', '2026-08-24 08:43:25', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `asset_assignments`
--

CREATE TABLE `asset_assignments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `asset_id` bigint(20) UNSIGNED DEFAULT NULL,
  `asset_unit_id` bigint(20) UNSIGNED DEFAULT NULL,
  `assigned_to` char(36) DEFAULT NULL,
  `assigned_by` char(36) DEFAULT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `assignment_type` varchar(30) NOT NULL DEFAULT 'permanent',
  `quantity` int(11) NOT NULL DEFAULT 1,
  `purpose` text DEFAULT NULL,
  `condition_before` varchar(40) DEFAULT NULL,
  `condition_after` varchar(40) DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `assigned_at` timestamp NULL DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `returned_at` timestamp NULL DEFAULT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `employee_signature` text DEFAULT NULL,
  `custodian_signature` text DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `status` varchar(40) NOT NULL DEFAULT 'active',
  `approval_status` varchar(40) NOT NULL DEFAULT 'not_required',
  `rejection_reason` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `return_notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `asset_assignments`
--

INSERT INTO `asset_assignments` (`id`, `asset_id`, `asset_unit_id`, `assigned_to`, `assigned_by`, `department_id`, `assignment_type`, `quantity`, `purpose`, `condition_before`, `condition_after`, `photo_path`, `assigned_at`, `due_date`, `returned_at`, `accepted_at`, `employee_signature`, `custodian_signature`, `payload`, `status`, `approval_status`, `rejection_reason`, `notes`, `return_notes`, `created_at`, `updated_at`) VALUES
(23, 43, 12, 'd2313059-00af-458d-af1c-412da9de90ac', '6892099d-1a17-4ed7-b21c-012eb78d70f9', 1, 'permanent', 1, 'qwe', 'good', 'good', NULL, '2026-08-23 16:00:00', '2026-10-20', '2026-08-24 08:39:42', '2026-08-24 08:32:46', 'qwe', 'qwe', NULL, 'returned', 'not_required', NULL, 'qwe', NULL, '2026-08-24 08:32:46', '2026-08-24 08:39:42');

-- --------------------------------------------------------

--
-- Table structure for table `asset_categories`
--

CREATE TABLE `asset_categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(32) NOT NULL,
  `name` varchar(160) NOT NULL,
  `depreciation_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `useful_life_years` int(11) NOT NULL DEFAULT 5,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `asset_categories`
--

INSERT INTO `asset_categories` (`id`, `code`, `name`, `depreciation_rate`, `useful_life_years`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'COMP', 'Computers and Peripherals', 20.00, 5, 1, NULL, NULL),
(2, 'OFF', 'Office Equipment', 15.00, 7, 1, NULL, NULL),
(3, 'LAB', 'Laboratory Equipment', 10.00, 10, 1, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `asset_transfers`
--

CREATE TABLE `asset_transfers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `transfer_number` varchar(40) DEFAULT NULL,
  `asset_id` bigint(20) UNSIGNED DEFAULT NULL,
  `asset_unit_id` bigint(20) UNSIGNED DEFAULT NULL,
  `from_department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `to_department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `to_custodian_id` char(36) DEFAULT NULL,
  `from_custodian_id` char(36) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `transfer_type` varchar(30) NOT NULL DEFAULT 'permanent',
  `expected_return_date` date DEFAULT NULL,
  `transfer_date` timestamp NULL DEFAULT NULL,
  `actual_quantity` int(11) DEFAULT NULL,
  `condition_before` varchar(40) DEFAULT NULL,
  `condition_after` varchar(40) DEFAULT NULL,
  `photo_before_path` varchar(255) DEFAULT NULL,
  `photo_after_path` varchar(255) DEFAULT NULL,
  `receiving_signature` text DEFAULT NULL,
  `releasing_signature` text DEFAULT NULL,
  `requested_by` char(36) DEFAULT NULL,
  `approved_by` char(36) DEFAULT NULL,
  `department_approved_by` char(36) DEFAULT NULL,
  `executed_by` char(36) DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `status` varchar(40) NOT NULL DEFAULT 'active',
  `rejection_reason` text DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `approval_notes` text DEFAULT NULL,
  `revision_notes` text DEFAULT NULL,
  `hold_reason` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `risk_score` decimal(5,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `asset_units`
--

CREATE TABLE `asset_units` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `asset_id` bigint(20) UNSIGNED NOT NULL,
  `unit_code` varchar(255) DEFAULT NULL,
  `serial_number` varchar(255) DEFAULT NULL,
  `status` varchar(40) NOT NULL DEFAULT 'available',
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `custodian_id` char(36) DEFAULT NULL,
  `condition` varchar(40) DEFAULT 'good',
  `location` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `asset_units`
--

INSERT INTO `asset_units` (`id`, `asset_id`, `unit_code`, `serial_number`, `status`, `department_id`, `custodian_id`, `condition`, `location`, `created_at`, `updated_at`) VALUES
(12, 43, 'BCP-PPMO-2026-000002-001', NULL, 'available', NULL, NULL, 'good', 'IT Office - Room 204', '2026-08-24 08:32:15', '2026-08-24 08:43:25'),
(13, 43, 'BCP-PPMO-2026-000002-002', NULL, 'available', NULL, NULL, 'good', 'IT Office - Room 204', '2026-08-24 08:32:15', '2026-08-24 08:32:15'),
(14, 43, 'BCP-PPMO-2026-000002-003', NULL, 'available', NULL, NULL, 'good', 'IT Office - Room 204', '2026-08-24 08:32:15', '2026-08-24 08:32:15'),
(15, 43, 'BCP-PPMO-2026-000002-004', NULL, 'available', NULL, NULL, 'good', 'IT Office - Room 204', '2026-08-24 08:32:15', '2026-08-24 08:32:15'),
(16, 43, 'BCP-PPMO-2026-000002-005', NULL, 'available', NULL, NULL, 'good', 'IT Office - Room 204', '2026-08-24 08:32:15', '2026-08-24 08:32:15');

-- --------------------------------------------------------

--
-- Table structure for table `asset_unit_movements`
--

CREATE TABLE `asset_unit_movements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `asset_unit_id` bigint(20) UNSIGNED NOT NULL,
  `asset_id` bigint(20) UNSIGNED NOT NULL,
  `movement_type` varchar(50) NOT NULL,
  `from_department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `to_department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `from_custodian_id` char(36) DEFAULT NULL,
  `to_custodian_id` char(36) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` bigint(20) UNSIGNED DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `asset_unit_movements`
--

INSERT INTO `asset_unit_movements` (`id`, `asset_unit_id`, `asset_id`, `movement_type`, `from_department_id`, `to_department_id`, `from_custodian_id`, `to_custodian_id`, `reference_type`, `reference_id`, `remarks`, `created_at`, `updated_at`) VALUES
(4, 12, 43, 'assignment', NULL, 1, NULL, 'd2313059-00af-458d-af1c-412da9de90ac', 'asset_assignment', 23, NULL, '2026-08-24 08:32:46', '2026-08-24 08:32:46');

-- --------------------------------------------------------

--
-- Table structure for table `assignment_history`
--

CREATE TABLE `assignment_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `assignment_id` bigint(20) UNSIGNED DEFAULT NULL,
  `asset_id` bigint(20) UNSIGNED DEFAULT NULL,
  `employee_id` char(36) DEFAULT NULL,
  `event_type` varchar(60) NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `performed_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `assignment_history`
--

INSERT INTO `assignment_history` (`id`, `assignment_id`, `asset_id`, `employee_id`, `event_type`, `payload`, `performed_by`, `created_at`, `updated_at`) VALUES
(7, 23, 43, 'd2313059-00af-458d-af1c-412da9de90ac', 'created', '{\"quantity\":1,\"status\":\"active\",\"available_before\":4}', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-24 08:32:46', '2026-08-24 08:32:46'),
(8, 23, 43, 'd2313059-00af-458d-af1c-412da9de90ac', 'returned', '{\"condition_after\":\"good\",\"notes\":null}', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-24 08:39:43', '2026-08-24 08:39:43');

-- --------------------------------------------------------

--
-- Table structure for table `assignment_notifications`
--

CREATE TABLE `assignment_notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `assignment_id` bigint(20) UNSIGNED DEFAULT NULL,
  `asset_id` bigint(20) UNSIGNED DEFAULT NULL,
  `recipient_id` char(36) DEFAULT NULL,
  `recipient_role` varchar(80) DEFAULT NULL,
  `type` varchar(60) NOT NULL,
  `title` varchar(180) NOT NULL,
  `message` text DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `assignment_notifications`
--

INSERT INTO `assignment_notifications` (`id`, `assignment_id`, `asset_id`, `recipient_id`, `recipient_role`, `type`, `title`, `message`, `read_at`, `created_at`, `updated_at`) VALUES
(29, 23, 43, 'd2313059-00af-458d-af1c-412da9de90ac', 'Employee', 'assignment_approved', 'Assignment approved', 'Dell OptiPlex 7010 Desktop Computer (1 unit(s)) for Requester Account.', NULL, '2026-08-24 08:32:46', '2026-08-24 08:32:46'),
(30, 23, 43, '6892099d-1a17-4ed7-b21c-012eb78d70f9', 'Property Custodian', 'assignment_approved', 'Assignment approved', 'Dell OptiPlex 7010 Desktop Computer (1 unit(s)) for Requester Account.', NULL, '2026-08-24 08:32:46', '2026-08-24 08:32:46'),
(31, 23, 43, NULL, 'Department Head', 'assignment_approved', 'Assignment approved', 'Dell OptiPlex 7010 Desktop Computer (1 unit(s)) for Requester Account.', NULL, '2026-08-24 08:32:46', '2026-08-24 08:32:46'),
(32, 23, 43, NULL, 'System Administrator', 'assignment_approved', 'Assignment approved', 'Dell OptiPlex 7010 Desktop Computer (1 unit(s)) for Requester Account.', NULL, '2026-08-24 08:32:46', '2026-08-24 08:32:46'),
(33, 23, 43, 'd2313059-00af-458d-af1c-412da9de90ac', 'Employee', 'assignment_returned', 'Assignment returned', 'Dell OptiPlex 7010 Desktop Computer (1 unit(s)) for Requester Account.', NULL, '2026-08-24 08:39:43', '2026-08-24 08:39:43'),
(34, 23, 43, '6892099d-1a17-4ed7-b21c-012eb78d70f9', 'Property Custodian', 'assignment_returned', 'Assignment returned', 'Dell OptiPlex 7010 Desktop Computer (1 unit(s)) for Requester Account.', NULL, '2026-08-24 08:39:43', '2026-08-24 08:39:43'),
(35, 23, 43, NULL, 'Department Head', 'assignment_returned', 'Assignment returned', 'Dell OptiPlex 7010 Desktop Computer (1 unit(s)) for Requester Account.', NULL, '2026-08-24 08:39:43', '2026-08-24 08:39:43'),
(36, 23, 43, NULL, 'System Administrator', 'assignment_returned', 'Assignment returned', 'Dell OptiPlex 7010 Desktop Computer (1 unit(s)) for Requester Account.', NULL, '2026-08-24 08:39:43', '2026-08-24 08:39:43');

-- --------------------------------------------------------

--
-- Table structure for table `audit_scans`
--

CREATE TABLE `audit_scans` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `audit_id` bigint(20) UNSIGNED NOT NULL,
  `asset_id` bigint(20) UNSIGNED NOT NULL,
  `found_department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `result` varchar(20) NOT NULL,
  `scanned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ocr_scan_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clearance_requests`
--

CREATE TABLE `clearance_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` char(36) NOT NULL,
  `status` varchar(40) NOT NULL DEFAULT 'pending',
  `decision` varchar(40) NOT NULL DEFAULT 'pending',
  `missing_items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`missing_items`)),
  `verified_items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`verified_items`)),
  `accountability_form_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`accountability_form_ids`)),
  `notes` text DEFAULT NULL,
  `finalized_by` char(36) DEFAULT NULL,
  `finalized_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `damage_reports`
--

CREATE TABLE `damage_reports` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `asset_id` bigint(20) UNSIGNED DEFAULT NULL,
  `reported_by` char(36) DEFAULT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `incident_type` varchar(30) NOT NULL DEFAULT 'damaged',
  `severity` varchar(40) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `assessment_notes` text DEFAULT NULL,
  `assessed_by` char(36) DEFAULT NULL,
  `assessed_at` timestamp NULL DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `status` varchar(40) NOT NULL DEFAULT 'active',
  `disposal_reference` varchar(120) DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(32) NOT NULL,
  `name` varchar(160) NOT NULL,
  `location` varchar(160) DEFAULT NULL,
  `head_user_id` char(36) DEFAULT NULL,
  `custodian_user_id` char(36) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `code`, `name`, `location`, `head_user_id`, `custodian_user_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'IT', 'Information Technology', 'Main Building 3F', NULL, NULL, 1, NULL, NULL),
(2, 'LIB', 'Library', 'Academic Center 1F', NULL, NULL, 1, NULL, NULL),
(3, 'CLN', 'Clinic', 'Student Services Wing', NULL, NULL, 1, NULL, NULL),
(4, 'PPMO', 'Procurement and Property Management Office', 'Admin Building', NULL, NULL, 1, NULL, NULL),
(12, 'LOG', 'Logistics', 'Operations Office', NULL, NULL, 1, '2026-07-20 18:33:12', '2026-07-20 18:33:12');

-- --------------------------------------------------------

--
-- Table structure for table `gate_passes`
--

CREATE TABLE `gate_passes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `gate_pass_number` varchar(40) DEFAULT NULL,
  `asset_id` bigint(20) UNSIGNED DEFAULT NULL,
  `purpose` text DEFAULT NULL,
  `valid_until` timestamp NULL DEFAULT NULL,
  `qr_code_path` varchar(255) DEFAULT NULL,
  `approved_by` char(36) DEFAULT NULL,
  `returned_at` timestamp NULL DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `status` varchar(40) NOT NULL DEFAULT 'active',
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `requested_by` char(36) DEFAULT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `destination` varchar(255) DEFAULT NULL,
  `vehicle` varchar(255) DEFAULT NULL,
  `driver` varchar(255) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `condition_before` varchar(40) DEFAULT NULL,
  `condition_after` varchar(40) DEFAULT NULL,
  `release_date` timestamp NULL DEFAULT NULL,
  `receiving_signature` text DEFAULT NULL,
  `receiving_photo_path` varchar(255) DEFAULT NULL,
  `security_remarks` text DEFAULT NULL,
  `attachment_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `maintenance_records`
--

CREATE TABLE `maintenance_records` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `asset_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(60) NOT NULL,
  `priority` varchar(30) NOT NULL DEFAULT 'medium',
  `status` varchar(40) NOT NULL DEFAULT 'scheduled',
  `technician` varchar(160) DEFAULT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `cost` decimal(14,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2026_07_14_000001_create_pcms_core_tables', 1),
(2, '2026_07_18_000002_create_users_table', 1),
(3, '2026_07_19_233919_create_sessions_table', 1),
(4, '2026_07_20_000001_expand_workflow_tables', 1),
(5, '2026_07_21_000001_add_payload_to_activity_logs_table', 1),
(6, '2026_07_21_120000_add_requester_department_workflow_fields', 1),
(7, '2026_07_21_121000_add_missing_user_profile_columns', 1),
(8, '2026_07_21_122000_add_missing_user_role_department_columns', 1),
(9, '2026_07_21_123000_add_missing_activity_log_columns', 1),
(10, '2026_07_21_124000_add_missing_activity_log_timestamps', 1),
(11, '2026_07_21_125000_add_deleted_at_to_assets', 1),
(12, '2026_07_21_130000_expand_purchase_request_lifecycle_fields', 1),
(13, '2026_07_21_140000_align_users_table_for_uuid_primary_keys', 1),
(14, '2026_07_22_000000_fix_sessions_user_id_to_uuid', 1),
(15, '2026_07_23_000001_add_due_date_to_asset_assignments', 1),
(16, '2026_07_23_000002_create_audit_scans_table', 1),
(17, '2026_07_23_000003_add_found_department_id_to_anomaly_alerts', 1),
(18, '2026_07_23_000004_add_purchase_request_id_to_assets', 1),
(19, '2026_07_30_000001_add_quantity_to_assets_table', 1),
(20, '2026_07_30_000002_enhance_asset_assignments', 1),
(21, '2026_07_31_000001_enhance_asset_transfer_workflow', 1),
(22, '2026_07_31_000002_enhance_requester_gate_pass_documents', 1),
(23, '2026_07_31_000003_enhance_universal_request_form', 1),
(24, '2026_07_31_000004_add_missing_columns_to_supplies_table', 1),
(25, '2026_08_10_000001_add_unit_price_to_supplies_table', 1),
(26, '2026_08_12_000001_add_walk_in_fields_to_purchase_requests', 1),
(27, '2026_08_16_000001_add_ai_explanation_to_anomaly_alerts', 1),
(28, '2026_08_17_000001_add_anomaly_reference_to_transfer_notifications', 1),
(29, '2026_08_18_000001_add_walk_in_approval_verification_to_purchase_requests', 1),
(30, '2026_08_19_000001_add_release_receipt_fields_to_purchase_requests', 1),
(31, '2026_08_20_000001_make_requested_by_nullable_on_purchase_requests', 1),
(32, '2026_08_20_000002_backfill_asset_available_quantities', 1),
(33, '2026_08_21_080017_add_missing_physical_audits_columns', 1),
(34, '2026_08_21_081734_add_missing_anomaly_alerts_columns', 1),
(35, '2026_08_21_110753_add_missing_stock_movements_columns', 2),
(36, '2026_08_21_110829_add_missing_purchase_requests_columns', 2),
(37, '2026_08_21_111306_add_missing_gate_passes_columns', 3),
(38, '2026_08_23_000001_add_accountability_links_to_clearance_requests', 4),
(39, '2026_08_23_000002_add_ocr_scan_to_audit_scans', 4),
(40, '2026_08_24_000001_create_asset_units_table', 5),
(41, '2026_08_24_000002_add_asset_unit_tracking_to_assignments_and_transfers', 5),
(42, '2026_08_24_000003_create_asset_unit_movements_table', 5),
(43, '2026_08_24_000004_backfill_asset_units', 6),
(44, '2026_08_24_000005_reconcile_asset_unit_inventory', 7),
(45, '2026_08_24_000005_create_system_settings_table', 8),
(46, '2026_08_24_000001_add_department_id_to_supplies_table', 9),
(47, '2026_08_24_000002_add_unit_to_supplies_table', 9),
(48, '2026_08_24_000003_add_low_stock_requisition_fields_to_purchase_requests', 9),
(49, '2026_08_24_000004_complete_damage_and_disposal_workflow', 9);

-- --------------------------------------------------------

--
-- Table structure for table `ocr_scans`
--

CREATE TABLE `ocr_scans` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `asset_id` bigint(20) UNSIGNED DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `extracted_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`extracted_payload`)),
  `confidence_score` decimal(5,2) NOT NULL DEFAULT 0.00,
  `confirmed_by` char(36) DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `status` varchar(40) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ocr_scans`
--

INSERT INTO `ocr_scans` (`id`, `asset_id`, `image_path`, `extracted_payload`, `confidence_score`, `confirmed_by`, `payload`, `status`, `created_at`, `updated_at`) VALUES
(11, NULL, 'ocr-scans/CQAy671rca76pMx7cYk3Ju2v6yGPIE5HAvGIbzui.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"Serial Number OptiPlex 7010 MT DELL7H4K92X1\", \"location\": \"Purchase\", \"unit_cost\": \"204\", \"asset_name\": \"Desktop\", \"department\": \"Location\", \"manufacturer\": null, \"date_acquired\": \"15/03/2025\", \"serial_number\": \"OPTIPLEX\", \"property_number\": \"BCP-IT-2026-000145\", \"asset_description\": \"Desktop computer assigned to the Information Technology\"}, \"success\": true, \"raw_text\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register\\nAsset form.\\nField\\nProperty Number\\nAsset Name\\nSample Data\\nBCP-IT-2026-000145\\nDell OptiPlex 7010 Desktop Computer\\nBrand\\nDell\\nModel\\nSerial Number\\nOptiPlex 7010 MT\\nDELL7H4K92X1\\nDescription\\nDesktop computer assigned to the Information Technology Department for\\noffice and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and\\n512GB SSD.\\nDepartment\\nLocation\\nPurchase Date\\nInformation Technology Department\\nIT Office - Room 204\\n15/03/2025\\nPurchase Cost\\n42500.00\\nWarranty Until\\n15/03/2028\\nCondition\\nGood\", \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 98.50, NULL, NULL, 'active', '2026-08-03 08:13:18', '2026-08-03 08:13:18'),
(12, NULL, 'ocr-scans/AXt30NAStDPHQWucphDCXYlHbkrwbSjTeDp4SNi8.png', '{\"fields\": {\"brand\": null, \"model\": null, \"location\": null, \"quantity\": \"1\", \"condition\": \"good\", \"asset_name\": null, \"department\": null, \"description\": null, \"purchase_cost\": \"202\", \"purchase_date\": \"15/03/2025\", \"serial_number\": \"OPTIPLEX\", \"warranty_until\": null, \"property_number\": \"BCP-IT-2026-000145\"}, \"success\": true, \"raw_text\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register\\nAsset form.\\nField\\nProperty Number\\nAsset Name\\nSample Data\\nBCP-IT-2026-000145\\nDell OptiPlex 7010 Desktop Computer\\nBrand\\nDell\\nModel\\nSerial Number\\nOptiPlex 7010 MT\\nDELL7H4K92X1\\nDescription\\nDesktop computer assigned to the Information Technology Department for\\noffice and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and\\n512GB SSD.\\nDepartment\\nLocation\\nPurchase Date\\nInformation Technology Department\\nIT Office - Room 204\\n15/03/2025\\nPurchase Cost\\n42500.00\\nWarranty Until\\n15/03/2028\\nCondition\\nGood\", \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 98.50, NULL, NULL, 'active', '2026-08-03 08:32:20', '2026-08-03 08:32:20'),
(13, NULL, 'ocr-scans/YuGg1nxWxR310CVKspUwDy3c6BYFycSpqgRMfVtf.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"Serial Number\", \"location\": \"Purchase Date\", \"quantity\": null, \"condition\": \"Good\", \"asset_name\": \"Sample Data\", \"department\": \"Location\", \"purchase_cost\": \"42500.00\", \"purchase_date\": \"Information Technology Department\", \"serial_number\": \"000145\", \"warranty_until\": \"15/03/2028\", \"property_number\": \"Asset Name\", \"asset_description\": \"Desktop computer assigned to the Information Technology Department for office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD.\"}, \"success\": true, \"raw_text\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register\\nAsset form.\\nField\\nProperty Number\\nAsset Name\\nSample Data\\nBCP-IT-2026-000145\\nDell OptiPlex 7010 Desktop Computer\\nBrand\\nDell\\nModel\\nSerial Number\\nOptiPlex 7010 MT\\nDELL7H4K92X1\\nDescription\\nDesktop computer assigned to the Information Technology Department for\\noffice and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and\\n512GB SSD.\\nDepartment\\nLocation\\nPurchase Date\\nInformation Technology Department\\nIT Office - Room 204\\n15/03/2025\\nPurchase Cost\\n42500.00\\nWarranty Until\\n15/03/2028\\nCondition\\nGood\", \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 98.50, NULL, NULL, 'active', '2026-08-03 08:43:50', '2026-08-03 08:43:50'),
(14, NULL, 'ocr-scans/lLl23nHwpJ4yNPUUDxxw3DifovMlNo3IKY93rgjH.png', '{\"fields\": [], \"success\": false, \"raw_text\": \"\", \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 0.00, NULL, NULL, 'active', '2026-08-03 08:50:22', '2026-08-03 08:50:22'),
(15, NULL, 'ocr-scans/Nct87XDe0IvlG1pjRJZs5gSoHBeMGnaKcGqP46iI.png', '{\"fields\": [], \"success\": false, \"raw_text\": \"\", \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 0.00, NULL, NULL, 'active', '2026-08-03 08:50:31', '2026-08-03 08:50:31'),
(16, NULL, 'ocr-scans/mLdIzsMdXTlTDAbHhRAZJtfhp0DNA4bZnolF5oWe.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \"Information Technology Department\", \"quantity\": null, \"condition\": \"Good\", \"asset_name\": \"BCP-IT-2026-000145\", \"department\": \"Information Technology Department\", \"purchase_cost\": \"42500.00\", \"purchase_date\": \"Information Technology Department\", \"serial_number\": \"000145\", \"warranty_until\": \"15/03/2028\", \"property_number\": \"BCP-IT-2026-000145\", \"asset_description\": \"Desktop computer assigned to the Information Technology Department for office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD.\"}, \"success\": true, \"raw_text\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register\\nAsset form.\\nField\\nProperty Number\\nAsset Name\\nSample Data\\nBCP-IT-2026-000145\\nDell OptiPlex 7010 Desktop Computer\\nBrand\\nDell\\nModel\\nSerial Number\\nOptiPlex 7010 MT\\nDELL7H4K92X1\\nDescription\\nDesktop computer assigned to the Information Technology Department for\\noffice and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and\\n512GB SSD.\\nDepartment\\nLocation\\nPurchase Date\\nInformation Technology Department\\nIT Office - Room 204\\n15/03/2025\\nPurchase Cost\\n42500.00\\nWarranty Until\\n15/03/2028\\nCondition\\nGood\", \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 98.50, NULL, NULL, 'active', '2026-08-03 08:52:17', '2026-08-03 08:52:17'),
(17, NULL, 'ocr-scans/IVE7UDSFdxrplWpDWNbUjHWCjKNxaN4YCGxHkqex.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": null, \"location\": null, \"quantity\": null, \"condition\": \"Good\", \"asset_name\": \"Sample Data\", \"department\": null, \"purchase_cost\": \"42500.00\", \"purchase_date\": \"Information Technology Department\", \"serial_number\": \"OptiPlex 7010 MT\", \"warranty_until\": \"15/03/2028\", \"property_number\": null, \"asset_description\": \"Desktop computer assigned to the Information Technology Department for office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD.\"}, \"success\": true, \"raw_text\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register\\nAsset form.\\nField\\nProperty Number\\nAsset Name\\nSample Data\\nBCP-IT-2026-000145\\nDell OptiPlex 7010 Desktop Computer\\nBrand\\nDell\\nModel\\nSerial Number\\nOptiPlex 7010 MT\\nDELL7H4K92X1\\nDescription\\nDesktop computer assigned to the Information Technology Department for\\noffice and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and\\n512GB SSD.\\nDepartment\\nLocation\\nPurchase Date\\nInformation Technology Department\\nIT Office - Room 204\\n15/03/2025\\nPurchase Cost\\n42500.00\\nWarranty Until\\n15/03/2028\\nCondition\\nGood\", \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 98.50, NULL, NULL, 'active', '2026-08-03 09:03:05', '2026-08-03 09:03:05'),
(18, NULL, 'ocr-scans/GVkrGCKc6Y4gFSSXJdIZmX3fOG6SjgMB2kg30HlF.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"Serial Number OptiPlex 7010 MT DELL7H4K92X1\", \"unit_cost\": \"204\", \"asset_name\": \"Desktop\", \"manufacturer\": null, \"date_acquired\": \"15/03/2025\", \"serial_number\": \"OPTIPLEX\", \"property_number\": \"BCP-IT-2026-000145\", \"asset_description\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register Asset form. Field Property Number Asset Name Sample Data BCP-IT-2026-000145 Dell OptiPlex 7010 Desktop Computer Brand Dell Model Serial Number OptiPlex 7010 MT DELL7H4K92X1 Description Desktop computer assigned to the Information Technology Department for office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD. Department Location Purchase Date Information Technology Department IT Office - Room 204 15/03/2025 Purchase Cost 42500.00 Warranty Until 15/03/2028 Condition Good\"}, \"success\": true, \"raw_text\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register\\nAsset form.\\nField\\nProperty Number\\nAsset Name\\nSample Data\\nBCP-IT-2026-000145\\nDell OptiPlex 7010 Desktop Computer\\nBrand\\nDell\\nModel\\nSerial Number\\nOptiPlex 7010 MT\\nDELL7H4K92X1\\nDescription\\nDesktop computer assigned to the Information Technology Department for\\noffice and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and\\n512GB SSD.\\nDepartment\\nLocation\\nPurchase Date\\nInformation Technology Department\\nIT Office - Room 204\\n15/03/2025\\nPurchase Cost\\n42500.00\\nWarranty Until\\n15/03/2028\\nCondition\\nGood\", \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 98.50, NULL, NULL, 'active', '2026-08-03 09:03:38', '2026-08-03 09:03:38'),
(19, NULL, 'ocr-scans/LWnWACuAeDbjJ9MzDR2tRPL4VNAllO0PI74wgN8F.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"Serial Number OptiPlex 7010 MT DELL7H4K92X1\", \"unit_cost\": \"204\", \"asset_name\": \"Desktop\", \"manufacturer\": null, \"date_acquired\": \"15/03/2025\", \"serial_number\": \"OPTIPLEX\", \"property_number\": \"BCP-IT-2026-000145\", \"asset_description\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register Asset form. Field Property Number Asset Name Sample Data BCP-IT-2026-000145 Dell OptiPlex 7010 Desktop Computer Brand Dell Model Serial Number OptiPlex 7010 MT DELL7H4K92X1 Description Desktop computer assigned to the Information Technology Department for office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD. Department Location Purchase Date Information Technology Department IT Office - Room 204 15/03/2025 Purchase Cost 42500.00 Warranty Until 15/03/2028 Condition Good\"}, \"success\": true, \"raw_text\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register\\nAsset form.\\nField\\nProperty Number\\nAsset Name\\nSample Data\\nBCP-IT-2026-000145\\nDell OptiPlex 7010 Desktop Computer\\nBrand\\nDell\\nModel\\nSerial Number\\nOptiPlex 7010 MT\\nDELL7H4K92X1\\nDescription\\nDesktop computer assigned to the Information Technology Department for\\noffice and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and\\n512GB SSD.\\nDepartment\\nLocation\\nPurchase Date\\nInformation Technology Department\\nIT Office - Room 204\\n15/03/2025\\nPurchase Cost\\n42500.00\\nWarranty Until\\n15/03/2028\\nCondition\\nGood\", \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 98.50, NULL, NULL, 'active', '2026-08-03 09:20:03', '2026-08-03 09:20:03'),
(20, NULL, 'ocr-scans/MqTPtagQi1nTNQB5hhsfBVqFNxMrTv2UYrIq74zC.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"Serial Number OptiPlex 7010 MT DELL7H4K92X1\", \"unit_cost\": \"204\", \"asset_name\": \"Desktop\", \"manufacturer\": null, \"date_acquired\": \"15/03/2025\", \"serial_number\": \"OPTIPLEX\", \"property_number\": \"BCP-IT-2026-000145\", \"asset_description\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register Asset form. Field Property Number Asset Name Sample Data BCP-IT-2026-000145 Dell OptiPlex 7010 Desktop Computer Brand Dell Model Serial Number OptiPlex 7010 MT DELL7H4K92X1 Description Desktop computer assigned to the Information Technology Department for office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD. Department Location Purchase Date Information Technology Department IT Office - Room 204 15/03/2025 Purchase Cost 42500.00 Warranty Until 15/03/2028 Condition Good\"}, \"success\": true, \"raw_text\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register\\nAsset form.\\nField\\nProperty Number\\nAsset Name\\nSample Data\\nBCP-IT-2026-000145\\nDell OptiPlex 7010 Desktop Computer\\nBrand\\nDell\\nModel\\nSerial Number\\nOptiPlex 7010 MT\\nDELL7H4K92X1\\nDescription\\nDesktop computer assigned to the Information Technology Department for\\noffice and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and\\n512GB SSD.\\nDepartment\\nLocation\\nPurchase Date\\nInformation Technology Department\\nIT Office - Room 204\\n15/03/2025\\nPurchase Cost\\n42500.00\\nWarranty Until\\n15/03/2028\\nCondition\\nGood\", \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 98.50, NULL, NULL, 'active', '2026-08-03 09:26:41', '2026-08-03 09:26:41'),
(21, NULL, 'ocr-scans/qVw43FlvhUT9iMbVbAchTu27fkcDQE6MxVtEYsid.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"Serial Number OptiPlex 7010 MT DELL7H4K92X1\", \"unit_cost\": \"204\", \"asset_name\": \"Desktop\", \"manufacturer\": null, \"date_acquired\": \"15/03/2025\", \"serial_number\": \"OPTIPLEX\", \"property_number\": \"BCP-IT-2026-000145\", \"asset_description\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register Asset form. Field Property Number Asset Name Sample Data BCP-IT-2026-000145 Dell OptiPlex 7010 Desktop Computer Brand Dell Model Serial Number OptiPlex 7010 MT DELL7H4K92X1 Description Desktop computer assigned to the Information Technology Department for office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD. Department Location Purchase Date Information Technology Department IT Office - Room 204 15/03/2025 Purchase Cost 42500.00 Warranty Until 15/03/2028 Condition Good\"}, \"success\": true, \"raw_text\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register\\nAsset form.\\nField\\nProperty Number\\nAsset Name\\nSample Data\\nBCP-IT-2026-000145\\nDell OptiPlex 7010 Desktop Computer\\nBrand\\nDell\\nModel\\nSerial Number\\nOptiPlex 7010 MT\\nDELL7H4K92X1\\nDescription\\nDesktop computer assigned to the Information Technology Department for\\noffice and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and\\n512GB SSD.\\nDepartment\\nLocation\\nPurchase Date\\nInformation Technology Department\\nIT Office - Room 204\\n15/03/2025\\nPurchase Cost\\n42500.00\\nWarranty Until\\n15/03/2028\\nCondition\\nGood\", \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 98.50, NULL, NULL, 'active', '2026-08-03 09:27:39', '2026-08-03 09:27:39'),
(22, NULL, 'ocr-scans/la5ulF8nw7XR7WFFpmOcn6j0r2QXjjQMaz0xFVAd.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"Serial Number OptiPlex 7010 MT DELL7H4K92X1\", \"unit_cost\": \"204\", \"asset_name\": \"Desktop\", \"manufacturer\": null, \"date_acquired\": \"15/03/2025\", \"serial_number\": \"OPTIPLEX\", \"property_number\": \"BCP-IT-2026-000145\", \"asset_description\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register Asset form. Field Property Number Asset Name Sample Data BCP-IT-2026-000145 Dell OptiPlex 7010 Desktop Computer Brand Dell Model Serial Number OptiPlex 7010 MT DELL7H4K92X1 Description Desktop computer assigned to the Information Technology Department for office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD. Department Location Purchase Date Information Technology Department IT Office - Room 204 15/03/2025 Purchase Cost 42500.00 Warranty Until 15/03/2028 Condition Good\"}, \"success\": true, \"raw_text\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register\\nAsset form.\\nField\\nProperty Number\\nAsset Name\\nSample Data\\nBCP-IT-2026-000145\\nDell OptiPlex 7010 Desktop Computer\\nBrand\\nDell\\nModel\\nSerial Number\\nOptiPlex 7010 MT\\nDELL7H4K92X1\\nDescription\\nDesktop computer assigned to the Information Technology Department for\\noffice and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and\\n512GB SSD.\\nDepartment\\nLocation\\nPurchase Date\\nInformation Technology Department\\nIT Office - Room 204\\n15/03/2025\\nPurchase Cost\\n42500.00\\nWarranty Until\\n15/03/2028\\nCondition\\nGood\", \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 98.50, NULL, NULL, 'active', '2026-08-03 09:31:11', '2026-08-03 09:31:11'),
(23, NULL, 'ocr-scans/bgmof4RUW7xdaToGonvNVgcVtZF8AN4D7jIpX8fx.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"Serial Number OptiPlex 7010 MT DELL7H4K92X1\", \"unit_cost\": \"204\", \"asset_name\": \"Desktop\", \"manufacturer\": null, \"date_acquired\": \"15/03/2025\", \"serial_number\": \"OPTIPLEX\", \"property_number\": \"BCP-IT-2026-000145\", \"asset_description\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register Asset form. Field Property Number Asset Name Sample Data BCP-IT-2026-000145 Dell OptiPlex 7010 Desktop Computer Brand Dell Model Serial Number OptiPlex 7010 MT DELL7H4K92X1 Description Desktop computer assigned to the Information Technology Department for office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD. Department Location Purchase Date Information Technology Department IT Office - Room 204 15/03/2025 Purchase Cost 42500.00 Warranty Until 15/03/2028 Condition Good\"}, \"success\": true, \"raw_text\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register\\nAsset form.\\nField\\nProperty Number\\nAsset Name\\nSample Data\\nBCP-IT-2026-000145\\nDell OptiPlex 7010 Desktop Computer\\nBrand\\nDell\\nModel\\nSerial Number\\nOptiPlex 7010 MT\\nDELL7H4K92X1\\nDescription\\nDesktop computer assigned to the Information Technology Department for\\noffice and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and\\n512GB SSD.\\nDepartment\\nLocation\\nPurchase Date\\nInformation Technology Department\\nIT Office - Room 204\\n15/03/2025\\nPurchase Cost\\n42500.00\\nWarranty Until\\n15/03/2028\\nCondition\\nGood\", \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 98.50, NULL, NULL, 'active', '2026-08-03 09:34:48', '2026-08-03 09:34:48'),
(24, NULL, 'ocr-scans/7ubyJjojIx0ZeDcDqlgwNElo8MQlC3bKOS7tJASx.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"Serial Number OptiPlex 7010 MT DELL7H4K92X1\", \"unit_cost\": \"204\", \"asset_name\": \"Desktop\", \"manufacturer\": null, \"date_acquired\": \"15/03/2025\", \"serial_number\": \"OPTIPLEX\", \"property_number\": \"BCP-IT-2026-000145\", \"asset_description\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register Asset form. Field Property Number Asset Name Sample Data BCP-IT-2026-000145 Dell OptiPlex 7010 Desktop Computer Brand Dell Model Serial Number OptiPlex 7010 MT DELL7H4K92X1 Description Desktop computer assigned to the Information Technology Department for office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD. Department Location Purchase Date Information Technology Department IT Office - Room 204 15/03/2025 Purchase Cost 42500.00 Warranty Until 15/03/2028 Condition Good\"}, \"success\": true, \"raw_text\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register\\nAsset form.\\nField\\nProperty Number\\nAsset Name\\nSample Data\\nBCP-IT-2026-000145\\nDell OptiPlex 7010 Desktop Computer\\nBrand\\nDell\\nModel\\nSerial Number\\nOptiPlex 7010 MT\\nDELL7H4K92X1\\nDescription\\nDesktop computer assigned to the Information Technology Department for\\noffice and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and\\n512GB SSD.\\nDepartment\\nLocation\\nPurchase Date\\nInformation Technology Department\\nIT Office - Room 204\\n15/03/2025\\nPurchase Cost\\n42500.00\\nWarranty Until\\n15/03/2028\\nCondition\\nGood\", \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 98.50, NULL, NULL, 'active', '2026-08-03 09:34:59', '2026-08-03 09:34:59'),
(25, NULL, 'ocr-scans/P5eloobMglaDf4MdFJaHdBQM1m1M5eeqFb1bvuuC.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"Serial Number OptiPlex 7010 MT DELL7H4K92X1\", \"unit_cost\": \"204\", \"asset_name\": \"Desktop\", \"manufacturer\": null, \"date_acquired\": \"15/03/2025\", \"serial_number\": \"OPTIPLEX\", \"property_number\": \"BCP-IT-2026-000145\", \"asset_description\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register Asset form. Field Property Number Asset Name Sample Data BCP-IT-2026-000145 Dell OptiPlex 7010 Desktop Computer Brand Dell Model Serial Number OptiPlex 7010 MT DELL7H4K92X1 Description Desktop computer assigned to the Information Technology Department for office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD. Department Location Purchase Date Information Technology Department IT Office - Room 204 15/03/2025 Purchase Cost 42500.00 Warranty Until 15/03/2028 Condition Good\"}, \"success\": true, \"raw_text\": \"Here\'s a realistic sample asset record that you can use to test your Review & Register\\nAsset form.\\nField\\nProperty Number\\nAsset Name\\nSample Data\\nBCP-IT-2026-000145\\nDell OptiPlex 7010 Desktop Computer\\nBrand\\nDell\\nModel\\nSerial Number\\nOptiPlex 7010 MT\\nDELL7H4K92X1\\nDescription\\nDesktop computer assigned to the Information Technology Department for\\noffice and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and\\n512GB SSD.\\nDepartment\\nLocation\\nPurchase Date\\nInformation Technology Department\\nIT Office - Room 204\\n15/03/2025\\nPurchase Cost\\n42500.00\\nWarranty Until\\n15/03/2028\\nCondition\\nGood\", \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 98.50, NULL, NULL, 'active', '2026-08-03 20:12:31', '2026-08-03 20:12:31'),
(26, NULL, 'ocr-scans/d6wlehP1YU9JeErlSvOUl2BY5XOdMzEoLvnqV9SV.png', '{\"fields\": {\"brand\": \"Dell\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \"BCP-IT-2026-000145\", \"department\": \"office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and\", \"purchase_cost\": \"42500.00\", \"serial_number\": \"OptiPlex 7010 MT\", \"warranty_until\": \"2028-03-15\"}, \"details\": {\"brand\": \"Dell\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \"BCP-IT-2026-000145\", \"department\": \"office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and\", \"purchase_cost\": \"42500.00\", \"serial_number\": \"OptiPlex 7010 MT\", \"warranty_until\": \"2028-03-15\"}, \"success\": true, \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 98.50, NULL, NULL, 'active', '2026-08-03 20:29:40', '2026-08-03 20:29:40'),
(27, NULL, 'ocr-scans/7BwmyP4esTLXVmaIWNN514EAJuuOSDqEnWq21PXi.png', '{\"fields\": {\"quantity\": \"1\", \"condition\": \"Good\", \"department\": \"administrative tasks. Includes Intel Core i5\", \"purchase_cost\": \"42500.00\", \"purchase_date\": \"BCP-IT-2026-000145\", \"warranty_until\": \"2028-03-15\"}, \"details\": {\"quantity\": \"1\", \"condition\": \"Good\", \"department\": \"administrative tasks. Includes Intel Core i5\", \"purchase_cost\": \"42500.00\", \"purchase_date\": \"BCP-IT-2026-000145\", \"warranty_until\": \"2028-03-15\"}, \"success\": true, \"mime_type\": \"image/png\", \"image_name\": \"newq1.png\", \"image_size\": 110602}', 87.38, NULL, NULL, 'active', '2026-08-03 20:32:12', '2026-08-03 20:32:12'),
(28, NULL, 'ocr-scans/F45QTrIK5QWF1xwzaBOY52HrDwikN6bmk9RCWDuN.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \"42500.00\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \"Dell OptiPlex 7010 Desktop Computer\", \"department\": \"IT Office - Room 204\", \"description\": \"office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD.\", \"purchase_date\": \"2028-03-15\", \"serial_number\": \"DELL7H4K92X1\", \"property_number\": \"BCP-IT-2026-000145\"}, \"details\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \"42500.00\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \"Dell OptiPlex 7010 Desktop Computer\", \"department\": \"IT Office - Room 204\", \"description\": \"office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD.\", \"purchase_date\": \"2028-03-15\", \"serial_number\": \"DELL7H4K92X1\", \"property_number\": \"BCP-IT-2026-000145\"}, \"success\": true, \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 98.50, NULL, NULL, 'active', '2026-08-03 20:40:07', '2026-08-03 20:40:07'),
(29, NULL, 'ocr-scans/w4nIB0WhwWdT7Txwm7q6sCCrpPYDBCaqFAd79pTn.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \":\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \": Dell OptiPlex 7010 Desktop Computer\", \"department\": \"administrative tasks. Includes Intel Core i5\", \"description\": \"Desktop computer assigned to the Information\", \"purchase_cost\": \"42500.00\", \"purchase_date\": \"2025-03-15\", \"serial_number\": \": DELL7H4K92X1\", \"warranty_until\": \"2028-03-15\", \"property_number\": \"BCP-IT-2026-000145\"}, \"details\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \":\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \": Dell OptiPlex 7010 Desktop Computer\", \"department\": \"administrative tasks. Includes Intel Core i5\", \"description\": \"Desktop computer assigned to the Information\", \"purchase_cost\": \"42500.00\", \"purchase_date\": \"2025-03-15\", \"serial_number\": \": DELL7H4K92X1\", \"warranty_until\": \"2028-03-15\", \"property_number\": \"BCP-IT-2026-000145\"}, \"success\": true, \"mime_type\": \"image/png\", \"image_name\": \"newq1.png\", \"image_size\": 110602}', 87.23, NULL, NULL, 'active', '2026-08-03 20:40:36', '2026-08-03 20:40:36'),
(31, 30, 'ocr-scans/7Plg8F3Ua92i4NafKOk4zqbO1WH3ja0L55znlFz4.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \"processor, 16GB RAM, and 512GB SSD\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \": Dell OptiPlex 7010 Desktop Computer\", \"department\": \"administrative tasks. Includes Intel Core i5\", \"description\": \"Desktop computer assigned to the Information\", \"purchase_cost\": \"42500.00\", \"purchase_date\": \":\", \"serial_number\": \": DELL7H4K92X1\", \"warranty_until\": \"2028-03-15\", \"property_number\": \"BCP-IT-2026-000145\"}, \"details\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \"processor, 16GB RAM, and 512GB SSD\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \": Dell OptiPlex 7010 Desktop Computer\", \"department\": \"administrative tasks. Includes Intel Core i5\", \"description\": \"Desktop computer assigned to the Information\", \"purchase_cost\": \"42500.00\", \"purchase_date\": \":\", \"serial_number\": \": DELL7H4K92X1\", \"warranty_until\": \"2028-03-15\", \"property_number\": \"BCP-IT-2026-000145\"}, \"success\": true, \"mime_type\": \"image/png\", \"image_name\": \"newq1.png\", \"image_size\": 110602}', 87.92, 'e06f30bb-0629-4484-859d-f2129c192310', NULL, 'active', '2026-08-03 21:13:58', '2026-08-03 21:14:22'),
(32, NULL, 'ocr-scans/fJCnQSQYUecJZNca5jsIfoK6gpLIOoTc9Z2FEbew.png', '{\"fields\": [], \"details\": [], \"success\": false, \"mime_type\": \"image/png\", \"image_name\": \"newq1.png\", \"image_size\": 110602}', 0.00, NULL, NULL, 'active', '2026-08-07 05:43:27', '2026-08-07 05:43:27'),
(33, NULL, 'ocr-scans/gWCP3RkUztxUyNLSUB5L7UEBq1jMlsKI8qz4JLtg.png', '{\"fields\": [], \"details\": [], \"success\": false, \"mime_type\": \"image/png\", \"image_name\": \"newq1.png\", \"image_size\": 110602}', 0.00, NULL, NULL, 'active', '2026-08-07 05:46:00', '2026-08-07 05:46:00'),
(34, NULL, 'ocr-scans/Y2JZC2nJjW85YBYeDLloG59M1vQcFkMPYOfTH27e.png', '{\"fields\": [], \"details\": [], \"success\": false, \"mime_type\": \"image/png\", \"image_name\": \"newq1.png\", \"image_size\": 110602}', 0.00, NULL, NULL, 'active', '2026-08-07 05:46:12', '2026-08-07 05:46:12'),
(35, NULL, 'ocr-scans/BlhGdCJbiNOeqGn2bJiMfPx2xtN61uoilnNNX5lC.png', '{\"fields\": [], \"details\": [], \"success\": false, \"mime_type\": \"image/png\", \"image_name\": \"newq1.png\", \"image_size\": 110602}', 0.00, NULL, NULL, 'active', '2026-08-07 05:49:56', '2026-08-07 05:49:56'),
(36, NULL, 'ocr-scans/uY8pOgkYzyL91PNuCWUK5y2YD2dGoQKWLwMxydS7.png', '{\"fields\": [], \"details\": [], \"success\": false, \"mime_type\": \"image/png\", \"image_name\": \"newq1.png\", \"image_size\": 110602}', 0.00, NULL, NULL, 'active', '2026-08-07 05:54:14', '2026-08-07 05:54:14'),
(37, NULL, 'ocr-scans/o5cBVqObI9OKkIGZSg2Xhh9xTX5Njlr1Y3N1Jfvp.png', '{\"fields\": {\"brand\": \"Dell OptiPlex 7010 Desktop Computer\", \"model\": \"Dell\", \"location\": \"processor, 16GB RAM, and 512GB SSD\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \":\", \"department\": \"administrative tasks. Includes Intel Core i5\", \"description\": \": DELL7H4K92X1 Desktop computer assigned to the Information\", \"purchase_cost\": \"42500.00\", \"purchase_date\": \": IT Office Room 204\", \"serial_number\": \"OptiPlex 7010 MT\", \"warranty_until\": \":\", \"property_number\": \"BCP-IT-2026-000145\"}, \"details\": {\"brand\": \"Dell OptiPlex 7010 Desktop Computer\", \"model\": \"Dell\", \"location\": \"processor, 16GB RAM, and 512GB SSD\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \":\", \"department\": \"administrative tasks. Includes Intel Core i5\", \"description\": \": DELL7H4K92X1 Desktop computer assigned to the Information\", \"purchase_cost\": \"42500.00\", \"purchase_date\": \": IT Office Room 204\", \"serial_number\": \"OptiPlex 7010 MT\", \"warranty_until\": \":\", \"property_number\": \"BCP-IT-2026-000145\"}, \"success\": true, \"mime_type\": \"image/png\", \"image_name\": \"newq1.png\", \"image_size\": 110602}', 87.52, NULL, NULL, 'active', '2026-08-07 06:07:56', '2026-08-07 06:07:56'),
(38, NULL, 'ocr-scans/9hOSihOqCWPjB1FhdUmDq0vXoKWoQyNgdDUmZjPs.jpg', '{\"fields\": {\"brand\": \"Dell OptiPlex 7010 Desktop Computer\", \"model\": \"Dell\", \"location\": \"15/03/2025\", \"quantity\": \"115032028\", \"condition\": \"Good\", \"asset_name\": \"BCP-IT-2026-000145\", \"department\": \"administrative tasks. Hcludes Intel Core i5\", \"description\": \": DELL7H4K92X1 :Desktop computer assigned to the Information\", \"purchase_cost\": \"42500.00\", \"purchase_date\": \":\", \"serial_number\": \"OptiPlex 7010 MT\", \"warranty_until\": \"Good\", \"property_number\": \":\"}, \"details\": {\"brand\": \"Dell OptiPlex 7010 Desktop Computer\", \"model\": \"Dell\", \"location\": \"15/03/2025\", \"quantity\": \"115032028\", \"condition\": \"Good\", \"asset_name\": \"BCP-IT-2026-000145\", \"department\": \"administrative tasks. Hcludes Intel Core i5\", \"description\": \": DELL7H4K92X1 :Desktop computer assigned to the Information\", \"purchase_cost\": \"42500.00\", \"purchase_date\": \":\", \"serial_number\": \"OptiPlex 7010 MT\", \"warranty_until\": \"Good\", \"property_number\": \":\"}, \"success\": true, \"mime_type\": \"image/jpeg\", \"image_name\": \"1ce44c12-e24d-4af4-b240-ff334b319269.jpg\", \"image_size\": 13870}', 80.46, NULL, NULL, 'active', '2026-08-07 06:29:40', '2026-08-07 06:29:40'),
(39, NULL, 'ocr-scans/mIaG7E50k02FEWRmbw10EIdDT2TDCbIQuJkB48Iu.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \"42500.00\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \"Dell OptiPlex 7010 Desktop Computer\", \"department\": \"IT Office - Room 204\", \"description\": \"office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD.\", \"purchase_date\": \"2028-03-15\", \"serial_number\": \"DELL7H4K92X1\", \"property_number\": \"BCP-IT-2026-000145\"}, \"details\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \"42500.00\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \"Dell OptiPlex 7010 Desktop Computer\", \"department\": \"IT Office - Room 204\", \"description\": \"office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD.\", \"purchase_date\": \"2028-03-15\", \"serial_number\": \"DELL7H4K92X1\", \"property_number\": \"BCP-IT-2026-000145\"}, \"success\": true, \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 98.50, NULL, NULL, 'active', '2026-08-07 06:31:15', '2026-08-07 06:31:15'),
(40, NULL, 'ocr-scans/aGJ4HS4XZS3B72x9yjCREEL513rObqMvUyrZvFqI.jpg', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \"42500.00\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \"Dell OptiPlex 7010 Desktop Computer\", \"department\": \"IT Office-Room 204\", \"description\": \"office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD.\", \"purchase_date\": \"Good\", \"serial_number\": \"DELL7H4K92X1\", \"property_number\": \"8CP-IT-2026-000145\"}, \"details\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \"42500.00\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \"Dell OptiPlex 7010 Desktop Computer\", \"department\": \"IT Office-Room 204\", \"description\": \"office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD.\", \"purchase_date\": \"Good\", \"serial_number\": \"DELL7H4K92X1\", \"property_number\": \"8CP-IT-2026-000145\"}, \"success\": true, \"mime_type\": \"image/jpeg\", \"image_name\": \"webview_tmp_file3732439956349662622.jpg\", \"image_size\": 4482030}', 92.39, NULL, NULL, 'active', '2026-08-07 06:35:15', '2026-08-07 06:35:15'),
(41, NULL, 'ocr-scans/puyJUJdYjOsUPQmg7awlce9udiKwY9XHWKZ6eYoL.jpg', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \"15/03/2028\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \"Dell OptiPlex 7010 Desktop Computer\", \"department\": \"IT Office - Room 204\", \"description\": \"office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD.\", \"purchase_date\": \"Good\", \"serial_number\": \"DELL7H4K92X1\", \"property_number\": \"BCP-IT-2026-000145\"}, \"details\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \"15/03/2028\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \"Dell OptiPlex 7010 Desktop Computer\", \"department\": \"IT Office - Room 204\", \"description\": \"office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD.\", \"purchase_date\": \"Good\", \"serial_number\": \"DELL7H4K92X1\", \"property_number\": \"BCP-IT-2026-000145\"}, \"success\": true, \"mime_type\": \"image/jpeg\", \"image_name\": \"d0a4f0b5-2d7c-4b21-950c-075af37d1091.jpg\", \"image_size\": 39052}', 98.10, NULL, NULL, 'active', '2026-08-07 06:35:26', '2026-08-07 06:35:26'),
(42, NULL, 'ocr-scans/LkvBIwoJNU2puI3vFZVCMjJEUNDnhovxzUS3N8cp.jpg', '{\"fields\": {\"brand\": \": OptiPlex 7010 MT\", \"model\": \"DELL7H4K92X1\", \"location\": \"15/03/2012\", \"quantity\": \"1\", \"condition\": \"3\", \"asset_name\": \":\", \"department\": \"1\", \"description\": \"Iministrative Includes Intel Core i5 processor, 16GB RAM, and ST2GB SSD\", \"purchase_date\": \"2008-03-15\", \"serial_number\": \"Desktop computer assigned to the Information\", \"warranty_until\": \"W\", \"property_number\": \": BCP-IT-2020-000145\"}, \"details\": {\"brand\": \": OptiPlex 7010 MT\", \"model\": \"DELL7H4K92X1\", \"location\": \"15/03/2012\", \"quantity\": \"1\", \"condition\": \"3\", \"asset_name\": \":\", \"department\": \"1\", \"description\": \"Iministrative Includes Intel Core i5 processor, 16GB RAM, and ST2GB SSD\", \"purchase_date\": \"2008-03-15\", \"serial_number\": \"Desktop computer assigned to the Information\", \"warranty_until\": \"W\", \"property_number\": \": BCP-IT-2020-000145\"}, \"success\": true, \"mime_type\": \"image/jpeg\", \"image_name\": \"image.jpg\", \"image_size\": 4311357}', 80.20, NULL, NULL, 'active', '2026-08-07 06:38:31', '2026-08-07 06:38:31'),
(43, NULL, 'ocr-scans/NqQia2oRfQU6uj5I2adM9kZhpnza2prZ38PEEqQ9.jpg', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"quantity\": \"1\", \"condition\": \"IT Office-Room 204\", \"asset_name\": \"Dell OptiPlex 7010 Desktop Computer\", \"department\": \"42500.00\", \"description\": \"office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD. {יי}! !!!!! 15/03/2025\", \"purchase_cost\": \"15032028\", \"serial_number\": \"DELL7H4K92X1\", \"warranty_until\": \"Good\", \"property_number\": \"BCP-IT-2026-000145\"}, \"details\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"quantity\": \"1\", \"condition\": \"IT Office-Room 204\", \"asset_name\": \"Dell OptiPlex 7010 Desktop Computer\", \"department\": \"42500.00\", \"description\": \"office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD. {יי}! !!!!! 15/03/2025\", \"purchase_cost\": \"15032028\", \"serial_number\": \"DELL7H4K92X1\", \"warranty_until\": \"Good\", \"property_number\": \"BCP-IT-2026-000145\"}, \"success\": true, \"mime_type\": \"image/jpeg\", \"image_name\": \"image.jpg\", \"image_size\": 3032474}', 94.65, NULL, NULL, 'active', '2026-08-07 06:45:44', '2026-08-07 06:45:44'),
(44, NULL, 'ocr-scans/ICZxB2LOVsq9RRDfJQGedg1WZi5vxkLrirQdbCTK.jpg', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \"15/03/2025\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \"Dell OptiPlex 7010 Desktop Computer\", \"department\": \"IT Office-Room 204\", \"description\": \"office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD.\", \"purchase_date\": \"42500.00\", \"serial_number\": \"DELL7H4K92X1\", \"property_number\": \"BCP-IT-2026-000145\"}, \"details\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \"15/03/2025\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \"Dell OptiPlex 7010 Desktop Computer\", \"department\": \"IT Office-Room 204\", \"description\": \"office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD.\", \"purchase_date\": \"42500.00\", \"serial_number\": \"DELL7H4K92X1\", \"property_number\": \"BCP-IT-2026-000145\"}, \"success\": true, \"mime_type\": \"image/jpeg\", \"image_name\": \"image.jpg\", \"image_size\": 2510105}', 97.18, NULL, NULL, 'active', '2026-08-07 06:46:31', '2026-08-07 06:46:31'),
(45, NULL, 'ocr-scans/JCU9LpVP1mMzpbR8sQ7BRiU8vaYJkxwTsNZfr7r3.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \"42500.00\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \"Dell OptiPlex 7010 Desktop Computer\", \"department\": \"IT Office - Room 204\", \"description\": \"office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD.\", \"purchase_date\": \"2028-03-15\", \"serial_number\": \"DELL7H4K92X1\", \"property_number\": \"BCP-IT-2026-000145\"}, \"details\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \"42500.00\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \"Dell OptiPlex 7010 Desktop Computer\", \"department\": \"IT Office - Room 204\", \"description\": \"office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD.\", \"purchase_date\": \"2028-03-15\", \"serial_number\": \"DELL7H4K92X1\", \"property_number\": \"BCP-IT-2026-000145\"}, \"success\": true, \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 98.50, NULL, NULL, 'active', '2026-08-07 19:51:50', '2026-08-07 19:51:50'),
(46, NULL, 'ocr-scans/Z8CpSfs1WS2ZRIPDiGOq0dQyVACTZO2ioA0WHwor.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \"42500.00\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \"Dell OptiPlex 7010 Desktop Computer\", \"department\": \"IT Office - Room 204\", \"description\": \"office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD.\", \"purchase_date\": \"2028-03-15\", \"serial_number\": \"DELL7H4K92X1\", \"property_number\": \"BCP-IT-2026-000145\"}, \"details\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \"42500.00\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \"Dell OptiPlex 7010 Desktop Computer\", \"department\": \"IT Office - Room 204\", \"description\": \"office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD.\", \"purchase_date\": \"2028-03-15\", \"serial_number\": \"DELL7H4K92X1\", \"property_number\": \"BCP-IT-2026-000145\"}, \"success\": true, \"mime_type\": \"image/png\", \"image_name\": \"2.png\", \"image_size\": 20122}', 98.50, NULL, NULL, 'active', '2026-08-07 19:52:08', '2026-08-07 19:52:08'),
(47, NULL, 'ocr-scans/x5ENW8yuMyGwOw3kimEBfVvjixL5jRh1QJ8dS66f.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \"processor, 16GB RAM, and 512GB SSD\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \": Dell OptiPlex 7010 Desktop Computer\", \"department\": \"administrative tasks. Includes Intel Core i5\", \"description\": \"Desktop computer assigned to the Information\", \"purchase_cost\": \"42500.00\", \"purchase_date\": \": IT Office Room 204\", \"serial_number\": \": DELL7H4K92X1\", \"warranty_until\": \"2028-03-15\", \"property_number\": \"BCP-IT-2026-000145\"}, \"details\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \"processor, 16GB RAM, and 512GB SSD\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \": Dell OptiPlex 7010 Desktop Computer\", \"department\": \"administrative tasks. Includes Intel Core i5\", \"description\": \"Desktop computer assigned to the Information\", \"purchase_cost\": \"42500.00\", \"purchase_date\": \": IT Office Room 204\", \"serial_number\": \": DELL7H4K92X1\", \"warranty_until\": \"2028-03-15\", \"property_number\": \"BCP-IT-2026-000145\"}, \"success\": true, \"mime_type\": \"image/png\", \"image_name\": \"newq1.png\", \"image_size\": 110602}', 87.38, NULL, NULL, 'active', '2026-08-07 19:52:16', '2026-08-07 19:52:16'),
(48, NULL, 'ocr-scans/vU73cQrbWuO0cj7q4hN1fk3a5OOiayAhPQNiazbY.png', '{\"fields\": {\"brand\": \"Dell OptiPlex 7010 Desktop Computer\", \"model\": \"Dell\", \"location\": \"processor, 16GB RAM, and 512GB SSD\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \":\", \"department\": \"administrative tasks. Includes Intel Core i5\", \"description\": \": DELL7H4K92X1 Desktop computer assigned to the Information\", \"purchase_cost\": \"42500.00\", \"purchase_date\": \": IT Office Room 204\", \"serial_number\": \"OptiPlex 7010 MT\", \"warranty_until\": \":\", \"property_number\": \"BCP-IT-2026-000145\"}, \"details\": {\"brand\": \"Dell OptiPlex 7010 Desktop Computer\", \"model\": \"Dell\", \"location\": \"processor, 16GB RAM, and 512GB SSD\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \":\", \"department\": \"administrative tasks. Includes Intel Core i5\", \"description\": \": DELL7H4K92X1 Desktop computer assigned to the Information\", \"purchase_cost\": \"42500.00\", \"purchase_date\": \": IT Office Room 204\", \"serial_number\": \"OptiPlex 7010 MT\", \"warranty_until\": \":\", \"property_number\": \"BCP-IT-2026-000145\"}, \"success\": true, \"mime_type\": \"image/png\", \"image_name\": \"newq1.png\", \"image_size\": 110602}', 87.52, NULL, NULL, 'active', '2026-08-17 07:36:39', '2026-08-17 07:36:39'),
(49, NULL, 'ocr-scans/IlTYlOKs9RFnKNSOkbb50gdkn9cfin7SdB09d3lq.png', '{\"fields\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \":\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \": Dell OptiPlex 7010 Desktop Computer\", \"department\": \"administrative tasks. Includes Intel Core i5\", \"description\": \"Desktop computer assigned to the Information\", \"purchase_cost\": \"42500.00\", \"purchase_date\": \"2025-03-15\", \"serial_number\": \": DELL7H4K92X1\", \"warranty_until\": \"2028-03-15\", \"property_number\": \"BCP-IT-2026-000145\"}, \"details\": {\"brand\": \"Dell\", \"model\": \"OptiPlex 7010 MT\", \"location\": \":\", \"quantity\": \"1\", \"condition\": \"Good\", \"asset_name\": \": Dell OptiPlex 7010 Desktop Computer\", \"department\": \"administrative tasks. Includes Intel Core i5\", \"description\": \"Desktop computer assigned to the Information\", \"purchase_cost\": \"42500.00\", \"purchase_date\": \"2025-03-15\", \"serial_number\": \": DELL7H4K92X1\", \"warranty_until\": \"2028-03-15\", \"property_number\": \"BCP-IT-2026-000145\"}, \"success\": true, \"mime_type\": \"image/png\", \"image_name\": \"newq1.png\", \"image_size\": 110602}', 87.23, NULL, NULL, 'active', '2026-08-19 23:16:44', '2026-08-19 23:16:44'),
(76, 43, 'ocr-scans/v3k1Zoo2RLKYYIf2qIpiLJLlt4lURVKxc53ELH4D.png', '{\"image_name\":\"2.png\",\"image_size\":20122,\"mime_type\":\"image\\/png\",\"success\":true,\"fields\":{\"property_number\":\"BCP - IT - 2026-000145\",\"asset_name\":\"Dell OptiPlex 7010 Desktop Computer\",\"brand\":\"Dell\",\"model\":\"OptiPlex 7010 MT\",\"serial_number\":\"DELL7H4K92X1\",\"description\":\"Desktop computer assigned to the Information Technology Department for office and administrative tasks . Includes Intel Core i5 processor , 16GB RAM , and 512GB SSD .\",\"department\":\"Information Technology Department\",\"location\":\"IT Office - Room 204\",\"purchase_date\":\"2025-03-15\",\"purchase_cost\":\"42500.00\",\"quantity\":\"1\",\"warranty_until\":\"2028-03-15\",\"condition\":\"Good\"},\"details\":{\"property_number\":\"BCP - IT - 2026-000145\",\"asset_name\":\"Dell OptiPlex 7010 Desktop Computer\",\"brand\":\"Dell\",\"model\":\"OptiPlex 7010 MT\",\"serial_number\":\"DELL7H4K92X1\",\"description\":\"Desktop computer assigned to the Information Technology Department for office and administrative tasks . Includes Intel Core i5 processor , 16GB RAM , and 512GB SSD .\",\"department\":\"Information Technology Department\",\"location\":\"IT Office - Room 204\",\"purchase_date\":\"2025-03-15\",\"purchase_cost\":\"42500.00\",\"quantity\":\"1\",\"warranty_until\":\"2028-03-15\",\"condition\":\"Good\"}}', 98.50, '6892099d-1a17-4ed7-b21c-012eb78d70f9', NULL, 'active', '2026-08-24 08:32:08', '2026-08-24 08:32:15');

-- --------------------------------------------------------

--
-- Table structure for table `physical_audits`
--

CREATE TABLE `physical_audits` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `audit_number` varchar(40) DEFAULT NULL,
  `area` varchar(180) DEFAULT NULL,
  `auditor_id` char(36) DEFAULT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `status` varchar(40) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_requests`
--

CREATE TABLE `purchase_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `request_number` varchar(40) DEFAULT NULL,
  `requested_by` char(36) DEFAULT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `replenishment_supply_id` bigint(20) UNSIGNED DEFAULT NULL,
  `auto_generated` tinyint(1) NOT NULL DEFAULT 0,
  `current_stage` varchar(40) DEFAULT NULL,
  `priority` varchar(30) DEFAULT NULL,
  `total_amount` decimal(14,2) DEFAULT NULL,
  `date_needed` date DEFAULT NULL,
  `attachment_path` varchar(255) DEFAULT NULL,
  `workflow_destination` varchar(40) DEFAULT NULL,
  `timeline` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`timeline`)),
  `workflow_history` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`workflow_history`)),
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `status` varchar(40) NOT NULL DEFAULT 'active',
  `request_type` varchar(40) DEFAULT NULL,
  `is_walk_in` tinyint(1) NOT NULL DEFAULT 0,
  `walk_in_created_by` char(36) DEFAULT NULL,
  `walk_in_requester_name` varchar(255) DEFAULT NULL,
  `walk_in_requester_contact` varchar(255) DEFAULT NULL,
  `walk_in_has_account` tinyint(1) NOT NULL DEFAULT 0,
  `walk_in_notes` text DEFAULT NULL,
  `department_name` varchar(255) DEFAULT NULL,
  `unit` varchar(255) DEFAULT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `purpose` text DEFAULT NULL,
  `requested_by_name` varchar(255) DEFAULT NULL,
  `line_items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`line_items`)),
  `released_by` char(36) DEFAULT NULL,
  `released_at` timestamp NULL DEFAULT NULL,
  `receipt_number` varchar(40) DEFAULT NULL,
  `receipt_document_path` varchar(255) DEFAULT NULL,
  `receipt_generated_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `revision_notes` text DEFAULT NULL,
  `revision_requested_at` timestamp NULL DEFAULT NULL,
  `more_information_notes` text DEFAULT NULL,
  `more_information_requested_at` timestamp NULL DEFAULT NULL,
  `return_for_review_notes` text DEFAULT NULL,
  `returned_for_review_at` timestamp NULL DEFAULT NULL,
  `conditional_approval_notes` text DEFAULT NULL,
  `escalation_notes` text DEFAULT NULL,
  `escalated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `approval_document_path` varchar(255) DEFAULT NULL,
  `approval_status` varchar(40) NOT NULL DEFAULT 'not_required',
  `verified_by` char(36) DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `verification_notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `purchase_requests`
--

INSERT INTO `purchase_requests` (`id`, `request_number`, `requested_by`, `department_id`, `replenishment_supply_id`, `auto_generated`, `current_stage`, `priority`, `total_amount`, `date_needed`, `attachment_path`, `workflow_destination`, `timeline`, `workflow_history`, `payload`, `status`, `request_type`, `is_walk_in`, `walk_in_created_by`, `walk_in_requester_name`, `walk_in_requester_contact`, `walk_in_has_account`, `walk_in_notes`, `department_name`, `unit`, `branch`, `purpose`, `requested_by_name`, `line_items`, `released_by`, `released_at`, `receipt_number`, `receipt_document_path`, `receipt_generated_at`, `rejection_reason`, `revision_notes`, `revision_requested_at`, `more_information_notes`, `more_information_requested_at`, `return_for_review_notes`, `returned_for_review_at`, `conditional_approval_notes`, `escalation_notes`, `escalated_at`, `created_at`, `updated_at`, `approval_document_path`, `approval_status`, `verified_by`, `verified_at`, `verification_notes`) VALUES
(3, 'PR-2026-000001', 'd2313059-00af-458d-af1c-412da9de90ac', 12, NULL, 0, 'released', 'normal', 11.20, '2026-08-10', NULL, 'purchase_workflow', '[{\"stage\":\"Submitted\",\"status\":\"submitted\",\"performed_by\":\"d2313059-00af-458d-af1c-412da9de90ac\",\"timestamp\":\"2026-08-10T07:16:25+00:00\"},{\"stage\":\"Department Head Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Recommending Approver Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"President Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Property Custodian Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Completed\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Released\",\"status\":\"released\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-18T02:17:20+00:00\"}]', NULL, NULL, 'released', 'purchase_order', 0, NULL, NULL, NULL, 0, NULL, 'Logistics', NULL, 'MV', 'needs', 'Requester Account', '[{\"type\":\"supply\",\"source_type\":\"supply\",\"qty\":\"10\",\"quantity\":\"10\"}]', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-17 18:17:20', 'RR-2026-000004', 'release-receipts/receipt-3.html', '2026-08-17 18:17:21', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-09 23:16:25', '2026-08-17 18:17:21', NULL, 'not_required', NULL, NULL, NULL),
(7, 'REQ-2026-000002', 'd2313059-00af-458d-af1c-412da9de90ac', 12, NULL, 0, 'released', 'normal', 100.00, '2026-08-11', NULL, 'supplies_inventory_release', '[{\"stage\":\"Submitted\",\"status\":\"submitted\",\"performed_by\":\"d2313059-00af-458d-af1c-412da9de90ac\",\"timestamp\":\"2026-08-10T23:38:28+00:00\"},{\"stage\":\"Department Head Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Recommending Approver Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"President Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Property Custodian Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Completed\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Released\",\"status\":\"released\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-17T23:40:51+00:00\"}]', NULL, NULL, 'released', 'request', 0, NULL, NULL, NULL, 0, NULL, 'Logistics', NULL, 'MV', 'Need', 'Requester Account', '[{\"qty\":10,\"quantity\":10,\"unit\":\"1\",\"item\":\"Ballpen\",\"particular\":\"Ballpen\",\"description\":\"Pen\",\"remarks\":null,\"type\":\"supply\",\"source_type\":\"supply\",\"source_id\":7,\"workflow_destination\":\"supplies_inventory_release\",\"availability_status\":\"Available\",\"unit_price\":10,\"unitPrice\":10,\"amount\":100,\"estimated_cost\":100,\"preferred_custodian\":null,\"expected_usage\":null,\"location\":null,\"expected_return_date\":null}]', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-17 15:40:51', 'RR-2026-000002', 'release-receipts/receipt-7.html', '2026-08-17 15:40:51', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-10 15:38:28', '2026-08-17 15:40:51', NULL, 'not_required', NULL, NULL, NULL),
(52, 'REQ-2026-000003', 'd2313059-00af-458d-af1c-412da9de90ac', 12, NULL, 0, 'released', 'normal', 10.00, '2026-08-18', NULL, 'supplies_inventory_release', '[{\"stage\":\"Submitted\",\"status\":\"submitted\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-17T22:49:40+00:00\"},{\"stage\":\"Department Head Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Recommending Approver Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"President Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Property Custodian Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Completed\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Walk-in Approval Document Verification\",\"status\":\"verified\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"notes\":null,\"timestamp\":\"2026-08-17T22:54:57+00:00\"},{\"stage\":\"Released\",\"status\":\"released\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-17T23:29:12+00:00\"}]', NULL, NULL, 'released', 'request', 1, '6892099d-1a17-4ed7-b21c-012eb78d70f9', NULL, NULL, 1, 'G', 'Logistics', 'Pcs', 'MV', 'NEED', NULL, '[{\"qty\":1,\"quantity\":1,\"unit\":\"unit\",\"item\":\"Ballpen\",\"particular\":\"Ballpen\",\"description\":\"Pen\",\"remarks\":null,\"type\":\"supply\",\"source_type\":\"supply\",\"source_id\":7,\"workflow_destination\":\"supplies_inventory_release\",\"availability_status\":\"Available\",\"unit_price\":10,\"unitPrice\":10,\"amount\":10,\"estimated_cost\":10,\"preferred_custodian\":null,\"expected_usage\":null,\"location\":null,\"expected_return_date\":null}]', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-17 15:29:12', 'RR-2026-000001', 'release-receipts/receipt-52.html', '2026-08-17 15:29:12', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-17 14:49:40', '2026-08-17 15:29:12', 'walk-in-approval-documents/cCSxMvu2TEC57ok5QkTpieLxuS7F2hEfHcFRlRM7.jpg', 'verified', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-17 14:54:57', NULL),
(53, 'REQ-2026-000004', 'd2313059-00af-458d-af1c-412da9de90ac', 12, NULL, 0, 'released', 'normal', 110.00, '2026-08-18', NULL, 'supplies_inventory_release', '[{\"stage\":\"Submitted\",\"status\":\"submitted\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-18T00:17:35+00:00\"},{\"stage\":\"Department Head Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Recommending Approver Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"President Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Property Custodian Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Completed\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Walk-in Approval Document Verification\",\"status\":\"verified\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"notes\":null,\"timestamp\":\"2026-08-18T00:22:07+00:00\"},{\"stage\":\"Released\",\"status\":\"released\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-18T00:22:21+00:00\"}]', NULL, NULL, 'released', 'request', 1, '6892099d-1a17-4ed7-b21c-012eb78d70f9', NULL, NULL, 1, 'Need', 'Logistics', 'Pcs', 'MV', 'Need', NULL, '[{\"qty\":11,\"quantity\":11,\"unit\":\"unit\",\"item\":\"Ballpen\",\"particular\":\"Ballpen\",\"description\":\"Pen\",\"remarks\":null,\"type\":\"supply\",\"source_type\":\"supply\",\"source_id\":7,\"workflow_destination\":\"supplies_inventory_release\",\"availability_status\":\"Available\",\"unit_price\":10,\"unitPrice\":10,\"amount\":110,\"estimated_cost\":110,\"preferred_custodian\":null,\"expected_usage\":null,\"location\":null,\"expected_return_date\":null}]', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-17 16:22:21', 'RR-2026-000003', 'release-receipts/receipt-53.html', '2026-08-17 16:22:22', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-17 16:17:35', '2026-08-17 16:22:22', 'walk-in-approval-documents/VFp9x5Zn5uCVTAPKQtb9GCpp2tnksDCE7e1wnwJM.jpg', 'verified', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-17 16:22:07', NULL),
(55, 'REQ-2026-000005', NULL, 3, NULL, 0, 'released', 'normal', 10.00, '2026-08-19', NULL, 'supplies_inventory_release', '[{\"stage\":\"Submitted\",\"status\":\"submitted\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-19T08:49:35+00:00\"},{\"stage\":\"Department Head Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Recommending Approver Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"President Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Property Custodian Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Completed\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Walk-in Approval Document Verification\",\"status\":\"verified\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"notes\":null,\"timestamp\":\"2026-08-19T08:53:00+00:00\"},{\"stage\":\"Released\",\"status\":\"released\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-19T10:20:26+00:00\"}]', NULL, NULL, 'released', 'request', 1, '6892099d-1a17-4ed7-b21c-012eb78d70f9', 'Almond Gugulan', '09123456789', 0, 'Need', 'Clinic', 'Pcs', 'MV', 'Need', 'Almond Gugulan', '[{\"qty\":1,\"quantity\":1,\"unit\":\"unit\",\"item\":\"Ballpen\",\"particular\":\"Ballpen\",\"description\":\"Pen\",\"remarks\":null,\"type\":\"supply\",\"source_type\":\"supply\",\"source_id\":7,\"workflow_destination\":\"supplies_inventory_release\",\"availability_status\":\"Available\",\"unit_price\":10,\"unitPrice\":10,\"amount\":10,\"estimated_cost\":10,\"preferred_custodian\":null,\"expected_usage\":null,\"location\":null,\"expected_return_date\":null}]', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-19 02:20:26', 'RR-2026-000006', 'release-receipts/receipt-55.html', '2026-08-19 02:20:27', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-19 00:49:35', '2026-08-19 02:20:27', 'walk-in-approval-documents/9B55GyHN18gMa8uXGTbOTM343FrwqcOECqEkltBE.jpg', 'verified', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-19 00:53:00', NULL),
(56, 'REQ-2026-000006', NULL, 1, NULL, 0, 'released', 'normal', 10.00, '2026-08-19', NULL, 'supplies_inventory_release', '[{\"stage\":\"Submitted\",\"status\":\"submitted\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-19T09:15:51+00:00\"},{\"stage\":\"Department Head Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Recommending Approver Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"President Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Property Custodian Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Completed\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Walk-in Approval Document Verification\",\"status\":\"verified\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"notes\":null,\"timestamp\":\"2026-08-19T10:15:13+00:00\"},{\"stage\":\"Released\",\"status\":\"released\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-19T10:20:08+00:00\"}]', NULL, NULL, 'released', 'request', 1, '6892099d-1a17-4ed7-b21c-012eb78d70f9', 'Mon Tesiorna', '09123456789', 0, 'Need', 'Information Technology', 'Pcs', 'MV', 'Need', 'Mon Tesiorna', '[{\"qty\":1,\"quantity\":1,\"unit\":\"unit\",\"item\":\"Ballpen\",\"particular\":\"Ballpen\",\"description\":\"Pen\",\"remarks\":null,\"type\":\"supply\",\"source_type\":\"supply\",\"source_id\":7,\"workflow_destination\":\"supplies_inventory_release\",\"availability_status\":\"Available\",\"unit_price\":10,\"unitPrice\":10,\"amount\":10,\"estimated_cost\":10,\"preferred_custodian\":null,\"expected_usage\":null,\"location\":null,\"expected_return_date\":null}]', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-19 02:20:08', 'RR-2026-000005', 'release-receipts/receipt-56.html', '2026-08-19 20:12:21', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-19 01:15:51', '2026-08-19 20:12:21', 'walk-in-approval-documents/J4EWDbLbWmwOaa7PbI9mPHAytNYJOFICl82Op6r2.jpg', 'verified', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-19 02:15:13', NULL),
(57, 'REQ-2026-000007', NULL, 3, NULL, 0, 'released', 'normal', 10.00, '2026-08-19', NULL, 'supplies_inventory_release', '[{\"stage\":\"Submitted\",\"status\":\"submitted\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-19T09:34:52+00:00\"},{\"stage\":\"Department Head Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Recommending Approver Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"President Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Property Custodian Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Completed\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Walk-in Approval Document Verification\",\"status\":\"verified\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"notes\":null,\"timestamp\":\"2026-08-19T11:27:30+00:00\"},{\"stage\":\"Released\",\"status\":\"released\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-20T02:29:37+00:00\"}]', NULL, NULL, 'released', 'request', 1, '6892099d-1a17-4ed7-b21c-012eb78d70f9', 'Almond Gugulan', '09123456789', 0, 'Need', 'Clinic', 'Pcs', 'MV', 'Need', 'Almond Gugulan', '[{\"qty\":1,\"quantity\":1,\"unit\":\"unit\",\"item\":\"Ballpen\",\"particular\":\"Ballpen\",\"description\":\"Ballpen\",\"remarks\":null,\"type\":\"supply\",\"source_type\":\"supply\",\"source_id\":7,\"workflow_destination\":\"supplies_inventory_release\",\"availability_status\":\"Available\",\"unit_price\":10,\"unitPrice\":10,\"amount\":10,\"estimated_cost\":10,\"preferred_custodian\":null,\"expected_usage\":null,\"location\":null,\"expected_return_date\":null}]', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-19 18:29:37', 'RR-2026-000007', 'release-receipts/receipt-57.html', '2026-08-19 19:32:38', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-19 01:34:52', '2026-08-19 19:32:38', 'walk-in-approval-documents/E1fWxlrvBZaymCkukv3BHtMjY2sUoondFTZdCXAX.jpg', 'verified', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-19 03:27:30', NULL),
(58, 'REQ-2026-000008', 'd2313059-00af-458d-af1c-412da9de90ac', 12, NULL, 0, 'released', 'normal', 200.00, '2026-08-20', NULL, 'supplies_inventory_release', '[{\"stage\":\"Submitted\",\"status\":\"submitted\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-20T07:34:32+00:00\"},{\"stage\":\"Department Head Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Recommending Approver Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"President Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Property Custodian Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Completed\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Walk-in Approval Document Verification\",\"status\":\"verified\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"notes\":null,\"timestamp\":\"2026-08-20T07:35:26+00:00\"},{\"stage\":\"Released\",\"status\":\"released\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-20T07:35:51+00:00\"}]', NULL, NULL, 'released', 'request', 1, '6892099d-1a17-4ed7-b21c-012eb78d70f9', NULL, NULL, 1, 'g', 'Logistics', 'Pcs', 'MV', 'need', NULL, '[{\"qty\":20,\"quantity\":20,\"unit\":\"unit\",\"item\":\"Ballpen\",\"particular\":\"Ballpen\",\"description\":\"Pen\",\"remarks\":null,\"type\":\"supply\",\"source_type\":\"supply\",\"source_id\":7,\"workflow_destination\":\"supplies_inventory_release\",\"availability_status\":\"Available\",\"unit_price\":10,\"unitPrice\":10,\"amount\":200,\"estimated_cost\":200,\"preferred_custodian\":null,\"expected_usage\":null,\"location\":null,\"expected_return_date\":null}]', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-19 23:35:51', 'RR-2026-000008', 'release-receipts/receipt-58.html', '2026-08-19 23:37:26', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-19 23:34:32', '2026-08-19 23:37:26', 'walk-in-approval-documents/UbowMRmrC1JrYmwLX4Kd1kkRpvRmQQqoPCXNyNzK.jpg', 'verified', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-19 23:35:26', NULL),
(59, 'REQ-2026-000009', 'd2313059-00af-458d-af1c-412da9de90ac', 12, NULL, 0, 'released', 'normal', 110.00, '2026-08-20', NULL, 'supplies_inventory_release', '[{\"stage\":\"Submitted\",\"status\":\"submitted\",\"performed_by\":\"d2313059-00af-458d-af1c-412da9de90ac\",\"timestamp\":\"2026-08-20T07:45:53+00:00\"},{\"stage\":\"Department Head Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Recommending Approver Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"President Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Property Custodian Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Completed\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Department Head\",\"status\":\"approved\",\"performed_by\":\"7bc16cac-8257-4bb0-abe2-d6574a4fdbb3\",\"timestamp\":\"2026-08-20T07:50:25+00:00\"},{\"stage\":\"Recommending Approver\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Recommending Approver\",\"status\":\"approved\",\"performed_by\":\"7c902fba-312e-43d4-997b-4ef5427e3608\",\"timestamp\":\"2026-08-20T07:52:29+00:00\"},{\"stage\":\"President \\/ CEO\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"President \\/ CEO\",\"status\":\"approved\",\"performed_by\":\"10683af1-db9b-4d55-8250-bd5d52121428\",\"timestamp\":\"2026-08-20T08:01:44+00:00\"},{\"stage\":\"Processing \\/ Release\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Released\",\"status\":\"released\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-20T08:03:49+00:00\"}]', NULL, NULL, 'released', 'request', 0, NULL, NULL, NULL, 0, NULL, 'Logistics', NULL, 'mv', 'shortage', 'Requester Account', '[{\"qty\":11,\"quantity\":11,\"unit\":\"pcs\",\"item\":\"Ballpen\",\"particular\":\"Ballpen\",\"description\":\"Pen\",\"remarks\":null,\"type\":\"supply\",\"source_type\":\"supply\",\"source_id\":7,\"workflow_destination\":\"supplies_inventory_release\",\"availability_status\":\"Available\",\"unit_price\":10,\"unitPrice\":10,\"amount\":110,\"estimated_cost\":110,\"preferred_custodian\":null,\"expected_usage\":null,\"location\":null,\"expected_return_date\":null}]', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-20 00:03:49', 'RR-2026-000009', 'release-receipts/receipt-59.html', '2026-08-20 00:04:11', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-19 23:45:53', '2026-08-20 00:04:11', NULL, 'not_required', NULL, NULL, NULL),
(60, 'REQ-2026-000010', 'd2313059-00af-458d-af1c-412da9de90ac', 12, NULL, 0, 'released', 'normal', 42500.00, '2026-08-20', NULL, 'asset_assignment', '[{\"stage\":\"Submitted\",\"status\":\"submitted\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-20T10:07:14+00:00\"},{\"stage\":\"Department Head Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Recommending Approver Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"President Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Property Custodian Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Completed\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Walk-in Approval Document Verification\",\"status\":\"verified\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"notes\":null,\"timestamp\":\"2026-08-20T10:07:33+00:00\"},{\"stage\":\"Released\",\"status\":\"released\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-20T10:07:54+00:00\"}]', NULL, NULL, 'released', 'request', 1, '6892099d-1a17-4ed7-b21c-012eb78d70f9', NULL, NULL, 1, 'Approved', 'Logistics', 'unit', 'MV', 'Need', NULL, '[{\"qty\":1,\"quantity\":1,\"unit\":\"unit\",\"item\":\"Dell OptiPlex 7010 Desktop Computer\",\"particular\":\"Dell OptiPlex 7010 Desktop Computer\",\"description\":\"Desktop computer assigned to the Information\",\"remarks\":\"Need\",\"type\":\"asset\",\"source_type\":\"asset\",\"source_id\":41,\"workflow_destination\":\"asset_assignment\",\"availability_status\":\"Available\",\"unit_price\":42500,\"unitPrice\":42500,\"amount\":42500,\"estimated_cost\":42500,\"preferred_custodian\":null,\"expected_usage\":null,\"location\":null,\"expected_return_date\":null}]', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-20 02:07:54', 'RR-2026-000010', 'release-receipts/receipt-60.html', '2026-08-20 02:24:28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-20 02:07:14', '2026-08-20 02:24:28', 'walk-in-approval-documents/eEoNwPHAo2LsNpx5pGdglnP7kNfbtshBHnKxIDcY.jpg', 'verified', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-20 02:07:33', NULL),
(61, 'REQ-2026-000011', 'd2313059-00af-458d-af1c-412da9de90ac', 12, NULL, 0, 'released', 'normal', 42500.00, '2026-08-20', NULL, 'asset_assignment', '[{\"stage\":\"Submitted\",\"status\":\"submitted\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-20T11:17:10+00:00\"},{\"stage\":\"Department Head Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Recommending Approver Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"President Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Property Custodian Review\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Completed\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Walk-in Approval Document Verification\",\"status\":\"verified\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"notes\":null,\"timestamp\":\"2026-08-20T11:17:51+00:00\"},{\"stage\":\"Released\",\"status\":\"released\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-20T11:18:09+00:00\"}]', NULL, NULL, 'released', 'request', 1, '6892099d-1a17-4ed7-b21c-012eb78d70f9', NULL, NULL, 1, 'need', 'Logistics', 'unit', 'MV', 'need', NULL, '[{\"qty\":1,\"quantity\":1,\"unit\":\"unit\",\"item\":\"Dell OptiPlex 7010 Desktop Computer\",\"particular\":\"Dell OptiPlex 7010 Desktop Computer\",\"description\":\"Desktop computer assigned to the Information\",\"remarks\":null,\"type\":\"asset\",\"source_type\":\"asset\",\"source_id\":41,\"workflow_destination\":\"asset_assignment\",\"availability_status\":\"Available\",\"unit_price\":42500,\"unitPrice\":42500,\"amount\":42500,\"estimated_cost\":42500,\"preferred_custodian\":null,\"expected_usage\":null,\"location\":null,\"expected_return_date\":null}]', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-20 03:18:09', 'RR-2026-000011', 'release-receipts/receipt-61.html', '2026-08-20 05:25:45', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-20 03:17:10', '2026-08-20 05:25:45', 'walk-in-approval-documents/haPDPfsIuFPSiSxoqZDocytFyCV3tsk3G0XE7KE6.jpg', 'verified', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-20 03:17:51', NULL),
(62, 'REQ-2026-000012', 'd2313059-00af-458d-af1c-412da9de90ac', 12, NULL, 0, 'released', 'normal', 120.00, '2026-08-21', NULL, 'supplies_inventory_release', '[{\"stage\":\"Submitted\",\"status\":\"submitted\",\"performed_by\":\"d2313059-00af-458d-af1c-412da9de90ac\",\"timestamp\":\"2026-08-20T23:10:20+00:00\"},{\"stage\":\"Department Head\",\"status\":\"approved\",\"timestamp\":\"2026-08-20T23:17:58+00:00\",\"performed_by\":\"7bc16cac-8257-4bb0-abe2-d6574a4fdbb3\"},{\"stage\":\"Recommending Approver\",\"status\":\"approved\",\"timestamp\":\"2026-08-20T23:32:00+00:00\",\"performed_by\":\"7c902fba-312e-43d4-997b-4ef5427e3608\"},{\"stage\":\"OIC\",\"status\":\"approved\",\"timestamp\":\"2026-08-20T23:57:41+00:00\",\"performed_by\":\"b70f00b0-cb25-4859-a7f7-18a4d16f51c2\"},{\"stage\":\"PPMO Staff \\u2014 Processing \\/ Release\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Released\",\"status\":\"released\",\"timestamp\":\"2026-08-21T04:30:28+00:00\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\"}]', NULL, NULL, 'released', 'request', 0, NULL, NULL, NULL, 0, NULL, 'Logistics', NULL, 'MV', 'Need', 'Requester Account', '[{\"qty\":10,\"quantity\":10,\"unit\":\"pcs\",\"item\":\"Ballpen\",\"particular\":\"Ballpen\",\"description\":\"Pen\",\"remarks\":null,\"type\":\"supply\",\"source_type\":\"supply\",\"source_id\":7,\"workflow_destination\":\"supplies_inventory_release\",\"availability_status\":\"Available\",\"unit_price\":10,\"unitPrice\":10,\"amount\":100,\"estimated_cost\":100,\"preferred_custodian\":null,\"expected_usage\":null,\"location\":null,\"expected_return_date\":null},{\"qty\":1,\"quantity\":1,\"unit\":\"pcs\",\"item\":\"Ruler\",\"particular\":\"Ruler\",\"description\":\"Measuring Tool\",\"remarks\":null,\"type\":\"supply\",\"source_type\":\"supply\",\"source_id\":39,\"workflow_destination\":\"supplies_inventory_release\",\"availability_status\":\"Low Stock\",\"unit_price\":20,\"unitPrice\":20,\"amount\":20,\"estimated_cost\":20,\"preferred_custodian\":null,\"expected_usage\":null,\"location\":null,\"expected_return_date\":null}]', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-20 20:30:28', 'RR-2026-000012', 'release-receipts/receipt-62.html', '2026-08-20 20:30:46', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-20 15:10:20', '2026-08-20 20:30:46', NULL, 'not_required', NULL, NULL, NULL),
(63, 'REQ-2026-000013', 'd2313059-00af-458d-af1c-412da9de90ac', 12, NULL, 0, 'released', 'normal', 42500.00, '2026-08-21', NULL, 'asset_assignment', '[{\"stage\":\"Submitted\",\"status\":\"submitted\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"timestamp\":\"2026-08-21T14:55:02+00:00\"},{\"stage\":\"Department Head\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Recommending Approver\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"OIC\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"PPMO Staff \\u2014 Processing \\/ Release\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Released\",\"status\":\"released\",\"timestamp\":\"2026-08-21T15:04:03+00:00\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\"},{\"stage\":\"Walk-in Approval Document Verification\",\"status\":\"verified\",\"performed_by\":\"6892099d-1a17-4ed7-b21c-012eb78d70f9\",\"notes\":null,\"timestamp\":\"2026-08-21T14:55:49+00:00\"}]', NULL, NULL, 'released', 'request', 1, '6892099d-1a17-4ed7-b21c-012eb78d70f9', NULL, NULL, 1, 'G', 'Logistics', 'unit', 'MV', 'need', NULL, '[{\"qty\":1,\"quantity\":1,\"unit\":\"unit\",\"item\":\"Dell OptiPlex 7010 Desktop Computer\",\"particular\":\"Dell OptiPlex 7010 Desktop Computer\",\"description\":\"Desktop computer assigned to the Information\",\"remarks\":null,\"type\":\"asset\",\"source_type\":\"asset\",\"source_id\":41,\"workflow_destination\":\"asset_assignment\",\"availability_status\":\"Available\",\"unit_price\":42500,\"unitPrice\":42500,\"amount\":42500,\"estimated_cost\":42500,\"preferred_custodian\":null,\"expected_usage\":null,\"location\":null,\"expected_return_date\":null}]', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-21 07:04:03', 'RR-2026-000013', 'release-receipts/receipt-63.html', '2026-08-21 07:04:06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-21 06:55:02', '2026-08-21 07:04:06', 'walk-in-approval-documents/U9BjQOjjtvNfhsybii3YOXujCNjmsxBhdRclYRBc.jpg', 'verified', '6892099d-1a17-4ed7-b21c-012eb78d70f9', '2026-08-21 06:55:49', NULL),
(64, 'REQ-2026-000014', 'd2313059-00af-458d-af1c-412da9de90ac', 12, NULL, 0, 'department_head', 'normal', 10.00, '2026-08-23', NULL, 'supplies_inventory_release', '[{\"stage\":\"Submitted\",\"status\":\"submitted\",\"performed_by\":\"d2313059-00af-458d-af1c-412da9de90ac\",\"timestamp\":\"2026-08-23T15:56:04+00:00\"},{\"stage\":\"Department Head\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Recommending Approver\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"OIC\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"PPMO Staff \\u2014 Processing \\/ Release\",\"status\":\"pending\",\"timestamp\":null},{\"stage\":\"Released\",\"status\":\"pending\",\"timestamp\":null}]', NULL, NULL, 'pending', 'request', 0, NULL, NULL, NULL, 0, NULL, 'Logistics', NULL, 'MV', 'Need', 'Requester Account', '[{\"qty\":1,\"quantity\":1,\"unit\":\"pcs\",\"item\":\"Ballpen\",\"particular\":\"Ballpen\",\"description\":\"Pen\",\"remarks\":null,\"type\":\"supply\",\"source_type\":\"supply\",\"source_id\":7,\"workflow_destination\":\"supplies_inventory_release\",\"availability_status\":\"Available\",\"unit_price\":10,\"unitPrice\":10,\"amount\":10,\"estimated_cost\":10,\"preferred_custodian\":null,\"expected_usage\":null,\"location\":null,\"expected_return_date\":null}]', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-23 07:56:04', '2026-08-23 07:56:04', NULL, 'not_required', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `return_records`
--

CREATE TABLE `return_records` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `assignment_id` bigint(20) UNSIGNED NOT NULL,
  `asset_id` bigint(20) UNSIGNED NOT NULL,
  `returned_by` char(36) DEFAULT NULL,
  `condition_after` varchar(40) NOT NULL,
  `inspection_notes` text DEFAULT NULL,
  `status` varchar(40) NOT NULL DEFAULT 'completed',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `return_records`
--

INSERT INTO `return_records` (`id`, `assignment_id`, `asset_id`, `returned_by`, `condition_after`, `inspection_notes`, `status`, `created_at`, `updated_at`) VALUES
(3, 23, 43, 'd2313059-00af-458d-af1c-412da9de90ac', 'good', NULL, 'completed', '2026-08-24 08:39:43', '2026-08-24 08:39:43');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('490EFYDE6HHjBe9XnZ0T8nksTI1J2tYDconeTUnY', 'd2313059-00af-458d-af1c-412da9de90ac', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoiTlRFWkxMU095NnNUU1BLQ1BNNGROdG0zejFnTzhuUEgyOFVrU0ZDaSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO3M6MzY6ImQyMzEzMDU5LTAwYWYtNDU4ZC1hZjFjLTQxMmRhOWRlOTBhYyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjU6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9hcGkvcmVxdWVzdGVyL3RyYW5zZmVycz9taW5lPTEmcGVyX3BhZ2U9MjAwIjtzOjU6InJvdXRlIjtOO319', 1787738865),
('c2SnWaPzK470TeOh3cP2bAVsNitBOZvsSsZT1PUy', 'e06f30bb-0629-4484-859d-f2129c192310', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoiOWl3aENxUFlvUHBaTHNjOWRPcW84anJKTENMUnVpaU9ST3UyNkEwdCI7czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO3M6MzY6ImUwNmYzMGJiLTA2MjktNDQ4NC04NTlkLWYyMTI5YzE5MjMxMCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mzk6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9hcGkvbm90aWZpY2F0aW9ucyI7czo1OiJyb3V0ZSI7Tjt9fQ==', 1787738861);

-- --------------------------------------------------------

--
-- Table structure for table `stock_movements`
--

CREATE TABLE `stock_movements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `supply_id` bigint(20) UNSIGNED DEFAULT NULL,
  `movement_type` varchar(40) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `requested_by` char(36) DEFAULT NULL,
  `issued_by` char(36) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `status` varchar(40) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stock_movements`
--

INSERT INTO `stock_movements` (`id`, `supply_id`, `movement_type`, `quantity`, `department_id`, `requested_by`, `issued_by`, `notes`, `payload`, `status`, `created_at`, `updated_at`) VALUES
(7, 7, 'in', 100, NULL, 'e06f30bb-0629-4484-859d-f2129c192310', 'e06f30bb-0629-4484-859d-f2129c192310', NULL, NULL, 'active', '2026-07-23 09:11:07', NULL),
(8, 7, 'in', 100, NULL, 'e06f30bb-0629-4484-859d-f2129c192310', 'e06f30bb-0629-4484-859d-f2129c192310', NULL, NULL, 'active', '2026-07-23 09:11:10', NULL),
(9, 7, 'out', 50, NULL, 'e06f30bb-0629-4484-859d-f2129c192310', 'e06f30bb-0629-4484-859d-f2129c192310', NULL, NULL, 'active', '2026-07-23 09:11:26', NULL),
(10, 7, 'in', 500, NULL, 'e06f30bb-0629-4484-859d-f2129c192310', 'e06f30bb-0629-4484-859d-f2129c192310', NULL, NULL, 'active', '2026-07-23 09:11:55', NULL),
(89, 7, 'out', 1, 12, 'd2313059-00af-458d-af1c-412da9de90ac', '6892099d-1a17-4ed7-b21c-012eb78d70f9', 'Released through REQ-2026-000003.', NULL, 'active', '2026-08-17 15:29:11', NULL),
(90, 7, 'out', 10, 12, 'd2313059-00af-458d-af1c-412da9de90ac', '6892099d-1a17-4ed7-b21c-012eb78d70f9', 'Released through REQ-2026-000002.', NULL, 'active', '2026-08-17 15:40:50', NULL),
(91, 7, 'out', 11, 12, 'd2313059-00af-458d-af1c-412da9de90ac', '6892099d-1a17-4ed7-b21c-012eb78d70f9', 'Released through REQ-2026-000004.', NULL, 'active', '2026-08-17 16:22:20', NULL),
(92, 7, 'out', 1, 1, NULL, '6892099d-1a17-4ed7-b21c-012eb78d70f9', 'Released through REQ-2026-000006.', NULL, 'active', '2026-08-19 02:20:07', NULL),
(93, 7, 'out', 1, 3, NULL, '6892099d-1a17-4ed7-b21c-012eb78d70f9', 'Released through REQ-2026-000005.', NULL, 'active', '2026-08-19 02:20:25', NULL),
(94, 7, 'out', 1, 3, NULL, '6892099d-1a17-4ed7-b21c-012eb78d70f9', 'Released through REQ-2026-000007.', NULL, 'active', '2026-08-19 18:29:36', NULL),
(95, 7, 'out', 20, 12, 'd2313059-00af-458d-af1c-412da9de90ac', '6892099d-1a17-4ed7-b21c-012eb78d70f9', 'Released through REQ-2026-000008.', NULL, 'active', '2026-08-19 23:35:48', NULL),
(96, 7, 'out', 11, 12, 'd2313059-00af-458d-af1c-412da9de90ac', '6892099d-1a17-4ed7-b21c-012eb78d70f9', 'Released through REQ-2026-000009.', NULL, 'active', '2026-08-20 00:03:48', NULL),
(97, 7, 'out', 10, 12, 'd2313059-00af-458d-af1c-412da9de90ac', '6892099d-1a17-4ed7-b21c-012eb78d70f9', 'Released through REQ-2026-000012.', NULL, 'active', '2026-08-20 20:30:26', NULL),
(98, 39, 'out', 1, 12, 'd2313059-00af-458d-af1c-412da9de90ac', '6892099d-1a17-4ed7-b21c-012eb78d70f9', 'Released through REQ-2026-000012.', NULL, 'active', '2026-08-20 20:30:28', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(180) NOT NULL,
  `contact_person` varchar(120) DEFAULT NULL,
  `email` varchar(160) DEFAULT NULL,
  `phone` varchar(80) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `supplies`
--

CREATE TABLE `supplies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `sku` varchar(40) DEFAULT NULL,
  `name` varchar(160) DEFAULT NULL,
  `unit` varchar(40) NOT NULL DEFAULT 'pieces',
  `category` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `minimum_stock` int(11) NOT NULL DEFAULT 0,
  `unit_price` decimal(14,2) NOT NULL DEFAULT 0.00,
  `expiration_date` date DEFAULT NULL,
  `supplier_id` bigint(20) UNSIGNED DEFAULT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `status` varchar(40) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `supplies`
--

INSERT INTO `supplies` (`id`, `sku`, `name`, `unit`, `category`, `description`, `stock`, `minimum_stock`, `unit_price`, `expiration_date`, `supplier_id`, `department_id`, `payload`, `status`, `created_at`, `updated_at`) VALUES
(7, 'SSP-10024396', 'Ballpen', 'pieces', 'Pen', NULL, 784, 500, 10.00, NULL, NULL, NULL, NULL, 'active', '2026-07-23 08:56:02', '2026-08-20 20:30:26'),
(39, 'SSP-10024395', 'Ruler', 'pieces', 'Measuring Tool', NULL, 499, 500, 20.00, NULL, NULL, NULL, NULL, 'active', '2026-08-20 01:38:21', '2026-08-20 20:30:28');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transfer_history`
--

CREATE TABLE `transfer_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `transfer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `asset_id` bigint(20) UNSIGNED DEFAULT NULL,
  `transfer_number` varchar(40) DEFAULT NULL,
  `event_type` varchar(60) NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `performed_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transfer_notifications`
--

CREATE TABLE `transfer_notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `transfer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `anomaly_alert_id` bigint(20) UNSIGNED DEFAULT NULL,
  `recipient_id` char(36) DEFAULT NULL,
  `recipient_role` varchar(80) DEFAULT NULL,
  `type` varchar(60) NOT NULL,
  `title` varchar(180) NOT NULL,
  `message` text DEFAULT NULL,
  `navigation_target` varchar(255) DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `employee_id` varchar(255) DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'Department User',
  `department` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `employee_id`, `first_name`, `middle_name`, `last_name`, `full_name`, `email`, `password_hash`, `role`, `department`, `status`, `remember_token`, `created_at`, `updated_at`) VALUES
('10683af1-db9b-4d55-8250-bd5d52121428', 'CEO-001', 'System', NULL, 'CEO', 'System CEO', 'ceo@pcms.test', '$2y$12$tBV7.LFpqPIAedvIhkGUjedqkrwyQV6Tu.4GZ6mn6LIhUHTe.dSC.', 'CEO', NULL, 'active', NULL, '2026-08-07 07:56:12', '2026-08-07 17:22:59'),
('6892099d-1a17-4ed7-b21c-012eb78d70f9', 'PPMO-001', 'PPMO', NULL, 'Staff', 'PPMO Staff', 'ppmostaff@pcms.test', '$2y$12$RZgHsAkSVTTlXCAT8bFuZu8hiRD8j5QBAiFspM.fbPfyoI1G7njFW', 'PPMO Staff', NULL, 'active', NULL, '2026-08-07 17:23:00', '2026-08-07 17:23:00'),
('6dc4be3e-42d7-49a3-af6e-dbe96f353a3d', NULL, 'Head', 'ng', 'Clinic', 'Head ng Clinic', 'Clinichead@gmail.com', '$2y$12$NjA4PYWyvmD4JzwAZTtf7.QBmRleC4WqeNSteGG9XlPkydsAiJTcK', 'Department Head', 'Clinic', 'active', NULL, '2026-08-23 07:44:55', '2026-08-23 07:44:55'),
('7bc16cac-8257-4bb0-abe2-d6574a4fdbb3', 'HEAD-LOG-001', 'Logistics', NULL, 'Department Head', 'Department Head Account', 'depthead@pcms.test', '$2y$12$pzZhoZI0SFuXWa/5wC.LQOPeyIzLGcfyOCfxV4pALJhod3pK6VikO', 'Department Head', 'Logistics', 'active', NULL, '2026-07-20 18:34:08', '2026-08-07 17:22:57'),
('7c902fba-312e-43d4-997b-4ef5427e3608', 'REC-001', 'Recommending', NULL, 'Approver', 'Recommending Approver', 'recommender@pcms.test', '$2y$12$yxqJ7XzL2PYvhQ.YnwUUeuDMe8O50qTjedkQsqTy1SpyqNbsD7oKe', 'Recommending Approver', NULL, 'active', NULL, '2026-08-07 17:22:59', '2026-08-07 17:22:59'),
('b70f00b0-cb25-4859-a7f7-18a4d16f51c2', 'OIC-001', 'System', NULL, 'OIC', 'System OIC', 'oic@pcms.test', '$2y$12$RZACP1oqtjfyimlKj0JIeew9IMxnxHoLPrsm/HZuZZkzl/ULdVhKK', 'OIC', NULL, 'active', NULL, '2026-08-07 07:56:10', '2026-08-07 17:22:57'),
('ba8393c9-d2d0-4597-b3ff-9e99d1961bed', 'PRES-001', 'System', NULL, 'President', 'System President', 'president@pcms.test', '$2y$12$PZavoC8qXff.9Vxiut0VQ.ijQuZzCqDyOU/oaGKC59jd5hjl7.Ut2', 'President', NULL, 'active', NULL, '2026-08-07 07:56:11', '2026-08-07 17:22:58'),
('bf353288-022a-49de-b1e7-954201ef7fcd', NULL, 'Almond', 'Pogi', 'Gugulan', 'Almond Pogi Gugulan', 'Clinic@gmail.com', '$2y$12$GrF61tHQWz69hdP5G65gk.xQHPWCtO33oDIWEojThn76WBYTprewG', 'Requester', 'Clinic', 'active', NULL, '2026-08-23 07:43:20', '2026-08-23 07:43:20'),
('d2313059-00af-458d-af1c-412da9de90ac', 'REQ-LOG-001', 'Logistics', NULL, 'Requester', 'Requester Account', 'requester@pcms.test', '$2y$12$uODAWokerBdIssyTBxlRA.44zb5G1PX4E9EypbUG9c5Ncix/UWQCS', 'Requester', 'Logistics', 'active', NULL, '2026-07-20 18:34:07', '2026-08-07 17:22:56'),
('e06f30bb-0629-4484-859d-f2129c192310', 'ADMIN', 'System', NULL, 'Administrator', 'System Administrator', 'admin@pcms.com', '$2y$12$CwTM7Z/6gIIklgTe4NlGteCUqYU0FvexNfTdVhhksJiDMrWqSOXDm', 'System Administrator', NULL, 'active', NULL, '2026-07-17 20:14:04', '2026-08-07 17:22:55');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accountability_forms`
--
ALTER TABLE `accountability_forms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `accountability_forms_form_number_unique` (`form_number`),
  ADD KEY `accountability_forms_assignment_id_foreign` (`assignment_id`);

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_logs_status_index` (`status`),
  ADD KEY `activity_logs_action_index` (`action`);

--
-- Indexes for table `anomaly_alerts`
--
ALTER TABLE `anomaly_alerts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `anomaly_alerts_status_index` (`status`),
  ADD KEY `anomaly_alerts_found_department_id_foreign` (`found_department_id`);

--
-- Indexes for table `assets`
--
ALTER TABLE `assets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `assets_asset_id_unique` (`asset_id`),
  ADD UNIQUE KEY `assets_property_number_unique` (`property_number`),
  ADD KEY `assets_category_id_foreign` (`category_id`),
  ADD KEY `assets_department_id_foreign` (`department_id`),
  ADD KEY `assets_supplier_id_foreign` (`supplier_id`),
  ADD KEY `assets_condition_index` (`condition`),
  ADD KEY `assets_status_index` (`status`),
  ADD KEY `assets_purchase_request_id_foreign` (`purchase_request_id`);

--
-- Indexes for table `asset_assignments`
--
ALTER TABLE `asset_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `asset_assignments_status_index` (`status`),
  ADD KEY `asset_assignments_asset_id_foreign` (`asset_id`),
  ADD KEY `asset_assignments_department_id_foreign` (`department_id`),
  ADD KEY `asset_assignments_asset_unit_id_foreign` (`asset_unit_id`);

--
-- Indexes for table `asset_categories`
--
ALTER TABLE `asset_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `asset_categories_code_unique` (`code`);

--
-- Indexes for table `asset_transfers`
--
ALTER TABLE `asset_transfers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `asset_transfers_transfer_number_unique` (`transfer_number`),
  ADD KEY `asset_transfers_status_index` (`status`),
  ADD KEY `asset_transfers_asset_id_foreign` (`asset_id`),
  ADD KEY `asset_transfers_from_department_id_foreign` (`from_department_id`),
  ADD KEY `asset_transfers_to_department_id_foreign` (`to_department_id`),
  ADD KEY `asset_transfers_asset_unit_id_foreign` (`asset_unit_id`);

--
-- Indexes for table `asset_units`
--
ALTER TABLE `asset_units`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `asset_units_unit_code_unique` (`unit_code`),
  ADD KEY `asset_units_asset_id_status_index` (`asset_id`,`status`),
  ADD KEY `asset_units_department_id_custodian_id_index` (`department_id`,`custodian_id`);

--
-- Indexes for table `asset_unit_movements`
--
ALTER TABLE `asset_unit_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `asset_unit_movements_from_department_id_foreign` (`from_department_id`),
  ADD KEY `asset_unit_movements_to_department_id_foreign` (`to_department_id`),
  ADD KEY `asset_unit_movements_asset_unit_id_movement_type_index` (`asset_unit_id`,`movement_type`),
  ADD KEY `asset_unit_movements_asset_id_created_at_index` (`asset_id`,`created_at`);

--
-- Indexes for table `assignment_history`
--
ALTER TABLE `assignment_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `assignment_history_assignment_id_foreign` (`assignment_id`),
  ADD KEY `assignment_history_asset_id_foreign` (`asset_id`);

--
-- Indexes for table `assignment_notifications`
--
ALTER TABLE `assignment_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `assignment_notifications_assignment_id_foreign` (`assignment_id`),
  ADD KEY `assignment_notifications_asset_id_foreign` (`asset_id`);

--
-- Indexes for table `audit_scans`
--
ALTER TABLE `audit_scans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_scans_audit_id_foreign` (`audit_id`),
  ADD KEY `audit_scans_asset_id_foreign` (`asset_id`),
  ADD KEY `audit_scans_found_department_id_foreign` (`found_department_id`),
  ADD KEY `audit_scans_ocr_scan_id_foreign` (`ocr_scan_id`);

--
-- Indexes for table `clearance_requests`
--
ALTER TABLE `clearance_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `damage_reports`
--
ALTER TABLE `damage_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `damage_reports_status_index` (`status`),
  ADD KEY `damage_reports_asset_id_foreign` (`asset_id`),
  ADD KEY `damage_reports_department_id_foreign` (`department_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `departments_code_unique` (`code`);

--
-- Indexes for table `gate_passes`
--
ALTER TABLE `gate_passes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `gate_passes_status_index` (`status`),
  ADD KEY `gate_passes_department_id_foreign` (`department_id`);

--
-- Indexes for table `maintenance_records`
--
ALTER TABLE `maintenance_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `maintenance_records_asset_id_foreign` (`asset_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ocr_scans`
--
ALTER TABLE `ocr_scans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ocr_scans_status_index` (`status`),
  ADD KEY `ocr_scans_asset_id_foreign` (`asset_id`);

--
-- Indexes for table `physical_audits`
--
ALTER TABLE `physical_audits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `physical_audits_status_index` (`status`),
  ADD KEY `physical_audits_department_id_foreign` (`department_id`);

--
-- Indexes for table `purchase_requests`
--
ALTER TABLE `purchase_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_requests_status_index` (`status`),
  ADD KEY `purchase_requests_replenishment_supply_id_foreign` (`replenishment_supply_id`);

--
-- Indexes for table `return_records`
--
ALTER TABLE `return_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `return_records_assignment_id_foreign` (`assignment_id`),
  ADD KEY `return_records_asset_id_foreign` (`asset_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_movements_status_index` (`status`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `supplies`
--
ALTER TABLE `supplies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `supplies_sku_unique` (`sku`),
  ADD KEY `supplies_status_index` (`status`),
  ADD KEY `supplies_supplier_id_foreign` (`supplier_id`),
  ADD KEY `supplies_department_id_foreign` (`department_id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `system_settings_key_unique` (`key`);

--
-- Indexes for table `transfer_history`
--
ALTER TABLE `transfer_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transfer_history_transfer_id_foreign` (`transfer_id`),
  ADD KEY `transfer_history_asset_id_foreign` (`asset_id`);

--
-- Indexes for table `transfer_notifications`
--
ALTER TABLE `transfer_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transfer_notifications_transfer_id_foreign` (`transfer_id`),
  ADD KEY `transfer_notifications_anomaly_alert_id_foreign` (`anomaly_alert_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_employee_id_index` (`employee_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accountability_forms`
--
ALTER TABLE `accountability_forms`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=185;

--
-- AUTO_INCREMENT for table `anomaly_alerts`
--
ALTER TABLE `anomaly_alerts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `assets`
--
ALTER TABLE `assets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `asset_assignments`
--
ALTER TABLE `asset_assignments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `asset_categories`
--
ALTER TABLE `asset_categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `asset_transfers`
--
ALTER TABLE `asset_transfers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `asset_units`
--
ALTER TABLE `asset_units`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `asset_unit_movements`
--
ALTER TABLE `asset_unit_movements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `assignment_history`
--
ALTER TABLE `assignment_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `assignment_notifications`
--
ALTER TABLE `assignment_notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `audit_scans`
--
ALTER TABLE `audit_scans`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `clearance_requests`
--
ALTER TABLE `clearance_requests`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `damage_reports`
--
ALTER TABLE `damage_reports`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `gate_passes`
--
ALTER TABLE `gate_passes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `maintenance_records`
--
ALTER TABLE `maintenance_records`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `ocr_scans`
--
ALTER TABLE `ocr_scans`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT for table `physical_audits`
--
ALTER TABLE `physical_audits`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `purchase_requests`
--
ALTER TABLE `purchase_requests`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `return_records`
--
ALTER TABLE `return_records`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `stock_movements`
--
ALTER TABLE `stock_movements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=99;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `supplies`
--
ALTER TABLE `supplies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transfer_history`
--
ALTER TABLE `transfer_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `transfer_notifications`
--
ALTER TABLE `transfer_notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=166;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `accountability_forms`
--
ALTER TABLE `accountability_forms`
  ADD CONSTRAINT `accountability_forms_assignment_id_foreign` FOREIGN KEY (`assignment_id`) REFERENCES `asset_assignments` (`id`);

--
-- Constraints for table `anomaly_alerts`
--
ALTER TABLE `anomaly_alerts`
  ADD CONSTRAINT `anomaly_alerts_found_department_id_foreign` FOREIGN KEY (`found_department_id`) REFERENCES `departments` (`id`);

--
-- Constraints for table `assets`
--
ALTER TABLE `assets`
  ADD CONSTRAINT `assets_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `asset_categories` (`id`),
  ADD CONSTRAINT `assets_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`),
  ADD CONSTRAINT `assets_purchase_request_id_foreign` FOREIGN KEY (`purchase_request_id`) REFERENCES `purchase_requests` (`id`),
  ADD CONSTRAINT `assets_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`);

--
-- Constraints for table `asset_assignments`
--
ALTER TABLE `asset_assignments`
  ADD CONSTRAINT `asset_assignments_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  ADD CONSTRAINT `asset_assignments_asset_unit_id_foreign` FOREIGN KEY (`asset_unit_id`) REFERENCES `asset_units` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `asset_assignments_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`);

--
-- Constraints for table `asset_transfers`
--
ALTER TABLE `asset_transfers`
  ADD CONSTRAINT `asset_transfers_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  ADD CONSTRAINT `asset_transfers_asset_unit_id_foreign` FOREIGN KEY (`asset_unit_id`) REFERENCES `asset_units` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `asset_transfers_from_department_id_foreign` FOREIGN KEY (`from_department_id`) REFERENCES `departments` (`id`),
  ADD CONSTRAINT `asset_transfers_to_department_id_foreign` FOREIGN KEY (`to_department_id`) REFERENCES `departments` (`id`);

--
-- Constraints for table `asset_units`
--
ALTER TABLE `asset_units`
  ADD CONSTRAINT `asset_units_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `asset_units_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `asset_unit_movements`
--
ALTER TABLE `asset_unit_movements`
  ADD CONSTRAINT `asset_unit_movements_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `asset_unit_movements_asset_unit_id_foreign` FOREIGN KEY (`asset_unit_id`) REFERENCES `asset_units` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `asset_unit_movements_from_department_id_foreign` FOREIGN KEY (`from_department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `asset_unit_movements_to_department_id_foreign` FOREIGN KEY (`to_department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `assignment_history`
--
ALTER TABLE `assignment_history`
  ADD CONSTRAINT `assignment_history_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  ADD CONSTRAINT `assignment_history_assignment_id_foreign` FOREIGN KEY (`assignment_id`) REFERENCES `asset_assignments` (`id`);

--
-- Constraints for table `assignment_notifications`
--
ALTER TABLE `assignment_notifications`
  ADD CONSTRAINT `assignment_notifications_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  ADD CONSTRAINT `assignment_notifications_assignment_id_foreign` FOREIGN KEY (`assignment_id`) REFERENCES `asset_assignments` (`id`);

--
-- Constraints for table `audit_scans`
--
ALTER TABLE `audit_scans`
  ADD CONSTRAINT `audit_scans_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  ADD CONSTRAINT `audit_scans_audit_id_foreign` FOREIGN KEY (`audit_id`) REFERENCES `physical_audits` (`id`),
  ADD CONSTRAINT `audit_scans_found_department_id_foreign` FOREIGN KEY (`found_department_id`) REFERENCES `departments` (`id`),
  ADD CONSTRAINT `audit_scans_ocr_scan_id_foreign` FOREIGN KEY (`ocr_scan_id`) REFERENCES `ocr_scans` (`id`);

--
-- Constraints for table `damage_reports`
--
ALTER TABLE `damage_reports`
  ADD CONSTRAINT `damage_reports_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  ADD CONSTRAINT `damage_reports_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`);

--
-- Constraints for table `gate_passes`
--
ALTER TABLE `gate_passes`
  ADD CONSTRAINT `gate_passes_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`);

--
-- Constraints for table `maintenance_records`
--
ALTER TABLE `maintenance_records`
  ADD CONSTRAINT `maintenance_records_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`);

--
-- Constraints for table `ocr_scans`
--
ALTER TABLE `ocr_scans`
  ADD CONSTRAINT `ocr_scans_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`);

--
-- Constraints for table `physical_audits`
--
ALTER TABLE `physical_audits`
  ADD CONSTRAINT `physical_audits_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`);

--
-- Constraints for table `purchase_requests`
--
ALTER TABLE `purchase_requests`
  ADD CONSTRAINT `purchase_requests_replenishment_supply_id_foreign` FOREIGN KEY (`replenishment_supply_id`) REFERENCES `supplies` (`id`);

--
-- Constraints for table `return_records`
--
ALTER TABLE `return_records`
  ADD CONSTRAINT `return_records_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  ADD CONSTRAINT `return_records_assignment_id_foreign` FOREIGN KEY (`assignment_id`) REFERENCES `asset_assignments` (`id`);

--
-- Constraints for table `supplies`
--
ALTER TABLE `supplies`
  ADD CONSTRAINT `supplies_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`),
  ADD CONSTRAINT `supplies_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`);

--
-- Constraints for table `transfer_history`
--
ALTER TABLE `transfer_history`
  ADD CONSTRAINT `transfer_history_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  ADD CONSTRAINT `transfer_history_transfer_id_foreign` FOREIGN KEY (`transfer_id`) REFERENCES `asset_transfers` (`id`);

--
-- Constraints for table `transfer_notifications`
--
ALTER TABLE `transfer_notifications`
  ADD CONSTRAINT `transfer_notifications_anomaly_alert_id_foreign` FOREIGN KEY (`anomaly_alert_id`) REFERENCES `anomaly_alerts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `transfer_notifications_transfer_id_foreign` FOREIGN KEY (`transfer_id`) REFERENCES `asset_transfers` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
