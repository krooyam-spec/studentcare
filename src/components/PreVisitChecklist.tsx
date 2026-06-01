/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChecklistItem } from '../types';
import { CheckCircle2, Circle, Plus, Trash2, CheckCircle, Info } from 'lucide-react';

interface PreVisitChecklistProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

export default function PreVisitChecklist({ items, onChange }: PreVisitChecklistProps) {
  const [activeTab, setActiveTab] = useState<'prepare' | 'on_visit' | 'after_visit'>('prepare');
  const [newTask, setNewTask] = useState('');

  const toggleComplete = (id: string) => {
    const updated = items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    onChange(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const newItem: ChecklistItem = {
      id: `CHK-${Date.now()}`,
      task: newTask.trim(),
      category: activeTab,
      completed: false
    };

    onChange([...items, newItem]);
    setNewTask('');
  };

  const handleDeleteTask = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    onChange(updated);
  };

  const filteredItems = items.filter(item => item.category === activeTab);
  const completedCount = filteredItems.filter(item => item.completed).length;
  const totalCount = filteredItems.length;

  return (
    <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-6 shadow-sm" id="checklist-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle className="text-emerald-500 w-5 h-5" />
            รายการที่ต้องตรวจสอบ (Checklist สำหรับครู)
          </h2>
          <p className="text-xs text-slate-500 mt-1">คอยเช็กสิ่งที่ต้องทำเพื่อให้การเยี่ยมบ้านมีประสิทธิภาพและถูกกติกา</p>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
          เสร็จสิ้น {completedCount}/{totalCount}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/30 mb-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('prepare')}
          className={`flex-1 pb-2.5 text-center transition-all ${
            activeTab === 'prepare'
              ? 'border-b-2 border-emerald-500 text-emerald-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          1. ก่อนเยี่ยมบ้าน ({items.filter(i => i.category === 'prepare').length})
        </button>
        <button
          onClick={() => setActiveTab('on_visit')}
          className={`flex-1 pb-2.5 text-center transition-all ${
            activeTab === 'on_visit'
              ? 'border-b-2 border-emerald-500 text-emerald-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          2. ระหว่างลงพื้นที่ ({items.filter(i => i.category === 'on_visit').length})
        </button>
        <button
          onClick={() => setActiveTab('after_visit')}
          className={`flex-1 pb-2.5 text-center transition-all ${
            activeTab === 'after_visit'
              ? 'border-b-2 border-emerald-500 text-emerald-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          3. สรุป/รายงานผล ({items.filter(i => i.category === 'after_visit').length})
        </button>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="เพิ่มสิ่งที่ต้องทำงานที่นี่... (เช่น เตรียมกระเช้าผลไม้)"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="flex-1 text-xs px-3 py-2 bg-white/50 backdrop-blur-md border border-white/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-700 transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* Checklist items */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-white/40 rounded-xl bg-white/20">
          <Info className="w-5 h-5 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs text-slate-400">ยังไม่มีรายการงานจดในหมวดนี้</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className={`flex items-start justify-between gap-3 p-3 rounded-xl border transition-all ${
                item.completed
                  ? 'bg-slate-50/30 backdrop-blur-md border-white/40'
                  : 'bg-white/50 backdrop-blur-sm border-white/50 hover:border-white/80'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleComplete(item.id)}
                className="flex items-start gap-2.5 text-left flex-1"
              >
                {item.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 hover:text-slate-400 shrink-0 mt-0.5" />
                )}
                <span
                  className={`text-xs ${
                    item.completed ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'
                  }`}
                >
                  {item.task}
                </span>
              </button>
              <button
                onClick={() => handleDeleteTask(item.id)}
                className="text-slate-300 hover:text-rose-500 p-0.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
