/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Student, RiskLevel, VisitStatus } from '../types';
import { Search, Filter, Plus, Edit2, MapPin, Phone, User, CheckCircle2, AlertTriangle, Calendar, X, PlusCircle } from 'lucide-react';

interface StudentListProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onSelectVisit: (studentId: string) => void;
}

export default function StudentList({ students, onAddStudent, onEditStudent, onSelectVisit }: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  // Modal states for Add/Edit
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form states for Student profile
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [studentIdCard, setStudentIdCard] = useState('');
  const [grade, setGrade] = useState('ม.3/2');
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('บิดา');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const openAddModal = () => {
    setEditingStudent(null);
    setName('');
    setNickname('');
    setStudentIdCard(`6100${students.length + 1}`);
    setGrade('ม.3/2');
    setGuardianName('');
    setGuardianRelation('บิดา');
    setPhone('');
    setAddress('');
    setShowModal(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setName(student.name);
    setNickname(student.nickname);
    setStudentIdCard(student.studentIdCard);
    setGrade(student.grade);
    setGuardianName(student.guardianName);
    setGuardianRelation(student.guardianRelation);
    setPhone(student.phone);
    setAddress(student.address);
    setShowModal(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !studentIdCard.trim() || !phone.trim() || !address.trim()) {
      alert("กรุณากรอกข้อมูลระบุตัวตนให้ครบถ้วน");
      return;
    }

    if (editingStudent) {
      // Editing Mode
      const updated: Student = {
        ...editingStudent,
        name,
        nickname,
        studentIdCard,
        grade,
        guardianName,
        guardianRelation,
        phone,
        address
      };
      onEditStudent(updated);
    } else {
      // Add Mode
      // Approximate coordinates around Bangkok area
      const randOffsetLat = (Math.random() - 0.5) * 0.04;
      const randOffsetLng = (Math.random() - 0.5) * 0.04;
      const newStudent: Student = {
        id: `STD-${Date.now()}`,
        studentIdCard,
        name,
        nickname,
        grade,
        guardianName,
        guardianRelation,
        phone,
        address,
        latitude: 13.7950 + randOffsetLat,
        longitude: 100.5850 + randOffsetLng,
        visitStatus: 'pending',
        riskLevel: 'not_assessed',
        lastVisitedDate: null
      };
      onAddStudent(newStudent);
    }
    setShowModal(false);
  };

  // Filtering
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.nickname.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.studentIdCard.includes(searchTerm);

    const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;
    const matchesStatus = statusFilter === 'all' || student.visitStatus === statusFilter;
    const matchesRisk = riskFilter === 'all' || student.riskLevel === riskFilter;

    return matchesSearch && matchesGrade && matchesStatus && matchesRisk;
  });

  return (
    <div className="space-y-6">
      
      {/* Search & Filter Toolbar */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-850">ทำเนียบรายชื่อนักเรียนและสถานะ</h2>
            <p className="text-xs text-slate-500 mt-1">สืบค้น กรองสเตตัสการคัดกรองความเสี่ยง และเริ่มปักจุดเยี่ยมบ้าน</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs py-2 px-4 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-500/15"
          >
            <Plus className="w-4 h-4" /> เพิ่มนักเรียนใหม่
          </button>
        </div>

        <hr className="border-white/40 my-4" />

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="ค้นด้วยชื่อ, ชื่อเล่น, รหัสนักเรียน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-9 pr-4 py-2.5 w-full bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Grade filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="text-xs p-2.5 w-full bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:outline-none"
            >
              <option value="all">ทุกระดับชั้น</option>
              <option value="ม.3/2">ม.3/2</option>
              <option value="ม.3/1">ม.3/1</option>
              <option value="ม.1/1">ม.1/1</option>
            </select>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2.5 w-full bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:outline-none"
          >
            <option value="all">ทุกสถานะเยี่ยมบ้าน</option>
            <option value="pending">ยังไม่ได้เยี่ยม (Pending)</option>
            <option value="scheduled">นัดหมายแล้ว (Scheduled)</option>
            <option value="visited">เยี่ยมบ้านแล้ว (Visited)</option>
          </select>

          {/* Risk filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs p-2.5 w-full bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:outline-none"
          >
            <option value="all">ทุกสิทธิความเสี่ยง</option>
            <option value="not_assessed">ยังประเมินไม่ได้คัดกรอง</option>
            <option value="normal">ระดับเสี่ยงต่ำ/ปกติ</option>
            <option value="medium">ระดับเฝ้าระวัง/ปานกลาง</option>
            <option value="high">ระดับความช่วยเหลือสูง/วิกฤต</option>
          </select>
        </div>
      </div>

      {/* Grid of Students */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-md border text-center py-12 rounded-3xl border-white/60">
          <p className="text-sm text-slate-400">ไม่พบข้อมูลปูมรายชื่อนักเรียนที่ค้นหา</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map(student => (
            <div 
              key={student.id} 
              className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 hover:border-white/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
              id={`student-card-${student.id}`}
            >
              <div>
                <div className="flex items-start justify-between mb-3.5">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                    เลขรหัสประจำตัว: {student.studentIdCard}
                  </span>
                  
                  {/* Visit status badges */}
                  <div>
                    {student.visitStatus === 'visited' && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> เยี่ยมแล้ว
                      </span>
                    )}
                    {student.visitStatus === 'pending' && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-100">
                        <Calendar className="w-3 h-3 text-amber-500" /> ยังไม่ระบุเยี่ยม
                      </span>
                    )}
                    {student.visitStatus === 'scheduled' && (
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-indigo-100">
                        <Calendar className="w-3 h-3 text-indigo-500" /> นัดหมายลงพื้นที่
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    {student.name} ({student.nickname})
                  </h3>
                  <p className="text-[11px] text-slate-400">ระดับชั้นเรียน: {student.grade}</p>
                </div>

                <div className="mt-4 space-y-2 text-xs border-y border-slate-50 py-3 text-slate-600">
                  <div className="flex items-center gap-2 text-slate-500">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>ผู้ปกครอง: {student.guardianName} ({student.guardianRelation})</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>สายตรง: {student.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{student.address}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between gap-2 border-t border-slate-50">
                {/* Risk evaluation badge */}
                <div>
                  {student.riskLevel === 'high' && (
                    <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-100 px-2 py-1 rounded font-bold uppercase">
                      ความเสี่ยง: สูง
                    </span>
                  )}
                  {student.riskLevel === 'medium' && (
                    <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-1 rounded font-bold uppercase">
                      ความเสี่ยง: ปานกลาง
                    </span>
                  )}
                  {student.riskLevel === 'normal' && (
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded font-bold uppercase">
                      ความเสี่ยง: ปกติ/ตํ่า
                    </span>
                  )}
                  {student.riskLevel === 'not_assessed' && (
                    <span className="text-[9px] bg-slate-50 text-slate-400 border border-slate-200 px-2 py-1 rounded font-bold uppercase">
                      รอคัดกรอง
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(student)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition"
                    title="แก้ไขประวัติ"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onSelectVisit(student.id)}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] py-1.5 px-3.5 rounded-lg transition"
                  >
                    บันทึกเยี่ยมบ้าน
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <PlusCircle className="text-emerald-400 w-5 h-5" />
                {editingStudent ? "แก้ไขประวัตินักเรียน" : "ลงทะเบียนนักเรียนใหม่เข้าระบบ"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 sm:p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">ชื่อ-นามสกุล <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="ด.ช. เกียรติกร เรียนเด่น"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">ชื่อเล่น</label>
                    <input
                      type="text"
                      placeholder="เช่น บอล"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">ระดับชั้นปัญญา <span className="text-rose-500">*</span></label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    >
                      <option value="ม.3/2">ม.3/2</option>
                      <option value="ม.3/1">ม.3/1</option>
                      <option value="ม.1/1">ม.1/1</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">รหัสประจำตัวครูตรวจ <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={studentIdCard}
                    onChange={(e) => setStudentIdCard(e.target.value)}
                    className="text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">เบอร์โทรศัพท์ผู้ปกครอง <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="08X-XXX-XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">ชื่อผู้ปกครองหลัก</label>
                  <input
                    type="text"
                    placeholder="นายประสิทธิ์ เรียนเด่น"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">ความสัมพันธ์</label>
                  <select
                    value={guardianRelation}
                    onChange={(e) => setGuardianRelation(e.target.value)}
                    className="text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="บิดา">บิดา</option>
                    <option value="มารดา">มารดา</option>
                    <option value="ปู่">ปู่</option>
                    <option value="ย่า">ย่า</option>
                    <option value="ตา">ตา</option>
                    <option value="ยาย">ยาย</option>
                    <option value="ป้า">ป้า</option>
                    <option value="น้า">น้า</option>
                    <option value="อา">อา</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">ที่อยู่อาศัยปักหมุดปัจจุบัน <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  placeholder="กรอกบ้านเลขที่ ซอย ถนน แขวง และเขตโดยละเอียด..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2.5}
                  className="text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-4 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-transparent border border-slate-200 text-slate-600 text-xs py-2 px-5 rounded-xl hover:bg-slate-50 transition font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 text-white font-bold text-xs py-2 px-6 rounded-xl hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/15"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
