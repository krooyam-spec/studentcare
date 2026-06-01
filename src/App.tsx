/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Student, HomeVisitRecord, ChecklistItem, ScheduleItem } from './types';
import { INITIAL_STUDENTS, INITIAL_VISIT_RECORDS, INITIAL_CHECKLIST } from './data';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import VisitForm from './components/VisitForm';
import VisitHistory from './components/VisitHistory';
import PreVisitChecklist from './components/PreVisitChecklist';
import PhpMySqlExport from './components/PhpMySqlExport';
import { 
  Home, Users, FileText, Calendar, ListTodo, 
  BookOpen, Sparkles, LogOut, CheckCircle2, ChevronRight, Info,
  Database
} from 'lucide-react';

export default function App() {
  const [currentSection, setCurrentSection] = useState<'dashboard' | 'students' | 'form' | 'records' | 'checklist' | 'php-mysql'>('dashboard');
  const [selectedStudentForVisit, setSelectedStudentForVisit] = useState<string>('');

  // Local Storage Data Hydration & Fallback to Initial Data
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('visit_students');
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [records, setRecords] = useState<HomeVisitRecord[]>(() => {
    try {
      const saved = localStorage.getItem('visit_records');
      return saved ? JSON.parse(saved) : INITIAL_VISIT_RECORDS;
    } catch {
      return INITIAL_VISIT_RECORDS;
    }
  });

  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem('visit_checklist');
      return saved ? JSON.parse(saved) : INITIAL_CHECKLIST;
    } catch {
      return INITIAL_CHECKLIST;
    }
  });

  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    try {
      const saved = localStorage.getItem('visit_schedules');
      if (saved) return JSON.parse(saved);
      // Default scheduled events
      return [
        {
          id: 'SCH-PRESET-1',
          studentId: 'STD004',
          scheduledDate: '2026-06-03',
          scheduledTime: '10:00',
          notes: 'มารดาสะดวกช่วงเที่ยงเพื่อตรวจเยี่ยมความร่วมมือในระบบดูแล',
          status: 'pending'
        }
      ];
    } catch {
      return [];
    }
  });

  // Persistent writing back to localStorage
  useEffect(() => {
    localStorage.setItem('visit_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('visit_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('visit_checklist', JSON.stringify(checklist));
  }, [checklist]);

  useEffect(() => {
    localStorage.setItem('visit_schedules', JSON.stringify(schedules));
  }, [schedules]);

  // Real-time Clock display
  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const gmtTime = new Date();
      // Format as Thai regional locale date/time structure
      const thaiDate = gmtTime.toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      });
      const thaiTime = gmtTime.toLocaleTimeString('th-TH', { hour12: false });
      setTimeStr(`${thaiDate} เวลา ${thaiTime} น.`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleAddStudent = (newStudent: Student) => {
    setStudents(prev => [newStudent, ...prev]);
  };

  const handleEditStudent = (editedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === editedStudent.id ? editedStudent : s));
  };

  const handleSelectVisit = (studentId: string) => {
    setSelectedStudentForVisit(studentId);
    setCurrentSection('form');
  };

  const handleSaveVisitRecord = (newRecord: HomeVisitRecord) => {
    setRecords(prev => [newRecord, ...prev]);
    
    // Update student status & risk rating mapping according to findings
    setStudents(prev => prev.map(student => {
      if (student.id === newRecord.studentId) {
        return {
          ...student,
          visitStatus: 'visited',
          riskLevel: newRecord.manualRiskAssessment, // map latest risk Level from visit
          lastVisitedDate: newRecord.visitedDate
        };
      }
      return student;
    }));

    // If there was a pending schedule of this student, marked it as completed
    setSchedules(prev => prev.map(sch => {
      if (sch.studentId === newRecord.studentId && sch.status === 'pending') {
        return { ...sch, status: 'completed' as const };
      }
      return sch;
    }));

    setCurrentSection('records');
  };

  // Schedule Handlers
  const handleAddSchedule = (item: ScheduleItem) => {
    setSchedules(prev => [item, ...prev]);
    // Also change student status to scheduled if currently pending
    setStudents(prev => prev.map(student => {
      if (student.id === item.studentId && student.visitStatus === 'pending') {
        return { ...student, visitStatus: 'scheduled' };
      }
      return student;
    }));
  };

  const handleDeleteSchedule = (id: string) => {
    const schedToRemove = schedules.find(s => s.id === id);
    setSchedules(prev => prev.filter(s => s.id !== id));
    
    // Reset status back to pending if they had scheduled
    if (schedToRemove) {
      setStudents(prev => prev.map(student => {
        if (student.id === schedToRemove.studentId && student.visitStatus === 'scheduled') {
          return { ...student, visitStatus: 'pending' };
        }
        return student;
      }));
    }
  };

  // Export Data as download JSON
  const handleExportDataByJson = () => {
    const payload = {
      students,
      records,
      checklist,
      schedules,
      exportVersion: "1.0.0",
      classroom: "ม.3/2"
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `home_visit_backup_classroom_m32_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import uploaded JSON data
  const handleImportDataByJson = (rawJsonText: string) => {
    try {
      const parsed = JSON.parse(rawJsonText);
      if (parsed.students) setStudents(parsed.students);
      if (parsed.records) setRecords(parsed.records);
      if (parsed.checklist) setChecklist(parsed.checklist);
      if (parsed.schedules) setSchedules(parsed.schedules);
    } catch (err) {
      console.error("Hydration backup error:", err);
    }
  };

  return (
    <div className="bg-[#f5f8fa] text-slate-800 font-sans min-h-screen flex flex-col antialiased relative overflow-hidden">
      
      {/* Mesh Gradient Background Blobs */}
      <div className="absolute -top-40 -left-40 w-110 h-110 bg-blue-200/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-100/30 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-110 h-110 bg-orange-100/40 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Top Banner & Clock Area - Hidden on Printing */}
      <header className="bg-white/40 backdrop-blur-xl border-b border-white/50 py-3.5 px-6 sm:px-10 flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="bg-emerald-550 text-white rounded-xl p-2 font-bold text-sm tracking-widest shadow-md shadow-emerald-500/10">
            ระบบดูแล
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-850 flex items-center gap-1.5 selection:bg-transparent">
              ระบบสารสนเทศการเยี่ยมบ้านนักเรียนอัจฉริยะ (Student Visit AI)
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5">โรงเรียนบ้านหนองหว้า สังกัดสำนักงานเขตพื้นที่การศึกษาประถมศึกษาบุรีรัมย์ เขต 3</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] bg-white/40 backdrop-blur-md border border-white/50 text-slate-700 px-2.5 py-1 rounded-full font-bold inline-block font-mono">
              {timeStr || "กำลังคำนวณปฏิทิน..."}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
              ระดับชั้นเรียนประจํา: ป.4/1 (ครูปรจำชั้น: คุณครูกิตติยา รักเรียน)
            </span>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6 relative z-10">
        
        {/* Navigation Sidebar menu - Hidden on Printing */}
        <aside className="lg:col-span-1 space-y-4 print:hidden">
          <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 p-4 space-y-1 shadow-xs">
            <button
              onClick={() => { setCurrentSection('dashboard'); setSelectedStudentForVisit(''); }}
              className={`w-full flex items-center gap-3 p-3 text-xs font-semibold rounded-xl text-left transition ${
                currentSection === 'dashboard'
                  ? 'bg-slate-850 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <Home className={`w-4 h-4 ${currentSection === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'}`} />
              แผงควบคุมหลัก
            </button>
            <button
              onClick={() => { setCurrentSection('students'); setSelectedStudentForVisit(''); }}
              className={`w-full flex items-center gap-3 p-3 text-xs font-semibold rounded-xl text-left transition ${
                currentSection === 'students'
                  ? 'bg-slate-850 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <Users className={`w-4 h-4 ${currentSection === 'students' ? 'text-emerald-400' : 'text-slate-400'}`} />
              ทำเนียบนักเรียน ({students.length})
            </button>
            <button
              onClick={() => { setCurrentSection('form'); setSelectedStudentForVisit(''); }}
              className={`w-full flex items-center gap-3 p-3 text-xs font-semibold rounded-xl text-left transition ${
                currentSection === 'form'
                  ? 'bg-slate-850 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <FileText className={`w-4 h-4 ${currentSection === 'form' ? 'text-emerald-400' : 'text-slate-400'}`} />
              บันทึกเยี่ยมบ้านใหม่
            </button>
            <button
              onClick={() => { setCurrentSection('records'); setSelectedStudentForVisit(''); }}
              className={`w-full flex items-center gap-3 p-3 text-xs font-semibold rounded-xl text-left transition ${
                currentSection === 'records'
                  ? 'bg-slate-850 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${currentSection === 'records' ? 'text-emerald-400' : 'text-slate-400'}`} />
              รายงานและเอกสารพิมพ์
            </button>
            <button
              onClick={() => { setCurrentSection('checklist'); setSelectedStudentForVisit(''); }}
              className={`w-full flex items-center gap-3 p-3 text-xs font-semibold rounded-xl text-left transition ${
                currentSection === 'checklist'
                  ? 'bg-slate-850 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <ListTodo className={`w-4 h-4 ${currentSection === 'checklist' ? 'text-emerald-400' : 'text-slate-400'}`} />
              เช็กสเตปลิมิตครู ({checklist.filter(i => i.completed).length}/{checklist.length})
            </button>
            <button
              onClick={() => { setCurrentSection('php-mysql'); setSelectedStudentForVisit(''); }}
              className={`w-full flex items-center gap-3 p-3 text-xs font-semibold rounded-xl text-left transition ${
                currentSection === 'php-mysql'
                  ? 'bg-slate-850 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <Database className={`w-4 h-4 ${currentSection === 'php-mysql' ? 'text-emerald-400' : 'text-slate-400'}`} />
              ส่งออก PHP & MySQL
            </button>
          </div>

          {/* Quick Stats Widget box */}
          <div className="bg-slate-900/80 backdrop-blur-md text-white p-5 rounded-2xl border border-white/10 shadow-md relative overflow-hidden" id="helper-widget">
            <span className="text-[9px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded uppercase tracking-wider block w-max">
              สิทธิคู่มือครู
            </span>
            <h4 className="text-xs font-bold mt-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              การเข้าคัดกรองวิเคราะห์ AI
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              เมื่อทำการกรอกบรรยากาศบ้านเรือนและข้อความบันทึกครู ให้สลับไปที่แท็บ 'AI หน้าสรุป' เพื่อส่งผ่านข้อมูลประเมินความเสี่ยง SDQ ถือเป็นตัวช่วยประหยัดเวลาการทำเอกสารและให้ความช่วยเหลือเร่งด่วน!
            </p>
          </div>
        </aside>

        {/* Content Panel Area */}
        <main className="lg:col-span-4 space-y-6">
          
          {currentSection === 'dashboard' && (
            <Dashboard
              students={students}
              records={records}
              checklist={checklist}
              schedules={schedules}
              onAddSchedule={handleAddSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onSelectVisit={handleSelectVisit}
            />
          )}

          {currentSection === 'students' && (
            <StudentList
              students={students}
              onAddStudent={handleAddStudent}
              onEditStudent={handleEditStudent}
              onSelectVisit={handleSelectVisit}
            />
          )}

          {currentSection === 'form' && (
            <VisitForm
              students={students}
              initialStudentId={selectedStudentForVisit}
              onSave={handleSaveVisitRecord}
              onCancel={() => setCurrentSection('dashboard')}
            />
          )}

          {currentSection === 'records' && (
            <VisitHistory
              records={records}
              students={students}
              onImportData={handleImportDataByJson}
              onExportData={handleExportDataByJson}
            />
          )}

          {currentSection === 'checklist' && (
            <PreVisitChecklist
              items={checklist}
              onChange={setChecklist}
            />
          )}

          {currentSection === 'php-mysql' && (
            <PhpMySqlExport />
          )}

        </main>
      </div>

      {/* Footer Area - Hidden on Printing */}
      <footer className="bg-white/40 backdrop-blur-md border-t border-white/40 py-4 text-center text-[10px] text-slate-400 font-semibold print:hidden mt-auto relative z-10">
        ระบบดูแลช่วยเหลือนักเรียน พัฒนาขึ้นด้วยปัญญาประดิษฐ์และมาตรฐาน กสศ. คศน. สพฐ. 2569 ของประเทศไทย • ลิขสิทธิ์ถูกต้องทางราชการ
      </footer>

    </div>
  );
}
