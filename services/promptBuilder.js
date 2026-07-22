export const buildDesignPrompt = (roomType, style, colors, budget, prompt, additionalNotes) => {
  let fullPrompt = "أنت مصمم ديكور داخلي خبير ومحترف في منصة أثاث.";
  if (roomType) fullPrompt += ` نوع الغرفة: ${roomType}.`;
  if (style) fullPrompt += ` الطراز المطلوب: ${style}.`;
  if (colors) fullPrompt += ` الألوان المفضلة: ${colors}.`;
  if (budget) fullPrompt += ` الميزانية: ${budget}.`;
  if (prompt) fullPrompt += ` \nتفاصيل وتوجيهات المستخدم: ${prompt}`;
  if (additionalNotes) fullPrompt += ` \nملاحظات إضافية: ${additionalNotes}`;

  if (!prompt && !roomType) {
    fullPrompt += " قدم اقتراحات عامة لنصائح التصميم الداخلي الحديث.";
  }
  return fullPrompt;
};

export const parseBase64Image = (rawImage) => {
  if (!rawImage) return null;
  let mimeType = 'image/jpeg';
  let data = rawImage;

  if (rawImage.includes(';base64,')) {
    const parts = rawImage.split(';base64,');
    mimeType = parts[0].replace('data:', '');
    data = parts[1];
  }
  return { inlineData: { data, mimeType } };
};
