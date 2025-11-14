import React from 'react';

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  operatingDays: number[]; // 0=Sun, 1=Mon, etc.
  fullyBookedDays: string[]; // YYYY-MM-DD
  onMonthChange: (date: Date) => void;
  currentMonth: Date;
}

const Calendar = ({ selectedDate, onDateSelect, operatingDays, fullyBookedDays, onMonthChange, currentMonth }: CalendarProps) => {

  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
    const dateString = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
    const isPast = date < new Date() && date.toDateString() !== new Date().toDateString();
    const isClosed = !operatingDays.includes(dayOfWeek);
    const isFullyBooked = fullyBookedDays.includes(dateString);
    
    days.push(
      <button
        key={i}
        disabled={isPast || isClosed || isFullyBooked}
        onClick={() => onDateSelect(date)}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
          isSelected ? 'bg-brand-gold text-brand-dark font-bold' : 
          isPast || isClosed || isFullyBooked ? 'text-gray-600 cursor-not-allowed line-through' : 
          'text-white hover:bg-brand-gray'
        }`}
      >
        {i}
      </button>
    );
  }

  const changeMonth = (amount: number) => {
    onMonthChange(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
  };

  return (
    <div className="bg-brand-dark p-4 rounded-lg border border-brand-gray">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)}>&lt;</button>
        <div className="font-bold text-white">
          {currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
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