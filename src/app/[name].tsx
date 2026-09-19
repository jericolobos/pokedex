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
import { useLocalSearchParams, Stack } from "expo-router";
import { usePokemonFetch } from "../hooks/usePokemonFetch";
import EvolutionChain from "../components/EvolutionChain";

// Dynamic colors mapping based on primary type
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

export default function PokemonDetail() {
  const { name } = useLocalSearchParams();
  const pokemonName = name as string;
  const [activeTab, setActiveTab] = useState("About");

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
    `https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`,
  );

  const isLoading = isPokemonLoading || isSpeciesLoading;
  const error = pokemonError || speciesError;

  const primaryType = pokemon?.types?.[0]?.type?.name || "default";
  const bgColor = TYPE_COLORS[primaryType] || TYPE_COLORS.default;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error || !pokemon) {
    return (
      <View style={[styles.center, { backgroundColor: bgColor }]}>
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
  const abilities =
    pokemon.abilities?.map((a: any) => a.ability.name).join(", ") || "Unknown";
  const genus =
    species?.genera?.find((g: any) => g.language.name === "en")?.genus ||
    "Pokémon";
  const englishLore =
    species?.flavor_text_entries
      ?.find((entry: any) => entry.language.name === "en")
      ?.flavor_text?.replace(/\n|\f/g, " ") || "No lore available.";

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen
        options={{
          title: "",
          headerStyle: { backgroundColor: bgColor },
          headerTintColor: "#fff",
          headerShadowVisible: false,
        }}
      />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{pokemon.name}</Text>
          <Text style={styles.idText}>{formattedId}</Text>
        </View>
        <View style={styles.typeContainer}>
          {pokemon.types?.map((t: any) => (
            <View key={t.type.name} style={styles.typeBadge}>
              <Text style={styles.typeText}>{t.type.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Overlapping Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri:
              pokemon.sprites?.other?.["official-artwork"]?.front_default ||
              pokemon.sprites?.front_default,
          }}
          style={styles.artwork}
        />
      </View>

      {/* White Bottom Sheet */}
      <View style={styles.sheet}>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {["About", "Base Stats", "Evolution"].map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
              {activeTab === tab && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetContent}
        >
          {/* ABOUT TAB */}
          {activeTab === "About" && (
            <View>
              <Text style={styles.loreText}>{englishLore}</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Species</Text>
                <Text style={styles.infoValue}>{genus}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Height</Text>
                <Text style={styles.infoValue}>{heightInMeters} m</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Weight</Text>
                <Text style={styles.infoValue}>{weightInKg} kg</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Abilities</Text>
                <Text
                  style={[styles.infoValue, { textTransform: "capitalize" }]}
                >
                  {abilities}
                </Text>
              </View>
            </View>
          )}

          {/* BASE STATS TAB */}
          {activeTab === "Base Stats" && (
            <View>
              {pokemon.stats?.map((s: any) => {
                const statPercent = Math.min(
                  100,
                  Math.round((s.base_stat / 255) * 100),
                );
                const barColor = s.base_stat >= 50 ? "#48D0B0" : "#FB6C6C";
                let statName = s.stat.name;
                if (statName === "special-attack") statName = "Sp. Atk";
                if (statName === "special-defense") statName = "Sp. Def";

                return (
                  <View key={s.stat.name} style={styles.statRow}>
                    <Text style={styles.statLabel}>{statName}</Text>
                    <Text style={styles.statNumber}>{s.base_stat}</Text>
                    <View style={styles.statBarBg}>
                      <View
                        style={[
                          styles.statBarFill,
                          {
                            width: `${statPercent}%`,
                            backgroundColor: barColor,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* EVOLUTION TAB */}
          {activeTab === "Evolution" && (
            <View>
              {species?.evolution_chain?.url ? (
                <EvolutionChain url={species.evolution_chain.url} />
              ) : (
                <ActivityIndicator size="small" color={bgColor} />
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
    zIndex: 2,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    textTransform: "capitalize",
  },
  idText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  typeContainer: { flexDirection: "row", gap: 8, marginTop: 10 },
  typeBadge: {
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
    textTransform: "capitalize",
  },
  imageContainer: {
    position: "absolute",
    top: 120,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
    elevation: 10,
  },
  artwork: { width: 220, height: 220 },
  sheet: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: 180,
    paddingTop: 50,
    paddingHorizontal: 24,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tabText: {
    fontSize: 15,
    color: "#999",
    fontWeight: "600",
    paddingBottom: 12,
  },
  activeTabText: { color: "#333", fontWeight: "bold" },
  activeTabIndicator: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#6C79DB",
    borderRadius: 2,
  },
  sheetContent: { paddingBottom: 40 },
  infoRow: { flexDirection: "row", marginBottom: 16 },
  infoLabel: { width: 100, fontSize: 15, color: "#999", fontWeight: "500" },
  infoValue: { flex: 1, fontSize: 15, color: "#333", fontWeight: "600" },
  loreText: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginBottom: 24,
    fontStyle: "italic",
  },
  statRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  statLabel: {
    width: 70,
    fontSize: 14,
    color: "#999",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  statNumber: { width: 35, fontSize: 15, color: "#333", fontWeight: "bold" },
  statBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 2,
    marginLeft: 10,
  },
  statBarFill: { height: "100%", borderRadius: 2 },
  errorText: {
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
