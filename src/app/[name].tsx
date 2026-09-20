import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { usePokemonFetch } from "../hooks/usePokemonFetch";
import EvolutionChain from "../components/EvolutionChain";

// ============================================================================
// 1. CONSTANTS & MAPPINGS
// ============================================================================

// Maps Pokémon types to specific hex colors for dynamic UI styling
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
// 2. HELPER FUNCTIONS
// ============================================================================

// PokéAPI throws 404 errors if we request species data for specific forms.
// This strips suffixes like "-incarnate" so we safely fetch the base species.
const getSpeciesName = (str: string) => {
  if (!str) return "";
  const formsToStrip = ["-incarnate", "-single-strike", "-altered", "-50"];
  let species = str;
  formsToStrip.forEach((form) => {
    species = species.replace(form, "");
  });
  return species;
};

// ============================================================================
// 3. UI ASSETS & GRAPHICS
// ============================================================================

// A pure React Native vector drawing of a Pokéball used as a background watermark.
// Using Views instead of an Image file ensures it never fails to load.
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
        borderColor: "rgba(255,255,255,0.15)",
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
        backgroundColor: "rgba(255,255,255,0.15)",
        position: "absolute",
      }}
    />
    <View
      style={{
        width: size * 0.3,
        height: size * 0.3,
        borderRadius: size * 0.15,
        borderWidth: size * 0.04,
        borderColor: "rgba(255,255,255,0.15)",
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
          backgroundColor: "rgba(255,255,255,0.15)",
        }}
      />
    </View>
  </View>
);

// ============================================================================
// 4. TAB SUB-COMPONENTS
// ============================================================================

// Renders the lore text and the Weight/Height info box
const AboutTab = ({
  lore,
  weight,
  height,
}: {
  lore: string;
  weight: string;
  height: string;
}) => (
  <View>
    <Text style={styles.loreText}>{lore}</Text>
    <View style={styles.cardInfoBox}>
      <View style={styles.infoBoxItem}>
        <Text style={styles.infoValue}>{weight} KG</Text>
        <Text style={styles.infoLabel}>Weight</Text>
      </View>
      <View style={styles.infoDivider} />
      <View style={styles.infoBoxItem}>
        <Text style={styles.infoValue}>{height} M</Text>
        <Text style={styles.infoLabel}>Height</Text>
      </View>
    </View>
  </View>
);

// Renders the pill-shaped stat bars (HP, ATK, DEF, SPD, EXP)
const StatsTab = ({ stats, exp }: { stats: any[]; exp: number }) => (
  <View style={{ gap: 12, marginTop: 10 }}>
    {stats?.map((s: any) => {
      const maxStat = 300;
      // Calculate width percentage. Min 15% ensures the numbers fit inside the bar.
      const percent = Math.min(
        100,
        Math.max(15, (s.base_stat / maxStat) * 100),
      );

      // Clean up long stat names for the UI
      let statName = s.stat.name.toUpperCase();
      if (statName === "SPECIAL-ATTACK") statName = "SP. ATK";
      if (statName === "SPECIAL-DEFENSE") statName = "SP. DEF";

      // Color-code specific stats based on standard RPG conventions
      let barColor = "#FB6C6C"; // Default (HP)
      if (statName.includes("ATK")) barColor = "#F0AD4E";
      if (statName.includes("DEF")) barColor = "#5BC0DE";
      if (statName.includes("SPD") || statName === "SPEED")
        barColor = "#8A8893";

      return (
        <View key={s.stat.name} style={styles.statRow}>
          <Text style={styles.statLabel}>{statName}</Text>
          <View style={styles.statBarBg}>
            <View
              style={[
                styles.statBarFill,
                { width: `${percent}%`, backgroundColor: barColor },
              ]}
            >
              <Text style={styles.statBarText}>
                {s.base_stat}/{maxStat}
              </Text>
            </View>
          </View>
        </View>
      );
    })}

    {/* Dedicated EXP Bar */}
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>EXP</Text>
      <View style={styles.statBarBg}>
        <View
          style={[
            styles.statBarFill,
            {
              width: `${Math.min(100, Math.max(15, (exp / 1000) * 100))}%`,
              backgroundColor: "#5CB85C",
            },
          ]}
        >
          <Text style={styles.statBarText}>{exp}/1000</Text>
        </View>
      </View>
    </View>
  </View>
);

// Renders the first 15 moves as dark-mode badges
const MovesTab = ({ moves }: { moves: any[] }) => {
  const displayMoves = moves?.slice(0, 15) || [];
  return (
    <View style={styles.movesContainer}>
      {displayMoves.map((m: any) => (
        <View key={m.move.name} style={styles.moveBadge}>
          <Text style={styles.moveText}>{m.move.name.replace("-", " ")}</Text>
        </View>
      ))}
    </View>
  );
};

// ============================================================================
// 5. MAIN SCREEN COMPONENT
// ============================================================================

