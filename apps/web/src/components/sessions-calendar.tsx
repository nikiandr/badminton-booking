import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { useTRPC } from "@/utils/trpc";

interface SessionsCalendarProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
}

export function SessionsCalendar({
  selectedDate,
  onSelectDate,
}: SessionsCalendarProps) {
  const [displayMonth, setDisplayMonth] = useState(new Date());
  const trpc = useTRPC();

  const sessionDatesQuery = useQuery(
    trpc.session.getSessionDates.queryOptions({
      month: displayMonth.getMonth(),
      year: displayMonth.getFullYear(),
    })
  );

  const sessionDates = sessionDatesQuery.data ?? [];
  const sessionDateStrings = new Set(
    sessionDates.map((d) => new Date(d).toDateString())
  );

  const handleSelect = (date: Date | undefined) => {
    if (
      date &&
      selectedDate &&
      date.toDateString() === selectedDate.toDateString()
    ) {
      onSelectDate(undefined);
    } else {
      onSelectDate(date);
    }
  };

  return (
    <div className="flex h-full items-start justify-center rounded-xl border border-border/50 bg-card/50 p-4">
      <Calendar
        mode="single"
        modifiers={{
          hasSession: (date) => sessionDateStrings.has(date.toDateString()),
        }}
        modifiersClassNames={{
          hasSession:
            "relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-primary",
        }}
        onMonthChange={setDisplayMonth}
        onSelect={handleSelect}
        selected={selectedDate}
      />
    </div>
  );
}
