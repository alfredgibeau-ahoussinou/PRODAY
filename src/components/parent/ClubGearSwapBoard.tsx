import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface GearItem {
  id: string;
  title: string;
  category: 'boots' | 'apparel' | 'protection' | 'keeper';
  size: string; // e.g. "Pointure 38", "12 ans"
  condition: 'Neuf avec étiquette' | 'Comme neuf' | 'Bon état';
  dealType: 'gift' | 'swap' | 'price';
  price?: number;
  sellerParent: string;
  phone?: string;
  datePosted: string;
}

const DEFAULT_GEAR: GearItem[] = [
  {
    id: 'g1',
    title: 'Crampons Nike Mercurial Vapor (Moulés FG)',
    category: 'boots',
    size: 'Pointure 38',
    condition: 'Comme neuf',
    dealType: 'price',
    price: 15,
    sellerParent: 'Marc (Papa de Lucas - U13)',
    phone: '0612345678',
    datePosted: 'Hier',
  },
  {
    id: 'g2',
    title: 'Veste Coupe-vent Officielle Club ProDay',
    category: 'apparel',
    size: 'Taille 10-12 ans',
    condition: 'Bon état',
    dealType: 'gift',
    sellerParent: 'Corinne (Maman d’Arthur - U11)',
    phone: '0687654321',
    datePosted: 'Il y a 3j',
  },
  {
    id: 'g3',
    title: 'Gants de Gardien Uhlsport Absolutgrip',
    category: 'keeper',
    size: 'Taille 7',
    condition: 'Comme neuf',
    dealType: 'swap',
    sellerParent: 'David (Papa de Noham - U15)',
    phone: '0644332211',
    datePosted: 'Cette semaine',
  },
];

