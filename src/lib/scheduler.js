/**
 * Generates an empty schedule based on business hours and shift requirements.
 * @param {Object} onboardingData - The data from the onboarding questionnaire.
 * @returns {Array} A 7-day schedule array.
 */
export function generateEmptySchedule(onboardingData) {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const schedule = days.map(day => {
        const dayConfig = onboardingData.hours[day];
        const shifts = [];

        if (dayConfig.active) {
            Object.entries(onboardingData.shiftRequirements).forEach(([type, config]) => {
                for (let i = 0; i < config.count; i++) {
                    shifts.push({
                        id: `${day}-${type}-${i}`,
                        type: type,
                        start: config.start,
                        end: config.end,
                        employeeId: null, // To be filled by manager
                        day: day
                    });
                }
            });
        }

        return {
            day: day,
            active: dayConfig.active,
            open: dayConfig.open,
            close: dayConfig.close,
            shifts: shifts
        };
    });

    return schedule;
}
