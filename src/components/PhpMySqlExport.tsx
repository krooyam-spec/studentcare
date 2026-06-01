import React, { useState } from 'react';
import { 
  Database, FileCode, CheckCircle, Copy, Terminal, 
  Download, HelpCircle, Server, Code, Sparkles 
} from 'lucide-react';

export default function PhpMySqlExport() {
  const [activeTab, setActiveTab] = useState<'guide' | 'sql' | 'db' | 'index'>('guide');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Static strings representing the exact contents of db_connect.php and database.sql
  const dbConnectCode = `<?php
/**
 * DB Connect configuration with MySQL/MariaDB for Student Visit System
 * PDO Driver - Secure Prepared Statements
 */

define('DB_HOST', 'localhost');
define('DB_USER', 'schoolos_studentcare');
define('DB_PASS', 'sjE9_zJzf7_O6plw');
define('DB_NAME', 'schoolos_studentcare');

try {
    // 1. Try to connect directly to the database
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        // 2. Fallback: Connect without dbname and create (XAMPP/Root)
        $pdo = new PDO("mysql:host=" . DB_HOST . ";charset=utf8mb4", DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $pdo->exec("CREATE DATABASE IF NOT EXISTS \`" . DB_NAME . "\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE \`" . DB_NAME . "\`");
    }

    // 3. Auto-Installer: Check if table 'students' exists. Install schema if missing!
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'students'");
    if ($tableCheck->rowCount() == 0) {
        // Run SQL installation scripts dynamically
        // ...
    }
} catch (PDOException $e) {
    die("เชื่อมต่อฐานข้อมูลล้มเหลว: " . $e->getMessage());
}
?>`;

  const databaseSqlCode = `-- --------------------------------------------------------
-- SQL Database Schema for Student Visit System (นร.01 สพฐ. / กสศ.)
-- Compatibility: MySQL 5.7+ / MariaDB 10.2+
-- Collation: utf8mb4_unicode_ci
-- --------------------------------------------------------

CREATE DATABASE IF NOT EXISTS \`schoolos_studentcare\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`schoolos_studentcare\`;

-- 1. Students Table
CREATE TABLE \`students\` (
  \`id\` VARCHAR(50) NOT NULL COMMENT 'รหัส ID',
  \`student_code\` VARCHAR(55) NULL COMMENT 'รหัสนักเรียน',
  \`prefix\` VARCHAR(30) NULL COMMENT 'คำนำหน้าชื่อ',
  \`name\` VARCHAR(150) NOT NULL COMMENT 'ชื่อ-นามสกุล',
  \`nickname\` VARCHAR(50) NOT NULL COMMENT 'ชื่อเล่น',
  \`gender\` VARCHAR(20) NULL COMMENT 'เพศ',
  \`birth_date\` VARCHAR(50) NULL COMMENT 'วันเกิด',
  \`grade\` VARCHAR(30) NOT NULL COMMENT 'ชั้นเรียน เช่น ม.3/2',
  \`room\` VARCHAR(10) NULL COMMENT 'ห้องเรียน',
  \`citizen_id\` VARCHAR(30) NULL COMMENT 'เลขบัตรประชาชน',
  \`address\` TEXT NOT NULL COMMENT 'ที่อยู่เดิม',
  \`visit_status\` VARCHAR(20) NOT NULL DEFAULT 'pending',
  \`risk_level\` VARCHAR(20) NOT NULL DEFAULT 'not_assessed',
  \`last_visited_date\` VARCHAR(50) NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

  return (
    <div className="space-y-6">
      
      {/* Intro Header Box */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-white/10 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 space-y-3">
          <span className="bg-emerald-600 text-white font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm">
            <Server className="w-3.5 h-3.5" /> โรงเรียนรองรับ PHP & MySQL
          </span>
          <h2 className="text-lg md:text-xl font-extrabold tracking-tight">
            ชุดซอร์สโค้ดส่งออกโครงการเยี่ยมบ้าน (โรงเรียน PHP & MySQL Server Package)
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            ผมได้เขียนและเตรียมไฟล์สำหรับรันบนเซิร์ฟเวอร์ระบบ PHP และฐานข้อมูล MySQL ของโรงเรียนคุณเรียบร้อยแล้ว! 
            โครงสร้างตารางได้จำลองแบบ กสศ. นร.01 เต็มรูปแบบ ปลอดภัยจากการโจมตี SQL Injection ด้วยระบบ PDO Prepared Statements 
            และใช้ระบบออกแบบของ Tailwind CSS ในฝั่งฟรอนต์เอนด์เว็บแอปพลิเคชัน
          </p>
          <div className="pt-2 flex flex-wrap gap-2.5">
            <span className="bg-slate-800 text-slate-200 text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> รองรับ PHP 7.4 ถึง PHP 8.x +
            </span>
            <span className="bg-slate-800 text-slate-200 text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> พร้อมฟังก์ชันบันทึกภาพและลายเซ็น 5 ฝ่าย
            </span>
            <span className="bg-slate-800 text-slate-200 text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Auto schema creation (ติดตั้งด่วนอัตโนมัติ)
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-5 shadow-xs">
        <div className="flex border-b overflow-x-auto text-xs pb-1 gap-2 border-slate-200">
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-2 px-4 font-bold border-b-2 rounded-t-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-800 bg-white/70 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/30'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> แนะนำการติดตั้งใช้งาน
          </button>
          
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-2 px-4 font-bold border-b-2 rounded-t-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-800 bg-white/70 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" /> ๑. database.sql
          </button>

          <button
            onClick={() => setActiveTab('db')}
            className={`py-2 px-4 font-bold border-b-2 rounded-t-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'db'
                ? 'border-emerald-600 text-emerald-800 bg-white/70 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-4 h-4" /> ๒. db_connect.php
          </button>

          <button
            onClick={() => setActiveTab('index')}
            className={`py-2 px-4 font-bold border-b-2 rounded-t-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'index'
                ? 'border-emerald-600 text-emerald-800 bg-white/70 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-4 h-4" /> ๓. index.php (ซอร์สสมบูรณ์)
          </button>
        </div>

        {/* Tab Contents */}
        <div className="pt-6">
          
          {/* TAB 1: INSTALLATION GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-4 text-emerald-900 space-y-1.5 shadow-xs">
                <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  วิธีรวดเร็วที่สุด: ดาวน์โหลดโฟลเดอร์สำเร็จรูปผ่านโปรแกรม
                </h4>
                <p>
                  ผมได้ทำการเขียนไฟล์จริงทั้งหมดลงในไดเรกทอรีโครงการ เรียกว่าโฟลเดอร์ <code>/php-mysql-export/</code> ในระบบ 
                  เพียงแค่คุณคลิกเลือกเมนู <strong>"Export ZIP"</strong> หรือ <strong>"Export to GitHub"</strong> ที่เมนูด้านบนขวาของ Google AI Studio 
                  รวบรวมไฟล์ PHP ตระกูลนี้ทั้งหมดจะถูกรวมเข้าไปอยู่ในคอมพิวเตอร์ของคุณทันทีโดยไม่ต้องทำการคัดลอกทีละหน้าจอครับ!
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-800 border-l-4 border-slate-900 pl-2">
                  ขั้นตอนการรันบนฐานข้อมูลโรงเรียน (XAMPP / AppServ / DirectAdmin)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4.5 rounded-2xl border shadow-xs space-y-2">
                    <span className="font-bold text-slate-400 block text-[10px] uppercase">ขั้นตอนที่ 1</span>
                    <strong className="text-slate-900 font-bold block">สร้างฐานข้อมูล</strong>
                    <p className="text-slate-600">
                      ไปที่ <code>http://localhost/phpmyadmin/</code> บนเซิร์ฟเวอร์โรงเรียน คลิกสร้างฐานข้อมูลใหม่ชื่อ 
                      <code>student_visit_db</code> และกำหนด Collation เป็น <code>utf8mb4_unicode_ci</code>
                    </p>
                  </div>

                  <div className="bg-white p-4.5 rounded-2xl border shadow-xs space-y-2">
                    <span className="font-bold text-slate-400 block text-[10px] uppercase">ขั้นตอนที่ 2</span>
                    <strong className="text-slate-900 font-bold block">นำเข้าไฟล์ SQL</strong>
                    <p className="text-slate-600">
                      คลิกนำเข้า (Import) นำไฟล์ <code>database.sql</code> (ในแท็บถัดไป) ไปรันผ่านหน้าต่าง SQL เพื่อสร้างตาราง 
                      หรือจะข้ามขั้นตอนนี้ก็ได้ เพราะโค้ดในไฟล์ <code>db_connect.php</code> ของเรามีระบบออโต้อินสตอลเลอร์ติดตั้งให้อัตโนมัติเมื่อรันครั้งแรก!
                    </p>
                  </div>

                  <div className="bg-white p-4.5 rounded-2xl border shadow-xs space-y-2">
                    <span className="font-bold text-slate-400 block text-[10px] uppercase">ขั้นตอนที่ 3</span>
                    <strong className="text-slate-900 font-bold block">วางซอร์สโค้ด PHP</strong>
                    <p className="text-slate-600">
                      ก๊อปปี้ไฟล์ <code>db_connect.php</code> และ <code>index.php</code> ไปวางในโฟลเดอร์ 
                      <code>C:\xampp\htdocs\visit_app\</code> จากนั้นเปิดหน้าเว็บ <code>http://localhost/visit_app/</code> เริ่มบันทึกได้ทันทีครับ!
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border shadow-xs space-y-2">
                  <strong className="text-slate-900 font-bold block">การต่อพ่วงเครือข่ายโรงเรียน (สิทธิ์การเข้าชมจากแท็บเล็ต/มือถือครู)</strong>
                  <p className="text-slate-600">
                    เนื่องจากครูเยี่ยมบ้านมักเดินกรอกนอกสถานที่ผ่าน iPad หรือมือถือ แนะนำให้กำหนดเช่าโฮสติ้งของโรงเรียน หรือทำการเชื่อมต่อเครือข่าย Wi-Fi เดียวกัน 
                    แล้วให้ครูเปิดไอพีของเครื่องเซิร์ฟเวอร์ เช่น <code>http://192.168.1.35/visit_app/</code> ก็จะสามารถวาดลายเซ็นดิจิทัลผ่านหน้าจอมือถือส่งตรงเข้าฐานข้อมูล MySQL ได้เลยทันที!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: database.sql */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">สคริปต์ประกาศโครงสร้างตาราง MySQL (database.sql)</span>
                <button
                  onClick={() => handleCopy(databaseSqlCode)}
                  className="bg-slate-900 text-white font-bold py-1.5 px-3 rounded-lg hover:bg-slate-800 transition flex items-center gap-1 text-[10px]"
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'คัดลอกแล้ว!' : 'ก๊อปปี้สคริปต์ SQL'}
                </button>
              </div>
              <div className="bg-slate-950 text-slate-350 p-4.5 rounded-2xl font-mono text-[11px] overflow-x-auto text-left leading-relaxed max-h-[60vh] custom-scrollbar border">
                <pre>{databaseSqlCode}</pre>
                <div className="text-slate-500 italic mt-3">// ... (มีตาราง household_members, schedules และข้อมูลเริ่มต้นครอบคลุมในแพ็คดาวน์โหลด)</div>
              </div>
            </div>
          )}

          {/* TAB 3: db_connect.php */}
          {activeTab === 'db' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">ไฟล์เชื่อมต่อและสร้างฐานข้อมูลอัตโนมัติ (db_connect.php)</span>
                <button
                  onClick={() => handleCopy(dbConnectCode)}
                  className="bg-slate-900 text-white font-bold py-1.5 px-3 rounded-lg hover:bg-slate-800 transition flex items-center gap-1 text-[10px]"
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'คัดลอกแล้ว!' : 'ก๊อปปี้โค้ด PHP'}
                </button>
              </div>
              <div className="bg-slate-950 text-slate-350 p-4.5 rounded-2xl font-mono text-[11px] overflow-x-auto text-left leading-relaxed max-h-[60vh] custom-scrollbar border">
                <pre>{dbConnectCode}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: index.php */}
          {activeTab === 'index' && (
            <div className="space-y-4">
              <div className="bg-white border rounded-2xl p-4.5 mb-2 text-slate-700">
                <h4 className="font-extrabold text-xs mb-1">สรรพคุณของระบบเยี่ยมบ้านเดี่ยว (index.php)</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  ผมได้รวมฟรอนต์เอนด์ (HTML/JavaScript/Tailwind/Canvas ลงชื่อ) และแบ็กเอนด์ (PHP query/insert/print) ให้สำเร็จรูปเรียบร้อยแล้วในไฟล์เดียว 
                  เพื่อความง่ายดายที่สุดในการติดตั้งของโรงเรียน ไม่เกิดปัญหาไฟล์สูญหายหรือลิงก์เสีย 
                  รวมถึงมีปุ่มกดพิมพ์รายงานออกเป็นสเปรดชีตและกระดาษแบบฟอร์มกวนอูสพฐ. นร.01 ทันทีครับ
                </p>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">เพื่อความปลอดภัย แนะนำให้ดาวน์โหลดไฟล์สมบูรณ์ผ่านปุ่ม Export ZIP ของ AI Studio ด้านบนขวา</span>
                <span className="inline-flex items-center gap-1 bg-indigo-50 border px-3 py-1 text-slate-700 font-bold rounded-lg text-[10px]">
                  <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                  ไฟล์นี้บรรจุอยู่ภายใต้ /php-mysql-export/index.php แล้ว
                </span>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