export const ClubGearSwapBoard: React.FC = () => {
  const [items, setItems] = useState<GearItem[]>(DEFAULT_GEAR);
  const [selectedCat, setSelectedCat] = useState<'all' | 'boots' | 'apparel' | 'protection' | 'keeper'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSize, setFormSize] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDealType, setFormDealType] = useState<'gift' | 'swap' | 'price'>('gift');

  const filteredItems = items.filter((i) => {
    if (selectedCat === 'all') return true;
    return i.category === selectedCat;
  });

  const handleContact = (item: GearItem) => {
    if (!item.phone) {
      Alert.alert('Contact', 'Le parent n’a pas renseigné son téléphone.');
      return;
    }
    const cleanPhone = item.phone.replace(/[^0-9]/g, '');
    const international = cleanPhone.startsWith('0') ? `33${cleanPhone.slice(1)}` : cleanPhone;
    const msg = encodeURIComponent(
      `Bonjour ${item.sellerParent} ! Je vous contacte via la Bourse Équipement ProDay au sujet de votre annonce "${item.title}" (${item.size}). Est-elle toujours disponible ?`
    );
    Linking.openURL(`https://wa.me/${international}?text=${msg}`).catch(() => {
      Alert.alert('Erreur', 'Impossible d’ouvrir WhatsApp.');
    });
  };

  const handleAddItem = () => {
    if (!formTitle.trim() || !formSize.trim()) {
      Alert.alert('Champs requis', 'Veuillez renseigner le titre et la taille/pointure.');
      return;
    }
    const newItem: GearItem = {
      id: Date.now().toString(),
      title: formTitle.trim(),
      category: 'boots',
      size: formSize.trim(),
      condition: 'Comme neuf',
      dealType: formDealType,
      price: formDealType === 'price' ? Number(formPrice) || 10 : undefined,
      sellerParent: 'Moi (Parent adhérent)',
      phone: '0600000000',
      datePosted: 'Aujourd’hui',
    };
    setItems([newItem, ...items]);
    setShowAddModal(false);
    setFormTitle('');
    setFormSize('');
    setFormPrice('');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Bourse aux Crampons & Équipements</Text>
          <Text style={styles.subtitle}>Échange solidaire & seconde vie au sein du club</Text>
        </View>
        <TouchableOpacity
          style={styles.newAdBtn}
          onPress={() => setShowAddModal(!showAddModal)}
        >
          <MaterialCommunityIcons name={showAddModal ? 'close' : 'plus'} size={18} color="#FFFFFF" />
          <Text style={styles.newAdBtnText}>{showAddModal ? 'Fermer' : 'Déposer'}</Text>
        </TouchableOpacity>
      </View>

      {/* Add form */}
      {showAddModal && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Déposer un article</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Crampons Puma Future, Veste d'entraînement..."
            placeholderTextColor="#64748B"
            value={formTitle}
            onChangeText={setFormTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Pointure / Taille (Ex: Pointure 37 ou 10 ans)"
            placeholderTextColor="#64748B"
            value={formSize}
            onChangeText={setFormSize}
          />

          <View style={styles.dealTypeRow}>
            <TouchableOpacity
              style={[styles.dealTypeBtn, formDealType === 'gift' && styles.dealTypeBtnActive]}
              onPress={() => setFormDealType('gift')}
            >
              <Text style={[styles.dealTypeText, formDealType === 'gift' && styles.dealTypeTextActive]}>
                Don (Gratuit)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dealTypeBtn, formDealType === 'swap' && styles.dealTypeBtnActive]}
              onPress={() => setFormDealType('swap')}
            >
              <Text style={[styles.dealTypeText, formDealType === 'swap' && styles.dealTypeTextActive]}>
                Échange
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dealTypeBtn, formDealType === 'price' && styles.dealTypeBtnActive]}
              onPress={() => setFormDealType('price')}
            >
              <Text style={[styles.dealTypeText, formDealType === 'price' && styles.dealTypeTextActive]}>
                Petit prix
              </Text>
            </TouchableOpacity>
          </View>

          {formDealType === 'price' && (
            <TextInput
              style={styles.input}
              placeholder="Prix en euros (Ex: 10)"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              value={formPrice}
              onChangeText={setFormPrice}
            />
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleAddItem}>
            <Text style={styles.submitBtnText}>Publier l’article pour le club</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Categories Filter */}
      <View style={styles.categoryChips}>
        {(
          [
            { id: 'all', label: 'Tout' },
            { id: 'boots', label: '👟 Crampons' },
            { id: 'apparel', label: '👕 Tenues' },
            { id: 'keeper', label: '🧤 Gardiens' },
          ] as const
        ).map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, selectedCat === c.id && styles.chipActive]}
            onPress={() => setSelectedCat(c.id)}
          >
            <Text style={[styles.chipText, selectedCat === c.id && styles.chipTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Items list */}
      <ScrollView style={styles.list} nestedScrollEnabled>
        {filteredItems.map((item) => (
          <View key={item.id} style={styles.gearCard}>
            <View style={styles.gearTop}>
              <Text style={styles.gearTitle}>{item.title}</Text>
              <View
                style={[
                  styles.priceBadge,
                  item.dealType === 'gift' && styles.priceBadgeGift,
                ]}
              >
                <Text
                  style={[
                    styles.priceText,
                    item.dealType === 'gift' && styles.priceTextGift,
                  ]}
                >
                  {item.dealType === 'gift'
                    ? 'DON GRATUIT'
                    : item.dealType === 'swap'
                    ? 'ÉCHANGE'
                    : `${item.price} €`}
                </Text>
              </View>
            </View>

            <View style={styles.specsRow}>
              <View style={styles.specTag}>
                <MaterialCommunityIcons name="tag-outline" size={14} color="#94A3B8" />
                <Text style={styles.specTagText}>{item.size}</Text>
              </View>
              <View style={styles.specTag}>
                <MaterialCommunityIcons name="shield-check-outline" size={14} color="#94A3B8" />
                <Text style={styles.specTagText}>{item.condition}</Text>
              </View>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.sellerText}>
                Proposé par {item.sellerParent} • {item.datePosted}
              </Text>
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => handleContact(item)}
              >
                <MaterialCommunityIcons name="whatsapp" size={16} color="#FFFFFF" />
                <Text style={styles.contactBtnText}>Contacter</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
  },
  newAdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  newAdBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  formContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 13,
    marginBottom: 8,
  },
  dealTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dealTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#1E293B',
    borderRadius: 6,
    alignItems: 'center',
  },
  dealTypeBtnActive: {
    backgroundColor: '#0284C7',
  },
  dealTypeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  dealTypeTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  categoryChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#0F172A',
  },
  chipActive: {
    backgroundColor: '#334155',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  list: {
    maxHeight: 320,
  },
  gearCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  gearTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  gearTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  priceBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priceBadgeGift: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  priceText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  priceTextGift: {
    color: '#10B981',
  },
  specsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  specTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specTagText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 8,
  },
  sellerText: {
    color: '#64748B',
    fontSize: 11,
    flex: 1,
  },
  contactBtn: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
