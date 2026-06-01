<?php
/**
 * DB Connect configuration with MySQL/MariaDB for Student Visit System
 * PDO Driver - Secure Prepared Statements
 */

define('DB_HOST', 'localhost');
define('DB_USER', 'schoolos_studentcare');
define('DB_PASS', 'sjE9_zJzf7_O6plw');
define('DB_NAME', 'schoolos_studentcare');

try {
    // 1. Try to connect directly to the database (Best practice for Plesk/cPanel shared hosting where DB is pre-created)
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        // 2. Fallback: Connect to host without dbname and attempt database creation (useful for local development e.g. XAMPP)
        $pdo = new PDO("mysql:host=" . DB_HOST . ";charset=utf8mb4", DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE `" . DB_NAME . "`");
    }

    // Dynamic Reset Option: If school admin requests ?reset_db=1, drop all tables to start fresh peacefully!
    if (isset($_GET['reset_db']) && $_GET['reset_db'] == '1') {
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
        $pdo->exec("DROP TABLE IF EXISTS `checklist`");
        $pdo->exec("DROP TABLE IF EXISTS `schedules`");
        $pdo->exec("DROP TABLE IF EXISTS `household_members`");
        $pdo->exec("DROP TABLE IF EXISTS `visit_records`");
        $pdo->exec("DROP TABLE IF EXISTS `students`");
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
        
        header("Location: index.php?msg=" . urlencode("ล้างและคืนค่าเริ่มต้นฐานข้อมูลสำเร็จเรียบร้อยแล้วระบบจะสร้างตารางใหม่ทันที!"));
        exit;
    }

    // 3. Auto-Installer: Check if table 'students' exists. Install schema if missing!
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'students'");
    if ($tableCheck->rowCount() == 0) {
        // Tables do not exist, run the setup commands
        $sqlSchema = "
        CREATE TABLE IF NOT EXISTS `students` (
          `id` VARCHAR(50) NOT NULL,
          `student_code` VARCHAR(55) NULL,
          `prefix` VARCHAR(30) NULL,
          `name` VARCHAR(150) NOT NULL,
          `nickname` VARCHAR(50) NOT NULL,
          `gender` VARCHAR(20) NULL,
          `birth_date` VARCHAR(50) NULL,
          `grade` VARCHAR(30) NOT NULL,
          `room` VARCHAR(10) NULL,
          `citizen_id` VARCHAR(30) NULL,
          `address` TEXT NOT NULL,
          `village` VARCHAR(50) NULL,
          `subdistrict` VARCHAR(100) NULL,
          `district` VARCHAR(100) NULL,
          `province` VARCHAR(100) NULL,
          `zipcode` VARCHAR(10) NULL,
          `parent_name` VARCHAR(150) NULL,
          `parent_relation` VARCHAR(100) NULL,
          `parent_phone` VARCHAR(30) NULL,
          `parent_job` VARCHAR(100) NULL,
          `latitude` DOUBLE NULL,
          `longitude` DOUBLE NULL,
          `visit_status` VARCHAR(20) NOT NULL DEFAULT 'pending',
          `risk_level` VARCHAR(20) NOT NULL DEFAULT 'not_assessed',
          `last_visited_date` VARCHAR(50) NULL,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS `visit_records` (
          `id` VARCHAR(50) NOT NULL,
          `student_id` VARCHAR(50) NOT NULL,
          `visited_date` VARCHAR(50) NOT NULL,
          `semester` VARCHAR(10) NOT NULL DEFAULT '1',
          `school_year` VARCHAR(10) NOT NULL DEFAULT '2569',
          `visitor_name` VARCHAR(150) NOT NULL,
          `informant_name` VARCHAR(150) NOT NULL,
          `informant_relation` VARCHAR(100) NOT NULL,
          `family_status` VARCHAR(200) NOT NULL,
          `living_with` VARCHAR(200) NOT NULL,
          `guardian_name` VARCHAR(150) NOT NULL,
          `guardian_relation` VARCHAR(100) NOT NULL,
          `guardian_citizen_id` VARCHAR(50) NOT NULL,
          `guardian_education` VARCHAR(100) NOT NULL,
          `guardian_job` VARCHAR(100) NOT NULL,
          `guardian_phone` VARCHAR(50) NOT NULL,
          `state_welfare` VARCHAR(200) NOT NULL,
          `total_members` INT NOT NULL DEFAULT 1,
          `house_ownership` VARCHAR(100) NOT NULL,
          `monthly_rent` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          `floor_material` VARCHAR(100) NOT NULL,
          `wall_material` VARCHAR(100) NOT NULL,
          `roof_material` VARCHAR(100) NOT NULL,
          `has_toilet` VARCHAR(50) NOT NULL,
          `farm_land` DOUBLE NOT NULL DEFAULT 0,
          `water_source` VARCHAR(100) NOT NULL,
          `electricity` VARCHAR(100) NOT NULL,
          `vehicles` VARCHAR(255) NOT NULL,
          `travel_method` VARCHAR(100) NOT NULL,
          `travel_distance` DOUBLE NOT NULL DEFAULT 0,
          `travel_time` VARCHAR(100) NOT NULL,
          `travel_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          `daily_allowance` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          `home_address` TEXT NOT NULL,
          `latitude` DOUBLE NULL,
          `longitude` DOUBLE NULL,
          `student_image` MEDIUMTEXT NULL,
          `outside_image` MEDIUMTEXT NULL,
          `inside_image` MEDIUMTEXT NULL,
          `signature_student` MEDIUMTEXT NULL,
          `signature_parent` MEDIUMTEXT NULL,
          `signature_teacher` MEDIUMTEXT NULL,
          `signature_gov` MEDIUMTEXT NULL,
          `signature_director` MEDIUMTEXT NULL,
          `teacher_name` VARCHAR(155) NOT NULL,
          `director_name` VARCHAR(155) NOT NULL,
          `gov_name` VARCHAR(155) NOT NULL,
          `gov_position` VARCHAR(155) NOT NULL,
          `note` TEXT NULL,
          `manual_risk_assessment` VARCHAR(20) NOT NULL DEFAULT 'normal',
          `manual_action_notes` TEXT NULL,
          `ai_summary` TEXT NULL,
          `ai_strengths` TEXT NULL,
          `ai_challenges` TEXT NULL,
          `ai_risk_level` VARCHAR(20) NULL,
          `ai_action_plan` TEXT NULL,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS `household_members` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `visit_id` VARCHAR(50) NOT NULL,
          `full_name` VARCHAR(150) NOT NULL,
          `relation` VARCHAR(100) NOT NULL,
          `citizen_id` VARCHAR(30) NULL,
          `age` VARCHAR(10) NULL,
          `total_income` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          FOREIGN KEY (`visit_id`) REFERENCES `visit_records` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS `schedules` (
          `id` VARCHAR(50) NOT NULL,
          `student_id` VARCHAR(50) NOT NULL,
          `scheduled_date` VARCHAR(50) NOT NULL,
          `scheduled_time` VARCHAR(10) NOT NULL,
          `notes` TEXT NULL,
          `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
          PRIMARY KEY (`id`),
          FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS `checklist` (
          `id` VARCHAR(50) NOT NULL,
          `task` VARCHAR(255) NOT NULL,
          `category` VARCHAR(50) NOT NULL,
          `completed` TINYINT(1) NOT NULL DEFAULT 0,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";

        $pdo->exec($sqlSchema);

        // Seed initial data
        $pdo->exec("
            INSERT INTO `students` (`id`, `student_code`, `prefix`, `name`, `nickname`, `gender`, `birth_date`, `grade`, `room`, `citizen_id`, `address`, `parent_name`, `parent_relation`, `parent_phone`, `parent_job`, `latitude`, `longitude`, `visit_status`, `risk_level`) VALUES
            ('STD001', '10952', 'เด็กชาย', 'กิตติศักดิ์ มั่งคั่ง', 'กอล์ฟ', 'ชาย', '2011-04-12', 'ม.3/2', '2', '1100412589632', '12/4 หมู่ 2 ต.ห้วยชัน อ.เมือง จ.นครสวรรค์ 60000', 'สมยศ มั่งคั่ง', 'บิดา', '0812345678', 'รับจ้างทั่วไป', 15.702462, 100.137254, 'pending', 'not_assessed'),
            ('STD002', '10953', 'เด็กหญิง', 'จารุวรรณ ใยใส', 'จ๋า', 'หญิง', '2011-08-25', 'ม.3/2', '2', '1100412589633', '45 หมู่ 6 ต.ห้วยชัน อ.เมือง จ.นครสวรรค์ 60000', 'นภา ใยใส', 'มารดา', '0887654321', 'พนักงานโรงงาน', 15.708912, 100.125191, 'pending', 'not_assessed'),
            ('STD003', '10954', 'เด็กชาย', 'ธรรมนูญ ยืนยง', 'นิว', 'ชาย', '2011-01-05', 'ม.3/2', '2', '1100412589634', '88/1 ต.ห้วยชัน อ.เมือง จ.นครสวรรค์ 60000', 'สมควร ยืนยง', 'ปู่', '0894567890', 'เกษตรกร', 15.697154, 100.142981, 'pending', 'not_assessed'),
            ('STD004', '10955', 'เด็กหญิง', 'พิมพ์ชนก รอดพ้น', 'พลอย', 'หญิง', '2011-11-14', 'ม.3/2', '2', '1100412589635', '124 หมู่ 9 ต.ห้วยชัน อ.เมือง จ.นครสวรรค์ 60000', 'รินดา รอดพ้น', 'มารดา', '0823456789', 'ค้าขาย', 15.711202, 100.131422, 'pending', 'not_assessed');

            INSERT INTO `checklist` (`id`, `task`, `category`, `completed`) VALUES
            ('CHK1', 'จัดเตรียมแบบบันทึก นร.01 และนัดแนะผู้ปกครองล่วงหน้า', 'prepare', 1),
            ('CHK2', 'ตรวจสอบเบอร์ติดต่อและดาวน์โหลดพิกัด GPS จุดหมาย', 'prepare', 1),
            ('CHK3', 'เตรียมของอุปโภคช่วยเหลือแรกพบ (ถุงปันสุข สภาพวิกฤต)', 'prepare', 0),
            ('CHK4', 'ถ่ายภาพนักเรียนและสังเกตสภาพความมั่นคงของบ้านดินมุงหลังคาแป้น', 'on_visit', 0),
            ('CHK5', 'พูดคุยประเมินรายได้จริง รายจ่ายและบันทึกข้อมูลสมาชิก 13 หลัก', 'on_visit', 0),
            ('CHK6', 'ให้ผู้ปกครอง นักเรียน และตัวแทนท้องถิ่นเขียนสิทธิ์ลงนามดิจิทัลบนแท็บเล็ต/มือถือครู', 'on_visit', 0),
            ('CHK7', 'ประเมินความเสี่ยงและวิเคราะห์แผนฟื้นฟูปันสุขด้วย AI สรุปรายงาน', 'after_visit', 0),
            ('CHK8', 'พิมพ์รายงาน นร.01 นำเสนอผู้อำนวยการเพื่อรับเงินอุดหนุนแบบมีเงื่อนไข กสศ.', 'after_visit', 0);
        ");
    } else {
        // Safe Migrator: If table exists but is of an older version (e.g. missing 'student_code' or others)
        // This guarantees that columns are automatically repaired without data loss!
        
        // 1. Force convert engine to InnoDB to support foreign keys
        try {
            $pdo->exec("ALTER TABLE `students` ENGINE=InnoDB");
        } catch (PDOException $ex) {}

        // 2. Force convert collation to utf8mb4_unicode_ci to match visit_records
        try {
            $pdo->exec("ALTER TABLE `students` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        } catch (PDOException $ex) {}

        // 3. Ensure 'id' column is exactly VARCHAR(50) and PRIMARY KEY
        try {
            $pdo->exec("ALTER TABLE `students` MODIFY `id` VARCHAR(50) NOT NULL");
        } catch (PDOException $ex) {}
        try {
            $pkCheck = $pdo->query("SHOW KEYS FROM `students` WHERE Key_name = 'PRIMARY'");
            if ($pkCheck->rowCount() == 0) {
                $pdo->exec("ALTER TABLE `students` ADD PRIMARY KEY (`id`)");
            }
        } catch (PDOException $ex) {}

        $studentColumns = [
            'student_code' => "VARCHAR(55) NULL COMMENT 'รหัสนักเรียน' AFTER `id`",
            'prefix' => "VARCHAR(30) NULL COMMENT 'คำนำหน้าชื่อ' AFTER `student_code`",
            'nickname' => "VARCHAR(50) NOT NULL DEFAULT '' COMMENT 'ชื่อเล่น' AFTER `name`",
            'gender' => "VARCHAR(20) NULL COMMENT 'เพศ' AFTER `nickname`",
            'birth_date' => "VARCHAR(50) NULL COMMENT 'วันเกิด' AFTER `gender`",
            'room' => "VARCHAR(10) NULL COMMENT 'ห้องเรียน' AFTER `grade`",
            'citizen_id' => "VARCHAR(30) NULL COMMENT 'เลขบัตรประชาชน' AFTER `room`",
            'village' => "VARCHAR(50) NULL AFTER `address`",
            'subdistrict' => "VARCHAR(100) NULL AFTER `village`",
            'district' => "VARCHAR(100) NULL AFTER `subdistrict`",
            'province' => "VARCHAR(100) NULL AFTER `district`",
            'zipcode' => "VARCHAR(10) NULL AFTER `province`",
            'parent_name' => "VARCHAR(150) NULL AFTER `zipcode`",
            'parent_relation' => "VARCHAR(100) NULL AFTER `parent_name`",
            'parent_phone' => "VARCHAR(30) NULL AFTER `parent_relation`",
            'parent_job' => "VARCHAR(100) NULL AFTER `parent_phone`",
            'latitude' => "DOUBLE NULL AFTER `parent_job`",
            'longitude' => "DOUBLE NULL AFTER `latitude`",
            'visit_status' => "VARCHAR(20) NOT NULL DEFAULT 'pending' AFTER `longitude`",
            'risk_level' => "VARCHAR(20) NOT NULL DEFAULT 'not_assessed' AFTER `visit_status`",
            'last_visited_date' => "VARCHAR(50) NULL AFTER `risk_level`"
        ];

        foreach ($studentColumns as $col => $definition) {
            $colQuery = $pdo->query("SHOW COLUMNS FROM `students` LIKE '$col'");
            if ($colQuery->rowCount() == 0) {
                $pdo->exec("ALTER TABLE `students` ADD `$col` $definition");
            }
        }

        // Check if visit_records table is missing
        $vrTableCheck = $pdo->query("SHOW TABLES LIKE 'visit_records'");
        if ($vrTableCheck->rowCount() == 0) {
            $pdo->exec("CREATE TABLE IF NOT EXISTS `visit_records` (
              `id` VARCHAR(50) NOT NULL,
              `student_id` VARCHAR(50) NOT NULL,
              `visited_date` VARCHAR(50) NOT NULL,
              `semester` VARCHAR(10) NOT NULL DEFAULT '1',
              `school_year` VARCHAR(10) NOT NULL DEFAULT '2569',
              `visitor_name` VARCHAR(150) NOT NULL,
              `informant_name` VARCHAR(150) NOT NULL,
              `informant_relation` VARCHAR(100) NOT NULL,
              `family_status` VARCHAR(200) NOT NULL,
              `living_with` VARCHAR(200) NOT NULL,
              `guardian_name` VARCHAR(150) NOT NULL,
              `guardian_relation` VARCHAR(100) NOT NULL,
              `guardian_citizen_id` VARCHAR(50) NOT NULL,
              `guardian_education` VARCHAR(100) NOT NULL,
              `guardian_job` VARCHAR(100) NOT NULL,
              `guardian_phone` VARCHAR(50) NOT NULL,
              `state_welfare` VARCHAR(200) NOT NULL,
              `total_members` INT NOT NULL DEFAULT 1,
              `house_ownership` VARCHAR(100) NOT NULL,
              `monthly_rent` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
              `floor_material` VARCHAR(100) NOT NULL,
              `wall_material` VARCHAR(100) NOT NULL,
              `roof_material` VARCHAR(100) NOT NULL,
              `has_toilet` VARCHAR(50) NOT NULL,
              `farm_land` DOUBLE NOT NULL DEFAULT 0,
              `water_source` VARCHAR(100) NOT NULL,
              `electricity` VARCHAR(100) NOT NULL,
              `vehicles` VARCHAR(255) NOT NULL,
              `travel_method` VARCHAR(100) NOT NULL,
              `travel_distance` DOUBLE NOT NULL DEFAULT 0,
              `travel_time` VARCHAR(100) NOT NULL,
              `travel_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
              `daily_allowance` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
              `home_address` TEXT NOT NULL,
              `latitude` DOUBLE NULL,
              `longitude` DOUBLE NULL,
              `student_image` MEDIUMTEXT NULL,
              `outside_image` MEDIUMTEXT NULL,
              `inside_image` MEDIUMTEXT NULL,
              `signature_student` MEDIUMTEXT NULL,
              `signature_parent` MEDIUMTEXT NULL,
              `signature_teacher` MEDIUMTEXT NULL,
              `signature_gov` MEDIUMTEXT NULL,
              `signature_director` MEDIUMTEXT NULL,
              `teacher_name` VARCHAR(155) NOT NULL,
              `director_name` VARCHAR(155) NOT NULL,
              `gov_name` VARCHAR(155) NOT NULL,
              `gov_position` VARCHAR(155) NOT NULL,
              `note` TEXT NULL,
              `manual_risk_assessment` VARCHAR(20) NOT NULL DEFAULT 'normal',
              `manual_action_notes` TEXT NULL,
              `ai_summary` TEXT NULL,
              `ai_strengths` TEXT NULL,
              `ai_challenges` TEXT NULL,
              `ai_risk_level` VARCHAR(20) NULL,
              `ai_action_plan` TEXT NULL,
              `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
        }

        // Check if household_members table is missing
        $hmTableCheck = $pdo->query("SHOW TABLES LIKE 'household_members'");
        if ($hmTableCheck->rowCount() == 0) {
            $pdo->exec("CREATE TABLE IF NOT EXISTS `household_members` (
              `id` INT AUTO_INCREMENT PRIMARY KEY,
              `visit_id` VARCHAR(50) NOT NULL,
              `full_name` VARCHAR(150) NOT NULL,
              `relation` VARCHAR(100) NOT NULL,
              `citizen_id` VARCHAR(30) NULL,
              `age` VARCHAR(10) NULL,
              `total_income` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
              FOREIGN KEY (`visit_id`) REFERENCES `visit_records` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
        }

        // Check if schedules table is missing
        $scTableCheck = $pdo->query("SHOW TABLES LIKE 'schedules'");
        if ($scTableCheck->rowCount() == 0) {
            $pdo->exec("CREATE TABLE IF NOT EXISTS `schedules` (
              `id` VARCHAR(50) NOT NULL,
              `student_id` VARCHAR(50) NOT NULL,
              `scheduled_date` VARCHAR(50) NOT NULL,
              `scheduled_time` VARCHAR(10) NOT NULL,
              `notes` TEXT NULL,
              `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
              PRIMARY KEY (`id`),
              FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
        }

        // Check if checklist table is missing
        $chkTableCheck = $pdo->query("SHOW TABLES LIKE 'checklist'");
        if ($chkTableCheck->rowCount() == 0) {
            $pdo->exec("CREATE TABLE IF NOT EXISTS `checklist` (
                `id` VARCHAR(50) NOT NULL,
                `task` VARCHAR(255) NOT NULL,
                `category` VARCHAR(50) NOT NULL,
                `completed` TINYINT(1) NOT NULL DEFAULT 0,
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

            $pdo->exec("INSERT INTO `checklist` (`id`, `task`, `category`, `completed`) VALUES
                ('CHK1', 'จัดเตรียมแบบบันทึก นร.01 และนัดแนะผู้ปกครองล่วงหน้า', 'prepare', 1),
                ('CHK2', 'ตรวจสอบเบอร์ติดต่อและดาวน์โหลดพิกัด GPS จุดหมาย', 'prepare', 1),
                ('CHK3', 'เตรียมของอุปโภคช่วยเหลือแรกพบ (ถุงปันสุข สภาพวิกฤต)', 'prepare', 0),
                ('CHK4', 'ถ่ายภาพนักเรียนและสังเกตสภาพความมั่นคงของบ้านดินมุงหลังคาแป้น', 'on_visit', 0),
                ('CHK5', 'พูดคุยประเมินรายได้จริง รายจ่ายและบันทึกข้อมูลสมาชิก 13 หลัก', 'on_visit', 0),
                ('CHK6', 'ให้ผู้ปกครอง นักเรียน และตัวแทนท้องถิ่นเขียนสิทธิ์ลงนามดิจิทัลบนแท็บเล็ต/มือถือครู', 'on_visit', 0),
                ('CHK7', 'ประเมินความเสี่ยงและวิเคราะห์แผนฟื้นฟูปันสุขด้วย AI สรุปรายงาน', 'after_visit', 0),
                ('CHK8', 'พิมพ์รายงาน นร.01 นำเสนอผู้อำนวยการเพื่อรับเงินอุดหนุนแบบมีเงื่อนไข กสศ.', 'after_visit', 0);
            ");
        }
    }
} catch (PDOException $e) {
    die("เชื่อมต่อฐานข้อมูลล้มเหลว (Connection failed): " . $e->getMessage() . "<br><br>
    <b>💡 คำแนะนำสำหรับระบบโฮสติ้งป้อนย้าย (Plesk/cPanel/XAMPP):</b><br>
    หากมีตารางเก่าชื่อ <code>students</code> ตกค้างและมีโครงสร้างต่างกัน ส่งผลให้สร้างตาราง Foreign Key ผิดพลาด (Can't create table / errno 150)<br>
    ท่านสามารถสั่งให้ระบบ <b>ล้างตารางทั้งหมดและสร้างใหม่แบบอัตโนมัติ 100%</b> ได้ทันที<br>
    👉 เพียงเปิดหน้าเว็บแล้วพิมพ์ลิ้งก์ต่อท้าย: <a href='index.php?reset_db=1' style='color:#dc2626; font-weight:bold;text-decoration:underline;'>index.php?reset_db=1</a> แล้วกด Enter ครับ!");
}
?>
