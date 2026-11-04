import { Stack, useRouter } from "expo-router";
import { memo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { LEGENDARY_ROSTER } from "../constants/roster";
import { usePokemonFetch } from "../hooks/usePokemonFetch";

// ============================================================================
// 1. CONSTANTS & MAPPINGS
// ============================================================================
const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#48D0B0",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
  default: "#48D0B0",
};

// ============================================================================
// 2. UI ASSETS & GRAPHICS
// ============================================================================
const PokeballWatermark = ({
  size = 150,
  style,
}: {
  size?: number;
  style?: any;
}) => (
  <View
    style={[
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: size * 0.04,
        borderColor: "rgba(0,0,0,0.06)",
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
      },
      style,
    ]}
  >
    <View
      style={{
        width: "100%",
        height: size * 0.04,
        backgroundColor: "rgba(0,0,0,0.06)",
        position: "absolute",
      }}
    />
    <View
      style={{
        width: size * 0.3,
        height: size * 0.3,
        borderRadius: size * 0.15,
        borderWidth: size * 0.04,
        borderColor: "rgba(0,0,0,0.06)",
        backgroundColor: "transparent",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: size * 0.1,
          height: size * 0.1,
          borderRadius: size * 0.05,
          backgroundColor: "rgba(0,0,0,0.06)",
        }}
      />
    </View>
  </View>
);

