/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HomeVisitRecord, Student } from '../types';
import { 
  Sparkles, Printer, ArrowLeft, Search, Filter, 
  MapPin, CheckCircle, ShieldAlert,
  Download, Upload, Eye, RefreshCw, Star
} from 'lucide-react';

interface VisitHistoryProps {
  records: HomeVisitRecord[];
  students: Student[];
  onImportData: (data: string) => void;
  onExportData: () => void;
}

export default function VisitHistory({ records, students, onImportData, onExportData }: VisitHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  // Print view state
  const [selectedPrintRecordId, setSelectedPrintRecordId] = useState<string | null>(null);

  // File import state
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && (parsed.students || parsed.records)) {
          onImportData(text);
          alert("นำเข้าฐานข้อมูล สพฐ. นร.01 สำเร็จเรียบร้อย!");
        } else {
          throw new Error("โครงสร้างไฟล์ข้อมูลไม่ถูกต้อง");
        }
      } catch (err) {
        setFileError("ไฟล์สำรองข้อมูลไม่ถูกต้อง กรุณาอัปโหลดไฟล์ JSON ที่ถูกต้องของระบบนี้เท่านั้น");
      }
    };
    reader.readAsText(file);
  };

  const filteredRecords = records.filter(rec => {
    const studentObj = students.find(s => s.id === rec.studentId);
    const nameMatch = studentObj ? studentObj.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                   studentObj.nickname.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    
    const matchesRisk = riskFilter === 'all' || rec.manualRiskAssessment === riskFilter;
    return nameMatch && matchesRisk;
  });

  const activePrintRecord = records.find(r => r.id === selectedPrintRecordId);
  const activePrintStudent = activePrintRecord ? students.find(s => s.id === activePrintRecord.studentId) : null;

  // Calculate household income statistics for printing
  const printMembers = activePrintRecord?.members || [];
  const totalIncome = printMembers.reduce((sum, m) => sum + (Number(m.totalIncome) || 0), 0);
  const avgIncomePerHead = printMembers.length > 0 ? totalIncome / printMembers.length : 0;
  
  // กสศ Threshold: <= 3,000 THB/person/month qualifies for poor student cash transfers
  const isQualifyKanasor = avgIncomePerHead <= 3000;

  // Custom official printable page view matching СoDoc.gs GAS styles
  if (selectedPrintRecordId && activePrintRecord && activePrintStudent) {
    return (
      <div className="bg-slate-150 min-h-screen py-6 px-4 md:px-0">
        <div className="max-w-4xl mx-auto bg-white border-2 border-slate-350 p-6 sm:p-12 shadow-2xl print:shadow-none print:border-none print:p-0 rounded-3xl print:rounded-none" id="print-sheet-wrapper">
          
          {/* Print controls bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-dashed border-slate-300 print:hidden font-sans">
            <button
              onClick={() => setSelectedPrintRecordId(null)}
              className="text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-2 bg-slate-100 hover:bg-slate-200 py-2 px-4 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" /> ปิดหน้าพิมพ์รายงาน นร.01
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-slate-900/10"
              >
                <Printer className="w-4 h-4" /> สั่งพิมพ์หน้าต่างปัจจุบัน (Print)
              </button>
            </div>
          </div>

          {/* PRINTABLE OFFICIAL THAI GOVERNMENT FORM CONTAINER */}
          <div className="text-slate-900 font-sans leading-relaxed text-[11px] sm:text-xs space-y-6" style={{ fontFamily: '"Sarabun", "Inter", sans-serif' }}>
            
            {/* Header / Insignia */}
            <div className="text-center space-y-1.5 relative border-b-2 border-double border-slate-800 pb-4">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center text-xs font-extrabold text-slate-400 print:bg-white shrink-0">
                <span className="text-2xl">🎓</span>
              </div>
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 uppercase">
                แบบบันทึกการเยี่ยมบ้านนักเรียน (ระดับ สพฐ. นร. 01 / กสศ.)
              </h1>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-600">
                โรงเรียนบ้านหนองหว้า สำนักงานเขตพื้นที่การศึกษาประถมศึกษาบุรีรัมย์ เขต 3
              </p>
              <p className="text-[9px] text-slate-500">
                ภาคเรียนที่ {activePrintRecord.semester || '1'} ปีการศึกษา {activePrintRecord.schoolYear || '2569'}
              </p>
              <div className="absolute top-0 right-0 border border-slate-500 px-3 py-1 text-center rounded text-[10px] font-bold bg-slate-50 print:bg-white">
                นร.01 / กสศ.
              </div>
            </div>

            {/* General Logistical dates */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 border p-3 rounded-xl print:bg-white print:border-none print:p-0">
              <div>
                <p><strong>ผู้บันทึกตรวจหลัก (ครูประจำชั้น):</strong> {activePrintRecord.visitorName || '-'}</p>
                <p><strong>วันที่ตรวจเยี่ยมบ้าน:</strong> {activePrintRecord.visitedDate || '-'}</p>
              </div>
              <div className="text-right">
                <p><strong>ผู้ให้สัมภาษณ์หลัก:</strong> {activePrintRecord.informantName || '-'} ({activePrintRecord.informantRelation || 'ผู้ปกครอง'})</p>
                {isQualifyKanasor && (
                  <strong className="text-[10px] bg-red-100/80 border border-red-200 text-red-800 px-2 py-0.5 rounded-lg inline-block mt-1">
                    ✔ เข้าเกณฑ์พิจารณารับเงินคัดกรองนักเรียนยากจน (รายได้ ≤ 3,000.-/คน)
                  </strong>
                )}
              </div>
            </div>

            {/* SECTION 1: STUDENT BIOMETRICS */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-l-4 border-slate-800 pl-2">
                ๑. ข้อมูลทั่วไปของตัวนักเรียน
              </h3>
              <div className="border border-slate-350 p-4.5 rounded-2xl bg-slate-50/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p><span className="text-slate-550 font-semibold">ชื่อ-นามสกุลนักเรียน:</span> {activePrintStudent.prefix || ''}{activePrintStudent.name} (น้อง{activePrintStudent.nickname})</p>
                  <p><span className="text-slate-550 font-semibold">วัน/เดือน/ปี เกิด:</span> {activePrintStudent.birthDate || '-'}</p>
                  <p><span className="text-slate-550 font-semibold">ระดับชั้นเรียน:</span> อัดระดับ {activePrintStudent.grade} (ห้อง {activePrintStudent.room || '2'})</p>
                </div>
                <div className="space-y-1.5">
                  <p><span className="text-slate-550 font-semibold">เลขบัตรประจำตัวประชาชน:</span> {activePrintStudent.citizenId || '-'}</p>
                  <p><span className="text-slate-550 font-semibold">รหัสนักเรียน สพฐ.:</span> {activePrintStudent.studentCode || '-'}</p>
                  <p><span className="text-slate-550 font-semibold">พิกัดทางโทรศัพท์:</span> {activePrintRecord.latitude ? `${activePrintRecord.latitude.toFixed(6)}, ${activePrintRecord.longitude?.toFixed(6)}` : 'ไม่ได้รายงานพิกัด GPS'}</p>
                </div>
              </div>
            </div>

            {/* SECTION 2: GUARDIAN AND FINANCIAL SECURITY */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-l-4 border-slate-800 pl-2">
                ๒. ข้อมูลสถานภาพและความรอบรับของผู้ปกครอง
              </h3>
              <div className="border border-slate-350 p-4.5 rounded-2xl space-y-3">
                <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-2">
                  <p><span className="text-slate-550 font-semibold">สถานภาพสมรสผู้ปกครอง:</span> {activePrintRecord.familyStatus || '-'}</p>
                  <p><span className="text-slate-550 font-semibold">ปัจจุบันอาศัยอยู่ร่วมกับ:</span> {activePrintRecord.livingWith || '-'}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p><span className="text-slate-550 font-semibold">ผู้ปกครองที่เด็กพึ่งพิง:</span> {activePrintRecord.guardianName || '-'}</p>
                    <p><span className="text-slate-550 font-semibold">ความสัมพันธ์กับเด็ก:</span> {activePrintRecord.guardianRelation || '-'}</p>
                    <p><span className="text-slate-550 font-semibold">เลขประจำตัวประประชาชน:</span> {activePrintRecord.guardianCitizenId || '-'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p><span className="text-slate-550 font-semibold">ระดับการศึกษาสูงสุด:</span> {activePrintRecord.guardianEducation || '-'}</p>
                    <p><span className="text-slate-550 font-semibold">อาชีพประหารอุปการะ:</span> {activePrintRecord.guardianJob || '-'}</p>
                    <p><span className="text-slate-550 font-semibold">โทรศัพท์ติดต่อได้:</span> {activePrintRecord.guardianPhone || '-'}</p>
                  </div>
                </div>

                <div className="bg-slate-50 border p-2.5 rounded-xl text-center print:bg-white print:border-none print:p-0">
                  <span>สิทธิ์การรับสวัสดิการภาครัฐหลัก: <strong>{activePrintRecord.stateWelfare || 'ไม่ได้สวัสดิการแห่งรัฐ'}</strong></span>
                </div>
              </div>
            </div>

            {/* SECTION 3: HOUSEHOLD members AND INCOME TABLE STATEMENTS */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-l-4 border-slate-800 pl-2">
                ๓. รายชื่อสมาชิกในครัวเรือนทั้งหมดและบัญชีรายรับเฉลี่ย
              </h3>
              <div className="border border-slate-350 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-[11px] border-collapse bg-white whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-350">
                    <tr>
                      <th className="p-3 border-r font-bold text-slate-800">คนที่</th>
                      <th className="p-3 border-r font-bold text-slate-800">ชื่อ - นามสกุล สมาชิก</th>
                      <th className="p-3 border-r font-bold text-slate-800">ความสัมพันธ์กับเด็ก</th>
                      <th className="p-3 border-r font-bold text-slate-800 text-center">รหัสบัตรประชาชน ๑๓ หลัก</th>
                      <th className="p-3 border-r font-bold text-slate-800 text-center">อายุ (ปี)</th>
                      <th className="p-3 font-bold text-slate-800 text-right">รายรับรวมต่อเดือน (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {printMembers.length > 0 ? (
                      printMembers.map((member, idx) => (
                        <tr key={member.memberId || idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 border-r text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="p-2.5 border-r font-medium">{member.fullName || 'ไม่ได้ระบุ'}</td>
                          <td className="p-2.5 border-r text-center font-medium">{member.relation || '-'}</td>
                          <td className="p-2.5 border-r text-center font-mono">{member.citizenId || '-'}</td>
                          <td className="p-2.5 border-r text-center">{member.age || '-'}</td>
                          <td className="p-2.5 text-right font-semibold">{Number(member.totalIncome || 0).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400 italic">ไม่มีข้อมูลสมาชิก</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50/80 border-t border-slate-350 font-bold">
                      <td colSpan={4} className="p-3 text-right text-slate-755">รายได้รวมของสมาชิกในครัวเรือนต่อเดือน:</td>
                      <td colSpan={2} className="p-3 text-right text-slate-900 border-l font-extrabold">{totalIncome.toLocaleString()} บาท</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={4} className="p-3 text-right text-slate-755 pointer-events-none">รายได้เฉลี่ยต่อสมาชิกรายหัว (รายได้รวมหารจํานวนสมาชิก):</td>
                      <td colSpan={2} className="p-3 text-right text-emerald-900 border-l font-extrabold">{avgIncomePerHead.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* SECTION 4: PHYSICAL INFRASTRUCTURE HOUSING */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-l-4 border-slate-800 pl-2">
                ๔. ลักษณะทางกายภาพของโครงสร้างอาคารและเบี้ยชดเชย
              </h3>
              <div className="border border-slate-350 p-4.5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p><strong>กรรมสิทธิ์ที่ดินบ้าน:</strong> {activePrintRecord.houseOwnership || '-'}</p>
                  {Number(activePrintRecord.monthlyRent) > 0 && <p className="text-red-650"><strong>ค่าเช่าบ้านพักต่อเดือน:</strong> {activePrintRecord.monthlyRent} บาท</p>}
                  <p><strong>วัสดุพื้นบ้านพัก:</strong> {activePrintRecord.floorMaterial || '-'}</p>
                  <p><strong>วัสดุฝาผนังบ้านพัก:</strong> {activePrintRecord.wallMaterial || '-'}</p>
                  <p><strong>วัสดุมุงหลังคาบ้านพัก:</strong> {activePrintRecord.roofMaterial || '-'}</p>
                  <p><strong>ห้องส้วมในอาคาร:</strong> {activePrintRecord.hasToilet || '-'}</p>
                </div>
                <div className="space-y-1.5">
                  <p><strong>ที่ดินทำการเกษตรพึ่งพิง:</strong> {activePrintRecord.farmLand ? `${activePrintRecord.farmLand} ไร่` : 'ไม่มีที่ดินทำการเกษตร'}</p>
                  <p><strong>การใช้ไฟฟ้าส่องสว่าง:</strong> {activePrintRecord.electricity || '-'}</p>
                  <p><strong>แหล่งจ่ายน้ำอุปโภคหลัก:</strong> {activePrintRecord.waterSource || '-'}</p>
                  <p><strong>เครื่องใช้/ยานพาหนะครอบครอง:</strong> {activePrintRecord.vehicles || 'ไม่มี'}</p>
                  <p className="text-slate-600 font-semibold italic">{activePrintRecord.note || 'ภาระพึ่งพิง: ไม่มี'}</p>
                </div>
              </div>
            </div>

            {/* SECTION 5: TRAVEL LOGISTICS */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-l-4 border-slate-800 pl-2">
                ๕. รายการเดินทางไปโรงเรียนหนทางเวียนตรวจ
              </h3>
              <div className="border border-slate-350 p-4.5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p><strong>การรับส่ง/วิธีการใช้สัญจร:</strong> {activePrintRecord.travelMethod || '-'}</p>
                  <p><strong>ระยะทางไป-กลับเฉลี่ยหลัก:</strong> {activePrintRecord.travelDistance ? `${activePrintRecord.travelDistance} กม.` : 'ไม่ได้ระบุระยะทาง'}</p>
                  <p><strong>ระยะเวลาเดินทางสากล:</strong> {activePrintRecord.travelTime || '-'}</p>
                </div>
                <div className="space-y-1.5">
                  <p><strong>ค่าชดเชยยานสัญจรต่อเดือน:</strong> {Number(activePrintRecord.travelCost || 0).toLocaleString()} บาท</p>
                  <p><strong>เบี้ยยังชีพเล่าเรียนที่ได้ต่อวัน:</strong> {activePrintRecord.dailyAllowance ? `${activePrintRecord.dailyAllowance} บาท` : '-'}</p>
                  <p><strong>ลักษณะที่อยู่อาศัยตามจริง:</strong> {activePrintRecord.homeAddress || '-'}</p>
                </div>
              </div>
            </div>

            {/* SECTION 6: PHYSICAL IMAGES PREVIEW */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-l-4 border-slate-800 pl-2">
                ๖. รูปภาพประกอบรายงานสิ่งแวดล้อมเยี่ยมบ้าน คณะตรวจ กสศ. 01
              </h3>
              <div className="grid grid-cols-3 gap-4 border border-slate-350 p-4 rounded-2xl bg-slate-50/10">
                <div className="space-y-1.5 text-center">
                  <span className="text-[10px] font-bold text-slate-800 block">๑. หน้าตรงพกพาบัตรนักเรียน</span>
                  <div className="border border-slate-350 h-32 rounded-xl flex items-center justify-center overflow-hidden bg-white">
                    {activePrintRecord.studentImage ? (
                      <img src={activePrintRecord.studentImage} alt="Face student shot" className="max-h-full max-w-full object-contain p-1" />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">ไม่มีบันทึกภาพถ่าย</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5 text-center">
                  <span className="text-[10px] font-bold text-slate-800 block">๒. ภาพสภาพภายนอกบ้านพัก</span>
                  <div className="border border-slate-350 h-32 rounded-xl flex items-center justify-center overflow-hidden bg-white">
                    {activePrintRecord.outsideImage ? (
                      <img src={activePrintRecord.outsideImage} alt="Exterior house" className="max-h-full max-w-full object-contain p-1" />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">ไม่มีบันทึกภาพถ่าย</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5 text-center">
                  <span className="text-[10px] font-bold text-slate-800 block">๓. ภาพสภาพภายในบ้านพัก</span>
                  <div className="border border-slate-350 h-32 rounded-xl flex items-center justify-center overflow-hidden bg-white">
                    {activePrintRecord.insideImage ? (
                      <img src={activePrintRecord.insideImage} alt="Interior house" className="max-h-full max-w-full object-contain p-1" />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">ไม่มีบันทึกภาพถ่าย</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 7: CO-SIGNATURE LINES FROM THE ORIGINAL GAS APPLET */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-l-4 border-slate-800 pl-2">
                ๗. การลงคำยืนยันความถูกต้องประเมินร่วมกัน ๕ ฝ่าย
              </h3>
              <div className="border border-slate-350 p-4.5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50/20">
                {/* Sign 1: Student */}
                <div className="text-center space-y-2 border p-3 rounded-xl bg-white/70">
                  <span className="text-[10px] text-slate-400 font-bold block">๑. ลงนามยืนยันสิทธิ (ตัวนักเรียน)</span>
                  <div className="h-14 border border-slate-200 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                    {activePrintRecord.signatureStudent ? (
                      <img src={activePrintRecord.signatureStudent} alt="Student Sig" className="max-h-full max-w-full p-1" />
                    ) : (
                      <span className="text-[10px] text-slate-300">...................................................</span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-800">({activePrintStudent.name || 'ตัวนักเรียน'})</p>
                  <p className="text-[9px] text-slate-500 font-semibold">ผู้รับประเมินคัดกรอง</p>
                </div>

                {/* Sign 2: Guardian */}
                <div className="text-center space-y-2 border p-3 rounded-xl bg-white/70">
                  <span className="text-[10px] text-slate-400 font-bold block">๒. ลงนามฝั่งครอบครัว (ผู้ปกครอง)</span>
                  <div className="h-14 border border-slate-200 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                    {activePrintRecord.signatureParent ? (
                      <img src={activePrintRecord.signatureParent} alt="Guardian Sig" className="max-h-full max-w-full p-1" />
                    ) : (
                      <span className="text-[10px] text-slate-300">...................................................</span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-800">({activePrintRecord.informantName || 'ผู้ปกครองผู้ให้ข้อมูล'})</p>
                  <p className="text-[9px] text-slate-500 font-semibold">ผู้ให้ถ้อยคำสังเคราะห์</p>
                </div>

                {/* Sign 3: Teacher */}
                <div className="text-center space-y-2 border p-3 rounded-xl bg-white/70">
                  <span className="text-[10px] text-slate-400 font-bold block">๓. คณะทำงานเวียนตรวจ (ครูประจำชั้น)</span>
                  <div className="h-14 border border-slate-200 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                    {activePrintRecord.signatureTeacher ? (
                      <img src={activePrintRecord.signatureTeacher} alt="Teacher Sig" className="max-h-full max-w-full p-1" />
                    ) : (
                      <span className="text-[10px] text-slate-300">...................................................</span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-800">({activePrintRecord.teacherName || activePrintRecord.visitorName || 'ครูสมศรี มีปัญญา'})</p>
                  <p className="text-[9px] text-slate-500 font-semibold">ครูผู้เยี่ยมบ้านและคัดกรองหลัก</p>
                </div>

                {/* Sign 4: Government representative */}
                <div className="text-center space-y-2 border p-3 rounded-xl bg-white/70">
                  <span className="text-[10px] text-slate-400 font-bold block">๔. พยานข้าราชการ/บุคคลท้องถิ่นกำกับ</span>
                  <div className="h-14 border border-slate-200 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                    {activePrintRecord.signatureGov ? (
                      <img src={activePrintRecord.signatureGov} alt="Gov representative Sig" className="max-h-full max-w-full p-1" />
                    ) : (
                      <span className="text-[10px] text-slate-300">...................................................</span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-800">({activePrintRecord.govName || 'ผู้ใหญ่บ้าน / ตัวแทนรัฐ'})</p>
                  <p className="text-[9px] text-slate-500 font-semibold">{activePrintRecord.govPosition || 'เจ้าหน้าที่ของรัฐพยานร่วมสิทธิ์'}</p>
                </div>

                {/* Sign 5: School Director */}
                <div className="text-center space-y-2 border p-3 rounded-xl bg-white/70">
                  <span className="text-[10px] text-slate-400 font-bold block">๕. ประธานอนุมัติสิทธิ์ (ผู้อำนวยการ)</span>
                  <div className="h-14 border border-slate-200 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                    {activePrintRecord.signatureDirector ? (
                      <img src={activePrintRecord.signatureDirector} alt="Director Sig" className="max-h-full max-w-full p-1" />
                    ) : (
                      <span className="text-[10px] text-slate-300">...................................................</span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-800">({activePrintRecord.directorName || 'นายณรงค์วิทย์ สุวรรณศรี'})</p>
                  <p className="text-[9px] text-slate-500 font-semibold">ผู้อำนวยการสถานศึกษาต้นสังกัด</p>
                </div>

                {/* Stamp Emblem Box Mockup */}
                <div className="text-center border p-3.5 rounded-xl bg-slate-50 flex flex-col justify-center items-center">
                  <div className="w-10 h-10 rounded-full border-2 border-slate-350 flex items-center justify-center font-bold text-[14px] text-slate-400 border-dashed animate-pulse">
                     ตรา 
                  </div>
                  <span className="text-[9px] text-slate-500 font-bold mt-2 uppercase">ประทับตรายางสถาบันศึกษา</span>
                </div>
              </div>
            </div>

            {/* SECTION 8: AI SCREENING REPORT DEEP OBSERVATIONS */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-xs text-indigo-900 border-l-4 border-indigo-650 pl-2">
                ๘. ความเห็นสังเคราะห์ความยากจนและแผนดูแลช่วยเด็กด้วยปัญญาประดิษฐ์ AI (Gemini Core Client-Assisted)
              </h3>
              <div className="border border-indigo-150 p-4.5 rounded-2xl bg-indigo-50/15 space-y-3 font-sans">
                {activePrintRecord.aiAnalysis ? (
                  <div className="space-y-3 text-[11px]">
                    <p className="italic text-indigo-950 font-medium">" {activePrintRecord.aiAnalysis.summary} "</p>
                    <div className="grid grid-cols-2 gap-4 border-t border-indigo-100 pt-3">
                      <div>
                        <strong className="text-emerald-800 text-[10px] uppercase block mb-1">✦ ปัจจัยเชิงความเหมาะสม:</strong>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                          {activePrintRecord.aiAnalysis.strengths.map((str, i) => <li key={i}>{str}</li>)}
                        </ul>
                      </div>
                      <div>
                        <strong className="text-red-850 text-[10px] uppercase block mb-1">✦ ประเด็นท้าทายครอบคลุมวิกฤต:</strong>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                          {activePrintRecord.aiAnalysis.challenges.map((str, i) => <li key={i}>{str}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">ไม่ได้ใช้โมเดลวิเคราะห์ AI ในช่วงคัดกรองใบคำขอ</p>
                )}

                <div className="border-t border-dashed border-indigo-100 pt-3.5 space-y-1">
                  <strong>มติอนุมัติช่วยเหลือเร่งด่วน:</strong>
                  <p className="whitespace-pre-line bg-white/70 p-3 rounded-lg border leading-relaxed italic text-slate-750">
                    {activePrintRecord.manualActionNotes || 'จัดเข้ากระบวนการแนะแนวเพื่อจัดอันดับความอุปการะค่านมและชุดกีฬาโรงเรียนบ้านจันทน์หอมตาเสก'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none font-sans">
      
      {/* Search Toolbar */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-850">ประวัติและข้อมูลสมบูรณ์รายงาน นร.01 / กสศ.</h2>
          <p className="text-xs text-slate-450">พิมพ์ตราแบบฟอร์มคัดกรอง สพฐ นร.01 ออกรายงานร่วมมือ 5 ฝ่ายสมบูรณ์แบบ</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto shrink-0 font-sans">
          <button
            onClick={onExportData}
            className="flex-1 sm:flex-initial bg-white/50 backdrop-blur-md border border-white/60 text-slate-700 text-xs py-2 px-3.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 hover:bg-white/70 shadow-xs"
          >
            <Download className="w-4 h-4" /> ส่งออกไฟล์สำรอง (JSON)
          </button>
          
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            id="json-file-importer"
            className="hidden"
          />
          <label
            htmlFor="json-file-importer"
            className="flex-1 sm:flex-initial bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-100 text-xs py-2 px-3.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center select-none shadow-xs"
          >
            <Upload className="w-4 h-4" /> นำเข้าข้อมูลสำรอง
          </label>
        </div>
      </div>

      {fileError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-700 font-semibold">
          {fileError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative col-span-2">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="พิมพ์รหัส/ชื่อ เพื่อค้นหาใบคำร้องเยี่ยมบ้าน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs pl-9 pr-4 py-2.5 w-full bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs p-2.5 w-full bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">กรองความเสี่ยงทั้งหมด</option>
            <option value="normal">ระดับประเมิน: ปกติ</option>
            <option value="medium">ระดับประเมิน: ปานกลาง (เฝ้าระวัง)</option>
            <option value="high">ระดับประเมิน: สูง (วิกฤตยากจน)</option>
          </select>
        </div>
      </div>

      {/* Grid of visit reports card summaries */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-md border text-center py-16 rounded-3xl border-white/60">
          <span className="text-3xl block mb-2">📁</span>
          <p className="text-sm text-slate-450 font-bold">ไม่พบประวัติแบบคำขอเยี่ยมบ้านนักเรียน</p>
          <p className="text-xs text-slate-400 mt-1">กรุณาทลองเปลี่ยนคำค้นหา หรือกดบันทึกรายงานใหม่</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map(rec => {
            const studentObj = students.find(s => s.id === rec.studentId);
            if (!studentObj) return null;

            return (
              <div key={rec.id} className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-white/80 transition-all">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">บันทึกเยี่ยมบ้าน: {rec.visitedDate}</span>
                      <h3 className="text-sm font-bold text-slate-800">{studentObj.name} ({studentObj.nickname})</h3>
                    </div>

                    {rec.manualRiskAssessment === 'high' && (
                      <span className="text-[9px] bg-rose-50 text-rose-700 font-extrabold px-2.5 py-1 rounded-lg border border-rose-150">
                        วิกฤต/สูง
                      </span>
                    )}
                    {rec.manualRiskAssessment === 'medium' && (
                      <span className="text-[9px] bg-amber-50 text-amber-700 font-extrabold px-2.5 py-1 rounded-lg border border-amber-150">
                        เฝ้าระวัง
                      </span>
                    )}
                    {rec.manualRiskAssessment === 'normal' && (
                      <span className="text-[9px] bg-emerald-50 text-emerald-750 font-extrabold px-2.5 py-1 rounded-lg border border-emerald-150">
                        ปกติธรรมดา
                      </span>
                    )}
                  </div>

                  <div className="flex gap-4 border-b border-slate-100 pb-3 mb-3">
                    <div className="w-20 h-16 rounded-xl bg-slate-50 border overflow-hidden shrink-0 flex items-center justify-center">
                      {rec.studentImage ? (
                        <img src={rec.studentImage} alt="Student" className="w-full h-full object-cover" />
                      ) : rec.photos && rec.photos.length > 0 ? (
                        <img src={rec.photos[0]} alt="Visit atmosphere" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase p-1">ไม่มีรูป</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p><strong className="text-slate-400">สถานสภาพครอบครัว:</strong> {rec.familyStatus}</p>
                      <p><strong className="text-slate-400">ผู้ให้ข้อมูล:</strong> {rec.informantName} ({rec.informantRelation})</p>
                      <p><strong className="text-slate-400">รายได้เฉลี่ยครัวเรือน:</strong> {(rec.members && rec.members.length > 0 ? (rec.members.reduce((sum,m)=>sum+(Number(m.totalIncome)||0),0)/rec.members.length) : (rec.familyMonthlyIncome || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })} บาท/คน</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 line-clamp-2 italic leading-relaxed py-1 font-sans">
                    "{rec.manualActionNotes || rec.teacherObservations || "สภาพเป็นไปปกติ ไม่บันทึกโน้ตพิเศษ"}"
                  </div>

                  {rec.aiAnalysis && (
                    <div className="bg-indigo-50/50 border border-indigo-100 p-2.5 rounded-xl mt-3 flex gap-2 items-start justify-between text-[11px] text-indigo-900 leading-normal">
                      <p className="font-semibold flex items-center gap-1 shrink-0 text-indigo-700">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-500" /> AI ประเมิน:
                      </p>
                      <span className="line-clamp-1 italic text-slate-600">{rec.aiAnalysis.summary}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => setSelectedPrintRecordId(rec.id)}
                    className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-indigo-650/10"
                  >
                    <Eye className="w-3.5 h-3.5" /> ตรวจสอบเพื่อออกรายงานพิมพ์ นร.01
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
