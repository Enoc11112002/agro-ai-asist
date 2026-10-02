export async function generateAgroInsight(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  if (!apiKey) {
    return `Se requiere VITE_GEMINI_API_KEY para activar la IA. Analizando de forma local: ${prompt}`;
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text ?? 'No se obtuvo respuesta del modelo.';
  } catch (error) {
    console.error('Gemini request failed', error);
    return `Fallback local: ${prompt}`;
  }
}
