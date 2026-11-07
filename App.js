import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECITATEURS = [
  { id: 'ar.alafasy', nom: 'Mishary Alafasy' },
  { id: 'ar.abdulbasitmurattal', nom: 'AbdulBasit AbdulSamad' },
  { id: 'ar.aymanswoaid', nom: 'Ayman Swoaid' },
  { id: 'ar.mahermuaiqly', nom: 'Maher Al Muaiqly' },
  { id: 'ar.husary', nom: 'Mahmoud Al-Husary' },
  { id: 'ar.minshawi', nom: 'Mohamed Al-Minshawi' },
  { id: 'ar.hudhaify', nom: 'Ali Al-Hudhaify' },
  { id: 'ar.abdullahawadaljuhany', nom: 'Abdullah Al-Juhany' },
];

export default function App() {
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [ayahsArabe, setAyahsArabe] = useState([]);
  const [showTraduction, setShowTraduction] = useState(false);
  const [recitateur, setRecitateur] = useState(RECITATEURS[0]);
  const [showRecitateur, setShowRecitateur] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playingAyah, setPlayingAyah] = useState(null);
  const [sound, setSound] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [favoris, setFavoris] = useState([]);

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(r => r.json())
      .then(d => { setSurahs(d.data); setLoading(false); });
  }, []);

  const openSurah = async (surah) => {
    setLoading(true);
    setSelectedSurah(surah);
    const arabe = await fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/quran-uthmani`).then(r => r.json());
    const fr = await fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/fr.hamidullah`).then(r => r.json());
    const audio = await fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/${recitateur.id}`).then(r => r.json());
    let ayahs = arabe.data.ayahs.map((a, i) => ({ ...a, fr: fr.data.ayahs[i].text, audio: audio.data.ayahs[i].audio }));
    setAyahsArabe(ayahs);
    setLoading(false);
  };

  const playAyah = async (ayah) => {
    if (sound) await sound.unloadAsync();
    setPlayingAyah(ayah.numberInSurah);
    const { sound: s } = await Audio.Sound.createAsync({ uri: ayah.audio });
    setSound(s);
    await s.playAsync();
    s.setOnPlaybackStatusUpdate((st) => { if (st.didJustFinish) setPlayingAyah(null); });
  };

  if (selectedSurah) {
    return (
      <View style={[styles.container, darkMode && styles.dark]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedSurah(null)}><Text style={styles.back}>← Retour</Text></TouchableOpacity>
          <Text style={styles.title}>{selectedSurah.englishName}</Text>
          <TouchableOpacity onPress={() => setShowTraduction(!showTraduction)} style={[styles.btnFR, showTraduction && styles.btnFRActive]}>
            <Text style={styles.btnFRText}>{showTraduction ? 'FR ✓' : 'FR'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.topBar}>
          <Text style={styles.surahNameArabe}>{selectedSurah.name}</Text>
          <Text style={styles.surahMeta}>{selectedSurah.numberOfAyahs} Versets • {selectedSurah.revelationType}</Text>
          <TouchableOpacity onPress={() => setShowRecitateur(true)} style={styles.recitBtn}>
            <Text style={styles.recitText}>🎧 {recitateur.nom} ▼</Text>
          </TouchableOpacity>
        </View>
        {loading ? <ActivityIndicator size="large" color="#0A7A42" style={{marginTop:40}}/> : (
          <ScrollView style={styles.readScroll}>
            <Text style={styles.basmala}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
            {ayahsArabe.map((ayah) => (
              <TouchableOpacity key={ayah.number} onPress={() => playAyah(ayah)} style={[styles.ayahBox, playingAyah === ayah.numberInSurah && styles.ayahPlaying]}>
                <Text style={[styles.arabe, darkMode && styles.textDark]}>{ayah.text} ﴿{ayah.numberInSurah}﴾</Text>
                {showTraduction && <Text style={styles.fr}>{ayah.fr}</Text>}
                <Text style={styles.playIcon}>{playingAyah === ayah.numberInSurah ? '⏸️ En cours...' : '▶️ Écouter ce verset'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <View style={styles.player}>
          <Text style={styles.playerTitle}>{selectedSurah.englishName} • {recitateur.nom}</Text>
          <TouchableOpacity onPress={() => setDarkMode(!darkMode)}><Text style={{fontSize:22}}>{darkMode ? '☀️' : '🌙'}</Text></TouchableOpacity>
        </View>
        <Modal visible={showRecitateur} transparent animationType="slide">
          <View style={styles.modal}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Choisir le récitateur</Text>
              {RECITATEURS.map(r => (
                <TouchableOpacity key={r.id} onPress={() => { setRecitateur(r); setShowRecitateur(false); openSurah(selectedSurah); }} style={styles.recitItem}>
                  <Text style={{fontSize:16}}>{r.nom} {r.id === recitateur.id ? '✓' : ''}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setShowRecitateur(false)}><Text style={{textAlign:'center', marginTop:10, color:'red'}}>Fermer</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={[styles.container, darkMode && styles.dark]}>
      <View style={styles.homeHeader}>
        <Text style={styles.logo}>القرآن الكريم</Text>
        <Text style={styles.logoSub}>TANZIL • Le Coran</Text>
        <Text style={{color:'#fff', marginTop:5}}>Arabe complet • Traduction au choix • Audio</Text>
      </View>
      {loading ? <ActivityIndicator size="large" color="#0A7A42" style={{marginTop:50}}/> : (
        <FlatList data={surahs} keyExtractor={i => String(i.number)} renderItem={({item}) => (
          <TouchableOpacity style={styles.surahRow} onPress={() => openSurah(item)}>
            <View style={styles.numBox}><Text style={styles.num}>{item.number}</Text></View>
            <View style={{flex:1}}>
              <Text style={styles.surahName}>{item.englishName}</Text>
              <Text style={styles.surahTrans}>{item.englishNameTranslation} • {item.numberOfAyahs} versets</Text>
            </View>
            <Text style={styles.arabeName}>{item.name}</Text>
          </TouchableOpacity>
        )} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  dark: { backgroundColor: '#121212' },
  homeHeader: { backgroundColor: '#0A7A42', padding: 25, paddingTop: 50, alignItems: 'center', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  logo: { fontSize: 42, color: '#fff', fontWeight: 'bold' },
  logoSub: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, paddingTop: 45, backgroundColor: '#0A7A42' },
  back: { color: '#fff', fontSize: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  btnFR: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  btnFRActive: { backgroundColor: '#FFD700' },
  btnFRText: { fontWeight: 'bold' },
  topBar: { alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  surahNameArabe: { fontSize: 32, fontWeight: 'bold' },
  surahMeta: { color: '#888', marginTop: 5 },
  recitBtn: { backgroundColor: '#E8F5E9', padding: 8, paddingHorizontal: 15, borderRadius: 20, marginTop: 10 },
  recitText: { color: '#0A7A42', fontWeight: 'bold' },
  readScroll: { padding: 20 },
  basmala: { fontSize: 26, textAlign: 'center', marginBottom: 20, lineHeight: 45 },
  ayahBox: { marginBottom: 18, padding: 12, borderRadius: 12, backgroundColor: '#F9F9F9' },
  ayahPlaying: { backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#0A7A42' },
  arabe: { fontSize: 26, textAlign: 'right', lineHeight: 48, color: '#111' },
  textDark: { color: '#fff' },
  fr: { fontSize: 15, color: '#555', marginTop: 8, lineHeight: 22 },
  playIcon: { color: '#0A7A42', fontSize: 13, marginTop: 8 },
  player: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  playerTitle: { fontWeight: 'bold' },
  surahRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12 },
  numBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  num: { color: '#0A7A42', fontWeight: 'bold' },
  surahName: { fontWeight: 'bold', fontSize: 16 },
  surahTrans: { color: '#888', fontSize: 12 },
  arabeName: { fontSize: 22 },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 15, textAlign: 'center' },
  recitItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
