/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Simple rule-based expert system for local fallback or when key is missing/invalid
function generateRuleBasedAnalysis(data: any) {
  const {
    studentName = "นักเรียน",
    familyMonthlyIncome = 15000,
    hasFinancialDebt = false,
    housingCondition = "มั่นคงแข็งแรง",
    familyStatus = "อยู่ร่วมกัน",
    learningDifficulty = "ไม่มีปัญหา",
    studentBehaviorAtHome = "",
    teacherObservations = ""
  } = data;

  const income = Number(familyMonthlyIncome) || 12000;
  const isPoor = income < 8000;
  const isCriticalPoor = income < 4000;
  const isDilapidated = housingCondition.includes("ผุพัง") || housingCondition.includes("ทรุดโทรม") || housingCondition.includes("ไม่ระบุข้อมูลปลอดภัย");
  const isBrokenFamily = familyStatus === "หย่าร้าง" || familyStatus === "บิดา/มารดาเสียชีวิต" || familyStatus === "แยกกันอยู่";
  const hasLearningIssue = learningDifficulty !== "ไม่มีปัญหา";
  const textBlob = (studentBehaviorAtHome + " " + teacherObservations).toLowerCase();
  const hasGameIssue = textBlob.includes("เกม") || textBlob.includes("มือถือ") || textBlob.includes("ติดจอ");

  let riskLevel: 'normal' | 'medium' | 'high' = 'normal';
  const strengths: string[] = ["นักเรียนมีประวัติเข้าชั้นเรียนสม่ำเสมอเป็นหลัก", "ผู้ปกครองต้อนรับครูและให้ความร่วมมือดี"];
  const challenges: string[] = [];
  let summary = "";
  let actionPlan = "";
  const suggestedHelp: string[] = [];

  if (isCriticalPoor || isDilapidated || (isPoor && isBrokenFamily)) {
    riskLevel = 'high';
    summary = `นักเรียน ${studentName} มีความเสี่ยงระดับสูง เนื่องจากสภาพแวดล้อมทางบ้านทรุดโทรมหรือโครงสร้างครอบครัววิกฤต ร่วมกับมีเกณฑ์รายได้เฉลี่ยครอบครัวต่ำกว่าเกณฑ์ความยากจนขั้นยากไร้พิเศษ`;
    challenges.push("สภาวะรายได้ครอบครัวต่ำกว่า 4,000 บาทต่อเดือน เสี่ยงต่อการขาดแคลนอาหารและปัจจัยสี่");
    if (isDilapidated) challenges.push("สภาพที่อยู่อาศัยไม่มั่นคง แข็งแรง หรือปลอดภัยต่อสุขภาพร่างกาย");
    if (isBrokenFamily) challenges.push("โครงสร้างสถาบันครอบครัวขาดที่ปรึกษาเลี้ยงดูผู้ใกล้ชิดโดยตรง");
    
    actionPlan = "1. ดำเนินการยื่นประเมินสิทธิ์สมัครรับทุนนยากจนพิเศษเงื่อนไขยากจน (กสศ.) เพื่อรับเงินช่วยเหลือศึกษาต่อเนื่องเร่งด่วน\n2. จัดสรรเครื่องยังชีพและถุงสิ่งของยังชีพฉุกเฉินชุดแรกของหมวดสวัสดิการสถาบัน\n3. ครูฝ่ายปกครองร่วมครูแนะแนวคอยจัดตารางพบปะสังเกตพฤติกรรมในห้องเรียนทุกวันจันทร์";
    suggestedHelp.push("ทุนยากจนพิเศษ (กสศ.) รับการพิจารณาอันดับแรก");
    suggestedHelp.push("ถุงยังชีพบรรเทาทุกข์ และสิทธิ์รับประทานอาหารกลางวันฟรีที่โรงเรียน");
    suggestedHelp.push("เข้ารับคำแนะนำจิตวิทยาดูแลประคับประคองผู้สูญเสียสถานภาพครอบครัว");
  } else if (isPoor || isBrokenFamily || hasLearningIssue || hasGameIssue) {
    riskLevel = 'medium';
    summary = `นักเรียน ${studentName} ประเมินความเสี่ยงอยู่ในระดับปานกลาง อยู่ในสภาวะเฝ้าระวังทางพฤติกรรม ทุนทรัพย์ปานกลาง หรือสัมพันธภาพการเลี้ยงดูที่ควรได้รับการเสริมประคองเพิ่ม`;
    challenges.push("คุณภาพสัมพันธภาพและเวลาการดูแลของผู้ปกครองหลังเลิกเรียนค่อนข้างบีบครั้น");
    if (hasGameIssue) challenges.push("พฤติกรรมการใช้อุปกรณ์อิเล็กทรอนิกส์หรือการเล่นเกมเข้าข่ายกระทบเวลาการทบทวนตำรา");
    if (hasLearningIssue) challenges.push(`พบปัญหาการเรียนหรือสมาธิความจำ: ${learningDifficulty}`);

    actionPlan = "1. ครูประสานพูดคุยกับผู้เชี่ยวชาญด้านพฤติกรรมเด็กเพื่อร่วมสังเกตและช่วยส่งเสริมการปรับตัว\n2. ให้คำแนะผู้ปกครองดูแลการล็อกจอและสลับให้มีเวลาอ่านหนังสือ ทำกิจกรรมนอกห้อง\n3. บันทึกผลสอบย่อยและปรับชั่วโมงการส่งงานให้มีความยืดหยุ่น ยืดเวลาส่งหากผู้ปกครองติดภารกิจทำงานปานกลาง";
    suggestedHelp.push("สิทธิ์ทำเรื่องยืมคอมพิวเตอร์พกพาราชการ (ถ้ามี)");
    suggestedHelp.push("กิจกรรมเสริมการเรียนรู้หลังคาบเรียนฟรีของหมวดส่งเสริมเยาวชน");
    suggestedHelp.push("ทุนการศึกษาปัจจัยพื้นฐานนักเรียนยากจน (สพฐ.)");
  } else {
    riskLevel = 'normal';
    summary = `สถานภาพของนักเรียน ${studentName} ปกติ ครอบครัวน่าอบอุ่นและส่งเสริมสิ่งอำนวยความสะดวกการเรียนได้สมเหตุสมผล ไม่พบจุดพฤติกรรมเปราะบางที่เป็นปัญหาเชิงสังคม`;
    strengths.push("ที่อยู่อาศัยปลอดภัย ถูกลักษณะสะอาดเรียบร้อยดีงาม");
    strengths.push("ผู้ปกครองเป็นที่พึ่งพิงด้านกายภาพและอารมณ์ให้กับบุตรหลานได้อย่างเต็มความเข้าใจ");
    challenges.push("เป้าหมายการส่งเสริมทัศนคติ เชิงรักตนเอง รักการเรียนรู้ และตั้งเจตจํานงสอบปลายภาค");

    actionPlan = "1. รวบรวมข้อมูลงานอดิเรกของนักเรียนเพื่อแนะนำเข้าร่วมโปรแกรมบ่มเพาะปัญญาศึกษาขั้นสูงหลังวิชาปกติ\n2. เชิดชูส่งเสริมความความพร้อมทางบ้านโดยให้เกียรติบัตรครอบครัวส่งเสริมการเรียนรู้ของปีการศึกษา";
    suggestedHelp.push("ทุนโครงการค่ายพัฒนาเด็กทักษะอัจฉริยะ (Gifted / วท. มศว.)");
    suggestedHelp.push("โควตาสมัครฝึกทักษะโปรแกรมมิ่ง ดนตรี หรือกีฬาสกิลเด่นชิงดาวสถาบัน");
  }

  return {
    summary,
    strengths,
    challenges,
    riskLevel,
    actionPlan,
    suggestedHelp,
    assessedAt: new Date().toISOString()
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // AI API Route to analyze student visit records
  app.post("/api/ai/analyze-visit", async (req, res) => {
    try {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey || geminiKey === "MY_GEMINI_API_KEY" || geminiKey.trim() === "") {
        console.warn("GEMINI_API_KEY is not configured or left default. Returning rule-based mock analysis.");
        const fallback = generateRuleBasedAnalysis(req.body);
        return res.json({ success: true, aiAnalysis: fallback, isMock: true });
      }

      const {
        studentName,
        guardianRelation,
        housingStatus,
        housingCondition,
        familyMonthlyIncome,
        hasFinancialDebt,
        familyStatus,
        familyRelationship,
        guardianBehavior,
        studentBehaviorAtHome,
        studentHealth,
        learningDifficulty,
        teacherObservations
      } = req.body;

      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `คุณคือผู้เชี่ยวชาญการแนะแนว จิตวิทยาเด็ก และระบบดูแลช่วยเหลือนักเรียน (Student Care and Support System) ของกระทรวงศึกษาธิการไทย 
หน้าที่ของคุณคือวิเคราะห์ข้อมูลดิบจากการไปเยี่ยมปักหมุดบ้านนักเรียน เพื่อสรุปเชิงคัดกรองแยกความเปราะบาง และเตรียมร่างเขียนแผนการประคองตัวช่วยเหลือที่สามารถจัดขึ้นได้ในโรงเรียน

นี่คือรายละเอียดและผลสรุปการลงพื้นที่เยี่ยมบ้านของ นักเรียนชื่อ "${studentName || "นักเรียน"}" ที่ผู้ปกครองให้ข้อมูล:
1. ข้อมูลครอบครัวและความสัมพันธ์:
   - ผู้ปกครองที่คุยด้วย: ${guardianRelation || "ไม่ระบุรายละเอียดผู้ปกครอง"}
   - สถานภาพการแต่งงานผู้ปกครอง: ${familyStatus || "ไม่ระบุข้อมูล"}
   - สัมพันธภาพในครอบครัว: ${familyRelationship || "ไม่ระบุความลึกซึ้ง"}
   - การเลี้ยงดูเอาใส่ใจ: ${guardianBehavior || "ไม่มีข้อมูลประเมินตรง"}
2. ลักษณะที่พักอาศัยและสภาพความเป็นอยู่:
   - สิทธิดินบ้าน: ${housingStatus || "ไม่ได้รับระบุ"}
   - สภาพความผุพังตัวที่พึ่ง: ${housingCondition || "ไม่ทราบสเตตัสความชำรุด"}
   - รายได้รวมหลังหักลดหย่อนของทั้งบ้าน: ${familyMonthlyIncome !== undefined ? familyMonthlyIncome + " บาท/เดือน" : "ไม่ทราบข้อมูลชัดเจน"}
   - ภาระหนี้สินในระบบ/นอกระบบ: ${hasFinancialDebt ? "มีหนี้สินวิกฤตเกินต้านทาน" : "ไม่มีหนี้สินวิกฤตที่หนักหนา"}
3. สภาพทางกาย พฤติกรรม และสุขลักษณะเด็กนักเรียน:
   - โรคประจำตัว/ข้อบกพร่องทางกาย: ${studentHealth || "ร่างกายปกติสมบูรณ์แข็งแรง"}
   - พฤติกรรมสะท้อนที่บ้าน: ${studentBehaviorAtHome || "ไม่ได้รับระบุรายละเอียดพฤติกรรม"}
   - อุปสรรคการเรียนการอินเทอร์เน็ต: ${learningDifficulty || "ไม่มีอุปสรรคการเรียนซับซ้อน"}
4. บันทึกสังเกตส่วนตัวโดยครูที่ลงพื้นที่ไปเจอด้วยตา:
   "${teacherObservations || "ครูไม่ได้จดบันทึกเขียนรายงานอื่น ๆ ไว้"}"

กรุณาวิเคราะห์และประมวลผลข้อมูลเยี่ยมบ้านข้างต้นทั้งหมดและให้ผลทดลองประเมินออกมาในรูปแบบวัตถุ JSON เชิงโครงสร้างที่สะอาด ปลอดภัย (ห้ามมีคำพูดอารัมภบทอื่นใดนอกเหนือจากเนื้อความใน JSON) โดยตอบกลับเฉพาะโครงตามกฎด้านล่างนี้ และเนื้อความด้านในเป็นภาษาไทยที่นุ่มนวล ถูกหลักวิชาการแนะแนว และอัปเดตสิทธิทุนการศึกษาอย่างเหมาะสม:
(ระมัดระวังคีย์ riskLevel ต้องเลือกตอบค่าใดค่าหนึ่งจาก: 'normal', 'medium', หรือ 'high' เท่านั้น ห้ามตอบค่าภาษาไทยหรือคีย์อื่น!)`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "สรุปภาพประเมินครอบครัวและสถานภาพภาพรวมของนักเรียนคนนี้สั้นๆ 1-3 ประโยคในภาษาไทย",
              },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "จุดเด่น ปัจจัยเกื้อหนุน หรือพฤติกรรมเชิงบวกของนักเรียนและครอบครัว (ภาษาไทย, สรุปสั้นกระชับ อย่างน้อย 2 หัวข้อ)",
              },
              challenges: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "ประเด็นท้าทาย ปัญหา สัญญาณอันตราย หรือสิ่งที่เสี่ยงกระตุ้นให้เด็กขาดความพร้อมศึกษาเล่าเรียน (ภาษาไทย, สรุปสั้นกระชับ อย่างน้อย 2 หัวข้อ)",
              },
              riskLevel: {
                type: Type.STRING,
                description: "ระดับการคัดกรองความปลอดภัยช่วยเหลือตัวนักเรียน โดยระบุเป็นคีย์อักษรละตินเลือกเฉพาะหนึ่งข้อ: 'normal' (เสี่ยงต่ำ/ดั้งเดิม), 'medium' (เสี่ยงปานกลาง ควรดูแลใกล้ชิด), 'high' (เสี่ยงวิกฤตหนักเร่งด่วน)",
              },
              actionPlan: {
                type: Type.STRING,
                description: "ร่างแผนปฏิบัติหรือแนวทางปฏิบัติงานเชิงรุกที่ระบุขั้นตอนให้ครูประจำชั้นนำไปดูแลต่อในภาคเรียน โดยร่างเป็นเนื้อความยาวพอดี (ภาษาไทย)",
              },
              suggestedHelp: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "ทุนอุดหนุน ทุนการศึกษา สิ่งของจำเป็นที่ผู้ปกครองและเด็กพึงได้รับตามเกณฑ์ความเดือดร้อน (ภาษาไทย, 2-3 ข้อ)",
              },
            },
            required: ["summary", "strengths", "challenges", "riskLevel", "actionPlan", "suggestedHelp"],
          },
        },
      });

      const responseText = response.text || "{}";
      const cleaned = responseText.trim();
      let resultObj: any = {};
      
      try {
        resultObj = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error("Failed to parse JSON string from Gemini, string was:", responseText);
        // Fallback inside failure
        return res.json({ success: true, aiAnalysis: generateRuleBasedAnalysis(req.body), isMock: true });
      }
      
      // Sanitise Risk Level
      let finalRiskLevel: 'normal' | 'medium' | 'high' = 'normal';
      if (resultObj.riskLevel === 'high' || resultObj.riskLevel === 'medium' || resultObj.riskLevel === 'normal') {
        finalRiskLevel = resultObj.riskLevel;
      } else {
        const rl = String(resultObj.riskLevel).toLowerCase();
        if (rl.includes('high') || rl.includes('สูง') || rl.includes('วิกฤต')) finalRiskLevel = 'high';
        else if (rl.includes('medium') || rl.includes('กลาง') || rl.includes('เสี่ยง')) finalRiskLevel = 'medium';
      }

      const formattedResult = {
        summary: resultObj.summary || "ประเมินข้อมูลเยี่ยมบ้านสำเร็จเรียบร้อยแล้ว",
        strengths: Array.isArray(resultObj.strengths) ? resultObj.strengths : ["นักเรียนมีท่าทีนบนอบและร่วมมือกันดี"],
        challenges: Array.isArray(resultObj.challenges) ? resultObj.challenges : ["ตรวจสอบพฤติกรรมในห้องเรียนอย่างสม่ำเสมอสปตล์"],
        riskLevel: finalRiskLevel,
        actionPlan: resultObj.actionPlan || "ให้คำปรึกษาปรับเปลี่ยนตารางชีวิตประจำวันและติดตามความคืบหน้าของงานสม่ำเสมอสัปดาห์ละ 1 ครั้ง",
        suggestedHelp: Array.isArray(resultObj.suggestedHelp) ? resultObj.suggestedHelp : ["กองทุนพัฒนาการศึกษาเด็กพิเศษ"],
        assessedAt: new Date().toISOString()
      };

      return res.json({ success: true, aiAnalysis: formattedResult });
    } catch (error: any) {
      console.error("Gemini API error in backend, returning fallback rules:", error);
      const fallback = generateRuleBasedAnalysis(req.body);
      return res.json({
        success: true,
        aiAnalysis: fallback,
        error: error.message || "ล้มเหลวในกระบวนการประมวลคำตอบ AI คลาวด์ ทำการประเมินโลคอลสแตนดาร์ดให้เสร็จสิ้นแทน"
      });
    }
  });

  // Handle Vite middleware or static routes
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on http://0.0.0.0:${PORT}`);
  });
}

startServer();
