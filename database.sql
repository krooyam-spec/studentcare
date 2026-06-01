-- --------------------------------------------------------
-- SQL Database Schema for Student Visit System (นร.01 สพฐ. / กสศ.)
-- Compatibility: MySQL 5.7+ / MariaDB 10.2+
-- Collation: utf8mb4_unicode_ci
-- Created on: June 2026
-- --------------------------------------------------------

CREATE DATABASE IF NOT EXISTS `schoolos_studentcare` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `schoolos_studentcare`;

-- 1. Students Table
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` VARCHAR(50) NOT NULL COMMENT 'รหัส ID',
  `student_code` VARCHAR(55) NULL COMMENT 'รหัสนักเรียน',
  `prefix` VARCHAR(30) NULL COMMENT 'คำนำหน้าชื่อ',
  `name` VARCHAR(150) NOT NULL COMMENT 'ชื่อ-นามสกุล',
  `nickname` VARCHAR(50) NOT NULL COMMENT 'ชื่อเล่น',
  `gender` VARCHAR(20) NULL COMMENT 'เพศ',
  `birth_date` VARCHAR(50) NULL COMMENT 'วันเกิด',
  `grade` VARCHAR(30) NOT NULL COMMENT 'ชั้นเรียน เช่น ม.3/2',
  `room` VARCHAR(10) NULL COMMENT 'ห้องเรียน',
  `citizen_id` VARCHAR(30) NULL COMMENT 'เลขบัตรประชาชน',
  `address` TEXT NOT NULL COMMENT 'ที่อยู่เดิม',
  `village` VARCHAR(50) NULL COMMENT 'หมู่',
  `subdistrict` VARCHAR(100) NULL COMMENT 'ตำบล',
  `district` VARCHAR(100) NULL COMMENT 'อำเภอ',
  `province` VARCHAR(100) NULL COMMENT 'จังหวัด',
  `zipcode` VARCHAR(10) NULL COMMENT 'รหัสไปรษณีย์',
  `parent_name` VARCHAR(150) NULL COMMENT 'ชื่อผู้ปกครอง',
  `parent_relation` VARCHAR(100) NULL COMMENT 'ความสัมพันธ์ผู้ปกครอง',
  `parent_phone` VARCHAR(30) NULL COMMENT 'เบอร์โทรผู้ปกครอง',
  `parent_job` VARCHAR(100) NULL COMMENT 'อาชีพผู้ปกครอง',
  `latitude` DOUBLE NULL COMMENT 'ละติจูดพิกัด',
  `longitude` DOUBLE NULL COMMENT 'ลองจิจูดพิกัด',
  `visit_status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'สถานะ: pending, scheduled, visited',
  `risk_level` VARCHAR(20) NOT NULL DEFAULT 'not_assessed' COMMENT 'ระดับความเสี่ยง: normal, medium, high, not_assessed',
  `last_visited_date` VARCHAR(50) NULL COMMENT 'วันที่เดินทางเยี่ยมบ้านล่าสุด',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Home Visit Records Table (แบบบันทึก นร.01)
