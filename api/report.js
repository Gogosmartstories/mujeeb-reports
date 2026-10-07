module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    const personalId = String(body.personalId || "").replace(/\D/g, "");
    const phone = String(body.phone || "").replace(/\D/g, "");

    if (!personalId || !phone) {
      return res.status(400).json({
        success: false,
        message: "يرجى إدخال الرقم الشخصي ورقم هاتف ولي الأمر."
      });
    }

    const googleUrl =
      "https://script.google.com/macros/s/AKfycbxcvzRxnwOaNOtiu_hHEDGr5HzzJNhAZxD1cjddYo9tyQEjssD7f82cdNkMxMTko-jXyA/exec" +
      "?academicId=" + encodeURIComponent(personalId) +
      "&phone=" + encodeURIComponent(phone);

    const response = await fetch(googleUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "Accept": "application/json,text/plain,*/*"
      }
    });

    const text = await response.text();

    if (!response.ok) {
      console.error("Apps Script HTTP error:", response.status, text.slice(0, 500));
      return res.status(502).json({
        success: false,
        message: "تعذر الوصول إلى خدمة التقارير."
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("Invalid Apps Script response:", text.slice(0, 1000));
      return res.status(502).json({
        success: false,
        message: "استجابة خدمة التقارير غير صالحة."
      });
    }

    // لا نخزن تقارير الطالبات في CDN أو المتصفح
    res.setHeader("Cache-Control", "no-store, private");
    return res.status(200).json(data);

  } catch (error) {
    console.error("Report proxy error:", error);
    return res.status(500).json({
      success: false,
      message: "تعذر الاتصال بخدمة التقارير، يرجى المحاولة مرة أخرى."
    });
  }
};
