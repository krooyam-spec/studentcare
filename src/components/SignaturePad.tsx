/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';

interface SignaturePadProps {
  label: string;
  value: string; // Base64 url
  onChange: (base64: string) => void;
  onClear: () => void;
  signerName: string;
  onSignerNameChange?: (name: string) => void;
  roleLabel?: string;
}

export default function SignaturePad({ label, value, onChange, onClear, signerName, onSignerNameChange, roleLabel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#020617'; // deep slate style
    ctx.lineWidth = 2.5;
  }, [value]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const base64 = canvas.toDataURL('image/png');
    onChange(base64);
  };

  const handleClear = () => {
    onClear();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        onChange(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-4 flex flex-col justify-between hover:border-white/80 transition-all shadow-xs">
      <div className="mb-2">
        <label className="text-xs font-bold text-slate-800 block">{label}</label>
        {roleLabel && <span className="text-[10px] text-slate-450">{roleLabel}</span>}
      </div>
      <div className="relative w-full h-32 bg-slate-50/80 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden cursor-crosshair">
        {value ? (
          <div className="absolute inset-0 bg-white p-2 flex items-center justify-center">
            <img src={value} alt="Signature Preview" className="max-h-full max-w-full object-contain" />
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={320}
            height={128}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full block"
          />
        )}
      </div>
      
      <div className="flex gap-2 mt-3 items-center justify-between">
        <button
          type="button"
          onClick={handleClear}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 py-1.5 px-3 rounded-xl font-bold transition"
        >
          ล้าง
        </button>
        <label className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 py-1.5 px-3 rounded-xl font-bold transition cursor-pointer text-center flex-1">
          อัปโหลดไฟล์ภาพ
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      <div className="mt-3">
        <label className="text-[10px] text-slate-500 font-semibold block mb-1">ลงชื่อกำกับตัวสะกด</label>
        <input
          type="text"
          value={signerName}
          onChange={(e) => onSignerNameChange?.(e.target.value)}
          placeholder="เช่น นายอุดม ขยันหาญ"
          className="text-xs p-2 bg-white/70 border border-white/80 rounded-xl w-full focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
    </div>
  );
}