// ============================================================================
// 3. SUB-COMPONENTS
// ============================================================================
const PokemonListCard = memo(
  ({ item, onPress }: { item: any; onPress: () => void }) => {
    const { data: pokemon } = usePokemonFetch(
      `https://pokeapi.co/api/v2/pokemon/${item.name}`,
    );
    const typeColor =
      TYPE_COLORS[item.type?.toLowerCase()] || TYPE_COLORS.default;
    const imageUrl =
      pokemon?.sprites?.other?.["official-artwork"]?.front_default ||
      pokemon?.sprites?.front_default;
    const formattedId = pokemon?.id
      ? `#${String(pokemon.id).padStart(3, "0")}`
      : "...";

    return (
      <TouchableOpacity
        style={[styles.listCard, { borderLeftColor: typeColor }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.listCardImageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.listCardImage}
              resizeMode="contain"
            />
          ) : (
            <ActivityIndicator color={typeColor} />
          )}
        </View>

        <View style={styles.listCardContent}>
          <Text style={styles.listCardName}>{item.name.replace("-", " ")}</Text>
          <Text style={styles.listCardId}>{formattedId}</Text>

          <View style={styles.listCardBadges}>
            <View
              style={[styles.listCardTypeBadge, { backgroundColor: typeColor }]}
            >
              <Text style={styles.listCardTypeText}>
                {item.type.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.listCardRegionBadge}>{item.region}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

// ============================================================================
// 4. MAIN SCREEN COMPONENT
// ============================================================================
export default function Home() {
  const router = useRouter();

  // --- STATE MANAGEMENT ---
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [activeType, setActiveType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // --- DERIVED DATA ---
  const regions = ["All", ...new Set(LEGENDARY_ROSTER.map((p) => p.region))];
  const availableTypes = [
    ...new Set(LEGENDARY_ROSTER.map((p) => p.type || "Unknown")),
  ].sort();

  // Filter roster by Region, Category, and live Search Input
  const filteredRoster = LEGENDARY_ROSTER.filter((pokemon) => {
    const matchesRegion =
      selectedRegion === "All" || pokemon.region === selectedRegion;
    const matchesType = activeType === null || pokemon.type === activeType;
    const matchesSearch =
      searchQuery.trim() === "" ||
      pokemon.name.toLowerCase().includes(searchQuery.toLowerCase().trim());

    return matchesRegion && matchesType && matchesSearch;
  }).sort((a, b) => a.generation - b.generation);

  // Automatically show list view if user is typing a search query
  const showTypesGrid =
    activeType === null &&
    selectedRegion === "All" &&
    searchQuery.trim() === "";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#DC0A2D" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* --- TOP SHELL (Classic Pokédex Red Casing) --- */}
      <View style={styles.pokedexRedShell}>
        {/* Hardware Header */}
        <View style={styles.customHeader}>
          <View style={styles.pokedexLightsRow}>
            <View style={styles.mainLensOuter}>
              <View style={styles.mainLensInner}>
                <View style={styles.lensReflection} />
              </View>
            </View>
            <View style={[styles.miniLight, { backgroundColor: "#FB6C6C" }]} />
            <View style={[styles.miniLight, { backgroundColor: "#F0AD4E" }]} />
            <View style={[styles.miniLight, { backgroundColor: "#5CB85C" }]} />
          </View>
          <Text style={styles.headerTitle}>National Pokédex</Text>
        </View>

        {/* Sleek Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Pokémon..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Region Filter Chips */}
        <View style={styles.controlsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.regionScroll}
          >
            {regions.map((region) => (
              <TouchableOpacity
                key={region}
                style={[
                  styles.filterChip,
                  selectedRegion === region && styles.filterChipActive,
                ]}
                onPress={() => setSelectedRegion(region)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedRegion === region && styles.filterTextActive,
                  ]}
                >
                  {region}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* --- BOTTOM SCREEN (Premium Pearl White Display) --- */}
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
                style={[
                  styles.typeGridCard,
                  {
                    backgroundColor:
                      TYPE_COLORS[type.toLowerCase()] || "#EFEFEF",
                  },
                ]}
                onPress={() => setActiveType(type)}
                activeOpacity={0.9}
              >
                <PokeballWatermark
                  size={90}
                  style={{ right: -15, bottom: -15, opacity: 0.15 }}
                />
                <Text style={styles.typeGridCardText}>{type}</Text>
                <Text style={styles.typeGridCardSubText}>Type</Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          /* VIEW B: POKÉMON LIST */
          <View style={{ flex: 1 }}>
            {/* Contextual Clear/Back Buttons */}
            <View style={styles.listHeaderRow}>
              {searchQuery.trim() !== "" && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  style={styles.backCategoryButton}
                >
                  <Text style={styles.backCategoryText}>
                    ✕ Clear Search "{searchQuery}"
                  </Text>
                </TouchableOpacity>
              )}

              {activeType && searchQuery.trim() === "" && (
                <TouchableOpacity
                  onPress={() => setActiveType(null)}
                  style={styles.backCategoryButton}
                >
                  <Text style={styles.backCategoryText}>
                    ← Back to Categories
                  </Text>
                </TouchableOpacity>
              )}

              {!activeType &&
                selectedRegion !== "All" &&
                searchQuery.trim() === "" && (
                  <TouchableOpacity
                    onPress={() => setSelectedRegion("All")}
                    style={styles.backCategoryButton}
                  >
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
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No Pokémon found matching your search.
                </Text>
              }
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
  container: { flex: 1, backgroundColor: "#DC0A2D" },

  pokedexRedShell: {
    backgroundColor: "#DC0A2D",
    paddingBottom: 16,
    zIndex: 10,
  },

  customHeader: { paddingTop: 50, paddingHorizontal: 24, paddingBottom: 6 },
  pokedexLightsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  mainLensOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  mainLensInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2D82CC",
    borderWidth: 2,
    borderColor: "#1A5282",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: 4,
  },
  lensReflection: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  miniLight: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.5)",
    marginTop: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  // Search Bar Styling
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    marginHorizontal: 24,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 10,
    color: "#FFF",
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
    paddingVertical: 0,
  },
  clearButton: { padding: 4 },
  clearText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Controls & Filters
  controlsContainer: { height: 44, marginTop: 4 },
  regionScroll: { paddingHorizontal: 16 },
  filterChip: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    backgroundColor: "#A3001C",
    borderRadius: 24,
    marginRight: 10,
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: "#7A0015",
  },
  filterChipActive: {
    backgroundColor: "#FFCC00",
    borderBottomColor: "#CC9900",
  },
  filterText: {
    color: "rgba(255,255,255,0.7)",
    fontWeight: "800",
    fontSize: 14,
    textTransform: "uppercase",
  },
  filterTextActive: { color: "#000", fontWeight: "900" },

  // Premium Pearl White Screen
  pokedexScreen: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 24,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderTopWidth: 4,
    borderColor: "#E5E7EB",
  },

  listPadding: { paddingBottom: 40, paddingHorizontal: 8 },

  rowWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  typeGridCard: {
    flex: 1,
    height: 100,
    marginHorizontal: 8,
    borderRadius: 20,
    padding: 16,
    justifyContent: "center",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  typeGridCardText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
    zIndex: 2,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  typeGridCardSubText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    zIndex: 2,
  },

  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  backCategoryButton: { paddingVertical: 4 },
  backCategoryText: { color: "#1F2937", fontSize: 16, fontWeight: "700" },

  // List Cards
  listCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 8,
    marginBottom: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderLeftWidth: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  listCardImageContainer: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  listCardImage: { width: "100%", height: "100%" },
  listCardContent: { flex: 1, justifyContent: "center" },
  listCardName: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "bold",
    textTransform: "capitalize",
    marginBottom: 2,
  },
  listCardId: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  listCardBadges: { flexDirection: "row", gap: 8, alignItems: "center" },
  listCardTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  listCardTypeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  listCardRegionBadge: { color: "#4B5563", fontSize: 12, fontWeight: "600" },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#9CA3AF",
    fontSize: 16,
    fontStyle: "italic",
  },
});
