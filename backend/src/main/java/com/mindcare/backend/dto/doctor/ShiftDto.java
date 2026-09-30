package com.mindcare.backend.dto.doctor;

import com.mindcare.backend.domain.DoctorShift;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record ShiftDto(
        @Min(0) @Max(6) int dayOfWeek,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        int slotDurationMinutes
) {
    public static ShiftDto from(DoctorShift shift) {
        return new ShiftDto(shift.getDayOfWeek(), shift.getStartTime(), shift.getEndTime(), shift.getSlotDurationMinutes());
    }
}
