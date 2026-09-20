import React, { useState, memo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LEGENDARY_ROSTER } from '../constants/roster';
import { usePokemonFetch } from '../hooks/usePokemonFetch';

// ============================================================================
// 1. CONSTANTS & MAPPINGS
// ============================================================================

// Maps Pokémon types to specific hex colors for dynamic UI styling.
// These are used for the left border of the cards and the type badges.
const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
  grass: '#48D0B0', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
  ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
  rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
  steel: '#B8B8D0', fairy: '#EE99AC', default: '#48D0B0'
};

// ============================================================================
// 2. UI ASSETS & GRAPHICS
// ============================================================================

// A pure React Native vector drawing of a Pokéball used as a background watermark.
// Safely scales based on the 'size' prop and avoids image-loading errors.
const PokeballWatermark = ({ size = 150, style }: { size?: number, style?: any }) => (
  <View style={[{ width: size, height: size, borderRadius: size / 2, borderWidth: size * 0.04, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', position: 'absolute' }, style]}>
    <View style={{ width: '100%', height: size * 0.04, backgroundColor: 'rgba(255,255,255,0.15)', position: 'absolute' }} />
    <View style={{ width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15, borderWidth: size * 0.04, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: size * 0.1, height: size * 0.1, borderRadius: size * 0.05, backgroundColor: 'rgba(255,255,255,0.15)' }} />
    </View>
  </View>
);

// ============================================================================
// 3. SUB-COMPONENTS
// ============================================================================

// The individual Pokémon card used in the FlatList. 
// Wrapped in `React.memo` to prevent unnecessary re-renders, which keeps the 
// list scrolling smoothly even while fetching dozens of images from PokéAPI.
const PokemonListCard = memo(({ item, onPress }: { item: any, onPress: () => void }) => {
  const { data: pokemon } = usePokemonFetch(`https://pokeapi.co/api/v2/pokemon/${item.name}`);
  const typeColor = TYPE_COLORS[item.type?.toLowerCase()] || TYPE_COLORS.default;
  const imageUrl = pokemon?.sprites?.other?.['official-artwork']?.front_default || pokemon?.sprites?.front_default;
  const formattedId = pokemon?.id ? `#${String(pokemon.id).padStart(3, '0')}` : '...';

  return (
    <TouchableOpacity 
      style={[styles.listCard, { borderLeftColor: typeColor }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.listCardImageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.listCardImage} resizeMode="contain" />
        ) : (
          <ActivityIndicator color={typeColor} />
        )}
      </View>
      
      <View style={styles.listCardContent}>
        <Text style={styles.listCardName}>{item.name.replace('-', ' ')}</Text>
        <Text style={styles.listCardId}>{formattedId}</Text>
        
        <View style={styles.listCardBadges}>
          <View style={[styles.listCardTypeBadge, { backgroundColor: typeColor }]}>
            <Text style={styles.listCardTypeText}>{item.type.toUpperCase()}</Text>
          </View>
          <Text style={styles.listCardRegionBadge}>{item.region}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ============================================================================
// 4. MAIN SCREEN COMPONENT
// ============================================================================

export default function Home() {
  const router = useRouter();
  
  // --- STATE MANAGEMENT ---
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [activeType, setActiveType] = useState<string | null>(null);

  // --- DERIVED DATA ---
  // Generate unique lists of regions and types directly from the roster constant
  const regions = ['All', ...new Set(LEGENDARY_ROSTER.map(p => p.region))];
  const availableTypes = [...new Set(LEGENDARY_ROSTER.map(p => p.type || 'Unknown'))].sort();

  // Filter the roster based on active Region and Category taps
  const filteredRoster = LEGENDARY_ROSTER
    .filter((pokemon) => {
      const matchesRegion = selectedRegion === 'All' || pokemon.region === selectedRegion;
      const matchesType = activeType === null || pokemon.type === activeType;
      return matchesRegion && matchesType;
    })
    .sort((a, b) => a.generation - b.generation); // Natively sort by Generation

  // Logic to determine if we show the Type Dashboard or the List of Pokémon
  const showTypesGrid = activeType === null && selectedRegion === 'All';

  // --- MAIN RENDER ---
  return (
    <View style={styles.container}>
      {/* Matches the Red Casing of the physical device */}
      <StatusBar barStyle="light-content" backgroundColor="#DC0A2D" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* --- TOP SHELL (Classic Pokédex Red Casing) --- */}
      <View style={styles.pokedexRedShell}>
        
        {/* Hardware Header with Lens and Status Lights */}
        <View style={styles.customHeader}>
          <View style={styles.pokedexLightsRow}>
            {/* Main Blue Lens */}
            <View style={styles.mainLensOuter}>
              <View style={styles.mainLensInner}>
                <View style={styles.lensReflection} />
              </View>
            </View>
            {/* Small Status Lights (Red, Yellow, Green) */}
            <View style={[styles.miniLight, { backgroundColor: '#FB6C6C' }]} />
            <View style={[styles.miniLight, { backgroundColor: '#F0AD4E' }]} />
            <View style={[styles.miniLight, { backgroundColor: '#5CB85C' }]} />
          </View>
          <Text style={styles.headerTitle}>Legendary Pokédex</Text>
        </View>

        {/* Region Filter Chips (Styled as tactile hardware buttons) */}
        <View style={styles.controlsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionScroll}>
            {regions.map(region => (
              <TouchableOpacity 
                key={region} 
                style={[styles.filterChip, selectedRegion === region && styles.filterChipActive]}
                onPress={() => setSelectedRegion(region)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, selectedRegion === region && styles.filterTextActive]}>
                  {region}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* --- BOTTOM SCREEN (Curved Dark Display) --- */}
      <View style={styles.pokedexScreen}>
        
        {showTypesGrid ? (
          
          /* VIEW A: TYPE CATEGORY GRID */
          <FlatList
            data={availableTypes}
            keyExtractor={(item) => item}
            numColumns={2}
            contentContainerStyle={styles.listPadding}
            columnWrapperStyle={styles.rowWrapper}
            renderItem={({ item: type }) => (
              <TouchableOpacity 
                style={[styles.typeGridCard, { backgroundColor: TYPE_COLORS[type.toLowerCase()] || '#2A2A2A' }]}
                onPress={() => setActiveType(type)}
              >
                <PokeballWatermark size={90} style={{ right: -15, bottom: -15, opacity: 0.5 }} />
                <Text style={styles.typeGridCardText}>{type}</Text>
                <Text style={styles.typeGridCardSubText}>Type</Text>
              </TouchableOpacity>
            )}
          />

        ) : (

          /* VIEW B: POKÉMON LIST */
          <View style={{ flex: 1 }}>
            
            {/* Top Navigation Row (Back/Clear buttons) */}
            <View style={styles.listHeaderRow}>
              {activeType && (
                <TouchableOpacity onPress={() => setActiveType(null)} style={styles.backCategoryButton}>
                  <Text style={styles.backCategoryText}>← Back to Categories</Text>
                </TouchableOpacity>
              )}
              
              {!activeType && selectedRegion !== 'All' && (
                <TouchableOpacity onPress={() => setSelectedRegion('All')} style={styles.backCategoryButton}>
                  <Text style={styles.backCategoryText}>← Clear Region</Text>
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredRoster}
              keyExtractor={(item) => item.name}
              contentContainerStyle={styles.listPadding}
              initialNumToRender={8}
              maxToRenderPerBatch={10}
              windowSize={5}
              renderItem={({ item }) => (
                <PokemonListCard 
                  item={item} 
                  onPress={() => router.push(`/${item.name}`)} 
                />
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No Pokémon found.</Text>}
            />
          </View>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// 5. STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Global Container
  container: { flex: 1, backgroundColor: '#DC0A2D' },
  
  // --- TOP SHELL (RED CASING) ---
  pokedexRedShell: {
    backgroundColor: '#DC0A2D',
    paddingBottom: 20,
    zIndex: 10,
  },
  
  // Hardware Header Styles
  customHeader: {
    paddingTop: 50, 
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  pokedexLightsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  mainLensOuter: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
  },
  mainLensInner: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#2D82CC',
    borderWidth: 2, borderColor: '#1A5282',
    justifyContent: 'flex-start', alignItems: 'flex-start',
    padding: 4,
  },
  lensReflection: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  miniLight: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.5)',
    marginTop: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Region Filter Chips (Physical Buttons)
  controlsContainer: { height: 48, marginTop: 10 },
  regionScroll: { paddingHorizontal: 16 },
  filterChip: { 
    paddingHorizontal: 22, 
    paddingVertical: 10, 
    backgroundColor: '#A3001C', // Darker Red for inactive chips
    borderRadius: 24, 
    marginRight: 10, 
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#7A0015',
  },
  filterChipActive: { 
    backgroundColor: '#FFCC00', // Classic Pokémon Yellow
    borderBottomColor: '#CC9900', 
  },
  filterText: { color: 'rgba(255,255,255,0.7)', fontWeight: '800', fontSize: 14, textTransform: 'uppercase' },
  filterTextActive: { color: '#000', fontWeight: '900' }, 
  
  // --- BOTTOM SCREEN (DARK UI) ---
  pokedexScreen: {
    flex: 1,
    backgroundColor: '#1E1E1E', // Dark Mode Base
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderTopWidth: 4,
    borderColor: '#2A2A2A', // Subtle inner bezel
  },

  listPadding: { paddingBottom: 40, paddingHorizontal: 8 },
  
  // Category Grid Card Styles
  rowWrapper: { justifyContent: 'space-between', paddingHorizontal: 8, marginBottom: 16 },
  typeGridCard: { flex: 1, height: 100, marginHorizontal: 8, borderRadius: 20, padding: 16, justifyContent: 'center', overflow: 'hidden', elevation: 4 },
  typeGridCardText: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1, zIndex: 2 },
  typeGridCardSubText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', zIndex: 2 },
  
  // List Header Navigation (Back/Clear)
  listHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16 },
  backCategoryButton: { paddingVertical: 4 },
  backCategoryText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Pokémon List Card Styles (Colored Edge Layout)
  listCard: {
    backgroundColor: '#27272A',
    marginHorizontal: 8,
    marginBottom: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderLeftWidth: 6, // Thick colored accent line
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
  },
  listCardImageContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  listCardImage: {
    width: '100%',
    height: '100%'
  },
  listCardContent: {
    flex: 1,
    justifyContent: 'center'
  },
  listCardName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textTransform: 'capitalize',
    marginBottom: 2
  },
  listCardId: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  listCardBadges: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  listCardTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  listCardTypeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  listCardRegionBadge: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
  },
  
  emptyText: { textAlign: 'center', marginTop: 40, color: '#888', fontSize: 16, fontStyle: 'italic' }
});