export default function PokemonDetail() {
  const router = useRouter();
  const { name } = useLocalSearchParams();
  const pokemonName = name as string;
  const speciesName = getSpeciesName(pokemonName);

  const [activeTab, setActiveTab] = useState("Stats"); // Default active tab

  // Parallel Data Fetching: Pokemon (stats/moves) & Species (lore/evolution)
  const {
    data: pokemon,
    isLoading: isPokemonLoading,
    error: pokemonError,
    refetch: refetchPokemon,
  } = usePokemonFetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);

  const {
    data: species,
    isLoading: isSpeciesLoading,
    error: speciesError,
    refetch: refetchSpecies,
  } = usePokemonFetch(
    `https://pokeapi.co/api/v2/pokemon-species/${speciesName}`,
  );

  const isLoading = isPokemonLoading || isSpeciesLoading;
  const error = pokemonError || speciesError;

  // Determine header background color based on primary type
  const primaryType = pokemon?.types?.[0]?.type?.name || "default";
  const bgColor = TYPE_COLORS[primaryType] || TYPE_COLORS.default;

  // --- EARLY RETURN: Loading State ---
  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: "#1E1E1E" }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // --- EARLY RETURN: Error State ---
  if (error || !pokemon) {
    return (
      <View style={[styles.center, { backgroundColor: "#1E1E1E" }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>
          {error || "Failed to load Pokémon details."}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            refetchPokemon();
            refetchSpecies();
          }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- DATA FORMATTING ---
  const formattedId = `#${String(pokemon.id).padStart(3, "0")}`;
  const heightInMeters = (pokemon.height / 10).toFixed(2);
  const weightInKg = (pokemon.weight / 10).toFixed(1);
  const englishLore =
    species?.flavor_text_entries
      ?.find((entry: any) => entry.language.name === "en")
      ?.flavor_text?.replace(/\n|\f/g, " ") || "No lore available.";

  // --- MAIN RENDER ---
  return (
    <View style={styles.container}>
      {/* Hide default header so our custom layout controls the top edge */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* --- TOP HALF (Curved Header with Artwork) --- */}
      <View style={[styles.topHalf, { backgroundColor: bgColor }]}>
        <PokeballWatermark
          size={260}
          style={{ top: 30, right: -40, transform: [{ rotate: "15deg" }] }}
        />

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.headerText}>← Pokedex</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}>{formattedId}</Text>
        </View>

        <Image
          source={{
            uri:
              pokemon.sprites?.other?.["official-artwork"]?.front_default ||
              pokemon.sprites?.front_default,
          }}
          style={styles.artwork}
        />
      </View>

      {/* --- BOTTOM HALF (Details & Tabs) --- */}
      <View style={styles.bottomHalf}>
        <Text style={styles.name}>{pokemon.name.replace("-", " ")}</Text>

        {/* Type Badges */}
        <View style={styles.typeContainer}>
          {pokemon.types?.map((t: any) => (
            <View
              key={t.type.name}
              style={[
                styles.typeBadge,
                { backgroundColor: TYPE_COLORS[t.type.name] || bgColor },
              ]}
            >
              <Text style={styles.typeText}>{t.type.name}</Text>
            </View>
          ))}
        </View>

        {/* Tab Navigation Menu */}
        <View style={styles.tabContainer}>
          {["About", "Stats", "Moves", "Evolution"].map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
              {/* Colored underline for the active tab */}
              {activeTab === tab && (
                <View
                  style={[
                    styles.activeTabIndicator,
                    { backgroundColor: bgColor },
                  ]}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Dynamic Tab Content Area */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetContent}
        >
          {activeTab === "About" && (
            <AboutTab
              lore={englishLore}
              weight={weightInKg}
              height={heightInMeters}
            />
          )}

          {activeTab === "Stats" && (
            <StatsTab
              stats={pokemon.stats}
              exp={pokemon.base_experience || 0}
            />
          )}

          {activeTab === "Moves" && <MovesTab moves={pokemon.moves} />}

          {activeTab === "Evolution" &&
            (species?.evolution_chain?.url ? (
              <EvolutionChain url={species.evolution_chain.url} />
            ) : (
              <ActivityIndicator size="small" color="#fff" />
            ))}
        </ScrollView>
      </View>
    </View>
  );
}

// ============================================================================
// 6. STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Global & Structure
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: { flex: 1, backgroundColor: "#1E1E1E" },

  // Top Colored Half
  topHalf: {
    height: "42%",
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    alignItems: "center",
    paddingTop: 50,
    zIndex: 2,
    elevation: 8, // Android shadow
    overflow: "hidden", // Keeps the Pokeball watermark inside the curves
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 24,
    position: "absolute",
    top: 50,
    zIndex: 10,
  },
  backButton: { padding: 4 },
  headerText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "700",
  },
  artwork: { width: 220, height: 220, marginTop: 40, zIndex: 5 }, // Raised above watermark

  // Bottom Dark Half
  bottomHalf: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  name: {
    fontSize: 32,
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    textTransform: "lowercase",
    marginBottom: 12,
  },

  // Type Badges
  typeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  typeBadge: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
  },
  typeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
    textTransform: "lowercase",
  },

  // Tab Navigation Menu
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  tabText: {
    fontSize: 14,
    color: "#888",
    fontWeight: "600",
    paddingBottom: 12,
  },
  activeTabText: { color: "#fff", fontWeight: "bold" },
  activeTabIndicator: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  sheetContent: { paddingBottom: 40 },

  // About Tab Styles
  loreText: {
    fontSize: 15,
    color: "#ccc",
    lineHeight: 22,
    marginBottom: 24,
    fontStyle: "italic",
    textAlign: "center",
  },
  cardInfoBox: {
    flexDirection: "row",
    backgroundColor: "#2A2A2A",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "space-around",
  },
  infoBoxItem: { alignItems: "center", flex: 1 },
  infoDivider: { width: 1, height: "80%", backgroundColor: "#444" },
  infoLabel: { fontSize: 12, color: "#888", fontWeight: "600" },
  infoValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 4,
  },

  // Stats Tab Styles
  statRow: { flexDirection: "row", alignItems: "center" },
  statLabel: { width: 50, color: "#fff", fontSize: 12, fontWeight: "bold" },
  statBarBg: {
    flex: 1,
    height: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%",
    borderRadius: 10,
    justifyContent: "center",
    paddingRight: 10,
  },
  statBarText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "right",
  },

  // Moves Tab Styles
  movesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  moveBadge: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
  },
  moveText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "lowercase",
  },

  // Error/Loading States
  errorText: {
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#333",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
