import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use(cors());

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
});
const GEMINI_MODEL = "gemini-2.5-flash";
const tools = [
    {
      googleSearch: {
      }
    },
];
const GEMINI_CONFIG = {
    temperature: 0.3,
    thinkingConfig: {
      thinkingBudget: 0,
    },
    tools,
    systemInstruction: [
        {
            text: `Anda adalah Hello Work ID, asisten karir AI yang profesional, ramah, dan sangat berpengalaman untuk pekerja di Indonesia. Tugas Anda adalah membantu pengguna dengan pertanyaan seputar karir, ulasan CV, persiapan wawancara kerja, hukum ketenagakerjaan di Indonesia (seperti UU Cipta Kerja, pesangon, hak lembur, kontrak kerja), atau tips mencari lowongan kerja. Jawablah dalam Bahasa Indonesia yang sopan, terstruktur dengan baik (gunakan tebal, daftar poin, atau paragraf baru), dan mudah dipahami. Jika pengguna mengunggah file CV (PDF), berikan ulasan detail yang memuat kelebihan, kekurangan, dan poin perbaikan yang jelas. Berikan rekomendasi konkret untuk meningkatkan CV mereka agar lebih menarik bagi perusahaan. Tolak permintaan yang tidak relevan dengan topik karir atau hukum ketenagakerjaan. Jangan pernah memberikan informasi yang salah atau menyesatkan. Jika Anda tidak tahu jawabannya, katakan dengan jujur bahwa Anda tidak tahu, dan sarankan pengguna untuk mencari informasi lebih lanjut dari sumber resmi. Selalu prioritaskan memberikan jawaban yang akurat, bermanfaat, dan relevan dengan kebutuhan karir pengguna di Indonesia.`,
        }
    ],
};


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.post("/api/chat", async (req, res) => {
    const { conversation } = req.body;

    try {
        if (!Array.isArray(conversation)) throw new Error("Conversation must be an array of messages.");

        let isValid = true

        conversation.forEach(({ role, text }) => {
        if (!isValid) return;
    
        if (!['model', 'user'].includes(role)) {
            isValid = false;
        }
    
        if (!text || typeof text !== 'string') {
            isValid = false;
        }
        });
    
        if (!isValid) {
        return res.status(400).json({ message: "payload nggak valid gan!" })
        }

        // Process conversation - detect and enhance file content messages
        const processedConversation = conversation.map(({ role, text }) => {
            let processedText = text;
            
            // Detect CV file uploads and add context
            if (text.includes('[CV File:') && text.includes('Content:')) {
                processedText = `${text}\n\n[INSTRUKSI: Analisis CV di atas dan berikan ulasan mendetail tentang kelebihan, kekurangan, dan rekomendasi perbaikan untuk meningkatkan kualitas CV tersebut.]`;
            }
            
            return {
                role,
                parts: [{ text: processedText }],
            };
        });

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: processedConversation,
            config: GEMINI_CONFIG,
        });
        res.status(200).json({ response: response.text });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
