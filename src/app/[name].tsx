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

const StatsTab = ({ stats, exp }: { stats: any[]; exp: number }) => (
  <View style={{ gap: 12, marginTop: 10 }}>
    {stats?.map((s: any) => {
      const maxStat = 300;
      const percent = Math.min(
        100,
        Math.max(15, (s.base_stat / maxStat) * 100),
      );

      let statName = s.stat.name.toUpperCase();
      if (statName === "SPECIAL-ATTACK") statName = "SP. ATK";
      if (statName === "SPECIAL-DEFENSE") statName = "SP. DEF";

      let barColor = "#FB6C6C";
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

const MovesTab = ({ moves }: { moves: any[] }) => {
  const displayMoves = moves?.slice(0, 20) || [];

  return (
    <View style={styles.movesListContainer}>
      {displayMoves.map((m: any) => {
        const details = m.version_group_details?.[0];
        const level = details?.level_learned_at;
        const method = details?.move_learn_method?.name;

        let methodLabel = "TM / HM / Tutor";
        if (method === "level-up" && level > 0)
          methodLabel = `Learned at Level ${level}`;
        if (method === "level-up" && level === 0)
          methodLabel = "Learned upon Evolution";

        return (
          <View key={m.move.name} style={styles.moveListCard}>
            <View style={styles.moveIconPlaceholder}>
              <Text style={styles.moveIconText}>✦</Text>
            </View>
            <View style={styles.moveInfo}>
              <Text style={styles.moveName}>
                {m.move.name.replace("-", " ")}
              </Text>
              <Text style={styles.moveMethod}>{methodLabel}</Text>
            </View>
          </View>
        );
      })}
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

  const [activeTab, setActiveTab] = useState("Stats");

  // NEW STATE: Tracks if the user wants to see the Shiny version
  const [isShiny, setIsShiny] = useState(false);

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

  const primaryType = pokemon?.types?.[0]?.type?.name || "default";
  const bgColor = TYPE_COLORS[primaryType] || TYPE_COLORS.default;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: "#1E1E1E" }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

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

  const formattedId = `#${String(pokemon.id).padStart(3, "0")}`;
  const heightInMeters = (pokemon.height / 10).toFixed(2);
  const weightInKg = (pokemon.weight / 10).toFixed(1);
  const englishLore =
    species?.flavor_text_entries
      ?.find((entry: any) => entry.language.name === "en")
      ?.flavor_text?.replace(/\n|\f/g, " ") || "No lore available.";

  // DETERMINE WHICH IMAGE TO SHOW BASED ON TOGGLE STATE
  const defaultImage =
    pokemon.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon.sprites?.front_default;
  const shinyImage =
    pokemon.sprites?.other?.["official-artwork"]?.front_shiny ||
    pokemon.sprites?.front_shiny;
  const displayImage = isShiny && shinyImage ? shinyImage : defaultImage;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

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

        <Image source={{ uri: displayImage }} style={styles.artwork} />

        {/* SHINY TOGGLE BUTTON */}
        {shinyImage && (
          <TouchableOpacity
            style={[styles.shinyToggle, isShiny && styles.shinyToggleActive]}
            onPress={() => setIsShiny(!isShiny)}
            activeOpacity={0.8}
          >
            <Text style={styles.shinyToggleText}>✨</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottomHalf}>
        <Text style={styles.name}>{pokemon.name.replace("-", " ")}</Text>

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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: { flex: 1, backgroundColor: "#1E1E1E" },

  topHalf: {
    height: "42%",
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    alignItems: "center",
    paddingTop: 50,
    zIndex: 2,
    elevation: 8,
    overflow: "hidden",
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
  artwork: { width: 220, height: 220, marginTop: 40, zIndex: 5 },

  // --- NEW SHINY TOGGLE BUTTON STYLES ---
  shinyToggle: {
    position: "absolute",
    right: 24,
    bottom: 24,
    backgroundColor: "rgba(0,0,0,0.15)",
    padding: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    zIndex: 10,
  },
  shinyToggleActive: {
    backgroundColor: "#FFD700", // Gold background when active
    borderColor: "#FFF",
    elevation: 5,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  shinyToggleText: { fontSize: 22 },

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

  movesListContainer: { flexDirection: "column", gap: 12, marginTop: 10 },
  moveListCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#444",
  },
  moveIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#555",
  },
  moveIconText: { color: "#888", fontSize: 16 },
  moveInfo: { flex: 1, justifyContent: "center" },
  moveName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "capitalize",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  moveMethod: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },

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
