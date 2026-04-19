import React, { useEffect } from 'react';

export default function ContactForm() {
  useEffect(() => {
    // Dynamically load Typeform embed script
    const script = document.createElement('script');
    script.src = "//embed.typeform.com/next/embed.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Clean up script if component unmounts
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm shadow-2xl">
      <div 
        data-tf-live="01KPJSVSKEZQCVAND1DNJ5SBJN" 
        style={{ width: '100%', height: '500px' }}
      ></div>
    </div>
  );
}
