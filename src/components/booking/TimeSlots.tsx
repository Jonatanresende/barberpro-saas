import React from 'react';

interface TimeSlotsProps {
  availableTimes: string[];
  bookedTimes: string[];
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
}

const TimeSlots = ({ availableTimes, bookedTimes, selectedTime, onTimeSelect }: TimeSlotsProps) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {availableTimes.map(time => {
        const isBooked = bookedTimes.includes(time);
        const isSelected = selectedTime === time;

        return (
          <button
            key={time}
            disabled={isBooked}
            onClick={() => onTimeSelect(time)}
            className={`p-3 rounded-lg text-center border-2 transition-colors font-semibold ${
              isSelected ? 'bg-brand-gold text-brand-dark border-brand-gold' :
              isBooked ? 'bg-gray-700 text-gray-500 border-gray-700 cursor-not-allowed' :
              'bg-brand-dark text-white border-brand-gray hover:border-brand-gold'
            }`}
          >
            {time}
          </button>
        );
      })}
    </div>
  );
};

export default TimeSlots;