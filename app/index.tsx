import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import { Button, FlatList, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

export default function Index() {
  const [text, setText] = useState('');
  const [item, setItem] = useState<string[]>([]);
   const [selectedSubject, setSelectedSubject] = useState('DE');
const inputRef = useRef<TextInput>(null);
  function handleAddItem() {
    if (text.trim() !== '') {
      setItem([...item, text]);
      setText('');
      inputRef.current?.focus();
    }
  }
 async function handleSortItems() {
  const uniqueItems = [...new Set(item)];
  const sortedItems = uniqueItems.sort((a, b) => parseInt(a) - parseInt(b));
  setItem(sortedItems);

  const currentDateTime = new Date();
  const dateStr = currentDateTime.toISOString().split('T')[0]; // YYYY-MM-DD format
  const timeStr = currentDateTime.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format
  const fileName = `${selectedSubject}_${dateStr}_${timeStr}.txt`;
   const totalCount = sortedItems.length;
   const fileContent = `The total number of count is ${totalCount}\n\n${sortedItems.join('\n')}`; // add total count at top

  try {
     if (Platform.OS === 'web') {
       // Web browser - trigger download
       const blob = new Blob([fileContent], { type: 'text/plain' });
       const url = URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.download = fileName;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
       console.log(`File ${fileName} downloaded successfully`);
       alert(`File ${fileName} downloaded successfully`);
     } else {
       // Mobile device - save to file system
       const filePath = `${FileSystem.documentDirectory}${fileName}`;
       await FileSystem.writeAsStringAsync(filePath, fileContent);
       console.log(`File ${fileName} written successfully at ${filePath}`);
       alert(`File saved as ${fileName}`);
     }
     
     // Clear the data after successful file operation
     setItem([]);
     setText('');
     inputRef.current?.focus();
  } catch (err) {
     console.log('File operation error:', (err as Error).message);
     alert('Error saving file.');
   }
}

 async function handleWhatsAppShare() {
  const uniqueItems = [...new Set(item)];
  const sortedItems = uniqueItems.sort((a, b) => parseInt(a) - parseInt(b));
  setItem(sortedItems);

  const currentDateTime = new Date();
   const dateStr = currentDateTime.toISOString().split('T')[0]; // YYYY-MM-DD format
   const timeStr = currentDateTime.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format
   const fileName = `${selectedSubject}_${dateStr}_${timeStr}.txt`;
    const totalCount = sortedItems.length;
    const fileContent = `The total number of count is ${totalCount}\n\n${sortedItems.join('\n')}`; // add total count at top

  try {
     if (Platform.OS === 'web') {
       // Web browser - trigger download and WhatsApp Web
       const blob = new Blob([fileContent], { type: 'text/plain' });
       const url = URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.download = fileName;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
       
       // Open WhatsApp Web with the content
        const whatsappMessage = encodeURIComponent(`Attendance for ${selectedSubject} (${dateStr} ${timeStr.replace(/-/g, ':')}):\n${fileContent}`);
       const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;
       window.open(whatsappUrl, '_blank');
       
       console.log(`File ${fileName} downloaded and WhatsApp opened`);
       alert(`File ${fileName} downloaded and WhatsApp opened`);
     } else {
       // Mobile device - save to file system and share to WhatsApp
       const filePath = `${FileSystem.documentDirectory}${fileName}`;
       await FileSystem.writeAsStringAsync(filePath, fileContent);
       
       // Share file to WhatsApp
       const isAvailable = await Sharing.isAvailableAsync();
       if (isAvailable) {
         await Sharing.shareAsync(filePath, {
           mimeType: 'text/plain',
           dialogTitle: 'Share attendance file to WhatsApp'
         });
         console.log(`File ${fileName} shared to WhatsApp`);
         alert(`File shared to WhatsApp`);
       } else {
         alert('Sharing is not available on this device');
       }
     }
     
     // Clear the data after successful file operation
     setItem([]);
     setText('');
     inputRef.current?.focus();
  } catch (err) {
     console.log('WhatsApp share error:', (err as Error).message);
     alert('Error sharing file to WhatsApp.');
   }
}
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Subject:</Text>
      <Picker
        selectedValue={selectedSubject}
        onValueChange={(itemValue) => setSelectedSubject(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="DE" value="DE" />
        <Picker.Item label="PA" value="PA" />
        <Picker.Item label="PA LAB" value="PA LAB" />
        <Picker.Item label="FLAT" value="FLAT" />
        <Picker.Item label="SSIC" value="SSIC" />
      </Picker>
      <TextInput
      ref={inputRef}
      blurOnSubmit={false} 
        style={styles.input}
        placeholder="Type something..."
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleAddItem}
        returnKeyType="done"
      />
 <Text style={styles.totalCount}>Total Count: {item.length}</Text>
      <View style={styles.buttonContainer}>
        <Button title="End" onPress={handleSortItems} />
        <Button title="WhatsApp" onPress={handleWhatsAppShare} color="#25D366" />
      </View> 
      <FlatList
        data={item}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <Text style={styles.item}>{item}</Text>}
      />

      <Text>Hi this is Rohit singh from dev team</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
    width: '100%',
  },
  item: {
    fontSize: 18, 
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  totalCount: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
});
