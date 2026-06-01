<?php
session_start();
/**
 * Standalone Intelligent Student Visit Management System (PHP + MySQL + Tailwind CSS)
 * นร.01 สพฐ. / กสศ. 5 ฝ่ายสมบูรณ์แบบ
 * June 2026
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'db_connect.php';

// Helper: Handle Actions
$action = isset($_GET['action']) ? $_GET['action'] : '';
$msg = '';
$msgType = 'success';

// Check authentication
$userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
$username = isset($_SESSION['username']) ? $_SESSION['username'] : null;
$userRole = isset($_SESSION['role']) ? $_SESSION['role'] : null;
$userSmiss = isset($_SESSION['smiss_code']) ? $_SESSION['smiss_code'] : null;
$userFullName = isset($_SESSION['full_name']) ? $_SESSION['full_name'] : null;
$userGrade = isset($_SESSION['assigned_grade']) ? $_SESSION['assigned_grade'] : null;
$userRoom = isset($_SESSION['assigned_room']) ? $_SESSION['assigned_room'] : null;

// Handle Auth Actions
if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $u = trim($_POST['username']);
    $p = trim($_POST['password']);
    
    // Find user
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$u]);
    $userRow = $stmt->fetch();
    
    if ($userRow && password_verify($p, $userRow['password'])) {
        if ($userRow['status'] !== 'approved') {
            $msg = "บัญชีของท่านยังไม่ได้รับการอนุมัติจากผู้ดูแลระบบ กรุณารอการตรวจสอบ!";
            $msgType = "error";
        } else {
            // Log in successfully
            $_SESSION['user_id'] = $userRow['id'];
            $_SESSION['username'] = $userRow['username'];
            $_SESSION['role'] = $userRow['role'];
            $_SESSION['smiss_code'] = $userRow['smiss_code'];
            $_SESSION['full_name'] = $userRow['full_name'];
            $_SESSION['assigned_grade'] = $userRow['assigned_grade'];
            $_SESSION['assigned_room'] = $userRow['assigned_room'];
            
            header("Location: index.php");
            exit;
        }
    } else {
        $msg = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!";
        $msgType = "error";
    }
}

if ($action === 'logout') {
    session_destroy();
    header("Location: index.php");
    exit;
}

if ($action === 'register_school' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $smiss = trim($_POST['smiss_code']);
        $schName = trim($_POST['school_name']);
        $prov = trim($_POST['province']);
        $dist = trim($_POST['district']);
        $dirName = trim($_POST['director_name']);
        
        $adminUser = trim($_POST['username']);
        $adminPass = trim($_POST['password']);
        $adminName = trim($_POST['full_name']);
        $adminPhone = trim($_POST['phone']);
        
        if (strlen($smiss) !== 8 || !is_numeric($smiss)) {
            throw new Exception("รหัส SMISS ต้องเป็นตัวเลข 8 หลักเท่านั้น!");
        }
        
        // Check if school or user already exists
        $chkSch = $pdo->prepare("SELECT * FROM schools WHERE smiss_code = ?");
        $chkSch->execute([$smiss]);
        if ($chkSch->rowCount() > 0) {
            throw new Exception("รหัส SMISS โรงเรียนนี้มีอยู่ในระบบแล้ว!");
        }
        
        $chkUsr = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $chkUsr->execute([$adminUser]);
        if ($chkUsr->rowCount() > 0) {
            throw new Exception("ชื่อผู้ใช้งาน (Username) นี้ถูกใช้งานแล้ว!");
        }
        
        $pdo->beginTransaction();
        
        // Add pending school
        $stmtS = $pdo->prepare("INSERT INTO schools (smiss_code, school_name, province, district, director_name, status) VALUES (?, ?, ?, ?, ?, 'pending')");
        $stmtS->execute([$smiss, $schName, $prov, $dist, $dirName]);
        
        // Add pending admin user for this school
        $hashed = password_hash($adminPass, PASSWORD_DEFAULT);
        $stmtU = $pdo->prepare("INSERT INTO users (username, password, role, smiss_code, full_name, phone, status) VALUES (?, ?, 'school_admin', ?, ?, ?, 'pending')");
        $stmtU->execute([$adminUser, $hashed, $smiss, $adminName, $adminPhone]);
        
        $pdo->commit();
        $msg = "ลงทะเบียนขอเปิดใช้งานสิทธิ์โรงเรียนสำเร็จ! กรุณารอผู้ดูแลระบบสูงสุด (Super Admin) อนุมัติการเปิดใช้งานเพื่อเริ่มเดินทาง!";
        $msgType = "success";
        header("Location: index.php?msg=" . urlencode($msg));
        exit;
    } catch (Exception $ex) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        $msg = "ลงทะเบียนเข้าใช้งานล้มเหลว: " . $ex->getMessage();
        $msgType = "error";
    }
}

if ($action === 'register_teacher' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $smiss = trim($_POST['smiss_code']);
        $tUser = trim($_POST['username']);
        $tPass = trim($_POST['password']);
        $tName = trim($_POST['full_name']);
        $tPhone = trim($_POST['phone']);
        $tGrade = trim($_POST['assigned_grade']);
        $tRoom = trim($_POST['assigned_room']);
        
        // Check if username already exists
        $chkUsr = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $chkUsr->execute([$tUser]);
        if ($chkUsr->rowCount() > 0) {
            throw new Exception("ชื่อผู้ใช้งานนี้ถูกใช้งานแล้ว!");
        }
        
        // Insert pending teacher
        $hashed = password_hash($tPass, PASSWORD_DEFAULT);
        $stmtU = $pdo->prepare("INSERT INTO users (username, password, role, smiss_code, full_name, phone, status, assigned_grade, assigned_room) VALUES (?, ?, 'teacher', ?, ?, ?, 'pending', ?, ?)");
        $stmtU->execute([$tUser, $hashed, $smiss, $tName, $tPhone, $tGrade, $tRoom]);
        
        $msg = "ส่งคำขอลงทะเบียนคุณครูเรียบร้อยแล้ว! กรุณาแจ้งผู้ควบคุมระบบของโรงเรียนท่านให้อนุมัติเปิดสิทธิ์!";
        $msgType = "success";
        header("Location: index.php?msg=" . urlencode($msg));
        exit;
    } catch (Exception $ex) {
        $msg = "ลงทะเบียนครูล้มเหลว: " . $ex->getMessage();
        $msgType = "error";
    }
}

// Super Admin approvals logic
if ($userId && $userRole === 'super_admin') {
    if ($action === 'approve_school' && isset($_GET['smiss_code'])) {
        $smiss = $_GET['smiss_code'];
        $pdo->prepare("UPDATE schools SET status = 'approved' WHERE smiss_code = ?")->execute([$smiss]);
        // Also auto-approve the school_admin of that school
        $pdo->prepare("UPDATE users SET status = 'approved' WHERE smiss_code = ? AND role = 'school_admin'")->execute([$smiss]);
        header("Location: index.php?page=schools_list&msg=" . urlencode("อนุมัติเข้าใช้งานโรงเรียนและผู้ดูแลระบบโรงเรียนสำเร็จเรียบร้อย!"));
        exit;
    }
    if ($action === 'reject_school' && isset($_GET['smiss_code'])) {
        $smiss = $_GET['smiss_code'];
        $pdo->prepare("DELETE FROM users WHERE smiss_code = ?")->execute([$smiss]);
        $pdo->prepare("DELETE FROM schools WHERE smiss_code = ?")->execute([$smiss]);
        header("Location: index.php?page=schools_list&msg=" . urlencode("ปฏิเสธคำขอเปิดใช้งานสมบูรณ์และลบข้อมูลสำเร็จ!"));
        exit;
    }
    if ($action === 'approve_user_by_super' && isset($_GET['id'])) {
        $uid = intval($_GET['id']);
        $pdo->prepare("UPDATE users SET status = 'approved' WHERE id = ?")->execute([$uid]);
        header("Location: index.php?page=schools_list&msg=" . urlencode("อนุมัติผู้ใช้งานดังกล่าวให้เข้าปฏิบัติหน้าที่เรียบร้อย!"));
        exit;
    }
    if ($action === 'make_school_admin' && isset($_GET['id'])) {
        $uid = intval($_GET['id']);
        $pdo->prepare("UPDATE users SET role = 'school_admin', status = 'approved' WHERE id = ?")->execute([$uid]);
        header("Location: index.php?page=schools_list&msg=" . urlencode("ยกระดับคุณครูดังกล่าวเป็นผู้ดูแลระบบ (School Admin) โรงเรียนสำเร็จเรียบร้อย!"));
        exit;
    }
    if ($action === 'make_teacher' && isset($_GET['id'])) {
        $uid = intval($_GET['id']);
        $pdo->prepare("UPDATE users SET role = 'teacher' WHERE id = ?")->execute([$uid]);
        header("Location: index.php?page=schools_list&msg=" . urlencode("ปรับระดับฐานผู้ใช้งานดังกล่าวลงเป็นคุณครูที่ปรึกษาเรียบร้อย!"));
        exit;
    }
    if ($action === 'reject_user_by_super' && isset($_GET['id'])) {
        $uid = intval($_GET['id']);
        $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$uid]);
        header("Location: index.php?page=schools_list&msg=" . urlencode("ถอดถอนและปฏิเสธคำขอผู้ใช้งานดังกล่าวสำเร็จ!"));
        exit;
    }
}

// School Admin approvals logic
if ($userId && $userRole === 'school_admin') {
    if ($action === 'approve_teacher' && isset($_GET['teacher_id'])) {
        $tid = $_GET['teacher_id'];
        $pdo->prepare("UPDATE users SET status = 'approved' WHERE id = ? AND smiss_code = ?")->execute([$tid, $userSmiss]);
        header("Location: index.php?page=teachers_mgmt&msg=" . urlencode("อนุมัติเปิดใช้งานสิทธิ์บัญชีคุณครูที่ปรึกษาสำเร็จแล้ว!"));
        exit;
    }
    if ($action === 'reject_teacher' && isset($_GET['teacher_id'])) {
        $tid = $_GET['teacher_id'];
        $pdo->prepare("DELETE FROM users WHERE id = ? AND smiss_code = ?")->execute([$tid, $userSmiss]);
        header("Location: index.php?page=teachers_mgmt&msg=" . urlencode("ลบบัญชีและคำขอดังกล่าวเรียบร้อย!"));
        exit;
    }
    if ($action === 'update_school_settings' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $schName = $_POST['school_name'];
        $prov = $_POST['province'];
        $dist = $_POST['district'];
        $dirName = $_POST['director_name'];
        $pdo->prepare("UPDATE schools SET school_name = ?, province = ?, district = ?, director_name = ? WHERE smiss_code = ?")
            ->execute([$schName, $prov, $dist, $dirName, $userSmiss]);
        header("Location: index.php?page=school_settings&msg=" . urlencode("บันทึกการตั้งค่าข้อมูลโครงสร้างโรงเรียนสำเร็จ!"));
        exit;
    }
    
    // DMC Excel XML/CSV smart parser
    if ($action === 'import_dmc' && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['dmc_file'])) {
        try {
            $file = $_FILES['dmc_file'];
            if ($file['error'] !== UPLOAD_ERR_OK) {
                throw new Exception("เกิดข้อผิดพลาดในการอัปโหลดไฟล์รหัส: " . $file['error']);
            }
            $content = file_get_contents($file['tmp_name']);
            if (!mb_check_encoding($content, 'UTF-8')) {
                $content = iconv('TIS-620', 'UTF-8//IGNORE', $content);
            }
            $lines = preg_split("/\r\n|\n|\r/", $content);
            $parsedCount = 0;
            if (!empty($lines)) {
                $headerLine = array_shift($lines);
                $headerData = str_getcsv($headerLine);
                $mapping = [
                    'student_code' => -1, 'citizen_id' => -1, 'prefix' => -1, 'name' => -1,
                    'nickname' => -1, 'gender' => -1, 'birth_date' => -1, 'grade' => -1,
                    'room' => -1, 'address' => -1, 'parent_name' => -1, 'parent_phone' => -1
                ];
                foreach ($headerData as $idx => $h) {
                    $h = trim($h);
                    if (preg_match('/รหัสประตัว|รหัสนักเรียน|student_code|รหัสประจำตัว/ui', $h)) $mapping['student_code'] = $idx;
                    else if (preg_match('/เลขบัตรประชาชน|เลขบัตร|ประชาชน|citizen_id/ui', $h)) $mapping['citizen_id'] = $idx;
                    else if (preg_match('/คำนำหน้า|prefix/ui', $h)) $mapping['prefix'] = $idx;
                    else if (preg_match('/ชื่อ|นามสกุล|ชื่อ-นามสกุล|name/ui', $h)) $mapping['name'] = $idx;
                    else if (preg_match('/ชื่อเล่น|nickname/ui', $h)) $mapping['nickname'] = $idx;
                    else if (preg_match('/เพศ|gender/ui', $h)) $mapping['gender'] = $idx;
                    else if (preg_match('/วันเกิด|birth/ui', $h)) $mapping['birth_date'] = $idx;
                    else if (preg_match('/ระดับชั้น|ชั้น|grade/ui', $h)) $mapping['grade'] = $idx;
                    else if (preg_match('/ห้อง|room/ui', $h)) $mapping['room'] = $idx;
                    else if (preg_match('/ที่อยู่|address/ui', $h)) $mapping['address'] = $idx;
                    else if (preg_match('/ผู้ปกครอง|parent_name/ui', $h)) $mapping['parent_name'] = $idx;
                    else if (preg_match('/เบอร์โทร|โทรศัพท์|parent_phone/ui', $h)) $mapping['parent_phone'] = $idx;
                }
                
                $stmtIns = $pdo->prepare("INSERT INTO students (
                    id, smiss_code, student_code, prefix, name, nickname, gender, birth_date, grade, room, citizen_id, address,
                    parent_name, parent_relation, parent_phone, parent_job, visit_status, risk_level
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'บิดา/มารดา', ?, 'รับจ้าง', 'pending', 'not_assessed')
                ON DUPLICATE KEY UPDATE 
                    prefix = VALUES(prefix), name = VALUES(name), nickname = VALUES(nickname), gender = VALUES(gender),
                    grade = VALUES(grade), room = VALUES(room), citizen_id = VALUES(citizen_id), address = VALUES(address)");
                
                $pdo->beginTransaction();
                foreach ($lines as $line) {
                    $line = trim($line);
                    if (empty($line)) continue;
                    $row = str_getcsv($line);
                    if (count($row) < 3) continue;
                    
                    $scode = ($mapping['student_code'] !== -1 && isset($row[$mapping['student_code']])) ? trim($row[$mapping['student_code']]) : rand(10000, 99999);
                    $c_id = ($mapping['citizen_id'] !== -1 && isset($row[$mapping['citizen_id']])) ? trim($row[$mapping['citizen_id']]) : '';
                    $pfx = ($mapping['prefix'] !== -1 && isset($row[$mapping['prefix']])) ? trim($row[$mapping['prefix']]) : 'เด็กชาย';
                    $nm = ($mapping['name'] !== -1 && isset($row[$mapping['name']])) ? trim($row[$mapping['name']]) : '';
                    if (empty($nm)) continue;
                    
                    $nk = ($mapping['nickname'] !== -1 && isset($row[$mapping['nickname']])) ? trim($row[$mapping['nickname']]) : 'กอล์ฟ';
                    $gd = ($mapping['gender'] !== -1 && isset($row[$mapping['gender']])) ? trim($row[$mapping['gender']]) : 'ชาย';
                    $bd = ($mapping['birth_date'] !== -1 && isset($row[$mapping['birth_date']])) ? trim($row[$mapping['birth_date']]) : '2554-04-12';
                    $gr = ($mapping['grade'] !== -1 && isset($row[$mapping['grade']])) ? trim($row[$mapping['grade']]) : 'ป.4';
                    $rm = ($mapping['room'] !== -1 && isset($row[$mapping['room']])) ? trim($row[$mapping['room']]) : '1';
                    $adr = ($mapping['address'] !== -1 && isset($row[$mapping['address']])) ? trim($row[$mapping['address']]) : 'ต.หนองกี่ อ.หนองกี่ จ.บุรีรัมย์';
                    $p_nm = ($mapping['parent_name'] !== -1 && isset($row[$mapping['parent_name']])) ? trim($row[$mapping['parent_name']]) : 'สมคิด มั่นคง';
                    $p_ph = ($mapping['parent_phone'] !== -1 && isset($row[$mapping['parent_phone']])) ? trim($row[$mapping['parent_phone']]) : '0812345678';
                    
                    // Split grade/room beautifully
                    if (preg_match('/ม\.([0-9]+)\/([0-9]+)/u', $gr, $m)) {
                        $gr = 'ม.' . $m[1];
                        $rm = $m[2];
                    }
                    
                    $sid = 'STD' . $scode . rand(10, 99);
                    $stmtIns->execute([
                        $sid, $userSmiss, $scode, $pfx, $nm, $nk, $gd, $bd, $gr, $rm, $c_id, $adr, $p_nm, $p_ph
                    ]);
                    $parsedCount++;
                }
                $pdo->commit();
                header("Location: index.php?page=students&msg=" . urlencode("นำเข้าข้อมูลนักเรียนร่วมกับ DMC ของกลุ่มโรงเรียนสำเร็จทั้งหมด $parsedCount ราย!"));
                exit;
            }
        } catch (Exception $ex) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            $msg = "นำเข้าข้อมูลจาก DMC ล้มเหลว: " . $ex->getMessage();
            $msgType = "error";
        }
    }
}

// Save Visit Record POST Action
if ($action === 'save_visit' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $pdo->beginTransaction();

        $visit_id = 'VIS' . date('YmdHis') . rand(100, 999);
        $student_id = $_POST['student_id'];
        $visited_date = $_POST['visited_date'];
        $semester = $_POST['semester'];
        $school_year = $_POST['school_year'];
        $visitor_name = $_POST['visitor_name'];
        $informant_name = $_POST['informant_name'];
        $informant_relation = $_POST['informant_relation'];
        $family_status = $_POST['family_status'];
        $living_with = $_POST['living_with'];
        $guardian_name = $_POST['guardian_name'];
        $guardian_relation = $_POST['guardian_relation'];
        $guardian_citizen_id = $_POST['guardian_citizen_id'];
        $guardian_education = $_POST['guardian_education'];
        $guardian_job = $_POST['guardian_job'];
        $guardian_phone = $_POST['guardian_phone'];
        $state_welfare = $_POST['state_welfare'];
        $total_members = (int)$_POST['total_members'];

        // Housing Material
        $house_ownership = $_POST['house_ownership'];
        $monthly_rent = (float)$_POST['monthly_rent'];
        $floor_material = $_POST['floor_material'];
        $wall_material = $_POST['wall_material'];
        $roof_material = $_POST['roof_material'];
        $has_toilet = $_POST['has_toilet'];
        $farm_land = (double)$_POST['farm_land'];
        $water_source = $_POST['water_source'];
        $electricity = $_POST['electricity'];
        $vehicles = $_POST['vehicles'];

        // Travel
        $travel_method = $_POST['travel_method'];
        $travel_distance = (double)$_POST['travel_distance'];
        $travel_time = $_POST['travel_time'];
        $travel_cost = (float)$_POST['travel_cost'];
        $daily_allowance = (float)$_POST['daily_allowance'];
        $home_address = $_POST['home_address'];

        // GPS Coordinates
        $latitude = $_POST['latitude'] ? (double)$_POST['latitude'] : null;
        $longitude = $_POST['longitude'] ? (double)$_POST['longitude'] : null;

        // Image files
        $student_image = $_POST['student_image_base64'] ?: null;
        $outside_image = $_POST['outside_image_base64'] ?: null;
        $inside_image = $_POST['inside_image_base64'] ?: null;

        // Signatures
        $signature_student = $_POST['signature_student'] ?: null;
        $signature_parent = $_POST['signature_parent'] ?: null;
        $signature_teacher = $_POST['signature_teacher'] ?: null;
        $signature_gov = $_POST['signature_gov'] ?: null;
        $signature_director = $_POST['signature_director'] ?: null;

        $teacher_name = $_POST['teacher_name'] ?: $visitor_name;
        $director_name = $_POST['director_name'] ?: 'นายณรงค์วิทย์ สุวรรณศรี';
        $gov_name = $_POST['gov_name'] ?: 'ผู้ใหญ่บ้าน / ตัวแทนรัฐ';
        $gov_position = $_POST['gov_position'] ?: 'ผู้ใหญ่บ้านหมู่ที่ 2';
        
        $note = $_POST['note'] ?: '';
        $manual_risk_assessment = $_POST['manual_risk_assessment'] ?: 'normal';
        $manual_action_notes = $_POST['manual_action_notes'] ?: '';

        $ai_summary = "ผู้เรียนอาศัยในครัวเรือนสภาพโครงสร้างระดับ " . ($manual_risk_assessment === 'high' ? 'ทรุดโทรมเผชิญปัญหารายได้วิกฤต' : 'ปกติเฝ้าระวังตัวชี้วัดรายหัว') . " แนะนำช่วยเหลือทุน กสศ. เร่งด่วน";
        $ai_strengths = json_encode(["ผู้ปกครองร่วมมือพูดคุยสูง", "นักเรียนตั้งใจใฝ่เรียนรู้ดี"]);
        $ai_challenges = json_encode([$manual_risk_assessment === 'high' ? "ผนังสังกระสีและผุพัง" : "ค่าครองชีพไม่สัมพันธ์รายรับสัมพัทธ์"]);
        $ai_risk_level = $manual_risk_assessment;
        $ai_action_plan = "ส่งเข้าวาระคณะกรรมการศึกษาธิการ อวท. เพื่อรับมอบสิทธิพิเศษและอาหารกลางวันเสริมโรงเรียน";

        // Insert visit record
        $stmt = $pdo->prepare("INSERT INTO visit_records (
            id, student_id, smiss_code, visited_date, semester, school_year, visitor_name, informant_name, informant_relation,
            family_status, living_with, guardian_name, guardian_relation, guardian_citizen_id, guardian_education,
            guardian_job, guardian_phone, state_welfare, total_members, house_ownership, monthly_rent, floor_material,
            wall_material, roof_material, has_toilet, farm_land, water_source, electricity, vehicles, travel_method,
            travel_distance, travel_time, travel_cost, daily_allowance, home_address, latitude, longitude,
            student_image, outside_image, inside_image, signature_student, signature_parent, signature_teacher,
            signature_gov, signature_director, teacher_name, director_name, gov_name, gov_position, note,
            manual_risk_assessment, manual_action_notes, ai_summary, ai_strengths, ai_challenges, ai_risk_level, ai_action_plan
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )");

        $stmt->execute([
            $visit_id, $student_id, $userSmiss, $visited_date, $semester, $school_year, $visitor_name, $informant_name, $informant_relation,
            $family_status, $living_with, $guardian_name, $guardian_relation, $guardian_citizen_id, $guardian_education,
            $guardian_job, $guardian_phone, $state_welfare, $total_members, $house_ownership, $monthly_rent, $floor_material,
            $wall_material, $roof_material, $has_toilet, $farm_land, $water_source, $electricity, $vehicles, $travel_method,
            $travel_distance, $travel_time, $travel_cost, $daily_allowance, $home_address, $latitude, $longitude,
            $student_image, $outside_image, $inside_image, $signature_student, $signature_parent, $signature_teacher,
            $signature_gov, $signature_director, $teacher_name, $director_name, $gov_name, $gov_position, $note,
            $manual_risk_assessment, $manual_action_notes, $ai_summary, $ai_strengths, $ai_challenges, $ai_risk_level, $ai_action_plan
        ]);

        // Insert household members
        if (isset($_POST['members']) && is_array($_POST['members'])) {
            $stmtMem = $pdo->prepare("INSERT INTO household_members (visit_id, full_name, relation, citizen_id, age, total_income) VALUES (?, ?, ?, ?, ?, ?)");
            foreach ($_POST['members'] as $mem) {
                if (!empty($mem['full_name'])) {
                    $stmtMem->execute([
                        $visit_id, $mem['full_name'], $mem['relation'], $mem['citizen_id'], $mem['age'], (float)$mem['total_income']
                    ]);
                }
            }
        }

        // Update Student status immediately
        $updateStu = $pdo->prepare("UPDATE students SET visit_status = 'visited', risk_level = ?, last_visited_date = ? WHERE id = ?");
        $updateStu->execute([$manual_risk_assessment, $visited_date, $student_id]);

        $pdo->commit();
        $msg = "บันทึกข้อมูลและออกรหัสรายงาน นร.01 รหัส $visit_id เรียบร้อยแล้ว!";
        header("Location: index.php?page=records&msg=" . urlencode($msg));
        exit;
    } catch (Exception $e) {
        $pdo->rollBack();
        $msg = "เกิดข้อผิดพลาดในการบันทึก: " . $e->getMessage();
        $msgType = 'error';
    }
}

// Add Student POST Action
if ($action === 'add_student' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $new_id = 'STD' . rand(1000, 9999);
        $student_code = $_POST['student_code'];
        $prefix = $_POST['prefix'];
        $name = $_POST['name'];
        $nickname = $_POST['nickname'];
        $gender = $_POST['gender'];
        $birth_date = $_POST['birth_date'];
        $grade = $_POST['grade'];
        $room = $_POST['room'] ?: '2';
        $citizen_id = $_POST['citizen_id'];
        $address = $_POST['address'];
        $guid_name = $_POST['parent_name'];
        $guid_rel = $_POST['parent_relation'];
        $guid_phone = $_POST['parent_phone'];
        $guid_job = $_POST['parent_job'];

        $stmt = $pdo->prepare("INSERT INTO students (
            id, smiss_code, student_code, prefix, name, nickname, gender, birth_date, grade, room, citizen_id, address,
            parent_name, parent_relation, parent_phone, parent_job, visit_status, risk_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'not_assessed')");

        $stmt->execute([
            $new_id, $userSmiss, $student_code, $prefix, $name, $nickname, $gender, $birth_date, $grade, $room, $citizen_id, $address,
            $guid_name, $guid_rel, $guid_phone, $guid_job
        ]);

        $msg = "ลงทะเบียนข้อมูลส่วนตัวนักเรียน $name สำเร็จ!";
        header("Location: index.php?page=students&msg=" . urlencode($msg));
        exit;
    } catch (Exception $e) {
        $msg = "บันทึกทะเบียนล้มเหลว: " . $e->getMessage();
        $msgType = 'error';
    }
}

// Toggle Checklist State
if ($action === 'toggle_checklist' && isset($_GET['id'])) {
    $chkId = $_GET['id'];
    $stmt = $pdo->prepare("UPDATE checklist SET completed = NOT completed WHERE id = ?");
    $stmt->execute([$chkId]);
    header("Location: index.php?page=checklist");
    exit;
}

// Global data fetching based on user role and state
$students = [];
$records = [];
$schoolsList = [];
$pendingSchools = [];
$pendingUsers = [];
$teachersList = [];
$schoolsStats = [];
$allUsersInSchools = [];

if ($userId) {
    if ($userRole === 'super_admin') {
        $students = $pdo->query("SELECT s.*, sch.school_name FROM students s LEFT JOIN schools sch ON s.smiss_code = sch.smiss_code ORDER BY s.student_code ASC")->fetchAll();
        $records = $pdo->query("SELECT r.*, s.name as student_name, s.nickname as student_nickname, s.student_code, sch.school_name 
                                FROM visit_records r 
                                JOIN students s ON r.student_id = s.id 
                                LEFT JOIN schools sch ON r.smiss_code = sch.smiss_code 
                                ORDER BY r.created_at DESC")->fetchAll();
        $schoolsList = $pdo->query("SELECT * FROM schools ORDER BY smiss_code ASC")->fetchAll();
        $pendingSchools = $pdo->query("SELECT * FROM schools WHERE status = 'pending' ORDER BY created_at DESC")->fetchAll();
        $pendingUsers = $pdo->query("SELECT u.*, sch.school_name FROM users u JOIN schools sch ON u.smiss_code = sch.smiss_code WHERE u.status = 'pending' ORDER BY u.created_at DESC")->fetchAll();
        
        $schoolsStats = $pdo->query("
            SELECT 
                sch.*,
                (SELECT COUNT(*) FROM students stu WHERE stu.smiss_code = sch.smiss_code) as total_students,
                (SELECT COUNT(*) FROM users u WHERE u.smiss_code = sch.smiss_code) as total_users,
                (SELECT COUNT(*) FROM users u WHERE u.smiss_code = sch.smiss_code AND u.role = 'school_admin') as total_admins,
                (SELECT COUNT(*) FROM visit_records vr WHERE vr.smiss_code = sch.smiss_code) as total_visits
            FROM schools sch
            ORDER BY sch.smiss_code ASC
        ")->fetchAll();
        
        $allUsersInSchools = $pdo->query("
            SELECT u.*, sch.school_name 
            FROM users u 
            LEFT JOIN schools sch ON u.smiss_code = sch.smiss_code 
            WHERE u.role != 'super_admin' 
            ORDER BY sch.school_name ASC, u.role DESC, u.full_name ASC
        ")->fetchAll();
    } elseif ($userRole === 'school_admin') {
        $stmtStr = $pdo->prepare("SELECT * FROM students WHERE smiss_code = ? ORDER BY student_code ASC");
        $stmtStr->execute([$userSmiss]);
        $students = $stmtStr->fetchAll();
        
        $stmtRec = $pdo->prepare("SELECT r.*, s.name as student_name, s.nickname as student_nickname, s.student_code 
                                  FROM visit_records r 
                                  JOIN students s ON r.student_id = s.id 
                                  WHERE r.smiss_code = ? 
                                  ORDER BY r.created_at DESC");
        $stmtRec->execute([$userSmiss]);
        $records = $stmtRec->fetchAll();
        
        $stmtT = $pdo->prepare("SELECT * FROM users WHERE smiss_code = ? AND role = 'teacher' ORDER BY status ASC, created_at DESC");
        $stmtT->execute([$userSmiss]);
        $teachersList = $stmtT->fetchAll();
    } elseif ($userRole === 'teacher') {
        $stmtStr = $pdo->prepare("SELECT * FROM students WHERE smiss_code = ? AND grade = ? AND room = ? ORDER BY student_code ASC");
        $stmtStr->execute([$userSmiss, $userGrade, $userRoom]);
        $students = $stmtStr->fetchAll();
        
        $stmtRec = $pdo->prepare("SELECT r.*, s.name as student_name, s.nickname as student_nickname, s.student_code 
                                  FROM visit_records r 
                                  JOIN students s ON r.student_id = s.id 
                                  WHERE r.smiss_code = ? AND s.grade = ? AND s.room = ? 
                                  ORDER BY r.created_at DESC");
        $stmtRec->execute([$userSmiss, $userGrade, $userRoom]);
        $records = $stmtRec->fetchAll();
    }
}

// Fetch all approved schools for teacher signup selector
$allApprovedSchools = $pdo->query("SELECT * FROM schools WHERE status = 'approved' ORDER BY school_name ASC")->fetchAll();

// Database Fetch All Checklists (global task markers)
$checklists = $pdo->query("SELECT * FROM checklist ORDER BY id ASC")->fetchAll();

// Fetch current school info if logged in
$currentSchool = null;
if ($userSmiss) {
    $stmtSch = $pdo->prepare("SELECT * FROM schools WHERE smiss_code = ?");
    $stmtSch->execute([$userSmiss]);
    $currentSchool = $stmtSch->fetch();
}

// Determine Page section
$page = isset($_GET['page']) ? $_GET['page'] : 'dashboard';
if ($page === 'dashboard' && $userRole === 'super_admin') {
    $page = 'super_dashboard';
}

// Security guards for page access
if (!$userId) {
    // Force to login state
    $page = 'login';
} else {
    if ($page === 'super_dashboard' && $userRole !== 'super_admin') { $page = 'dashboard'; }
    if ($page === 'schools_list' && $userRole !== 'super_admin') { $page = 'dashboard'; }
    if ($page === 'teachers_mgmt' && $userRole !== 'school_admin') { $page = 'dashboard'; }
    if ($page === 'school_settings' && $userRole !== 'school_admin') { $page = 'dashboard'; }
    if ($page === 'visit-form' && $userRole !== 'teacher') { $page = 'students'; }
    if ($page === 'checklist' && $userRole === 'super_admin') { $page = 'super_dashboard'; }
}

if (isset($_GET['msg'])) {
    $msg = $_GET['msg'];
    $msgType = 'success';
}
?>

<!DOCTYPE html>
<html lang="th" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ระบบเยี่ยมบ้านอัจฉริยะ (PHP + MySQL)</title>
    <!-- CSS / Typography -->
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400&family=Anuphan:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Tailwind CSS Dynamic Integration -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Lucide icons via CDN -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Sarabun', 'Anuphan', 'sans-serif'],
                        sarabun: ['Sarabun', 'sans-serif'],
                    },
                    colors: {
                        slate: {
                            850: '#1e293b',
                            950: '#0f172a',
                        },
                        emerald: {
                            550: '#059669',
                            750: '#047857',
                        }
                    }
                }
            }
        }
    </script>
    <style>
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(148,163,184,0.3);
            border-radius: 9px;
        }
        @media print {
            body { background: white !important; font-size: 10px; }
            .print\:hidden { display: none !important; }
            .print\:shadow-none { box-shadow: none !important; }
            .print\:border-none { border: none !important; }
            .print\:p-0 { padding: 0 !important; }
        }
    </style>
</head>
<body class="bg-[#f8fafc] text-slate-800 min-h-screen flex flex-col font-sans select-none antialiased relative">

    <!-- A. ANONYMOUS GUEST VISITOR PORTAL -->
    <?php if ($page === 'login'): ?>
    <div class="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-[#f1f5f9] relative" style="background-image: radial-gradient(circle at top right, rgba(16,185,129,0.06), transparent 50%), radial-gradient(circle at bottom left, rgba(79,70,229,0.06), transparent 50%)">
        <div class="max-w-xl w-full space-y-6">
            <!-- Header Brand logo -->
            <div class="text-center space-y-2">
                <div class="inline-flex items-center gap-2 bg-slate-900 text-white p-3.5 px-6 rounded-2xl font-extrabold text-xs tracking-widest shadow-xl">
                    <span class="text-emerald-400">★</span> SCHOOLOS STUDENT CARE
                </div>
                <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">ระบบจัดสรรและคัดกรองเยี่ยมบ้านนักเรียนไทย</h1>
                <p class="text-xs text-slate-400 font-bold max-w-sm mx-auto">ระบบเยี่ยมบ้านสัญจรปันน้ำใจ แบบบูรณาการ นร.01 คัดกรองรายครัวเรือนสำหรับกลุ่มโรงเรียน</p>
            </div>

            <!-- Global dynamic alert banner -->
            <?php if (!empty($msg)): ?>
                <div class="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-indigo-900 shadow">
                    <i data-lucide="info" class="w-4 h-4 text-indigo-700 shrink-0"></i>
                    <span><?= htmlspecialchars($msg) ?></span>
                </div>
            <?php endif; ?>

            <!-- Switch Tab control -->
            <div class="bg-white border rounded-2xl p-1.5 flex gap-1 shadow-sm font-sans">
                <button type="button" id="btn-tab-login" onclick="switchAuthTab('login')" class="flex-1 py-2 rounded-xl text-[11px] font-black transition bg-slate-900 text-white shadow-sm">
                    <i data-lucide="log-in" class="w-3.5 h-3.5 inline-block mr-1"></i> เข้าใช้งานสัญจร
                </button>
                <button type="button" id="btn-tab-school" onclick="switchAuthTab('school')" class="flex-1 py-2 rounded-xl text-[11px] font-black text-slate-500 hover:bg-slate-100 transition">
                    <i data-lucide="building-2" class="w-3.5 h-3.5 inline-block mr-1"></i> ขอเปิดสิทธิ์โรงเรียน
                </button>
                <button type="button" id="btn-tab-teacher" onclick="switchAuthTab('teacher')" class="flex-1 py-2 rounded-xl text-[11px] font-black text-slate-500 hover:bg-slate-100 transition">
                    <i data-lucide="user-plus" class="w-3.5 h-3.5 inline-block mr-1"></i> สมัครครูที่ปรึกษา
                </button>
            </div>

            <!-- Frame Card wrapper Container -->
            <div class="bg-white border rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden font-sans">
                
                <!-- TAB A: SECURE LOGIN -->
                <div id="auth-tab-login" class="space-y-6">
                    <form action="index.php?action=login" method="POST" id="login-form" class="space-y-4 text-xs font-semibold">
                        <div>
                            <label class="block mb-1 text-slate-700 font-bold">ชื่อรหัสบัญชีผู้เข้าใช้งาน (Username) *</label>
                            <input type="text" name="username" id="login-username" required placeholder="เช่น superadmin, schooladmin, teacher1" class="w-full border p-3 rounded-xl bg-slate-50 font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none">
                        </div>
                        <div>
                            <label class="block mb-1 text-slate-700 font-bold">รหัสผ่านลับ (Password) *</label>
                            <input type="password" name="password" id="login-password" required placeholder="กรอกรหัสผ่านประจำตัว" class="w-full border p-3 rounded-xl bg-slate-50 font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none">
                        </div>
                        <button type="submit" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-xl transition shadow-lg text-xs tracking-wider">
                            ยืนยันความปลอดภัยเพื่อก้าวเข้าสู่ระบบ
                        </button>
                    </form>

                    <!-- QUICK DEMO LOGINS SHORTCUTS -->
                    <div class="pt-4 border-t border-dashed">
                        <span class="text-[9.5px] text-slate-400 font-black uppercase tracking-wider block mb-2.5 text-center">★ ทางลัดเข้าใช้งานบัญชีสาธิต (Quick Demo Login in 1-Click) ★</span>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button type="button" onclick="quickLogin('superadmin', 'password123')" class="p-2.5 bg-slate-50 border hover:bg-emerald-50 hover:border-emerald-250 rounded-xl text-left transition duration-200">
                                <span class="font-extrabold text-[10px] block text-slate-900">1. แอดมินจังหวัด</span>
                                <span class="text-[9px] text-slate-500 block mt-0.5 font-bold">Super Admin</span>
                            </button>
                            <button type="button" onclick="quickLogin('schooladmin', 'password123')" class="p-2.5 bg-slate-50 border hover:bg-indigo-50 hover:border-indigo-200 rounded-xl text-left transition duration-200">
                                <span class="font-extrabold text-[10px] block text-indigo-950">2. แอดมินโรงเรียน</span>
                                <span class="text-[9px] text-slate-500 block mt-0.5 font-bold">School Admin</span>
                            </button>
                            <button type="button" onclick="quickLogin('teacher1', 'password123')" class="p-2.5 bg-slate-50 border hover:bg-emerald-50 hover:border-emerald-250 rounded-xl text-left transition duration-200">
                                <span class="font-extrabold text-[10px] block text-emerald-950">3. ที่ปรึกษา ม.3/2</span>
                                <span class="text-[9px] text-slate-500 block mt-0.5 font-bold">Teacher</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- TAB B: REQUEST TO ADD SCHOOL -->
                <div id="auth-tab-school" class="hidden space-y-4">
                    <div class="bg-indigo-50 border border-indigo-150 p-3.5 rounded-xl text-[10px] font-bold text-indigo-950 leading-relaxed">
                        ⚡ สพฐ. แนะนำใช้รหัส SMISS 8 หลักให้ถูกต้อง เพื่อให้ระบบระเบียนจำพิกัดละติจูดและแยกขอบเขตนักเรียนของท่านได้อย่างแม่นยำ
                    </div>
                    <form action="index.php?action=register_school" method="POST" class="space-y-3.5 text-xs font-semibold">
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block mb-1 text-slate-700 font-bold">รหัส SMISS 8 หลัก *</label>
                                <input type="text" name="smiss_code" required maxLength="8" placeholder="เช่น 10123459" class="w-full border p-2.5 rounded-xl bg-slate-50 font-bold">
                            </div>
                            <div>
                                <label class="block mb-1 text-slate-700 font-bold">ชื่อสถาบันศึกษา/โรงเรียน *</label>
                                <input type="text" name="school_name" required placeholder="โรงเรียนสี่คิ้วปันราษฎร์" class="w-full border p-2.5 rounded-xl bg-slate-50">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block mb-1 text-slate-700 font-bold">อำเภอ/เขต *</label>
                                <input type="text" name="district" required placeholder="เมือง" class="w-full border p-2.5 rounded-xl bg-slate-50">
                            </div>
                            <div>
                                <label class="block mb-1 text-slate-700 font-bold">จังหวัด *</label>
                                <input type="text" name="province" required placeholder="นครราชสีมา" class="w-full border p-2.5 rounded-xl bg-slate-50">
                            </div>
                        </div>
                        <div>
                            <label class="block mb-1 text-slate-700 font-bold">ชื่อ-สกุล ผู้อำนวยการโรงเรียน_เพื่อเซ็นเยี่ยม *</label>
                            <input type="text" name="director_name" required placeholder="นายกิตติคุณ มั่นสมหมาย" class="w-full border p-2.5 rounded-xl bg-slate-50">
                        </div>
                        
                        <div class="pt-3 border-t border-dashed space-y-3">
                            <span class="block text-[10px] text-indigo-900 font-bold uppercase tracking-wider">บัญชีดูแลโรงเรียนที่ต้องการขอสร้างใหม่ (School Admin Account)</span>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block mb-1 text-slate-700 font-bold">ผู้ใช้ล็อกอิน (Username) *</label>
                                    <input type="text" name="username" required placeholder="เช่น login_admin" class="w-full border p-2 rounded-xl bg-slate-50">
                                </div>
                                <div>
                                    <label class="block mb-1 text-slate-700 font-bold">รหัสผ่านเข้าใช้ *</label>
                                    <input type="password" name="password" required placeholder="กรอกรหัสผ่านลับ" class="w-full border p-2 rounded-xl bg-slate-50">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block mb-1 text-slate-700 font-bold">ชื่อจริงของผู้ประสานงานหลัก *</label>
                                    <input type="text" name="full_name" required placeholder="อาจารย์สมศรี พุทธรักษา" class="w-full border p-2 rounded-xl bg-slate-50">
                                </div>
                                <div>
                                    <label class="block mb-1 text-slate-700 font-bold">เบอร์โทรศัพท์มือถือที่สามารถติดต่อ *</label>
                                    <input type="text" name="phone" required placeholder="08XXXXXXXX" class="w-full border p-2 rounded-xl bg-slate-50">
                                </div>
                            </div>
                        </div>

                        <button type="submit" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl transition shadow">
                            ยืนยันส่งคำร้องและเปิดสโมสรโรงเรียน
                        </button>
                    </form>
                </div>

                <!-- TAB C: NEW TEACHER INDUCTION LIST -->
                <div id="auth-tab-teacher" class="hidden space-y-4">
                    <?php if (count($allApprovedSchools) === 0): ?>
                        <div class="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center text-xs font-bold text-amber-900 space-y-2">
                            <span class="text-2xl block">⚠</span>
                            <p>ขณะนี้ไม่มีข้อมูลโรงเรียนใดๆ เครือข่ายที่พร้อมให้บริการเปิดสมัครครูในระบบขณะนี้!</p>
                            <p class="text-[10px] text-slate-400 font-normal">กรุณาเข้าใช้งาน Super Admin เพื่ออนุมัติโรงเรียนเครือข่ายก่อน</p>
                        </div>
                    <?php else: ?>
                        <form action="index.php?action=register_teacher" method="POST" class="space-y-3.5 text-xs font-semibold">
                            <div>
                                <label class="block mb-1 text-slate-700 font-bold">เลือกโรงเรียนร่วมต้นสังกัดท่าน *</label>
                                <select name="smiss_code" required class="w-full border p-2.5 rounded-xl bg-slate-50 text-slate-800 font-bold">
                                    <?php foreach ($allApprovedSchools as $sch): ?>
                                        <option value="<?= $sch['smiss_code'] ?>"><?= htmlspecialchars($sch['school_name']) ?> (<?= htmlspecialchars($sch['smiss_code']) ?>)</option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block mb-1 text-slate-700 font-bold">รหัสเรียกชื่อคุณครู (Username) *</label>
                                    <input type="text" name="username" required placeholder="เช่น krupreecha" class="w-full border p-2 rounded-xl bg-slate-50">
                                </div>
                                <div>
                                    <label class="block mb-1 text-slate-700 font-bold">สร้างรหัสผ่านลับ *</label>
                                    <input type="password" name="password" required placeholder="กรอกรหัสประจำครู" class="w-full border p-2 rounded-xl bg-slate-50">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block mb-1 text-slate-700 font-bold">ชื่อจริงของตัวคุณครูผู้ประเมิน *</label>
                                    <input type="text" name="full_name" required placeholder="คุณครูปรีชา ปัญญาสว่าง" class="w-full border p-2 rounded-xl bg-slate-50">
                                </div>
                                <div>
                                    <label class="block mb-1 text-slate-700 font-bold">เบอร์โทรติดต่อคุณครู *</label>
                                    <input type="text" name="phone" required placeholder="08XXXXXXXX" class="w-full border p-2 rounded-xl bg-slate-50">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block mb-1 text-slate-700 font-bold">ระดับชั้นศึกษาที่ปรึกษา (เช่น ม.1, ม.2) *</label>
                                    <input type="text" name="assigned_grade" required placeholder="ม.3" class="w-full border p-2 rounded-xl bg-slate-50 text-center font-bold">
                                </div>
                                <div>
                                    <label class="block mb-1 text-slate-700 font-bold">ประจำห้องเลขที (เช่น 1, 2) *</label>
                                    <input type="text" name="assigned_room" required placeholder="2" class="w-full border p-2 rounded-xl bg-slate-50 text-center font-bold">
                                </div>
                            </div>
                            <button type="submit" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-xl transition shadow">
                                ส่งรายละเอียดเพื่อขออนุมัติใช้งาน
                            </button>
                        </form>
                    <?php endif; ?>
                </div>

            </div>
        </div>
    </div>

    <script>
        function switchAuthTab(tabId) {
            document.getElementById('auth-tab-login').classList.add('hidden');
            document.getElementById('auth-tab-school').classList.add('hidden');
            document.getElementById('auth-tab-teacher').classList.add('hidden');
            
            document.getElementById('btn-tab-login').className = "flex-1 py-2 rounded-xl text-[11px] font-black text-slate-500 hover:bg-slate-100 transition";
            document.getElementById('btn-tab-school').className = "flex-1 py-2 rounded-xl text-[11px] font-black text-slate-500 hover:bg-slate-100 transition";
            document.getElementById('btn-tab-teacher').className = "flex-1 py-2 rounded-xl text-[11px] font-black text-slate-500 hover:bg-slate-100 transition";
            
            if (tabId === 'login') {
                document.getElementById('auth-tab-login').classList.remove('hidden');
                document.getElementById('btn-tab-login').className = "flex-1 py-2 rounded-xl text-[11px] font-black transition bg-slate-900 text-white shadow-sm";
            } else if (tabId === 'school') {
                document.getElementById('auth-tab-school').classList.remove('hidden');
                document.getElementById('btn-tab-school').className = "flex-1 py-2 rounded-xl text-[11px] font-black transition bg-slate-900 text-white shadow-sm";
            } else if (tabId === 'teacher') {
                document.getElementById('auth-tab-teacher').classList.remove('hidden');
                document.getElementById('btn-tab-teacher').className = "flex-1 py-2 rounded-xl text-[11px] font-black transition bg-slate-900 text-white shadow-sm";
            }
        }
        function quickLogin(u, p) {
            document.getElementById('login-username').value = u;
            document.getElementById('login-password').value = p;
            document.getElementById('login-form').submit();
        }
    </script>
    <footer class="bg-white/40 border-t py-4 text-center text-[10px] text-slate-400 font-semibold w-full mt-auto">
        สัญจรปันน้ำใจ • พัฒนาระเบียบการบูรณาการข้อมูลเยี่ยมบ้านคัดกรองอัจฉริยะกลุ่มโรงเรียนสัญจร
    </footer>

    <!-- B. SIGNED-IN AUTHENTICATED WORKSPACES CONTAINER -->
    <?php else: ?>

    <?php if ($page !== 'print-record'): ?>
    <!-- Top Banner header area (Only show if not in pure print view) -->
    <header class="bg-white/40 backdrop-blur-xl border-b border-white/50 py-3.5 px-6 sm:px-10 flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden relative z-10 w-full animate-fade">
        <div class="flex items-center gap-2.5">
            <div class="bg-slate-900 text-white rounded-xl p-2.5 px-4 font-bold text-xs tracking-wider shadow-md">
                SchoolOS Student Care
            </div>
            <div>
                <h1 class="text-base font-extrabold text-slate-850 flex items-center gap-1.5 leading-tight">
                    ระบบสารสนเทศเยี่ยมบ้านนักเรียนกลุ่มโรงเรียน 
                    <?php if ($userRole === 'super_admin'): ?>
                        (ระบบดูแลศูนย์กลางกลุ่มโรงเรียนทั้งหมด)
                    <?php else: ?>
                        (โรงเรียน<?= htmlspecialchars($currentSchool ? $currentSchool['school_name'] : 'โรงเรียนบ้านหนองหว้า') ?>)
                    <?php endif; ?>
                </h1>
                <p class="text-[10px] text-slate-400 mt-0.5 font-bold flex items-center gap-1.5">
                    <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    เชื่อมต่อฐานข้อมูลระบบสัญจรผ่านเซิร์ฟเวอร์ MySQL บนระบบเครือข่ายเรียบร้อยดี
                </p>
            </div>
        </div>

        <div class="flex items-center gap-3 bg-white/70 border border-slate-200/80 p-1.5 px-4 rounded-2xl shadow-sm text-xs print:hidden">
            <div class="text-right">
                <span class="block font-black text-slate-800 leading-none"><?= htmlspecialchars($userFullName) ?></span>
                <span class="text-[9px] bg-slate-150 px-1.5 py-0.5 rounded text-slate-600 font-bold inline-block mt-1">
                    ขอบข่าย: 
                    <?php if ($userRole === 'super_admin'): ?>
                        ผู้ดูแลระบบกลุ่มโรงเรียนทั้งหมด (Super Admin)
                    <?php elseif ($userRole === 'school_admin'): ?>
                        แอดมินประจำสถาบันศึกษา
                    <?php else: ?>
                        ครูประจำชั้น (ม.<?= htmlspecialchars($userGrade ?: '-') ?>/<?= htmlspecialchars($userRoom ?: '-') ?>)
                    <?php endif; ?>
                </span>
            </div>
            <a href="index.php?action=logout" class="bg-rose-50 text-rose-700 hover:bg-rose-100 p-2 rounded-xl border border-rose-100 transition shadow-sm font-bold" title="ออกจากระบบ">
                <i data-lucide="log-out" class="w-4 h-4"></i>
            </a>
        </div>
    </header>

    <!-- Main Content Container with sidebar -->
    <div class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6 relative z-10">
        
        <!-- Navigation Menu -->
        <aside class="lg:col-span-1 space-y-4 print:hidden">
            <div class="bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 p-4 space-y-1 shadow-xs">
                <?php if ($userRole === 'super_admin'): ?>
                    <a href="index.php?page=super_dashboard" class="w-full flex items-center gap-3 p-3 text-xs font-semibold rounded-xl text-left transition <?= $page === 'super_dashboard' ? 'bg-slate-850 text-white shadow-md' : 'text-slate-600 hover:bg-white/60' ?>">
                        <i data-lucide="layout-dashboard" class="w-4 h-4 text-emerald-400"></i>
                        แผงควบคุมหลัก
                    </a>
                    <a href="index.php?page=schools_list" class="w-full flex items-center gap-3 p-3 text-xs font-semibold rounded-xl text-left transition <?= $page === 'schools_list' ? 'bg-slate-850 text-white shadow-md' : 'text-slate-600 hover:bg-white/60' ?>">
                        <i data-lucide="building-2" class="w-4 h-4 text-emerald-400"></i>
                        การอนุมัติ
                    </a>
                <?php else: ?>
                    <a href="index.php?page=dashboard" class="w-full flex items-center gap-3 p-3 text-xs font-semibold rounded-xl text-left transition <?= $page === 'dashboard' ? 'bg-slate-850 text-white shadow-md' : 'text-slate-600 hover:bg-white/60' ?>">
                        <i data-lucide="home" class="w-4 h-4 text-emerald-400"></i>
                        แผงควบคุมหลัก
                    </a>
                    <a href="index.php?page=students" class="w-full flex items-center gap-3 p-3 text-xs font-semibold rounded-xl text-left transition <?= $page === 'students' ? 'bg-slate-850 text-white shadow-md' : 'text-slate-600 hover:bg-white/60' ?>">
                        <i data-lucide="users" class="w-4 h-4 text-slate-400"></i>
                        ทำเนียบนักเรียน (<?= count($students) ?>)
                    </a>
                    <?php if ($userRole === 'teacher'): ?>
                        <a href="index.php?page=visit-form" class="w-full flex items-center gap-3 p-3 text-xs font-semibold rounded-xl text-left transition <?= $page === 'visit-form' ? 'bg-slate-850 text-white shadow-md' : 'text-slate-600 hover:bg-white/60' ?>">
                            <i data-lucide="file-text" class="w-4 h-4 text-slate-400"></i>
                            บันทึกเยี่ยมหลักใหม่
                        </a>
                    <?php endif; ?>
                    <a href="index.php?page=records" class="w-full flex items-center gap-3 p-3 text-xs font-semibold rounded-xl text-left transition <?= $page === 'records' ? 'bg-slate-850 text-white shadow-md' : 'text-slate-600 hover:bg-white/60' ?>">
                        <i data-lucide="book-open" class="w-4 h-4 text-slate-400"></i>
                        รายงานพรีเมียร์ นร.01
                    </a>
                    <?php if ($userRole === 'school_admin'): ?>
                        <a href="index.php?page=teachers_mgmt" class="w-full flex items-center gap-3 p-3 text-xs font-semibold rounded-xl text-left transition <?= $page === 'teachers_mgmt' ? 'bg-slate-850 text-white shadow-md' : 'text-slate-600 hover:bg-white/60' ?>">
                            <i data-lucide="user-cog" class="w-4 h-4 text-slate-400"></i>
                            อนุมัติคุณครู/ผู้ใช้งาน (<?= count($teachersList) ?>)
                        </a>
                        <a href="index.php?page=school_settings" class="w-full flex items-center gap-3 p-3 text-xs font-semibold rounded-xl text-left transition <?= $page === 'school_settings' ? 'bg-slate-850 text-white shadow-md' : 'text-slate-650 hover:bg-white/60' ?>">
                            <i data-lucide="settings" class="w-4 h-4 text-slate-400"></i>
                            ตั้งค่าสิทธิ์โรงเรียน
                        </a>
                    <?php endif; ?>
                    <?php if ($userRole === 'teacher'): ?>
                        <a href="index.php?page=checklist" class="w-full flex items-center gap-3 p-3 text-xs font-semibold rounded-xl text-left transition <?= $page === 'checklist' ? 'bg-slate-850 text-white shadow-md' : 'text-slate-600 hover:bg-white/60' ?>">
                            <i data-lucide="list-todo" class="w-4 h-4 text-slate-400"></i>
                            ภารกิจครูผู้เยือน
                        </a>
                    <?php endif; ?>
                <?php endif; ?>
            </div>

            <!-- Server Environment widget info -->
            <div class="bg-indigo-950 text-slate-200 p-4.5 rounded-2xl border border-white/10 shadow-lg">
                <p class="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <i data-lucide="server" class="w-3.5 h-3.5 animate-pulse"></i> กำลังรันแบบ PHP
                </p>
                <p class="text-[11px] leading-relaxed text-indigo-200">
                    โปรแกรมหน้าต่างนี้ขับเคลื่อนด้วย PHP ข้อมูลอัปเดตลงตาราง MySQL ทันที เหมาะสำหรับอัปโหลดไปไว้ในระบบเครือข่ายภายในโรงเรียน
                </p>
            </div>
        </aside>

        <!-- Main Workspace routing switch -->
        <main class="lg:col-span-4 space-y-6">

            <!-- Message Alert -->
            <?php if (!empty($msg)): ?>
                <div class="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex items-center justify-between text-xs font-bold text-indigo-800 shadow-sm">
                    <div class="flex items-center gap-2">
                        <i data-lucide="check-circle" class="w-4 h-4 text-indigo-600"></i>
                        <span><?= htmlspecialchars($msg) ?></span>
                    </div>
                </div>
            <?php endif; ?>

            <!-- SUPER ADMIN DASHBOARD -->
            <?php if ($page === 'super_dashboard'): ?>
                <div class="space-y-6">
                    <div class="flex justify-between items-center">
                        <div>
                            <h2 class="text-base font-bold text-slate-850">ศูนย์รวมสถิติข้อมูลและการเข้าเยี่ยมบ้านกลุ่มเครือข่ายโรงเรียน</h2>
                            <p class="text-xs text-slate-400">ติดตามยอดสะสมการเข้าใช้งาน ระบบคัดกรอง นร.01 แต่ละสถาบันการศึกษาแบบ Real-time</p>
                        </div>
                    </div>

                    <!-- Summary Stats Blocks -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div class="p-4 bg-white/70 border rounded-2xl shadow-xs text-center">
                            <span class="text-slate-400 text-[10px] font-bold block uppercase mb-1">สถาบันการศึกษาทั้งหมด</span>
                            <strong class="text-3xl text-slate-850 font-extrabold"><?= count($schoolsStats) ?></strong> แห่ง
                        </div>
                        <div class="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl shadow-xs text-center">
                            <span class="text-indigo-600 text-[10px] font-bold block uppercase mb-1">ยอดรวมตรวจเยี่ยมบ้าน</span>
                            <?php 
                            $totalVisits = 0; 
                            foreach ($schoolsStats as $ss) $totalVisits += $ss['total_visits'];
                            ?>
                            <strong class="text-3xl text-indigo-800 font-extrabold"><?= $totalVisits ?></strong> ครั้ง
                        </div>
                        <div class="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl shadow-xs text-center">
                            <span class="text-emerald-600 text-[10px] font-bold block uppercase mb-1">จำนวนผู้ใช้งานในระบบ</span>
                            <?php 
                            $totalUsers = 0; 
                            foreach ($schoolsStats as $ss) $totalUsers += $ss['total_users'];
                            ?>
                            <strong class="text-3xl text-emerald-850 font-extrabold"><?= $totalUsers ?></strong> ราย
                        </div>
                        <div class="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl shadow-xs text-center">
                            <span class="text-amber-600 text-[10px] font-bold block uppercase mb-1">เป้าหมายนักเรียนทั้งหมด</span>
                            <strong class="text-3xl text-amber-800 font-extrabold"><?= count($students) ?></strong> คน
                        </div>
                    </div>

                    <!-- Schools stats Table -->
                    <div class="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-6 shadow-sm">
                        <h3 class="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                            <i data-lucide="bar-chart-2" class="w-4 h-4 text-indigo-500"></i>
                            ตารางเปรียบเทียบสถิติการใช้งานรายสถาบันการศึกษา
                        </h3>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr class="border-b border-slate-200 text-slate-400 font-bold">
                                        <th class="py-3 px-4">รหัส SMISS</th>
                                        <th class="py-3 px-4">ชื่อสถานศึกษา</th>
                                        <th class="py-3 px-4 text-center">จำนวนครู/แอดมิน</th>
                                        <th class="py-3 px-4 text-center">เป้าหมายนักเรียน</th>
                                        <th class="py-3 px-4 text-center">ความคืบหน้าเยี่ยมบ้าน (ครั้ง)</th>
                                        <th class="py-3 px-4 text-center">อัตราส่วนเสร็จสิ้น</th>
                                        <th class="py-3 px-4 text-right">สถานะระบบ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($schoolsStats as $sch): ?>
                                        <tr class="border-b border-slate-100 hover:bg-white/40 transition">
                                            <td class="py-3.5 px-4 font-mono font-bold text-slate-600"><?= htmlspecialchars($sch['smiss_code']) ?></td>
                                            <td class="py-3.5 px-4">
                                                <div class="font-bold text-slate-850"><?= htmlspecialchars($sch['school_name']) ?></div>
                                                <div class="text-[10px] text-slate-400"><?= htmlspecialchars($sch['district'] . ' • ' . $sch['province']) ?></div>
                                            </td>
                                            <td class="py-3.5 px-4 text-center font-semibold text-slate-700"><?= $sch['total_users'] ?> คน</td>
                                            <td class="py-3.5 px-4 text-center font-semibold text-slate-700"><?= $sch['total_students'] ?> ราย</td>
                                            <td class="py-3.5 px-4 text-center font-mono">
                                                <span class="inline-block py-0.5 px-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-800 font-bold">
                                                    <?= $sch['total_visits'] ?> ครั้ง
                                                </span>
                                            </td>
                                            <td class="py-3.5 px-4 text-center">
                                                <?php 
                                                $rate = $sch['total_students'] > 0 ? round(($sch['total_visits'] / $sch['total_students']) * 105) : 0; 
                                                $rate = min($rate, 100); // Caps at 100%
                                                ?>
                                                <div class="flex items-center justify-center gap-1.5">
                                                    <div class="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                        <div class="bg-indigo-500 h-full" style="width: <?= $rate ?>%"></div>
                                                    </div>
                                                    <span class="font-bold text-[10px] text-slate-700"><?= $rate ?>%</span>
                                                </div>
                                            </td>
                                            <td class="py-3.5 px-4 text-right">
                                                <?php if ($sch['status'] === 'approved'): ?>
                                                    <span class="bg-emerald-50 text-emerald-800 border border-emerald-250 py-0.5 px-2 rounded-md font-bold text-[10px]">
                                                        ACTIVE
                                                    </span>
                                                <?php else: ?>
                                                    <span class="bg-amber-50 text-amber-700 border border-amber-250 py-0.5 px-2 rounded-md font-bold text-[10px] animate-pulse">
                                                        PENDING
                                                    </span>
                                                <?php endif; ?>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            <!-- SCHOOLS AND ADMIN MANAGEMENT PAGE -->
            <?php elseif ($page === 'schools_list'): ?>
                <div class="space-y-6">
                    <div>
                        <h2 class="text-base font-bold text-slate-850">จัดการอนุมัติโรงเรียนเครือข่าย & บุคลากร</h2>
                        <p class="text-xs text-slate-400">พิจารณาใบขอจดทะเบียนใช้งานรวมถึงกำหนดระดับสิทธิ์ให้คุณครูขึ้นทำหน้าที่ แอดมินโรงเรียนประจำสถาบันได้ด้วยตนเอง</p>
                    </div>

                    <!-- 1. School Approvals -->
                    <div class="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-6 shadow-sm space-y-4">
                        <span class="text-xs bg-slate-150 py-1 px-3 rounded-xl font-bold text-slate-600 block w-max uppercase tracking-wider">
                            ส่วนตรวจสอบจดทะเบียนกลุ่มโรงเรียน
                        </span>
                        <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <i data-lucide="building" class="w-4 h-4 text-emerald-500"></i>
                            คำขอใบจดทะเบียนเปิดระบบโรงเรียนใหม่ (รอการพิจารณา)
                        </h3>
                        <?php if (count($pendingSchools) === 0): ?>
                            <div class="p-6 text-center border border-dashed rounded-2xl bg-white/70 text-slate-400 text-xs font-semibold">
                                ปัจจุบันไม่มีสถาบันโรงเรียนที่ยื่นคำขอเปิดสิทธิ์ใหม่ในสัญญาสัญจรกลุ่มนี้
                            </div>
                        <?php else: ?>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <?php foreach ($pendingSchools as $psch): ?>
                                    <div class="bg-white/70 border p-4.5 rounded-2xl flex flex-col justify-between hover:shadow-md transition gap-3">
                                        <div class="space-y-1">
                                            <div class="flex items-center gap-2">
                                                <span class="bg-amber-100 text-amber-800 font-mono font-bold text-[9px] px-2 py-0.5 rounded">SMISS: <?= htmlspecialchars($psch['smiss_code']) ?></span>
                                                <span class="text-[9px] text-slate-400 font-bold"><?= htmlspecialchars($psch['district'] . ' • ' . $psch['province']) ?></span>
                                            </div>
                                            <h4 class="text-xs font-bold text-slate-850"><?= htmlspecialchars($psch['school_name']) ?></h4>
                                            <p class="text-[10px] text-slate-500">ผอ.โรงเรียน: <?= htmlspecialchars($psch['director_name'] ?: 'ไม่ระบุ') ?></p>
                                        </div>
                                        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100/60">
                                            <a href="index.php?action=reject_school&smiss_code=<?= $psch['smiss_code'] ?>" class="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] py-1.5 px-3 rounded-lg border border-rose-100 transition" onclick="return confirm('คุณแน่ใจหรือไม่ว่าต้องการอนุมัติปฏิเสธคำขอของโรงเรียนนี้ และลบประวัติพิกัดทั้งปวง?')">
                                                ปฏิเสธ
                                            </a>
                                            <a href="index.php?action=approve_school&smiss_code=<?= $psch['smiss_code'] ?>" class="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] py-1.5 px-4 rounded-lg shadow-xs transition">
                                                อนุมัติเปิดระบบ
                                            </a>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>

                    <!-- 2. Manage Users, Appoint roles & Approvals -->
                    <div class="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-6 shadow-sm space-y-4">
                        <span class="text-xs bg-slate-150 py-1 px-3 rounded-xl font-bold text-slate-600 block w-max uppercase tracking-wider">
                            แต่งตั้งจัดวางกำลังพลโรงเรียน
                        </span>
                        <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <i data-lucide="user-check" class="w-4 h-4 text-indigo-500"></i>
                            ลงทะเบียนคุณครู & สิทธิ์ประจำระบบงานคัดกรอง นร.01
                        </h3>
                        
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr class="border-b border-slate-200 text-slate-400 font-bold">
                                        <th class="py-3 px-4">ชื่อผู้ส่งคำขอ</th>
                                        <th class="py-3 px-4">สังกัดภาระโรงเรียน</th>
                                        <th class="py-3 px-4">ชื่อบัญชีใช้งาน</th>
                                        <th class="py-3 px-4 text-center">ตำแหน่งปัจจุบัน</th>
                                        <th class="py-3 px-4 text-center">การอนุมัติ</th>
                                        <th class="py-3 px-4 text-right">สลับ/แต่งตั้ง Admin ประจำโรงเรียน</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($allUsersInSchools as $usr): ?>
                                        <tr class="border-b border-slate-100 hover:bg-white/40 transition">
                                            <td class="py-3 px-4">
                                                <div class="font-bold text-slate-850"><?= htmlspecialchars($usr['full_name']) ?></div>
                                                <div class="text-[10px] text-slate-500">โทร: <?= htmlspecialchars($usr['phone'] ?: 'ไม่มีเบอร์ติดต่อ') ?></div>
                                            </td>
                                            <td class="py-3 px-4">
                                                <div class="font-semibold text-slate-700"><?= htmlspecialchars($usr['school_name'] ?: 'ไม่ระบุโรงเรียน') ?></div>
                                                <div class="text-[9px] text-slate-400 font-mono">SMISS: <?= htmlspecialchars($usr['smiss_code']) ?></div>
                                            </td>
                                            <td class="py-3 px-4 font-mono font-bold text-slate-600"><?= htmlspecialchars($usr['username']) ?></td>
                                            <td class="py-3 px-4 text-center">
                                                <?php if ($usr['role'] === 'school_admin'): ?>
                                                    <span class="bg-violet-100 text-violet-800 border border-violet-200 py-0.5 px-2.5 rounded-full font-bold text-[9px] uppercase">
                                                        Admin โรงเรียน
                                                    </span>
                                                <?php else: ?>
                                                    <span class="bg-sky-50 text-sky-800 border border-sky-150 py-0.5 px-2.5 rounded-full font-bold text-[9px] uppercase">
                                                        ครูที่ปรึกษา
                                                    </span>
                                                <?php endif; ?>
                                            </td>
                                            <td class="py-3 px-4 text-center">
                                                <?php if ($usr['status'] === 'approved'): ?>
                                                    <span class="text-emerald-700 font-bold flex items-center justify-center gap-1">
                                                        <span class="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> เปิดใช้งาน
                                                    </span>
                                                <?php else: ?>
                                                    <span class="text-amber-600 font-bold flex items-center justify-center gap-1 animate-pulse">
                                                        <span class="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></span> รออนุมัติ
                                                    </span>
                                                <?php endif; ?>
                                            </td>
                                            <td class="py-3 px-4 text-right">
                                                <div class="flex justify-end gap-1.5">
                                                    <!-- Approve user if pending -->
                                                    <?php if ($usr['status'] !== 'approved'): ?>
                                                        <a href="index.php?action=approve_user_by_super&id=<?= $usr['id'] ?>" class="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] py-1.5 px-2.5 rounded-lg transition" title="อนุมัติการเข้าใช้งานระบบ">
                                                            อนุมัติ
                                                        </a>
                                                    <?php endif; ?>

                                                    <!-- Role appointments switch -->
                                                    <?php if ($usr['role'] === 'teacher'): ?>
                                                        <a href="index.php?action=make_school_admin&id=<?= $usr['id'] ?>" class="bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 font-bold text-[10px] py-1.5 px-2.5 rounded-lg transition" title="แต่งตั้งคุณครูคนนี้ขึ้นเป็น Admin ดูแลระบบของโรงเรียน">
                                                            👑 แต่งตั้งเป็น Admin
                                                        </a>
                                                    <?php else: ?>
                                                        <a href="index.php?action=make_teacher&id=<?= $usr['id'] ?>" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] py-1.5 px-2.5 rounded-lg transition border" title="เปลี่ยนสถานะจากแอดมินกลับมาเป็นคุณครูผู้ใช้ทั่วไป">
                                                            ลดกลับเป็นครู
                                                        </a>
                                                    <?php endif; ?>

                                                    <!-- Reject/Delete -->
                                                    <a href="index.php?action=reject_user_by_super&id=<?= $usr['id'] ?>" class="bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[10px] py-1.5 px-2 rounded-lg border border-rose-100 transition" onclick="return confirm('คุณยืนยันที่จะลบผู้ใช้นี้ออกจากฐานข้อมูลระบบสัญจรหรือไม่?')">
                                                        ลบผู้ใช้
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            <!-- 1. DASHBOARD PAGE -->
            <?php elseif ($page === 'dashboard'): ?>
                <div class="space-y-6">
                    <div class="bg-white/30 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div class="p-4 bg-white/70 rounded-2xl border shadow-sm text-center">
                            <span class="text-slate-400 text-[10px] font-bold block uppercase mb-1">นักเรียนในห้องทั้งหมด</span>
                            <strong class="text-3xl text-slate-850 font-extrabold"><?= count($students) ?></strong> คน
                        </div>
                        <div class="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-center">
                            <span class="text-emerald-600 text-[10px] font-bold block uppercase mb-1">ตรวจเยี่ยมสำเร็จแล้ว</span>
                            <?php
                            $visitedCount = 0;
                            foreach ($students as $st) { if ($st['visit_status'] === 'visited') $visitedCount++; }
                            ?>
                            <strong class="text-3xl text-emerald-800 font-extrabold"><?= $visitedCount ?></strong> ราย
                        </div>
                        <div class="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl text-center">
                            <span class="text-amber-600 text-[10px] font-bold block uppercase mb-1">อัตราความคืบหน้า</span>
                            <?php $perc = count($students) > 0 ? round(($visitedCount / count($students)) * 100) : 0; ?>
                            <strong class="text-3xl text-amber-800 font-extrabold"><?= $perc ?>%</strong> คืบหน้า
                        </div>
                        <div class="p-4 bg-rose-50/60 border border-rose-100 rounded-2xl text-center">
                            <span class="text-rose-600 text-[10px] font-bold block uppercase mb-1">ยังไม่ได้รายงานผล</span>
                            <strong class="text-3xl text-rose-800 font-extrabold"><?= count($students) - $visitedCount ?></strong> ราย
                        </div>
                    </div>

                    <!-- Students Quick Action Grid -->
                    <div class="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-6 shadow-sm">
                        <h3 class="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                            <i data-lucide="star" class="w-4 h-4 text-emerald-500"></i>
                            ทางลัดคัดกรองเยี่ยมบ้านนักเรียน ม.3/2 (รายหัว)
                        </h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <?php foreach ($students as $stu): ?>
                                <div class="bg-white/70 border p-4 rounded-2xl flex justify-between items-center hover:shadow-md transition">
                                    <div>
                                        <h4 class="text-xs font-bold text-slate-800"><?= htmlspecialchars($stu['prefix'] . $stu['name']) ?> (น้อง<?= htmlspecialchars($stu['nickname']) ?>)</h4>
                                        <p class="text-[10px] text-slate-400 mt-1">รหัสวิทยาการ: <?= htmlspecialchars($stu['student_code']) ?> • สภาพเยี่ยม: 
                                            <?php if ($stu['visit_status'] === 'visited'): ?>
                                                <span class="text-emerald-700 font-bold">✔ แฟ้มข้อมูลระดับความปลอดภัยดีที่เยี่ยมบ้าน</span>
                                            <?php else: ?>
                                                <span class="text-amber-600">รอดำเนินการคัดกรอง</span>
                                            <?php endif; ?>
                                        </p>
                                    </div>
                                    <div>
                                        <?php if ($stu['visit_status'] !== 'visited'): ?>
                                            <a href="index.php?page=visit-form&student_id=<?= $stu['id'] ?>" class="bg-slate-900 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg hover:bg-slate-700 transition block">
                                                ลงเยี่ยมบ้าน
                                            </a>
                                        <?php else: ?>
                                            <span class="text-emerald-600 text-xs font-bold flex items-center gap-1"><i data-lucide="check-circle" class="w-4 h-4"></i> เยี่ยมแล้ว</span>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>

            <!-- 2. STUDENTS LIST PAGE -->
            <?php elseif ($page === 'students'): ?>
                <div class="space-y-6">
                    <div class="flex justify-between items-center">
                        <div>
                            <h2 class="text-base font-bold text-slate-850">ฐานทำเนียบและทะเบียนข้อมูลนักเรียน</h2>
                            <p class="text-xs text-slate-400">ลงทะเบียนข้อมูลพื้นฐานเพื่อนำรังไปอิงระบบ นร.01</p>
                        </div>
                        <button onclick="document.getElementById('add-student-modal').classList.remove('hidden')" class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm">
                            <i data-lucide="plus-circle" class="w-4 h-4"></i> เพิ่มรายชื่อนักเรียนใหม่
                        </button>
                    </div>

                    <!-- Addition Student Modal (Simple toggle HTML design) -->
                    <div id="add-student-modal" class="hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div class="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl relative block border max-h-[85vh] overflow-y-auto custom-scrollbar">
                            <h3 class="font-extrabold text-sm mb-4">เพิ่มทำเนียบนร.01 ประถม/มัธยม</h3>
                            <form action="index.php?action=add_student" method="POST" class="space-y-3.5 text-xs">
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="block mb-1 text-slate-600 font-bold">รหัสนักเรียน สพฐ.</label>
                                        <input type="text" name="student_code" required class="w-full border p-2 rounded-xl bg-slate-50 focus:outline-emerald-500">
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-600 font-bold">เลขประจำตัวประชาชน</label>
                                        <input type="text" name="citizen_id" required class="w-full border p-2 rounded-xl bg-slate-50 focus:outline-emerald-500">
                                    </div>
                                </div>
                                <div class="grid grid-cols-3 gap-2">
                                    <div>
                                        <label class="block mb-1 text-slate-600 font-bold">คำนำหน้า</label>
                                        <select name="prefix" class="w-full border p-2 rounded-xl bg-slate-50 focus:outline-emerald-500">
                                            <option value="เด็กชาย">เด็กชาย</option>
                                            <option value="เด็กหญิง">เด็กหญิง</option>
                                            <option value="นาย">นาย</option>
                                            <option value="นางสาว">นางสาว</option>
                                        </select>
                                    </div>
                                    <div class="col-span-2">
                                        <label class="block mb-1 text-slate-600 font-bold">ชื่อ-นามสกุลนักเรียน</label>
                                        <input type="text" name="name" required class="w-full border p-2 rounded-xl bg-slate-50 focus:outline-emerald-500">
                                    </div>
                                </div>
                                <div class="grid grid-cols-3 gap-2">
                                    <div>
                                        <label class="block mb-1 text-slate-600 font-bold">ชื่อเล่น</label>
                                        <input type="text" name="nickname" required class="w-full border p-2 rounded-xl bg-slate-50">
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-600 font-bold">เพศ</label>
                                        <select name="gender" class="w-full border p-2 rounded-xl bg-slate-50">
                                            <option value="ชาย">ชาย</option>
                                            <option value="หญิง">หญิง</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-600 font-bold">ระดับชั้น</label>
                                        <input type="text" name="grade" value="ม.3/2" class="w-full border p-2 rounded-xl bg-slate-50">
                                    </div>
                                </div>
                                <div>
                                    <label class="block mb-1 text-slate-600 font-bold">ที่อยู่ตามบัตร/ทะเบียนบ้าน</label>
                                    <textarea name="address" required class="w-full border p-2 rounded-xl bg-slate-50 min-h-[50px]"></textarea>
                                </div>
                                <div class="border-t pt-3 flex justify-end gap-2">
                                    <button type="button" onclick="document.getElementById('add-student-modal').classList.add('hidden')" class="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition">ยกเลิก</button>
                                    <button type="submit" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition shadow">บันทึกรายตัว</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Students Table UI -->
                    <div class="bg-white/40 border border-white/60 backdrop-blur-md rounded-3xl p-6 shadow-xs overflow-hidden">
                        <div class="overflow-x-auto custom-scrollbar">
                            <table class="w-full text-left text-xs border-collapse">
                                <thead class="border-b bg-slate-100/50">
                                    <tr>
                                        <th class="p-3 font-semibold text-slate-700">รหัส สพฐ</th>
                                        <th class="p-3 font-semibold text-slate-700">ชื่อนักเรียน (ชื่อเล่น)</th>
                                        <th class="p-3 font-semibold text-slate-700">เลขประชาชน 13 หลัก</th>
                                        <th class="p-3 font-semibold text-slate-700">ระดับชั้น</th>
                                        <th class="p-3 font-semibold text-slate-700">สถานะบันทึก นร.01</th>
                                        <th class="p-3 font-semibold text-slate-700">ระดับเฝ้าระวัง</th>
                                        <th class="p-3 font-semibold text-slate-700">ปฏิบัติงาน</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-200/60 bg-white/30">
                                    <?php foreach ($students as $stu): ?>
                                        <tr class="hover:bg-white/60">
                                            <td class="p-3.5 font-bold text-slate-800"><?= htmlspecialchars($stu['student_code']) ?></td>
                                            <td class="p-3.5 font-bold text-slate-900"><?= htmlspecialchars($stu['prefix'] . $stu['name']) ?> (น้อง<?= htmlspecialchars($stu['nickname']) ?>)</td>
                                            <td class="p-3.5 font-mono text-slate-500"><?= htmlspecialchars($stu['citizen_id']) ?></td>
                                            <td class="p-3.5"><?= htmlspecialchars($stu['grade']) ?> (ห้อง <?= htmlspecialchars($stu['room']) ?>)</td>
                                            <td class="p-3.5">
                                                <?php if ($stu['visit_status'] === 'visited'): ?>
                                                    <span class="inline-block bg-emerald-50 border border-emerald-150 px-2.5 py-0.5 rounded text-emerald-800 font-extrabold text-[10px]">บันทึกข้อมูลแล้ว</span>
                                                <?php else: ?>
                                                    <span class="inline-block bg-slate-100 text-slate-400 px-2.5 py-0.5 rounded text-[10px] font-bold">เกสรเตรียมเยี่ยม</span>
                                                <?php endif; ?>
                                            </td>
                                            <td class="p-3.5">
                                                <?php if ($stu['risk_level'] === 'high'): ?>
                                                    <span class="inline-block bg-red-100 text-red-800 px-2 rounded-md font-bold text-[10px]">วิกฤต/ยากลำบาก</span>
                                                <?php elseif ($stu['risk_level'] === 'medium'): ?>
                                                    <span class="inline-block bg-amber-150 text-amber-900 px-2 rounded-md font-bold text-[10px]">ปานกลาง</span>
                                                <?php else: ?>
                                                    <span class="inline-block bg-emerald-100 text-emerald-800 px-2 rounded-md font-bold text-[10px]">ปกติ</span>
                                                <?php endif; ?>
                                            </td>
                                            <td class="p-3.5">
                                                <?php if ($stu['visit_status'] !== 'visited'): ?>
                                                    <a href="index.php?page=visit-form&student_id=<?= $stu['id'] ?>" class="bg-indigo-600 inline-block text-white font-bold py-1 px-3 rounded-lg hover:bg-indigo-700 transition">
                                                        ลงฟอร์ม นร.01
                                                    </a>
                                                <?php else: ?>
                                                    <span class="text-slate-400 italic font-medium">บันทึกสมบูรณ์</span>
                                                <?php endif; ?>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            <!-- 3. VISIT FORM PAGE -->
            <?php elseif ($page === 'visit-form'): ?>
                <?php
                $pre_student_id = isset($_GET['student_id']) ? $_GET['student_id'] : '';
                $selectedStu = null;
                if (!empty($pre_student_id)) {
                    foreach ($students as $stu) {
                        if ($stu['id'] === $pre_student_id) { $selectedStu = $stu; break; }
                    }
                }
                ?>
                <div class="space-y-6">
                    <div class="bg-white/40 border backdrop-blur-md rounded-3xl p-6 shadow-sm">
                        <div class="flex items-center justify-between border-b pb-4 mb-5">
                            <div>
                                <h2 class="text-base font-extrabold text-slate-850">แบบฟอร์มคัดกรอง สพฐ. นร.01 ฉบับพิมพ์บูรณาการ (กสศ.)</h2>
                                <p class="text-[10px] text-slate-400">กรุณากรอกข้อมูลตามรายงานเวียนเยี่ยมบ้านจริง เพื่อพิจารณาเงินอุดหนุนแบบมีเงื่อนไขรายหัว</p>
                            </div>
                        </div>

                        <!-- Main Big input Form using PDO -->
                        <form action="index.php?action=save_visit" method="POST" class="space-y-6 text-xs" onsubmit="return completeFormSubmit()">
                            <!-- Student Selector -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border p-4.5 rounded-2xl">
                                <div>
                                    <label class="block mb-1 text-slate-700 font-bold">เลือกนักเรียนที่ตรวจเยี่ยมบ้าน *</label>
                                    <select name="student_id" id="form-student-select" required class="w-full border p-2.5 rounded-xl bg-white focus:outline-emerald-500 test-select text-xs">
                                        <option value="">-- กรุณาเลือกรายชื่อนักเรียน --</option>
                                        <?php foreach ($students as $stu): ?>
                                            <option value="<?= $stu['id'] ?>" <?= $pre_student_id === $stu['id'] ? 'selected' : '' ?>><?= htmlspecialchars($stu['prefix'] . $stu['name']) ?> (ม.3/2)</option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                                <div>
                                    <label class="block mb-1 text-slate-700 font-bold">วันที่ตรวจเยี่ยมบ้าน *</label>
                                    <input type="text" name="visited_date" value="<?= date('Y-m-d') ?>" required class="w-full border p-2.5 rounded-xl bg-white">
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <label class="block mb-1 text-slate-700 font-bold">ภาคเรียน</label>
                                        <input type="text" name="semester" value="1" class="w-full border p-2.5 rounded-xl bg-white">
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-700 font-bold">ปีการศึกษา</label>
                                        <input type="text" name="school_year" value="2569" class="w-full border p-2.5 rounded-xl bg-white">
                                    </div>
                                </div>
                            </div>

                            <!-- ๑. ข้อมูลทั่วไปกาสิกร / การเข้าสัมภาษณ์ -->
                            <div class="space-y-4">
                                <h3 class="font-extrabold text-sm text-slate-800 border-l-4 border-slate-900 pl-2">๑. ข้อมูลผู้ให้สัมภาษณ์และสถานภาพสมรสผู้ปกครอง</h3>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-2xl bg-white/50">
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">ชื่อครูผู้ร่วมตรวจเยี่ยมหลัก</label>
                                        <input type="text" name="visitor_name" value="ครูสมศรี มีปัญญา" required class="w-full border p-2 rounded-xl bg-white">
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">ชื่อผู้ให้ข้อมูลสัมภาษณ์</label>
                                        <input type="text" name="informant_name" value="<?= $selectedStu ? htmlspecialchars($selectedStu['parent_name']) : '' ?>" required placeholder="เช่น นายประหยัด แก้วทอง" class="w-full border p-2 rounded-xl bg-white">
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">ความสัมพันธ์กับเด็ก</label>
                                        <select name="informant_relation" class="w-full border p-2 rounded-xl bg-white">
                                            <option value="บิดา">บิดา</option>
                                            <option value="มารดา">มารดา</option>
                                            <option value="ปู่ / ย่า / ตา / ยาย">ปู่ / ย่า / ตา / ยาย</option>
                                            <option value="พี่ป้าน้าอาอื่น">พี่ป้าน้าอาอื่น</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">สถานภาพสมรสผู้ปกครอง</label>
                                        <select name="family_status" class="w-full border p-2 rounded-xl bg-white">
                                            <option value="อยู่ร่วมกันมงคลสุข">อยู่ร่วมกันมงคลสุข</option>
                                            <option value="หย่าร้าง / แยกกันอยู่เชิงวิกฤต">หย่าร้าง / แยกกันอยู่เชิงวิกฤต</option>
                                            <option value="บิดามรณภาพ">บิดามรณภาพ</option>
                                            <option value="มารดามรณภาพ">มารดามรณภาพ</option>
                                            <option value="ละทิ้งไม่ติดต่อ">ละทิ้งไม่ติดต่อ</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">ปัจจุบันเด็กอาศัยร่วมกับ</label>
                                        <select name="living_with" class="w-full border p-2 rounded-xl bg-white">
                                            <option value="บิดาและมารดา">บิดาและมารดา</option>
                                            <option value="บิดาฝ่ายเดียว">บิดาฝ่ายเดียว</option>
                                            <option value="มารดาฝ่ายเดียว">มารดาฝ่ายเดียว</option>
                                            <option value="ปู่ยาตายาย">ปู่ยาตายาย</option>
                                            <option value="ญาติอุปถัมภ์พึ่งพิง">ญาติอุปถัมภ์พึ่งพิง</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">เบอร์โทรศัพท์ผู้ปกครองหลัก</label>
                                        <input type="text" name="guardian_phone" value="<?= $selectedStu ? htmlspecialchars($selectedStu['parent_phone']) : '' ?>" required class="w-full border p-2 rounded-xl bg-white">
                                    </div>
                                </div>
                            </div>

                            <!-- ๒. ข้อมูลผู้ปกครองที่เด็กพึ่งพิงหลัก -->
                            <div class="space-y-4">
                                <h3 class="font-extrabold text-sm text-slate-800 border-l-4 border-slate-900 pl-2">๒. รายละเอียดผู้ปกครองที่เด็กพึ่งพาหลักสวัสดิการ</h3>
                                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 border p-4 rounded-2xl bg-white/50">
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">ชื่อ-นามสกุล ผู้ปกครอง</label>
                                        <input type="text" name="guardian_name" value="<?= $selectedStu ? htmlspecialchars($selectedStu['parent_name']) : '' ?>" required class="w-full border p-2 rounded-xl bg-white">
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">ความสัมพันธ์กับเด็ก</label>
                                        <input type="text" name="guardian_relation" value="<?= $selectedStu ? htmlspecialchars($selectedStu['parent_relation']) : 'มารดา' ?>" required class="w-full border p-2 rounded-xl bg-white">
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">เลขประจําตัว 13 หลัก</label>
                                        <input type="text" name="guardian_citizen_id" required placeholder="12003xxxxxxxx" class="w-full border p-2 rounded-xl bg-white">
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">อาชีพหลัก</label>
                                        <input type="text" name="guardian_job" value="<?= $selectedStu ? htmlspecialchars($selectedStu['parent_job']) : 'เกษตรกร' ?>" required class="w-full border p-2 rounded-xl bg-white">
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">การศึกษาผู้ปกครองสูงสุด</label>
                                        <select name="guardian_education" class="w-full border p-2 rounded-xl bg-white">
                                            <option value="ไม่ได้เรียนหนังสือ">ไม่ได้เรียนหนังสือ</option>
                                            <option value="ประถมศึกษาตอนปลาย">ประถมศึกษาตอนปลาย</option>
                                            <option value="มัธยมศึกษาตอนต้น">มัธยมศึกษาตอนต้น</option>
                                            <option value="มัธยมศึกษาตอนปลาย / ปวช">มัธยมศึกษาตอนปลาย / ปวช</option>
                                            <option value="ปริญญาตรีขึ้นไป">ปริญญาตรีขึ้นไป</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">บัตรสวัสดิการแห่งรัฐ</label>
                                        <select name="state_welfare" class="w-full border p-2 rounded-xl bg-white">
                                            <option value="ได้สิทธิ์รับสวัสดิการรัฐหลัก">ได้สิทธิ์รับสวัสดิการรัฐหลัก</option>
                                            <option value="ไม่ได้สิทธิ์ / มีรายได้เกณฑ์ปกติ">ไม่ได้สิทธิ์ / มีรายได้เกณฑ์ปกติ</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">จำนวนสมาชิกครัวเรือนทั้งหมด (คน)</label>
                                        <input type="number" name="total_members" id="form-total-members" value="3" required class="w-full border p-2 rounded-xl bg-white" onchange="adjustHouseholdTableRows(this.value)">
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">ระดับสิทธิ์ประเมินความเสี่ยง</label>
                                        <select name="manual_risk_assessment" class="w-full border p-2.5 rounded-xl bg-white font-bold text-slate-900 border-amber-300">
                                            <option value="normal" class="text-emerald-700">ปกติปลอดภัยดี</option>
                                            <option value="medium" class="text-amber-700">ปานกลาง (คอยเฝ้าระวัง)</option>
                                            <option value="high" class="text-red-800">สูง (วิกฤตฐานะยากไร้)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- ๓. HOUSEHOLD MEMBERS TABLE STATEMENTS -->
                            <div class="space-y-4">
                                <div class="flex justify-between items-center">
                                    <h3 class="font-extrabold text-sm text-slate-800 border-l-4 border-slate-900 pl-2">๓. สมาชิกครัวเรือนทั้งหมดรายหัวบัญชีและรายได้เฉลี่ย</h3>
                                    <div class="text-[11px] font-bold text-indigo-900 bg-indigo-50 border p-1 px-2 rounded-lg" id="household-tracker">
                                        รายได้เฉลี่ยสมาชิกรายบุคคล: <span id="label-avg-perhead" class="text-xs text-indigo-750">0.00</span> บาท/คน/เดือน
                                    </div>
                                </div>
                                <div class="border rounded-2xl overflow-hidden bg-white">
                                    <table class="w-full text-left font-sans whitespace-nowrap">
                                        <thead class="bg-slate-150 border-b">
                                            <tr>
                                                <th class="p-3 border-r text-slate-700">ลำดับที่</th>
                                                <th class="p-3 border-r text-slate-700">ชื่อ-นามสกุล สมาชิกครัวเรือน</th>
                                                <th class="p-3 border-r text-slate-700">ความสัมพันธ์เด็ก</th>
                                                <th class="p-3 border-r text-slate-700">รหัสประชาชน 13 หลัก</th>
                                                <th class="p-3 border-r text-slate-700">อายุ (ปี)</th>
                                                <th class="p-3 text-slate-700 text-right">รายรับต่อเดือนเต็มเม็ด (บาท)</th>
                                            </tr>
                                        </thead>
                                        <tbody id="household-table-body" class="divide-y text-slate-700">
                                            <!-- Dynamically initialized via JS to match total_members input -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- ๔. PHYSICAL INFRASTRUCTURE HOUSING -->
                            <div class="space-y-4">
                                <h3 class="font-extrabold text-sm text-slate-800 border-l-4 border-slate-900 pl-2">๔. ลักษณะสิ่งแวดล้อมทางกายภาพและโครงสร้างที่ดิน</h3>
                                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 border p-4 rounded-2xl bg-white/50">
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">กรรมสิทธิ์ครอบครองบ้าน</label>
                                        <select name="house_ownership" class="w-full border p-2 rounded-xl bg-white">
                                            <option value="อยู่บ้านตนเองปลอดภาระ">อยู่บ้านตนเองปลอดภาระ</option>
                                            <option value="เป็นบ้านส่วนรวม/ของเครือญาติพึ่งพา">เป็นบ้านส่วนรวม/ของเครือญาติพึ่งพา</option>
                                            <option value="เช่าอาศัยประการประหยัด">เช่าอาศัยประการประหยัด</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">ค่าเช่ากรณีเช่าบ้าน (บาท/เดือน)</label>
                                        <input type="number" name="monthly_rent" value="0" class="w-full border p-2 rounded-xl bg-white">
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">วัสดุรองพื้นบ่อนบ้าน</label>
                                        <select name="floor_material" class="w-full border p-2 rounded-xl bg-white">
                                            <option value="ปูนซิเมนต์ขรุขระ / ดินคลุกชื้น">ปูนซิเมนต์ขรุขระ / ดินคลุกชื้น</option>
                                            <option value="ไม้กระดานผุพังเป็นช่องลม">ไม้กระดานผุพังเป็นช่องลม</option>
                                            <option value="กระเบื้องปูเรียบสมบูรณ์ดี">กระเบื้องปูเรียบสมบูรณ์ดี</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">วัสดุผนังฉนวนบ้าน</label>
                                        <select name="wall_material" class="w-full border p-2 rounded-xl bg-white">
                                            <option value="ฝาสังกระสีเก่าส้นผุ / ไม้ระแนงตอกชั่">ฝาสังกระสีเก่าส้นผุ / ไม้ระแนงตอกชั่</option>
                                            <option value="ฝาก่ออิฐเปลือยไม่ฉาบ">ฝาก่ออิฐเปลือยไม่ฉาบ</option>
                                            <option value="ผนังไม้หรืออิฐสมบูรณ์มั่นคง">ผนังไม้หรืออิฐสมบูรณ์มั่นคง</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">วัสดุมุงหลังคาบ้าน</label>
                                        <select name="roof_material" class="w-full border p-2 rounded-xl bg-white">
                                            <option value="สังกะสีรั่วหลายจุด / ตองตึงแห้งผุ">สังกะสีรั่วหลายจุด / ตองตึงแห้งผุ</option>
                                            <option value="กระเบื้องลอนรั่วรั่วบ้าง">กระเบื้องลอนรั่วรั่วบ้าง</option>
                                            <option value="กระเบื้องลอนหนาแห้งสมบูรณ์">กระเบื้องลอนหนาแห้งสมบูรณ์</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">สถานะห้องน้ำในบ้าน</label>
                                        <select name="has_toilet" class="w-full border p-2 rounded-xl bg-white">
                                            <option value="มีห้องส้วมสุขลักษณะในตัวเรือน">มีห้องส้วมสุขลักษณะในตัวเรือน</option>
                                            <option value="ไม่มีห้องส้วม / แยกหลังทรุดโทรม">ไม่มีห้องส้วม / แยกหลังทรุดโทรม</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">ที่ดินเกษตรพึ่งพิง (จำนวนไร่)</label>
                                        <input type="number" name="farm_land" value="0" class="w-full border p-2 rounded-xl bg-white">
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">ไฟฟ้าและความสว่างสากล</label>
                                        <select name="electricity" class="w-full border p-2 rounded-xl bg-white">
                                            <option value="มีหม้อวัดไฟใช้ปกติเสรี">มีหม้อวัดไฟใช้ปกติเสรี</option>
                                            <option value="ต่อสายพ่วงจากเพื่อนบ้าน">ต่อสายพ่วงจากเพื่อนบ้าน</option>
                                            <option value="ไม่มีไฟฟ้าใช้หลักถาวร">ไม่มีไฟฟ้าใช้หลักถาวร</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- ๕. TRAVEL LOGISTICS -->
                            <div class="space-y-4">
                                <h3 class="font-extrabold text-sm text-slate-800 border-l-4 border-slate-900 pl-2">๕. แผนผังประชามติการเดินทางไปโรงเรียนหนทางเวียนตรวจ</h3>
                                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 border p-4 rounded-2xl bg-white/50">
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">วิธีการเดินทางสัญจรหลัก</label>
                                        <select name="travel_method" class="w-full border p-2 rounded-xl bg-white">
                                            <option value="รถจักรยานยนต์ส่วนตัว">รถจักรยานยนต์ส่วนตัว</option>
                                            <option value="เดินเท้าประปรดกรร">เดินเท้าประปรดกรร</option>
                                            <option value="รถตู้โรงเรียน/รับส่งท้องถิ่น">รถตู้โรงเรียน/รับส่งท้องถิ่น</option>
                                            <option value="รถโดยสารพึ่งสวัสดิการรวม">รถโดยสารพึ่งสวัสดิการรวม</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">ระยะทางไปกลับ (กม.)</label>
                                        <input type="number" name="travel_distance" value="5" class="w-full border p-2 rounded-xl bg-white">
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">ระยะเวลาที่ใช้เดินทาง (เช่น 30 นาที)</label>
                                        <input type="text" name="travel_time" value="20 นาที" class="w-full border p-2 rounded-xl bg-white">
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">ค่ายานพาหนะเดินทางต่อวัน (บาท)</label>
                                        <input type="number" name="travel_cost" value="20" class="w-full border p-2 rounded-xl bg-white">
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-slate-650 font-bold">เงินยังชีพเล่าเรียนที่ได้ต่อวัน (บาท)</label>
                                        <input type="number" name="daily_allowance" value="30" class="w-full border p-2 rounded-xl bg-white">
                                    </div>
                                    <div class="col-span-3">
                                        <label class="block mb-1 text-slate-650 font-bold">สภาพสถานที่เยี่ยมจริงพิกัดจริง</label>
                                        <input type="text" name="home_address" required value="บ้านหนองหว้า ต.หนองกี่ อ.หนองกี่ จ.บุรีรัมย์ 31210" class="w-full border p-2 rounded-xl bg-white">
                                    </div>
                                </div>
                            </div>

                            <!-- ๖. DIGITAL PHOTO capture simulation -->
                            <div class="space-y-4">
                                <h3 class="font-extrabold text-sm text-slate-800 border-l-4 border-slate-900 pl-2">๖. บันทึกภาพถ่าย สภาพแวดล้อมเพื่อพิสูจน์ นร.01</h3>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 border p-4.5 rounded-2xl bg-slate-50/50">
                                    
                                    <div class="space-y-1.5 text-center bg-white border p-3 rounded-2xl shadow-xs">
                                        <span class="font-bold text-slate-700 block">๑. รูปหน้าตรงสากลเด็กคาร์ส</span>
                                        <input type="file" id="photo-student" accept="image/*" class="hidden" onchange="readImageToForm(this, 'student_image_base64_val', 'student-img-preview')">
                                        <label for="photo-student" class="cursor-pointer block border border-dashed hover:bg-slate-50 p-6 rounded-xl flex items-center justify-center min-h-[100px]">
                                            <div id="student-img-preview" class="text-center font-bold text-slate-400">
                                                <i data-lucide="camera" class="w-6 h-6 mx-auto mb-1 text-slate-350"></i> อัปโหลดรูปนักเรียน
                                            </div>
                                        </label>
                                        <input type="hidden" name="student_image_base64" id="student_image_base64_val">
                                    </div>

                                    <div class="space-y-1.5 text-center bg-white border p-3 rounded-2xl shadow-xs">
                                        <span class="font-bold text-slate-700 block">๒. รูปบ้านฝั่งสภาพภายนอก</span>
                                        <input type="file" id="photo-outside" accept="image/*" class="hidden" onchange="readImageToForm(this, 'outside_image_base64_val', 'outside-img-preview')">
                                        <label for="photo-outside" class="cursor-pointer block border border-dashed hover:bg-slate-50 p-6 rounded-xl flex items-center justify-center min-h-[100px]">
                                            <div id="outside-img-preview" class="text-center font-bold text-slate-400">
                                                <i data-lucide="camera" class="w-6 h-6 mx-auto mb-1 text-slate-350"></i> อัปโหลดภาพนอกบ้าน
                                            </div>
                                        </label>
                                        <input type="hidden" name="outside_image_base64" id="outside_image_base64_val">
                                    </div>

                                    <div class="space-y-1.5 text-center bg-white border p-3 rounded-2xl shadow-xs">
                                        <span class="font-bold text-slate-700 block">๓. รูปสภาพเครื่องเรือนภายใน</span>
                                        <input type="file" id="photo-inside" accept="image/*" class="hidden" onchange="readImageToForm(this, 'inside_image_base64_val', 'inside-img-preview')">
                                        <label for="photo-inside" class="cursor-pointer block border border-dashed hover:bg-slate-50 p-6 rounded-xl flex items-center justify-center min-h-[100px]">
                                            <div id="inside-img-preview" class="text-center font-bold text-slate-400">
                                                <i data-lucide="camera" class="w-6 h-6 mx-auto mb-1 text-slate-350"></i> อัปโหลดภาพห้องในบ้าน
                                            </div>
                                        </label>
                                        <input type="hidden" name="inside_image_base64" id="inside_image_base64_val">
                                    </div>

                                </div>
                            </div>

                            <!-- ๗. DIGITAL SIGNATURE canvas draw-area sheets -->
                            <div class="space-y-4">
                                <h3 class="font-extrabold text-sm text-slate-800 border-l-4 border-slate-900 pl-2">๗. ลงชื่อลงประชามติดิจิทัลและลายเซ็น ๕ ฝ่าย</h3>
                                <div class="grid grid-cols-1 md:grid-cols-5 gap-4">

                                    <!-- Signature PAD for 3 primary roles: Student, Parent, Teacher -->
                                    <div class="bg-white border p-3 rounded-2xl shadow-xs text-center space-y-2">
                                        <span class="font-bold text-[10px] text-slate-500 uppercase block">๑. ลายเซ็นนักเรียน</span>
                                        <canvas id="sig-pad-student" class="border border-slate-200 rounded-lg w-full h-24 bg-slate-50 cursor-crosshair touch-none"></canvas>
                                        <div class="flex gap-1 justify-center">
                                            <button type="button" onclick="clearCanvas('sig-pad-student')" class="px-2 py-0.5 bg-slate-100 font-bold hover:bg-slate-200 text-[9px] rounded-md transition">ล้างจอ</button>
                                        </div>
                                        <input type="hidden" name="signature_student" id="sig-student-base64">
                                    </div>

                                    <div class="bg-white border p-3 rounded-2xl shadow-xs text-center space-y-2">
                                        <span class="font-bold text-[10px] text-slate-500 uppercase block">๒. ลายเซ็นผู้ปกครอง</span>
                                        <canvas id="sig-pad-parent" class="border border-slate-200 rounded-lg w-full h-24 bg-slate-50 cursor-crosshair touch-none"></canvas>
                                        <div class="flex gap-1 justify-center">
                                            <button type="button" onclick="clearCanvas('sig-pad-parent')" class="px-2 py-0.5 bg-slate-100 font-bold hover:bg-slate-200 text-[9px] rounded-md transition">ล้างจอ</button>
                                        </div>
                                        <input type="hidden" name="signature_parent" id="sig-parent-base64">
                                    </div>

                                    <div class="bg-white border p-3 rounded-2xl shadow-xs text-center space-y-2">
                                        <span class="font-bold text-[10px] text-slate-500 uppercase block">๓. ลายเซ็นครูประชั้น</span>
                                        <canvas id="sig-pad-teacher" class="border border-slate-200 rounded-lg w-full h-24 bg-slate-50 cursor-crosshair touch-none"></canvas>
                                        <div class="flex gap-1 justify-center">
                                            <button type="button" onclick="clearCanvas('sig-pad-teacher')" class="px-2 py-0.5 bg-slate-100 font-bold hover:bg-slate-200 text-[9px] rounded-md transition">ล้างจอ</button>
                                        </div>
                                        <input type="hidden" name="signature_teacher" id="sig-teacher-base64">
                                        <input type="text" name="teacher_name" value="ครูสมศรี มีปัญญา" class="w-full border p-1 rounded-md text-[10px] text-center font-bold">
                                    </div>

                                    <div class="bg-white border p-3 rounded-2xl shadow-xs text-center space-y-2">
                                        <span class="font-bold text-[10px] text-slate-500 uppercase block">๔. พยานส่วนรัฐ/ท้องถิ่น</span>
                                        <canvas id="sig-pad-gov" class="border border-slate-200 rounded-lg w-full h-24 bg-slate-50 cursor-crosshair touch-none"></canvas>
                                        <div class="flex gap-1 justify-center">
                                            <button type="button" onclick="clearCanvas('sig-pad-gov')" class="px-2 py-0.5 bg-slate-100 font-bold hover:bg-slate-200 text-[9px] rounded-md transition">ล้างจอ</button>
                                        </div>
                                        <input type="hidden" name="signature_gov" id="sig-gov-base64">
                                        <input type="text" name="gov_name" value="ผู้ใหญ่สมชาย แสนคำดี" class="w-full border p-1 rounded-md text-[10px] text-center font-bold">
                                        <input type="text" name="gov_position" value="พยานประเมินร่วมกัน" class="w-full border p-1 rounded-md text-[9px] text-slate-400 text-center font-semibold">
                                    </div>

                                    <div class="bg-white border p-3 rounded-2xl shadow-xs text-center space-y-2">
                                        <span class="font-bold text-[10px] text-slate-500 uppercase block">๕. ผู้อำนวยการอนุมัติ</span>
                                        <canvas id="sig-pad-director" class="border border-slate-200 rounded-lg w-full h-24 bg-slate-50 cursor-crosshair touch-none"></canvas>
                                        <div class="flex gap-1 justify-center">
                                            <button type="button" onclick="clearCanvas('sig-pad-director')" class="px-2 py-0.5 bg-slate-100 font-bold hover:bg-slate-200 text-[9px] rounded-md transition">ล้างจอ</button>
                                        </div>
                                        <input type="hidden" name="signature_director" id="sig-director-base64">
                                        <input type="text" name="director_name" value="นายณรงค์วิทย์ สุวรรณศรี" class="w-full border p-1 rounded-md text-[10px] text-center font-bold">
                                    </div>

                                </div>
                            </div>

                            <!-- Final submission action notes panel -->
                            <div class="bg-white p-4.5 border rounded-2xl space-y-3.5 shadow-sm">
                                <div>
                                    <label class="block mb-1 text-slate-700 font-bold">คำตัดสินใจช่วยเหลือของคณะกรรมการ/ครูบันทึก</label>
                                    <textarea name="manual_action_notes" placeholder="เช่น แนะนำช่วยจัดชุดทุนการศึกษาชุดละ 1,200.- นมโรงเรียน และติดต่อมูลนิธิอิ่มอร่อยย้อนหลังอย่างถาวร" class="w-full border p-2 rounded-xl bg-slate-50 min-h-[60px]"></textarea>
                                </div>
                                <div class="flex justify-end gap-2.5 pt-2">
                                    <a href="index.php?page=dashboard" class="px-5 py-2.5 bg-slate-150 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition">ปฏิเสธสัญจร</a>
                                    <button type="submit" class="px-7 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl transition shadow">บันทึกลงฐานข้อมูลและออกรายงานพิมพ์</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

            <!-- 4. VISIT HISTORY & PRINT RECORDS PAGE -->
            <?php elseif ($page === 'records'): ?>
                <div class="space-y-6">
                    <div class="bg-white/40 border backdrop-blur-md rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 class="text-base font-bold text-slate-850">ประวัติและข้อมูลสมบูรณ์รายงาน นร.01 / กสศ.</h2>
                            <p class="text-xs text-slate-400">พิมพ์ตราแบบฟอร์มคัดกรอง สพฐ นร.01 ออกรายงานร่วมมือ 5 ฝ่ายสมบูรณ์แบบ</p>
                        </div>
                    </div>

                    <?php if (count($records) === 0): ?>
                        <div class="bg-white/40 border border-white/60 backdrop-blur-md text-center py-16 rounded-3xl">
                            <span class="text-3xl block mb-2">📁</span>
                            <p class="text-sm font-bold text-slate-450">ยังไม่มีข้อมูลการเยี่ยมบ้านบันทึกเลย</p>
                            <p class="text-xs text-slate-400 mt-1">กรุณากลับไปลงบันทึกข้อมูลเยี่ยมบ้านใหม่ที่แท็บด้านข้างได้เลยครับ</p>
                        </div>
                    <?php else: ?>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <?php foreach ($records as $rec): ?>
                                <div class="bg-white/40 border border-white/60 backdrop-blur-md rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-white/80 transition-all">
                                    <div>
                                        <div class="flex justify-between items-start gap-2 mb-3">
                                            <div>
                                                <span class="text-[10px] text-slate-400 font-bold block">บันทึกเยี่ยมบ้าน: <?= htmlspecialchars($rec['visited_date']) ?></span>
                                                <h3 class="text-sm font-bold text-slate-800"><?= htmlspecialchars($rec['student_name']) ?> (น้อง<?= htmlspecialchars($rec['student_nickname']) ?>)</h3>
                                            </div>
                                            <span class="text-[9px] bg-rose-550 text-white font-extrabold px-2.5 py-1 rounded-lg border">
                                                ประเมิน: <?= $rec['manual_risk_assessment'] === 'high' ? 'วิกฤต/สูง' : ($rec['manual_risk_assessment'] === 'medium' ? 'เฝ้าระวัง' : 'ปกติ') ?>
                                            </span>
                                        </div>

                                        <div class="flex gap-4 border-b pb-3 mb-3">
                                            <div class="w-20 h-16 rounded-xl bg-slate-50 border overflow-hidden shrink-0 flex items-center justify-center">
                                                <?php if ($rec['student_image']): ?>
                                                    <img src="<?= htmlspecialchars($rec['student_image']) ?>" alt="Student image" class="w-full h-full object-cover">
                                                <?php else: ?>
                                                    <span class="text-[10px] text-slate-400 uppercase p-1 font-bold">ไม่มีรูป</span>
                                                <?php endif; ?>
                                            </div>
                                            <div class="text-xs text-slate-600 space-y-1">
                                                <p><strong class="text-slate-400">สถานภาพ:</strong> <?= htmlspecialchars($rec['family_status']) ?></p>
                                                <p><strong class="text-slate-400">ผู้ให้ข้อมูล:</strong> <?= htmlspecialchars($rec['informant_name']) ?> (<?= htmlspecialchars($rec['informant_relation']) ?>)</p>
                                                <p><strong class="text-slate-400">ทะเบียนบ้าน:</strong> <?= htmlspecialchars($rec['home_address']) ?></p>
                                            </div>
                                        </div>

                                        <div class="text-xs text-slate-600 line-clamp-2 italic leading-relaxed py-1">
                                            "<?= htmlspecialchars($rec['manual_action_notes'] ?: 'ไม่มีบันทึกโน้ตพิเศษเพิ่มตารางหลัง') ?>"
                                        </div>
                                    </div>

                                    <div class="mt-4 pt-3 border-t flex justify-end gap-2 text-xs">
                                        <a href="index.php?page=print-record&id=<?= $rec['id'] ?>" class="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl transition flex items-center gap-1.5 shadow">
                                            <i data-lucide="eye" class="w-3.5 h-3.5"></i> ตรวจสอบเพื่อออกรายงานพิมพ์ นร.01
                                        </a>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>

            <!-- 5. CHECKLIST TASK MANAGE PAGE -->
            <?php elseif ($page === 'checklist'): ?>
                <div class="space-y-6">
                    <div>
                        <h2 class="text-base font-bold text-slate-850">ภารกิจครูผู้เยือนเยี่ยมสัญจร</h2>
                        <p class="text-xs text-slate-400">ขั้นตอนสำคัญของการคัดกรองช่วยเหลือ นร.01 ให้ครบถ้วนสมบูรณ์</p>
                    </div>

                    <div class="bg-white/40 border border-white/60 backdrop-blur-md rounded-3xl p-6 shadow-xs space-y-4">
                        <?php foreach ($checklists as $chk): ?>
                            <div class="flex items-center justify-between p-3.5 rounded-2xl border transition bg-white/70">
                                <div class="flex items-center gap-3">
                                    <span class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] <?= $chk['completed'] ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-550' ?>">
                                        <?= $chk['completed'] ? '✔' : '!' ?>
                                    </span>
                                    <span class="text-xs font-bold text-slate-750 <?= $chk['completed'] ? 'line-through text-slate-400 font-medium' : '' ?>"><?= htmlspecialchars($chk['task']) ?></span>
                                </div>
                                <a href="index.php?action=toggle_checklist&id=<?= $chk['id'] ?>" class="text-[10px] font-bold px-3 py-1.5 rounded-lg <?= $chk['completed'] ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-emerald-750 text-white hover:bg-emerald-800' ?>">
                                    <?= $chk['completed'] ? 'ยกเลิก' : 'ทำเสร็จแล้ว' ?>
                                </a>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>

            <?php endif; ?>

        </main>
    </div>

    <!-- Footer of PHP application -->
    <footer class="bg-white/40 border-t py-4 text-center text-[10px] text-slate-400 font-semibold print:hidden mt-auto z-10 w-full">
        สัญจรปันน้ำใจ • ระบบสร้างขึ้นเพื่ออำนวยสิทธิ์ทางการศึกษาโรงเรียนและพึ่งพาฐานข้อมูล MySQL ทั่วไทย
    </footer>

    <?php endif; ?>

    <!-- 6. PRINT OFFICIAL FORM PAGE WRAPPER -->
    <?php if ($page === 'print-record' && isset($_GET['id'])): ?>
        <?php
        $print_id = $_GET['id'];
        $rec = null;
        foreach ($records as $r) {
            if ($r['id'] === $print_id) { $rec = $r; break; }
        }
        $stu = null;
        if ($rec) {
            foreach ($students as $s) {
                if ($s['id'] === $rec['student_id']) { $stu = $s; break; }
            }
        }

        if ($rec && $stu):
            // Calculate household income statistics for printing
            $household_members = $pdo->prepare("SELECT * FROM household_members WHERE visit_id = ?");
            $household_members->execute([$print_id]);
            $members = $household_members->fetchAll();
            
            $totalIncome = 0;
            foreach ($members as $mem) {
                $totalIncome += (float)$mem['total_income'];
            }
            $avgIncomePerHead = count($members) > 0 ? $totalIncome / count($members) : 0;
            $isQualifyKanasor = $avgIncomePerHead <= 3000;
        ?>
        <div class="bg-slate-150 min-h-screen py-6 px-4 md:px-0">
            <div class="max-w-4xl mx-auto bg-white border-2 border-slate-350 p-6 sm:p-12 shadow-2xl print:shadow-none print:border-none print:p-0 rounded-3xl print:rounded-none">
                
                <!-- Print control bar -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-dashed border-slate-300 print:hidden font-sans">
                    <a href="index.php?page=records" class="text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-2 bg-slate-100 hover:bg-slate-200 py-2 px-4 rounded-xl transition">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i> ย้อนกลับไปประวัติรายงาน
                    </a>
                    <button onclick="window.print()" class="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-5 rounded-xl transition flex items-center gap-2 shadow-lg">
                        <i data-lucide="printer" class="w-4 h-4"></i> สั่งพิมพ์แบบฟอร์ม (Print To PDF)
                    </button>
                </div>

                <!-- Printable document inside -->
                <div class="text-slate-900 font-sarabun leading-relaxed text-[11px] sm:text-xs space-y-6" style="font-family: 'Sarabun', sans-serif">
                     <!-- Header -->
                     <div class="text-center space-y-1.5 relative border-b-2 border-double border-slate-850 pb-4">
                          <div class="text-2xl">🎓</div>
                          <h1 class="font-bold text-sm sm:text-base tracking-tight text-slate-950 uppercase">
                              แบบบันทึกการเยี่ยมบ้านนักเรียน (ระดับ สพฐ. นร. 01 / กสศ.)
                          </h1>
                          <p class="text-[10px] sm:text-[11px] font-bold text-slate-600">
                              สังกัดสำนักงานเขตพื้นที่การศึกษาประถมศึกษาบุรีรัมย์ เขต 3 (โรงเรียนบ้านหนองหว้า อำเภอหนองกี่ จังหวัดบุรีรัมย์)
                          </p>
                          <p class="text-[9px] text-slate-500">
                              ภาคเรียนที่ <?= htmlspecialchars($rec['semester']) ?> ปีการศึกษา <?= htmlspecialchars($rec['school_year']) ?>
                          </p>
                     </div>

                     <!-- Logistical details -->
                     <div class="grid grid-cols-2 gap-4 bg-slate-50 border p-3 rounded-xl print:bg-white print:border-none">
                          <div>
                              <p><strong>ผู้บันทึกตรวจหลัก (ครูประจำชั้น):</strong> <?= htmlspecialchars($rec['visitor_name']) ?></p>
                              <p><strong>วันที่ตรวจเยี่ยมบ้าน:</strong> <?= htmlspecialchars($rec['visited_date']) ?></p>
                          </div>
                          <div class="text-right">
                              <p><strong>ผู้ให้สัมภาษณ์หลัก:</strong> <?= htmlspecialchars($rec['informant_name']) ?> (<?= htmlspecialchars($rec['informant_relation']) ?>)</p>
                              <?php if ($isQualifyKanasor): ?>
                                  <strong class="text-[10px] bg-red-100/80 border border-red-200 text-red-800 px-2 py-0.5 rounded-lg inline-block mt-1">
                                      ✔ เข้าเกณฑ์พิจารณารับเงินคัดกรองนักเรียนยากจน (รายได้ ≤ 3,000.-/คน)
                                  </strong>
                              <?php endif; ?>
                          </div>
                     </div>

                     <!-- ๑. STUDENT BIOMETRICS -->
                     <div class="space-y-2">
                          <h3 class="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-l-4 border-slate-900 pl-2">
                              ๑. ข้อมูลทั่วไปของตัวนักเรียน
                          </h3>
                          <div class="border border-slate-350 p-4 rounded-2xl bg-slate-50/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div class="space-y-1.5">
                                  <p><span class="text-slate-500 font-semibold">ชื่อ-นามสกุลนักเรียน:</span> <?= htmlspecialchars($stu['prefix'] . $stu['name']) ?> (น้อง<?= htmlspecialchars($stu['nickname']) ?>)</p>
                                  <p><span class="text-slate-500 font-semibold">วันเกิด:</span> <?= htmlspecialchars($stu['birth_date'] ?: '-') ?></p>
                                  <p><span class="text-slate-500 font-semibold">ระดับชั้นเรียน:</span> ชั้นปี <?= htmlspecialchars($stu['grade']) ?> (ห้องรุก <?= htmlspecialchars($stu['room'] ?: '2') ?>)</p>
                              </div>
                              <div class="space-y-1.5">
                                  <p><span class="text-slate-500 font-semibold">เลขบัตรประจำตัวประชาชน:</span> <?= htmlspecialchars($stu['citizen_id'] ?: '-') ?></p>
                                  <p><span class="text-slate-500 font-semibold">รหัสนักเรียน สพฐ.:</span> <?= htmlspecialchars($stu['student_code'] ?: '-') ?></p>
                                  <p><span class="text-slate-500 font-semibold">พิกัดแผนที่:</span> <?= $rec['latitude'] ? $rec['latitude'] . ', ' . $rec['longitude'] : 'ไม่ได้บันทึกพิกัด GPS' ?></p>
                              </div>
                          </div>
                     </div>

                     <!-- ๒. GUARDIAN STATUS -->
                     <div class="space-y-2">
                          <h3 class="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-l-4 border-slate-900 pl-2">
                              ๒. ข้อมูลสถานภาพและความรอบรับของผู้ปกครอง
                          </h3>
                          <div class="border border-slate-350 p-4 rounded-2xl space-y-3">
                              <div class="grid grid-cols-2 gap-4 border-b pb-2">
                                  <p><span class="text-slate-500 font-semibold">สถานภาพสมรสผู้ปกครอง:</span> <?= htmlspecialchars($rec['family_status']) ?></p>
                                  <p><span class="text-slate-500 font-semibold">ปัจจุบันอาศัยอยู่ร่วมกับ:</span> <?= htmlspecialchars($rec['living_with']) ?></p>
                              </div>
                              
                              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div class="space-y-1.5">
                                      <p><span class="text-slate-500 font-semibold">ผู้ปกครองที่เด็กพึ่งพิงหลัก:</span> <?= htmlspecialchars($rec['guardian_name']) ?></p>
                                      <p><span class="text-slate-500 font-semibold">ความสัมพันธ์กับเด็ก:</span> <?= htmlspecialchars($rec['guardian_relation']) ?></p>
                                      <p><span class="text-slate-500 font-semibold">เลขประจำตัวประชาชน:</span> <?= htmlspecialchars($rec['guardian_citizen_id']) ?></p>
                                  </div>
                                  <div class="space-y-1.5">
                                      <p><span class="text-slate-500 font-semibold">ระดับการศึกษาสูงสุด:</span> <?= htmlspecialchars($rec['guardian_education']) ?></p>
                                      <p><span class="text-slate-500 font-semibold">อาชีพหลักปัจจุบัน:</span> <?= htmlspecialchars($rec['guardian_job']) ?></p>
                                      <p><span class="text-slate-500 font-semibold">สิทธิ์การรับสวัสดิการภาครัฐหลัก:</span> <?= htmlspecialchars($rec['state_welfare']) ?></p>
                                  </div>
                              </div>
                          </div>
                     </div>

                     <!-- ๓. HOUSEHOLD MEMBERS TABLE STATEMENTS -->
                     <div class="space-y-2">
                          <h3 class="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-l-4 border-slate-900 pl-2">
                              ๓. รายชื่อสมาชิกในครัวเรือนทั้งหมดและบัญชีรายรับเฉลี่ย
                          </h3>
                          <div class="border border-slate-350 rounded-2xl overflow-hidden">
                              <table class="w-full text-left text-[11px] border-collapse bg-white whitespace-nowrap">
                                  <thead class="bg-slate-50 border-b">
                                      <tr>
                                          <th class="p-3 border-r font-bold text-slate-800">คนที่</th>
                                          <th class="p-3 border-r font-bold text-slate-800">ชื่อ - นามสกุล สมาชิก</th>
                                          <th class="p-3 border-r font-bold text-slate-800">ความสัมพันธ์กับเด็ก</th>
                                          <th class="p-3 border-r font-bold text-slate-800 text-center">รหัสบัตรประชาชน ๑๓ หลัก</th>
                                          <th class="p-3 border-r font-bold text-slate-800 text-center">อายุ (ปี)</th>
                                          <th class="p-3 font-bold text-slate-800 text-right">รายรับรวมต่อเดือน (บาท)</th>
                                      </tr>
                                  </thead>
                                  <tbody class="divide-y divide-slate-200">
                                      <?php if (count($members) > 0): ?>
                                          <?php foreach ($members as $idx => $member): ?>
                                              <tr>
                                                  <td class="p-2.5 border-r text-center font-bold text-slate-500"><?= $idx + 1 ?></td>
                                                  <td class="p-2.5 border-r font-medium"><?= htmlspecialchars($member['full_name']) ?></td>
                                                  <td class="p-2.5 border-r text-center font-medium"><?= htmlspecialchars($member['relation']) ?></td>
                                                  <td class="p-2.5 border-r text-center font-mono"><?= htmlspecialchars($member['citizen_id'] ?: '-') ?></td>
                                                  <td class="p-2.5 border-r text-center"><?= htmlspecialchars($member['age'] ?: '-') ?></td>
                                                  <td class="p-2.5 text-right font-semibold"><?= number_format($member['total_income']) ?></td>
                                              </tr>
                                          <?php endforeach; ?>
                                      <?php else: ?>
                                          <tr>
                                              <td colSpan="6" class="p-4 text-center text-slate-400 italic">ไม่มีข้อมูลสมาชิกครัวเรือนพิเศษ</td>
                                          </tr>
                                      <?php endif; ?>
                                  </tbody>
                                  <tfoot>
                                      <tr class="bg-slate-50/80 border-t font-bold">
                                          <td colSpan="4" class="p-3 text-right">รายได้รวมของสมาชิกในครัวเรือนต่อเดือน:</td>
                                          <td colSpan="2" class="p-3 text-right text-slate-900 border-l font-extrabold"><?= number_format($totalIncome) ?> บาท</td>
                                      </tr>
                                      <tr class="bg-indigo-50 font-bold">
                                          <td colSpan="4" class="p-3 text-right">รายได้เฉลี่ยต่อสมาชิกรายหัว (รายได้รวมหารจำนวนสมาชิก):</td>
                                          <td colSpan="2" class="p-3 text-right text-indigo-900 border-l font-extrabold"><?= number_format($avgIncomePerHead, 2) ?> บาท</td>
                                      </tr>
                                  </tfoot>
                              </table>
                          </div>
                     </div>

                     <!-- ๔. PHYSICAL INFRASTRUCTURE HOUSING -->
                     <div class="space-y-2">
                          <h3 class="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-l-4 border-slate-900 pl-2">
                              ๔. ลักษณะทางกายภาพของโครงสร้างอาคารที่อยู่อาศัย
                          </h3>
                          <div class="border border-slate-350 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div class="space-y-1.5">
                                  <p><strong>กรรมสิทธิ์ที่ดินบ้าน:</strong> <?= htmlspecialchars($rec['house_ownership']) ?></p>
                                  <?php if ($rec['monthly_rent'] > 0): ?>
                                      <p class="text-red-750"><strong>ค่าเช่าบ้านพักอาศัย:</strong> <?= number_format($rec['monthly_rent']) ?> บาท/เดือน</p>
                                  <?php endif; ?>
                                  <p><strong>วัสดุพื้นบ้านพัก:</strong> <?= htmlspecialchars($rec['floor_material']) ?></p>
                                  <p><strong>วัสดุฝาผนังบ้านพัก:</strong> <?= htmlspecialchars($rec['wall_material']) ?></p>
                              </div>
                              <div class="space-y-1.5">
                                  <p><strong>วัสดุมุงหลังคาบ้านพัก:</strong> <?= htmlspecialchars($rec['roof_material']) ?></p>
                                  <p><strong>ห้องส้วมในอาคาร:</strong> <?= htmlspecialchars($rec['has_toilet']) ?></p>
                                  <p><strong>ที่ดินทำการเกษตร:</strong> <?= $rec['farm_land'] > 0 ? $rec['farm_land'] . ' ไร่' : 'ไม่มีที่ดินทำเกษตร' ?></p>
                                  <p><strong>การใช้ไฟฟ้า/ยานพาหนะ:</strong> <?= htmlspecialchars($rec['electricity']) ?> • เครื่องใช้: <?= htmlspecialchars($rec['vehicles']) ?></p>
                              </div>
                          </div>
                     </div>

                     <!-- ๕. TRAVEL LOGISTICS -->
                     <div class="space-y-2">
                          <h3 class="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-l-4 border-slate-900 pl-2">
                              ๕. ข้อมูลจำลองการเดินทางสัญจรไปกลับโรงเรียน
                          </h3>
                          <div class="border border-slate-350 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div class="space-y-1.5">
                                  <p><strong>วิธีการเดินทางหลัก:</strong> <?= htmlspecialchars($rec['travel_method']) ?></p>
                                  <p><strong>ระยะทางไป-กลับ:</strong> <?= $rec['travel_distance'] ?> กิโลเมตร</p>
                                  <p><strong>ระยะเวลาเดินทาง:</strong> <?= htmlspecialchars($rec['travel_time']) ?></p>
                              </div>
                              <div class="space-y-1.5">
                                  <p><strong>ค่าใช้จ่ายยานพาหนะ:</strong> <?= number_format($rec['travel_cost']) ?> บาท/วัน</p>
                                  <p><strong>เบี้ยยังชียได้เรียนต่อวัน:</strong> <?= number_format($rec['daily_allowance']) ?> บาท/วัน</p>
                                  <p><strong>พิกัดสถานที่อยู่อาศัยจริง:</strong> <?= htmlspecialchars($rec['home_address']) ?></p>
                              </div>
                          </div>
                     </div>

                     <!-- ๖. DIGITAL PHOTO capture -->
                     <div class="space-y-2">
                          <h3 class="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-l-4 border-slate-900 pl-2">
                              ๖. รูปภาพบรรยากาศและสิ่งแวดล้อมประกอบ นร.01
                          </h3>
                          <div class="grid grid-cols-3 gap-4 border border-slate-350 p-4 rounded-2xl">
                               <div class="space-y-1.5 text-center">
                                    <span class="text-[10px] font-bold text-slate-800 block">๑. รูปหน้าตรงนักเรียน</span>
                                    <div class="border h-32 rounded-xl flex items-center justify-center overflow-hidden bg-white">
                                        <?php if ($rec['student_image']): ?>
                                            <img src="<?= htmlspecialchars($rec['student_image']) ?>" class="max-h-full max-w-full object-contain">
                                        <?php else: ?>
                                            <span class="text-[10px] text-slate-400 italic">ไม่มีรูปภาพ</span>
                                        <?php endif; ?>
                                    </div>
                               </div>
                               <div class="space-y-1.5 text-center">
                                    <span class="text-[10px] font-bold text-slate-800 block">๒. รูปภาพภายนอกบ้าน</span>
                                    <div class="border h-32 rounded-xl flex items-center justify-center overflow-hidden bg-white">
                                        <?php if ($rec['outside_image']): ?>
                                            <img src="<?= htmlspecialchars($rec['outside_image']) ?>" class="max-h-full max-w-full object-contain">
                                        <?php else: ?>
                                            <span class="text-[10px] text-slate-400 italic">ไม่มีรูปภาพ</span>
                                        <?php endif; ?>
                                    </div>
                               </div>
                               <div class="space-y-1.5 text-center">
                                    <span class="text-[10px] font-bold text-slate-800 block">๓. รูปภาพภายในห้องบ้าน</span>
                                    <div class="border h-32 rounded-xl flex items-center justify-center overflow-hidden bg-white">
                                        <?php if ($rec['inside_image']): ?>
                                            <img src="<?= htmlspecialchars($rec['inside_image']) ?>" class="max-h-full max-w-full object-contain">
                                        <?php else: ?>
                                            <span class="text-[10px] text-slate-400 italic">ไม่มีรูปภาพ</span>
                                        <?php endif; ?>
                                    </div>
                               </div>
                          </div>
                     </div>

                     <!-- ๗. SIGNATURES 5 PARTIES -->
                     <div class="space-y-2">
                          <h3 class="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-l-4 border-slate-900 pl-2">
                              ๗. การรับรองความถูกต้องของข้อมูล (ลงร่วมลงประชามติ ๕ ฝ่าย)
                          </h3>
                          <div class="border border-slate-350 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50/20">
                              
                               <div class="text-center space-y-2 border p-3 rounded-xl bg-white">
                                   <span class="text-[10px] text-slate-400 font-bold block">๑. ลงนาม (ตัวนักเรียน)</span>
                                   <div class="h-14 border rounded-lg flex items-center justify-center bg-slate-50/50">
                                       <?php if ($rec['signature_student']): ?>
                                           <img src="<?= htmlspecialchars($rec['signature_student']) ?>" class="max-h-full p-1">
                                       <?php else: ?>
                                           <span class="text-[10px] text-slate-300">..............................</span>
                                       <?php endif; ?>
                                   </div>
                                   <p class="text-[10px] font-bold">( <?= htmlspecialchars($stu['name']) ?> )</p>
                                   <p class="text-[9px] text-slate-450 font-semibold">ผู้รับทุนการศึกษาคัดกรอง</p>
                               </div>

                               <div class="text-center space-y-2 border p-3 rounded-xl bg-white">
                                   <span class="text-[10px] text-slate-400 font-bold block">๒. ลงนาม (ฝั่งครอบครัวผู้ปกครอง)</span>
                                   <div class="h-14 border rounded-lg flex items-center justify-center bg-slate-50/50">
                                       <?php if ($rec['signature_parent']): ?>
                                           <img src="<?= htmlspecialchars($rec['signature_parent']) ?>" class="max-h-full p-1">
                                       <?php else: ?>
                                           <span class="text-[10px] text-slate-300">..............................</span>
                                       <?php endif; ?>
                                   </div>
                                   <p class="text-[10px] font-bold">( <?= htmlspecialchars($rec['informant_name']) ?> )</p>
                                   <p class="text-[9px] text-slate-450 font-semibold">ผู้ให้ถ้อยคำเป็นจริง</p>
                               </div>

                               <div class="text-center space-y-2 border p-3 rounded-xl bg-white">
                                   <span class="text-[10px] text-slate-400 font-bold block">๓. ลงนาม (ครูผู้เป็นมิตรหลัก)</span>
                                   <div class="h-14 border rounded-lg flex items-center justify-center bg-slate-50/50">
                                       <?php if ($rec['signature_teacher']): ?>
                                           <img src="<?= htmlspecialchars($rec['signature_teacher']) ?>" class="max-h-full p-1">
                                       <?php else: ?>
                                           <span class="text-[10px] text-slate-300">..............................</span>
                                       <?php endif; ?>
                                   </div>
                                   <p class="text-[10px] font-bold">( <?= htmlspecialchars($rec['teacher_name']) ?> )</p>
                                   <p class="text-[9px] text-slate-450 font-semibold">ครูจดสัมภาษณ์และเดินทางเยี่ยมจริง</p>
                               </div>

                               <div class="text-center space-y-2 border p-3 rounded-xl bg-white">
                                   <span class="text-[10px] text-slate-400 font-bold block">๔. พยานส่วนท้องถิ่นรัฐ</span>
                                   <div class="h-14 border rounded-lg flex items-center justify-center bg-slate-50/50">
                                       <?php if ($rec['signature_gov']): ?>
                                           <img src="<?= htmlspecialchars($rec['signature_gov']) ?>" class="max-h-full p-1">
                                       <?php else: ?>
                                           <span class="text-[10px] text-slate-300">..............................</span>
                                       <?php endif; ?>
                                   </div>
                                   <p class="text-[10px] font-bold">( <?= htmlspecialchars($rec['gov_name']) ?> )</p>
                                   <p class="text-[9px] text-slate-450 font-semibold"><?= htmlspecialchars($rec['gov_position']) ?></p>
                               </div>

                               <div class="text-center space-y-2 border p-3 rounded-xl bg-white">
                                   <span class="text-[10px] text-slate-400 font-bold block">๕. ผู้อำนวยการโรงเรียน</span>
                                   <div class="h-14 border rounded-lg flex items-center justify-center bg-slate-50/50">
                                       <?php if ($rec['signature_director']): ?>
                                           <img src="<?= htmlspecialchars($rec['signature_director']) ?>" class="max-h-full p-1">
                                       <?php else: ?>
                                           <span class="text-[10px] text-slate-300">..............................</span>
                                       <?php endif; ?>
                                   </div>
                                   <p class="text-[10px] font-bold">( <?= htmlspecialchars($rec['director_name']) ?> )</p>
                                   <p class="text-[9px] text-slate-450 font-semibold">ประธานคณะอนุกรรมการศึกษาโรงเรียน</p>
                               </div>

                               <div class="text-center border p-3.5 rounded-xl bg-slate-50 flex flex-col justify-center items-center">
                                   <div class="w-10 h-10 rounded-full border-2 border-slate-350 border-dashed flex items-center justify-center font-bold text-slate-400 text-[13px]">ตรา</div>
                                   <span class="text-[9px] text-slate-550 font-bold mt-2 uppercase">ประทับตรายางสถาบันศึกษา</span>
                               </div>

                          </div>
                     </div>

                     <!-- ๘. AI & OBSERVATIONS SUMMARY -->
                     <div class="space-y-2">
                          <h3 class="font-extrabold text-xs text-indigo-900 border-l-4 border-indigo-650 pl-2">
                              ๘. ความเห็นฟื้นฟู สังเคราะห์ความลำบากและแนวทางช่วยเหลือโรงเรียน
                          </h3>
                          <div class="border border-indigo-150 p-4.5 rounded-2xl bg-indigo-50/10 space-y-3">
                              <p class="italic text-indigo-950 font-medium">" <?= htmlspecialchars($rec['ai_summary']) ?> "</p>
                              <?php
                              $strengths = json_decode($rec['ai_strengths'], true) ?: [];
                              $challenges = json_decode($rec['ai_challenges'], true) ?: [];
                              ?>
                              <div class="grid grid-cols-2 gap-4 pt-2 border-t">
                                  <div>
                                      <strong class="text-emerald-800 text-[10px]">✦ ข้อได้เปรียบประสงค์ดี:</strong>
                                      <ul class="list-disc pl-4 text-slate-600 mt-1 text-[10px] space-y-0.5">
                                          <?php foreach ($strengths as $str): ?><li><?= htmlspecialchars($str) ?></li><?php endforeach; ?>
                                      </ul>
                                  </div>
                                  <div>
                                      <strong class="text-rose-800 text-[10px]">✦ วิกฤตการณ์ประเด็นท้าทาย:</strong>
                                      <ul class="list-disc pl-4 text-slate-600 mt-1 text-[10px] space-y-0.5">
                                          <?php foreach ($challenges as $ch): ?><li><?= htmlspecialchars($ch) ?></li><?php endforeach; ?>
                                      </ul>
                                  </div>
                              </div>
                              <div class="border-t border-dashed pt-3 space-y-1">
                                  <strong>มติช่วยเหลือเร่งด่วน:</strong>
                                  <p class="bg-white p-2.5 rounded-lg border text-slate-700 italic">
                                      <?= htmlspecialchars($rec['manual_action_notes'] ?: 'จัดเข้าวาระการเยี่ยมของศูนย์วิเคราะห์คัดกรองเพื่อมอบเงินช่วยเหลือค่านมสตรีประจำตำบล') ?>
                                  </p>
                              </div>
                          </div>
                     </div>

                </div>
            </div>
        </div>
        <?php endif; ?>
    <?php endif; ?>

    <!-- Signature script Canvas controllers & Household dynamic inputs init -->
    <script>
        // Init Lucide
        lucide.createIcons();

        // 1. Dynamic household rows management
        function adjustHouseholdTableRows(totalCount) {
            const tbody = document.getElementById('household-table-body');
            if(!tbody) return;
            const currentRows = tbody.children.length;
            const targetCount = parseInt(totalCount) || 1;

            if (targetCount > currentRows) {
                // Add rows
                for(let i = currentRows; i < targetCount; i++) {
                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-slate-50/50';
                    tr.innerHTML = `
                        <td class="p-2.5 border-r text-center font-bold text-slate-500">${i + 1}</td>
                        <td class="p-2 border-r"><input type="text" name="members[${i}][full_name]" placeholder="ชื่อ-สกุล สมาชิก" class="w-full border p-1.5 rounded-lg focus:ring-1 focus:ring-emerald-500 text-xs"></td>
                        <td class="p-2 border-r">
                            <select name="members[${i}][relation]" class="w-full border p-1 rounded-lg text-xs bg-slate-50">
                                <option value="บิดา">บิดา</option>
                                <option value="มารดา">มารดา</option>
                                <option value="ปู่ยาตายาย">ปู่ยาตายาย</option>
                                <option value="พี่น้องร่วมคลาน">พี่น้องร่วมคลาน</option>
                                <option value="ญาติอุปถัมภ์พึ่งพา">ญาติอุปถัมภ์พึ่งพา</option>
                            </select>
                        </td>
                        <td class="p-2 border-r"><input type="text" name="members[${i}][citizen_id]" placeholder="13 หลัก" class="w-full border p-1.5 rounded-lg text-xs font-mono"></td>
                        <td class="p-2 border-r"><input type="number" name="members[${i}][age]" placeholder="อายุ" class="w-full border p-1.5 rounded-lg text-xs text-center"></td>
                        <td class="p-2"><input type="number" name="members[${i}][total_income]" placeholder="รายลัพธ์" class="w-full border p-1.5 rounded-lg text-xs text-right input-member-income" value="0" onchange="calculateAvgIncome()"></td>
                    `;
                    tbody.appendChild(tr);
                }
            } else if (targetCount < currentRows) {
                // Remove excess rows
                for(let i = currentRows - 1; i >= targetCount; i--) {
                    tbody.removeChild(tbody.children[i]);
                }
            }
            calculateAvgIncome();
        }

        // Calculate average personal income in household
        function calculateAvgIncome() {
            const inputs = document.querySelectorAll('.input-member-income');
            let total = 0;
            inputs.forEach(input => {
                total += parseFloat(input.value) || 0;
            });
            const memberCount = inputs.length || 1;
            const avg = total / memberCount;

            const avgText = document.getElementById('label-avg-perhead');
            if (avgText) {
                avgText.innerText = avg.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
        }

        // Initialize table on load
        adjustHouseholdTableRows(3);

        // 2. Read file to Base64
        function readImageToForm(input, hiddenId, previewId) {
            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById(hiddenId).value = e.target.result;
                const container = document.getElementById(previewId);
                container.innerHTML = `<img src="${e.target.result}" class="max-h-16 max-w-full rounded object-contain mx-auto">`;
            }
            reader.readAsDataURL(file);
        }

        // 3. Canvas signature controller script
        const signatureCanvasIds = ['sig-pad-student', 'sig-pad-parent', 'sig-pad-teacher', 'sig-pad-gov', 'sig-pad-director'];
        const signatureContexts = {};

        signatureCanvasIds.forEach(id => {
            const canvas = document.getElementById(id);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#000080'; // classic signature dark blue

            let drawing = false;

            function getMousePos(canvasDom, touchOrMouseEvent) {
                const rect = canvasDom.getBoundingClientRect();
                const clientX = touchOrMouseEvent.touches ? touchOrMouseEvent.touches[0].clientX : touchOrMouseEvent.clientX;
                const clientY = touchOrMouseEvent.touches ? touchOrMouseEvent.touches[0].clientY : touchOrMouseEvent.clientY;
                return {
                    x: clientX - rect.left,
                    y: clientY - rect.top
                };
            }

            canvas.addEventListener('mousedown', (e) => {
                drawing = true;
                const pos = getMousePos(canvas, e);
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
            });

            canvas.addEventListener('mousemove', (e) => {
                if (!drawing) return;
                const pos = getMousePos(canvas, e);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            });

            canvas.addEventListener('mouseup', () => { drawing = false; });
            canvas.addEventListener('mouseleave', () => { drawing = false; });

            // Mobile touch
            canvas.addEventListener('touchstart', (e) => {
                if (e.target === canvas) e.preventDefault();
                drawing = true;
                const pos = getMousePos(canvas, e);
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
            });
            canvas.addEventListener('touchmove', (e) => {
                if (e.target === canvas) e.preventDefault();
                if (!drawing) return;
                const pos = getMousePos(canvas, e);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            });
            canvas.addEventListener('touchend', (e) => { if (e.target === canvas) e.preventDefault(); drawing = false; });
        });

        function clearCanvas(id) {
            const canvas = document.getElementById(id);
            if(!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Export canvas drawings to hidden fields before posting form
        function completeFormSubmit() {
            const canvasMap = {
                'sig-pad-student': 'sig-student-base64',
                'sig-pad-parent': 'sig-parent-base64',
                'sig-pad-teacher': 'sig-teacher-base64',
                'sig-pad-gov': 'sig-gov-base64',
                'sig-pad-director': 'sig-director-base64'
            };

            for (const [canvasId, inputId] of Object.entries(canvasMap)) {
                const canvas = document.getElementById(canvasId);
                const input = document.getElementById(inputId);
                if (canvas && input) {
                    // Check if canvas is not empty (contains drawn strokes)
                    // Quick check: if the canvas contains any pixels that are drawing color
                    const blank = document.createElement('canvas');
                    blank.width = canvas.width;
                    blank.height = canvas.height;
                    
                    if (canvas.toDataURL() !== blank.toDataURL()) {
                        input.value = canvas.toDataURL();
                    }
                }
            }
            return true;
        }
    </script>
    <?php endif; ?>
</body>
</html>
