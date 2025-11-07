// Fix: Add GenerateContentResponse to imports for proper typing.
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { ChartData } from '../types';

// Fix: Per coding guidelines, directly initialize GoogleGenAI with the API key from environment variables.
// The key is assumed to be present, so conditional initialization and null checks are removed.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeScores = async (title: string, data: {[key: string]: ChartData}, targetScore?: number): Promise<string> => {
  const model = 'gemini-2.5-pro';
  const dataString = JSON.stringify(data, null, 2);

  const targetScorePromptPart = targetScore
    ? `5.  **เปรียบเทียบกับเป้าหมาย:** วิเคราะห์ผลคะแนนเมื่อเทียบกับคะแนนเป้าหมายที่ ${targetScore} คะแนน ว่ามีรายวิชาหรือระดับชั้นใดบ้างที่สูงหรือต่ำกว่าเป้าหมาย และแตกต่างกันมากน้อยเพียงใดในแต่ละครั้งที่สอบ`
    : '';
  
  const comparisonPromptPart = Object.keys(data).length > 1
    ? `*   **แนวโน้มและผลการเปรียบเทียบ:** เปรียบเทียบผลคะแนนระหว่างครั้งต่างๆ ที่เลือกมา มีแนวโน้มดีขึ้น คงที่ หรือลดลงอย่างไร`
    : '';

  const prompt = `
    ในฐานะผู้เชี่ยวชาญด้านการวิเคราะห์ข้อมูลการศึกษา โปรดวิเคราะห์ข้อมูลผลการทดสอบ O-NET ต่อไปนี้
    หัวข้อ: "${title}"
    ข้อมูลคะแนน (JSON, โดยที่ Key คือชื่อครั้งที่สอบ):
    ${dataString}

    โปรดสรุปประเด็นสำคัญตามรูปแบบด้านล่างนี้ โดยเน้นการเปรียบเทียบหากมีข้อมูลหลายชุด:
    1.  **ภาพรวม:** 
        *   สรุปผลคะแนนโดยรวมของแต่ละครั้งว่าเป็นอย่างไร
        ${comparisonPromptPart}
    2.  **จุดแข็ง:** ระบุรายวิชาหรือระดับชั้นที่ทำคะแนนได้ดีที่สุดในแต่ละครั้ง และวิเคราะห์ว่ามีจุดแข็งที่สม่ำเสมอหรือไม่
    3.  **จุดที่ควรพัฒนา:** ระบุรายวิชาหรือระดับชั้นที่ทำคะแนนได้น้อยที่สุดในแต่ละครั้ง และวิเคราะห์ว่ามีจุดที่ต้องพัฒนาอย่างต่อเนื่องหรือไม่
    4.  **ข้อเสนอแนะ:** เสนอแนะแนวทางในการพัฒนานักเรียนในจุดที่ยังต้องปรับปรุงอย่างเป็นรูปธรรม 1-2 ข้อ โดยพิจารณาจากข้อมูลทั้งหมด
    ${targetScorePromptPart}

    คำตอบต้องเป็นภาษาไทยที่กระชับและเข้าใจง่ายสำหรับครูและผู้บริหาร
    `;

  try {
    // Fix: Add type annotation for the API response.
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing scores with Gemini:", error);
    return "เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล กรุณาลองใหม่อีกครั้ง";
  }
};
