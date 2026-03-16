import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface AttendanceRecord {
  fileName: string;
  subject: string;
  date: string;
  time: string;
  count: number;
  filePath: string;
}

export default function ViewAttendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editContent, setEditContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [editingSubject, setEditingSubject] = useState<AttendanceRecord | null>(null);
  const [newSubject, setNewSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadAttendanceRecords();
  }, []);

  const loadAttendanceRecords = async () => {
    try {
      if (Platform.OS === 'web') {
        setAttendanceRecords([]);
        setLoading(false);
        return;
      }

      const documentsDirectory = (FileSystem as any).documentDirectory;
      if (!documentsDirectory) {
        setLoading(false);
        return;
      }

      const files = await FileSystem.readDirectoryAsync(documentsDirectory);
      const attendanceFiles = files.filter(file => file.endsWith('.txt'));
      
      const records: AttendanceRecord[] = [];
      
      for (const file of attendanceFiles) {
        try {
          const filePath = `${documentsDirectory}${file}`;
          const content = await FileSystem.readAsStringAsync(filePath);
          
          const nameParts = file.replace('.txt', '').split('_');
          if (nameParts.length >= 3) {
            const subject = nameParts[0];
            const date = nameParts[1];
            const time = nameParts[2].replace(/-/g, ':');
            
            const lines = content.split('\n');
            const countLine = lines[0];
            const countMatch = countLine.match(/The total number of count is (\d+)/);
            const count = countMatch ? parseInt(countMatch[1]) : 0;
            
            records.push({
              fileName: file,
              subject,
              date,
              time,
              count,
              filePath
            });
          }
        } catch (err) {
          console.log('Error reading file:', file, err);
        }
      }
      
      records.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime();
      });
      
      setAttendanceRecords(records);
    } catch (err) {
      console.log('Error loading attendance records:', err);
      Alert.alert('Error', 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => 
      record.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.date.includes(searchQuery)
    );
  }, [attendanceRecords, searchQuery]);

  const viewAttendanceDetails = async (record: AttendanceRecord) => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Not Available', 'File editing is not available on web platform');
        return;
      }

      const content = await FileSystem.readAsStringAsync(record.filePath);
      
      const lines = content.split('\n');
      const firstLine = lines[0];
      const dataLines = lines.slice(2);
      const commaFormattedData = dataLines.filter(line => line.trim()).join(', ');
      const editableContent = `${firstLine}\n\n${commaFormattedData}`;
      
      setEditingRecord(record);
      setEditContent(editableContent);
      setOriginalContent(content);
      setHasChanges(false);
    } catch (err) {
      console.log('Error reading attendance file:', err);
      Alert.alert('Error', 'Failed to read attendance file');
    }
  };

  const handleContentChange = (text: string) => {
    setEditContent(text);
    setHasChanges(text !== originalContent);
  };

  const saveChanges = async () => {
    if (!editingRecord || !hasChanges) return;

    try {
      const lines = editContent.split('\n');
      const dataLine = lines[2] || '';
      const dataItems = dataLine.split(',').map(item => item.trim()).filter(item => item);
      
      const newCount = dataItems.length;
      const updatedFirstLine = `The total number of count is ${newCount}`;
      const lineFormattedContent = `${updatedFirstLine}\n\n${dataItems.join('\n')}`;
      
      await FileSystem.writeAsStringAsync(editingRecord.filePath, lineFormattedContent);
      Alert.alert('Success', 'Attendance record updated successfully');
      setEditingRecord(null);
      setEditContent('');
      setOriginalContent('');
      setHasChanges(false);
      await loadAttendanceRecords();
    } catch (err) {
      console.log('Error saving file:', err);
      Alert.alert('Error', 'Failed to save attendance record');
    }
  };

  const cancelEdit = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to cancel?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard Changes',
            style: 'destructive',
            onPress: () => {
              setEditingRecord(null);
              setEditContent('');
              setOriginalContent('');
              setHasChanges(false);
            }
          }
        ]
      );
    } else {
      setEditingRecord(null);
      setEditContent('');
      setOriginalContent('');
      setHasChanges(false);
    }
  };

  const deleteAttendanceRecord = (record: AttendanceRecord) => {
    Alert.alert(
      'Delete Record',
      `Are you sure you want to delete the attendance record for ${record.subject} on ${record.date}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (Platform.OS !== 'web') {
                await FileSystem.deleteAsync(record.filePath);
              }
              setAttendanceRecords(prev => prev.filter(r => r.fileName !== record.fileName));
              Alert.alert('Success', 'Attendance record deleted successfully');
            } catch (err) {
              console.log('Error deleting file:', err);
              Alert.alert('Error', 'Failed to delete attendance record');
            }
          }
        }
      ]
    );
  };

  const shareOnWhatsApp = async (record: AttendanceRecord) => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Not Available', 'WhatsApp sharing is not available on web platform');
        return;
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(record.filePath, {
          mimeType: 'text/plain',
          dialogTitle: 'Share attendance file to WhatsApp'
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (err) {
      console.log('Error sharing to WhatsApp:', err);
      Alert.alert('Error', 'Failed to share to WhatsApp');
    }
  };

  const openSubjectEditor = (record: AttendanceRecord) => {
    setEditingSubject(record);
    setNewSubject(record.subject);
  };

  const cancelSubjectEdit = () => {
    setEditingSubject(null);
    setNewSubject('');
  };

  const saveSubject = async () => {
    if (!editingSubject || !newSubject.trim()) return;

    const { filePath, date, time } = editingSubject;
    const newFileName = `${newSubject.trim()}_${date}_${time.replace(/:/g, '-')}.txt`;
    const newFilePath = `${(FileSystem as any).documentDirectory}${newFileName}`;

    try {
      await FileSystem.moveAsync({ from: filePath, to: newFilePath });
      setEditingSubject(null);
      await loadAttendanceRecords();
      Alert.alert('Success', 'Subject updated successfully');
    } catch (err) {
      console.log('Error renaming file:', err);
      Alert.alert('Error', 'Failed to update subject');
    }
  };

  const totalStudents = useMemo(() => {
    return filteredRecords.reduce((sum, record) => sum + record.count, 0);
  }, [filteredRecords]);

  const renderAttendanceRecord = ({ item }: { item: AttendanceRecord }) => (
    <View style={styles.recordCard}>
      <View style={styles.cardContent}>
        <View style={styles.recordHeader}>
          <View style={styles.subjectContainer}>
            <Text style={styles.subjectText} numberOfLines={1}>{item.subject}</Text>
            <TouchableOpacity 
              style={styles.inlineRenameBtn} 
              onPress={() => openSubjectEditor(item)}
              activeOpacity={0.6}
            >
              <Ionicons name="pencil" size={14} color="#3498db" />
            </TouchableOpacity>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{item.count} students</Text>
          </View>
        </View>
        
        <View style={styles.dateTimeRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={14} color="#7f8c8d" />
            <Text style={styles.infoText}>{item.date}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={14} color="#7f8c8d" />
            <Text style={styles.infoText}>{item.time}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.cardActionsRow}>
        <TouchableOpacity 
          style={[styles.miniActionBtn, styles.detailsBtn]} 
          onPress={() => viewAttendanceDetails(item)}
        >
          <Ionicons name="eye" size={16} color="#3498db" />
          <Text style={styles.miniActionBtnText}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.miniActionBtn, styles.renameBtn]} 
          onPress={() => openSubjectEditor(item)}
        >
          <Ionicons name="create" size={16} color="#9b59b6" />
          <Text style={[styles.miniActionBtnText, { color: '#9b59b6' }]}>Rename</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.miniActionBtn, styles.whatsappBtn]} 
          onPress={() => shareOnWhatsApp(item)}
        >
          <Ionicons name="logo-whatsapp" size={16} color="#27ae60" />
          <Text style={[styles.miniActionBtnText, { color: '#27ae60' }]}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.miniActionBtn, styles.removeBtn]} 
          onPress={() => deleteAttendanceRecord(item)}
        >
          <Ionicons name="trash" size={16} color="#e74c3c" />
          <Text style={[styles.miniActionBtnText, { color: '#e74c3c' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.screenHeader}>
        <TouchableOpacity 
          style={styles.headerBackBtn} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#1a202c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Logs</Text>
      </View>

      <View style={styles.statsSummary}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{filteredRecords.length}</Text>
          <Text style={styles.statLabel}>Total Records</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{totalStudents}</Text>
          <Text style={styles.statLabel}>Students Marked</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchField}
            placeholder="Filter by subject or date..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <FlatList
        data={filteredRecords}
        renderItem={renderAttendanceRecord}
        keyExtractor={item => item.fileName}
        contentContainerStyle={styles.recordsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyLogs}>
            <Ionicons name="document-text-outline" size={60} color="#cbd5e1" />
            <Text style={styles.emptyLogsText}>
              {searchQuery ? 'No matching logs found.' : 'Your attendance history is empty.'}
            </Text>
          </View>
        }
      />

      {/* Edit Subject Modal */}
      <Modal
        visible={!!editingSubject}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelSubjectEdit}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Edit Subject Name</Text>
            <TextInput
              style={styles.subjectInput}
              value={newSubject}
              onChangeText={setNewSubject}
              placeholder="Enter subject name"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]} 
                onPress={cancelSubjectEdit}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalSaveButton]} 
                onPress={saveSubject}
              >
                <Text style={styles.modalButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Edit Content Screen (Full Screen Overlay) */}
      {editingRecord && (
        <View style={[StyleSheet.absoluteFill, styles.editContainer]}>
          <View style={styles.editHeader}>
            <TouchableOpacity onPress={cancelEdit} style={styles.editBackBtn}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.editHeaderTitle} numberOfLines={1}>
              {editingRecord.subject}
            </Text>
            <TouchableOpacity 
              onPress={saveChanges} 
              disabled={!hasChanges}
              style={[styles.saveHeaderBtn, !hasChanges && { opacity: 0.5 }]}
            >
              <Text style={styles.saveHeaderBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView style={styles.editScrollView} contentContainerStyle={{ padding: 20 }}>
              <Text style={styles.editInstructions}>
                Edit attendance list (one name per line). The total count will be updated automatically.
              </Text>
              <TextInput
                style={styles.editInput}
                value={editContent}
                onChangeText={handleContentChange}
                multiline
                scrollEnabled={false}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  headerBackBtn: {
    padding: 8,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
  },
  statsSummary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -10,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3498db',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#f1f5f9',
    alignSelf: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchField: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#1e293b',
  },
  recordsList: {
    padding: 20,
    paddingBottom: 40,
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subjectContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginRight: 8,
  },
  inlineRenameBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  countBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  cardActionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    backgroundColor: '#fafcfd',
  },
  miniActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  miniActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3498db',
  },
  detailsBtn: {
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
  },
  renameBtn: {
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
  },
  whatsappBtn: {
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
  },
  removeBtn: {},
  emptyLogs: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyLogsText: {
    marginTop: 16,
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: '80%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  subjectInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalCancelButton: {
    backgroundColor: '#f1f5f9',
  },
  modalSaveButton: {
    backgroundColor: '#3498db',
  },
  editContainer: {
    backgroundColor: '#fff',
    zIndex: 100,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  editBackBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  editHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  saveHeaderBtn: {
    backgroundColor: '#3498db',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveHeaderBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  editInstructions: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 22,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  editScrollView: {
    flex: 1,
  },
  editInput: {
    fontSize: 16,
    lineHeight: 28,
    color: '#334155',
    paddingBottom: 100,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
