/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Student, HomeVisitRecord, ChecklistItem, ScheduleItem } from '../types';
import { 
  Users, CheckCircle, AlertTriangle, AlertCircle, 
  Map, Sparkles, Navigation, ListTodo, Search, 
  Play, Calendar, Clock, Plus, Trash2, CheckCircle2
} from 'lucide-react';

interface DashboardProps {
  students: Student[];
  records: HomeVisitRecord[];
  checklist: ChecklistItem[];
  schedules: ScheduleItem[];
  onAddSchedule: (item: ScheduleItem) => void;
  onDeleteSchedule: (id: string) => void;
  onSelectVisit: (id: string) => void;
}

export default function Dashboard({ 
  students, 
  records, 
  checklist, 
  schedules, 
  onAddSchedule, 
  onDeleteSchedule,
  onSelectVisit 
}: DashboardProps) {
  // Stats
  const totalStudents = students.length;
  const visitedCount = students.filter(s => s.visitStatus === 'visited').length;
  const visitPercentage = totalStudents > 0 ? ((visitedCount / totalStudents) * 100).toFixed(1) : "0";
  
  const highRiskCount = students.filter(s => s.riskLevel === 'high').length;
  const mediumRiskCount = students.filter(s => s.riskLevel === 'medium').length;
  const normalCount = students.filter(s => s.riskLevel === 'normal').length;

  const completedTasks = checklist.filter(t => t.completed).length;
  const totalTasks = checklist.length;
  const checklistPercentage = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : "0";

  // Map state
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [navigationPathActive, setNavigationPathActive] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mapScale, setMapScale] = useState(1);
  const [searchMapText, setSearchMapText] = useState('');

  // Scheduler Form States
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [schedStudentId, setSchedStudentId] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedNotes, setSchedNotes] = useState('');

  // School Center coordinates
  const schoolLat = 13.7980;
  const schoolLng = 100.5850;

  // Render simulation map on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and size
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;

    // Background styling - tech grid
    ctx.fillStyle = '#0f172a'; // slate-900 background
    ctx.fillRect(0, 0, w, h);

    // Draw coordinate grids
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Concentric coordinate rings around the school
    const centerSecX = w / 2;
    const centerSecY = h / 2;
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.lineWidth = 1;
    for (let r = 80; r < w; r += 80) {
      ctx.beginPath();
      ctx.arc(centerSecX, centerSecY, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Map latitude/longitude mapping bounds
    // Center is (schoolLat, schoolLng) mapped to (w/2, h/2)
    // Scale factor: how many pixels per 0.001 degree
    const dLatScale = h / 0.05; // range of roughly 0.05 degrees lat
    const dLngScale = w / 0.05; // range of roughly 0.05 degrees lng

    const mapCoords = (lat: number, lng: number) => {
      const dy = lat - schoolLat;
      const dx = lng - schoolLng;
      // Latitude increases upwards, so subtract from center
      const py = centerSecY - dy * dLatScale * mapScale;
      // Longitude increases rightwards, so add to center
      const px = centerSecX + dx * dLngScale * mapScale;
      return { x: px, y: py };
    };

    // Draw simulated navigation path if active
    if (navigationPathActive) {
      const activeStudent = students.find(s => s.id === navigationPathActive);
      if (activeStudent && activeStudent.latitude && activeStudent.longitude) {
        const targetPos = mapCoords(activeStudent.latitude, activeStudent.longitude);
        
        ctx.beginPath();
        ctx.strokeStyle = '#10b981'; // emerald-500
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]); // Dashed line
        ctx.moveTo(centerSecX, centerSecY);
        // Add a midway curved checkpoint to make the path look realistic winding through streets
        const midX = (centerSecX + targetPos.x) / 2 + 30;
        const midY = (centerSecY + targetPos.y) / 2 - 20;
        ctx.quadraticCurveTo(midX, midY, targetPos.x, targetPos.y);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dashed

        // Animated pulse at target pin
        const pulseRadius = 15 + Math.sin(Date.now() / 150) * 5;
        ctx.beginPath();
        ctx.arc(targetPos.x, targetPos.y, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.stroke();
      }
    }

    // Plot Student Pins
    students.forEach(st => {
      if (!st.latitude || !st.longitude) return;
      const pos = mapCoords(st.latitude, st.longitude);

      // Skip drawing if outside boundaries
      if (pos.x < 0 || pos.x > w || pos.y < 0 || pos.y > h) return;

      // Color based on risk assessment
      let pinColor = '#94a3b8'; // grey
      if (st.riskLevel === 'high') pinColor = '#f43f5e'; // rose-500
      if (st.riskLevel === 'medium') pinColor = '#f59e0b'; // amber-500
      if (st.riskLevel === 'normal') pinColor = '#10b981'; // emerald-500

      const isSelected = selectedPinId === st.id;
      
      // Pin outer body
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isSelected ? 11 : 7, 0, Math.PI * 2);
      ctx.fillStyle = pinColor;
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#ffffff' : '#0f172a';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();

      // Mini white dot in center
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isSelected ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Search matching highlight
      if (searchMapText && st.name.toLowerCase().includes(searchMapText.toLowerCase())) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffd700'; // Gold circle highlight
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Name labels overlaying
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(st.nickname, pos.x, pos.y - 12);
    });

    // Draw School Center Icon
    ctx.beginPath();
    ctx.arc(centerSecX, centerSecY, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#6366f1'; // indigo-500
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Small interior star or design for school
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏫', centerSecX, centerSecY);

  }, [students, selectedPinId, navigationPathActive, mapScale, searchMapText, Date.now()]);

  // Click on canvas map to select stud
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const w = canvas.width;
    const h = canvas.height;
    const centerSecX = w / 2;
    const centerSecY = h / 2;
    const dLatScale = h / 0.05;
    const dLngScale = w / 0.05;

    const mapCoords = (lat: number, lng: number) => {
      const dy = lat - schoolLat;
      const dx = lng - schoolLng;
      const py = centerSecY - dy * dLatScale * mapScale;
      const px = centerSecX + dx * dLngScale * mapScale;
      return { x: px, y: py };
    };

    // Find if click is close to any student coordinate (within 12px)
    let foundStudent: Student | null = null;
    for (const student of students) {
      if (!student.latitude || !student.longitude) continue;
      const pos = mapCoords(student.latitude, student.longitude);
      const dist = Math.hypot(clickX - pos.x, clickY - pos.y);
      if (dist <= 14) {
        foundStudent = student;
        break;
      }
    }

    if (foundStudent) {
      setSelectedPinId(foundStudent.id);
      setNavigationPathActive(foundStudent.id); // Trigger navigation line to pins
    } else {
      setSelectedPinId(null);
      setNavigationPathActive(null);
    }
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedStudentId || !schedDate || !schedTime) {
      alert("กรุณาระบุรายชื่อนักเรียน วันและระบเวลานัดหมาย");
      return;
    }

    const newItem: ScheduleItem = {
      id: `SCH-${Date.now()}`,
      studentId: schedStudentId,
      scheduledDate: schedDate,
      scheduledTime: schedTime,
      notes: schedNotes,
      status: 'pending'
    };

    onAddSchedule(newItem);
    // Reset Form
    setSchedStudentId('');
    setSchedDate('');
    setSchedTime('');
    setSchedNotes('');
    setShowScheduleForm(false);
  };

  const selectedStudentPin = students.find(s => s.id === selectedPinId);

  return (
    <div className="space-y-6">
      
      {/* Metric Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Checked rate */}
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-5 flex items-center gap-4 shadow-xs">
          <div className="bg-emerald-50 text-emerald-600 rounded-xl p-3 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold tracking-wider block">เยี่ยมบ้านแล้วเสร็จ</span>
            <span className="text-xl font-extrabold text-slate-800">{visitPercentage}%</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">({visitedCount} จาก {totalStudents} คน)</span>
          </div>
        </div>

        {/* Metric 2: High Risk */}
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-5 flex items-center gap-4 shadow-xs">
          <div className="bg-rose-50 text-rose-500 rounded-xl p-3 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold tracking-wider block">ความเสี่ยง: ระดับสูง</span>
            <span className="text-xl font-extrabold text-slate-800">{highRiskCount} คน</span>
            <span className="text-[10px] text-rose-500 font-semibold mt-0.5 block">ควรเร่งประสานช่วยเหลือเด็ดขาด</span>
          </div>
        </div>

        {/* Metric 3: Med Risk */}
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-5 flex items-center gap-4 shadow-xs">
          <div className="bg-amber-50 text-amber-500 rounded-xl p-3 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold tracking-wider block">ความเสี่ยง: ปานกลาง</span>
            <span className="text-xl font-extrabold text-slate-800">{mediumRiskCount} คน</span>
            <span className="text-[10px] text-amber-600 font-semibold mt-0.5 block">มีพฤติกรรมควรเฝ้าระวังดูแล</span>
          </div>
        </div>

        {/* Metric 4: Checklist completed */}
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-5 flex items-center gap-4 shadow-xs">
          <div className="bg-slate-850/80 backdrop-blur-md text-white rounded-3xl p-5 flex items-center gap-4 shadow-xs">
            <div className="bg-slate-800 text-white rounded-xl p-3 shrink-0">
              <ListTodo className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <span className="text-[11px] text-slate-300 font-semibold tracking-wider block">รายการงานต้องทำ</span>
              <span className="text-xl font-extrabold text-white">{checklistPercentage}%</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">({completedTasks} จาก {totalTasks} หัวข้อเสร็จสิ้น)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Geolocator Radar Interactive canvas map */}
        <div className="lg:col-span-2 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Map className="w-4.5 h-4.5 text-indigo-500" />
                สแกนพิกัดภูมิศาสตร์เยี่ยมบ้านนักเรียนใหม่ (Geolocator)
              </h3>
              <p className="text-[11px] text-slate-400">เรดาร์สแกนจุดเยี่ยมของปัญญาวิทยา ค้นหากดปักหมุดครูเพื่อเริ่มวางจำลองนำทาง</p>
            </div>
            
            {/* search in map */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="พิมพ์ชื่อค้นหาในแผนที่..."
                value={searchMapText}
                onChange={(e) => setSearchMapText(e.target.value)}
                className="text-[11px] pl-8 pr-3 py-1.5 w-40 bg-white/50 backdrop-blur-md border border-white/60 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-white/60">
            <canvas
              ref={canvasRef}
              width={650}
              height={320}
              onClick={handleCanvasClick}
              className="w-full aspect-[2/1] cursor-pointer block"
            />

            {/* Map overlays / zoom tools */}
            <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 text-[10px] font-bold text-slate-300">
              <button 
                onClick={() => setMapScale(prev => Math.min(prev + 0.1, 2.5))}
                className="hover:text-white px-1 font-semibold"
              >
                ขยาย (+)
              </button>
              <span className="text-slate-600">|</span>
              <button 
                onClick={() => setMapScale(prev => Math.max(prev - 0.1, 0.4))}
                className="hover:text-white px-1 font-semibold"
              >
                ย่อ (-)
              </button>
            </div>
          </div>

          {/* Pin selected detail popup box */}
          {selectedStudentPin ? (
            <div className="bg-slate-900/90 backdrop-blur-md text-white rounded-xl p-4 border border-white/10 animate-in slide-in-from-bottom-2 duration-120 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex gap-3 items-center">
                <span className="text-2xl font-bold uppercase shrink-0 bg-slate-800 w-10 h-10 rounded-full flex items-center justify-center">
                  💡
                </span>
                <div>
                  <h4 className="text-xs font-bold">{selectedStudentPin.name} (ด.ช./ด.ญ. {selectedStudentPin.nickname}) - {selectedStudentPin.grade}</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5 mt-0.5">พิกัดทางภูมิศาสตร์: {selectedStudentPin.latitude?.toFixed(4)}, {selectedStudentPin.longitude?.toFixed(4)}</p>
                  <p className="text-[10px] text-slate-300">ติดต่อผู้ปกครอง: {selectedStudentPin.phone}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onSelectVisit(selectedStudentPin.id)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-[10px] py-1.5 px-3 rounded-lg transition flex items-center gap-1 shrink-0"
                >
                  <Play className="w-3 h-3 text-white" /> ดำเนินเยี่ยมบ้าน
                </button>
                <button
                  onClick={() => setNavigationPathActive(selectedStudentPin.id)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-[10px] py-1.5 px-3 rounded-lg transition flex items-center gap-1 shrink-0"
                >
                  <Navigation className="w-3 h-3 text-slate-300" /> นำทาง (Simulate)
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-xl p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-slate-300 animate-pulse" />
              คลิกปลาหรือจุดพิกัดในแผนที่เพื่อจำลองการทำแผนผังหรือเริ่มปักหมุด
            </div>
          )}
        </div>

        {/* Visit Scheduler Panel */}
        <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-850 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-500" />
                ตารางนัดหมายเยี่ยมบ้าน
              </h3>
              <p className="text-[11px] text-slate-400">จดบันทึกวันและจัดเตรียมตารางการเข้าตรวจล่วงหน้า</p>
            </div>
            <button
              onClick={() => setShowScheduleForm(!showScheduleForm)}
              className="text-slate-855 hover:text-slate-900 border border-white/60 bg-white/55 backdrop-blur-md p-1 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Schedule Add Form */}
          {showScheduleForm && (
            <form onSubmit={handleCreateSchedule} className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500">เลือกนักเรียนนัดหมาย</label>
                <select
                  value={schedStudentId}
                  onChange={(e) => setSchedStudentId(e.target.value)}
                  className="text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  required
                >
                  <option value="">--เลือกนักเรียน--</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.grade}] {s.name} ({s.nickname})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500">วันที่ลงพื้นที่</label>
                  <input
                    type="date"
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="text-xs p-2 w-full bg-white border border-slate-200 rounded-lg focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500">เวลานัดหมาย</label>
                  <input
                    type="time"
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                    className="text-xs p-2 w-full bg-white border border-slate-200 rounded-lg focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500">บันทึกข้อบันทึกย่อ (Notes)</label>
                <input
                  type="text"
                  placeholder="เช่น ยายสะดวกเวลากินข้าวเที่ยง..."
                  value={schedNotes}
                  onChange={(e) => setSchedNotes(e.target.value)}
                  className="text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleForm(false)}
                  className="bg-transparent border border-slate-200 text-slate-500 text-[10px] px-3 py-1.5 rounded-lg font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold"
                >
                  เพิ่มนัดหมาย
                </button>
              </div>
            </form>
          )}

          {/* Schedule list */}
          {schedules.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-150 rounded-xl bg-slate-50/50">
              <span className="text-2xl block mb-1">📅</span>
              <p className="text-xs text-slate-400">ยังไม่มีประวัตินัดหมายถัดไปจองคิสิ</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1">
              {schedules.map(item => {
                const stud = students.find(s => s.id === item.studentId);
                return (
                  <div key={item.id} className="bg-slate-50 hover:bg-slate-100/70 border border-slate-150 rounded-xl p-3 flex justify-between gap-3 items-start transition">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-700">{stud?.name || "นักเรียน"} ({stud?.nickname || "ไม่มี"})</h4>
                      <p className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {item.scheduledDate} - {item.scheduledTime} น.
                      </p>
                      {item.notes && <p className="text-[10px] text-slate-400 bg-white border border-slate-100 inline-block px-1.5 py-0.5 rounded leading-normal">แนะ: {item.notes}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteSchedule(item.id)}
                      className="text-slate-300 hover:text-rose-500 p-0.5 transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
