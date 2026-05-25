import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function DateTimePickerMobile({
  value,
  onChange,
  placeholder = 'Select date & time',
  minDateTime = null,
  maxDateTime = null,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value) : new Date()
  );
  
  // Time state for hours and minutes
  const [selectedHour, setSelectedHour] = useState(
    value ? new Date(value).getHours() : new Date().getHours()
  );
  const [selectedMinute, setSelectedMinute] = useState(
    value ? new Date(value).getMinutes() : 0
  );

  // Helper functions (same as date picker)
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateTimeDisabled = (date, hour, minute) => {
    const dateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hour,
      minute
    );

    if (minDateTime && dateTime < new Date(minDateTime)) return true;
    if (maxDateTime && dateTime > new Date(maxDateTime)) return true;
    return false;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const handleDateTimeClick = (day) => {
    const selectedDateTime = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
      selectedHour,
      selectedMinute
    );

    if (!isDateTimeDisabled(selectedDateTime, selectedHour, selectedMinute)) {
      // Convert to ISO format: "2026-05-20T18:30"
      const tzOffset = selectedDateTime.getTimezoneOffset() * 60000; // offset in milliseconds
      const localISOTime = (new Date(selectedDateTime - tzOffset)).toISOString().slice(0, 16);
      
      onChange(localISOTime);
      setIsOpen(false);
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return placeholder;
    
    const dateTime = new Date(dateTimeString);
    const date = dateTime.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    
    const time = dateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    
    return `${date} at ${time}`;
  };

  const monthYear = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Create calendar grid
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Generate hour and minute arrays
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <View style={styles.container}>
      {/* Input Button */}
      <TouchableOpacity
        style={[styles.inputButton, disabled && styles.inputButtonDisabled]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {formatDateTime(value)}
        </Text>
      </TouchableOpacity>

      {/* DateTime Modal */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.navButton} onPress={handlePrevMonth}>
                <Ionicons name="chevron-back" size={24} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.monthYear}>{monthYear}</Text>
              <TouchableOpacity style={styles.navButton} onPress={handleNextMonth}>
                <Ionicons name="chevron-forward" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            {/* Tab for Date / Time Selection */}
            <View style={styles.tabContainer}>
              <Text style={styles.tabLabel}>Select Date</Text>
            </View>

            {/* Week Days Header */}
            <View style={styles.weekDaysContainer}>
              {weekDays.map((day) => (
                <View key={day} style={styles.weekDayCell}>
                  <Text style={styles.weekDayText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <ScrollView scrollEnabled={false} style={styles.calendarGrid}>
              <View style={styles.calendarWeeksContainer}>
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <View key={`empty-${index}`} style={styles.emptyCell} />;
                  }

                  const date = new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    day
                  );
                  const tzOffset = date.getTimezoneOffset() * 60000;
                  const localISOTime = (new Date(date - tzOffset)).toISOString();
                  const dateStr = localISOTime.split('T')[0];
                  const valueDate = value ? value.split('T')[0] : null;
                  const isSelected = valueDate === dateStr;
                  const isDisabledDate = isDateTimeDisabled(date, selectedHour, selectedMinute);

                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayCell,
                        isSelected && styles.selectedDay,
                        isDisabledDate && styles.disabledDay,
                      ]}
                      onPress={() => handleDateTimeClick(day)}
                      disabled={isDisabledDate}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.selectedDayText,
                          isDisabledDate && styles.disabledDayText,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Time Selection Separator */}
            <View style={styles.timeSeparator} />

            {/* Time Selection */}
            <View style={styles.timeContainer}>
              <Text style={styles.timeLabel}>
                <Ionicons name="time-outline" size={16} color="#1F2937" /> Select Time
              </Text>

              <View style={styles.timePickerContainer}>
                {/* Hours */}
                <View style={styles.timePickerColumn}>
                  <Text style={styles.timeColumnLabel}>Hours</Text>
                  <ScrollView
                    style={styles.timeScroll}
                    scrollEventThrottle={16}
                  >
                    {hours.map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.timeOption,
                          selectedHour === hour && styles.selectedTimeOption,
                        ]}
                        onPress={() => setSelectedHour(hour)}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            selectedHour === hour && styles.selectedTimeOptionText,
                          ]}
                        >
                          {String(hour).padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Divider */}
                <Text style={styles.timeDivider}>:</Text>

                {/* Minutes */}
                <View style={styles.timePickerColumn}>
                  <Text style={styles.timeColumnLabel}>Minutes</Text>
                  <ScrollView
                    style={styles.timeScroll}
                    scrollEventThrottle={16}
                  >
                    {minutes.map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        style={[
                          styles.timeOption,
                          selectedMinute === minute && styles.selectedTimeOption,
                        ]}
                        onPress={() => setSelectedMinute(minute)}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            selectedMinute === minute && styles.selectedTimeOptionText,
                          ]}
                        >
                          {String(minute).padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsOpen(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                   // If user clicks Done, select the highlighted/default date
                   const selectedDateTime = new Date(
                     currentMonth.getFullYear(),
                     currentMonth.getMonth(),
                     currentMonth.getDate(),
                     selectedHour,
                     selectedMinute
                   );
                   if (!isDateTimeDisabled(selectedDateTime, selectedHour, selectedMinute)) {
                     const tzOffset = selectedDateTime.getTimezoneOffset() * 60000;
                     const localISOTime = (new Date(selectedDateTime - tzOffset)).toISOString().slice(0, 16);
                     onChange(localISOTime);
                     setIsOpen(false);
                   } else {
                     setIsOpen(false);
                   }
                }}
              >
                <Text style={styles.confirmButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  inputButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },

  inputButtonDisabled: {
    opacity: 0.5,
  },

  inputText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },

  placeholderText: {
    color: '#9CA3AF',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '95%',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },

  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },

  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },

  tabContainer: {
    marginBottom: 12,
    paddingHorizontal: 8,
  },

  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },

  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 8,
  },

  weekDayCell: {
    width: (width - 48) / 7,
    alignItems: 'center',
  },

  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },

  calendarGrid: {
    marginBottom: 12,
    maxHeight: 280,
  },

  calendarWeeksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },

  emptyCell: {
    width: (width - 48) / 7,
    height: 44,
  },

  dayCell: {
    width: (width - 48) / 7,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 8,
  },

  selectedDay: {
    backgroundColor: '#3B82F6',
  },

  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },

  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  disabledDay: {
    opacity: 0.4,
  },

  disabledDayText: {
    color: '#D1D5DB',
  },

  timeSeparator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },

  timeContainer: {
    marginBottom: 12,
  },

  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 120,
    gap: 0,
  },

  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },

  timeColumnLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },

  timeScroll: {
    flex: 1,
    width: '100%',
  },

  timeOption: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },

  selectedTimeOption: {
    backgroundColor: '#EFF6FF',
  },

  timeOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
  },

  selectedTimeOptionText: {
    color: '#3B82F6',
    fontWeight: '600',
  },

  timeDivider: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginHorizontal: 4,
  },

  footer: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },

  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },

  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
