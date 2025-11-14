import React, { useState } from 'react';

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

const Calendar = ({ selectedDate, onDateSelect }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
    const isPast = date < new Date() && date.toDateString() !== new Date().toDateString();
    
    days.push(
      <button
        key={i}
        disabled={isPast}
        onClick={() => onDateSelect(date)}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
          isSelected ? 'bg-brand-gold text-brand-dark font-bold' : 
          isPast ? 'text-gray-600 cursor-not-allowed' : 
          'text-white hover:bg-brand-gray'
        }`}
      >
        {i}
      </button>
    );
  }

  const changeMonth = (amount: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
  };

  return (
    <div className="bg-brand-dark p-4 rounded-lg border border-brand-gray">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)}>&lt;</button>
        <div className="font-bold text-white">
          {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
        </div>
        <button onClick={() => changeMonth(1)}>&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-sm text-gray-400 mb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => <div key={i}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days}
      </div>
    </div>
  );
};

export default Calendar;