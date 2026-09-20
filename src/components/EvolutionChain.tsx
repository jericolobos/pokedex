import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { usePokemonFetch } from "../hooks/usePokemonFetch";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EvolutionChain({ url }: { url: string }) {
  // 1. DATA FETCHING
  // Fetches the specific evolution chain URL provided by the species data
  const { data, isLoading, error } = usePokemonFetch(url);

  // --- EARLY RETURN: Loading State ---
  if (isLoading) {
    return <ActivityIndicator size="small" color="#fff" />;
  }

  // --- EARLY RETURN: Error State ---
  if (error || !data || !data.chain) {
    return <Text style={styles.text}>Failed to load evolution data.</Text>;
  }

  // ============================================================================
  // 2. DATA PROCESSING (Recursive Tree Traversal)
  // ============================================================================

  // PokéAPI returns evolution data as a nested tree (chain -> evolves_to -> evolves_to).
  // We use a recursive function to dive through those layers and flatten it into a simple array.
  const allNames: string[] = [];
  const traverseChain = (node: any) => {
    allNames.push(node.species.name);
    node.evolves_to.forEach(traverseChain); // Recursively check for next evolutions
  };
  traverseChain(data.chain);

  // ============================================================================
  // 3. RENDER UI
  // ============================================================================

  // Gracefully handle Pokémon that do not evolve (which applies to most Legendaries)
  if (allNames.length === 1) {
    return <Text style={styles.text}>Does not evolve</Text>;
  }

  // Display the flattened evolution chain as a series of stylized badges
  return (
    <View style={styles.chainContainer}>
      {allNames.map((name) => (
        <View key={name} style={styles.stageBadge}>
          <Text style={styles.stageText}>{name.replace("-", " ")}</Text>
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// 4. STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Used for Error or "Does not evolve" messages
  text: {
    fontSize: 15,
    color: "#888",
    fontStyle: "italic",
    marginBottom: 40,
    textAlign: "center",
  },

  // Container holding the evolution badges
  chainContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 40,
  },

  // Individual Pokémon stage pill
  stageBadge: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
  },

  // Text inside the pill
  stageText: {
    color: "#fff",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
});
