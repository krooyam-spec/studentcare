/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Student, HomeVisitRecord, AIAnalysis, HouseholdMember } from '../types';
import { 
  Sparkles, Save, User, Home, MapPin, 
  Shield, ArrowLeft, Camera, Loader, 
  Check, FileText, Info, Plus, Trash2, Users, FileSignature, Route
} from 'lucide-react';
import SignaturePad from './SignaturePad';

interface VisitFormProps {
  students: Student[];
  initialStudentId?: string;
  onSave: (record: HomeVisitRecord) => void;
  onCancel: () => void;
}

export default function VisitForm({ students, initialStudentId = '', onSave, onCancel }: VisitFormProps) {
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId);
  const [activeStep, setActiveStep] = useState<number>(1);
  
  // General System Settings from App / GAS Style
  const [visitedDate, setVisitedDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitorName, setVisitorName] = useState('ครูสมศรี มีปัญญา');
  const [semester, setSemester] = useState('1');
  const [schoolYear, setSchoolYear] = useState('2569');

  // Step 1: Target student informant
  const [informantName, setInformantName] = useState('');
  const [informantRelation, setInformantRelation] = useState('มารดา');
  
  // Step 2: Guardian Details
  const [familyStatus, setFamilyStatus] = useState('พ่อแม่อยู่ด้วยกัน');
  const [livingWith, setLivingWith] = useState('พ่อ/แม่');
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('');
  const [guardianCitizenId, setGuardianCitizenId] = useState('');
  const [guardianEducation, setGuardianEducation] = useState('');
  const [guardianJob, setGuardianJob] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [stateWelfare, setStateWelfare] = useState('ไม่ได้สวัสดิการแห่งรัฐ');
  
  // Step 3: Household members
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  
  // Step 4: House characteristics
  const [houseOwnership, setHouseOwnership] = useState('บ้านตนเอง');
  const [monthlyRent, setMonthlyRent] = useState<number>(0);
  const [floorMaterial, setFloorMaterial] = useState('ปูน/กระเบื้อง');
  const [wallMaterial, setWallMaterial] = useState('ปูน/อิฐ');
  const [roofMaterial, setRoofMaterial] = useState('กระเบื้องลอน');
  const [hasToilet, setHasToilet] = useState('มี');
  const [farmLand, setFarmLand] = useState<number>(0);
  const [waterSource, setWaterSource] = useState('น้ำประปา');
  const [electricity, setElectricity] = useState('มีไฟฟ้าใช้');
  const [vehicles, setVehicles] = useState('');
  const [burdens, setBurdens] = useState<string[]>([]); // ภาระพึ่งพิง

  // Step 5: Travel / Logistics
  const [travelMethod, setTravelMethod] = useState('รถจักรยานยนต์');
  const [travelDistance, setTravelDistance] = useState<number>(0);
  const [travelTime, setTravelTime] = useState('');
  const [travelCost, setTravelCost] = useState<number>(0);
  const [dailyAllowance, setDailyAllowance] = useState<number>(0);
  const [homeAddress, setHomeAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  // Step 6: Images (Base64)
  const [studentImage, setStudentImage] = useState('');
  const [outsideImage, setOutsideImage] = useState('');
  const [insideImage, setInsideImage] = useState('');

  // Step 7: Signatures (Base64)
  const [sigStudent, setSigStudent] = useState('');
  const [sigParent, setSigParent] = useState('');
  const [sigTeacher, setSigTeacher] = useState('');
  const [sigGov, setSigGov] = useState('');
  const [sigDirector, setSigDirector] = useState('');

  const [sigStudentName, setSigStudentName] = useState('');
  const [sigParentName, setSigParentName] = useState('');
  const [sigTeacherName, setSigTeacherName] = useState('ครูสมศรี มีปัญญา');
  const [sigGovName, setSigGovName] = useState('');
  const [sigGovPosition, setSigGovPosition] = useState('ผู้ใหญ่บ้านหมู่ 2');
  const [sigDirectorName, setSigDirectorName] = useState('นายณรงค์วิทย์ สุวรรณศรี');

  const [manualRiskAssessment, setManualRiskAssessment] = useState<'normal' | 'medium' | 'high'>('normal');
  const [manualActionNotes, setManualActionNotes] = useState('');

  // AI states
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState('');

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Auto fill details on changing student
  useEffect(() => {
    if (selectedStudent) {
      setInformantName(selectedStudent.guardianName || '');
      setInformantRelation(selectedStudent.guardianRelation || 'มารดา');
      setGuardianName(selectedStudent.guardianName || '');
      setGuardianRelation(selectedStudent.guardianRelation || '');
      setGuardianPhone(selectedStudent.phone || '');
      setHomeAddress(selectedStudent.address || '');
      setLatitude(selectedStudent.latitude || null);
      setLongitude(selectedStudent.longitude || null);
      setSigStudentName(selectedStudent.name || '');
      setSigParentName(selectedStudent.guardianName || '');
      
      // Initialize household members list with the student as first member
      setMembers([
        {
          memberId: `M-${Date.now()}-0`,
          fullName: selectedStudent.name,
          relation: 'ตัวนักเรียน',
          citizenId: selectedStudent.citizenId || '',
          age: '15',
          totalIncome: 0
        }
      ]);
    } else {
      setMembers([]);
    }
  }, [selectedStudentId, students]);

  // Loading steps text for AI analysis animations
  useEffect(() => {
    if (!aiLoading) return;
    const steps = [
      'เชื่อมต่อระบบคัดกรองอัจฉริยะ AI (Gemini L3)...',
      'วิเคราะห์ดัชนีรายได้ครัวเรือนเฉลี่ยและสิทธิความเสี่ยง...',
      'ประเมินลักษณะที่อยู่อาศัย ความปลอดภัย และภาระพึ่งพิง...',
      'ตรวจสอบลักษณะพื้นที่เดินทาง ความเหนื่อยยากล้าพิกัดแนะแแนว...',
      'จัดตั้งสูตรแผนพัฒนาเฉพาะวิถีเพื่อป้องกันการหลุดออกจากระบบ...'
    ];
    let count = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      count = (count + 1) % steps.length;
      setLoadingStep(steps[count]);
    }, 2500);
    return () => clearInterval(interval);
  }, [aiLoading]);

  // Calculate totals and averages
  const totalHouseholdIncome = members.reduce((sum, m) => sum + (Number(m.totalIncome) || 0), 0);
  const avgHouseholdIncome = members.length > 0 ? totalHouseholdIncome / members.length : 0;

  // Handle location picking simulation
  const handleGetLocation = () => {
    setLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLocating(false);
        },
        (error) => {
          console.error(error);
          const offsetLat = (Math.random() - 0.5) * 0.005;
          const offsetLng = (Math.random() - 0.5) * 0.005;
          setLatitude(selectedStudent?.latitude ? selectedStudent.latitude + offsetLat : 15.1245 + offsetLat);
          setLongitude(selectedStudent?.longitude ? selectedStudent.longitude + offsetLng : 104.6124 + offsetLng);
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setLatitude(15.1245);
      setLongitude(104.6124);
      setLocating(false);
    }
  };

  // Generate AI Analysis based on custom GAS fields
  const handleAIEvaluate = async () => {
    if (!selectedStudentId) {
      alert("กรุณาเลือกนักเรียนก่อนรับความช่วยเหลือคัดกรอง AI");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai/analyze-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: selectedStudent?.name || "นักเรียน",
          guardianRelation: guardianRelation,
          housingStatus: houseOwnership,
          housingCondition: `พื้นบ้านทําจาก ${floorMaterial}, ฝาบ้าน ${wallMaterial}, มุงด้วยหลังคา ${roofMaterial}. ส้วม ${hasToilet}. พื้นทำการเกษตร ${farmLand} ไร่ แหล่งน้ำดื่ม ${waterSource}`,
          familyMonthlyIncome: avgHouseholdIncome, // Pass average income per head
          hasFinancialDebt: Number(monthlyRent) > 0 || stateWelfare === 'ได้รับสวัสดิการแห่งรัฐ',
          familyStatus: familyStatus,
          familyRelationship: `อาศัยด้วยกับ ${livingWith}. มีภาระพึ่งพิง: ${burdens.join(', ') || 'ไม่มี'}`,
          guardianBehavior: `อาชีพโอบอ้อม: ${guardianJob}, วุฒิ ${guardianEducation}`,
          studentBehaviorAtHome: `เดินทางหลักโดย ${travelMethod} ระยะจากที่พัก ${travelDistance} กม. ได้เบี้ยเรียนวันละ ${dailyAllowance} บาท/วัน`,
          studentHealth: selectedStudent?.gender === 'ชาย' ? 'ชาย แข็งแรงดีตามช่วงอายุ' : 'หญิง เรียนดีงามสังเกต',
          learningDifficulty: `ค่าน้ำค่าส่งเดินทางเฉลี่ยเดือนละ ${travelCost} บาท`,
          teacherObservations: `จดทะเบียนปูมพิเศษ: ${manualActionNotes}. รายได้รวมทั้งสิ้น ${totalHouseholdIncome} บาทสำหรับสมาชิก ${members.length} คน`
        })
      });

      const data = await response.json();
      if (data.success && data.aiAnalysis) {
        setAiAnalysis(data.aiAnalysis);
        setManualRiskAssessment(data.aiAnalysis.riskLevel);
        setManualActionNotes(data.aiAnalysis.actionPlan);
      } else {
        throw new Error(data.error || "ระบบขัดข้องกรุณาลองใหม่อีกครั้ง");
      }
    } catch (err: any) {
      console.error(err);
      setAiError("เกิดข้อขัดข้องในการสื่อสารเครือข่าย AI ระบบเลือกประเมินคัดกรองทั่วไปแทน");
    } finally {
      setAiLoading(false);
    }
  };

  const uploadPhotoField = (e: React.ChangeEvent<HTMLInputElement>, type: 'student' | 'outside' | 'inside') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        if (type === 'student') setStudentImage(reader.result);
        if (type === 'outside') setOutsideImage(reader.result);
        if (type === 'inside') setInsideImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const addHouseholdMember = () => {
    setMembers(prev => [
      ...prev,
      {
        memberId: `M-${Date.now()}-${prev.length}`,
        fullName: '',
        relation: '',
        citizenId: '',
        age: '',
        totalIncome: 0
      }
    ]);
  };

  const removeHouseholdMember = (id: string, index: number) => {
    if (index === 0) return; // Prevent deleting student row
    setMembers(prev => prev.filter(m => m.memberId !== id));
  };

  const updateMemberField = (index: number, field: keyof HouseholdMember, value: any) => {
    setMembers(prev => prev.map((m, idx) => idx === index ? { ...m, [field]: value } : m));
  };

  const toggleBurden = (val: string) => {
    setBurdens(prev => prev.includes(val) ? prev.filter(b => b !== val) : [...prev, val]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert("กรุณาเลือกกลุ่มเป้าหมายนักเรียน");
      return;
    }

    const burdensNote = "ภาระพึ่งพิง: " + (burdens.length > 0 ? burdens.join(', ') : 'ไม่มี');

    const record: HomeVisitRecord = {
      id: `REC-${Date.now()}`,
      studentId: selectedStudentId,
      visitedDate,
      semester,
      schoolYear,
      visitorName,
      informantName,
      informantRelation,
      
      // สพฐ / กสศ Fields
      familyStatus,
      livingWith,
      guardianName,
      guardianRelation,
      guardianCitizenId,
      guardianEducation,
      guardianJob,
      guardianPhone,
      stateWelfare,
      totalMembers: members.length,
      
      // Housing
      houseOwnership,
      monthlyRent,
      floorMaterial,
      wallMaterial,
      roofMaterial,
      hasToilet,
      farmLand,
      waterSource,
      electricity,
      vehicles,
      
      // Logistics
      travelMethod,
      travelDistance,
      travelTime,
      travelCost,
      dailyAllowance,
      homeAddress,
      
      latitude,
      longitude,
      
      // 3 Photos
      studentImage,
      outsideImage,
      insideImage,
      
      // 5 Signatures
      signatureStudent: sigStudent,
      signatureParent: sigParent,
      signatureTeacher: sigTeacher,
      signatureGov: sigGov,
      signatureDirector: sigDirector,
      
      teacherName: sigTeacherName,
      directorName: sigDirectorName,
      govName: sigGovName,
      govPosition: sigGovPosition,
      
      note: burdensNote,
      members,
      createdAt: new Date().toISOString(),
      
      manualRiskAssessment,
      manualActionNotes,
      aiAnalysis
    };

    onSave(record);
  };

  const stepsList = [
    { num: 1, name: "1. คัดเลือกนักเรียน", icon: <User className="w-4 h-4" /> },
    { num: 2, name: "2. ข้อมูลครอบครัว", icon: <Shield className="w-4 h-4" /> },
    { num: 3, name: "3. สมาชิกและรายได้", icon: <Users className="w-4 h-4" /> },
    { num: 4, name: "4. ลักษณะบ้านพัก", icon: <Home className="w-4 h-4" /> },
    { num: 5, name: "5. เดินทาง & พิกัด", icon: <Route className="w-4 h-4" /> },
    { num: 6, name: "6. ภาพถ่ายประกอบ", icon: <Camera className="w-4 h-4" /> },
    { num: 7, name: "7. ลายเซ็น 5 ฝ่าย", icon: <FileSignature className="w-4 h-4" /> },
    { num: 8, name: "8. บทวิเคราะห์ AI", icon: <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans select-none">
      {/* HEADER BAR */}
      <div className="bg-slate-950/80 backdrop-blur-md rounded-3xl border border-white/10 p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-emerald-500 to-indigo-500 p-2.5 rounded-2xl text-white font-extrabold shadow-md">
            นร.01
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">บันทึกแบบฟอร์มคัดกรองเยี่ยมบ้านนักเรียน</h1>
            <p className="text-[11px] text-slate-300">สอดคล้องกับระเบียบ สพฐ. / กสศ. โรงเรียนบ้านจันทน์หอมตาเสก</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="bg-transparent border border-white/10 hover:bg-white/10 text-slate-200 text-xs py-2 px-4 rounded-xl transition font-semibold"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedStudentId}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs py-2 px-5 rounded-xl transition font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-700/20"
          >
            <Save className="w-4 h-4" /> บันทึกรายงาน สพฐ. นร.01
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8 items-start">
        {/* SIDE BAR NAVIGATION */}
        <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-4 space-y-2.5 shadow-sm lg:sticky lg:top-5">
          <h2 className="text-xs font-extrabold text-slate-550 border-b pb-2 mb-2 px-2 uppercase tracking-widest">ขั้นตอนประวัติ นร.01</h2>
          {stepsList.map(step => (
            <button
              key={step.num}
              type="button"
              onClick={() => {
                setActiveStep(step.num);
                if (step.num === 8 && !aiAnalysis && selectedStudentId) {
                  handleAIEvaluate();
                }
              }}
              className={`w-full text-left p-3 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeStep === step.num
                  ? 'bg-slate-900 text-white shadow-md translationScale'
                  : 'bg-white/50 text-slate-600 hover:bg-white/80 border border-white/40'
              }`}
            >
              {step.icon}
              <span className="truncate">{step.name}</span>
            </button>
          ))}
          <div className="pt-3 border-t border-white/40 px-2">
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-center">
              <span className="text-[10px] text-indigo-700 font-bold block uppercase">กสศ. นร.01 ปรับปรุง</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide">6 มี.ค. 2569</span>
            </div>
          </div>
        </div>

        {/* STEP CONTENT PANEL */}
        <div className="lg:col-span-3 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 md:p-8 shadow-sm">
          
          {/* STEP 1: SELECT TARGET STUDENT */}
          {activeStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-850 flex items-center gap-2 border-l-4 border-emerald-500 pl-2">
                  1. คัดเลือกนักเรียนเป้าหมายในการตรวจประเมิน
                </h3>
                <p className="text-xs text-slate-450 mt-1">คัดเลือกระดับชั้นเรียนและตัวนักเรียน ระบบจะดึงฐานข้อมูลมาตั้งต้นให้ทันที</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">เลือกกลุ่มนักเรียนปูมความเหมาะสม <span className="text-red-500">*</span></label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl focus:outline-none"
                    required
                  >
                    <option value="">-- ค้นรหัสชื่อเพื่อเยี่ยมบ้าน --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        [{s.grade}] {s.name} ({s.nickname})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">ปีการศึกษาบันทึกข้อมูล</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      placeholder="ภาคเรียน เช่น 1"
                      className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl text-center"
                    />
                    <input
                      type="text"
                      value={schoolYear}
                      onChange={(e) => setSchoolYear(e.target.value)}
                      placeholder="ปีการศึกษา"
                      className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl text-center"
                    />
                  </div>
                </div>
              </div>

              {selectedStudent && (
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{selectedStudent.prefix} {selectedStudent.name} (น้อง{selectedStudent.nickname})</h4>
                    <p className="text-[11px] text-slate-400 mt-1">เลขประจำตัวนักเรียน: {selectedStudent.studentCode} | ชั้น: {selectedStudent.grade}</p>
                    <p className="text-[11px] text-slate-500 mt-1">ที่อยู่เดิม: {selectedStudent.address}</p>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border text-center shrink-0">
                    <span className="text-[10px] text-slate-400 block uppercase">เลขบัตรประชาชน</span>
                    <strong className="text-xs font-mono text-slate-800">{selectedStudent.citizenId}</strong>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">ชื่อครูผู้ตรวจเยี่ยมบ้านหลัก</label>
                  <input
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">ลงวันที่เข้าเยี่ยม</label>
                  <input
                    type="date"
                    value={visitedDate}
                    onChange={(e) => setVisitedDate(e.target.value)}
                    className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">ชื่อผู้ให้ข้อมูลสัมภาษณ์</label>
                  <input
                    type="text"
                    value={informantName}
                    onChange={(e) => setInformantName(e.target.value)}
                    placeholder="เช่น ยายศรี นิ่มจิ๋ว"
                    className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: FAMILY / PROFILE */}
          {activeStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-850 flex items-center gap-2 border-l-4 border-emerald-500 pl-2">
                  2. ข้อมูลสถานภาพครอบครัวและผู้ปกครอง
                </h3>
                <p className="text-xs text-slate-450 mt-1">คัดค้านระดับสังคมครอบครัว และความสัมพันธ์ที่ผูกครองตัวนักเรียน</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">สถานภาพครอบครัว (ประธานอุปถัมภ์)</label>
                  <select
                    value={familyStatus}
                    onChange={(e) => setFamilyStatus(e.target.value)}
                    className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                  >
                    <option value="พ่อแม่อยู่ด้วยกัน">พ่อแม่อยู่ด้วยกัน</option>
                    <option value="พ่อแม่แยกกันอยู่">พ่อแม่แยกกันอยู่</option>
                    <option value="พ่อแม่หย่าร้าง">พ่อแม่หย่าร้าง</option>
                    <option value="พ่อเสียชีวิต/สาบสูญ">พ่อเสียชีวิต/สาบสูญ</option>
                    <option value="แม่เสียชีวิต/สาบสูญ">แม่เสียชีวิต/สาบสูญ</option>
                    <option value="เสียชีวิตทั้งคู่">เสียชีวิตทั้งคู่</option>
                    <option value="พ่อ/แม่ทอดทิ้ง">พ่อ/แม่ทอดทิ้ง</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">ปัจจุบันนักเรียนอาศัยอยู่กับ</label>
                  <select
                    value={livingWith}
                    onChange={(e) => setLivingWith(e.target.value)}
                    className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                  >
                    <option value="พ่อ/แม่">พ่อ/แม่</option>
                    <option value="ญาติ">ญาติ</option>
                    <option value="อยู่ลำพัง">อยู่ลำพัง</option>
                    <option value="ผู้อุปการะ/นายจ้าง">ผู้อุปการะ/นายจ้าง</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <h4 className="text-xs font-bold text-slate-800 mb-3">รายละเอียดความมั่นคงของผู้ปกครองที่นักเรียนพึ่งพิง</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">ชื่อ-สกุล ผู้ปกครอง</label>
                    <input
                      type="text"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder="เช่น นายแสนสุข ใจภักดี"
                      className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">ความสัมพันธ์กับนักเรียน</label>
                    <input
                      type="text"
                      value={guardianRelation}
                      onChange={(e) => setGuardianRelation(e.target.value)}
                      placeholder="เช่น บิดา, ยาย, คุณปู่"
                      className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">บัตรประชาชนผู้ปกครอง</label>
                    <input
                      type="text"
                      value={guardianCitizenId}
                      onChange={(e) => setGuardianCitizenId(e.target.value)}
                      placeholder="หมายเลข 13 หลัก"
                      className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">การศึกษาสูงสุดผู้ปกครอง</label>
                    <input
                      type="text"
                      value={guardianEducation}
                      onChange={(e) => setGuardianEducation(e.target.value)}
                      placeholder="เช่น ปริญญาตรี, ม.6, ป.4"
                      className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">อาชีพหลัก</label>
                    <input
                      type="text"
                      value={guardianJob}
                      onChange={(e) => setGuardianJob(e.target.value)}
                      placeholder="เช่น ทำนามะขาม, รับจ้างทั่วไป"
                      className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">เบอร์โทรศัพท์ติดต่อได้</label>
                    <input
                      type="text"
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-4">
                  <label className="text-xs font-bold text-slate-700">การรับสวัสดิการแห่งรัฐ (บัตรสวัสดิการแห่งรัฐ/ทะเบียนคนจน)</label>
                  <select
                    value={stateWelfare}
                    onChange={(e) => setStateWelfare(e.target.value)}
                    className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                  >
                    <option value="ไม่ได้สวัสดิการแห่งรัฐ">ไม่ได้สวัสดิการแห่งรัฐ</option>
                    <option value="ได้รับสวัสดิการแห่งรัฐ">ได้รับสวัสดิการแห่งรัฐ</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: HOUSEHOLD members table */}
          {activeStep === 3 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-850 flex items-center gap-2 border-l-4 border-emerald-500 pl-2">
                    3. ตารางรายได้สมาชิกในครัวเรือนทั้งหมด
                  </h3>
                  <p className="text-xs text-slate-450 mt-1">กรอกชื่อสมาชิกในบ้านเพื่อจัดตั้งรายได้เฉลี่ยตามเกณฑ์คัดกรอง สพฐ/กสศ</p>
                </div>
                <button
                  type="button"
                  onClick={addHouseholdMember}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" /> เพิ่มผู้ร่วมสิทธิอาศัย
                </button>
              </div>

              <div className="overflow-x-auto border rounded-2xl bg-white shadow-xs">
                <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-3.5 font-bold text-slate-750">คนที่</th>
                      <th className="p-3.5 font-bold text-slate-750">ชื่อ-สกุล สมาชิก</th>
                      <th className="p-3.5 font-bold text-slate-750 w-32">ความสัมพันธ์</th>
                      <th className="p-3.5 font-bold text-slate-750 w-28 text-center">รหัสประจำตัวประชาชน</th>
                      <th className="p-3.5 font-bold text-slate-750 w-20 text-center">อายุ (ปี)</th>
                      <th className="p-3.5 font-bold text-slate-750 w-36 text-right">รายได้รวมต่อเดือน (บาท)</th>
                      <th className="p-3.5 font-bold text-slate-750 text-center w-14">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {members.map((member, i) => (
                      <tr key={member.memberId} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 font-semibold text-slate-400 text-center">{i + 1}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={member.fullName}
                            onChange={(e) => updateMemberField(i, 'fullName', e.target.value)}
                            placeholder="พิมพ์ชื่อและนามสกุล..."
                            className="p-2 border rounded-xl w-full bg-white/70 focus:outline-none"
                            disabled={i === 0}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={member.relation}
                            onChange={(e) => updateMemberField(i, 'relation', e.target.value)}
                            placeholder="เช่น บิดา"
                            className="p-2 border rounded-xl w-full text-center bg-white/70 focus:outline-none"
                            disabled={i === 0}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={member.citizenId}
                            onChange={(e) => updateMemberField(i, 'citizenId', e.target.value)}
                            placeholder="เลขประชาชน"
                            className="p-2 border rounded-xl w-full text-center bg-white/70 focus:outline-none"
                            disabled={i === 0}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={member.age}
                            onChange={(e) => updateMemberField(i, 'age', e.target.value)}
                            placeholder="0"
                            className="p-2 border rounded-xl w-full text-center bg-white/70 focus:outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={member.totalIncome || ''}
                            onChange={(e) => updateMemberField(i, 'totalIncome', Number(e.target.value))}
                            placeholder="0"
                            className="p-2 border rounded-xl w-full text-right bg-white/70 focus:outline-none"
                          />
                        </td>
                        <td className="p-2 text-center">
                          {i === 0 ? (
                            <span className="text-slate-350 text-[10px] font-semibold">-</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => removeHouseholdMember(member.memberId, i)}
                              className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-5">
                <div className="bg-indigo-50/40 border border-indigo-100/60 p-4.5 rounded-2xl flex flex-col justify-center">
                  <span className="text-[10px] text-indigo-700 font-bold uppercase">รวมรายได้ครัวเรือนทั้งหมดต่อเดือน</span>
                  <strong className="text-xl text-indigo-900 mt-1">{totalHouseholdIncome.toLocaleString()} บาท</strong>
                </div>
                <div className="bg-emerald-50/40 border border-emerald-100/60 p-4.5 rounded-2xl flex flex-col justify-center">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase">รายได้เฉลี่ยครัวเรือนต่อหัวต่อคนต่อเดือน</span>
                  <strong className="text-xl text-emerald-900 mt-1">{avgHouseholdIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</strong>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PHYSICAL HOUSE EXPENDITURES */}
          {activeStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-850 flex items-center gap-2 border-l-4 border-emerald-500 pl-2">
                  4. สถานะลักษณะทางกายภาพที่อยู่อาศัย
                </h3>
                <p className="text-xs text-slate-450 mt-1">คัดลอกส่วนวัสดุก่อสร้าง และยานพาหนะตามเกณฑ์ของ สพฐ.</p>
              </div>

              <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-4">
                <label className="block text-xs font-bold text-orange-950 mb-2">ภาระพึ่งพิงเพิ่มเติมในครัวเรือน (ทำเครื่องหมายเลือกทั้งหมดที่พบสิทธิ์)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-medium text-slate-700">
                  {["มีผู้พิการ", "ผู้ป่วยเรื้อรัง", "ผู้สูงอายุเกิน 60 ปี", "พ่อแม่เลี้ยงเดี่ยว", "ผู้ว่างงานในบ้าน", "ไม่มีภาระพึ่งพิง"].map(option => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={burdens.includes(option)}
                        onChange={() => toggleBurden(option)}
                        className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">ลักษณะการครอบครองกรรมสิทธิ์</label>
                  <select
                    value={houseOwnership}
                    onChange={(e) => setHouseOwnership(e.target.value)}
                    className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                  >
                    <option value="บ้านตนเอง">บ้านตนเอง</option>
                    <option value="อยู่ฟรี">อยู่ฟรี (พักกับผู้อื่น/ป้าลุง)</option>
                    <option value="บ้านเช่า">บ้านเช่า</option>
                    <option value="หอพัก">หอพัก / ห้องเช่าสิทธิร่วม</option>
                  </select>
                </div>

                {houseOwnership === 'บ้านเช่า' && (
                  <div className="flex flex-col gap-1.5 animate-bounce-short">
                    <label className="text-xs font-bold text-red-600">ค่าเช่าบ้านพักต่อเดือน (บาท)</label>
                    <input
                      type="number"
                      value={monthlyRent || ''}
                      onChange={(e) => setMonthlyRent(Number(e.target.value))}
                      className="text-xs px-3.5 py-2.5 bg-white/60 border border-red-200 rounded-xl"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">วัสดุก่อสร้างพื้นหลัก</label>
                  <select value={floorMaterial} onChange={(e) => setFloorMaterial(e.target.value)} className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl">
                    <option value="ดิน/ไม้ไผ่">ดิน/ไม้ไผ่/สับไม้ป่าน</option>
                    <option value="ไม้สภาพดี">กระดานไม้สภาพดี</option>
                    <option value="ปูน/กระเบื้อง">ปูนสำเร็จ / กระเบื้อง</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">วัสดุก่อสร้างฝาหลัก</label>
                  <select value={wallMaterial} onChange={(e) => setWallMaterial(e.target.value)} className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl">
                    <option value="ไม้ไผ่/ใบจาก/สังกะสีเก่า">สังกะสีเก่าชิ้นเล็ก / ไม้ไผ่ขัด</option>
                    <option value="ไม้สภาพดี">แผ่นกระดาษยิปซัม / แผ่นปูนเรียบ</option>
                    <option value="ปูน/อิฐ">อิฐมอญก่อฉาบปูนมิดชิด</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">วัสดุก่อสร้างหลังคา</label>
                  <select value={roofMaterial} onChange={(e) => setRoofMaterial(e.target.value)} className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl">
                    <option value="สังกะสีเก่า/ใบจาก">แฝกไผ่เก่า / ใบจากผุพัง</option>
                    <option value="สังกะสีใหม่/กระเบื้องลอน">สังกะสีทนแดด / กระเบื้องลอนคู่</option>
                    <option value="กระเบื้องโมเนีย/ดาดฟ้าปูน">โมเนียอย่างดี / หลังคาปูนสโลป</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">ห้องส้วมสุขาในบริเวณ</label>
                  <select value={hasToilet} onChange={(e) => setHasToilet(e.target.value)} className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl">
                    <option value="มี">มี (สุขาภิบาลถูกลักษณะ)</option>
                    <option value="ไม่มี">ไม่มี (สุขาไม่มิดชิด/ส้วมพัง)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">ที่ดินทำการเกษตรพึ่งพิง (ไร่)</label>
                  <input
                    type="number"
                    value={farmLand || ''}
                    onChange={(e) => setFarmLand(Number(e.target.value))}
                    placeholder="ระบุจํานวนไร่ (ไม่มีใส่ 0)"
                    className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">แหล่งไฟฟ้าในอาคาร</label>
                  <select value={electricity} onChange={(e) => setElectricity(e.target.value)} className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl">
                    <option value="มีไฟฟ้าใช้">มีไฟฟ้าใช้ (จากเครือข่ายหลัก)</option>
                    <option value="ไม่มีไฟฟ้าใช้">ไม่มีไฟฟ้าใช้ (มืดสลัว/หลอดโซล่าชำรุด)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">แหล่งน้ำดื่มหลักสัญจร</label>
                  <select value={waterSource} onChange={(e) => setWaterSource(e.target.value)} className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl">
                    <option value="น้ำประปา">น้ำประปาหมู่บ้าน/ประปาภูเขา</option>
                    <option value="น้ำฝน/บ่อ">น้ำฝนใส่ตุ่ม / ขุดบ่อตื้นส่วนตัว</option>
                    <option value="น้ำดื่มบรรจุขวดซื้อ">ซื้อน้ำถังกกรองสติกเกอร์สำเร็จ</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">เครื่องใช้/ยานพาหนะติดครัวเรือน (ประเภทและปีใช้งาน)</label>
                  <input
                    type="text"
                    value={vehicles}
                    onChange={(e) => setVehicles(e.target.value)}
                    placeholder="เช่น รถจักรยานยนต์ 3 ปี หรือ เกษตรพ่วง"
                    className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: LOGISTICS & LOCATION COORDINATES */}
          {activeStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-850 flex items-center gap-2 border-l-4 border-emerald-500 pl-2">
                  5. การเดินทางไปโรงเรียนและพิกัดที่เยี่ยมบ้านจริง
                </h3>
                <p className="text-xs text-slate-450 mt-1">คัดลอกส่วนหนทางสัญจรที่มาปูม เพื่อรายงานความอุดหนุน นร.เฉลี่ย</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">วิธีเดินทางหลักมาศึกษา</label>
                  <select value={travelMethod} onChange={(e) => setTravelMethod(e.target.value)} className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl">
                    <option value="เดิน">เดินเท้าสัญจร</option>
                    <option value="จักรยาน">ปั่นจักรยานสองล้อ</option>
                    <option value="รถจักรยานยนต์">ซ้อนมอร์เตอร์ไซค์ส่วนตัว</option>
                    <option value="รถยนต์ส่วนตัว">โดยรถเก๋ง / กระบะครอบครัว</option>
                    <option value="รถรับจ้าง/รถสองแถว">โดยรถกะป้อ / สองแถวรับจ้าง</option>
                    <option value="รถรับส่งนักเรียน">โดยรถตู้ตระเวนโรงเรียนจัดแนะ</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">ระยะทางไป-กลับเฉลี่ย (กม.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={travelDistance || ''}
                    onChange={(e) => setTravelDistance(Number(e.target.value))}
                    className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">เวลาเดินทาง (ไป-กลับรวม)</label>
                  <input
                    type="text"
                    value={travelTime}
                    onChange={(e) => setTravelTime(e.target.value)}
                    placeholder="เช่น 45 นาที"
                    className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">ค่าเดินทางโดยประมาณ (บาท/เดือน)</label>
                  <input
                    type="number"
                    value={travelCost || ''}
                    onChange={(e) => setTravelCost(Number(e.target.value))}
                    placeholder="ไม่มีใส่ 0"
                    className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">เบี้ยเล่าเรียนที่เด็กได้พกพา (บาท/วัน)</label>
                  <input
                    type="number"
                    value={dailyAllowance || ''}
                    onChange={(e) => setDailyAllowance(Number(e.target.value))}
                    className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">ที่ตั้งอาศัยปัจจุบันที่เข้าเจอกลุ่มครอบครัวเป้าหมายที่แท้จริง</label>
                <textarea
                  value={homeAddress}
                  onChange={(e) => setHomeAddress(e.target.value)}
                  placeholder="สลักบ้านเลขที่ หมู่ที่ ซอย ตำบล อำเภอ จังหวัดให้ละเอียด"
                  rows={2}
                  className="text-xs p-3 bg-white/60 border border-white/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                />
              </div>

              <div className="border-t border-slate-100 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">พิกัดทางภูมิศาสตร์พกพา (ละติจูด, ลองจิจูด)</h4>
                    <p className="text-[11px] text-slate-400">ใช้แผนที่ของ Google Maps ในการนำทางระบบ</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={locating}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 transition"
                  >
                    {locating ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5 text-emerald-650" />}
                    ปักดักพิกัดโทรศัทพ์มือถือ
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border text-center font-mono">
                    <span className="text-[10px] text-slate-400 block uppercase">Latitude</span>
                    <strong className="text-xs text-slate-800 mt-1 block">{latitude !== null ? latitude.toFixed(6) : "ยังไม่ได้ระบุพิกัด"}</strong>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border text-center font-mono">
                    <span className="text-[10px] text-slate-400 block uppercase">Longitude</span>
                    <strong className="text-xs text-slate-800 mt-1 block">{longitude !== null ? longitude.toFixed(6) : "ยังไม่ได้ระบุพิกัด"}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: PHOTOGRAPHS */}
          {activeStep === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-850 flex items-center gap-2 border-l-4 border-emerald-500 pl-2">
                  6. ระบบอัปโหลดและรูปถ่ายประกอบรายงาน 3 ประเภท
                </h3>
                <p className="text-xs text-slate-450 mt-1">อัปโหลดไฟล์ภาพหลักที่ครูสังเกตเห็น เพื่อเป็นแนบระเบียบกองทุนยากจน</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Photo 1 */}
                <div className="bg-white/40 border border-white/60 p-4 rounded-3xl text-center space-y-3 shadow-xs">
                  <span className="text-xs font-bold text-slate-850 block">๑. รูปหน้าตรงนักเรียน</span>
                  <div className="relative h-44 bg-slate-50 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center overflow-hidden">
                    {studentImage ? (
                      <img src={studentImage} alt="Face student shot" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center p-3 text-slate-350">
                        <Camera className="w-8 h-8 mb-1" />
                        <span className="text-[10px] font-semibold text-center">คลิกปุ่มอัปโหลดรูปภาพ</span>
                      </div>
                    )}
                  </div>
                  <label className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold py-2 rounded-xl transition cursor-pointer text-center block leading-none">
                    เลือกรูปถ่าย
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadPhotoField(e, 'student')} />
                  </label>
                </div>

                {/* Photo 2 */}
                <div className="bg-white/40 border border-white/60 p-4 rounded-3xl text-center space-y-3 shadow-xs">
                  <span className="text-xs font-bold text-slate-850 block">๒. ภาพภายนอกที่พัก</span>
                  <div className="relative h-44 bg-slate-50 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center overflow-hidden">
                    {outsideImage ? (
                      <img src={outsideImage} alt="Exterior house" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center p-3 text-slate-350">
                        <Camera className="w-8 h-8 mb-1" />
                        <span className="text-[10px] font-semibold text-center">คลิกปุ่มอัปโหลดรูปภาพ</span>
                      </div>
                    )}
                  </div>
                  <label className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold py-2 rounded-xl transition cursor-pointer text-center block leading-none">
                    เลือกรูปถ่าย
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadPhotoField(e, 'outside')} />
                  </label>
                </div>

                {/* Photo 3 */}
                <div className="bg-white/40 border border-white/60 p-4 rounded-3xl text-center space-y-3 shadow-xs">
                  <span className="text-xs font-bold text-slate-850 block">๓. ภาพภายในที่พัก</span>
                  <div className="relative h-44 bg-slate-50 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center overflow-hidden">
                    {insideImage ? (
                      <img src={insideImage} alt="Interior house" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center p-3 text-slate-350">
                        <Camera className="w-8 h-8 mb-1" />
                        <span className="text-[10px] font-semibold text-center">คลิกปุ่มอัปโหลดรูปภาพ</span>
                      </div>
                    )}
                  </div>
                  <label className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold py-2 rounded-xl transition cursor-pointer text-center block leading-none">
                    เลือกรูปถ่าย
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadPhotoField(e, 'inside')} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: SIGNATURE CO-DRAWINGS */}
          {activeStep === 7 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-850 flex items-center gap-2 border-l-4 border-emerald-500 pl-2">
                  7. การลงนามยืนยันเอกสารอิเล็กทรอนิกส์ (5 ฝ่ายสมบูรณ์)
                </h3>
                <p className="text-xs text-slate-450 mt-1">ใช้นิ้วหรือปากกาสิ่งสะกดวาดลายเซ็นบนพื้นที่ตําบลลงทะเบียน นร.01</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SignaturePad
                  label="๑. ลายเซ็นนักเรียนยากจน"
                  roleLabel="ผู้ขอรับรองสิทธิการประเมิน"
                  value={sigStudent}
                  onChange={(b) => setSigStudent(b)}
                  onClear={() => setSigStudent('')}
                  signerName={sigStudentName}
                  onSignerNameChange={setSigStudentName}
                />
                <SignaturePad
                  label="๒. ลายเซ็นผู้ปกครอง"
                  roleLabel="ผู้มอบสัมภาษณ์และยืนยันปูม"
                  value={sigParent}
                  onChange={(b) => setSigParent(b)}
                  onClear={() => setSigParent('')}
                  signerName={sigParentName}
                  onSignerNameChange={setSigParentName}
                />
                <SignaturePad
                  label="๓. ลายเซ็นครูผู้เยี่ยมบ้าน"
                  roleLabel="ครูประจำชั้นเว้นตรวจตามระเบียบ"
                  value={sigTeacher}
                  onChange={(b) => setSigTeacher(b)}
                  onClear={() => setSigTeacher('')}
                  signerName={sigTeacherName}
                  onSignerNameChange={setSigTeacherName}
                />
                <SignaturePad
                  label="๔. ลายเซ็นเจ้าหน้าที่รัฐที่รับรอง"
                  roleLabel="ผู้ใหญ่บ้าน / ครูสอนการบ้านข้าราชการ"
                  value={sigGov}
                  onChange={(b) => setSigGov(b)}
                  onClear={() => setSigGov('')}
                  signerName={sigGovName}
                  onSignerNameChange={setSigGovName}
                />
              </div>

              <div className="border-t border-slate-100 pt-5 flex justify-center w-full">
                <div className="max-w-md w-full">
                  <SignaturePad
                    label="๕. ลายเซ็นประธานอำนวยการสถานศึกษา"
                    roleLabel="ผู้อำนวยการโรงเรียนบ้านจันทน์หอมตาเสก"
                    value={sigDirector}
                    onChange={(b) => setSigDirector(b)}
                    onClear={() => setSigDirector('')}
                    signerName={sigDirectorName}
                    onSignerNameChange={setSigDirectorName}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">กำหนดตำแหน่งเจ้าหน้าที่ของรัฐที่มาร่วมสลักลายนาม</h4>
                  <p className="text-[10px] text-slate-450 mt-1">ตำแหน่งจริงตามกฎ สพฐ. เช่น ผู้ใหญ่บ้าน หรือ สมาชิกอบต.</p>
                </div>
                <input
                  type="text"
                  value={sigGovPosition}
                  onChange={(e) => setSigGovPosition(e.target.value)}
                  placeholder="เช่น ผู้ใหญ่บ้านหมู่ที่ 2"
                  className="text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* STEP 8: AI SCREENING AND ALGORITHM */}
          {activeStep === 8 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-indigo-900 flex items-center gap-2 border-l-4 border-indigo-500 pl-2">
                  8. ศูนย์คำนวณและวิเคราะห์ผล AI คัดกรอง
                </h3>
                <p className="text-xs text-indigo-500/70 mt-1">ใช้ AI (Gemini L3) ในการแปลผลคุณลักษณะที่อยู่อาศัยเพื่อประกอบแผนกองทุนแนะแนว</p>
              </div>

              <div className="bg-indigo-50/40 border border-indigo-100/65 p-4.5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-indigo-900 block">กดวิเคราะห์ด้วย AI เพื่อสร้างโมเดลความช่วยเหลือ</span>
                  <p className="text-[10px] text-indigo-500 mt-1">โมเดล AI จะประเมินจาก รายได้เฉลี่ยครัวเรือน {avgHouseholdIncome.toLocaleString()} บาท สภาพวัสดุเรือนรับ และสภาพแวดล้อมที่ตั้ง</p>
                </div>
                <button
                  type="button"
                  onClick={handleAIEvaluate}
                  disabled={aiLoading}
                  className="bg-indigo-900 hover:bg-slate-850 text-white font-bold text-xs py-2.5 px-5 rounded-xl shrink-0 transition flex items-center gap-2 shadow-lg shadow-indigo-900/10"
                >
                  {aiLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin text-amber-300" />
                      กำลังประมวลแผนพัฒนา...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                      เรียกการประเมินอัจฉริยะ AI
                    </>
                  )}
                </button>
              </div>

              {aiLoading && (
                <div className="bg-slate-50 border p-5 rounded-2xl text-center space-y-2 animate-pulse transition-all">
                  <Loader className="w-6 h-6 animate-spin text-indigo-650 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">{loadingStep}</p>
                </div>
              )}

              {aiError && (
                <div className="bg-amber-50 border border-amber-100 p-4.5 rounded-2xl text-center text-xs text-amber-700">
                  {aiError}
                </div>
              )}

              {aiAnalysis && !aiLoading && (
                <div className="bg-gradient-to-tr from-white to-indigo-50/20 border border-indigo-100 rounded-3xl p-5 md:p-6 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b pb-3 mb-2">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles className="w-4 h-4 text-amber-400" /> ผลการวิเคราะห์สังเคราะห์ความช่วยเหลือ กสศ.
                    </span>
                    <span className={`text-[10px] font-extrabold py-1 px-3 rounded-full ${
                      aiAnalysis.riskLevel === 'high' ? 'bg-red-50 text-red-700 border border-red-100' :
                      aiAnalysis.riskLevel === 'medium' ? 'bg-amber-50 text-amber-750 border border-amber-100' :
                      'bg-emerald-50 text-emerald-800 border border-emerald-100'
                    }`}>
                      ผลประเมิน: {aiAnalysis.riskLevel === 'high' ? 'เสี่ยงออกนอกระบบ (กสศ.พิเศษ)' : aiAnalysis.riskLevel === 'medium' ? 'ค่อนข้างยากจน' : 'ปกติ / อยู่ในสัดส่วนพึ่งพาได้'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-sans">{aiAnalysis.summary}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1.5">
                      <strong className="text-[11px] text-emerald-800 block">จุดเด่น / สัญญาณความเหมาะสม</strong>
                      <ul className="list-disc list-inside text-[11px] text-slate-650 space-y-1">
                        {aiAnalysis.strengths.map((str, idx) => (
                          <li key={idx} className="font-medium">{str}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-1.5">
                      <strong className="text-[11px] text-red-800 block">ประเด็นท้าทาย / ความเสี่ยงในบ้าน</strong>
                      <ul className="list-disc list-inside text-[11px] text-slate-650 space-y-1">
                        {aiAnalysis.challenges.map((str, idx) => (
                          <li key={idx} className="font-medium">{str}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="border-t border-indigo-100/60 pt-4.5 space-y-2">
                    <strong className="text-[11px] text-indigo-900 block">ข้อบันทึกแนะแนวแนะนําโดย AI</strong>
                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/40 text-[11px] text-indigo-950 font-medium">
                      {aiAnalysis.actionPlan}
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-800">ความคิดเห็นและการตัดสินประเมินโดยครูประจำชั้น (บันทึกด้วยมือเจ้าหน้าที่)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-705">ตัดสินระดับความเสี่ยงของนักเรียน</label>
                    <select
                      value={manualRiskAssessment}
                      onChange={(e) => setManualRiskAssessment(e.target.value as any)}
                      className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl font-bold"
                    >
                      <option value="normal">ระดับคัดกรอง: ปกติ</option>
                      <option value="medium">ระดับคัดกรอง: ปานกลาง (ค่อนข้างยากจน)</option>
                      <option value="high">ระดับคัดกรอง: วิกฤต (ยากจนพิเศษ / แนะนำกสศ.)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-705">บันทึกแนวทางการดำเนินงานช่วยเหลือเบื้องต้น</label>
                    <input
                      type="text"
                      value={manualActionNotes}
                      onChange={(e) => setManualActionNotes(e.target.value)}
                      placeholder="เช่น จัดหาทุนยากจน กสศ. มอบเงินอุปโภค..."
                      className="text-xs px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PREV & NEXT CONTROLS BUTTONS */}
          <div className="flex justify-between items-center mt-8 border-t border-white/40 pt-5">
            <button
              type="button"
              onClick={() => setActiveStep(prev => Math.max(prev - 1, 1))}
              disabled={activeStep === 1}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 text-xs font-extrabold py-2 px-4 rounded-xl transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> ขั้นตอนก่อนหน้า
            </button>

            {activeStep < 8 ? (
              <button
                type="button"
                onClick={() => {
                  const nextS = activeStep + 1;
                  setActiveStep(nextS);
                  if (nextS === 8 && !aiAnalysis && selectedStudentId) {
                    handleAIEvaluate();
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold py-2 px-5 rounded-xl transition"
              >
                ขั้นตอนต่อไป
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={!selectedStudentId}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-extrabold py-2 px-6 rounded-xl transition flex items-center gap-1 shadow-lg shadow-emerald-700/10"
              >
                <Save className="w-4 h-4" /> บันทึกรายงานเยี่ยมบ้าน นร.01
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
