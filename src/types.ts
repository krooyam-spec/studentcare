/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RiskLevel = 'normal' | 'medium' | 'high' | 'not_assessed';
export type VisitStatus = 'visited' | 'pending' | 'scheduled';

export interface Student {
  id: string; // Map to studentId
  studentCode?: string; // รหัสนักเรียน
  studentIdCard: string; // Backward compatibility for studentCode
  prefix?: string; // คำนำหน้าเด็ก เช่น เด็กชาย, เด็กหญิง
  name: string; // ชื่อ-นามสกุล รวม
  nickname: string;
  gender?: string;
  birthDate?: string; // วัน/เดือน/ปีเกิด
  grade: string; // ชั้นเรียน เช่น ม.3/2
  room?: string; // ห้อง
  citizenId?: string; // เลขประจำตัวประชาชน
  address: string; // ที่อยู่เดิม
  village?: string; // หมู่ที่
  subdistrict?: string; // ตำบล
  district?: string; // อำเภอ
  province?: string; // จังหวัด
  zipcode?: string; // รหัสไปรษณีย์
  parentName?: string;
  parentRelation?: string;
  parentPhone?: string;
  parentJob?: string;
  guardianName: string; // Backward compatibility for parentName
  guardianRelation: string; // Backward compatibility for parentRelation
  phone: string; // Backward compatibility for parentPhone
  latitude: number | null;
  longitude: number | null;
  visitStatus: VisitStatus;
  riskLevel: RiskLevel;
  lastVisitedDate: string | null;
}

export interface AIAnalysis {
  summary: string;
  strengths: string[]; // สัญญาณเชิงบวก / จุดเด่น
  challenges: string[]; // ประเด็นท้าทาย / ปัญหาที่พบ
  riskLevel: 'normal' | 'medium' | 'high';
  actionPlan: string; // แนวทางการช่วยเหลือของโรงเรียน
  suggestedHelp: string[]; // บริการหรือทุนช่วยเหลือที่ควรได้รับ
  assessedAt: string;
}

export interface HouseholdMember {
  memberId: string;
  fullName: string;
  relation: string;
  citizenId: string;
  age: string;
  totalIncome: number;
}

export interface HomeVisitRecord {
  id: string; // visitId
  studentId: string;
  visitedDate: string; // visitDate
  semester: string;
  schoolYear: string;
  visitorName: string; // ชื่อครูผู้ตรวจเยี่ยม
  informantName: string;
  informantRelation: string;
  
  // ข้อมูลครอบครัว (Family Status) จากสัญญาสพฐ นร.01
  familyStatus: string; // "พ่อแม่อยู่ด้วยกัน", "พ่อแม่แยกกันอยู่"
  livingWith: string; // ปัจจุบันนักเรียนอาศัยอยู่กับ
  guardianName: string;
  guardianRelation: string;
  guardianCitizenId: string;
  guardianEducation: string;
  guardianJob: string;
  guardianPhone: string;
  stateWelfare: string; // แหล่งสวัสดิการรัฐ
  totalMembers: number;
  
  // ด้านกายภาพ / ลักษณะที่อยู่อาศัย (GAS config)
  houseOwnership: string; // ลักษณะสิทธิ์ "บ้านตนเอง" | "บ้านเช่า" | "อยู่ฟรี"
  monthlyRent: number;
  floorMaterial: string;
  wallMaterial: string;
  roofMaterial: string;
  hasToilet: string; // "มี" | "ไม่มี"
  farmLand: number; // ที่ดินการเกษตร (ไร่)
  waterSource: string;
  electricity: string;
  vehicles: string; // เครื่องใช้และยานพาหนะ
  
  // ด้านการเดินทาง (Travel)
  travelMethod: string;
  travelDistance: number;
  travelTime: string;
  travelCost: number;
  dailyAllowance: number;
  homeAddress: string; // ที่อยู่ปัจจุบันที่เยี่ยมจริง
  
  latitude: number | null;
  longitude: number | null;
  
  // รูปถ่าย (3 รูปแยกตามสัญญารูปถ่าย)
  studentImage: string; // รูปหน้าตรงนักเรียน
  outsideImage: string; // รูปภายนอกบ้าน
  insideImage: string; // รูปภายในบ้าน
  
  // ลายเซ็น 5 ไฟล์
  signatureStudent: string;
  signatureParent: string;
  signatureTeacher: string;
  signatureGov: string;
  signatureDirector: string;
  
  teacherName: string;
  directorName: string;
  govName: string;
  govPosition: string;
  
  note: string; // จดภาระพึ่งพิงหรือข้อมูลเพิ่มเติม
  members: HouseholdMember[]; // สมาชิกครัวเรือนทั้งหมดรายคน
  createdAt: string;
  
  manualRiskAssessment: 'normal' | 'medium' | 'high';
  manualActionNotes: string;
  aiAnalysis: AIAnalysis | null;

  // Backward compatibility fields
  photos?: string[];
  familyMonthlyIncome?: number;
  teacherObservations?: string;
  housingStatus?: string;
  housingCondition?: string;
  familyRelationship?: string;
  guardianBehavior?: string;
  studentBehaviorAtHome?: string;
  studentHealth?: string;
  learningDifficulty?: string;
}

export interface ScheduleItem {
  id: string;
  studentId: string;
  scheduledDate: string;
  scheduledTime: string;
  notes: string;
  status: 'pending' | 'completed' | 'cancelled';
}

// Checklist สำหรับครู
export interface ChecklistItem {
  id: string;
  task: string;
  category: 'prepare' | 'on_visit' | 'after_visit';
  completed: boolean;
}