DROP TABLE IF EXISTS `visit_records`;
CREATE TABLE `visit_records` (
  `id` VARCHAR(50) NOT NULL COMMENT 'รหัสรายงานเยี่ยมบ้าน',
  `student_id` VARCHAR(50) NOT NULL,
  `visited_date` VARCHAR(50) NOT NULL COMMENT 'วันที่เยี่ยมบ้าน',
  `semester` VARCHAR(10) NOT NULL DEFAULT '1' COMMENT 'ภาคเรียน',
  `school_year` VARCHAR(10) NOT NULL DEFAULT '2569' COMMENT 'ปีการศึกษา',
  `visitor_name` VARCHAR(150) NOT NULL COMMENT 'ชื่อครูผู้เยี่ยมบ้าน',
  `informant_name` VARCHAR(150) NOT NULL COMMENT 'ชื่อผู้ให้ข้อมูล',
  `informant_relation` VARCHAR(100) NOT NULL COMMENT 'ความสัมพันธ์ผู้ให้ข้อมูล',
  
  -- สภาพครอบครัวและผู้ปกครอง
  `family_status` VARCHAR(200) NOT NULL COMMENT 'สถานภาพสมรสผู้ปกครอง',
  `living_with` VARCHAR(200) NOT NULL COMMENT 'เด็กอาศัยร่วมกับ',
  `guardian_name` VARCHAR(150) NOT NULL,
  `guardian_relation` VARCHAR(100) NOT NULL,
  `guardian_citizen_id` VARCHAR(50) NOT NULL,
  `guardian_education` VARCHAR(100) NOT NULL,
  `guardian_job` VARCHAR(100) NOT NULL,
  `guardian_phone` VARCHAR(50) NOT NULL,
  `state_welfare` VARCHAR(200) NOT NULL COMMENT 'สิทธิ์สวัสดิการภาครัฐ',
  `total_members` INT NOT NULL DEFAULT 1,
  
  -- สภาพที่อยู่อาศัย / โครงสร้าง
  `house_ownership` VARCHAR(100) NOT NULL,
  `monthly_rent` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `floor_material` VARCHAR(100) NOT NULL,
  `wall_material` VARCHAR(100) NOT NULL,
  `roof_material` VARCHAR(100) NOT NULL,
  `has_toilet` VARCHAR(50) NOT NULL COMMENT 'ห้องน้ำในบ้าน',
  `farm_land` DOUBLE NOT NULL DEFAULT 0,
  `water_source` VARCHAR(100) NOT NULL,
  `electricity` VARCHAR(100) NOT NULL,
  `vehicles` VARCHAR(255) NOT NULL,
  
  -- การเดินทางไปโรงเรียน
  `travel_method` VARCHAR(100) NOT NULL,
  `travel_distance` DOUBLE NOT NULL DEFAULT 0,
  `travel_time` VARCHAR(100) NOT NULL,
  `travel_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `daily_allowance` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `home_address` TEXT NOT NULL,
  
  `latitude` DOUBLE NULL,
  `longitude` DOUBLE NULL,
  
  -- รูปภาพ (เก็บ Base64 หรือ Path รูป)
  `student_image` MEDIUMTEXT NULL COMMENT 'รูปหน้านักเรียน',
  `outside_image` MEDIUMTEXT NULL COMMENT 'รูปภายนอกบ้าน',
  `inside_image` MEDIUMTEXT NULL COMMENT 'รูปภายในบ้าน',
  
  -- ลายเซ็นดิจิทัล (Base64)
  `signature_student` MEDIUMTEXT NULL,
  `signature_parent` MEDIUMTEXT NULL,
  `signature_teacher` MEDIUMTEXT NULL,
  `signature_gov` MEDIUMTEXT NULL,
  `signature_director` MEDIUMTEXT NULL,
  
  -- ชื่อบุคคลลงนาม
  `teacher_name` VARCHAR(155) NOT NULL,
  `director_name` VARCHAR(155) NOT NULL,
  `gov_name` VARCHAR(155) NOT NULL,
  `gov_position` VARCHAR(155) NOT NULL,
  
  `note` TEXT NULL COMMENT 'หมายเหตุ/ภาระพึ่งพิงเพิ่ม',
  `manual_risk_assessment` VARCHAR(20) NOT NULL DEFAULT 'normal',
  `manual_action_notes` TEXT NULL COMMENT 'มติช่วยเหลือเร่งด่วน',
  
  -- สรุป AI
  `ai_summary` TEXT NULL,
  `ai_strengths` TEXT NULL COMMENT 'จุดเด่น (JSON array structure)',
  `ai_challenges` TEXT NULL COMMENT 'จุดท้าทาย (JSON array structure)',
  `ai_risk_level` VARCHAR(20) NULL,
  `ai_action_plan` TEXT NULL,
  
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Household Members Table
DROP TABLE IF EXISTS `household_members`;
CREATE TABLE `household_members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `visit_id` VARCHAR(50) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `relation` VARCHAR(100) NOT NULL,
  `citizen_id` VARCHAR(30) NULL,
  `age` VARCHAR(10) NULL,
  `total_income` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (`visit_id`) REFERENCES `visit_records` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Schedules Table
DROP TABLE IF EXISTS `schedules`;
CREATE TABLE `schedules` (
  `id` VARCHAR(50) NOT NULL,
  `student_id` VARCHAR(50) NOT NULL,
  `scheduled_date` VARCHAR(50) NOT NULL,
  `scheduled_time` VARCHAR(10) NOT NULL,
  `notes` TEXT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Checklist Table
DROP TABLE IF EXISTS `checklist`;
CREATE TABLE `checklist` (
  `id` VARCHAR(50) NOT NULL,
  `task` VARCHAR(255) NOT NULL,
  `category` VARCHAR(50) NOT NULL COMMENT 'prepare, on_visit, after_visit',
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Seed Data: นักเรียนเริ่มต้น (เหมือนเดิม)
-- --------------------------------------------------------
INSERT INTO `students` (`id`, `student_code`, `prefix`, `name`, `nickname`, `gender`, `birth_date`, `grade`, `room`, `citizen_id`, `address`, `parent_name`, `parent_relation`, `parent_phone`, `parent_job`, `latitude`, `longitude`, `visit_status`, `risk_level`) VALUES
('STD001', '10952', 'เด็กชาย', 'กิตติศักดิ์ มั่งคั่ง', 'กอล์ฟ', 'ชาย', '2016-04-12', 'ป.4/1', '1', '1100412589632', '12/4 หมู่ 2 ต.หนองกี่ อ.หนองกี่ จ.บุรีรัมย์ 31210', 'สมยศ มั่งคั่ง', 'บิดา', '0812345678', 'รับจ้างทั่วไป', 14.895123, 102.531245, 'pending', 'not_assessed'),
('STD002', '10953', 'เด็กหญิง', 'จารุวรรณ ใยใส', 'จ๋า', 'หญิง', '2014-08-25', 'ป.6/1', '1', '1100412589633', '45 หมู่ 6 ต.หนองกี่ อ.หนองกี่ จ.บุรีรัมย์ 31210', 'นภา ใยใส', 'มารดา', '0887654321', 'พนักงานโรงงาน', 14.898432, 102.525654, 'pending', 'not_assessed'),
('STD003', '10954', 'เด็กชาย', 'ธรรมนูญ ยืนยง', 'นิว', 'ชาย', '2012-01-05', 'ม.2/1', '1', '1100412589634', '88/1 ต.หนองกี่ อ.หนองกี่ จ.บุรีรัมย์ 31210', 'สมควร ยืนยง', 'ปู่', '0894567890', 'เกษตรกร', 14.892434, 102.541298, 'pending', 'not_assessed'),
('STD004', '10955', 'เด็กหญิง', 'พิมพ์ชนก รอดพ้น', 'พลอย', 'หญิง', '2011-11-14', 'ม.3/1', '1', '1100412589635', '124 หมู่ 9 ต.หนองกี่ อ.หนองกี่ จ.บุรีรัมย์ 31210', 'รินดา รอดพ้น', 'มารดา', '0823456789', 'ค้าขาย', 14.901121, 102.532356, 'pending', 'not_assessed');

-- Seed Data: เช็กสเตปลิมิตภารกิจครู
INSERT INTO `checklist` (`id`, `task`, `category`, `completed`) VALUES
('CHK1', 'จัดเตรียมแบบบันทึก นร.01 และนัดแนะผู้ปกครองล่วงหน้า', 'prepare', 1),
('CHK2', 'ตรวจสอบเบอร์ติดต่อและดาวน์โหลดพิกัด GPS จุดหมาย', 'prepare', 1),
('CHK3', 'เตรียมของอุปโภคช่วยเหลือแรกพบ (ถุงปันสุข สภาพวิกฤต)', 'prepare', 0),
('CHK4', 'ถ่ายภาพนักเรียนและสังเกตสภาพความมั่นคงของบ้านดินมุงหลังคาแป้น', 'on_visit', 0),
('CHK5', 'พูดคุยประเมินรายได้จริง รายจ่ายและบันทึกข้อมูลสมาชิก 13 หลัก', 'on_visit', 0),
('CHK6', 'ให้ผู้ปกครอง นักเรียน และตัวแทนท้องถิ่นเขียนสิทธิ์ลงนามดิจิทัลบนแท็บเล็ต/มือถือครู', 'on_visit', 0),
('CHK7', 'ประเมินความเสี่ยงและวิเคราะห์แผนฟื้นฟูปันสุขด้วย AI สรุปรายงาน', 'after_visit', 0),
('CHK8', 'พิมพ์รายงาน นร.01 นำเสนอผู้อำนวยการเพื่อรับเงินอุดหนุนแบบมีเงื่อนไข กสศ.', 'after_visit', 0);
